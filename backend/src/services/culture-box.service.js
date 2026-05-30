import { withTransaction } from '../config/database.js';
import { cultureBoxRepository } from '../repositories/culture-box.repository.js';
import { measurementRepository } from '../repositories/measurement.repository.js';
import { trashRepository } from '../repositories/trash.repository.js';
import { notFound } from '../utils/http-error.js';

export const cultureBoxService = {
  list() {
    return cultureBoxRepository.findActive();
  },

  async create(input) {
    return cultureBoxRepository.create(input);
  },

  async update(id, input) {
    const box = await cultureBoxRepository.update(id, input);
    if (!box) throw notFound('사육박스를 찾을 수 없습니다.');
    return box;
  },

  async delete(id) {
    return withTransaction(async (client) => {
      const box = await cultureBoxRepository.softDelete(id, client);
      if (!box) throw notFound('삭제할 사육박스를 찾을 수 없습니다.');

      const measurements = await measurementRepository.findByBoxId(id, client);
      await trashRepository.createEvent(
        {
          entityType: 'culture_box',
          entityId: id,
          action: 'deleted',
          payload: { box, measurements },
        },
        client
      );

      return { box, measurements };
    });
  },
};
