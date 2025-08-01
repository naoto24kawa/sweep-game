import * as PIXI from 'pixi.js'
import { MemoryManager } from '@/performance/ObjectPool'
import { ANIMATION_CONSTANTS } from '@/constants/animation'

export interface AnimationConfig {
  duration: number
  easing?: (t: number) => number
  onComplete?: () => void
  onUpdate?: (progress: number) => void
}

export interface Tween {
  target: PIXI.Container
  startValues: Record<string, number>
  endValues: Record<string, number>
  config: AnimationConfig
  startTime: number
  isActive: boolean
}

export class AnimationManager {
  private tweens: Tween[] = []
  private ticker: PIXI.Ticker
  private memoryManager: MemoryManager
  private frameCount: number = 0
  private readonly cleanupInterval = ANIMATION_CONSTANTS.PERFORMANCE.CLEANUP_INTERVAL_FRAMES

  constructor() {
    this.ticker = new PIXI.Ticker()
    this.ticker.add(this.update.bind(this))
    this.ticker.start()
    
    this.memoryManager = MemoryManager.getInstance()
    this.setupTweenPool()
  }

  private setupTweenPool(): void {
    this.memoryManager.createPool<Tween>(
      'tweens',
      () => ({
        target: new PIXI.Container(),
        startValues: {},
        endValues: {},
        config: { duration: 0 },
        startTime: 0,
        isActive: false
      }),
      (tween) => {
        tween.startValues = {}
        tween.endValues = {}
        tween.isActive = false
        tween.startTime = 0
      },
      ANIMATION_CONSTANTS.PERFORMANCE.TWEEN_POOL_INITIAL_SIZE,
      ANIMATION_CONSTANTS.PERFORMANCE.TWEEN_POOL_MAX_SIZE
    )
  }

  private update(): void {
    const currentTime = Date.now()
    this.frameCount++
    
    const completedTweens: Tween[] = []
    
    this.tweens = this.tweens.filter(tween => {
      if (!tween.isActive || !tween.target || tween.target.destroyed) {
        completedTweens.push(tween)
        return false
      }

      const elapsed = currentTime - tween.startTime
      const progress = Math.min(elapsed / tween.config.duration, 1)
      const easedProgress = tween.config.easing ? tween.config.easing(progress) : progress

      try {
        for (const [property, endValue] of Object.entries(tween.endValues)) {
          const startValue = tween.startValues[property]
          const currentValue = startValue + (endValue - startValue) * easedProgress
          
          if (property.includes('.')) {
            const parts = property.split('.')
            let obj = tween.target as any
            for (let i = 0; i < parts.length - 1; i++) {
              if (!obj || !obj[parts[i]]) return false
              obj = obj[parts[i]]
            }
            if (obj) {
              obj[parts[parts.length - 1]] = currentValue
            }
          } else {
            (tween.target as any)[property] = currentValue
          }
        }
      } catch (error) {
        console.warn('Animation target error, removing tween:', error)
        completedTweens.push(tween)
        return false
      }

      if (tween.config.onUpdate) {
        tween.config.onUpdate(easedProgress)
      }

      if (progress >= 1) {
        tween.isActive = false
        if (tween.config.onComplete) {
          tween.config.onComplete()
        }
        completedTweens.push(tween)
        return false
      }

      return true
    })

    // 完了したトゥイーンをプールに戻す
    const tweenPool = this.memoryManager.getPool<Tween>('tweens')
    if (tweenPool) {
      completedTweens.forEach(tween => tweenPool.release(tween))
    }

    // 定期的なメモリクリーンアップ
    if (this.frameCount % this.cleanupInterval === 0) {
      this.memoryManager.optimizeMemory()
    }
  }

  public to(
    target: PIXI.Container,
    endValues: Record<string, number>,
    config: AnimationConfig
  ): void {
    const startValues: Record<string, number> = {}
    
    for (const property of Object.keys(endValues)) {
      startValues[property] = (target as any)[property] || 0
    }

    const tweenPool = this.memoryManager.getPool<Tween>('tweens')
    const tween = tweenPool ? tweenPool.get() : {
      target: new PIXI.Container(),
      startValues: {},
      endValues: {},
      config: { duration: 0 },
      startTime: 0,
      isActive: false
    }

    // トゥイーンの設定
    tween.target = target
    tween.startValues = startValues
    tween.endValues = endValues
    tween.config = config
    tween.startTime = Date.now()
    tween.isActive = true

    this.tweens.push(tween)
  }

  public fadeIn(target: PIXI.Container, duration: number = ANIMATION_CONSTANTS.DURATIONS.FADE_IN_DEFAULT, onComplete?: () => void): void {
    target.alpha = 0
    this.to(target, { alpha: 1 }, { duration, onComplete })
  }

