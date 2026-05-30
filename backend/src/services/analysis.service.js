import { withTransaction } from '../config/database.js';
import { analysisJobRepository } from '../repositories/analysis-job.repository.js';
import { cultureBoxRepository } from '../repositories/culture-box.repository.js';
import { measurementRepository } from '../repositories/measurement.repository.js';
import { uploadedFileRepository } from '../repositories/uploaded-file.repository.js';
import { notFound } from '../utils/http-error.js';
import { modelRuntimeService } from './model-runtime.service.js';

const createUploadedFile = async (file, boxId, client) => {
  if (!file) return null;
  return uploadedFileRepository.create(
    {
      boxId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      storagePath: file.path,
    },
    client
  );
};

export const analysisService = {
  async runDensity(input, file) {
    const box = await cultureBoxRepository.findById(input.boxId);
    if (!box || box.deletedAt) throw notFound('활성 사육박스를 찾을 수 없습니다.');

    const modelResult = await modelRuntimeService.inferDensity({
      cultureBoxId: input.boxId,
      filePath: file?.path,
      measuredAt: input.measuredAt,
      measuredAreaCm2: input.measuredAreaCm2,
    });

    const countValue = Number(modelResult.countValue ?? modelResult.peakCount ?? 0);
    const measuredAreaCm2 = Number(input.measuredAreaCm2 || modelResult.measuredAreaCm2 || 12);
    const densityPerCm2 = Number((countValue / measuredAreaCm2).toFixed(3));

    return withTransaction(async (client) => {
      const uploadedFile = await createUploadedFile(file, input.boxId, client);
      const job = await analysisJobRepository.create(
        { boxId: input.boxId, uploadedFileId: uploadedFile?.id, type: 'density' },
        client
      );
      await analysisJobRepository.markProcessing(job.id, client);

      const measurement = await measurementRepository.create(
        {
          boxId: input.boxId,
          analysisJobId: job.id,
          type: 'density',
          measuredAt: input.measuredAt,
          countValue,
          densityPerCm2,
          resultJson: modelResult,
        },
        client
      );

      await measurementRepository.createDensityResult(
        {
          measurementId: measurement.id,
          measuredAreaCm2,
          peakCount: modelResult.peakCount ?? countValue,
          averageCount: modelResult.averageCount,
          densityPerCm2,
          densityGrade: modelResult.densityGrade,
        },
        client
      );

      await analysisJobRepository.markCompleted(job.id, client);

      return {
        measurementId: measurement.id,
        boxId: input.boxId,
        type: 'density',
        measuredAt: measurement.measuredAt,
        density: {
          currentDensityPerCm2: densityPerCm2,
          measuredAreaCm2,
          peakCount: modelResult.peakCount ?? countValue,
          averageCount: modelResult.averageCount,
        },
        measurement,
      };
    });
  },

  async runVitality(input, file) {
    const box = await cultureBoxRepository.findById(input.boxId);
    if (!box || box.deletedAt) throw notFound('활성 사육박스를 찾을 수 없습니다.');

    const modelResult = await modelRuntimeService.inferVitality({
      cultureBoxId: input.boxId,
      filePath: file?.path,
      measuredAt: input.measuredAt,
    });

    return withTransaction(async (client) => {
      const uploadedFile = await createUploadedFile(file, input.boxId, client);
      const job = await analysisJobRepository.create(
        { boxId: input.boxId, uploadedFileId: uploadedFile?.id, type: 'vitality' },
        client
      );
      await analysisJobRepository.markProcessing(job.id, client);

      const measurement = await measurementRepository.create(
        {
          boxId: input.boxId,
          analysisJobId: job.id,
          type: 'vitality',
          measuredAt: input.measuredAt,
          vitalityScore: Number(modelResult.vitalityScore ?? modelResult.score ?? 0),
          activeRatio: modelResult.activeRatio,
          resultJson: modelResult,
        },
        client
      );

      await measurementRepository.createVitalityResult(
        {
          measurementId: measurement.id,
          vitalityScore: measurement.vitalityScore,
          activeRatio: measurement.activeRatio,
          averageSpeedMmPerSec: modelResult.averageSpeedMmPerSec,
        },
        client
      );

      await analysisJobRepository.markCompleted(job.id, client);

      return {
        measurementId: measurement.id,
        boxId: input.boxId,
        type: 'vitality',
        measuredAt: measurement.measuredAt,
        vitality: {
          score: measurement.vitalityScore,
          activeRatio: measurement.activeRatio,
          trend: modelResult.trend || [],
        },
        measurement,
      };
    });
  },

  async runDetection(input, file) {
    const box = await cultureBoxRepository.findById(input.boxId);
    if (!box || box.deletedAt) throw notFound('활성 사육박스를 찾을 수 없습니다.');

    const modelResult = await modelRuntimeService.inferDetection({
      cultureBoxId: input.boxId,
      filePath: file?.path,
      measuredAt: input.measuredAt,
    });

    return withTransaction(async (client) => {
      const uploadedFile = await createUploadedFile(file, input.boxId, client);
      const job = await analysisJobRepository.create(
        { boxId: input.boxId, uploadedFileId: uploadedFile?.id, type: 'detection' },
        client
      );
      await analysisJobRepository.markProcessing(job.id, client);

      const measurement = await measurementRepository.create(
        {
          boxId: input.boxId,
          analysisJobId: job.id,
          type: 'detection',
          measuredAt: input.measuredAt,
          countValue: modelResult.countValue,
          resultJson: modelResult,
        },
        client
      );

      await measurementRepository.createDetectionBoxes(measurement.id, modelResult.boxes || [], client);
      await analysisJobRepository.markCompleted(job.id, client);

      return {
        measurementId: measurement.id,
        boxId: input.boxId,
        type: 'detection',
        measuredAt: measurement.measuredAt,
        detection: {
          countValue: measurement.countValue,
          boxes: modelResult.boxes || [],
        },
        measurement,
      };
    });
  },
};
