
export interface Note {
  note: string; // e.g., "C4", "F#5"
  duration: number; // in beats, e.g., 1 for quarter note
  timing: number; // start time in beats from the beginning
}

export interface SongData {
  title: string;
  bpm: number;
  notes: Note[];
}

export type GameState = 'idle' | 'loading' | 'playing' | 'finished' | 'error';
