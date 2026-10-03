import * as Y from 'yjs';
import { CRDTStore } from './crdtStore';
import { SnapshotService } from '../services/snapshotService';
import { WhiteboardElement } from '../../src/types/canvas';

export class ServerDocManager {
  private static docs: Map<string, Y.Doc> = new Map();

  /**
   * Gets or initializes an authoritative Y.Doc for a room.
   */
  public static async getOrCreateDoc(roomId: string): Promise<Y.Doc> {
    let doc = this.docs.get(roomId);
    if (doc) return doc;

    doc = new Y.Doc();
    this.docs.set(roomId, doc);

    // Hydrate existing document state if stored
    await CRDTStore.loadDoc(roomId, doc);

    // On any mutation, mark dirty for snapshots and persist to Redis
    doc.on('update', async (update: Uint8Array) => {
      await CRDTStore.persistDoc(roomId, doc!);
      SnapshotService.markDirty(roomId);
    });

    return doc;
  }

  /**
   * Retrieves all vector elements from the room's Y.Doc.
   */
  public static getElements(doc: Y.Doc): WhiteboardElement[] {
    const yElements = doc.getMap<WhiteboardElement>('elements');
    const elements: WhiteboardElement[] = [];
    yElements.forEach((val) => elements.push(val));
    return elements;
  }

  /**
   * Removes in-memory doc when all clients disconnect.
   */
  public static removeDoc(roomId: string): void {
    const doc = this.docs.get(roomId);
    if (doc) {
      doc.destroy();
      this.docs.delete(roomId);
    }
  }
}
