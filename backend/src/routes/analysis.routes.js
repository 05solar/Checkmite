import { Router } from 'express';
import { analysisController } from '../controllers/analysis.controller.js';
import { upload } from '../middleware/upload.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';

export const analysisRoutes = Router();

analysisRoutes.post('/density', upload.array('files'), asyncHandler(analysisController.density));
analysisRoutes.get('/density/:jobId/progress', asyncHandler(analysisController.densityProgress));
analysisRoutes.post('/vitality', upload.single('file'), asyncHandler(analysisController.vitality));
analysisRoutes.post('/detection', upload.single('file'), asyncHandler(analysisController.detection));
