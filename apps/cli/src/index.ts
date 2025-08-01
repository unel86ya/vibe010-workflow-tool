#!/usr/bin/env bun
import { Command } from 'commander';
import { runFlow } from '@workflow-tool/workflow';

const program = new Command();

program
  .name('llm-cli')
  .description('CLI runner for LLM workflows')
  .argument('<config>', 'Path to workflow config')
  .action(async (config) => {
    console.log(`Loading config: ${config}`);
    const result = await runFlow({ name: 'test', steps: [] });
    console.log('Result:', result);
  });

program.parse();
