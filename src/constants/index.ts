/**
 * 定数統一エクスポート
 * Convention over Configuration原則に従い、すべての設定を一箇所から管理
 */

// ゲーム関連定数
export { GAME_CONSTANTS } from './game'

// UI関連定数
export { UI_CONSTANTS } from './ui'

// アニメーション関連定数  
export { ANIMATION_CONSTANTS } from './animation'

// Achievement関連定数
export { ACHIEVEMENT_DEFINITIONS } from './achievements'

// メインの型定義とレンダリング定数は既存の場所を維持
export {
  GameState,
  Difficulty,
  CellState,
  DIFFICULTY_CONFIGS,
  SCORE_CONFIGS,
  NEON_COLORS,
  RENDER_CONSTANTS,
  LAYOUT_CONSTANTS
} from '../types'