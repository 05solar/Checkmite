import { withTransaction } from '../config/database.js';
import { cultureBoxRepository } from '../repositories/culture-box.repository.js';
import { measurementRepository } from '../repositories/measurement.repository.js';
import { trashRepository } from '../repositories/trash.repository.js';
import { notFound } from '../utils/http-error.js';

export const trashService = {
  async listCultureBoxes() {
    const boxes = await cultureBoxRepository.findTrash();
    return Promise.all(
      boxes.map(async (box) => ({
        box,
        measurements: await measurementRepository.findByBoxId(box.id),
        deletedAt: box.deletedAt,
      }))
    );
  },

  async restoreCultureBox(id) {
    return withTransaction(async (client) => {
      const box = await cultureBoxRepository.restore(id, client);
      if (!box) throw notFound('복구할 사육박스를 찾을 수 없습니다.');

      const measurements = await measurementRepository.findByBoxId(id, client);
      await trashRepository.createEvent(
        {
          entityType: 'culture_box',
          entityId: id,
          action: 'restored',
          payload: { box, measurements },
        },
        client
      );

      return { box, measurements };
    });
  },
};
