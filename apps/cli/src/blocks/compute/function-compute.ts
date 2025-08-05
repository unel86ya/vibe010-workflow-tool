import {
  BlockRuntime,
  BlockDescriptor,
  RunContext,
  InvokeResult,
  BlockConfig
} from '@workflow-tool/shared';

interface FunctionConfig {
  function?: string;         // JS-код в конфиге
  inputPorts?: string[];     // Ожидаемые порты
  async?: boolean;           // Асинхронная функция
}

export class FunctionCompute implements BlockRuntime {
  static readonly descriptor: BlockDescriptor = {
    meta: {
      id: 'function-compute',
      title: 'Function Compute',
      version: '1.1.0',
      description: 'Выполняет JS-функцию, код можно передать в конфиге или через порт `code`',
      filePath: __filename,
    },
    kind: 'compute',
    ports: [
      { name: 'code', direction: 'in', description: 'Код функции как строка (JS)' },
      { name: 'in',   direction: 'in', description: 'Входные данные для функции' },
      { name: 'result', direction: 'out', description: 'Результат выполнения' },
      { name: 'error',  direction: 'error', description: 'Ошибки выполнения' }
    ],
    configSchema: {
      type: 'object',
      properties: {
        function: {
          type: 'string',
          description: 'Код функции в конфиге (альтернативно можно использовать порт code)'
        },
        inputPorts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Какие порты ждать до выполнения (по умолчанию ["in"])'
        },
        async: {
          type: 'boolean',
          description: 'Асинхронная функция',
          default: false
        }
      },
      // function необязателен, если будет получен через порт code
    }
  };

  private config?: FunctionConfig;
  private compiledFunction?: Function;
  private accumulator = new Map<string, unknown>();
  private expectedPorts?: Set<string>;

  async init(config: BlockConfig, ctx: RunContext): Promise<void> {
    this.config = config as any as FunctionConfig;
    this.expectedPorts = new Set(this.config.inputPorts || ['in']);
    // Если код задан в конфиге — компилируем сразу
    if (this.config.function) {
      this.compileFunction(this.config.function, this.config.async || false, ctx);
    }
  }

  async onInvoke(port: string, data: unknown, ctx: RunContext): Promise<InvokeResult> {
    ctx.logger.debug(`FunctionCompute received on port "${port}":`, data);

    // Если пришёл код — компилируем
    if (port === 'code') {
      const codeStr = String(data);
      this.compileFunction(codeStr, ctx);
      return { out: { waiting: true } };
    }

    // Накопление входных данных
    this.accumulator.set(port, data);

    if (!this.compiledFunction) {
      return { error: 'Function code not provided yet' };
    }

    // Проверяем готовы ли все ожидаемые порты
    if (this.isReady()) {
      return this.executeFunction(ctx);
    }

    return { out: { waiting: true } };
  }

  private compileFunction(code: string, ctx: RunContext) {
    ctx.logger.debug('Trying to compile code, ', code);
    try {
      this.compiledFunction = new Function('inputs', 'ctx', code);

      ctx.logger.debug('✅ Function compiled');
    } catch (err) {
      const msg = (err instanceof Error ? err.message : String(err));
      ctx.logger.error('❌ Compile error:', msg);
      throw new Error(`Compile error: ${msg}`);
    }
  }

  private isReady(): boolean {
    if (!this.expectedPorts) return false;

    if (this.expectedPorts.size === 0) {
      return this.accumulator.size > 0;
    }
    for (const p of this.expectedPorts) {
      if (!this.accumulator.has(p)) return false;
    }

    return true;
  }

  private async executeFunction(ctx: RunContext): Promise<InvokeResult> {
    const inputs: Record<string, unknown> = {};
    for (const [port, val] of this.accumulator.entries()) {
      inputs[port] = val;
    }
    this.accumulator.clear();

    try {
      ctx.logger.debug('🔥 Executing function with inputs:', inputs);
      const result = await this.compiledFunction!(inputs, ctx);
      ctx.logger.debug('✅ Function result:', result);
      return { out: { result } };
    } catch (err) {
      const msg = (err instanceof Error ? err.message : String(err));
      ctx.logger.error('❌ Function execution error:', msg);
      return { error: msg };
    }
  }
}
