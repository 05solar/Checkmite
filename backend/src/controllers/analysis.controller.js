import { analysisService } from '../services/analysis.service.js';
import { parseAnalysisInput } from '../schemas/analysis.schema.js';

export const analysisController = {
  async density(req, res) {
    const result = await analysisService.runDensity(parseAnalysisInput(req.body), req.file);
    res.status(201).json(result);
  },

  async vitality(req, res) {
    const result = await analysisService.runVitality(parseAnalysisInput(req.body), req.file);
    res.status(201).json(result);
  },

  async detection(req, res) {
    const result = await analysisService.runDetection(parseAnalysisInput(req.body), req.file);
    res.status(201).json(result);
  },
};
