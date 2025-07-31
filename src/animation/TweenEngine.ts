import * as PIXI from 'pixi.js'

/**
 * トゥイーンオブジェクトインターface
 */
export interface Tween {
  id: string
  target: PIXI.Container
  startTime: number
  duration: number
  startValues: Record<string, number>
  endValues: Record<string, number>
  easing: (t: number) => number
  onComplete?: () => void
}

/**
 * 基本的なトゥイーンエンジンクラス
 * アニメーション実行の核となる処理のみを担当
 */
export class TweenEngine {
  private activeTweens: Map<string, Tween> = new Map()
  private animationFrameId: number | null = null
  private isRunning = false

  /**
   * トゥイーンを開始
   * @param target アニメーション対象
   * @param endValues 終了値
   * @param duration 継続時間（ミリ秒）
   * @param easing イージング関数
   * @param onComplete 完了コールバック
   * @returns トゥイーンID
   */
  public startTween(
    target: PIXI.Container,
    endValues: Record<string, number>,
    duration: number,
    easing: (t: number) => number = this.easeLinear,
    onComplete?: () => void
  ): string {
    const id = this.generateTweenId()
    const startValues: Record<string, number> = {}

    // 開始値を記録
    for (const property in endValues) {
      startValues[property] = this.getPropertyValue(target, property)
    }

    const tween: Tween = {
      id,
      target,
      startTime: performance.now(),
      duration,
      startValues,
      endValues,
      easing,
      onComplete
    }

    this.activeTweens.set(id, tween)
    this.startAnimationLoop()
    
    return id
  }

  /**
   * 指定されたトゥイーンを停止
   * @param id トゥイーンID
   */
  public stopTween(id: string): void {
    this.activeTweens.delete(id)
    
    if (this.activeTweens.size === 0) {
      this.stopAnimationLoop()
    }
  }

  /**
   * 対象オブジェクトのすべてのトゥイーンを停止
   * @param target 対象オブジェクト
   */
  public stopAllTweensForTarget(target: PIXI.Container): void {
    for (const [id, tween] of this.activeTweens) {
      if (tween.target === target) {
        this.activeTweens.delete(id)
      }
    }
    
    if (this.activeTweens.size === 0) {
      this.stopAnimationLoop()
    }
  }

  /**
   * すべてのトゥイーンを停止
   */
  public stopAllTweens(): void {
    this.activeTweens.clear()
    this.stopAnimationLoop()
  }

  /**
   * アクティブなトゥイーン数を取得
   * @returns アクティブトゥイーン数
   */
  public getActiveTweenCount(): number {
    return this.activeTweens.size
  }

  /**
   * アニメーションループを開始
   */
  private startAnimationLoop(): void {
    if (!this.isRunning) {
      this.isRunning = true
      this.animationLoop()
    }
  }

  /**
   * アニメーションループを停止
   */
  private stopAnimationLoop(): void {
    this.isRunning = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  /**
   * アニメーションループ
   */
  private animationLoop(): void {
    if (!this.isRunning) return

    const currentTime = performance.now()
    const completedTweens: string[] = []

    for (const [id, tween] of this.activeTweens) {
      const elapsed = currentTime - tween.startTime
      const progress = Math.min(elapsed / tween.duration, 1)
      const easedProgress = tween.easing(progress)

      // プロパティを更新
      for (const property in tween.endValues) {
        const startValue = tween.startValues[property]
        const endValue = tween.endValues[property]
        const currentValue = startValue + (endValue - startValue) * easedProgress
        this.setPropertyValue(tween.target, property, currentValue)
      }

      // 完了チェック
      if (progress >= 1) {
        completedTweens.push(id)
        if (tween.onComplete) {
          tween.onComplete()
        }
      }
    }

    // 完了したトゥイーンを削除
    for (const id of completedTweens) {
      this.activeTweens.delete(id)
    }

    if (this.activeTweens.size > 0) {
      this.animationFrameId = requestAnimationFrame(() => this.animationLoop())
    } else {
      this.stopAnimationLoop()
    }
  }

  /**
   * オブジェクトのプロパティ値を取得
   * @param target 対象オブジェクト
   * @param property プロパティ名
   * @returns プロパティ値
   */
  private getPropertyValue(target: PIXI.Container, property: string): number {
    switch (property) {
      case 'x': return target.x
      case 'y': return target.y
      case 'scaleX': return target.scale.x
      case 'scaleY': return target.scale.y
      case 'rotation': return target.rotation
      case 'alpha': return target.alpha
      default: return 0
    }
  }

  /**
   * オブジェクトのプロパティ値を設定
   * @param target 対象オブジェクト
   * @param property プロパティ名
   * @param value 値
   */
  private setPropertyValue(target: PIXI.Container, property: string, value: number): void {
    switch (property) {
      case 'x': target.x = value; break
      case 'y': target.y = value; break
      case 'scaleX': target.scale.x = value; break
      case 'scaleY': target.scale.y = value; break
      case 'rotation': target.rotation = value; break
      case 'alpha': target.alpha = value; break
    }
  }

  /**
   * 一意のトゥイーンIDを生成
   * @returns トゥイーンID
   */
  private generateTweenId(): string {
    return `tween_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * リニアイージング関数
   * @param t 進行率（0-1）
   * @returns イージング値
   */
  private easeLinear(t: number): number {
    return t
  }

  /**
   * リソースを破棄
   */
  public destroy(): void {
    this.stopAllTweens()
  }
}