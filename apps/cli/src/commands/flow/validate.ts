import { Command } from 'commander';
import { YamlUtils } from '@workflow-tool/workflow';
import { getErrorMessage } from '@workflow-tool/shared';
import { FlowEngine } from '@workflow-tool/workflow';

export function addValidateCommands(program: Command, getEngine: () => FlowEngine) {
  program
    .command('flow validate <file>')
    .description('Валидировать workflow файл')
    .option('--strict', 'Строгая валидация')
    .action(async (file: string, options: { strict?: boolean }) => {
      try {
        console.log(`🔍 Validating flow: ${file}`);

        // Загружаем flow
        const flow = await YamlUtils.loadFlow(file);

        // Базовая валидация
        const errors = YamlUtils.validateFlow(flow);

        if (options.strict) {
          // Дополнительные проверки
          const engine = getEngine();
          const registeredBlocks = engine.getRegisteredBlocks();
          const blockTypes = new Set(registeredBlocks.map(b => b.meta.id));

          // Проверяем что все типы блоков существуют
          for (const [blockId, blockConfig] of Object.entries(flow.blocks)) {
            if (!blockTypes.has(blockConfig.type)) {
              errors.push(`Unknown block type '${blockConfig.type}' in block '${blockId}'`);
            }
          }
        }

        if (errors.length > 0) {
          console.error('❌ Validation failed:');
          errors.forEach(error => console.error(`  - ${error}`));
          process.exit(1);
        } else {
          console.log('✅ Flow is valid');
        }

      } catch (error) {
        console.error(`❌ Validation failed: ${getErrorMessage(error)}`);
        process.exit(1);
      }
    });
}
