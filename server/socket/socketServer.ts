import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents, SocketData } from '../../src/types/socket';
import { RoomHandler } from './handlers/roomHandler';
import { DrawingHandler } from './handlers/drawingHandler';
import { PresenceHandler } from './handlers/presenceHandler';
import { YjsHandler } from './handlers/yjsHandler';

export class SocketServer {
  private static io: Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData> | null = null;

  public static init(httpServer: HttpServer): Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData> {
    if (this.io) return this.io;

    this.io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(httpServer, {
      path: '/api/socket',
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      pingTimeout: 20000,
      pingInterval: 10000,
    });

    this.io.on('connection', (socket) => {
      // 1. Room management
      socket.on('room:join', (payload) => {
        RoomHandler.handleJoin(this.io!, socket, payload);
      });

      socket.on('room:leave', () => {
        RoomHandler.handleLeave(this.io!, socket);
      });

      // 2. Drawing mutations
      socket.on('element:create', (element) => {
        DrawingHandler.handleCreate(socket, element);
      });

      socket.on('element:update', (element) => {
        DrawingHandler.handleUpdate(socket, element);
      });

      socket.on('element:delete', (elementId) => {
        DrawingHandler.handleDelete(socket, elementId);
      });

      socket.on('canvas:clear', () => {
        DrawingHandler.handleClear(socket);
      });

      // 3. Ephemeral presence
      socket.on('presence:cursor', (cursor) => {
        PresenceHandler.handleCursor(socket, cursor);
      });

      socket.on('presence:selection', (elementIds) => {
        PresenceHandler.handleSelection(socket, elementIds);
      });

      // 4. Yjs CRDT Synchronization
      socket.on('yjs:sync-step1', (stateVector) => {
        YjsHandler.handleSyncStep1(socket, stateVector);
      });

      socket.on('yjs:update', (update) => {
        YjsHandler.handleUpdate(socket, update);
      });

      socket.on('yjs:awareness', (awareness) => {
        YjsHandler.handleAwareness(socket, awareness);
      });

      // 5. Disconnect cleanup
      socket.on('disconnect', () => {
        RoomHandler.handleLeave(this.io!, socket);
      });
    });

    console.log('[SocketServer]: Socket.io gateway initialized on path /api/socket');
    return this.io;
  }

  public static getIO() {
    return this.io;
  }
}
