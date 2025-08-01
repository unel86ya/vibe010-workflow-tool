import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import {
  BlockRuntime,
  BlockDescriptor,
  getErrorMessage,
  RunContext,
  InvokeResult
} from '@workflow-tool/shared';

interface FileWriteConfig {
  encoding?: BufferEncoding;
  createDirs?: boolean;
  overwrite?: boolean;
}

export class FileWriteEffect implements BlockRuntime {
  static readonly descriptor: BlockDescriptor = {
    meta: {
      id: 'file-write-effect',
      title: 'File Write Effect',
      version: '1.0.0',
      description: 'Записывает данные в файл'
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
        direction: 'in',
        description: 'Содержимое для записи',
        schema: { type: 'string' },
        required: true
      },
      {
        name: 'written',
        direction: 'out',
        description: 'Информация о записанном файле',
        schema: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            size: { type: 'number' }
          }
        }
      },
      { name: 'error', direction: 'error', description: 'Ошибки записи' }
    ],
    configSchema: {
      type: 'object',
      properties: {
        encoding: {
          type: 'string',
          enum: ['utf8', 'utf-8', 'ascii', 'base64', 'hex'],
          default: 'utf8'
        },
        createDirs: {
          type: 'boolean',
          description: 'Создавать директории если не существуют',
          default: true
        },
        overwrite: {
          type: 'boolean',
          description: 'Перезаписывать существующие файлы',
          default: true
        }
      }
    },
    sideEffects: true
  };

  private config!: FileWriteConfig;
  private accumulator = new Map<string, unknown>();

  async init(config: FileWriteConfig, ctx: RunContext): Promise<void> {
    this.config = config;
  }

  async onInvoke(port: string, data: unknown, ctx: RunContext): Promise<InvokeResult> {
    if (!['path', 'content'].includes(port)) {
      return { error: `Unknown input port: ${port}` };
    }

    // Накапливаем данные
    this.accumulator.set(port, data);

    // Проверяем готовность к записи
    if (this.accumulator.has('path') && this.accumulator.has('content')) {
      return await this.writeFile(ctx);
    }

    // Ждем остальные данные
    return { out: { waiting: true } };
  }

  private async writeFile(ctx: RunContext): Promise<InvokeResult> {
    try {
      const filePath = this.accumulator.get('path') as string;
      const content = this.accumulator.get('content') as string;

      // Очищаем накопитель
      this.accumulator.clear();

      if (!filePath || typeof filePath !== 'string') {
        return { error: 'Invalid file path' };
      }

      if (content === undefined || content === null) {
        return { error: 'Invalid content' };
      }

      ctx.logger.info(`Writing file: ${filePath}`);

      // Создаем директории если нужно
      if (this.config.createDirs) {
        await mkdir(dirname(filePath), { recursive: true });
      }

      // Записываем файл
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      await writeFile(filePath, contentStr, this.config.encoding || 'utf8');

      return {
        out: {
          written: {
            path: filePath,
            size: Buffer.byteLength(contentStr, this.config.encoding || 'utf8')
          }
        }
      };

    } catch (error) {
      ctx.logger.error(`Failed to write file: ${getErrorMessage(error)}`);
      return { error: `Failed to write file: ${getErrorMessage(error)}` };
    }
  }
}
