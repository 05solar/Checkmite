import { Router } from 'express';
import { cultureBoxController } from '../controllers/culture-box.controller.js';
import { measurementController } from '../controllers/measurement.controller.js';
import { growthController } from '../controllers/growth.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

export const cultureBoxRoutes = Router();

cultureBoxRoutes.get('/', asyncHandler(cultureBoxController.list));
cultureBoxRoutes.post('/', asyncHandler(cultureBoxController.create));
cultureBoxRoutes.patch('/:id', asyncHandler(cultureBoxController.update));
cultureBoxRoutes.delete('/:id', asyncHandler(cultureBoxController.delete));
cultureBoxRoutes.get('/:boxId/measurements', asyncHandler(measurementController.listByBox));
cultureBoxRoutes.get('/:boxId/growth', asyncHandler(growthController.getByBox));
