import { BlockDescriptor, BlockRuntime, RunContext, InvokeResult, BlockConfig } from '@workflow-tool/shared';

interface VariableConfig {
  name: string;
  initial?: unknown;
}

export class VariableBlock implements BlockRuntime {
  static readonly descriptor: BlockDescriptor = {
    meta: {
      id: 'variable-block',
      title: 'Variable Block',
      version: '1.0.0',
      description: 'Хранилище переменного значения (можно читать и писать)',
      filePath: __filename,
    },
    kind: 'compute',
    ports: [
      { name: 'set', direction: 'in', description: 'Записать новое значение' },
      { name: 'get', direction: 'out', description: 'Текущее значение' }
    ],
    configSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Имя переменной' },
        initial: { description: 'Начальное значение переменной' }
      },
      required: ['name']
    }
  };

  private value: unknown;

  async init(config: BlockConfig, ctx: RunContext): Promise<void> {
    this.value = config.initial;
    // if (this.value !== undefined) ctx.emit('get', this.value);
  }

  async onInvoke(port: string, data: unknown, ctx: RunContext): Promise<InvokeResult> {
    if (port === 'set') {
      this.value = data;
      ctx.logger.debug(`[variable-block] set:`, this.value);
      return { out: { get: this.value } };
    }
    // порт 'get': всегда возвращает актуальное значение (pull)
    return { out: { get: this.value } };
  }
}
