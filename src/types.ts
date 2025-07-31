export enum GameState {
  READY = 'READY',
  ACTIVE = 'ACTIVE',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PAUSED = 'PAUSED'
}

export enum Difficulty {
  NOVICE = 'NOVICE',
  AGENT = 'AGENT',
  HACKER = 'HACKER',
  CUSTOM = 'CUSTOM'
}

export enum CellState {
  HIDDEN = 'HIDDEN',
  REVEALED = 'REVEALED',
  FLAGGED = 'FLAGGED',
  QUESTIONED = 'QUESTIONED'
}

export interface Cell {
  x: number
  y: number
  state: CellState
  isMine: boolean
  adjacentMines: number
  id: string
}

export interface GameConfig {
  width: number
  height: number
  mines: number
  difficulty: Difficulty
}

export interface GameStats {
  startTime: number | null
  endTime: number | null
  elapsedTime: number
  flagsUsed: number
  cellsRevealed: number
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, GameConfig> = {
  [Difficulty.NOVICE]: { width: 9, height: 9, mines: 10, difficulty: Difficulty.NOVICE },
  [Difficulty.AGENT]: { width: 16, height: 16, mines: 40, difficulty: Difficulty.AGENT },
  [Difficulty.HACKER]: { width: 30, height: 16, mines: 99, difficulty: Difficulty.HACKER },
  [Difficulty.CUSTOM]: { width: 16, height: 16, mines: 40, difficulty: Difficulty.CUSTOM }
}

export const NEON_COLORS = {
  numbers: {
    1: '#00ffff',
    2: '#00ff41',
    3: '#ffff00',
    4: '#bf00ff',
    5: '#ff00bf',
    6: '#ff9500',
    7: '#80ff00',
    8: '#ff0040'
  },
  primary: {
    darkGray: '#1a1a1a',
    deepBlack: '#0d0d0d'
  },
  accent: {
    neonBlue: '#00ffff',
    neonGreen: '#00ff41'
  },
  warning: {
    neonRed: '#ff0040',
    neonOrange: '#ff9500'
  },
  text: {
    white: '#ffffff',
    lightGray: '#cccccc'
  }
}