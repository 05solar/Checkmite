import { growthService } from '../services/growth.service.js';

export const growthController = {
  async getByBox(req, res) {
    res.json(await growthService.getGrowth(req.params.boxId, req.query));
  },
};
