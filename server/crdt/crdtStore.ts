import * as Y from 'yjs';
import RedisManager from '../redis/client';
import { BoardRepository } from '../db/boardRepository';
import { WhiteboardElement } from '../../src/types/canvas';

export class CRDTStore {
  private static getRedisKey(boardId: string): string {
    return `board:${boardId}:yjs_doc`;
  }

  /**
   * Persists the binary state of a Y.Doc into Redis.
   */
  public static async persistDoc(boardId: string, doc: Y.Doc): Promise<void> {
    const update = Y.encodeStateAsUpdate(doc);
    const base64Update = Buffer.from(update).toString('base64');

    if (RedisManager.isConnected()) {
      try {
        const client = RedisManager.getClient();
        await client.set(this.getRedisKey(boardId), base64Update);
      } catch (err: any) {
        console.warn(`[CRDTStore] Redis error saving Y.Doc for ${boardId}:`, err.message);
      }
    }
  }

  /**
   * Hydrates a Y.Doc from Redis or PostgreSQL snapshot fallback.
   */
  public static async loadDoc(boardId: string, targetDoc: Y.Doc): Promise<boolean> {
    // 1. Try loading from Redis
    if (RedisManager.isConnected()) {
      try {
        const client = RedisManager.getClient();
        const base64Data = await client.get(this.getRedisKey(boardId));
        if (base64Data) {
          const update = Buffer.from(base64Data, 'base64');
          Y.applyUpdate(targetDoc, update);
          return true;
        }
      } catch (err: any) {
        console.warn(`[CRDTStore] Redis load error for ${boardId}:`, err.message);
      }
    }

    // 2. Cold fallback: Check PostgreSQL snapshot
    try {
      const elements = await BoardRepository.getLatestSnapshot(boardId);
      if (elements && elements.length > 0) {
        const yMap = targetDoc.getMap<WhiteboardElement>('elements');
        targetDoc.transact(() => {
          elements.forEach((el) => {
            yMap.set(el.id, el);
          });
        });
        return true;
      }
    } catch (err: any) {
      console.warn(`[CRDTStore] PostgreSQL fallback error for ${boardId}:`, err.message);
    }

    return false;
  }
}
