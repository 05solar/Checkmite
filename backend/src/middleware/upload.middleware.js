import fs from 'node:fs';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { env } from '../config/env.js';

fs.mkdirSync(env.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, env.uploadDir),
  filename: (req, file, callback) => {
    const ext = path.extname(file.originalname);
    callback(null, `${randomUUID()}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: env.uploadMaxVideoMb * 1024 * 1024,
  },
});
