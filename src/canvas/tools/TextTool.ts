import { BaseTool, ToolContext } from './BaseTool';
import { Point, TextElement, ToolType } from '../../types/canvas';
import { v4 as uuidv4 } from 'uuid';

export class TextTool extends BaseTool {
  readonly type: ToolType = 'text';

  public onPointerDown(worldPoint: Point, context: ToolContext): void {
    const textElement: TextElement = {
      id: uuidv4(),
      type: 'text',
      x: worldPoint.x,
      y: worldPoint.y,
      width: 140,
      height: 36,
      strokeColor: context.strokeColor,
      strokeWidth: context.strokeWidth,
      opacity: context.opacity,
      text: 'Type text...',
      fontSize: 20,
      createdBy: context.userId,
      updatedAt: Date.now(),
    };

    context.onElementCreate(textElement);
    context.setSelectedElementIds([textElement.id]);
  }

  public onPointerMove(): void {
    // Text tool is click-to-place
  }

  public onPointerUp(): void {
    // Handled in pointer down
  }
}
