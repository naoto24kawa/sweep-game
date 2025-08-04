import { GameState } from '@/types'
import type { GameLogic } from './GameLogic'
import type { SoundManager } from '@/audio/SoundManager'
import { SoundType } from '@/audio/SoundManager'
import type { StatsManager } from '@/stats/StatsManager'
import type { EffectManager } from '@/effects/EffectManager'
import { Logger } from '@/core/Logger'


interface GameStateWatcherCallbacks {
  onGameSuccess?: () => void
  onGameFailed?: () => void
}

export class GameStateWatcher {
  private gameLogic: GameLogic
  private soundManager: SoundManager
  private statsManager: StatsManager
  private effectManager: EffectManager | null

  private lastGameState: GameState
  private intervalId: number | null = null
  private callbacks: GameStateWatcherCallbacks

  constructor(
    gameLogic: GameLogic,
    soundManager: SoundManager,
    statsManager: StatsManager,
    effectManager?: EffectManager,
    callbacks?: GameStateWatcherCallbacks
  ) {
    this.gameLogic = gameLogic
    this.soundManager = soundManager
    this.statsManager = statsManager
    this.effectManager = effectManager || null

    this.callbacks = callbacks || {}
    this.lastGameState = gameLogic.getGameState()
  }

  startWatching(): void {
    this.intervalId = window.setInterval(() => {
      const currentState = this.gameLogic.getGameState()
      
      if (currentState !== this.lastGameState) {
        this.handleGameStateChange(this.lastGameState, currentState)
        this.lastGameState = currentState
      }
    }, 100)
  }

  stopWatching(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * コールバック関数を動的に更新
   */
  updateCallbacks(callbacks: Partial<GameStateWatcherCallbacks>): void {
    Logger.debug('GameStateWatcher: Updating callbacks', { 
      hasOnGameSuccess: !!callbacks.onGameSuccess,
      hasOnGameFailed: !!callbacks.onGameFailed 
    })
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  private handleGameStateChange(oldState: GameState, newState: GameState): void {
    Logger.debug(`GameStateWatcher: State change ${oldState} -> ${newState}`)
    switch (newState) {
      case GameState.ACTIVE:
        if (oldState === GameState.READY) {
          this.soundManager.play(SoundType.CLICK)
        }
        break

      case GameState.SUCCESS:
        this.soundManager.playSuccessSequence()
        this.recordGameResult(true)
        
        // 勝利エフェクトを表示
        if (this.effectManager) {
          this.effectManager.createVictoryEffect()
        }

        // エフェクト完了後にStatsModalを表示
        setTimeout(() => {
          Logger.debug('GameStateWatcher: SUCCESS timeout reached, checking callback')
          if (this.callbacks.onGameSuccess) {
            Logger.debug('GameStateWatcher: Calling onGameSuccess callback')
            this.callbacks.onGameSuccess()
          } else {
            Logger.warn('onGameSuccess callback is not set!')
          }
        }, 2000) // 2秒後に表示（エフェクトが落ち着いてから）
        break

      case GameState.FAILED:
        this.soundManager.play(SoundType.EXPLOSION)
        this.recordGameResult(false)
        
        // 敗北エフェクトを表示
        if (this.effectManager) {
          this.effectManager.createGameOverEffect()
        }

        // エフェクト完了後にStatsModalを表示
        setTimeout(() => {
          if (this.callbacks.onGameFailed) {
            this.callbacks.onGameFailed()
          }
        }, 2000) // 2秒後に表示（エフェクトが落ち着いてから）
        break
    }
  }

  private recordGameResult(isSuccess: boolean): void {
    const stats = this.gameLogic.getStats()
    const config = this.gameLogic.getConfig()
    
    if (stats.startTime && stats.endTime) {
      this.statsManager.recordGame({
        id: Date.now().toString(),
        difficulty: config.difficulty,
        startTime: stats.startTime,
        endTime: stats.endTime,
        duration: stats.elapsedTime,
        success: isSuccess,
        cellsRevealed: stats.cellsRevealed,
        flagsUsed: stats.flagsUsed,
        gridSize: { width: config.width, height: config.height },
        mines: config.mines,
        timestamp: Date.now(),
        score: stats.score,
        bestCombo: stats.bestCombo
      })
    }
  }
}