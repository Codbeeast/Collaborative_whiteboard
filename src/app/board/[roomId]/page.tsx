'use client';

import React, { useEffect, useState, use } from 'react';
import { useYjsWhiteboard } from '../../../hooks/useYjsWhiteboard';
import { WhiteboardCanvas } from '../../../components/canvas/WhiteboardCanvas';
import { UserProfile } from '../../../types/user';
import { v4 as uuidv4 } from 'uuid';

interface BoardPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default function BoardPage({ params }: BoardPageProps) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.roomId;

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Load persisted user identity or auto-generate
    const saved = localStorage.getItem('whiteboard_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.id && parsed.name && parsed.color) {
          setCurrentUser(parsed);
          return;
        }
      } catch {
        // Fall through to generate
      }
    }

    const randomColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#06b6d4'];
    const newUser: UserProfile = {
      id: uuidv4(),
      name: `User_${Math.floor(Math.random() * 900 + 100)}`,
      color: randomColors[Math.floor(Math.random() * randomColors.length)],
    };

    localStorage.setItem('whiteboard_user', JSON.stringify(newUser));
    setCurrentUser(newUser);
  }, []);

  if (!currentUser) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-slate-950 text-slate-300">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Entering whiteboard...</span>
        </div>
      </div>
    );
  }

  return <BoardRoomContainer roomId={roomId} currentUser={currentUser} />;
}

// Inner container guarantees currentUser is instantiated before socket connection
function BoardRoomContainer({ roomId, currentUser }: { roomId: string; currentUser: UserProfile }) {
  const {
    isConnected,
    elements,
    remoteUsers,
    createElement,
    updateElement,
    deleteElement,
    clearCanvas,
    sendCursor,
    sendSelection,
  } = useYjsWhiteboard({ roomId, user: currentUser });

  return (
    <WhiteboardCanvas
      roomId={roomId}
      currentUser={currentUser}
      elements={elements}
      remoteUsers={remoteUsers}
      isConnected={isConnected}
      onElementCreate={createElement}
      onElementUpdate={updateElement}
      onElementDelete={deleteElement}
      onClearCanvas={clearCanvas}
      onSendCursor={sendCursor}
      onSendSelection={sendSelection}
    />
  );
}
