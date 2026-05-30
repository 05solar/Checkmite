import { Router } from 'express';
import { trashController } from '../controllers/trash.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

export const trashRoutes = Router();

trashRoutes.get('/culture-boxes', asyncHandler(trashController.listCultureBoxes));
trashRoutes.post('/culture-boxes/:id/restore', asyncHandler(trashController.restoreCultureBox));
