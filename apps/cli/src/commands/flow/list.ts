import { Command } from 'commander';
import { readdir } from 'fs/promises';
import { join, extname } from 'path';
import { getErrorMessage } from '@workflow-tool/shared';

export function addListCommands(program: Command) {
  program
    .command('flow list [directory]')
    .description('Список доступных workflow файлов')
    .option('--format <format>', 'Формат вывода: table|json', 'table')
    .action(async (directory: string = '.', options: { format: string }) => {
      try {
        console.log(`📋 Searching for workflows in: ${directory}`);

        const files = await findWorkflowFiles(directory);

        if (files.length === 0) {
          console.log('No workflow files found');
          return;
        }

        if (options.format === 'json') {
          console.log(JSON.stringify(files, null, 2));
        } else {
          console.table(files.map(f => ({
            File: f.name,
            Path: f.path,
            Size: `${f.size} bytes`
          })));
        }

      } catch (error) {
        console.error(`❌ Failed to list flows: ${getErrorMessage(error)}`);
        process.exit(1);
      }
    });
}

async function findWorkflowFiles(directory: string) {
  const files: Array<{ name: string; path: string; size: number }> = [];

  try {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && ['.yaml', '.yml'].includes(extname(entry.name))) {
        const fullPath = join(directory, entry.name);
        const stats = await stat(fullPath);

        files.push({
          name: entry.name,
          path: fullPath,
          size: stats.size
        });
      }
    }
  } catch (error) {
    // Игнорируем ошибки доступа к директориям
  }

  return files;
}
