'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import * as Y from 'yjs';
import { ClientToServerEvents, ServerToClientEvents } from '../types/socket';
import { Point, WhiteboardElement } from '../types/canvas';
import { UserPresence, UserProfile } from '../types/user';
import { YDocManager } from '../crdt/yDocManager';

interface UseYjsWhiteboardProps {
  roomId: string;
  user: UserProfile;
}

export function useYjsWhiteboard({ roomId, user }: UseYjsWhiteboardProps) {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const [remoteUsers, setRemoteUsers] = useState<UserPresence[]>([]);

  // Persistent YDocManager instance
  const yDocManager = useMemo(() => new YDocManager(), []);

  useEffect(() => {
    const doc = yDocManager.getDoc();
    const elementsMap = yDocManager.getElementsMap();

    // 1. Establish Socket.io connection
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
      path: '/api/socket',
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // 2. React to local Yjs document changes -> emit binary diff to server
    const handleDocUpdate = (update: Uint8Array, origin: any) => {
      // Only broadcast if the update originated locally (not from server sync)
      if (origin !== 'remote') {
        socket.emit('yjs:update', update);
      }
      // Sync React state with current YMap contents
      setElements(yDocManager.getElements());
    };

    doc.on('update', handleDocUpdate);

    // 3. React to YMap element changes directly
    const handleMapChange = () => {
      setElements(yDocManager.getElements());
    };
    elementsMap.observe(handleMapChange);

    // 4. Socket Lifecycle
    socket.on('connect', () => {
      setIsConnected(true);

      // Join room
      socket.emit('room:join', { roomId, user });

      // Step 1: Send client's local state vector to server
      const stateVector = Y.encodeStateVector(doc);
      socket.emit('yjs:sync-step1', stateVector);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Step 2: Receive missing updates from server
    socket.on('yjs:sync-step2', (rawUpdate) => {
      const update = new Uint8Array(rawUpdate);
      Y.applyUpdate(doc, update, 'remote');
      setElements(yDocManager.getElements());
    });

    // Incremental updates from other collaborators
    socket.on('yjs:update', (rawUpdate) => {
      const update = new Uint8Array(rawUpdate);
      Y.applyUpdate(doc, update, 'remote');
      setElements(yDocManager.getElements());
    });

    // Awareness & Presence
    socket.on('user:joined', (presence) => {
      if (presence.user.id === user.id) return;
      setRemoteUsers((prev) => [...prev.filter((u) => u.user.id !== presence.user.id), presence]);
    });

    socket.on('user:left', (userId) => {
      setRemoteUsers((prev) => prev.filter((u) => u.user.id !== userId));
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
      doc.off('update', handleDocUpdate);
      elementsMap.unobserve(handleMapChange);
      socket.emit('room:leave');
      socket.disconnect();
    };
  }, [roomId, user.id, user.name, user.color, yDocManager]);

  // Transactional Actions using Yjs CRDT
  const createElement = useCallback(
    (element: WhiteboardElement) => {
      yDocManager.setElement(element);
    },
    [yDocManager]
  );

  const updateElement = useCallback(
    (element: WhiteboardElement) => {
      yDocManager.setElement(element);
    },
    [yDocManager]
  );

  const deleteElement = useCallback(
    (elementId: string) => {
      yDocManager.deleteElement(elementId);
    },
    [yDocManager]
  );

  const clearCanvas = useCallback(() => {
    yDocManager.clearAll();
  }, [yDocManager]);

  const undo = useCallback(() => {
    yDocManager.undo();
  }, [yDocManager]);

  const redo = useCallback(() => {
    yDocManager.redo();
  }, [yDocManager]);

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
    undo,
    redo,
    canUndo: yDocManager.canUndo(),
    canRedo: yDocManager.canRedo(),
    sendCursor,
    sendSelection,
  };
}
