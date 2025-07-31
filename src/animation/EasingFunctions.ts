/**
 * イージング関数群
 * 様々なアニメーション効果のためのイージング関数を提供
 */
export class EasingFunctions {
  /**
   * リニアイージング
   * @param t 進行率（0-1）
   * @returns イージング値
   */
  public static linear(t: number): number {
    return t
  }

  /**
   * イーズイン（二次関数）
   * @param t 進行率（0-1）
   * @returns イージング値
   */
  public static easeInQuad(t: number): number {
    return t * t
  }

  /**
   * イーズアウト（二次関数）
   * @param t 進行率（0-1）
   * @returns イージング値
   */
  public static easeOutQuad(t: number): number {
    return t * (2 - t)
  }

  /**
   * イーズインアウト（二次関数）
   * @param t 進行率（0-1）
   * @returns イージング値
   */
  public static easeInOutQuad(t: number): number {
    if (t < 0.5) {
      return 2 * t * t
    }
    return -1 + (4 - 2 * t) * t
  }

  /**
   * イーズアウトバック（オーバーシュート効果）
   * @param t 進行率（0-1）
   * @returns イージング値
   */
  public static easeOutBack(t: number): number {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  }

  /**
   * イーズアウトバウンス（跳ね返り効果）
   * @param t 進行率（0-1）
   * @returns イージング値
   */
  public static easeOutBounce(t: number): number {
    const n1 = 7.5625
    const d1 = 2.75

    if (t < 1 / d1) {
      return n1 * t * t
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375
    }
  }

  /**
   * イーズアウトエラスティック（弾性効果）
   * @param t 進行率（0-1）
   * @returns イージング値
   */
  public static easeOutElastic(t: number): number {
    const c4 = (2 * Math.PI) / 3

    if (t === 0) return 0
    if (t === 1) return 1

    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  }

  /**
   * イーズインキュービック
   * @param t 進行率（0-1）
   * @returns イージング値
   */
  public static easeInCubic(t: number): number {
    return t * t * t
  }

  /**
   * イーズアウトキュービック
   * @param t 進行率（0-1）
   * @returns イージング値
   */
  public static easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
  }

  /**
   * イーズインアウトキュービック
   * @param t 進行率（0-1）
   * @returns イージング値
   */
  public static easeInOutCubic(t: number): number {
    if (t < 0.5) {
      return 4 * t * t * t
    }
    return 1 - Math.pow(-2 * t + 2, 3) / 2
  }
}