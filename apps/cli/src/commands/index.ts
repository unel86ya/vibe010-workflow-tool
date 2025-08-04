import { Command } from 'commander';
import { FlowEngine } from '@workflow-tool/workflow';

// Flow commands
import { addRunCommands } from './flow/run';
import { addValidateCommands } from './flow/validate';
import { addListCommands } from './flow/list';

// Block commands
import { addBlockListCommands } from './block/list';
import { addBlockDescribeCommands } from './block/describe';
import { addBlockTestCommands } from './block/test';

export function registerCommands(program: Command, getEngine: () => FlowEngine) {
  // Flow commands
  console.log('🐛 Registering commands...');

  addRunCommands(program, getEngine);
  addValidateCommands(program, getEngine);
  addListCommands(program);

  // Block commands
  addBlockListCommands(program, getEngine);
  addBlockDescribeCommands(program, getEngine);
  addBlockTestCommands(program, getEngine);
}
