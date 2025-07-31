export class PerformanceMonitor {
  private frameCount: number = 0
  private lastFrameTime: number = 0
  private fps: number = 0
  private deltaTime: number = 0
  private averageFps: number = 0
  private fpsHistory: number[] = []
  private isMonitoring: boolean = false
  private callback: ((stats: PerformanceStats) => void) | null = null
  private memoryStats: MemoryStats = { used: 0, total: 0, limit: 0 }

  public start(callback?: (stats: PerformanceStats) => void): void {
    this.isMonitoring = true
    this.callback = callback || null
    this.lastFrameTime = performance.now()
    this.update()
  }

  public stop(): void {
    this.isMonitoring = false
    this.callback = null
  }

  private update(): void {
    if (!this.isMonitoring) return

    const currentTime = performance.now()
    this.deltaTime = currentTime - this.lastFrameTime
    this.lastFrameTime = currentTime

    this.frameCount++
    
    if (this.deltaTime > 0) {
      this.fps = 1000 / this.deltaTime
      this.fpsHistory.push(this.fps)
      
      if (this.fpsHistory.length > 60) {
        this.fpsHistory.shift()
      }
      
      this.averageFps = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length
    }

    this.updateMemoryStats()

    if (this.callback) {
      this.callback({
        fps: Math.round(this.fps),
        averageFps: Math.round(this.averageFps),
        deltaTime: Math.round(this.deltaTime * 100) / 100,
        frameCount: this.frameCount,
        memory: this.memoryStats
      })
    }

    requestAnimationFrame(() => this.update())
  }

  private updateMemoryStats(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      this.memoryStats = {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024 * 100) / 100,
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024 * 100) / 100
      }
    }
  }

  public getStats(): PerformanceStats {
    return {
      fps: Math.round(this.fps),
      averageFps: Math.round(this.averageFps),
      deltaTime: Math.round(this.deltaTime * 100) / 100,
      frameCount: this.frameCount,
      memory: this.memoryStats
    }
  }

  public reset(): void {
    this.frameCount = 0
    this.fpsHistory = []
    this.averageFps = 0
  }

  public isLowPerformance(): boolean {
    return this.averageFps < 30 && this.fpsHistory.length > 30
  }

  public getOptimizationSuggestions(): string[] {
    const suggestions: string[] = []
    
    if (this.averageFps < 30) {
      suggestions.push('低FPS検出 - アニメーションを無効化してください')
    }
    
    if (this.memoryStats.used > this.memoryStats.limit * 0.8) {
      suggestions.push('メモリ使用量が高い - ブラウザを再起動してください')
    }
    
    if (this.deltaTime > 33.33) {
      suggestions.push('フレーム時間が長い - パーティクルエフェクトを無効化してください')
    }
    
    return suggestions
  }
}

export interface PerformanceStats {
  fps: number
  averageFps: number
  deltaTime: number
  frameCount: number
  memory: MemoryStats
}

export interface MemoryStats {
  used: number
  total: number
  limit: number
}