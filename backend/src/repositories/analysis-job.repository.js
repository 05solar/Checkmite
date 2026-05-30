import { randomUUID } from 'node:crypto';
import { pool } from '../config/database.js';

export const analysisJobRepository = {
  async create(input, client = pool) {
    const result = await client.query(
      `INSERT INTO analysis_jobs (id, culture_box_id, uploaded_file_id, type, status)
       VALUES ($1, $2, $3, $4, 'queued')
       RETURNING *`,
      [randomUUID(), input.boxId, input.uploadedFileId || null, input.type]
    );
    return result.rows[0];
  },

  async markProcessing(id, client = pool) {
    await client.query(
      `UPDATE analysis_jobs SET status = 'processing', started_at = now() WHERE id = $1`,
      [id]
    );
  },

  async markCompleted(id, client = pool) {
    await client.query(
      `UPDATE analysis_jobs SET status = 'completed', completed_at = now() WHERE id = $1`,
      [id]
    );
  },

  async markFailed(id, message, client = pool) {
    await client.query(
      `UPDATE analysis_jobs
       SET status = 'failed', error_message = $2, completed_at = now()
       WHERE id = $1`,
      [id, message]
    );
  },
};
