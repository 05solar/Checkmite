import { createApp } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/database.js';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`CheckMite backend listening on http://localhost:${env.port}`);
});

const shutdown = async () => {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
