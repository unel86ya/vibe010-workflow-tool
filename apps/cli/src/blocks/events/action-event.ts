import {
  BlockRuntime,
  BlockDescriptor,
  RunContext,
  InvokeResult
} from '@workflow-tool/shared';

interface ActionConfig {
  data?: unknown; // данные для отправки
  delay?: number; // задержка перед выполнением (мс)
}

export class ActionEvent implements BlockRuntime {
  static readonly descriptor: BlockDescriptor = {
    meta: {
      id: 'action-event',
      title: 'Action Event',
      version: '1.0.0',
      description: 'Однократное действие - отправляет данные сразу при инициализации',
      filePath: __filename,
    },
    kind: 'event',
    ports: [
      {
        name: 'trigger',
        direction: 'out',
        description: 'Данные события',
        schema: {}
      },
      { name: 'error', direction: 'error', description: 'Ошибки' }
    ],
    configSchema: {
      type: 'object',
      properties: {
        data: {
          description: 'Данные для отправки'
        },
        delay: {
          type: 'number',
          description: 'Задержка перед выполнением (мс)',
          minimum: 0,
          default: 0
        }
      }
    }
  };

  async init(config: ActionConfig, ctx: RunContext): Promise<void> {
    const delay = config.delay || 0;

    ctx.logger.info(`⏰ Action event will trigger in ${delay}ms with data:`, config.data);

    setTimeout(() => {
      ctx.logger.info(`🔥 Action event triggered!`);
      ctx.emit('trigger', config.data || { timestamp: Date.now() });
    }, delay);
  }

  async onInvoke(port: string, data: unknown, ctx: RunContext): Promise<InvokeResult> {
    ctx.logger.warn(`⚠️ Action events should not receive input messages on port: ${port}`);
    return { error: 'Action events do not accept input messages' };
  }
}
