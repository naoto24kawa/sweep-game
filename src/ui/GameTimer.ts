/**
 * ゲーム時間管理専用クラス
 * タイマー機能と時間計算を担当
 */
export class GameTimer {
  private startTime: number | null = null
  private currentTime: number = 0
  private updateTimer: number | null = null
  private isActive: boolean = false

  private onUpdate?: (timeString: string) => void

  constructor(onUpdate?: (timeString: string) => void) {
    this.onUpdate = onUpdate
  }

  public start(): void {
    if (this.isActive) return
    
    this.startTime = Date.now()
    this.isActive = true
    this.startUpdateLoop()
  }

  public pause(): void {
    this.isActive = false
    if (this.updateTimer) {
      clearInterval(this.updateTimer)
      this.updateTimer = null
    }
  }

  public reset(): void {
    this.pause()
    this.startTime = null
    this.currentTime = 0
    this.updateDisplay()
  }

  public getElapsedTime(): number {
    return this.currentTime
  }

  public getFormattedTime(): string {
    const totalSeconds = Math.floor(this.currentTime / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  private startUpdateLoop(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer)
    }

    this.updateTimer = window.setInterval(() => {
      if (this.isActive && this.startTime) {
        this.currentTime = Date.now() - this.startTime
        this.updateDisplay()
      }
    }, 1000)
  }

  private updateDisplay(): void {
    if (this.onUpdate) {
      this.onUpdate(this.getFormattedTime())
    }
  }

  public destroy(): void {
    this.pause()
  }
}