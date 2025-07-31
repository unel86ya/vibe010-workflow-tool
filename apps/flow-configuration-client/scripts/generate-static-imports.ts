// Генерирует TypeScript файл со всеми статическими импортами
// Это нужно для встраивания файлов в бинарник
import { readdirSync, statSync, writeFileSync } from 'fs';
import { join, relative, posix } from 'path';

const BUILD_DIR = './build';
const OUTPUT_FILE = './static-imports.generated.ts';

function getAllFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = [];

  try {
    const items = readdirSync(dir);

    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...getAllFiles(fullPath, baseDir));
      } else {
        const relativePath = relative(baseDir, fullPath);
        files.push(relativePath);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}:`, error);
  }

  return files;
}

console.log('🔧 Generating static imports...');

const staticFiles = getAllFiles(BUILD_DIR);

if (staticFiles.length === 0) {
  console.error('❌ No files found in build directory. Run "bun run build" first.');
  process.exit(1);
}

// Генерируем TypeScript код с импортами
let tsCode = `// Auto-generated file - do not edit manually
// Generated from ${BUILD_DIR} directory

`;

// Импорты всех файлов с type: "file"
staticFiles.forEach((filePath, index) => {
  const normalizedPath = posix.normalize(filePath);
  tsCode += `import file${index} from "${BUILD_DIR}/${normalizedPath}" with { type: "file" };\n`;
});

tsCode += `
// Экспортируем мап файлов для сервера
console.log('file0', file0, typeof file0);
export const staticFilesMap = new Map<string, Blob>([
`;

staticFiles.forEach((filePath, index) => {
  const urlPath = '/' + posix.normalize(filePath.replace(/\\/g, '/'));
  tsCode += `  ["${urlPath}", file${index}],\n`;
});

tsCode += `]);

// Информация о файлах
export const staticFilesInfo = {
  totalFiles: ${staticFiles.length},
  buildDir: "${BUILD_DIR}",
  files: [
`;

staticFiles.forEach((filePath) => {
  const urlPath = '/' + posix.normalize(filePath.replace(/\\/g, '/'));
  tsCode += `    "${urlPath}",\n`;
});

tsCode += `  ]
};

console.log(\`📦 Loaded \${staticFilesMap.size} static files into binary\`);
`;

writeFileSync(OUTPUT_FILE, tsCode);

console.log(`✅ Generated ${OUTPUT_FILE} with ${staticFiles.length} files`);
console.log('📝 Files included:');
staticFiles.forEach(file => {
  console.log(`  - /${file.replace(/\\/g, '/')}`);
});
