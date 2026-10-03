import * as Y from 'yjs';
import { WhiteboardElement } from '../types/canvas';

export class YDocManager {
  private doc: Y.Doc;
  private elementsMap: Y.Map<WhiteboardElement>;
  private undoManager: Y.UndoManager;

  constructor() {
    this.doc = new Y.Doc();
    this.elementsMap = this.doc.getMap<WhiteboardElement>('elements');

    // Setup UndoManager specifically tracking mutations to elementsMap
    this.undoManager = new Y.UndoManager(this.elementsMap, {
      captureTimeout: 300,
    });
  }

  public getDoc(): Y.Doc {
    return this.doc;
  }

  public getElementsMap(): Y.Map<WhiteboardElement> {
    return this.elementsMap;
  }

  public getElements(): WhiteboardElement[] {
    const list: WhiteboardElement[] = [];
    this.elementsMap.forEach((el) => list.push(el));
    return list;
  }

  public setElement(element: WhiteboardElement): void {
    this.doc.transact(() => {
      this.elementsMap.set(element.id, element);
    });
  }

  public deleteElement(elementId: string): void {
    this.doc.transact(() => {
      this.elementsMap.delete(elementId);
    });
  }

  public clearAll(): void {
    this.doc.transact(() => {
      this.elementsMap.clear();
    });
  }

  public undo(): void {
    if (this.undoManager.canUndo()) {
      this.undoManager.undo();
    }
  }

  public redo(): void {
    if (this.undoManager.canRedo()) {
      this.undoManager.redo();
    }
  }

  public canUndo(): boolean {
    return this.undoManager.canUndo();
  }

  public canRedo(): boolean {
    return this.undoManager.canRedo();
  }

  public destroy(): void {
    this.undoManager.destroy();
    this.doc.destroy();
  }
}
