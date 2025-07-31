import * as PIXI from 'pixi.js'
import { GameState, NEON_COLORS } from '@/types'
import { GameLogic } from '@/game/GameLogic'
import { StatsManager } from '@/stats/StatsManager'

/**
 * ゲーム状態の表示更新を専門に行うクラス
 * 単一責任: 表示内容の動的更新
 */
export class GameStatusDisplay {
  private gameLogic: GameLogic
  private statsManager: StatsManager
  
  constructor(gameLogic: GameLogic, statsManager: StatsManager) {
    this.gameLogic = gameLogic
    this.statsManager = statsManager
  }
  
  /**
   * ゲーム状態に応じてステータステキストを更新
   */
  public updateGameStatus(statusText: PIXI.Text): void {
    const gameState = this.gameLogic.getGameState()
    
    switch (gameState) {
      case GameState.READY:
        statusText.text = 'READY'
        statusText.style.fill = NEON_COLORS.accent.neonBlue
        break
      case GameState.ACTIVE:
        statusText.text = 'ACTIVE'
        statusText.style.fill = NEON_COLORS.accent.neonGreen
        break
      case GameState.SUCCESS:
        statusText.text = 'SUCCESS!'
        statusText.style.fill = NEON_COLORS.accent.neonGreen
        break
      case GameState.FAILED:
        statusText.text = 'FAILED'
        statusText.style.fill = NEON_COLORS.warning.neonRed
        break
      case GameState.PAUSED:
        statusText.text = 'PAUSED'
        statusText.style.fill = NEON_COLORS.warning.neonOrange
        break
      default:
        statusText.text = 'UNKNOWN'
        statusText.style.fill = NEON_COLORS.text.white
    }
  }
  
  /**
   * マイン数を更新
   */
  public updateMineCount(mineCountText: PIXI.Text): void {
    const stats = this.gameLogic.getStats()
    const config = this.gameLogic.getConfig()
    const remainingMines = Math.max(0, config.mines - stats.flagsUsed)
    mineCountText.text = remainingMines.toString().padStart(3, '0')
  }
  
  /**
   * タイマー表示を更新
   */
  public updateTimer(timerText: PIXI.Text, currentTime: number): void {
    timerText.text = this.formatTime(currentTime)
  }

  /**
   * スコア表示を更新
   */
  public updateScore(scoreText: PIXI.Text): void {
    const currentScore = this.gameLogic.getCurrentScore()
    scoreText.text = `Score: ${currentScore.toLocaleString()}`
  }
  
  /**
   * 統計パネルの全テキストを更新
   */
  public updateStatsPanel(statsTexts: PIXI.Text[]): void {
    if (statsTexts.length === 0) return

    const stats = this.statsManager.getStats()
    const config = this.gameLogic.getConfig()

    // 各statsテキストを更新
    if (statsTexts[0]) statsTexts[0].text = `Games: ${stats.totalGames}`
    if (statsTexts[1]) statsTexts[1].text = `Wins: ${stats.totalWins}`
    if (statsTexts[2]) statsTexts[2].text = `Win Rate: ${stats.winRate.toFixed(1)}%`
    if (statsTexts[3]) statsTexts[3].text = `Streak: ${stats.streaks.current} (Best: ${stats.streaks.best})`
    if (statsTexts[4]) {
      statsTexts[4].text = `Best Time: ${stats.bestTimes[config.difficulty] ? 
        this.statsManager.formatTime(stats.bestTimes[config.difficulty]!) : 'N/A'}`
    }
    if (statsTexts[5]) {
      statsTexts[5].text = `Avg Time: ${stats.averageGameTime > 0 ? 
        this.statsManager.formatTime(stats.averageGameTime) : 'N/A'}`
    }
  }
  
  /**
   * 時間をMM:SS形式でフォーマット
   */
  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
}