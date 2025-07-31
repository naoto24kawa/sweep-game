import { GameState } from '@/types'
import { GameLogic } from '@/game/GameLogic'
import { UI_CONSTANTS } from '@/constants/ui'

/**
 * ゲーム内タイマーの管理を専門に行うクラス  
 * 単一責任: 時間計測とアップデートループ制御
 */
export class GameTimer {
  private gameLogic: GameLogic
  private startTime: number | null = null
  private currentTime: number = 0
  private updateTimer: number | null = null
  private lastUpdateTime: number = 0
  private isActive: boolean = false
  private onTimeUpdate: (time: number) => void
  
  constructor(gameLogic: GameLogic, onTimeUpdate: (time: number) => void) {
    this.gameLogic = gameLogic
    this.onTimeUpdate = onTimeUpdate
  }
  
  /**
   * タイマーとアップデートループを開始
   */
  public start(): void {
    this.isActive = true
    this.lastUpdateTime = performance.now()
    this.startUpdateLoop()
  }
  
  /**
   * タイマーとアップデートループを停止
   */
  public stop(): void {
    this.isActive = false
    if (this.updateTimer) {
      cancelAnimationFrame(this.updateTimer)
      this.updateTimer = null
    }
  }
  
  /**
   * 現在の経過時間を取得
   */
  public getCurrentTime(): number {
    return this.currentTime
  }
  
  /**
   * タイマーをリセット
   */
  public reset(): void {
    this.startTime = null
    this.currentTime = 0
    this.lastUpdateTime = performance.now()
  }
  
  /**
   * ゲーム状態に応じた更新間隔を取得
   */
  private getUpdateInterval(): number {
    const gameState = this.gameLogic.getGameState()
    
    switch (gameState) {
      case GameState.ACTIVE: 
        return UI_CONSTANTS.UPDATE_INTERVALS.ACTIVE_GAME
      case GameState.READY: 
        return UI_CONSTANTS.UPDATE_INTERVALS.READY_STATE
      default: 
        return UI_CONSTANTS.UPDATE_INTERVALS.OTHER_STATES
    }
  }
  
  /**
   * メインのアップデートループ
   */
  private startUpdateLoop(): void {
    const updateLoop = () => {
      if (this.shouldUpdateUI()) {
        this.updateTime()
        this.onTimeUpdate(this.currentTime)
      }
      
      if (this.isActive) {
        this.updateTimer = requestAnimationFrame(updateLoop) as unknown as number
      }
    }
    
    this.updateTimer = requestAnimationFrame(updateLoop) as unknown as number
  }
  
  /**
   * UI更新が必要かどうかを判定
   */
  private shouldUpdateUI(): boolean {
    const now = performance.now()
    if (now - this.lastUpdateTime < this.getUpdateInterval()) {
      return false
    }
    
    this.lastUpdateTime = now
    return true
  }
  
  /**
   * 時間を更新
   */
  private updateTime(): void {
    const gameState = this.gameLogic.getGameState()
    
    if (gameState === GameState.ACTIVE) {
      if (this.startTime === null) {
        this.startTime = Date.now()
      }
      this.currentTime = Math.floor((Date.now() - this.startTime) / 1000)
    } else if (gameState === GameState.READY) {
      this.startTime = null
      this.currentTime = 0
    }
  }
  
  /**
   * 破棄処理
   */
  public destroy(): void {
    this.stop()
  }
}