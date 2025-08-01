#!/usr/bin/env bun
import { program } from 'commander';
import { join } from 'path';
import { BlockLoader, FlowEngine, ConsoleLogger } from '@workflow-tool/workflow';
import { getErrorMessage } from '@workflow-tool/shared';

import { registerCommands } from './commands';

// Импортируем все блоки статически для включения в бинарник
import './blocks/events/timer-event';
import './blocks/events/action-event';
import './blocks/effects/file-read-effect';
import './blocks/effects/file-write-effect';
import './blocks/effects/console-effect';
import './blocks/effects/fetch-effect';
import './blocks/effects/variable-effect';
import './blocks/compute/function-compute';

let globalEngine: FlowEngine;

async function getBuiltinBlocksPath(): Promise<string> {
  // В dev режиме
  if (process.env.NODE_ENV === 'development') {
    return join(__dirname, 'blocks');
  }

  // В скомпилированном бинарнике
  return join(__dirname, 'blocks');
}

async function setupEngine(externalBlocksPaths: string[] = [], verbose = false): Promise<FlowEngine> {
  const logger = new ConsoleLogger(verbose ? 'debug' : 'info');
  const blockLoader = new BlockLoader(logger);

  // Формируем список путей для загрузки
  const builtinPath = await getBuiltinBlocksPath();
  const allPaths = [builtinPath, ...externalBlocksPaths];

  logger.debug(`Loading blocks from paths: ${allPaths.join(', ')}`);

  // Загружаем все блоки
  const blocks = await blockLoader.loadBlocks(allPaths);

  logger.info(`📦 Loaded ${blocks.length} blocks total`);

  if (verbose) {
    blocks.forEach(block => {
      logger.debug(`  - ${block.meta.id} (${block.kind}): ${block.meta.title}`);
    });
  }

  // Создаем движок
  const engine = new FlowEngine(logger);
  for (const block of blocks) {
    engine.registerBlock(block);
  }

  return engine;
}

async function main() {
  program
    .name('workflow-tool')
    .description('CLI для управления workflow')
    .version('1.0.0')
    .option('--blocks-path <paths...>', 'Дополнительные пути к внешним блокам')
    .option('--verbose', 'Подробное логирование')
    .option('--config <path>', 'Путь к конфиг файлу (пока не используется)');

  // Хук для инициализации движка перед выполнением команд
  program.hook('preAction', async (thisCommand) => {
    const opts = program.opts();

    try {
      globalEngine = await setupEngine(
        opts.blocksPath || [],
        opts.verbose
      );
    } catch (error) {
      console.error(`❌ Failed to initialize engine: ${getErrorMessage(error)}`);
      process.exit(1);
    }
  });

  // Регистрируем команды
  registerCommands(program, () => globalEngine);

  // Обработка ошибок
  program.exitOverride((err) => {
    if (err.code === 'commander.help') {
      process.exit(0);
    }
    console.error(`❌ CLI Error: ${err.message}`);
    process.exit(1);
  });

  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error(`❌ Unexpected error: ${getErrorMessage(error)}`);
    process.exit(1);
  }
}

// Запуск только если это главный модуль
if (import.meta.main) {
  main().catch(error => {
    console.error(`❌ Fatal error: ${getErrorMessage(error)}`);
    process.exit(1);
  });
}
