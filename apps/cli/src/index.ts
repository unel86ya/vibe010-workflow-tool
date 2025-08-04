#!/usr/bin/env bun
import { Command } from 'commander';
import { FlowEngine, ConsoleLogger, YamlUtils } from '@workflow-tool/workflow';
import { getErrorMessage } from '@workflow-tool/shared';

const program = new Command();

program
  .name('workflow-cli')
  .description('CLI runner for workflows')
  .argument('<config>', 'Path to workflow config')
  .action(async (config) => {
    try {
      console.log(`Loading config: ${config}`);

      // Создаём движок
      const logger = new ConsoleLogger();
      const engine = new FlowEngine(logger);

      // Загружаем workflow из YAML
      const flow = await YamlUtils.loadFlow(config);

      // Запускаем через движок
      const result = await engine.runFlow(flow);
      console.log('✅ Flow completed successfully');

    } catch (error) {
      console.error('❌ Flow failed:', getErrorMessage(error));
      process.exit(1);
    }
  });

program.parse();
