import { GameState } from '@/types'
import type { GameLogic } from './GameLogic'
import type { SoundManager, SoundType } from '@/audio/SoundManager'
import type { StatsManager } from '@/stats/StatsManager'

export class GameStateWatcher {
  private gameLogic: GameLogic
  private soundManager: SoundManager
  private statsManager: StatsManager
  private lastGameState: GameState
  private intervalId: number | null = null

  constructor(
    gameLogic: GameLogic,
    soundManager: SoundManager,
    statsManager: StatsManager
  ) {
    this.gameLogic = gameLogic
    this.soundManager = soundManager
    this.statsManager = statsManager
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

  private handleGameStateChange(oldState: GameState, newState: GameState): void {
    switch (newState) {
      case GameState.ACTIVE:
        if (oldState === GameState.READY) {
          this.soundManager.play('CLICK' as SoundType)
        }
        break

      case GameState.SUCCESS:
        this.soundManager.playSuccessSequence()
        this.recordGameResult(true)
        break

      case GameState.FAILED:
        this.soundManager.play('EXPLOSION' as SoundType)
        this.recordGameResult(false)
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
        timestamp: Date.now()
      })
    }
  }
}