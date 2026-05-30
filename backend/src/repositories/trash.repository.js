import { randomUUID } from 'node:crypto';
import { pool } from '../config/database.js';

export const trashRepository = {
  async createEvent(input, client = pool) {
    const result = await client.query(
      `INSERT INTO trash_events (id, entity_type, entity_id, action, payload)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [randomUUID(), input.entityType, input.entityId, input.action, input.payload || {}]
    );
    return result.rows[0];
  },
};
