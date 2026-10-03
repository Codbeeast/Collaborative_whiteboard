import { BaseTool, ToolContext } from './BaseTool';
import { Point, ToolType, WhiteboardElement } from '../../types/canvas';

export class SelectTool extends BaseTool {
  readonly type: ToolType = 'select';
  private isDragging = false;
  private dragStart: Point | null = null;
  private selectedOriginals: Map<string, { x: number; y: number; points?: Point[] }> = new Map();

  public onPointerDown(worldPoint: Point, context: ToolContext): void {
    // Check if clicked an element
    const clickedElement = this.findElementAt(worldPoint, context.elements);

    if (clickedElement) {
      if (!context.selectedElementIds.includes(clickedElement.id)) {
        context.setSelectedElementIds([clickedElement.id]);
      }

      this.isDragging = true;
      this.dragStart = { ...worldPoint };
      this.selectedOriginals.clear();

      // Store initial positions
      context.elements
        .filter((el) => context.selectedElementIds.includes(el.id) || el.id === clickedElement.id)
        .forEach((el) => {
          this.selectedOriginals.set(el.id, {
            x: el.x,
            y: el.y,
            points: el.type === 'pencil' ? (el as any).points.map((p: Point) => ({ ...p })) : undefined,
          });
        });
    } else {
      // Clicked background -> clear selection
      context.setSelectedElementIds([]);
    }
  }

  public onPointerMove(worldPoint: Point, context: ToolContext): void {
    if (!this.isDragging || !this.dragStart) return;

    const dx = worldPoint.x - this.dragStart.x;
    const dy = worldPoint.y - this.dragStart.y;

    this.selectedOriginals.forEach((orig, id) => {
      const el = context.elements.find((e) => e.id === id);
      if (!el) return;

      if (el.type === 'pencil' && orig.points) {
        (el as any).points = orig.points.map((p: Point) => ({
          x: p.x + dx,
          y: p.y + dy,
        }));
      } else {
        el.x = orig.x + dx;
        el.y = orig.y + dy;
      }

      context.onElementUpdate({ ...el });
    });
  }

  public onPointerUp(): void {
    this.isDragging = false;
    this.dragStart = null;
    this.selectedOriginals.clear();
  }

  private findElementAt(point: Point, elements: WhiteboardElement[]): WhiteboardElement | null {
    const pad = 6;
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (el.type === 'pencil') {
        const pencil = el as any;
        const hit = pencil.points.some(
          (p: Point) => Math.hypot(p.x - point.x, p.y - point.y) <= el.strokeWidth + pad
        );
        if (hit) return el;
      } else {
        const minX = Math.min(el.x, el.x + (el.width || 0)) - pad;
        const maxX = Math.max(el.x, el.x + (el.width || 0)) + pad;
        const minY = Math.min(el.y, el.y + (el.height || 0)) - pad;
        const maxY = Math.max(el.y, el.y + (el.height || 0)) + pad;

        if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) {
          return el;
        }
      }
    }
    return null;
  }
}
