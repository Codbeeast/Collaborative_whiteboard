import { BaseTool, ToolContext } from './BaseTool';
import { Point, ToolType, WhiteboardElement } from '../../types/canvas';

export class EraserTool extends BaseTool {
  readonly type: ToolType = 'eraser';
  private isErasing = false;

  public onPointerDown(worldPoint: Point, context: ToolContext): void {
    this.isErasing = true;
    this.eraseAtPoint(worldPoint, context);
  }

  public onPointerMove(worldPoint: Point, context: ToolContext): void {
    if (!this.isErasing) return;
    this.eraseAtPoint(worldPoint, context);
  }

  public onPointerUp(): void {
    this.isErasing = false;
  }

  private eraseAtPoint(point: Point, context: ToolContext) {
    const hitRadius = 10;

    // Search in reverse order (topmost element first)
    for (let i = context.elements.length - 1; i >= 0; i--) {
      const el = context.elements[i];
      if (this.isHit(point, el, hitRadius)) {
        context.onElementDelete(el.id);
        break; // Delete one per drag step
      }
    }
  }

  private isHit(point: Point, el: WhiteboardElement, radius: number): boolean {
    if (el.type === 'pencil') {
      const pencil = el as any;
      return pencil.points.some(
        (p: Point) => Math.hypot(p.x - point.x, p.y - point.y) <= radius + el.strokeWidth
      );
    }

    const minX = el.x - radius;
    const maxX = el.x + (el.width || 0) + radius;
    const minY = el.y - radius;
    const maxY = el.y + (el.height || 0) + radius;

    return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
  }
}
