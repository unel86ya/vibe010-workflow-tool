```
vibe010-workflow-tool
├── .gitignore
├── bun.lock
├── bunconfig.toml
├── DESCRIPTION.md
├── package.json
├── README.md
├── tsconfig.json
├── STRUCTURE.md
├── apps/
│   ├── DESCRIPTION.md
│   ├── cli/
│   │   ├── DESCRIPTION.md
│   │   ├── package.json
│   │   ├── README.md
│   │   ├── test-flow.yml
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── cli.ts
│   │       ├── DESCRIPTION.md
│   │       ├── index.ts
│   │       └── blocks/
│   │           ├── DESCRIPTION.md
│   │           ├── compute/
│   │           │   ├── const-block.ts
│   │           │   ├── DESCRIPTION.md
│   │           │   ├── function-compute.ts
│   │           │   └── variable-block.ts
│   │           ├── effects/
│   │           │   ├── console-effect.ts
│   │           │   ├── DESCRIPTION.md
│   │           │   ├── fetch-effect.ts
│   │           │   ├── file-read-effect.ts
│   │           │   ├── file-write-effect.ts
│   │           │   └── variable-effect.ts
│   │           └── events/
│   │               ├── action-event.ts
│   │               ├── DESCRIPTION.md
│   │               └── timer-event.ts
│   ├── flow-configuration-client/
│   │   ├── .gitignore
│   │   ├── DESCRIPTION.md
│   │   ├── package.json
│   │   ├── README.md
│   │   ├── static-imports.generated.d.ts
│   │   ├── svelte.config.js
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── vitest-setup-client.ts
│   │   ├── .svelte-kit/
│   │   ├── scripts/
│   │   │   ├── build.ts
│   │   │   ├── clean.ts
│   │   │   ├── generate-static-imports.ts
│   │   │   └── server.ts
│   │   ├── src/
│   │   │   ├── app.css
│   │   │   ├── app.d.ts
│   │   │   ├── app.html
│   │   │   ├── demo.spec.ts
│   │   │   ├── lib/
│   │   │   │   ├── api.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── url-utils.ts
│   │   │   │   ├── components/
│   │   │   │   │   └── ConnectionStatus.svelte
│   │   │   │   ├── context/
│   │   │   │   │   └── api-client.ts
│   │   │   │   └── icons/
│   │   │   │       └── ConnectionIcons.svelte
│   │   │   ├── lib/
│   │   │   │   ├── stores/
│   │   │   │   │   ├── api-health.svelte.ts
│   │   │   │   │   ├── connection.svelte.ts
│   │   │   │   │   └── navigator.svelte.ts
│   │   │   ├── routes/
│   │   │   │   ├── +layout.svelte
│   │   │   │   ├── +page.svelte
│   │   │   │   ├── page.svelte.test.ts
│   │   │   │   └── status/
│   │   │   │       └── +page.svelte
│   │   │   └── static/
│   │   │       └── favicon.svg
│   │   └── static/
│   │       └── favicon.svg
│   └── flow-configuration-server/
│       ├── DESCRIPTION.md
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           └── index.ts
├── docs/
│   └── BUN_INSTALLATION.md
├── packages/
│   ├── shared/
│   │   ├── DESCRIPTION.md
│   │   ├── package.json
│   │   └── src/
│   │       ├── DESCRIPTION.md
│   │       ├── index.ts
│   │       ├── types/
│   │       │   ├── block.ts
│   │       │   ├── coordinator.ts
│   │       │   ├── DESCRIPTION.md
│   │       │   ├── flow.ts
│   │       │   └── runtime.ts
│   │       └── utils/
│   │           ├── DESCRIPTION.md
│   │           ├── env-utils.ts
│   │           ├── error-utils.ts
│   │           ├── index.ts
│   ├── workflow/
│   │   ├── DESCRIPTION.md
│   │   ├── package.json
│   │   └── src/
│   │       ├── DESCRIPTION.md
│   │       ├── index.ts
│   │       ├── core/
│   │       │   ├── block-loader.ts
│   │       │   ├── block-registry.ts
│   │       │   ├── coordinator.ts
│   │       │   ├── DESCRIPTION.md
│   │       │   ├── flow-parser.ts
│   │       │   └── runtime-engine.ts
│   │       └── utils/
│   │           ├── DESCRIPTION.md
│   │           ├── logger.ts
│   │           ├── validation.ts
│   │           └── yaml-utils.ts
```