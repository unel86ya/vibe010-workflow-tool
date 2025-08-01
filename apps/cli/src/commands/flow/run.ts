import { Command } from 'commander';
import { FlowEngine } from '@workflow-tool/workflow';
import { YamlUtils } from '@workflow-tool/workflow';
import { getErrorMessage } from '@workflow-tool/shared';

export function addRunCommands(program: Command, getEngine: () => FlowEngine) {
  program
    .command('flow run <file>')
    .description('Запустить workflow из файла')
    .option('-w, --watch', 'Перезапускать при изменении файла')
    .option('-t, --timeout <ms>', 'Таймаут выполнения в мс', parseInt)
    .action(async (file: string, options: { watch?: boolean; timeout?: number }) => {
      try {
        const engine = getEngine();

        console.log(`🚀 Starting flow from: ${file}`);

        // Загружаем flow
        const flow = await YamlUtils.loadFlow(file);

        // Валидируем
        const errors = YamlUtils.validateFlow(flow);
        if (errors.length > 0) {
          console.error('❌ Flow validation errors:');
          errors.forEach(error => console.error(`  - ${error}`));
          process.exit(1);
        }

        // Запускаем
        await engine.runFlow(flow, {
          timeout: options.timeout
        });

        console.log('✅ Flow completed successfully');

      } catch (error) {
        console.error(`❌ Failed to run flow: ${getErrorMessage(error)}`);
        process.exit(1);
      }
    });
}
