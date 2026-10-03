import { WhiteboardElement, Point } from './canvas';
import { UserProfile, UserPresence } from './user';

// Events emitted from Client to Server
export interface ClientToServerEvents {
  'room:join': (payload: { roomId: string; user: UserProfile }) => void;
  'room:leave': () => void;
  'element:create': (element: WhiteboardElement) => void;
  'element:update': (element: WhiteboardElement) => void;
  'element:delete': (elementId: string) => void;
  'canvas:clear': () => void;
  'presence:cursor': (cursor: Point | null) => void;
  'presence:selection': (elementIds: string[]) => void;

  // Yjs CRDT Protocol Events
  'yjs:sync-step1': (stateVector: Uint8Array | ArrayBuffer) => void;
  'yjs:update': (update: Uint8Array | ArrayBuffer) => void;
  'yjs:awareness': (awarenessUpdate: Uint8Array | ArrayBuffer) => void;
}

// Events emitted from Server to Client
export interface ServerToClientEvents {
  'room:init': (payload: {
    roomId: string;
    elements: WhiteboardElement[];
    users: UserPresence[];
  }) => void;
  'user:joined': (presence: UserPresence) => void;
  'user:left': (userId: string) => void;
  'element:created': (element: WhiteboardElement) => void;
  'element:updated': (element: WhiteboardElement) => void;
  'element:deleted': (elementId: string) => void;
  'canvas:cleared': () => void;
  'presence:update': (payload: {
    userId: string;
    cursor?: Point | null;
    selectedElementIds?: string[];
  }) => void;
  'error:message': (message: string) => void;

  // Yjs CRDT Protocol Events
  'yjs:sync-step2': (update: Uint8Array | ArrayBuffer) => void;
  'yjs:update': (update: Uint8Array | ArrayBuffer) => void;
  'yjs:awareness': (awarenessUpdate: Uint8Array | ArrayBuffer) => void;
}

export interface SocketData {
  roomId?: string;
  user?: UserProfile;
}
