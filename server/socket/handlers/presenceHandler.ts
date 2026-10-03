import { Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents, SocketData } from '../../../src/types/socket';
import { Point } from '../../../src/types/canvas';
import { RoomHandler } from './roomHandler';

export class PresenceHandler {
  public static handleCursor(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>,
    cursor: Point | null
  ) {
    const roomId = socket.data.roomId;
    const user = socket.data.user;
    if (!roomId || !user) return;

    // Update in-memory presence
    const presence = RoomHandler.getPresence(roomId, socket.id);
    if (presence) {
      presence.cursor = cursor;
      presence.lastActive = Date.now();
    }

    // Broadcast cursor position in world space to peers
    socket.to(roomId).emit('presence:update', {
      userId: user.id,
      cursor,
    });
  }

  public static handleSelection(
    socket: Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>,
    elementIds: string[]
  ) {
    const roomId = socket.data.roomId;
    const user = socket.data.user;
    if (!roomId || !user) return;

    const presence = RoomHandler.getPresence(roomId, socket.id);
    if (presence) {
      presence.selectedElementIds = elementIds;
      presence.lastActive = Date.now();
    }

    socket.to(roomId).emit('presence:update', {
      userId: user.id,
      selectedElementIds: elementIds,
    });
  }
}
