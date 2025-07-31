
// apps/flow-configuration-server/src/index.ts
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';

const PORT = parseInt(process.env.PORT ?? '8787', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

const app = new Elysia()
  .use(cors({
    origin: '*',
    credentials: true,
  }))
  .group('/v1', app =>
    app.group('/status', app =>
      app.get('/health', () => ({
          status: 'ok',
          timestamp: Date.now(),
          service: 'flow-configuration-server'
      }))
    )

    // Flows API
    .get('/flows', () => ({ flows: [] }))
    .post('/flows', ({ body }) => ({ success: true, flow: body }))
    .get('/flows/:name', ({ params: { name } }) => ({ flow: name }))
    .put('/flows/:name', ({ params: { name }, body }) => ({ updated: name }))
    .delete('/flows/:name', ({ params: { name } }) => ({ deleted: name }))

    // Context modules API
    .get('/context-modules', () => ({ modules: [] }))
    .put('/context-modules/:name', ({ params: { name }, body }) => ({ saved: name }))
  )

  .listen({
    port: PORT,
    hostname: HOST,
  });

console.log(`🔥 Flow Configuration Server running on http://${HOST}:${PORT}`);

export type App = typeof app;
