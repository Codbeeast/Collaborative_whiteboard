import { BaseTool, ToolContext } from './BaseTool';
import { PencilElement, Point, ToolType } from '../../types/canvas';
import { v4 as uuidv4 } from 'uuid';

export class PencilTool extends BaseTool {
  readonly type: ToolType = 'pencil';
  private currentElement: PencilElement | null = null;

  public onPointerDown(worldPoint: Point, context: ToolContext): void {
    this.currentElement = {
      id: uuidv4(),
      type: 'pencil',
      x: worldPoint.x,
      y: worldPoint.y,
      points: [{ x: worldPoint.x, y: worldPoint.y }],
      strokeColor: context.strokeColor,
      strokeWidth: context.strokeWidth,
      opacity: context.opacity,
      createdBy: context.userId,
      updatedAt: Date.now(),
    };

    context.setPreviewElement(this.currentElement);
  }

  public onPointerMove(worldPoint: Point, context: ToolContext): void {
    if (!this.currentElement) return;

    // Append point to active stroke
    this.currentElement.points.push({ x: worldPoint.x, y: worldPoint.y });
    context.setPreviewElement({ ...this.currentElement });
  }

  public onPointerUp(worldPoint: Point, context: ToolContext): void {
    if (!this.currentElement) return;

    if (this.currentElement.points.length > 0) {
      context.onElementCreate(this.currentElement);
    }

    this.currentElement = null;
    context.setPreviewElement(null);
  }
}
