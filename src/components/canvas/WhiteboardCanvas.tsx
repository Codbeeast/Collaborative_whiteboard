'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Point, ToolType, ViewportState, WhiteboardElement, TextElement } from '../../types/canvas';
import { UserProfile, UserPresence } from '../../types/user';
import { ViewportTransform } from '../../canvas/viewport';
import { CanvasRenderer } from '../../canvas/renderer';
import { HistoryManager } from '../../canvas/historyManager';
import { BaseTool, ToolContext } from '../../canvas/tools/BaseTool';
import { PencilTool } from '../../canvas/tools/PencilTool';
import { ShapeTool } from '../../canvas/tools/ShapeTool';
import { TextTool } from '../../canvas/tools/TextTool';
import { SelectTool } from '../../canvas/tools/SelectTool';
import { EraserTool } from '../../canvas/tools/EraserTool';
import { RemoteCursors } from './RemoteCursors';
import { Toolbar } from '../toolbar/Toolbar';
import { StylePanel } from '../toolbar/StylePanel';
import { RoomHeader } from '../header/RoomHeader';
import { CanvasControls } from '../footer/CanvasControls';

interface WhiteboardCanvasProps {
  roomId: string;
  currentUser: UserProfile;
  elements: WhiteboardElement[];
  remoteUsers: UserPresence[];
  isConnected: boolean;
  onElementCreate: (element: WhiteboardElement) => void;
  onElementUpdate: (element: WhiteboardElement) => void;
  onElementDelete: (elementId: string) => void;
  onClearCanvas: () => void;
  onSendCursor: (cursor: Point | null) => void;
  onSendSelection: (elementIds: string[]) => void;
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  roomId,
  currentUser,
  elements,
  remoteUsers,
  isConnected,
  onElementCreate,
  onElementUpdate,
  onElementDelete,
  onClearCanvas,
  onSendCursor,
  onSendSelection,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Viewport State (Pan and Zoom)
  const [viewport, setViewport] = useState<ViewportState>({ x: 0, y: 0, zoom: 1 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef<Point>({ x: 0, y: 0 });
  const spacePressedRef = useRef(false);

  // Tool & Styling State
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [isLocked, setIsLocked] = useState(false);
  const [strokeColor, setStrokeColor] = useState<string>('#1e293b');
  const [fillColor, setFillColor] = useState<string>('transparent');
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [opacity, setOpacity] = useState<number>(1.0);
  const [roundness, setRoundness] = useState<'sharp' | 'round'>('round');
  const [previewElement, setPreviewElement] = useState<WhiteboardElement | null>(null);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);

  // Inline text editing state
  const [editingTextElement, setEditingTextElement] = useState<TextElement | null>(null);

  // History Manager (Undo / Redo)
  const historyManager = useMemo(() => new HistoryManager(50), []);
  const [, setHistoryTick] = useState(0);

  // Instantiate tools
  const tools = useMemo(() => {
    return {
      select: new SelectTool(),
      hand: new SelectTool(), // Hand tool handled in pointer events
      lock: new SelectTool(),
      rectangle: new ShapeTool('rectangle'),
      diamond: new ShapeTool('diamond'),
      circle: new ShapeTool('circle'),
      arrow: new ShapeTool('arrow'),
      line: new ShapeTool('line'),
      pencil: new PencilTool(),
      text: new TextTool(),
      sticky: new ShapeTool('sticky'),
      eraser: new EraserTool(),
    };
  }, []);

  const currentToolInstance: BaseTool = tools[activeTool] || tools.select;

  // Wrapped mutation handlers that also push to local history
  const handleCreateElement = useCallback(
    (newEl: WhiteboardElement) => {
      newEl.roundness = roundness;
      historyManager.recordAction({
        type: 'create',
        elementId: newEl.id,
        afterState: newEl,
      });
      setHistoryTick((t) => t + 1);
      onElementCreate(newEl);

      // Auto switch back to select unless locked
      if (!isLocked && activeTool !== 'pencil' && activeTool !== 'eraser') {
        setActiveTool('select');
      }
    },
    [activeTool, historyManager, isLocked, onElementCreate, roundness]
  );

  const handleUpdateElement = useCallback(
    (updatedEl: WhiteboardElement) => {
      const prev = elements.find((e) => e.id === updatedEl.id);
      historyManager.recordAction({
        type: 'update',
        elementId: updatedEl.id,
        beforeState: prev ? { ...prev } : undefined,
        afterState: updatedEl,
      });
      setHistoryTick((t) => t + 1);
      onElementUpdate(updatedEl);
    },
    [elements, historyManager, onElementUpdate]
  );

  const handleDeleteElement = useCallback(
    (elementId: string) => {
      const target = elements.find((e) => e.id === elementId);
      if (target) {
        historyManager.recordAction({
          type: 'delete',
          elementId,
          beforeState: { ...target },
        });
        setHistoryTick((t) => t + 1);
      }
      onElementDelete(elementId);
    },
    [elements, historyManager, onElementDelete]
  );

  // Undo / Redo Execution
  const handleUndo = useCallback(() => {
    const action = historyManager.undo();
    if (!action) return;

    if (action.type === 'create') {
      onElementDelete(action.elementId);
    } else if (action.type === 'update' && action.beforeState) {
      onElementUpdate(action.beforeState);
    } else if (action.type === 'delete' && action.beforeState) {
      onElementCreate(action.beforeState);
    }
    setHistoryTick((t) => t + 1);
  }, [historyManager, onElementCreate, onElementDelete, onElementUpdate]);

  const handleRedo = useCallback(() => {
    const action = historyManager.redo();
    if (!action) return;

    if (action.type === 'create' && action.afterState) {
      onElementCreate(action.afterState);
    } else if (action.type === 'update' && action.afterState) {
      onElementUpdate(action.afterState);
    } else if (action.type === 'delete') {
      onElementDelete(action.elementId);
    }
    setHistoryTick((t) => t + 1);
  }, [historyManager, onElementCreate, onElementDelete, onElementUpdate]);

  // Zoom controls
  const handleZoomIn = () => {
    setViewport((prev) => ({ ...prev, zoom: Math.min(5.0, prev.zoom * 1.2) }));
  };

  const handleZoomOut = () => {
    setViewport((prev) => ({ ...prev, zoom: Math.max(0.1, prev.zoom / 1.2) }));
  };

  const handleResetZoom = () => {
    setViewport((prev) => ({ ...prev, zoom: 1 }));
  };

  // Keyboard Shortcuts (Matching reference: V, R, D, O, A, L, P, T, N, E, H)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space') {
        spacePressedRef.current = true;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key.toLowerCase() === 'v' || e.key === '1') setActiveTool('select');
      else if (e.key.toLowerCase() === 'h') setActiveTool('hand');
      else if (e.key.toLowerCase() === 'r' || e.key === '2') setActiveTool('rectangle');
      else if (e.key.toLowerCase() === 'd' || e.key === '3') setActiveTool('diamond');
      else if (e.key.toLowerCase() === 'o' || e.key === '4') setActiveTool('circle');
      else if (e.key.toLowerCase() === 'a' || e.key === '5') setActiveTool('arrow');
      else if (e.key.toLowerCase() === 'l' || e.key === '6') setActiveTool('line');
      else if (e.key.toLowerCase() === 'p' || e.key === '7') setActiveTool('pencil');
      else if (e.key.toLowerCase() === 't' || e.key === '8') setActiveTool('text');
      else if (e.key.toLowerCase() === 'n' || e.key === '9') setActiveTool('sticky');
      else if (e.key.toLowerCase() === 'e' || e.key === '0') setActiveTool('eraser');
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spacePressedRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleUndo, handleRedo]);

  // Context for Tools
  const toolContext: ToolContext = useMemo(() => {
    return {
      userId: currentUser.id,
      strokeColor,
      fillColor,
      strokeWidth,
      opacity,
      onElementCreate: handleCreateElement,
      onElementUpdate: handleUpdateElement,
      onElementDelete: handleDeleteElement,
      elements,
      setPreviewElement,
      selectedElementIds,
      setSelectedElementIds: (ids) => {
        setSelectedElementIds(ids);
        onSendSelection(ids);
      },
    };
  }, [
    currentUser.id,
    strokeColor,
    fillColor,
    strokeWidth,
    opacity,
    handleCreateElement,
    handleUpdateElement,
    handleDeleteElement,
    elements,
    selectedElementIds,
    onSendSelection,
  ]);

  // 60FPS Continuous Render Loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle Device Pixel Ratio for crisp high-DPI displays
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }

      ctx.save();
      // Identity scaled by DPR
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Clean white background matching reference design
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      // Draw subtle grid dots
      drawGrid(ctx, viewport, displayWidth, displayHeight);

      // Apply viewport world transformation matrix with DPR
      ViewportTransform.applyTransform(ctx, viewport, dpr);

      // 1. Render all committed elements
      elements.forEach((el) => {
        // If element is currently being edited via inline text input, skip drawing its canvas text
        if (editingTextElement && editingTextElement.id === el.id) return;

        CanvasRenderer.renderElement(ctx, el);
        if (selectedElementIds.includes(el.id)) {
          CanvasRenderer.renderSelectionBox(ctx, el);
        }
      });

      // 2. Render current active drawing preview element (if dragging)
      if (previewElement) {
        CanvasRenderer.renderElement(ctx, previewElement);
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [viewport, elements, previewElement, selectedElementIds, editingTextElement]);

  // Subtle infinite grid
  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    vp: ViewportState,
    width: number,
    height: number
  ) => {
    const gridSize = 24 * vp.zoom;
    if (gridSize < 8) return;

    const offsetX = (vp.x % gridSize);
    const offsetY = (vp.y % gridSize);

    ctx.save();
    ctx.fillStyle = '#e2e8f0'; // very soft dot
    for (let x = offsetX; x < width; x += gridSize) {
      for (let y = offsetY; y < height; y += gridSize) {
        ctx.fillRect(x - 0.5, y - 0.5, 1.2, 1.2);
      }
    }
    ctx.restore();
  };

  // Double click on canvas to edit text or sticky note
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenPoint: Point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const worldPoint = ViewportTransform.screenToWorld(screenPoint, viewport);

    // Check if clicked an existing text or sticky note
    const clicked = elements.find((el) => {
      if (el.type !== 'text' && el.type !== 'sticky') return false;
      const w = el.width || 140;
      const h = el.height || 36;
      return (
        worldPoint.x >= el.x &&
        worldPoint.x <= el.x + w &&
        worldPoint.y >= el.y &&
        worldPoint.y <= el.y + h
      );
    });

    if (clicked) {
      setEditingTextElement(clicked as TextElement);
    }
  };

  // Pointer & Pan Event Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // If text was being edited, save & close it
    if (editingTextElement) {
      setEditingTextElement(null);
    }

    // Pan mode (Hand tool, Middle click, Spacebar, or Alt key)
    if (
      activeTool === 'hand' ||
      e.button === 1 ||
      e.buttons === 4 ||
      e.altKey ||
      spacePressedRef.current
    ) {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - viewport.x, y: e.clientY - viewport.y };
      return;
    }

    if (e.button !== 0) return; // Left click only for tools

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenPoint: Point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const worldPoint = ViewportTransform.screenToWorld(screenPoint, viewport);

    currentToolInstance.onPointerDown(worldPoint, toolContext, e.nativeEvent);
  };

  // Throttled cursor broadcast
  const lastCursorSendRef = useRef<number>(0);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenPoint: Point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const worldPoint = ViewportTransform.screenToWorld(screenPoint, viewport);

    // Pan viewport if currently panning
    if (isPanningRef.current) {
      setViewport((prev) => ({
        ...prev,
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      }));
      return;
    }

    // Pass to active tool
    currentToolInstance.onPointerMove(worldPoint, toolContext, e.nativeEvent);

    // Send cursor position (throttled ~30 times/sec)
    const now = Date.now();
    if (now - lastCursorSendRef.current > 33) {
      onSendCursor(worldPoint);
      lastCursorSendRef.current = now;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenPoint: Point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const worldPoint = ViewportTransform.screenToWorld(screenPoint, viewport);

    currentToolInstance.onPointerUp(worldPoint, toolContext, e.nativeEvent);
  };

  const handlePointerLeave = () => {
    isPanningRef.current = false;
    onSendCursor(null);
  };

  // Zoom using Wheel
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const anchor: Point = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setViewport((prev) => ViewportTransform.zoomAtPoint(anchor, zoomFactor, prev));
  };

  // Export Canvas as PNG
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `whiteboard-${roomId.slice(0, 8)}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Cursor style based on active tool
  const getCursorStyle = () => {
    if (isPanningRef.current || activeTool === 'hand') return 'cursor-grab active:cursor-grabbing';
    if (activeTool === 'select') return 'cursor-default';
    if (activeTool === 'text') return 'cursor-text';
    if (activeTool === 'eraser') return 'cursor-pointer';
    return 'cursor-crosshair';
  };

  // Inline text editing screen position
  const editingScreenPos = editingTextElement
    ? ViewportTransform.worldToScreen({ x: editingTextElement.x, y: editingTextElement.y }, viewport)
    : null;

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-white">
      {/* Top Header Bar */}
      <RoomHeader
        roomId={roomId}
        currentUser={currentUser}
        remoteUsers={remoteUsers}
        isConnected={isConnected}
        onExportPNG={handleExportPNG}
      />

      {/* Floating Center Toolbar */}
      <Toolbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        isLocked={isLocked}
        setIsLocked={setIsLocked}
      />

      {/* Clean Style Palette Inspector (Left side) */}
      {activeTool !== 'select' && activeTool !== 'hand' && activeTool !== 'eraser' && (
        <StylePanel
          strokeColor={strokeColor}
          setStrokeColor={setStrokeColor}
          fillColor={fillColor}
          setFillColor={setFillColor}
          strokeWidth={strokeWidth}
          setStrokeWidth={setStrokeWidth}
          opacity={opacity}
          setOpacity={setOpacity}
          roundness={roundness}
          setRoundness={setRoundness}
        />
      )}

      {/* Bottom Left Controls: Zoom & Undo/Redo */}
      <CanvasControls
        zoom={viewport.zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        canUndo={historyManager.canUndo()}
        canRedo={historyManager.canRedo()}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* Remote collaborators' smooth cursors */}
      <RemoteCursors remoteUsers={remoteUsers} viewport={viewport} />

      {/* Infinite 2D HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full touch-none ${getCursorStyle()}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
      />

      {/* Inline Text Editor Overlay when user types or double clicks text */}
      {editingTextElement && editingScreenPos && (
        <textarea
          autoFocus
          className="absolute z-40 bg-transparent border border-dashed border-indigo-500 rounded p-1 outline-none resize-none font-sans overflow-hidden"
          style={{
            left: `${editingScreenPos.x}px`,
            top: `${editingScreenPos.y}px`,
            transform: `scale(${viewport.zoom})`,
            transformOrigin: 'top left',
            color: editingTextElement.strokeColor,
            fontSize: `${editingTextElement.fontSize || 20}px`,
            lineHeight: 1.3,
            minWidth: '160px',
            minHeight: '40px',
          }}
          value={editingTextElement.text}
          onChange={(e) => {
            const updated = { ...editingTextElement, text: e.target.value };
            setEditingTextElement(updated);
            handleUpdateElement(updated);
          }}
          onBlur={() => setEditingTextElement(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setEditingTextElement(null);
          }}
        />
      )}
    </div>
  );
};
