import { Command } from 'commander';
import { FlowEngine } from '@workflow-tool/workflow';
import { getErrorMessage } from '@workflow-tool/shared';

export function addBlockListCommands(program: Command, getEngine: () => FlowEngine) {
  program
    .command('block list')
    .description('Список доступных блоков')
    .option('--kind <kind>', 'Фильтр по типу: event|effect|compute')
    .option('--format <format>', 'Формат вывода: table|json', 'table')
    .action(async (options: { kind?: string; format: string }) => {
      try {
        const engine = getEngine();
        let blocks = engine.getRegisteredBlocks();

        // Фильтрация по типу
        if (options.kind) {
          blocks = blocks.filter(b => b.kind === options.kind);
        }

        if (blocks.length === 0) {
          console.log('No blocks found');
          return;
        }

        if (options.format === 'json') {
          console.log(JSON.stringify(blocks.map(b => ({
            id: b.meta.id,
            title: b.meta.title,
            version: b.meta.version,
            kind: b.kind,
            description: b.meta.description,
            ports: b.ports.length
          })), null, 2));
        } else {
          console.log(`📦 Found ${blocks.length} blocks:\n`);
          console.table(blocks.map(b => ({
            ID: b.meta.id,
            Title: b.meta.title,
            Kind: b.kind,
            Version: b.meta.version,
            Ports: b.ports.length,
            Description: (b.meta.description || '').slice(0, 50) +
                        (b.meta.description && b.meta.description.length > 50 ? '...' : '')
          })));
        }

      } catch (error) {
        console.error(`❌ Failed to list blocks: ${getErrorMessage(error)}`);
        process.exit(1);
      }
    });
}
