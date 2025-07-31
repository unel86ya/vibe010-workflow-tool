# llm-workflow-tool

LLM workflow tool: CLI + configuration UI + API server

## Структура

```
├── apps/
│   ├── cli/                         # CLI runner
│   ├── flow-configuration-server/   # Config API
│   └── flow-configuration-client/   # Config UI (SvelteKit)
└── packages/
    ├── shared/                      # Shared utils
    └── workflow/                    # Flow engine
```

## Зависимости
проект требует Bun, подробности по его установке описаны в [BUN_INSTALLATION.md](docs/BUN_INSTALLATION.md)

## Разработка

```sh
bun install
bun dev
```
