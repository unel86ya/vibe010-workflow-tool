import { readFile } from 'fs/promises';
import YAML from 'yaml';
import { getErrorMessage, FlowDefinition } from '@workflow-tool/shared';

export class YamlUtils {
  static async loadFlow(filePath: string): Promise<FlowDefinition> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const flow = YAML.parse(content) as FlowDefinition;

      if (!flow.name) {
        throw new Error('Flow must have a name');
      }

      if (!flow.blocks || Object.keys(flow.blocks).length === 0) {
        throw new Error('Flow must have at least one block');
      }

      if (!flow.connections) {
        flow.connections = [];
      }

      return flow;
    } catch (error) {
      throw new Error(`Failed to load flow from ${filePath}: ${getErrorMessage(error)}`);
    }
  }

  static validateFlow(flow: FlowDefinition): string[] {
    const errors: string[] = [];

    // Проверяем что все connections ссылаются на существующие блоки
    for (const conn of flow.connections) {
      if (!flow.blocks[conn.from.block]) {
        errors.push(`Connection references unknown block: ${conn.from.block}`);
      }
      if (!flow.blocks[conn.to.block]) {
        errors.push(`Connection references unknown block: ${conn.to.block}`);
      }
    }

    return errors;
  }
}
