// Двухэтапная сборка: SvelteKit build + генерация импортов + Bun compile
import { $ } from 'bun';
import { existsSync } from 'fs';

console.log('🔧 Building Flow Configuration Client binary...');

try {
  // Этап 1: Сборка SvelteKit приложения
  console.log('📦 Step 1: Building SvelteKit app...');
  await $`bun run build`;

  if (!existsSync('./build/index.html')) {
    throw new Error('SvelteKit build failed - no index.html found');
  }

  console.log('✅ Step 1: SvelteKit build completed');

  // Этап 2: Генерация статических импортов
  console.log('🔄 Step 2: Generating static imports...');
  const generateProcess = Bun.spawn({
    cmd: ['bun', 'run', 'scripts/generate-static-imports.ts'],
    stdio: ['inherit', 'inherit', 'inherit']
  });

  const generateExitCode = await generateProcess.exited;
  if (generateExitCode !== 0) {
    throw new Error('Static imports generation failed');
  }

  console.log('✅ Step 2: Static imports generated');

  // Этап 3: Компиляция сервера в бинарник
  console.log('🚀 Step 3: Compiling to binary...');

  await $`bun build --compile scripts/server.ts --outfile ../../dist/flow-configuration-client`;

  console.log('✅ Step 3: Binary compilation completed');
  console.log('🎉 Binary ready: dist/flow-configuration-client');

} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
