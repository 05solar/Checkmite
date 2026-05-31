import { analysisService } from '../services/analysis.service.js';
import { parseAnalysisInput } from '../schemas/analysis.schema.js';

export const analysisController = {
  async density(req, res) {
    const result = await analysisService.startDensity(parseAnalysisInput(req.body), req.files || []);
    res.status(202).json(result);
  },

  async densityProgress(req, res) {
    const result = analysisService.getDensityProgress(req.params.jobId);
    res.json(result);
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
