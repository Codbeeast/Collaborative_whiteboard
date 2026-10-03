import { Socket } from 'socket.io';
import * as Y from 'yjs';
import { ClientToServerEvents, ServerToClientEvents, SocketData } from '../../../src/types/socket';
import { ServerDocManager } from '../../crdt/serverDocManager';

export class YjsHandler {
  /**
   * Handles client's initial state vector exchange (Step 1 -> Step 2)
   */
  public static async handleSyncStep1(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>,
    stateVectorRaw: Uint8Array | ArrayBuffer
  ) {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const stateVector = new Uint8Array(stateVectorRaw);
    const doc = await ServerDocManager.getOrCreateDoc(roomId);

    // Compute update diff that the client is missing
    const missingUpdate = Y.encodeStateAsUpdate(doc, stateVector);

    // Send update back to the client
    socket.emit('yjs:sync-step2', missingUpdate);
  }

  /**
   * Handles incremental binary diff updates from a client
   */
  public static async handleUpdate(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>,
    updateRaw: Uint8Array | ArrayBuffer
  ) {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const update = new Uint8Array(updateRaw);
    const doc = await ServerDocManager.getOrCreateDoc(roomId);

    // Apply update to authoritative server doc
    Y.applyUpdate(doc, update);

    // Broadcast update to all other room members
    socket.to(roomId).emit('yjs:update', update);
  }

  /**
   * Relays awareness (presence) binary updates
   */
  public static handleAwareness(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>,
    awarenessRaw: Uint8Array | ArrayBuffer
  ) {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    // Broadcast awareness to peers
    socket.to(roomId).emit('yjs:awareness', awarenessRaw);
  }
}
