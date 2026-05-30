import { trashService } from '../services/trash.service.js';

export const trashController = {
  async listCultureBoxes(req, res) {
    res.json(await trashService.listCultureBoxes());
  },

  async restoreCultureBox(req, res) {
    res.json(await trashService.restoreCultureBox(req.params.id));
  },
};
