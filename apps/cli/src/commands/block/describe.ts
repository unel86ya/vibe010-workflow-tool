import { Command } from 'commander';
import { FlowEngine } from '@workflow-tool/workflow';
import { getErrorMessage, BlockDescriptor } from '@workflow-tool/shared';

export function addBlockDescribeCommands(program: Command, getEngine: () => FlowEngine) {
  program
    .command('block describe <id>')
    .description('Подробное описание блока')
    .option('--format <format>', 'Формат вывода: pretty|json', 'pretty')
    .action(async (id: string, options: { format: string }) => {
      try {
        const engine = getEngine();
        const blocks = engine.getRegisteredBlocks();
        const block = blocks.find(b => b.meta.id === id);

        if (!block) {
          console.error(`❌ Block '${id}' not found`);
          console.log('\nAvailable blocks:');
          blocks.forEach(b => console.log(`  - ${b.meta.id}`));
          process.exit(1);
        }

        if (options.format === 'json') {
          console.log(JSON.stringify(block, null, 2));
        } else {
          printBlockDescription(block);
        }

      } catch (error) {
        console.error(`❌ Failed to describe block: ${getErrorMessage(error)}`);
        process.exit(1);
      }
    });
}

function printBlockDescription(block: BlockDescriptor) {
  console.log(`\n📦 ${block.meta.title} (${block.meta.id})`);
  console.log(`═══════════════════════════════════════`);
  console.log(`Kind: ${block.kind}`);
  console.log(`Version: ${block.meta.version}`);

  if (block.meta.description) {
    console.log(`Description: ${block.meta.description}`);
  }

  if (block.meta.keywords && block.meta.keywords.length > 0) {
    console.log(`Keywords: ${block.meta.keywords.join(', ')}`);
  }

  console.log('\n🔌 Ports:');
  if (block.ports.length === 0) {
    console.log('  (no ports)');
  } else {
    block.ports.forEach(port => {
      const required = port.required ? ' (required)' : '';
      const direction = port.direction === 'in' ? '→' : '←';
      console.log(`  ${direction} ${port.name}${required}: ${port.description || 'No description'}`);
    });
  }

  if (block.configSchema) {
    console.log('\n⚙️  Configuration:');
    if (block.configSchema.properties) {
      Object.entries(block.configSchema.properties).forEach(([key, schema]: [string, any]) => {
        const required = block.configSchema?.required?.includes(key) ? ' (required)' : '';
        console.log(`  - ${key}${required}: ${schema.description || 'No description'}`);
      });
    }
  }

  if (block.sideEffects) {
    console.log('\n⚠️  This block has side effects');
  }

  console.log('');
}
