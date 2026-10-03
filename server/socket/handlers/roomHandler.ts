import { Socket, Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents, SocketData } from '../../../src/types/socket';
import { UserPresence, UserProfile } from '../../../src/types/user';
import { BoardStore } from '../../redis/boardStore';
import { BoardRepository } from '../../db/boardRepository';
import { SnapshotService } from '../../services/snapshotService';

export class RoomHandler {
  // Map of roomId -> Map of socketId -> UserPresence
  private static roomPresence: Map<string, Map<string, UserPresence>> = new Map();

  public static handleJoin(
    io: Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>,
    socket: Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>,
    payload: { roomId: string; user: UserProfile }
  ) {
    const { roomId, user } = payload;

    // Save metadata on socket session
    socket.data.roomId = roomId;
    socket.data.user = user;

    socket.join(roomId);

    // Initialize room presence tracker if needed
    if (!this.roomPresence.has(roomId)) {
      this.roomPresence.set(roomId, new Map());
    }

    const presence: UserPresence = {
      user,
      cursor: null,
      selectedElementIds: [],
      lastActive: Date.now(),
    };

    this.roomPresence.get(roomId)!.set(socket.id, presence);

    // Fetch existing board elements from Redis (or fallback to DB)
    (async () => {
      let elements = await BoardStore.getAllElements(roomId);

      // Cold recovery: if Redis has no elements, check PostgreSQL snapshot
      if (elements.length === 0) {
        const dbElements = await BoardRepository.getLatestSnapshot(roomId);
        if (dbElements.length > 0) {
          await BoardStore.hydrateFromSnapshot(roomId, dbElements);
          elements = dbElements;
        }
      }

      // Send initial board state and active users to the connecting client
      const activeUsers = Array.from(this.roomPresence.get(roomId)!.values());
      socket.emit('room:init', {
        roomId,
        elements,
        users: activeUsers,
      });

      // Notify others in room
      socket.to(roomId).emit('user:joined', presence);
    })().catch((err) => {
      console.error('[RoomHandler] Join error:', err);
    });
  }

  public static handleLeave(
    io: Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>,
    socket: Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>
  ) {
    const roomId = socket.data.roomId;
    const user = socket.data.user;

    if (!roomId || !user) return;

    const roomMap = this.roomPresence.get(roomId);
    if (roomMap) {
      roomMap.delete(socket.id);

      // If room is now empty, immediately flush snapshot to PostgreSQL
      if (roomMap.size === 0) {
        this.roomPresence.delete(roomId);
        SnapshotService.flushImmediate(roomId);
      }
    }

    socket.to(roomId).emit('user:left', user.id);
    socket.leave(roomId);

    socket.data.roomId = undefined;
    socket.data.user = undefined;
  }

  public static getPresence(roomId: string, socketId: string): UserPresence | undefined {
    return this.roomPresence.get(roomId)?.get(socketId);
  }
}
