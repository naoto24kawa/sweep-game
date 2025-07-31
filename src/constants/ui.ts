/**
 * UI関連の定数定義
 * マジックナンバーを排除し、意図を明確にする
 */

export const UI_CONSTANTS = {
  INITIALIZATION: {
    /** レベル選択画面表示の遅延時間（ms） */
    LEVEL_SELECTOR_DELAY: 100,
  },
  
  HEADER: {
    /** ヘッダーの高さ（px） */
    HEIGHT: 80,
    /** グリッドから上部UIまでの距離（px） */
    GRID_OFFSET: 100,
    /** 最小上部マージン（px） */
    MIN_TOP_MARGIN: 20,
  },
  
  SPACING: {
    /** UI要素間の標準スペース（px） */
    STANDARD: 20,
    /** 小さなスペース（px） */
    SMALL: 10,
    /** 極小スペース（px） */
    TINY: 5,
    /** 特大スペース（px） */
    LARGE: 45,
    /** セル間のスペース（px） */
    CELL_SPACING: 2,
    /** セルサイズ（px） */
    CELL_SIZE: 34,
  },
  
  UPDATE_INTERVALS: {
    /** アクティブゲーム時のUI更新間隔（ms） */
    ACTIVE_GAME: 100,
    /** 待機状態の更新間隔（ms） */
    READY_STATE: 500,
    /** その他状態の更新間隔（ms） */
    OTHER_STATES: 1000,
  },
  
  BORDER: {
    /** 角丸の半径（px） */
    RADIUS: 8,
    /** ボーダーの幅（px） */
    WIDTH: 2,
  },
  
  TEXT: {
    /** タイマーとマインカウンターのフォントサイズ */
    TIMER_FONT_SIZE: 24,
    /** ステータステキストのフォントサイズ */
    STATUS_FONT_SIZE: 20,
    /** 難易度テキストのフォントサイズ */
    DIFFICULTY_FONT_SIZE: 16,
    /** ステータステキストの上端からのオフセット */
    STATUS_TOP_OFFSET: 15,
  },
  
  SHADOW: {
    /** ドロップシャドウの距離 */
    DISTANCE: 2,
    /** ドロップシャドウのぼかし */
    BLUR: 4,
    /** ドロップシャドウの透明度 */
    ALPHA: 0.8,
  },
  
  ACHIEVEMENT: {
    /** Achievementボタンの位置（左上からのオフセット） */
    BUTTON_X: 40,
    BUTTON_Y: 60,
    /** Achievementボタンの半径 */
    BUTTON_RADIUS: 25,
    /** Achievementボタンのz-index */
    BUTTON_Z_INDEX: 1000,
    /** Achievement数バッジの位置（ボタン中心からのオフセット） */
    BADGE_X: 15,
    BADGE_Y: -15,
    /** Achievement数バッジの半径 */
    BADGE_RADIUS: 8,
    /** Achievement数バッジのフォントサイズ */
    BADGE_FONT_SIZE: 10,
  }
} as const