  public fadeOut(target: PIXI.Container, duration: number = ANIMATION_CONSTANTS.DURATIONS.FADE_OUT_DEFAULT, onComplete?: () => void): void {
    this.to(target, { alpha: 0 }, { duration, onComplete })
  }

  public scaleUp(target: PIXI.Container, duration: number = ANIMATION_CONSTANTS.DURATIONS.SCALE_UP_DEFAULT, onComplete?: () => void): void {
    target.scale.set(ANIMATION_CONSTANTS.SCALING.SCALE_UP_INITIAL)
    this.to(target, { 'scale.x': 1, 'scale.y': 1 }, { 
      duration, 
      easing: this.easeOutBack,
      onComplete 
    })
  }

  public bounce(target: PIXI.Container, duration: number = ANIMATION_CONSTANTS.DURATIONS.BOUNCE_DEFAULT, onComplete?: () => void): void {
    const originalScale = target.scale.x
    this.to(target, { 'scale.x': originalScale * ANIMATION_CONSTANTS.SCALING.BOUNCE_SCALE_MULTIPLIER, 'scale.y': originalScale * ANIMATION_CONSTANTS.SCALING.BOUNCE_SCALE_MULTIPLIER }, {
      duration: duration / 2,
      easing: this.easeOutQuad,
      onComplete: () => {
        this.to(target, { 'scale.x': originalScale, 'scale.y': originalScale }, {
          duration: duration / 2,
          easing: this.easeOutBounce,
          onComplete
        })
      }
    })
  }

  public pulse(target: PIXI.Container, intensity: number = ANIMATION_CONSTANTS.SCALING.PULSE_DEFAULT_INTENSITY, duration: number = ANIMATION_CONSTANTS.DURATIONS.PULSE_DEFAULT, loops: number = ANIMATION_CONSTANTS.EFFECTS.INFINITE_LOOPS): void {
    if (loops === 0) return
    
    const originalScale = target.scale.x
    const targetScale = originalScale + intensity

    this.to(target, { 'scale.x': targetScale, 'scale.y': targetScale }, {
      duration: duration / 2,
      easing: this.easeInOutSine,
      onComplete: () => {
        this.to(target, { 'scale.x': originalScale, 'scale.y': originalScale }, {
          duration: duration / 2,
          easing: this.easeInOutSine,
          onComplete: () => {
            if (loops > 0) {
              this.pulse(target, intensity, duration, loops - 1)
            } else if (loops === ANIMATION_CONSTANTS.EFFECTS.INFINITE_LOOPS) {
              this.pulse(target, intensity, duration, ANIMATION_CONSTANTS.EFFECTS.INFINITE_LOOPS)
            }
          }
        })
      }
    })
  }

  public shake(target: PIXI.Container, intensity: number = 5, duration: number = ANIMATION_CONSTANTS.DURATIONS.SHAKE_DEFAULT): void {
    const originalX = target.x
    const originalY = target.y
    const shakeCount = ANIMATION_CONSTANTS.EFFECTS.SHAKE_COUNT
    const shakeInterval = duration / shakeCount

    for (let i = 0; i < shakeCount; i++) {
      setTimeout(() => {
        if (i === shakeCount - 1) {
          target.x = originalX
          target.y = originalY
        } else {
          target.x = originalX + (Math.random() - 0.5) * intensity * 2
          target.y = originalY + (Math.random() - 0.5) * intensity * 2
        }
      }, i * shakeInterval)
    }
  }

  public stop(target?: PIXI.Container): void {
    if (target) {
      this.tweens = this.tweens.filter(tween => tween.target !== target)
    } else {
      this.tweens.forEach(tween => {
        tween.isActive = false
      })
      this.tweens = []
    }
  }

  public destroy(): void {
    this.ticker.destroy()
    
    // 全てのトゥイーンをプールに戻す
    const tweenPool = this.memoryManager.getPool<Tween>('tweens')
    if (tweenPool) {
      this.tweens.forEach(tween => tweenPool.release(tween))
    }
    
    this.tweens = []
    this.memoryManager.clearPool('tweens')
  }

  private easeOutBack(t: number): number {
    const c1 = ANIMATION_CONSTANTS.EASING_COEFFICIENTS.BACK_C1
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  }

  private easeOutQuad(t: number): number {
    return 1 - (1 - t) * (1 - t)
  }

  private easeOutBounce(t: number): number {
    const n1 = ANIMATION_CONSTANTS.EASING_COEFFICIENTS.BOUNCE_N1
    const d1 = ANIMATION_CONSTANTS.EASING_COEFFICIENTS.BOUNCE_D1

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

  private easeInOutSine(t: number): number {
    return -(Math.cos(Math.PI * t) - 1) / 2
  }
}