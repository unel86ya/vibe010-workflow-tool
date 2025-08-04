import { BlockDescriptor, BlockRuntime, RunContext, InvokeResult } from '@workflow-tool/shared';

export class ConstBlock implements BlockRuntime {
  static readonly descriptor: BlockDescriptor = {
    meta: {
      id: 'const-block',
      title: 'Const Block',
      version: '1.0.0',
      description: 'Постоянное фиксированное значение на выходе',
      filePath: __filename,
    },
    kind: 'event', // специальный event (сразу публикует значение при init)
    ports: [
      { name: 'value', direction: 'out', description: 'Фиксированное значение', required: true }
    ],
    configSchema: {
      type: 'object',
      properties: {
        value: { description: 'Константа (любого типа)' }
      },
      required: ['value']
    }
  };

  async init(config: { value: unknown }, ctx: RunContext): Promise<void> {
    ctx.emit('value', config.value);
  }

  async onInvoke(): Promise<InvokeResult> {
    // Константа не реагирует на входящие сообщения
    return { out: {} };
  }
}
