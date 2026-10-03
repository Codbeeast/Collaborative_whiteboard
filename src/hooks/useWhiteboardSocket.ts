'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '../types/socket';
import { Point, WhiteboardElement } from '../types/canvas';
import { UserPresence, UserProfile } from '../types/user';

interface UseWhiteboardSocketProps {
  roomId: string;
  user: UserProfile;
}

export function useWhiteboardSocket({ roomId, user }: UseWhiteboardSocketProps) {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const [remoteUsers, setRemoteUsers] = useState<UserPresence[]>([]);

  useEffect(() => {
    // Connect to WebSocket gateway
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
      path: '/api/socket',
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Join room upon connection
      socket.emit('room:join', { roomId, user });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('room:init', (payload) => {
      setElements(payload.elements);
      // Exclude self from remote users
      setRemoteUsers(payload.users.filter((u) => u.user.id !== user.id));
    });

    socket.on('user:joined', (newPresence) => {
      if (newPresence.user.id === user.id) return;
      setRemoteUsers((prev) => [...prev.filter((u) => u.user.id !== newPresence.user.id), newPresence]);
    });

    socket.on('user:left', (userId) => {
      setRemoteUsers((prev) => prev.filter((u) => u.user.id !== userId));
    });

    socket.on('element:created', (newElement) => {
      setElements((prev) => [...prev.filter((e) => e.id !== newElement.id), newElement]);
    });

    socket.on('element:updated', (updatedElement) => {
      setElements((prev) => prev.map((e) => (e.id === updatedElement.id ? updatedElement : e)));
    });

    socket.on('element:deleted', (elementId) => {
      setElements((prev) => prev.filter((e) => e.id !== elementId));
    });

    socket.on('canvas:cleared', () => {
      setElements([]);
    });

    socket.on('presence:update', (payload) => {
      if (payload.userId === user.id) return;

      setRemoteUsers((prev) =>
        prev.map((presence) => {
          if (presence.user.id === payload.userId) {
            return {
              ...presence,
              cursor: payload.cursor !== undefined ? payload.cursor : presence.cursor,
              selectedElementIds:
                payload.selectedElementIds !== undefined
                  ? payload.selectedElementIds
                  : presence.selectedElementIds,
            };
          }
          return presence;
        })
      );
    });

    return () => {
      socket.emit('room:leave');
      socket.disconnect();
    };
  }, [roomId, user.id, user.name, user.color]);

  // Dispatch Actions
  const createElement = useCallback((element: WhiteboardElement) => {
    setElements((prev) => [...prev, element]);
    socketRef.current?.emit('element:create', element);
  }, []);

  const updateElement = useCallback((element: WhiteboardElement) => {
    setElements((prev) => prev.map((e) => (e.id === element.id ? element : e)));
    socketRef.current?.emit('element:update', element);
  }, []);

  const deleteElement = useCallback((elementId: string) => {
    setElements((prev) => prev.filter((e) => e.id !== elementId));
    socketRef.current?.emit('element:delete', elementId);
  }, []);

  const clearCanvas = useCallback(() => {
    setElements([]);
    socketRef.current?.emit('canvas:clear');
  }, []);

  const sendCursor = useCallback((cursor: Point | null) => {
    socketRef.current?.emit('presence:cursor', cursor);
  }, []);

  const sendSelection = useCallback((elementIds: string[]) => {
    socketRef.current?.emit('presence:selection', elementIds);
  }, []);

  return {
    isConnected,
    elements,
    remoteUsers,
    createElement,
    updateElement,
    deleteElement,
    clearCanvas,
    sendCursor,
    sendSelection,
  };
}
