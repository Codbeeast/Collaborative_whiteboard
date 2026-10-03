import { Point, ToolType, WhiteboardElement } from '../../types/canvas';

export interface ToolContext {
  userId: string;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  onElementCreate: (element: WhiteboardElement) => void;
  onElementUpdate: (element: WhiteboardElement) => void;
  onElementDelete: (elementId: string) => void;
  elements: WhiteboardElement[];
  setPreviewElement: (element: WhiteboardElement | null) => void;
  selectedElementIds: string[];
  setSelectedElementIds: (ids: string[]) => void;
}

export abstract class BaseTool {
  abstract readonly type: ToolType;

  abstract onPointerDown(worldPoint: Point, context: ToolContext, event: PointerEvent): void;
  abstract onPointerMove(worldPoint: Point, context: ToolContext, event: PointerEvent): void;
  abstract onPointerUp(worldPoint: Point, context: ToolContext, event: PointerEvent): void;
}
