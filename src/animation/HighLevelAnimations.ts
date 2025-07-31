import * as PIXI from 'pixi.js'
import { TweenEngine } from './TweenEngine'
import { EasingFunctions } from './EasingFunctions'

/**
 * 高レベルアニメーションAPI
 * よく使用されるアニメーション効果を簡単に使用できるインターフェースを提供
 */
export class HighLevelAnimations {
  constructor(private tweenEngine: TweenEngine) {}

  /**
   * フェードインアニメーション
   * @param target 対象オブジェクト
   * @param duration 継続時間（ミリ秒）
   * @param onComplete 完了コールバック
   * @returns アニメーションID
   */
  public fadeIn(target: PIXI.Container, duration: number, onComplete?: () => void): string {
    target.alpha = 0
    return this.tweenEngine.startTween(
      target,
      { alpha: 1 },
      duration,
      EasingFunctions.easeOutQuad,
      onComplete
    )
  }

  /**
   * フェードアウトアニメーション
   * @param target 対象オブジェクト
   * @param duration 継続時間（ミリ秒）
   * @param onComplete 完了コールバック
   * @returns アニメーションID
   */
  public fadeOut(target: PIXI.Container, duration: number, onComplete?: () => void): string {
    return this.tweenEngine.startTween(
      target,
      { alpha: 0 },
      duration,
      EasingFunctions.easeOutQuad,
      onComplete
    )
  }

  /**
   * スケールアップアニメーション
   * @param target 対象オブジェクト
   * @param duration 継続時間（ミリ秒）
   * @param onComplete 完了コールバック
   * @returns アニメーションID
   */
  public scaleUp(target: PIXI.Container, duration: number, onComplete?: () => void): string {
    target.scale.set(0)
    return this.tweenEngine.startTween(
      target,
      { scaleX: 1, scaleY: 1 },
      duration,
      EasingFunctions.easeOutBack,
      onComplete
    )
  }

  /**
   * バウンスアニメーション
   * @param target 対象オブジェクト
   * @param duration 継続時間（ミリ秒）
   * @param onComplete 完了コールバック
   * @returns アニメーションID
   */
  public bounce(target: PIXI.Container, duration: number, onComplete?: () => void): string {
    const originalScaleX = target.scale.x
    const originalScaleY = target.scale.y
    
    return this.tweenEngine.startTween(
      target,
      { scaleX: originalScaleX * 1.2, scaleY: originalScaleY * 1.2 },
      duration * 0.3,
      EasingFunctions.easeOutQuad,
      () => {
        this.tweenEngine.startTween(
          target,
          { scaleX: originalScaleX, scaleY: originalScaleY },
          duration * 0.7,
          EasingFunctions.easeOutBounce,
          onComplete
        )
      }
    )
  }

  /**
   * パルスアニメーション（継続的な拡大縮小）
   * @param target 対象オブジェクト
   * @param intensity 強度（0-1）
   * @param duration 1サイクルの継続時間（ミリ秒）
   * @param onComplete 完了コールバック
   * @returns アニメーションID
   */
  public pulse(target: PIXI.Container, intensity: number, duration: number, onComplete?: () => void): string {
    const originalScaleX = target.scale.x
    const originalScaleY = target.scale.y
    const maxScale = 1 + intensity
    
    return this.tweenEngine.startTween(
      target,
      { scaleX: maxScale, scaleY: maxScale },
      duration * 0.5,
      EasingFunctions.easeInOutQuad,
      () => {
        this.tweenEngine.startTween(
          target,
          { scaleX: originalScaleX, scaleY: originalScaleY },
          duration * 0.5,
          EasingFunctions.easeInOutQuad,
          onComplete
        )
      }
    )
  }

  /**
   * シェイクアニメーション
   * @param target 対象オブジェクト
   * @param intensity 強度（ピクセル）
   * @param duration 継続時間（ミリ秒）
   * @param onComplete 完了コールバック
   * @returns アニメーションID
   */
  public shake(target: PIXI.Container, intensity: number, duration: number, onComplete?: () => void): string {
    const originalX = target.x
    const originalY = target.y
    const steps = 10
    const stepDuration = duration / steps
    
    let currentStep = 0
    
    const performShakeStep = (): void => {
      if (currentStep >= steps) {
        target.x = originalX
        target.y = originalY
        if (onComplete) onComplete()
        return
      }
      
      const offsetX = (Math.random() - 0.5) * intensity * 2
      const offsetY = (Math.random() - 0.5) * intensity * 2
      
      this.tweenEngine.startTween(
        target,
        { x: originalX + offsetX, y: originalY + offsetY },
        stepDuration,
        EasingFunctions.linear,
        () => {
          currentStep++
          performShakeStep()
        }
      )
    }
    
    performShakeStep()
    return `shake_${Date.now()}`
  }

  /**
   * 回転フェードアウト
   * @param target 対象オブジェクト
   * @param duration 継続時間（ミリ秒）
   * @param onComplete 完了コールバック
   * @returns アニメーションID
   */
  public spinFadeOut(target: PIXI.Container, duration: number, onComplete?: () => void): string {
    return this.tweenEngine.startTween(
      target,
      { rotation: Math.PI * 2, alpha: 0, scaleX: 0, scaleY: 0 },
      duration,
      EasingFunctions.easeInCubic,
      onComplete
    )
  }

  /**
   * 対象のすべてのアニメーションを停止
   * @param target 対象オブジェクト
   */
  public stop(target: PIXI.Container): void {
    this.tweenEngine.stopAllTweensForTarget(target)
  }

  /**
   * すべてのアニメーションを停止
   */
  public stopAll(): void {
    this.tweenEngine.stopAllTweens()
  }
}