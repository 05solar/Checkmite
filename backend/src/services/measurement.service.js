import { cultureBoxRepository } from '../repositories/culture-box.repository.js';
import { measurementRepository } from '../repositories/measurement.repository.js';
import { notFound } from '../utils/http-error.js';

export const measurementService = {
  async listByBoxId(boxId) {
    const box = await cultureBoxRepository.findById(boxId);
    if (!box) throw notFound('사육박스를 찾을 수 없습니다.');
    return measurementRepository.findByBoxId(boxId);
  },

  async create(input) {
    const box = await cultureBoxRepository.findById(input.boxId);
    if (!box || box.deletedAt) throw notFound('활성 사육박스를 찾을 수 없습니다.');
    return measurementRepository.create(input);
  },
};
