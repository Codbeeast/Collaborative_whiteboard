import RedisManager from './client';
import { WhiteboardElement } from '../../src/types/canvas';

export class BoardStore {
  // In-memory fallback if Redis container is offline
  private static memoryStore: Map<string, Map<string, WhiteboardElement>> = new Map();

  private static getRedisKey(boardId: string): string {
    return `board:${boardId}:elements`;
  }

  /**
   * Retrieves all whiteboard elements for a room.
   */
  public static async getAllElements(boardId: string): Promise<WhiteboardElement[]> {
    if (RedisManager.isConnected()) {
      try {
        const client = RedisManager.getClient();
        const rawMap = await client.hgetall(this.getRedisKey(boardId));
        if (rawMap && Object.keys(rawMap).length > 0) {
          return Object.values(rawMap).map((jsonStr) => JSON.parse(jsonStr) as WhiteboardElement);
        }
      } catch (err: any) {
        console.warn(`[BoardStore] Redis read error for ${boardId}:`, err.message);
      }
    }

    // Fallback in-memory
    const boardMap = this.memoryStore.get(boardId);
    return boardMap ? Array.from(boardMap.values()) : [];
  }

  /**
   * Saves or updates a single whiteboard element.
   */
  public static async saveElement(boardId: string, element: WhiteboardElement): Promise<void> {
    // Update in-memory
    if (!this.memoryStore.has(boardId)) {
      this.memoryStore.set(boardId, new Map());
    }
    this.memoryStore.get(boardId)!.set(element.id, element);

    // Update Redis
    if (RedisManager.isConnected()) {
      try {
        const client = RedisManager.getClient();
        await client.hset(this.getRedisKey(boardId), element.id, JSON.stringify(element));
      } catch (err: any) {
        console.warn(`[BoardStore] Redis save error for ${boardId}:`, err.message);
      }
    }
  }

  /**
   * Deletes a single element by ID.
   */
  public static async deleteElement(boardId: string, elementId: string): Promise<void> {
    const boardMap = this.memoryStore.get(boardId);
    if (boardMap) {
      boardMap.delete(elementId);
    }

    if (RedisManager.isConnected()) {
      try {
        const client = RedisManager.getClient();
        await client.hdel(this.getRedisKey(boardId), elementId);
      } catch (err: any) {
        console.warn(`[BoardStore] Redis delete error for ${boardId}:`, err.message);
      }
    }
  }

  /**
   * Clears all elements on a board.
   */
  public static async clearBoard(boardId: string): Promise<void> {
    this.memoryStore.delete(boardId);

    if (RedisManager.isConnected()) {
      try {
        const client = RedisManager.getClient();
        await client.del(this.getRedisKey(boardId));
      } catch (err: any) {
        console.warn(`[BoardStore] Redis clear error for ${boardId}:`, err.message);
      }
    }
  }

  /**
   * Hydrates memory store from a cold snapshot (e.g. loaded from PostgreSQL).
   */
  public static async hydrateFromSnapshot(boardId: string, elements: WhiteboardElement[]): Promise<void> {
    const boardMap = new Map<string, WhiteboardElement>();
    const redisEntries: Record<string, string> = {};

    elements.forEach((el) => {
      boardMap.set(el.id, el);
      redisEntries[el.id] = JSON.stringify(el);
    });

    this.memoryStore.set(boardId, boardMap);

    if (RedisManager.isConnected() && Object.keys(redisEntries).length > 0) {
      try {
        const client = RedisManager.getClient();
        await client.hset(this.getRedisKey(boardId), redisEntries);
      } catch (err: any) {
        console.warn(`[BoardStore] Failed to hydrate Redis for ${boardId}:`, err.message);
      }
    }
  }
}
