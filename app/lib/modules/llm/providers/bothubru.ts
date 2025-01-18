import { BaseProvider, getOpenAILikeModel } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';

export default class BothubRuProvider extends BaseProvider {
  name = 'BothubRu';
  getApiKeyLink = undefined;

  config = {
    baseUrlKey: 'BOTHUB_RU_API_BASE_URL',
    baseModelListUrlKey: 'BOTHUB_RU_API_MODEL_LIST_URL',
    apiTokenKey: 'BOTHUB_RU_API_KEY',
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
      defaultBaseUrlKey: 'BOTHUB_RU_API_BASE_URL',
      defaultApiTokenKey: 'BOTHUB_RU_API_KEY',
    });

    if (!baseUrl || !apiKey) {
      return [];
    }

    const response = await fetch(`https://bothub.chat/api/v2/model/list?children=1 `, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const res = (await response.json()) as any;

    //console.log(res);
    return res.map((model: any) => ({
      name: model.id,
      label: model.id,
      provider: this.name,
      maxTokenAllowed: model.max_tokens,
    }));
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
      defaultBaseUrlKey: 'BOTHUB_RU_API_BASE_URL',
      defaultApiTokenKey: 'BOTHUB_RU_API_KEY',
    });

    if (!baseUrl || !apiKey) {
      throw new Error(`Missing configuration for ${this.name} provider`);
    }

    return getOpenAILikeModel(baseUrl, apiKey, model);
  }
}
