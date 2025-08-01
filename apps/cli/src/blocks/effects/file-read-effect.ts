import { readFile } from 'fs/promises';
import {
  BlockRuntime,
  BlockDescriptor,
  getErrorMessage,
  RunContext,
  InvokeResult
} from '@workflow-tool/shared';

interface FileReadConfig {
  encoding?: BufferEncoding;
  defaultPath?: string;
}

export class FileReadEffect implements BlockRuntime {
  static readonly descriptor: BlockDescriptor = {
    meta: {
      id: 'file-read-effect',
      title: 'File Read Effect',
      version: '1.0.0',
      description: 'Читает содержимое файла'
    },
    kind: 'effect',
    ports: [
      {
        name: 'path',
        direction: 'in',
        description: 'Путь к файлу',
        schema: { type: 'string' },
        required: true
      },
      {
        name: 'content',
        direction: 'out',
        description: 'Содержимое файла',
        schema: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            path: { type: 'string' },
            size: { type: 'number' }
          }
        }
      },
      { name: 'error', direction: 'error', description: 'Ошибки чтения' }
    ],
    configSchema: {
      type: 'object',
      properties: {
        encoding: {
          type: 'string',
          enum: ['utf8', 'utf-8', 'ascii', 'base64', 'hex'],
          default: 'utf8'
        },
        defaultPath: {
          type: 'string',
          description: 'Путь по умолчанию, если не передан через порт'
        }
      }
    },
    sideEffects: true
  };

  private config!: FileReadConfig;

  async init(config: FileReadConfig, ctx: RunContext): Promise<void> {
    this.config = config;
  }

  async onInvoke(port: string, data: unknown, ctx: RunContext): Promise<InvokeResult> {
    if (port !== 'path') {
      return { error: `Unknown input port: ${port}` };
    }

    try {
      const filePath = (data as string) || this.config.defaultPath;

      if (!filePath) {
        return { error: 'No file path provided' };
      }

      ctx.logger.info(`Reading file: ${filePath}`);

      const content = await readFile(filePath, this.config.encoding || 'utf8');
      const stats = await stat(filePath);

      return {
        out: {
          content: {
            content,
            path: filePath,
            size: stats.size
          }
        }
      };

    } catch (error) {
      ctx.logger.error(`Failed to read file: ${getErrorMessage(error)}`);
      return { error: `Failed to read file: ${getErrorMessage(error)}` };
    }
  }
}
