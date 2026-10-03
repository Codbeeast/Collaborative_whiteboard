import { BaseTool, ToolContext } from './BaseTool';
import { Point, ShapeElement, TextElement, ToolType, WhiteboardElement } from '../../types/canvas';
import { v4 as uuidv4 } from 'uuid';

export class ShapeTool extends BaseTool {
  readonly type: ToolType;
  private startPoint: Point | null = null;
  private currentElement: WhiteboardElement | null = null;

  constructor(shapeType: 'rectangle' | 'diamond' | 'circle' | 'arrow' | 'line' | 'sticky') {
    super();
    this.type = shapeType;
  }

  public onPointerDown(worldPoint: Point, context: ToolContext): void {
    this.startPoint = { x: worldPoint.x, y: worldPoint.y };

    if (this.type === 'sticky') {
      const sticky: TextElement = {
        id: uuidv4(),
        type: 'sticky',
        x: worldPoint.x,
        y: worldPoint.y,
        width: 180,
        height: 180,
        strokeColor: '#1e293b',
        fillColor: context.fillColor && context.fillColor !== 'transparent' ? context.fillColor : '#fef08a',
        strokeWidth: 1,
        opacity: context.opacity,
        text: 'Idea / Note',
        fontSize: 16,
        createdBy: context.userId,
        updatedAt: Date.now(),
      };
      context.onElementCreate(sticky);
      this.startPoint = null;
      return;
    }

    const shape: ShapeElement = {
      id: uuidv4(),
      type: this.type as 'rectangle' | 'diamond' | 'circle' | 'arrow' | 'line',
      x: worldPoint.x,
      y: worldPoint.y,
      width: 0,
      height: 0,
      strokeColor: context.strokeColor,
      fillColor: context.fillColor,
      strokeWidth: context.strokeWidth,
      opacity: context.opacity,
      createdBy: context.userId,
      updatedAt: Date.now(),
    };

    this.currentElement = shape;
    context.setPreviewElement(shape);
  }

  public onPointerMove(worldPoint: Point, context: ToolContext): void {
    if (!this.startPoint || !this.currentElement) return;

    if (this.type === 'rectangle' || this.type === 'diamond' || this.type === 'circle') {
      const minX = Math.min(this.startPoint.x, worldPoint.x);
      const minY = Math.min(this.startPoint.y, worldPoint.y);
      const width = Math.abs(worldPoint.x - this.startPoint.x);
      const height = Math.abs(worldPoint.y - this.startPoint.y);

      this.currentElement.x = minX;
      this.currentElement.y = minY;
      this.currentElement.width = width;
      this.currentElement.height = height;
    } else if (this.type === 'arrow' || this.type === 'line') {
      this.currentElement.x = this.startPoint.x;
      this.currentElement.y = this.startPoint.y;
      this.currentElement.width = worldPoint.x - this.startPoint.x;
      this.currentElement.height = worldPoint.y - this.startPoint.y;
    }

    context.setPreviewElement({ ...this.currentElement });
  }

  public onPointerUp(worldPoint: Point, context: ToolContext): void {
    if (!this.startPoint || !this.currentElement) return;

    const w = Math.abs(this.currentElement.width || 0);
    const h = Math.abs(this.currentElement.height || 0);

    // Only commit if user actually dragged beyond a minimum size
    if (w > 3 || h > 3) {
      context.onElementCreate(this.currentElement);
    }

    this.startPoint = null;
    this.currentElement = null;
    context.setPreviewElement(null);
  }
}
