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
  score: number
  comboCount: number
  bestCombo: number
  lastCellRevealTime: number | null
}

export interface GameResult {
  id: string
  difficulty: Difficulty
  startTime: number
  endTime: number
  duration: number
  success: boolean
  cellsRevealed: number
  flagsUsed: number
  gridSize: { width: number; height: number }
  mines: number
  timestamp: number
  score: number
  bestCombo: number
}

export interface ScoreConfig {
  baseRevealScore: number
  comboMultiplier: number
  comboTimeThreshold: number
  timeBonusMultiplier: number
  completionBonus: number
  perfectFlagBonus: number
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, GameConfig> = {
  [Difficulty.NOVICE]: { width: 9, height: 9, mines: 10, difficulty: Difficulty.NOVICE },
  [Difficulty.AGENT]: { width: 16, height: 16, mines: 40, difficulty: Difficulty.AGENT },
  [Difficulty.HACKER]: { width: 30, height: 16, mines: 99, difficulty: Difficulty.HACKER },
  [Difficulty.CUSTOM]: { width: 16, height: 16, mines: 40, difficulty: Difficulty.CUSTOM }
}

export const SCORE_CONFIGS: Record<Difficulty, ScoreConfig> = {
  [Difficulty.NOVICE]: {
    baseRevealScore: 10,
    comboMultiplier: 1.5,
    comboTimeThreshold: 2000,
    timeBonusMultiplier: 0.1,
    completionBonus: 1000,
    perfectFlagBonus: 500
  },
  [Difficulty.AGENT]: {
    baseRevealScore: 15,
    comboMultiplier: 2.0,
    comboTimeThreshold: 1500,
    timeBonusMultiplier: 0.15,
    completionBonus: 2000,
    perfectFlagBonus: 1000
  },
  [Difficulty.HACKER]: {
    baseRevealScore: 20,
    comboMultiplier: 2.5,
    comboTimeThreshold: 1000,
    timeBonusMultiplier: 0.25,
    completionBonus: 5000,
    perfectFlagBonus: 2500
  },
  [Difficulty.CUSTOM]: {
    baseRevealScore: 15,
    comboMultiplier: 2.0,
    comboTimeThreshold: 1500,
    timeBonusMultiplier: 0.15,
    completionBonus: 2000,
    perfectFlagBonus: 1000
  }
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
    neonCyan: '#00ffff',
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

export const RENDER_CONSTANTS = {
  CELL: {
    SIZE: 32,
    SPACING: 2,
    BORDER_WIDTH: 1,
    CORNER_RADIUS: 2
  },
  ANIMATION: {
    REVEAL_DURATION: 200,
    FLAG_DURATION: 150,
    BOUNCE_DURATION: 400,
    FADE_DURATION: 300
  },
  EFFECTS: {
    PULSE_INTENSITY: 0.05,
    PULSE_DURATION: 2000,
    SHAKE_INTENSITY: 15,
    SHAKE_DURATION: 500
  }
} as const

export const LAYOUT_CONSTANTS = {
  HEADER: {
    HEIGHT: 80,
    BACKGROUND_RADIUS: 8,
    BACKGROUND_ALPHA: 0.9,
    BORDER_WIDTH: 2,
    BORDER_ALPHA: 0.5,
    MARGIN: 20
  },
  GRID: {
    Y_POSITION: 120,
    MARGIN: 20
  },
  STATS: {
    PANEL_HEIGHT: 180,
    MARGIN: 40,
    PANEL_WIDTH: 300
  },
  TEXT: {
    FONT_FAMILY: 'Courier New, monospace',
    TIMER_SIZE: 24,
    MINE_COUNT_SIZE: 24,
    STATUS_SIZE: 20,
    DIFFICULTY_SIZE: 16,
    STATS_SIZE: 14
  }
} as const

export interface CellClickInfo {
  coordinates: { x: number; y: number }
  cell: Cell
  container: any // PIXI.Container
  worldPosition: { x: number; y: number }
}

export interface ActionResult {
  shouldPlayEffect: boolean
  effectType?: 'explosion' | 'reveal' | 'flag'
}

export class GameInitializationError extends Error {
  constructor(message: string, public readonly code: string = 'INIT_FAILED') {
    super(message)
    this.name = 'GameInitializationError'
  }
}