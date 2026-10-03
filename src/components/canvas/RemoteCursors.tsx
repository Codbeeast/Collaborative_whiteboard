'use client';

import React from 'react';
import { UserPresence } from '../../types/user';
import { ViewportState } from '../../types/canvas';
import { ViewportTransform } from '../../canvas/viewport';

interface RemoteCursorsProps {
  remoteUsers: UserPresence[];
  viewport: ViewportState;
}

export const RemoteCursors: React.FC<RemoteCursorsProps> = ({ remoteUsers, viewport }) => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
      {remoteUsers.map((presence) => {
        if (!presence.cursor) return null;

        // Transform world coordinate to current client's screen viewport coordinate
        const screenPos = ViewportTransform.worldToScreen(presence.cursor, viewport);

        return (
          <div
            key={presence.user.id}
            className="absolute top-0 left-0 transition-all duration-75 ease-out will-change-transform"
            style={{
              transform: `translate3d(${screenPos.x}px, ${screenPos.y}px, 0)`,
            }}
          >
            {/* SVG Cursor Pointer */}
            <svg
              className="w-5 h-5 -rotate-45 drop-shadow-md"
              viewBox="0 0 24 24"
              fill={presence.user.color || '#3b82f6'}
              stroke="#ffffff"
              strokeWidth="1.5"
            >
              <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
            </svg>

            {/* User Name Badge */}
            <span
              className="ml-4 -mt-2 px-2 py-0.5 text-xs font-semibold text-white rounded-md shadow-sm whitespace-nowrap inline-block"
              style={{ backgroundColor: presence.user.color || '#3b82f6' }}
            >
              {presence.user.name}
            </span>
          </div>
        );
      })}
    </div>
  );
};
