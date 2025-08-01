import { Command } from 'commander';
import { FlowEngine } from '@workflow-tool/workflow';
import { ConsoleLogger } from '@workflow-tool/workflow';
import { getErrorMessage } from '@workflow-tool/shared';

export function addBlockTestCommands(program: Command, getEngine: () => FlowEngine) {
  program
    .command('block test <id>')
    .description('Тест блока с тестовыми данными')
    .option('--input <json>', 'Входные данные в JSON формате')
    .option('--config <json>', 'Конфигурация блока в JSON формате', '{}')
    .option('--port <name>', 'Имя входного порта', 'in')
    .action(async (id: string, options: {
      input?: string;
      config: string;
      port: string;
    }) => {
      try {
        const engine = getEngine();
        const blocks = engine.getRegisteredBlocks();
        const blockDescriptor = blocks.find(b => b.meta.id === id);

        if (!blockDescriptor) {
          console.error(`❌ Block '${id}' not found`);
          process.exit(1);
        }

        console.log(`🧪 Testing block: ${blockDescriptor.meta.title}`);

        // Создаем экземпляр блока
        const BlockClass = blockDescriptor.blockClass;
        const blockInstance = new BlockClass();

        // Парсим конфигурацию
        let config = {};
        try {
          config = JSON.parse(options.config);
        } catch (error) {
          console.error(`❌ Invalid config JSON: ${getErrorMessage(error)}`);
          process.exit(1);
        }

        // Парсим входные данные
        let input: unknown = undefined;
        if (options.input) {
          try {
            input = JSON.parse(options.input);
          } catch (error) {
            console.error(`❌ Invalid input JSON: ${getErrorMessage(error)}`);
            process.exit(1);
          }
        }

        // Создаем тестовый контекст
        const logger = new ConsoleLogger('debug');
        const ctx = {
          logger,
          env: process.env,
          emit: (port: string, data: unknown) => {
            console.log(`📤 Emitted on port '${port}':`, data);
          },
          cancelToken: new AbortController().signal,
          flowId: 'test-flow',
          blockId: 'test-block'
        };

        // Инициализируем блок
        if (blockInstance.init) {
          await blockInstance.init(config, ctx);
        }

        // Выполняем тест
        console.log(`\n▶️  Invoking port '${options.port}' with:`, input);

        const startTime = Date.now();
        const result = await blockInstance.onInvoke(options.port, input, ctx);
        const duration = Date.now() - startTime;

        console.log(`\n⏱️  Execution time: ${duration}ms`);
        console.log(`📥 Result:`, result);

        // Очистка
        if (blockInstance.dispose) {
          await blockInstance.dispose();
        }

      } catch (error) {
        console.error(`❌ Test failed: ${getErrorMessage(error)}`);
        process.exit(1);
      }
    });
}
