import { Point, ViewportState } from '../types/canvas';

export class ViewportTransform {
  public static readonly MIN_ZOOM = 0.1;
  public static readonly MAX_ZOOM = 5.0;

  /**
   * Converts screen pixel coordinates (e.g. mouse clientX/clientY) into world canvas coordinates.
   */
  public static screenToWorld(screenPoint: Point, viewport: ViewportState): Point {
    return {
      x: (screenPoint.x - viewport.x) / viewport.zoom,
      y: (screenPoint.y - viewport.y) / viewport.zoom,
    };
  }

  /**
   * Converts world canvas coordinates into screen pixel coordinates.
   */
  public static worldToScreen(worldPoint: Point, viewport: ViewportState): Point {
    return {
      x: worldPoint.x * viewport.zoom + viewport.x,
      y: worldPoint.y * viewport.zoom + viewport.y,
    };
  }

  /**
   * Calculates new viewport after zooming towards a specific screen anchor (e.g. mouse pointer).
   */
  public static zoomAtPoint(
    anchor: Point,
    deltaZoom: number,
    viewport: ViewportState
  ): ViewportState {
    const newZoom = Math.min(
      this.MAX_ZOOM,
      Math.max(this.MIN_ZOOM, viewport.zoom * deltaZoom)
    );

    // Keep the world point under the mouse stationary
    const worldAnchor = this.screenToWorld(anchor, viewport);
    const newX = anchor.x - worldAnchor.x * newZoom;
    const newY = anchor.y - worldAnchor.y * newZoom;

    return {
      x: newX,
      y: newY,
      zoom: newZoom,
    };
  }

  /**
   * Applies the viewport pan and zoom transformation to a 2D canvas context,
   * properly scaled by the device pixel ratio (DPR) so high-DPI/Windows-scaled screens
   * align the cursor with drawn strokes with 100% precision.
   */
  public static applyTransform(
    ctx: CanvasRenderingContext2D,
    viewport: ViewportState,
    dpr: number = 1
  ) {
    ctx.setTransform(
      viewport.zoom * dpr,
      0,
      0,
      viewport.zoom * dpr,
      viewport.x * dpr,
      viewport.y * dpr
    );
  }
}
