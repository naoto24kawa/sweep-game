/**
 * ゲーム関連の定数定義
 */

export const GAME_CONSTANTS = {
  GRID: {
    /** セルサイズとスペーシングを含む実効幅の計算に使用 */
    EFFECTIVE_CELL_WIDTH: 34,
    /** セル配置調整用のオフセット */
    CELL_OFFSET: 2,
  }
} as const