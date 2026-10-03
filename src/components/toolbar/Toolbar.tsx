'use client';

import React from 'react';
import { ToolType } from '../../types/canvas';
import {
  Lock,
  Hand,
  MousePointer2,
  Square,
  Diamond,
  Circle,
  ArrowUpRight,
  Minus,
  Pencil,
  Type,
  StickyNote,
  Eraser,
  MoreHorizontal,
} from 'lucide-react';

interface ToolbarProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  setActiveTool,
  isLocked,
  setIsLocked,
}) => {
  const tools: Array<{ id: ToolType; label: string; shortcut: string; icon: React.ReactNode }> = [
    { id: 'hand', label: 'Hand (Pan)', shortcut: 'H', icon: <Hand className="w-4 h-4" /> },
    { id: 'select', label: 'Selection', shortcut: 'V', icon: <MousePointer2 className="w-4 h-4" /> },
    { id: 'rectangle', label: 'Rectangle', shortcut: 'R', icon: <Square className="w-4 h-4" /> },
    { id: 'diamond', label: 'Diamond', shortcut: 'D', icon: <Diamond className="w-4 h-4" /> },
    { id: 'circle', label: 'Circle', shortcut: 'O', icon: <Circle className="w-4 h-4" /> },
    { id: 'arrow', label: 'Arrow', shortcut: 'A', icon: <ArrowUpRight className="w-4 h-4" /> },
    { id: 'line', label: 'Line', shortcut: 'L', icon: <Minus className="w-4 h-4" /> },
    { id: 'pencil', label: 'Draw', shortcut: 'P', icon: <Pencil className="w-4 h-4" /> },
    { id: 'text', label: 'Text', shortcut: 'T', icon: <Type className="w-4 h-4" /> },
    { id: 'sticky', label: 'Sticky Note', shortcut: 'N', icon: <StickyNote className="w-4 h-4" /> },
    { id: 'eraser', label: 'Eraser', shortcut: 'E', icon: <Eraser className="w-4 h-4" /> },
  ];

  const getHintText = () => {
    switch (activeTool) {
      case 'hand':
        return 'Click and drag to pan the canvas';
      case 'select':
        return 'Click to select or drag to move elements';
      case 'pencil':
        return 'Draw freely on the canvas';
      case 'text':
        return 'Click anywhere to add text';
      case 'sticky':
        return 'Click to place a sticky note';
      case 'eraser':
        return 'Click or drag across elements to erase them';
      default:
        return "Click and drag, release when you're finished";
    }
  };

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none select-none">
      {/* Floating Toolbar Pill */}
      <div className="flex items-center gap-0.5 p-1 bg-white border border-slate-200/90 rounded-2xl shadow-sm pointer-events-auto">
        {/* Lock button */}
        <button
          onClick={() => setIsLocked(!isLocked)}
          title={isLocked ? 'Keep tool active' : 'Turn off tool lock'}
          className={`p-2 rounded-xl transition-all ${
            isLocked
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-slate-200 mx-0.5" />

        {/* Tools list */}
        {tools.map((t) => {
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              title={`${t.label} (${t.shortcut})`}
              className={`relative px-2.5 py-2 rounded-xl flex items-center gap-1 transition-all ${
                isActive
                  ? 'bg-indigo-100 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {t.icon}
              <span className="text-[10px] text-slate-400 font-mono leading-none">
                {t.shortcut}
              </span>
            </button>
          );
        })}

        <div className="w-[1px] h-5 bg-slate-200 mx-0.5" />

        {/* More options button */}
        <button
          title="More actions"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Helper Context Subtitle */}
      <div className="text-[11px] font-medium text-slate-400 tracking-tight mt-1.5 pointer-events-none drop-shadow-sm">
        {getHintText()}
      </div>
    </div>
  );
};
