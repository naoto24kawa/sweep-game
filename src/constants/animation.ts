/**
 * アニメーション関連の定数定義
 * マジックナンバーを排除し、アニメーション設定を集約管理
 */

export const ANIMATION_CONSTANTS = {
  PERFORMANCE: {
    /** フレーム数ベースのクリーンアップ間隔 */
    CLEANUP_INTERVAL_FRAMES: 300,
    /** Tweenオブジェクトプールの初期サイズ */
    TWEEN_POOL_INITIAL_SIZE: 20,
    /** Tweenオブジェクトプールの最大サイズ */
    TWEEN_POOL_MAX_SIZE: 50,
  },
  
  EFFECTS: {
    /** シェイクエフェクトの振動回数 */
    SHAKE_COUNT: 20,
    /** パルスエフェクトの無限ループ識別子 */
    INFINITE_LOOPS: -1,
  },
  
  DURATIONS: {
    /** デフォルトフェードイン時間（ms） */
    FADE_IN_DEFAULT: 300,
    /** デフォルトフェードアウト時間（ms） */
    FADE_OUT_DEFAULT: 300,
    /** スケールアップアニメーション時間（ms） */
    SCALE_UP_DEFAULT: 200,
    /** バウンスアニメーション時間（ms） */
    BOUNCE_DEFAULT: 400,
    /** パルスアニメーション時間（ms） */
    PULSE_DEFAULT: 1000,
    /** シェイクアニメーション時間（ms） */
    SHAKE_DEFAULT: 500,
  },
  
  EASING_COEFFICIENTS: {
    /** easeOutBack関数の係数 */
    BACK_C1: 1.70158,
    /** easeOutBounce関数の係数 */
    BOUNCE_N1: 7.5625,
    BOUNCE_D1: 2.75,
  },
  
  SCALING: {
    /** スケールアップ時の初期スケール値 */
    SCALE_UP_INITIAL: 0.1,
    /** バウンス時のスケール倍率 */
    BOUNCE_SCALE_MULTIPLIER: 1.3,
    /** パルスエフェクトのデフォルト強度 */
    PULSE_DEFAULT_INTENSITY: 0.1,
  }
} as const