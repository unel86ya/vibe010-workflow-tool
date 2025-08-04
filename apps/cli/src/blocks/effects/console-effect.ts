import {
  BlockRuntime,
  BlockDescriptor,
  getErrorMessage,
  RunContext,
  InvokeResult,
} from '@workflow-tool/shared';
interface ConsoleConfig {
  target?: 'stdout' | 'stderr';
  format?: 'json' | 'text' | 'pretty';
  prefix?: string;
}

export class ConsoleEffect implements BlockRuntime {
  static readonly descriptor: BlockDescriptor = {
    meta: {
      id: 'console-effect',
      title: 'Console Effect',
      version: '1.0.0',
      description: 'Выводит данные в stdout или stderr',
      filePath: __filename,
    },
    kind: 'effect',
    ports: [
      {
        name: 'data',
        direction: 'in',
        description: 'Данные для вывода',
        schema: {},
        required: true
      },
      {
        name: 'printed',
        direction: 'out',
        description: 'Подтверждение вывода',
        schema: {
          type: 'object',
          properties: {
            target: { type: 'string' },
            length: { type: 'number' }
          }
        }
      },
      { name: 'error', direction: 'error', description: 'Ошибки вывода' }
    ],
    configSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          enum: ['stdout', 'stderr'],
          default: 'stdout',
          description: 'Куда выводить данные'
        },
        format: {
          type: 'string',
          enum: ['json', 'text', 'pretty'],
          default: 'pretty',
          description: 'Формат вывода'
        },
        prefix: {
          type: 'string',
          description: 'Префикс для вывода'
        }
      }
    },
    sideEffects: true
  };

  private config!: ConsoleConfig;

  async init(config: ConsoleConfig, ctx: RunContext): Promise<void> {
    this.config = config;
  }

  async onInvoke(port: string, data: unknown, ctx: RunContext): Promise<InvokeResult> {
    if (port !== 'data') {
      return { error: `Unknown input port: ${port}` };
    }

    try {
      const target = this.config.target || 'stdout';
      const format = this.config.format || 'pretty';
      const prefix = this.config.prefix || '';

      let output = this.formatData(data, format);

      if (prefix) {
        output = `${prefix} ${output}`;
      }

      if (target === 'stderr') {
        process.stderr.write(output + '\n');
      } else {
        process.stdout.write(output + '\n');
      }

      ctx.logger.debug(`Printed to ${target}: ${output.length} chars`);

      return {
        out: {
          printed: {
            target,
            length: output.length
          }
        }
      };

    } catch (error) {
      ctx.logger.error(`Failed to print to console: ${getErrorMessage(error)}`);
      return { error: `Failed to print to console: ${getErrorMessage(error)}` };
    }
  }

  private formatData(data: unknown, format: string): string {
    switch (format) {
      case 'json':
        return JSON.stringify(data);

      case 'text':
        return String(data);

      case 'pretty':
      default:
        if (typeof data === 'object' && data !== null) {
          return JSON.stringify(data, null, 2);
        }
        return String(data);
    }
  }
}
