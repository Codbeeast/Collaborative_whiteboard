'use client';

import React from 'react';
import { Minus } from 'lucide-react';

interface StylePanelProps {
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  fillColor: string;
  setFillColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  opacity: number;
  setOpacity: (opacity: number) => void;
  roundness: 'sharp' | 'round';
  setRoundness: (roundness: 'sharp' | 'round') => void;
}

export const StylePanel: React.FC<StylePanelProps> = ({
  strokeColor,
  setStrokeColor,
  fillColor,
  setFillColor,
  strokeWidth,
  setStrokeWidth,
  opacity,
  setOpacity,
  roundness,
  setRoundness,
}) => {
  // Stroke colors matching reference
  const strokeColors = [
    '#1e293b', // Charcoal
    '#ef4444', // Red
    '#22c55e', // Green
    '#3b82f6', // Blue
    '#f97316', // Orange
    '#000000', // Black
  ];

  // Soft background fills matching reference
  const bgColors = [
    { color: 'transparent', label: 'Transparent' },
    { color: '#fecaca', label: 'Soft Red' },
    { color: '#bbf7d0', label: 'Soft Green' },
    { color: '#bfdbfe', label: 'Soft Blue' },
    { color: '#fef08a', label: 'Soft Yellow' },
    { color: '#ffffff', label: 'White' },
  ];

  return (
    <div className="absolute top-16 left-4 z-30 flex flex-col gap-4 p-4 bg-white border border-slate-200/90 rounded-2xl shadow-sm w-56 select-none transition-all">
      {/* 1. Stroke Color */}
      <div>
        <span className="text-[11px] font-medium text-slate-500 block mb-2">
          Stroke
        </span>
        <div className="flex items-center gap-1.5">
          {strokeColors.map((c) => {
            const isSelected = strokeColor === c;
            return (
              <button
                key={c}
                onClick={() => setStrokeColor(c)}
                className={`w-6 h-6 rounded-md transition-all ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 ring-offset-2 scale-105'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            );
          })}
        </div>
      </div>

      {/* 2. Background Fill */}
      <div>
        <span className="text-[11px] font-medium text-slate-500 block mb-2">
          Background
        </span>
        <div className="flex items-center gap-1.5">
          {bgColors.map((item) => {
            const isSelected = fillColor === item.color;
            const isTransparent = item.color === 'transparent';

            return (
              <button
                key={item.color}
                onClick={() => setFillColor(item.color)}
                title={item.label}
                className={`w-6 h-6 rounded-md border border-slate-200 transition-all flex items-center justify-center ${
                  isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 scale-105' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: isTransparent ? 'transparent' : item.color }}
              >
                {isTransparent && (
                  <span className="text-[10px] text-slate-400 font-bold">✕</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Stroke Width */}
      <div>
        <span className="text-[11px] font-medium text-slate-500 block mb-2">
          Stroke width
        </span>
        <div className="flex items-center gap-2">
          {[
            { width: 2, label: 'Thin' },
            { width: 4, label: 'Medium' },
            { width: 8, label: 'Bold' },
          ].map((item) => {
            const isSelected = strokeWidth === item.width;
            return (
              <button
                key={item.width}
                onClick={() => setStrokeWidth(item.width)}
                title={item.label}
                className={`flex-1 py-1 px-2 rounded-lg border flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div
                  className="w-4 bg-current rounded-full"
                  style={{ height: `${item.width}px` }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Corners / Roundness */}
      <div>
        <span className="text-[11px] font-medium text-slate-500 block mb-2">
          Corners
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRoundness('sharp')}
            className={`flex-1 py-1 text-xs font-medium rounded-lg border transition-all ${
              roundness === 'sharp'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Sharp
          </button>
          <button
            onClick={() => setRoundness('round')}
            className={`flex-1 py-1 text-xs font-medium rounded-lg border transition-all ${
              roundness === 'round'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Round
          </button>
        </div>
      </div>

      {/* 5. Opacity Slider */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[11px] font-medium text-slate-500">Opacity</span>
          <span className="text-[11px] text-slate-400 font-mono">
            {Math.round(opacity * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={opacity}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
          <span>0</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
};
