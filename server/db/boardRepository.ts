import DatabaseClient from './client';
import { WhiteboardElement } from '../../src/types/canvas';

export interface BoardRecord {
  id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
}

export class BoardRepository {
  /**
   * Ensures a board record exists in PostgreSQL.
   */
  public static async ensureBoardExists(boardId: string, title?: string): Promise<BoardRecord | null> {
    const pool = DatabaseClient.getPool();
    try {
      const result = await pool.query(
        `INSERT INTO boards (id, title)
         VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
         RETURNING id, title, created_at, updated_at`,
        [boardId, title || 'Collaborative Whiteboard']
      );
      return result.rows[0];
    } catch (err: any) {
      console.warn(`[BoardRepository Warning]: Failed to ensure board ${boardId}:`, err.message);
      return null;
    }
  }

  /**
   * Retrieves the most recent snapshot elements from PostgreSQL for cold recovery.
   */
  public static async getLatestSnapshot(boardId: string): Promise<WhiteboardElement[]> {
    const pool = DatabaseClient.getPool();
    try {
      const result = await pool.query(
        `SELECT elements FROM board_snapshots
         WHERE board_id = $1
         ORDER BY saved_at DESC
         LIMIT 1`,
        [boardId]
      );

      if (result.rows.length > 0 && Array.isArray(result.rows[0].elements)) {
        return result.rows[0].elements as WhiteboardElement[];
      }
      return [];
    } catch (err: any) {
      console.warn(`[BoardRepository Warning]: Failed to fetch snapshot for ${boardId}:`, err.message);
      return [];
    }
  }

  /**
   * Persists a complete snapshot of board elements as JSONB.
   */
  public static async saveSnapshot(boardId: string, elements: WhiteboardElement[]): Promise<boolean> {
    const pool = DatabaseClient.getPool();
    try {
      await this.ensureBoardExists(boardId);
      await pool.query(
        `INSERT INTO board_snapshots (board_id, elements)
         VALUES ($1, $2::jsonb)`,
        [boardId, JSON.stringify(elements)]
      );
      return true;
    } catch (err: any) {
      console.warn(`[BoardRepository Warning]: Failed to save snapshot for ${boardId}:`, err.message);
      return false;
    }
  }
}
