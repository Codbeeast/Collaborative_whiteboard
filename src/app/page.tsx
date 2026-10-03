'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Sparkles, ArrowRight, PlusCircle, Users2, Palette } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userColor, setUserColor] = useState('#3b82f6');
  const [joinRoomId, setJoinRoomId] = useState('');

  const colors = [
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#f97316', // Orange
    '#10b981', // Emerald
    '#06b6d4', // Cyan
  ];

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = userName.trim() || `User_${Math.floor(Math.random() * 900 + 100)}`;
    const newRoomId = uuidv4().slice(0, 8);

    // Save profile to localStorage for continuity
    localStorage.setItem(
      'whiteboard_user',
      JSON.stringify({
        id: uuidv4(),
        name: finalName,
        color: userColor,
      })
    );

    router.push(`/board/${newRoomId}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRoomId.trim()) return;

    const finalName = userName.trim() || `User_${Math.floor(Math.random() * 900 + 100)}`;
    localStorage.setItem(
      'whiteboard_user',
      JSON.stringify({
        id: uuidv4(),
        name: finalName,
        color: userColor,
      })
    );

    router.push(`/board/${joinRoomId.trim()}`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white p-6 relative overflow-hidden">
      {/* Background glowing ambient orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-lg shadow-blue-500/25">
            <Palette className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Collaborative Whiteboard
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Real-time multi-user sketching powered by WebSockets, Redis, & PostgreSQL
          </p>
        </div>

        {/* User Identity Setup */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Your Name
            </label>
            <input
              type="text"
              placeholder="e.g. Alex Rivera"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Cursor & Badge Color
            </label>
            <div className="flex items-center gap-3">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setUserColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    userColor === c
                      ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-slate-800 my-6" />

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={handleCreateRoom}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Create New Board
          </button>

          <form onSubmit={handleJoinRoom} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Room Code..."
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-950/60 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl flex items-center justify-center transition-colors text-sm"
              title="Join room"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Footer info badge */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Users2 className="w-3.5 h-3.5" /> Multi-User
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Vector 60 FPS
          </span>
        </div>
      </div>
    </main>
  );
}
