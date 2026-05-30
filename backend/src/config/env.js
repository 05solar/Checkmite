import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ quiet: true });

const numberFromEnv = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: numberFromEnv('PORT', 3000),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://checkmite:password@127.0.0.1:5432/checkmite',
  uploadDir: path.resolve(process.env.UPLOAD_DIR || 'uploads'),
  uploadMaxImageMb: numberFromEnv('UPLOAD_MAX_IMAGE_MB', 20),
  uploadMaxVideoMb: numberFromEnv('UPLOAD_MAX_VIDEO_MB', 500),
  modelRuntimeUrl: process.env.MODEL_RUNTIME_URL || 'http://127.0.0.1:8000',
  modelRuntimeRequired: process.env.MODEL_RUNTIME_REQUIRED === 'true',
  frontendDistDir: path.resolve(process.env.FRONTEND_DIST_DIR || 'dist'),
};
