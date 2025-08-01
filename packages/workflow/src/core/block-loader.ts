import { readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { BlockDescriptor, BlockRuntime, Logger } from '@workflow-tool/shared';
import { getErrorMessage } from '@workflow-tool/shared';

export class BlockLoader {
  constructor(private logger: Logger) {}

  async loadBlocks(paths: string[]): Promise<BlockDescriptor[]> {
    const blocks: BlockDescriptor[] = [];

    for (const path of paths) {
      try {
        const pathBlocks = await this.loadFromPath(path);
        blocks.push(...pathBlocks);
        this.logger.debug(`Loaded ${pathBlocks.length} blocks from ${path}`);
      } catch (error) {
        this.logger.warn(`Failed to load blocks from ${path}: ${getErrorMessage(error)}`);
      }
    }

    return blocks;
  }

  private async loadFromPath(path: string): Promise<BlockDescriptor[]> {
    const blocks: BlockDescriptor[] = [];

    if (!(await this.pathExists(path))) {
      return blocks;
    }

    const files = await this.scanDirectory(path, /\.(ts|js|mjs)$/);

    for (const file of files) {
      try {
        const module = await import(file);
        const fileBlocks = this.extractBlocksFromModule(module, file);
        blocks.push(...fileBlocks);
      } catch (error) {
        this.logger.warn(`Failed to load block from ${file}: ${getErrorMessage(error)}`);
      }
    }

    return blocks;
  }

  private async pathExists(path: string): Promise<boolean> {
    try {
      await stat(path);
      return true;
    } catch {
      return false;
    }
  }

  private async scanDirectory(dir: string, pattern: RegExp): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await readdir(dir);

      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stats = await stat(fullPath);

        if (stats.isDirectory()) {
          const subFiles = await this.scanDirectory(fullPath, pattern);
          files.push(...subFiles);
        } else if (pattern.test(entry)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to scan directory ${dir}: ${getErrorMessage(error)}`);
    }

    return files;
  }

  private extractBlocksFromModule(module: any, filePath: string): BlockDescriptor[] {
    const blocks: BlockDescriptor[] = [];

    for (const [name, exportedClass] of Object.entries(module)) {
      if (this.isBlockClass(exportedClass)) {
        try {
          const descriptor = this.extractDescriptor(exportedClass as any);
          descriptor.meta.filePath = filePath;
          blocks.push(descriptor);
        } catch (error) {
          this.logger.warn(`Failed to extract descriptor from ${name} in ${filePath}: ${getErrorMessage(error)}`);
        }
      }
    }

    return blocks;
  }

  private isBlockClass(obj: unknown): boolean {
    return (
      typeof obj === 'function' &&
      obj.prototype &&
      typeof obj.prototype.onInvoke === 'function' &&
      (obj as any).descriptor
    );
  }

  private extractDescriptor(blockClass: any): BlockDescriptor {
    const descriptor = blockClass.descriptor;

    if (!descriptor || !descriptor.meta || !descriptor.kind) {
      throw new Error('Block must have descriptor with meta and kind');
    }

    return {
      ...descriptor,
      blockClass
    };
  }
}
