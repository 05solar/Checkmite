import { randomUUID } from 'node:crypto';
import { pool } from '../config/database.js';

export const uploadedFileRepository = {
  async create(input, client = pool) {
    const result = await client.query(
      `INSERT INTO uploaded_files (
         id, culture_box_id, original_name, mime_type, file_size, storage_path, checksum
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        randomUUID(),
        input.boxId,
        input.originalName,
        input.mimeType,
        input.fileSize,
        input.storagePath,
        input.checksum || null,
      ]
    );
    return result.rows[0];
  },
};
