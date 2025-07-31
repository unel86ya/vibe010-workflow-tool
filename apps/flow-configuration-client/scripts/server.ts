// Статический сервер для SPA с встроенными файлами
import { serve, type ServeOptions, type BunFile } from 'bun';
import { staticFilesMap, staticFilesInfo } from '../static-imports.generated';

function toBlob(val: any): Blob | BunFile {
  if (typeof val === 'string') return Bun.file(val); // будет работать с $bunfs-путём
  return val;
}

// Функция для определения MIME типа
function getMimeType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'html': 'text/html; charset=utf-8',
    'js': 'application/javascript; charset=utf-8',
    'css': 'text/css; charset=utf-8',
    'json': 'application/json; charset=utf-8',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'webp': 'image/webp',
    'gif': 'image/gif'
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

// Конфигурация сервера
const PORT = parseInt(process.env.PORT || '5173');
const HOST = process.env.HOST || '0.0.0.0';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8787/v1';


console.log('🔥 Flow Configuration Client starting...');
console.log(`📡 Server: http://${HOST}:${PORT}`);
console.log(`📦 Static files: ${staticFilesInfo.totalFiles} files embedded`);
console.log(`🔄 SPA mode: fallback to index.html`);

const serverOptions: ServeOptions = {
  port: PORT,
  hostname: HOST,

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    let pathname = url.pathname;

    // Логирование запросов
    console.log(`${new Date().toISOString()} ${request.method} ${pathname}`);

    if (pathname === '/env.js') {
      return new Response(
        `window.API_BASE_URL = "${API_BASE_URL}";`,
        { headers: { 'Content-Type': 'application/javascript' } }
      );
   }


    // Нормализация пути
    if (pathname === '/') {
      pathname = '/index.html';
    }

    // Попытка найти файл
    let staticFile = staticFilesMap.get(pathname);

    // SPA fallback - для неизвестных путей без расширения возвращаем index.html
    if (!staticFile) {
        console.warn('[static-server] Fallback to /index.html for', pathname);
        if (staticFilesMap.has('/index.html')) {
            staticFile = staticFilesMap.get('/index.html');
            pathname = '/index.html';
        } else {
            // Для dev-диагностики:
            console.error('No /index.html found in staticFilesMap!');
        }
    }

    if (staticFile) {
        const contentType = getMimeType(pathname);
        const isIndexHtml = pathname === '/index.html';
        const blob = toBlob(staticFile);

        return new Response(blob, {
            headers: {
            'Content-Type': contentType,
            'Cache-Control': isIndexHtml
                ? 'no-cache, no-store, must-revalidate'
                : 'public, max-age=31536000, immutable',
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin',
            ...(blob.size && { 'Content-Length': blob.size.toString() })
            }
        });
    }


    // 404 для неизвестных файлов
    return new Response('Not Found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    });
  },

  error(error: Error): Response {
    console.error('Server error:', error);
    return new Response('Internal Server Error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};

// Запуск сервера
const server = serve(serverOptions);

console.log(`✅ Flow Configuration Client ready!`);
console.log(`📁 Available routes:`);
staticFilesInfo.files.slice(0, 10).forEach(file => {
  console.log(`  • ${file}`);
});
if (staticFilesInfo.files.length > 10) {
  console.log(`  ... and ${staticFilesInfo.files.length - 10} more files`);
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.stop();
  process.exit(0);
});
