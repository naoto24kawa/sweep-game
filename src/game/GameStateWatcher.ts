import { GameState } from '@/types'
import type { GameLogic } from './GameLogic'
import type { SoundManager, SoundType } from '@/audio/SoundManager'
import type { StatsManager } from '@/stats/StatsManager'
import type { GameRenderer } from '@/renderer/GameRenderer'

interface GameStateWatcherCallbacks {
  onGameSuccess?: () => void
  onGameFailed?: () => void
}

export class GameStateWatcher {
  private gameLogic: GameLogic
  private soundManager: SoundManager
  private statsManager: StatsManager
  private renderer: GameRenderer | null
  private lastGameState: GameState
  private intervalId: number | null = null
  private callbacks: GameStateWatcherCallbacks

  constructor(
    gameLogic: GameLogic,
    soundManager: SoundManager,
    statsManager: StatsManager,
    renderer?: GameRenderer,
    callbacks?: GameStateWatcherCallbacks
  ) {
    this.gameLogic = gameLogic
    this.soundManager = soundManager
    this.statsManager = statsManager
    this.renderer = renderer || null
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
    console.log('🔄 GameStateWatcher: Updating callbacks:', {
      hasOnGameSuccess: !!callbacks.onGameSuccess,
      hasOnGameFailed: !!callbacks.onGameFailed,
      previousCallbacks: {
        hasOnGameSuccess: !!this.callbacks.onGameSuccess,
        hasOnGameFailed: !!this.callbacks.onGameFailed
      }
    })
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  private handleGameStateChange(oldState: GameState, newState: GameState): void {
    switch (newState) {
      case GameState.ACTIVE:
        if (oldState === GameState.READY) {
          this.soundManager.play('CLICK' as SoundType)
        }
        break

      case GameState.SUCCESS:
        console.log('🏆 Game SUCCESS detected! Setting up stats modal display...')
        this.soundManager.playSuccessSequence()
        this.recordGameResult(true)
        if (this.renderer) {
          this.renderer.playVictoryEffect()
        }
        // エフェクト完了後にStatsModalを表示
        setTimeout(() => {
          console.log('🏆 Attempting to show stats modal:', {
            hasCallback: !!this.callbacks.onGameSuccess,
            callbackType: typeof this.callbacks.onGameSuccess
          })
          if (this.callbacks.onGameSuccess) {
            console.log('🏆 Calling onGameSuccess callback')
            this.callbacks.onGameSuccess()
          } else {
            console.warn('⚠️ onGameSuccess callback is not set!')
          }
        }, 2000) // 2秒後に表示（エフェクトが落ち着いてから）
        break

      case GameState.FAILED:
        this.soundManager.play('EXPLOSION' as SoundType)
        this.recordGameResult(false)
        if (this.renderer) {
          this.renderer.playGameOverEffect()
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