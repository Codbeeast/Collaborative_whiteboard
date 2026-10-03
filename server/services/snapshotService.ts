import { BoardStore } from '../redis/boardStore';
import { BoardRepository } from '../db/boardRepository';

export class SnapshotService {
  private static dirtyBoards: Set<string> = new Set();
  private static intervalHandle: NodeJS.Timeout | null = null;
  private static readonly FLUSH_INTERVAL_MS = 15000; // 15 seconds

  /**
   * Starts the background periodic flush timer.
   */
  public static start(): void {
    if (this.intervalHandle) return;

    this.intervalHandle = setInterval(() => {
      this.flushDirtyBoards();
    }, this.FLUSH_INTERVAL_MS);

    console.log('[SnapshotService]: Background debounced snapshot flusher initialized.');
  }

  /**
   * Stops the background timer.
   */
  public static stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  /**
   * Marks a board as modified so it will be saved on the next flush.
   */
  public static markDirty(boardId: string): void {
    this.dirtyBoards.add(boardId);
  }

  /**
   * Flushes all boards marked as dirty into PostgreSQL.
   */
  public static async flushDirtyBoards(): Promise<void> {
    if (this.dirtyBoards.size === 0) return;

    const boardIdsToFlush = Array.from(this.dirtyBoards);
    this.dirtyBoards.clear();

    for (const boardId of boardIdsToFlush) {
      try {
        const elements = await BoardStore.getAllElements(boardId);
        await BoardRepository.saveSnapshot(boardId, elements);
      } catch (err: any) {
        console.warn(`[SnapshotService]: Error flushing snapshot for board ${boardId}:`, err.message);
        // Re-queue dirty board
        this.dirtyBoards.add(boardId);
      }
    }
  }

  /**
   * Flushes a specific board immediately (e.g., when the last user leaves the room).
   */
  public static async flushImmediate(boardId: string): Promise<void> {
    try {
      const elements = await BoardStore.getAllElements(boardId);
      await BoardRepository.saveSnapshot(boardId, elements);
      this.dirtyBoards.delete(boardId);
    } catch (err: any) {
      console.warn(`[SnapshotService]: Immediate flush failed for ${boardId}:`, err.message);
    }
  }
}
