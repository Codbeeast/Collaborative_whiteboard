import { Point } from './canvas';

export interface UserProfile {
  id: string;
  name: string;
  color: string;
}

export interface UserPresence {
  user: UserProfile;
  cursor: Point | null; // Always in World coordinates
  selectedElementIds: string[];
  lastActive: number;
}
