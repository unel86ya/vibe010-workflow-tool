import { rmSync, existsSync } from "fs";

function safeRm(path: string) {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
    console.log(`🧹 Удалено: ${path}`);
  }
}

safeRm("./build");
safeRm("./static-imports.generated.ts"); // файл, а не папка

// По желанию, если есть временные каталоги vite/sveltekit
safeRm("./.svelte-kit");
safeRm("./.vite");

console.log("✅ Clean complete (client)");
