import { WhiteboardElement, PencilElement, ShapeElement, TextElement } from '../types/canvas';

export class CanvasRenderer {
  /**
   * Main render dispatch for any whiteboard element.
   */
  public static renderElement(ctx: CanvasRenderingContext2D, element: WhiteboardElement) {
    ctx.save();
    ctx.globalAlpha = element.opacity ?? 1.0;
    ctx.strokeStyle = element.strokeColor;
    ctx.fillStyle = element.fillColor || 'transparent';
    ctx.lineWidth = element.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (element.type) {
      case 'pencil':
        this.renderPencil(ctx, element as PencilElement);
        break;
      case 'rectangle':
        this.renderRectangle(ctx, element as ShapeElement);
        break;
      case 'diamond':
        this.renderDiamond(ctx, element as ShapeElement);
        break;
      case 'circle':
        this.renderCircle(ctx, element as ShapeElement);
        break;
      case 'arrow':
        this.renderArrow(ctx, element as ShapeElement);
        break;
      case 'line':
        this.renderLine(ctx, element as ShapeElement);
        break;
      case 'text':
      case 'sticky':
        this.renderTextOrSticky(ctx, element as TextElement);
        break;
    }

    ctx.restore();
  }

  private static renderPencil(ctx: CanvasRenderingContext2D, el: PencilElement) {
    if (!el.points || el.points.length === 0) return;

    ctx.beginPath();
    ctx.moveTo(el.points[0].x, el.points[0].y);

    if (el.points.length === 1) {
      ctx.arc(el.points[0].x, el.points[0].y, el.strokeWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = el.strokeColor;
      ctx.fill();
      return;
    }

    // Smooth quadratic curve interpolation between points
    for (let i = 1; i < el.points.length - 1; i++) {
      const xc = (el.points[i].x + el.points[i + 1].x) / 2;
      const yc = (el.points[i].y + el.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(el.points[i].x, el.points[i].y, xc, yc);
    }

    // Connect to the final point
    const lastPoint = el.points[el.points.length - 1];
    ctx.lineTo(lastPoint.x, lastPoint.y);
    ctx.stroke();
  }

  private static renderRectangle(ctx: CanvasRenderingContext2D, el: ShapeElement) {
    const w = el.width || 0;
    const h = el.height || 0;
    const radius = el.roundness === 'round' ? Math.min(16, Math.abs(w) / 4, Math.abs(h) / 4) : 0;

    if (radius > 0 && typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(el.x, el.y, w, h, radius);
      if (el.fillColor && el.fillColor !== 'transparent') {
        ctx.fill();
      }
      ctx.stroke();
    } else {
      if (el.fillColor && el.fillColor !== 'transparent') {
        ctx.fillRect(el.x, el.y, w, h);
      }
      ctx.strokeRect(el.x, el.y, w, h);
    }
  }

  private static renderDiamond(ctx: CanvasRenderingContext2D, el: ShapeElement) {
    const w = el.width || 0;
    const h = el.height || 0;
    const cx = el.x + w / 2;
    const cy = el.y + h / 2;

    ctx.beginPath();
    ctx.moveTo(cx, el.y);
    ctx.lineTo(el.x + w, cy);
    ctx.lineTo(cx, el.y + h);
    ctx.lineTo(el.x, cy);
    ctx.closePath();

    if (el.fillColor && el.fillColor !== 'transparent') {
      ctx.fill();
    }
    ctx.stroke();
  }

  private static renderCircle(ctx: CanvasRenderingContext2D, el: ShapeElement) {
    const w = el.width || 0;
    const h = el.height || 0;
    const rx = Math.abs(w / 2);
    const ry = Math.abs(h / 2);
    const cx = el.x + w / 2;
    const cy = el.y + h / 2;

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    if (el.fillColor && el.fillColor !== 'transparent') {
      ctx.fill();
    }
    ctx.stroke();
  }

  private static renderLine(ctx: CanvasRenderingContext2D, el: ShapeElement) {
    const targetX = el.x + (el.width || 0);
    const targetY = el.y + (el.height || 0);

    ctx.beginPath();
    ctx.moveTo(el.x, el.y);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();
  }

  private static renderArrow(ctx: CanvasRenderingContext2D, el: ShapeElement) {
    const targetX = el.x + (el.width || 0);
    const targetY = el.y + (el.height || 0);
    const headLength = 15;
    const dx = targetX - el.x;
    const dy = targetY - el.y;
    const angle = Math.atan2(dy, dx);

    ctx.beginPath();
    ctx.moveTo(el.x, el.y);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(targetX, targetY);
    ctx.lineTo(
      targetX - headLength * Math.cos(angle - Math.PI / 6),
      targetY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(targetX, targetY);
    ctx.lineTo(
      targetX - headLength * Math.cos(angle + Math.PI / 6),
      targetY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  }

  private static renderTextOrSticky(ctx: CanvasRenderingContext2D, el: TextElement) {
    const isSticky = el.type === 'sticky';
    const width = el.width || (isSticky ? 180 : 200);
    const height = el.height || (isSticky ? 180 : 60);

    if (isSticky) {
      // Sticky note background with soft shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.12)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = el.fillColor || '#fef08a'; // Pastel yellow
      ctx.fillRect(el.x, el.y, width, height);
      ctx.restore();
    }

    // Render Text
    ctx.fillStyle = el.strokeColor || '#1e293b';
    const fontSize = el.fontSize || (isSticky ? 16 : 20);
    ctx.font = `${fontSize}px Inter, sans-serif`;
    ctx.textBaseline = 'top';

    const padding = 12;
    const maxWidth = width - padding * 2;
    const lines = this.wrapText(ctx, el.text || 'Double click to edit', maxWidth);

    lines.forEach((line, index) => {
      ctx.fillText(line, el.x + padding, el.y + padding + index * (fontSize * 1.3));
    });
  }

  private static wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }

  /**
   * Draws a selection bounding box around selected elements.
   */
  public static renderSelectionBox(ctx: CanvasRenderingContext2D, el: WhiteboardElement) {
    ctx.save();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    const x = el.x - 4;
    const y = el.y - 4;
    const w = (el.width || 0) + 8;
    const h = (el.height || 0) + 8;

    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }
}
