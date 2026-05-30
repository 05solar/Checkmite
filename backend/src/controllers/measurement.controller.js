import { measurementService } from '../services/measurement.service.js';
import { parseMeasurementInput } from '../schemas/measurement.schema.js';

export const measurementController = {
  async listByBox(req, res) {
    res.json(await measurementService.listByBoxId(req.params.boxId));
  },

  async create(req, res) {
    const measurement = await measurementService.create(parseMeasurementInput(req.body));
    res.status(201).json(measurement);
  },
};
