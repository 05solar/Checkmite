import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { pool } from './config/database.js';
import { swaggerSpec } from './config/swagger.js';
import { analysisRoutes } from './routes/analysis.routes.js';
import { cultureBoxRoutes } from './routes/culture-box.routes.js';
import { measurementRoutes } from './routes/measurement.routes.js';
import { trashRoutes } from './routes/trash.routes.js';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware.js';

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));

  app.get('/api/health', async (req, res) => {
    await pool.query('SELECT 1');
    res.json({ ok: true, service: 'checkmite-backend' });
  });

  app.use('/uploads', express.static(env.uploadDir));

  app.use('/api/culture-boxes', cultureBoxRoutes);
  app.use('/api/analysis', analysisRoutes);
  app.use('/api/measurements', measurementRoutes);
  app.use('/api/trash', trashRoutes);

  if (fs.existsSync(env.frontendDistDir)) {
    app.use(express.static(env.frontendDistDir));
    app.get(/.*/, (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(env.frontendDistDir, 'index.html'));
    });
  }

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};
