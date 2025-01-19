# Архитектура проекта

## Оглавление
1. [Обзор проекта](#обзор-проекта)
2. [Структура директорий](#структура-директорий)
   - [Корневая структура](#корневая-структура)
   - [app директория](#app-директория)
   - [public директория](#public-директория)
3. [Ключевые компоненты](#ключевые-компоненты)
   - [Модули](#модули)
   - [Хранилища (Stores)](#хранилища-stores)
   - [Утилиты](#утилиты)
4. [Архитектурные решения](#архитектурные-решения)
   - [Фронтенд](#фронтенд)
   - [Провайдеры LLM](#провайдеры-llm)
   - [Стейт менеджмент](#стейт-менеджмент)
   - [Обработка LLM запросов](#обработка-llm-запросов)
   - [Web контейнеры](#web-контейнеры)
5. [Технологический стек](#технологический-стек)
   - [Основные технологии](#основные-технологии)
   - [Инструменты разработки](#инструменты-разработки)
6. [Паттерны и лучшие практики](#паттерны-и-лучшие-практики)
   - [Структура компонентов](#структура-компонентов)
   - [Обработка ошибок](#обработка-ошибок)
   - [Типизация](#типизация)
7. [Процесс разработки](#процесс-разработки)
   - [Рабочий процесс](#рабочий-процесс)
   - [Тестирование](#тестирование)
   - [Деплой](#деплой)

## Обзор проекта

Проект представляет собой веб-приложение, построенное на базе Remix.js, предназначенное для взаимодействия с различными LLM (Language Model) провайдерами. Приложение позволяет пользователям общаться с различными языковыми моделями через единый интерфейс.

### Основные возможности
- Поддержка множества LLM провайдеров (OpenAI, GigaChat и др.)
- Унифицированный интерфейс для работы с разными моделями
- Система кэширования и управления токенами
- Поддержка потокового режима общения с моделями
- Темная и светлая темы оформления

### Архитектурные принципы
- **Модульность**: каждый провайдер LLM реализован как отдельный модуль
- **Функциональный подход**: предпочтение отдается функциональному стилю программирования
- **Типизация**: строгая типизация с использованием TypeScript
- **Изоляция состояния**: использование nano stores для управления состоянием
- **Расширяемость**: легкое добавление новых провайдеров через систему плагинов

### Ключевые технические решения
- Remix.js как основной фреймворк
- TypeScript для типизации
- Nano Stores для управления состоянием
- UnoCSS для стилизации
- Cloudflare для деплоя и хостинга

## Структура директорий

### Корневая структура
```
/
├── app/                # Основной код приложения
├── public/            # Статические файлы
├── styles/            # Глобальные стили
├── tests/             # Тесты
├── types/             # Глобальные типы TypeScript
└── package.json       # Зависимости и скрипты
```

### app директория
```
app/
├── components/        # Переиспользуемые компоненты
├── lib/              # Основная логика приложения
│   ├── modules/      # Модули функциональности
│   │   ├── llm/      # Модули для работы с LLM
│   │   └── ...
│   ├── stores/       # Хранилища состояния
│   └── utils/        # Утилиты
├── routes/           # Маршруты приложения (Remix)
├── styles/           # Стили компонентов
└── root.tsx          # Корневой компонент приложения
```

### lib/modules/llm структура
```
lib/modules/llm/
├── providers/        # Провайдеры LLM моделей
│   ├── giga-chat.ts
│   ├── openai.ts
│   └── ...
├── base-provider.ts  # Базовый класс для провайдеров
├── types.ts         # Типы для LLM модулей
└── utils.ts         # Утилиты для работы с LLM
```

### Ключевые файлы
- `root.tsx` - Корневой компонент, определяет базовую структуру приложения
- `base-provider.ts` - Абстрактный класс для всех LLM провайдеров
- `stores/*.ts` - Файлы с определением глобального состояния
- `routes/*` - Файлы маршрутизации Remix

### Особенности организации
- Модульная структура с четким разделением ответственности
- Группировка связанного кода в директории по функциональности
- Изоляция провайдеров LLM в отдельных файлах
- Централизованное управление состоянием через stores
- Переиспользуемые компоненты в отдельной директории

## Ключевые компоненты

### Модули
Модули представляют собой изолированные блоки функциональности, каждый из которых отвечает за определенный аспект приложения.

#### LLM Модуль
Центральный модуль для работы с языковыми моделями.

```typescript
// Базовый класс для всех провайдеров
abstract class BaseProvider {
  abstract name: string;
  abstract getApiKeyLink: string | undefined;
  abstract config: {
    baseUrlKey: string;
    apiTokenKey: string;
  };
  abstract getDynamicModels(): Promise<ModelInfo[]>;
  abstract getModelInstance(options: ModelOptions): LanguageModelV1;
}
```

Особенности:
- Единый интерфейс для всех провайдеров
- Поддержка динамического получения списка моделей
- Система кеширования токенов
- Обработка потоковых ответов

### Хранилища (Stores)
Управление состоянием приложения через nano stores.

```typescript
// Пример store для управления темой
export const themeStore = atom<'light' | 'dark'>('light');

// Store для системных логов
export const logStore = {
  logSystem: (message: string, data?: any) => {
    // логика логирования
  }
};
```

Основные stores:
- `themeStore` - управление темой приложения
- `logStore` - система логирования
- `settingsStore` - пользовательские настройки
- `modelStore` - состояние моделей и провайдеров

### Утилиты
Набор переиспользуемых функций и хелперов.

```typescript
// Пример утилиты для работы с токенами
async function getAuthToken(apiKey: string) {
  // логика получения и кеширования токена
}

// Утилита для форматирования сообщений
function convertMessages(options: LanguageModelV1CallOptions) {
  // конвертация сообщений в нужный формат
}
```

Категории утилит:
- Работа с API и токенами
- Форматирование данных
- Обработка ошибок
- Типы и интерфейсы
- Вспомогательные функции для компонентов

## Архитектурные решения

### Фронтенд
Приложение построено на Remix.js, что обеспечивает следующие преимущества:

1. **Серверный рендеринг (SSR)**
   - Улучшенная производительность первой загрузки
   - SEO-friendly структура
   - Гидратация на клиенте

2. **Роутинг и структура файлов**
   ```
   routes/
   ├── _index.tsx         # Главная страница
   ├── chat.tsx           # Страница чата
   └── settings.tsx       # Настройки
   ```

3. **Управление состоянием**
   - Использование nano stores вместо глобального контекста
   - Атомарное обновление состояния
   - Реактивность на уровне компонентов

### Провайдеры LLM

1. **Абстракция провайдеров**
   ```typescript
   interface ProviderV1 {
     languageModel(modelId: string): LanguageModelV1;
     textEmbeddingModel(modelId: string): EmbeddingModelV1<string>;
   }
   ```

2. **Система плагинов**
   - Каждый провайдер - отдельный плагин
   - Единый интерфейс взаимодействия
   - Изолированная конфигурация

3. **Обработка запросов**
   ```typescript
   interface LanguageModelV1 {
     doGenerate(options: LanguageModelV1CallOptions): Promise<...>;
     doStream(options: LanguageModelV1CallOptions): Promise<...>;
   }
   ```

4. **Кеширование**
   - Кеширование токенов авторизации
   - Оптимизация запросов к API
   - Управление временем жизни кеша

### Стейт менеджмент

1. **Структура stores**
   ```typescript
   // Атомарные store
   const themeStore = atom<'light' | 'dark'>('light');
   const settingsStore = atom<Settings>({...});

   // Вычисляемые store
   const isDarkMode = computed(themeStore, theme => theme === 'dark');
   ```

2. **Изоляция состояния**
   - Каждый store отвечает за конкретную функциональность
   - Минимальные зависимости между stores
   - Предсказуемые обновления

3. **Подписки и эффекты**
   ```typescript
   // Пример эффекта для сохранения настроек
   effect(() => {
     localStorage.setItem('settings', JSON.stringify(settingsStore.get()));
   });
   ```

4. **Интеграция с React**
   - Хуки для работы со store
   - Автоматическая подписка на изменения
   - Оптимизация ререндеров

### Особенности реализации

1. **Функциональный подход**
   - Чистые функции
   - Иммутабельность данных
   - Композиция функций

2. **Обработка ошибок**
   - Централизованная обработка
   - Типизированные ошибки
   - Информативные сообщения

3. **Масштабируемость**
   - Модульная архитектура
   - Слабая связанность компонентов
   - Простота добавления новых провайдеров

### Обработка LLM запросов

1. **Жизненный цикл запроса**
   ```mermaid
   sequenceDiagram
      User->>+UI: Отправка промпта
      UI->>+Store: Обновление состояния
      Store->>+Provider: Запрос к провайдеру
      Provider->>+Auth: Получение токена
      Auth-->>-Provider: Токен (из кеша/новый)
      Provider->>+LLM API: Запрос к API
      LLM API-->>-Provider: Стрим ответа
      Provider-->>-Store: Обновление состояния
      Store-->>-UI: Обновление интерфейса
      UI-->>-User: Отображение результата
   ```

   **Компоненты и файлы:**
   ```
   app/
   ├── components/
   │   ├── Chat/
   │   │   ├── ChatInput.tsx      # Компонент ввода промпта
   │   │   ├── ChatMessages.tsx   # Отображение сообщений
   │   │   └── ChatContainer.tsx  # Основной контейнер чата
   ├── lib/
   │   ├── modules/
   │   │   └── llm/
   │   │       ├── providers/     # Провайдеры для разных LLM
   │   │       └── base-provider.ts
   │   └── stores/
   │       ├── chat.ts           # Стор для состояния чата
   │       └── messages.ts       # Стор для сообщений
   ```

2. **Этапы обработки запроса**

   a. **Отправка промпта (UI -> Store)**
   ```typescript
   // ChatInput.tsx
   function ChatInput() {
     const sendMessage = useCallback(async (content: string) => {
       chatStore.sendMessage({
         role: 'user',
         content,
         timestamp: new Date(),
       });
     }, []);
   }
   ```

   b. **Обработка в сторе**
   ```typescript
   // stores/chat.ts
   export const chatStore = {
     messages: atom<Message[]>([]),
     status: atom<ChatStatus>('idle'),
     
     async sendMessage(message: Message) {
       this.messages.set([...this.messages.get(), message]);
       this.status.set('loading');
       
       const provider = await getProvider(currentProvider.get());
       await this.processResponse(provider, message);
     }
   };
   ```

   c. **Работа с провайдером**
   ```typescript
   // lib/modules/llm/base-provider.ts
   abstract class BaseProvider {
     async getModelInstance(options: ModelOptions): Promise<LanguageModelV1> {
       const token = await this.getAuthToken();
       return this.createModel(token, options);
     }
     
     protected abstract createModel(
       token: string, 
       options: ModelOptions
     ): LanguageModelV1;
   }
   ```

   d. **Получение и кеширование токена**
   ```typescript
   // lib/modules/llm/providers/giga-chat.ts
   let cachedToken: CachedToken | null = null;

   async function getAuthToken(apiKey: string) {
     if (isValidToken(cachedToken)) {
       return cachedToken;
     }
     
     const token = await fetchNewToken(apiKey);
     cachedToken = token;
     return token;
   }
   ```

   e. **Стриминг ответа**
   ```typescript
   // lib/modules/llm/stream-handler.ts
   export function handleModelStream(
     stream: ReadableStream,
     callbacks: StreamCallbacks
   ) {
     const reader = stream.getReader();
     const decoder = new TextDecoder();
     
     async function processStream() {
       while (true) {
         const { done, value } = await reader.read();
         if (done) break;
         
         const chunk = decoder.decode(value);
         callbacks.onChunk(chunk);
       }
       callbacks.onComplete();
     }
     
     return processStream();
   }
   ```

3. **Управление состоянием запроса**
   ```typescript
   // stores/chat.ts
   interface ChatState {
     messages: Message[];
     status: 'idle' | 'loading' | 'streaming' | 'error';
     currentProvider: string;
     streamController?: AbortController;
   }

   export const chatStore = {
     // ... существующий код ...
     
     async processResponse(provider: BaseProvider, message: Message) {
       const controller = new AbortController();
       this.streamController.set(controller);
       
       try {
         const stream = await provider.getStream(message, {
           signal: controller.signal
         });
         
         await handleModelStream(stream, {
           onChunk: this.handleChunk.bind(this),
           onComplete: this.handleComplete.bind(this),
           onError: this.handleError.bind(this),
         });
       } catch (error) {
         this.handleError(error);
       }
     },
     
     handleChunk(chunk: string) {
       const messages = this.messages.get();
       const lastMessage = messages[messages.length - 1];
       
       if (lastMessage.role === 'assistant') {
         lastMessage.content += chunk;
         this.messages.set([...messages.slice(0, -1), lastMessage]);
       } else {
         this.messages.set([...messages, {
           role: 'assistant',
           content: chunk,
           timestamp: new Date(),
         }]);
       }
     }
   };
   ```

4. **Обработка ошибок и отмена запросов**
   ```typescript
   // components/Chat/ChatContainer.tsx
   function ChatContainer() {
     useEffect(() => {
       return () => {
         // Отмена стрима при размонтировании
         chatStore.streamController.get()?.abort();
       };
     }, []);
     
     const handleError = useCallback((error: Error) => {
       chatStore.status.set('error');
       chatStore.messages.set([
         ...chatStore.messages.get(),
         {
           role: 'system',
           content: `Error: ${error.message}`,
           timestamp: new Date(),
         }
       ]);
     }, []);
   }
   ```

5. **Преобразование промптов и ответов**

   a. **Структура системного промпта**
   ```typescript
	// app/lib/modules/llm/prompts/system-prompt.ts
   const systemPrompt = {
     role: 'system',
     content: `You are an intelligent programmer, powered by Claude 3.5 Sonnet. 
     You will help answer any questions that the user has (usually about coding).
     
     1. Format your response in markdown.
     2. When suggesting edits to code, provide one or more code blocks for each file.
     3. If creating a new file, write the full contents.
     4. Always format code blocks with language and path: \`\`\`language:path/to/file`
   };
   ```

   b. **Преобразование пользовательского ввода**
   ```typescript
   // lib/modules/llm/prompt-formatter.ts
   function formatUserPrompt(input: string, context: CodeContext) {
     return {
       role: 'user',
       content: [
         {
           type: 'text',
           text: `${context.fileContent ? '<open_file>\n' : ''}${input}`
         },
         ...(context.fileContent ? [{
           type: 'text',
           text: `\`\`\`${context.language}:${context.filePath}\n${context.fileContent}\n\`\`\``
         }] : [])
       ]
     };
   }
   ```

   c. **Парсинг ответа модели**
   ```typescript
   // app/lib/modules/llm/utils/response-parser.ts
   interface ParsedResponse {
     explanation: string;
     files: Array<{
       path: string;
       content: string;
       language: string;
       edits?: Array<{
         from: number;
         to: number;
         content: string;
       }>;
     }>;
   }

   function parseModelResponse(markdown: string): ParsedResponse {
     // Извлечение блоков кода и их метаданных
     const codeBlocks = extractCodeBlocks(markdown);
     
     // Разделение на объяснение и файлы
     const explanation = markdown.replace(/```[\s\S]*?```/g, '');
     
     return {
       explanation,
       files: codeBlocks.map(block => ({
         path: block.path,
         content: block.content,
         language: block.language,
         edits: detectEdits(block.content)
       }))
     };
   }
   ```

   d. **Создание веб-контейнеров**
   ```typescript
   // app/lib/modules/llm/utils/response-handler.ts
   function createContainersFromResponse(
     response: ParsedResponse
   ): WebContainer[] {
     const containers: WebContainer[] = [];

     // Контейнер с объяснением
     if (response.explanation.trim()) {
       containers.push({
         id: generateId(),
         type: 'markdown',
         content: response.explanation,
         metadata: {
           timestamp: new Date()
         }
       });
     }

     // Контейнеры для кода
     response.files.forEach(file => {
       containers.push({
         id: generateId(),
         type: 'code',
         content: file.content,
         metadata: {
           language: file.language,
           title: file.path,
           timestamp: new Date()
         },
         actions: [
           {
             id: 'apply',
             label: 'Apply Changes',
             handler: async () => {
               if (file.edits) {
                 await applyEdits(file.path, file.edits);
               } else {
                 await createNewFile(file.path, file.content);
               }
             }
           }
         ]
       });
     });

     return containers;
   }
   ```

   e. **Жизненный цикл преобразования**
   ```mermaid
   graph TD
     A[User Input] --> B[Format Prompt]
     B --> C[LLM API]
     C --> D[Parse Response]
     D --> E[Extract Code Blocks]
     D --> F[Extract Explanation]
     E --> G[Create Code Containers]
     F --> H[Create Markdown Container]
     G --> I[Web Interface]
     H --> I
   ```

   f. **Пример полного цикла**
   ```typescript
   async function processUserInput(input: string, context: CodeContext) {
     // 1. Форматирование промпта
     const prompt = formatUserPrompt(input, context);
     
     // 2. Получение ответа от модели
     const response = await llmProvider.generate({
       messages: [systemPrompt, prompt]
     });
     
     // 3. Парсинг ответа
     const parsed = parseModelResponse(response.text);
     
     // 4. Создание контейнеров
     const containers = createContainersFromResponse(parsed);
     
     // 5. Добавление контейнеров в UI
     containerManager.addContainers(containers);
   }
   ```

### Web контейнеры

1. **Архитектура контейнеров**
   ```typescript
   interface WebContainer {
     id: string;
     type: 'markdown' | 'code' | 'terminal' | 'image';
     content: string;
     metadata: {
       language?: string;
       title?: string;
       timestamp: Date;
     };
     actions: WebContainerAction[];
   }
   ```

2. **Типы контейнеров**
   - **Markdown**: Форматированный текст с поддержкой GFM
   - **Code**: Редактируемые блоки кода с подсветкой синтаксиса
   - **Terminal**: Интерактивный терминал для выполнения команд
   - **Image**: Контейнер для изображений и визуализаций

3. **Система плагинов контейнеров**
   ```typescript
   interface WebContainerPlugin {
     type: string;
     render: (container: WebContainer) => React.ReactNode;
     actions?: WebContainerAction[];
     handlers?: Record<string, ActionHandler>;
   }
   ```

4. **Взаимодействие между контейнерами**
   ```typescript
   // Пример системы сообщений
   interface ContainerMessage {
     type: 'update' | 'execute' | 'result';
     source: string;
     target: string;
     payload: unknown;
   }

   // Менеджер контейнеров
   class ContainerManager {
     containers: Map<string, WebContainer>;
     
     broadcast(message: ContainerMessage) {
       // Отправка сообщения всем контейнерам
     }
     
     connect(source: string, target: string) {
       // Установка связи между контейнерами
     }
   }
   ```

5. **Жизненный цикл контейнера**
   ```typescript
   interface ContainerLifecycle {
     onCreate(): void;
     onMount(): void;
     onUpdate(prevContent: string): void;
     onDestroy(): void;
     onAction(action: WebContainerAction): void;
   }
   ```

6. **Пример использования**
   ```typescript
   // Создание нового контейнера
   const container = createContainer({
     type: 'code',
     content: 'console.log("Hello");',
     metadata: {
       language: 'typescript',
       title: 'Example',
     },
     actions: [
       {
         id: 'run',
         label: 'Run Code',
         handler: async (content) => {
           // Выполнение кода
           const result = await executeCode(content);
           return result;
         },
       },
     ],
   });
   ```

## Технологический стек

### Основные технологии

1. **Фреймворк и рантайм**
   - [Remix.js](https://remix.run/) - основной фреймворк
   - [Cloudflare Workers](https://workers.cloudflare.com/) - среда выполнения
   - [TypeScript](https://www.typescriptlang.org/) - язык программирования

2. **UI и стилизация**
   - [React](https://reactjs.org/) - библиотека UI
   - [UnoCSS](https://unocss.dev/) - атомарный CSS фреймворк
   - [SCSS](https://sass-lang.com/) - препроцессор CSS
   ```typescript
   // Пример конфигурации UnoCSS
   export default defineConfig({
     presets: [
       presetUno(),
       presetAttributify(),
       presetIcons(),
     ],
     theme: {
       colors: {
         primary: {...},
         secondary: {...}
       }
     }
   });
   ```

3. **Управление состоянием**
   - [Nano Stores](https://github.com/nanostores/nanostores) - менеджер состояния
   ```typescript
   // Пример использования
   import { atom, computed } from 'nanostores';
   import { useStore } from '@nanostores/react';

   const counter = atom(0);
   const doubled = computed(counter, count => count * 2);
   ```

4. **Работа с API**
   - [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) - нативный HTTP клиент
   - WebSocket для real-time коммуникации
   - Server-Sent Events для стриминга

### Инструменты разработки

1. **Сборка и развертывание**
   - [Vite](https://vitejs.dev/) - сборщик и dev-сервер
   - [Wrangler](https://developers.cloudflare.com/workers/wrangler/) - CLI для Cloudflare
   ```bash
   # Пример команд развертывания
   npm run build
   wrangler deploy
   ```

2. **Тестирование**
   - [Vitest](https://vitest.dev/) - фреймворк тестирования
   - [Testing Library](https://testing-library.com/) - утилиты тестирования React
   ```typescript
   // Пример теста
   test('theme switcher works', () => {
     const { result } = renderHook(() => useStore(themeStore));
     expect(result.current).toBe('light');
   });
   ```

3. **Линтинг и форматирование**
   - [ESLint](https://eslint.org/) - линтер
   - [Prettier](https://prettier.io/) - форматирование кода
   ```json
   // .prettierrc
   {
     "singleQuote": true,
     "trailingComma": "all",
     "printWidth": 100
   }
   ```

4. **IDE и расширения**
   - VS Code как основная IDE
   - Рекомендуемые расширения:
     - ESLint
     - Prettier
     - TypeScript Vue Plugin
     - UnoCSS

### Зависимости и версионирование

1. **Управление пакетами**
   - [pnpm](https://pnpm.io/) - менеджер пакетов
   - Строгое версионирование зависимостей
   ```json
   // package.json
   {
     "dependencies": {
       "remix": "^2.0.0",
       "nanostores": "^0.9.0",
       "unocss": "^0.53.0"
     }
   }
   ```

2. **Типы и интерфейсы**
   - Собственные типы для бизнес-логики
   - Типы из @types/* пакетов
   - Генерируемые типы из API

## Паттерны и лучшие практики

### Структура компонентов

1. **Функциональные компоненты**
   ```typescript
   // Пример структуры компонента
   interface ChatMessageProps {
     message: string;
     timestamp: Date;
     type: 'user' | 'assistant';
   }

   function ChatMessage({ message, timestamp, type }: ChatMessageProps) {
     return (
       <div className={`message ${type}`}>
         <p>{message}</p>
         <time>{timestamp.toLocaleString()}</time>
       </div>
     );
   }
   ```

2. **Композиция компонентов**
   - Предпочтение композиции над наследованием
   - Разделение на презентационные и контейнерные компоненты
   - Использование кастомных хуков для логики

3. **Управление побочными эффектами**
   ```typescript
   function useChatHistory() {
     const [messages, setMessages] = useState<Message[]>([]);
     
     useEffect(() => {
       // Загрузка истории при монтировании
       loadHistory().then(setMessages);
       
       // Очистка при размонтировании
       return () => {
         saveHistory(messages);
       };
     }, []);
     
     return messages;
   }
   ```

### Обработка ошибок

1. **Типизированные ошибки**
   ```typescript
   class APIError extends Error {
     constructor(
       message: string,
       public statusCode: number,
       public context?: Record<string, unknown>
     ) {
       super(message);
       this.name = 'APIError';
     }
   }
   ```

2. **Границы ошибок**
   ```typescript
   function ErrorBoundary({ children }: { children: React.ReactNode }) {
     const [error, setError] = useState<Error | null>(null);

     if (error) {
       return <ErrorDisplay error={error} />;
     }

     return children;
   }
   ```

3. **Обработка асинхронных ошибок**
   ```typescript
   async function fetchWithErrorHandling<T>(
     url: string,
     options?: RequestInit
   ): Promise<T> {
     try {
       const response = await fetch(url, options);
       if (!response.ok) {
         throw new APIError(
           response.statusText,
           response.status
         );
       }
       return await response.json();
     } catch (error) {
       logStore.logError('API request failed', { url, error });
       throw error;
     }
   }
   ```

### Типизация

1. **Строгие типы**
   ```typescript
   // Определение типов для бизнес-сущностей
   type Message = {
     id: string;
     content: string;
     role: 'user' | 'assistant';
     timestamp: Date;
     metadata?: Record<string, unknown>;
   };

   // Типы для API
   interface APIResponse<T> {
     data: T;
     meta: {
       timestamp: string;
       version: string;
     };
   }
   ```

2. **Дженерики**
   ```typescript
   // Универсальный хук для загрузки данных
   function useDataLoader<T>(
     loader: () => Promise<T>,
     deps: unknown[] = []
   ) {
     const [data, setData] = useState<T | null>(null);
     const [error, setError] = useState<Error | null>(null);
     const [loading, setLoading] = useState(false);

     useEffect(() => {
       let mounted = true;
       
       async function load() {
         setLoading(true);
         try {
           const result = await loader();
           if (mounted) {
             setData(result);
           }
         } catch (e) {
           if (mounted) {
             setError(e as Error);
           }
         } finally {
           if (mounted) {
             setLoading(false);
           }
         }
       }

       load();
       
       return () => {
         mounted = false;
       };
     }, deps);

     return { data, error, loading };
   }
   ```

3. **Утилиты типизации**
   ```typescript
   // Извлечение типа из промиса
   type Awaited<T> = T extends Promise<infer U> ? U : T;

   // Создание типа с обязательными полями
   type Required<T> = {
     [P in keyof T]-?: T[P];
   };
   ```

### Оптимизация производительности

1. **Мемоизация**
   ```typescript
   const MemoizedMessage = memo(ChatMessage, (prev, next) => {
     return prev.id === next.id && prev.content === next.content;
   });
   ```

2. **Ленивая загрузка**
   ```typescript
   const ChatInterface = lazy(() => import('./ChatInterface'));
   
   function App() {
     return (
       <Suspense fallback={<Loading />}>
         <ChatInterface />
       </Suspense>
     );
   }
   ```

3. **Виртуализация списков**
   ```typescript
   function ChatHistory({ messages }: { messages: Message[] }) {
     return (
       <VirtualList
         data={messages}
         height={400}
         itemHeight={60}
         renderItem={({ item }) => (
           <ChatMessage {...item} />
         )}
       />
     );
   }
   ```

## Процесс разработки

### Рабочий процесс

1. **Организация веток**
   ```bash
   main              # Основная ветка
   ├── develop       # Ветка разработки
   ├── feature/*     # Ветки для новых функций
   └── bugfix/*      # Ветки для исправлений
   ```

2. **Коммиты и PR**
   - Семантическое версионирование
   - Conventional Commits
   ```
   feat: add new LLM provider
   fix: handle token expiration
   refactor: optimize message handling
   ```

3. **Code Review**
   - Проверка типизации
   - Соответствие стилю кода
   - Производительность
   - Тестовое покрытие

### Тестирование

1. **Модульные тесты**
   ```typescript
   describe('GigaChatProvider', () => {
     it('should handle token caching', async () => {
       const provider = new GigaChatProvider();
       const token = await provider.getAuthToken();
       expect(token).toBeDefined();
       // Проверяем что токен кешируется
       const cachedToken = await provider.getAuthToken();
       expect(cachedToken).toBe(token);
     });
   });
   ```

2. **Интеграционные тесты**
   ```typescript
   test('chat completion flow', async () => {
     const model = getGigaChatModel(baseUrl, apiKey, 'GigaChat');
     const response = await model.doGenerate({
       prompt: [{ role: 'user', content: 'Hello' }],
       temperature: 0.7,
     });
     expect(response.text).toBeDefined();
   });
   ```

3. **E2E тесты**
   ```typescript
   test('full chat interaction', async () => {
     const user = userEvent.setup();
     render(<ChatInterface />);
     
     await user.type(screen.getByRole('textbox'), 'Hello');
     await user.click(screen.getByRole('button', { name: /send/i }));
     
     expect(await screen.findByText(/assistant/i)).toBeInTheDocument();
   });
   ```

### Деплой

1. **Окружения**
   ```
   Development  -> https://dev.app.example.com
   Staging      -> https://staging.app.example.com
   Production   -> https://app.example.com
   ```

2. **CI/CD пайплайн**
   ```yaml
   name: Deploy
   on:
     push:
       branches: [main]
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - uses: actions/setup-node@v2
         - run: pnpm install
         - run: pnpm test
         - run: pnpm build
         - name: Deploy to Cloudflare
           uses: cloudflare/wrangler-action@v2
   ```

3. **Мониторинг и логирование**
   ```typescript
   // Пример системы логирования
   const logger = {
     info: (message: string, context = {}) => {
       console.log(JSON.stringify({
         level: 'info',
         message,
         context,
         timestamp: new Date().toISOString(),
       }));
     },
     error: (message: string, error: Error, context = {}) => {
       console.error(JSON.stringify({
         level: 'error',
         message,
         error: error.message,
         stack: error.stack,
         context,
         timestamp: new Date().toISOString(),
       }));
     }
   };
   ```

4. **Управление конфигурацией**
   ```typescript
   // Конфигурация для разных окружений
   const config = {
     development: {
       apiUrl: 'https://dev-api.example.com',
       logLevel: 'debug',
     },
     production: {
       apiUrl: 'https://api.example.com',
       logLevel: 'error',
     }
   };
   ```
