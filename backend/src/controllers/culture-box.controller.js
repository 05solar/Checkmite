import { cultureBoxService } from '../services/culture-box.service.js';
import { parseCultureBoxInput } from '../schemas/culture-box.schema.js';

export const cultureBoxController = {
  async list(req, res) {
    res.json(await cultureBoxService.list());
  },

  async create(req, res) {
    const box = await cultureBoxService.create(parseCultureBoxInput(req.body));
    res.status(201).json(box);
  },

  async update(req, res) {
    const box = await cultureBoxService.update(req.params.id, parseCultureBoxInput(req.body));
    res.json(box);
  },

  async delete(req, res) {
    const result = await cultureBoxService.delete(req.params.id);
    res.json(result);
  },
};
