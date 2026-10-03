import { WhiteboardElement } from '../types/canvas';

export type HistoryActionType = 'create' | 'update' | 'delete';

export interface HistoryEntry {
  type: HistoryActionType;
  elementId: string;
  beforeState?: WhiteboardElement;
  afterState?: WhiteboardElement;
}

export class HistoryManager {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private readonly maxHistory: number;

  constructor(maxHistory = 50) {
    this.maxHistory = maxHistory;
  }

  public recordAction(entry: HistoryEntry) {
    this.undoStack.push(entry);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    // Any new action clears redo
    this.redoStack = [];
  }

  public undo(): HistoryEntry | null {
    const entry = this.undoStack.pop();
    if (!entry) return null;

    this.redoStack.push(entry);
    return entry;
  }

  public redo(): HistoryEntry | null {
    const entry = this.redoStack.pop();
    if (!entry) return null;

    this.undoStack.push(entry);
    return entry;
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}
