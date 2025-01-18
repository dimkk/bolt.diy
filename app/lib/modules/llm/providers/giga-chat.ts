import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1, LanguageModelV1CallOptions, LanguageModelV1StreamPart } from 'ai';

// Добавляем интерфейс для кешированного токена
interface CachedToken {
  access_token: string;
  expires_at: number;
}

// Добавляем кеш токена на уровне модуля
let cachedToken: CachedToken | null = null;

export default class SberGigaChatProvider extends BaseProvider {
  name = 'SberGigaChat';
  getApiKeyLink = undefined;

  config = {
    baseUrlKey: 'GIGACHAT_API_URL',
    apiTokenKey: 'GIGACHAT_API_KEY',
  };

  staticModels: ModelInfo[] = [];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv,
      defaultBaseUrlKey: 'GIGACHAT_API_URL',
      defaultApiTokenKey: 'GIGACHAT_API_KEY',
    });

    if (!baseUrl || !apiKey) {
      return [];
    }

    try {
      const authResponse = await fetch('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          Authorization: `Basic ${apiKey}`,
          RqUID: crypto.randomUUID(),
        },
        body: 'scope=GIGACHAT_API_PERS',
      });

      if (!authResponse.ok) {
        throw new Error(`Failed to get auth token: ${authResponse.statusText}`);
      }

      const authData = (await authResponse.json()) as {
        access_token: string;
        expires_at: number;
      };

      const response = await fetch(`${baseUrl}/models`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${authData.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const res = (await response.json()) as any;

      return (res.data || []).map((model: { id: string }) => ({
        name: model.id,
        label: model.id,
        provider: this.name,
        maxTokenAllowed: 8000,
      }));
    } catch (error) {
      console.error('Error fetching GigaChat models:', error);
      return [];
    }
  }

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: 'GIGACHAT_API_URL',
      defaultApiTokenKey: 'GIGACHAT_API_KEY',
    });

    if (!baseUrl || !apiKey) {
      throw new Error(`Missing configuration for ${this.name} provider`);
    }

    return getGigaChatModel(baseUrl, apiKey, model) as any;
  }
}

async function getAuthToken(apiKey: string) {
  // Проверяем есть ли валидный токен в кеше
  const now = Math.floor(Date.now() / 1000); // текущее время в секундах

  if (cachedToken && cachedToken.expires_at > now + 60) {
    // 60 секунд запас
    return cachedToken;
  }

  const authResponse = await fetch('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      Authorization: `Basic ${apiKey}`,
      RqUID: crypto.randomUUID(),
    },
    body: 'scope=GIGACHAT_API_PERS',
  });

  if (!authResponse.ok) {
    throw new Error(`Failed to get auth token: ${authResponse.statusText}`);
  }

  const token = (await authResponse.json()) as CachedToken;

  // Сохраняем токен в кеш
  cachedToken = token;

  return token;
}

function convertMessages(options: LanguageModelV1CallOptions) {
  return options.prompt.map((msg) => {
    if (msg.role === 'user') {
      return {
        role: msg.role,
        content: msg.content
          .map((part) => {
            if (part.type === 'text') {
              return part.text;
            }

            return '';
          })
          .join(''),
      };
    }

    return {
      role: msg.role,
      content:
        typeof msg.content === 'string'
          ? msg.content
          : Array.isArray(msg.content)
            ? msg.content.map((p) => ('text' in p ? p.text : '')).join('')
            : '',
    };
  });
}

function getGigaChatModel(baseUrl: string, apiKey: string, model: string): LanguageModelV1 {
  return {
    specificationVersion: 'v1',
    provider: 'SberGigaChat',
    modelId: model,
    defaultObjectGenerationMode: 'json',
    supportsImageUrls: false,
    supportsStructuredOutputs: true,

    async doGenerate(options: LanguageModelV1CallOptions) {
      const authData = await getAuthToken(apiKey);
      const messages = convertMessages(options);

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authData.access_token}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          stream: false,
          top_p: options.topP,
          repetition_penalty: options.presencePenalty,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate completion: ${response.statusText}`);
      }

      const result = (await response.json()) as {
        choices: Array<{
          message: { role: string; content: string };
          finish_reason: string;
        }>;
        usage: {
          prompt_tokens: number;
          completion_tokens: number;
        };
      };

      const choice = result.choices[0];

      return {
        text: choice.message.content,
        finishReason: mapFinishReason(choice.finish_reason),
        usage: {
          promptTokens: result.usage.prompt_tokens,
          completionTokens: result.usage.completion_tokens,
        },
        rawCall: {
          rawPrompt: messages,
          rawSettings: {
            temperature: options.temperature,
            max_tokens: options.maxTokens,
            top_p: options.topP,
            repetition_penalty: options.presencePenalty,
          },
        },
      };
    },

    async doStream(options: LanguageModelV1CallOptions) {
      const authData = await getAuthToken(apiKey);
      const messages = convertMessages(options);

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authData.access_token}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          stream: true,
          top_p: options.topP,
          repetition_penalty: options.presencePenalty,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate completion stream: ${response.statusText}`);
      }

      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body!.getReader();
          let promptTokens = 0;
          let completionTokens = 0;

          try {
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                break;
              }

              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split('\n').filter((line) => line.trim() !== '');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);

                  if (data === '[DONE]') {
                    controller.enqueue({
                      type: 'finish',
                      finishReason: 'stop',
                      usage: {
                        promptTokens,
                        completionTokens,
                      },
                    } as LanguageModelV1StreamPart);
                    break;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    const choice = parsed.choices[0];

                    if (choice.delta?.content) {
                      controller.enqueue({
                        type: 'text-delta',
                        textDelta: choice.delta.content,
                      } as LanguageModelV1StreamPart);
                    }

                    if (parsed.usage) {
                      promptTokens = parsed.usage.prompt_tokens;
                      completionTokens = parsed.usage.completion_tokens;
                    }
                  } catch (e) {
                    console.error('Failed to parse chunk:', e);
                  }
                }
              }
            }
          } catch (error) {
            controller.enqueue({
              type: 'error',
              error,
            } as LanguageModelV1StreamPart);
          } finally {
            controller.close();
          }
        },
      });

      return {
        stream,
        rawCall: {
          rawPrompt: messages,
          rawSettings: {
            temperature: options.temperature,
            max_tokens: options.maxTokens,
            top_p: options.topP,
            repetition_penalty: options.presencePenalty,
            stream: true,
          },
        },
      };
    },
  };
}

function mapFinishReason(reason: string): any {
  switch (reason) {
    case 'stop':
      return 'stop';
    case 'length':
      return 'length';
    case 'content-filter':
      return 'content-filter';
    case 'function_call':
      return 'tool-calls';
    case 'error':
      return 'error';
    default:
      return 'unknown';
  }
}
