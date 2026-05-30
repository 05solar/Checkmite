import { Router } from 'express';
import { measurementController } from '../controllers/measurement.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

export const measurementRoutes = Router();

measurementRoutes.post('/', asyncHandler(measurementController.create));
