import { Socket, Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents, SocketData } from '../../../src/types/socket';
import { WhiteboardElement } from '../../../src/types/canvas';
import { BoardStore } from '../../redis/boardStore';
import { SnapshotService } from '../../services/snapshotService';

export class DrawingHandler {
  public static handleCreate(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>,
    element: WhiteboardElement
  ) {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    // Persist to hot Redis store
    BoardStore.saveElement(roomId, element);
    SnapshotService.markDirty(roomId);

    // Broadcast to all other peers in the room
    socket.to(roomId).emit('element:created', element);
  }

  public static handleUpdate(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>,
    element: WhiteboardElement
  ) {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    BoardStore.saveElement(roomId, element);
    SnapshotService.markDirty(roomId);

    socket.to(roomId).emit('element:updated', element);
  }

  public static handleDelete(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>,
    elementId: string
  ) {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    BoardStore.deleteElement(roomId, elementId);
    SnapshotService.markDirty(roomId);

    socket.to(roomId).emit('element:deleted', elementId);
  }

  public static handleClear(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>
  ) {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    BoardStore.clearBoard(roomId);
    SnapshotService.markDirty(roomId);

    socket.to(roomId).emit('canvas:cleared');
  }
}
