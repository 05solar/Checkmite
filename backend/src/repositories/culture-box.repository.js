import { randomUUID } from 'node:crypto';
import { pool } from '../config/database.js';
import { mapCultureBox } from '../utils/mapper.js';

export const cultureBoxRepository = {
  async findActive(client = pool) {
    const result = await client.query(
      'SELECT * FROM culture_boxes WHERE deleted_at IS NULL ORDER BY started_at DESC, created_at DESC'
    );
    return result.rows.map(mapCultureBox);
  },

  async findTrash(client = pool) {
    const result = await client.query(
      'SELECT * FROM culture_boxes WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC'
    );
    return result.rows.map(mapCultureBox);
  },

  async findById(id, client = pool) {
    const result = await client.query('SELECT * FROM culture_boxes WHERE id = $1', [id]);
    return result.rows[0] ? mapCultureBox(result.rows[0]) : null;
  },

  async create(input, client = pool) {
    const id = randomUUID();
    const result = await client.query(
      `INSERT INTO culture_boxes (id, name, started_at, memo)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, input.name, input.startedAt, input.memo || null]
    );
    return mapCultureBox(result.rows[0]);
  },

  async update(id, input, client = pool) {
    const result = await client.query(
      `UPDATE culture_boxes
       SET name = COALESCE($2, name),
           started_at = COALESCE($3, started_at),
           memo = $4,
           updated_at = now()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      [id, input.name, input.startedAt, input.memo ?? null]
    );
    return result.rows[0] ? mapCultureBox(result.rows[0]) : null;
  },

  async softDelete(id, client = pool) {
    const result = await client.query(
      `UPDATE culture_boxes
       SET deleted_at = now(), updated_at = now()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      [id]
    );
    return result.rows[0] ? mapCultureBox(result.rows[0]) : null;
  },

  async restore(id, client = pool) {
    const result = await client.query(
      `UPDATE culture_boxes
       SET deleted_at = NULL, updated_at = now()
       WHERE id = $1 AND deleted_at IS NOT NULL
       RETURNING *`,
      [id]
    );
    return result.rows[0] ? mapCultureBox(result.rows[0]) : null;
  },
};
