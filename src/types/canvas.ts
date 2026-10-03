export type ToolType =
  | 'lock'
  | 'hand'
  | 'select'
  | 'rectangle'
  | 'diamond'
  | 'circle'
  | 'arrow'
  | 'line'
  | 'pencil'
  | 'text'
  | 'sticky'
  | 'eraser';

export type ElementType =
  | 'pencil'
  | 'rectangle'
  | 'diamond'
  | 'circle'
  | 'arrow'
  | 'line'
  | 'text'
  | 'sticky';

export interface Point {
  x: number;
  y: number;
}

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  strokeColor: string;
  fillColor?: string;
  strokeWidth: number;
  opacity: number;
  roundness?: 'sharp' | 'round';
  createdBy: string;
  updatedAt: number;
}

export interface PencilElement extends BaseElement {
  type: 'pencil';
  points: Point[];
}

export interface TextElement extends BaseElement {
  type: 'text' | 'sticky';
  text: string;
  fontSize: number;
}

export interface ShapeElement extends BaseElement {
  type: 'rectangle' | 'diamond' | 'circle' | 'arrow' | 'line';
}

export type WhiteboardElement = PencilElement | TextElement | ShapeElement;

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}
