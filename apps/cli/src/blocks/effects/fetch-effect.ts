import {
  BlockRuntime,
  BlockDescriptor,
  getErrorMessage,
  RunContext,
  InvokeResult
} from '@workflow-tool/shared';

interface FetchConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export class FetchEffect implements BlockRuntime {
  static readonly descriptor: BlockDescriptor = {
    meta: {
      id: 'fetch-effect',
      title: 'Fetch Effect',
      version: '1.0.0',
      description: 'Выполняет HTTP запрос',
      filePath: __filename,
    },
    kind: 'effect',
    ports: [
      {
        name: 'url',
        direction: 'in',
        description: 'URL для запроса',
        schema: { type: 'string' }
      },
      {
        name: 'method',
        direction: 'in',
        description: 'HTTP метод',
        schema: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] }
      },
      {
        name: 'headers',
        direction: 'in',
        description: 'HTTP заголовки',
        schema: { type: 'object' }
      },
      {
        name: 'body',
        direction: 'in',
        description: 'Тело запроса',
        schema: {}
      },
      {
        name: 'response',
        direction: 'out',
        description: 'Ответ от сервера',
        schema: {
          type: 'object',
          properties: {
            status: { type: 'number' },
            statusText: { type: 'string' },
            headers: { type: 'object' },
            data: {}
          }
        }
      },
      { name: 'error', direction: 'error', description: 'Ошибки запроса' }
    ],
    configSchema: {
      type: 'object',
      properties: {
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          default: 'GET'
        },
        url: {
          type: 'string',
          description: 'URL по умолчанию'
        },
        headers: {
          type: 'object',
          description: 'Заголовки по умолчанию'
        },
        timeout: {
          type: 'number',
          description: 'Таймаут запроса в мс',
          default: 10000,
          minimum: 1000
        }
      }
    },
    sideEffects: true
  };

  private config!: FetchConfig;
  private accumulator = new Map<string, unknown>();

  async init(config: FetchConfig, ctx: RunContext): Promise<void> {
    this.config = config;
  }

  async onInvoke(port: string, data: unknown, ctx: RunContext): Promise<InvokeResult> {
    if (!['url', 'method', 'headers', 'body'].includes(port)) {
      return { error: `Unknown input port: ${port}` };
    }

    // Накапливаем данные
    this.accumulator.set(port, data);

    // Проверяем есть ли URL (обязательный)
    const url = this.accumulator.get('url') || this.config.url;
    if (url) {
      return await this.makeRequest(ctx);
    }

    // Ждем URL
    return { out: { waiting: true } };
  }

  private async makeRequest(ctx: RunContext): Promise<InvokeResult> {
    try {
      const url = this.accumulator.get('url') || this.config.url;
      const method = this.accumulator.get('method') || this.config.method || 'GET';
      const headers = {
        ...this.config.headers,
        ...this.accumulator.get('headers') as Record<string, string>
      };
      const body = this.accumulator.get('body');

      // Очищаем накопитель
      this.accumulator.clear();

      if (!url || typeof url !== 'string') {
        return { error: 'Invalid or missing URL' };
      }

      ctx.logger.info(`Making ${method} request to: ${url}`);

      // Подготавливаем параметры запроса
      const fetchOptions: RequestInit = {
        method: method as string,
        headers,
        signal: AbortSignal.timeout(this.config.timeout || 10000)
      };

      // Добавляем body для POST/PUT/PATCH
      if (body && ['POST', 'PUT', 'PATCH'].includes(method as string)) {
        if (typeof body === 'object') {
          fetchOptions.body = JSON.stringify(body);
          fetchOptions.headers = {
            ...fetchOptions.headers,
            'Content-Type': 'application/json'
          };
        } else {
          fetchOptions.body = String(body);
        }
      }

      // Выполняем запрос
      const response = await fetch(url as string, fetchOptions);

      // Парсим ответ
      let responseData: unknown;
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      const result = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData
      };

      ctx.logger.info(`Request completed with status: ${response.status}`);

      return { out: { response: result } };

    } catch (error) {
      ctx.logger.error(`HTTP request failed: ${getErrorMessage(error)}`);
      return { error: `HTTP request failed: ${getErrorMessage(error)}` };
    }
  }
}
