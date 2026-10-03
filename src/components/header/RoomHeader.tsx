'use client';

import React, { useState } from 'react';
import { UserPresence, UserProfile } from '../../types/user';
import { Menu, Share2, Download, Check, Users } from 'lucide-react';

interface RoomHeaderProps {
  roomId: string;
  currentUser: UserProfile;
  remoteUsers: UserPresence[];
  isConnected: boolean;
  onExportPNG: () => void;
  onToggleSidebar?: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  roomId,
  currentUser,
  remoteUsers,
  isConnected,
  onExportPNG,
  onToggleSidebar,
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="absolute top-3 inset-x-4 z-20 flex justify-between items-center pointer-events-none select-none">
      {/* Left: Menu button */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          onClick={onToggleSidebar}
          title="Menu"
          className="w-9 h-9 bg-white border border-slate-200/90 rounded-xl shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Room tag & status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-slate-200/90 rounded-xl text-xs font-medium text-slate-600 shadow-sm">
          <span
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}
          />
          <span className="font-mono text-slate-500">#{roomId.slice(0, 8)}</span>
        </div>
      </div>

      {/* Right: Collaborators, Share, and Export */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Collaborators avatars */}
        <div className="flex items-center -space-x-1.5 bg-white border border-slate-200/90 rounded-xl px-2 py-1 shadow-sm">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-white"
            style={{ backgroundColor: currentUser.color }}
            title={`${currentUser.name} (You)`}
          >
            {currentUser.name.slice(0, 2).toUpperCase()}
          </div>

          {remoteUsers.slice(0, 3).map((u) => (
            <div
              key={u.user.id}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-white"
              style={{ backgroundColor: u.user.color }}
              title={u.user.name}
            >
              {u.user.name.slice(0, 2).toUpperCase()}
            </div>
          ))}

          {remoteUsers.length > 3 && (
            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-600">
              +{remoteUsers.length - 3}
            </div>
          )}
        </div>

        {/* Share Button (Vibrant Indigo/Purple) */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          title="Copy invite link to share"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Share'}</span>
        </button>

        {/* Export Button */}
        <button
          onClick={onExportPNG}
          className="w-9 h-9 bg-white border border-slate-200/90 rounded-xl shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
          title="Export board as PNG"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
