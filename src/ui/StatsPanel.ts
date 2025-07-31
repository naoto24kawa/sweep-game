import * as PIXI from 'pixi.js'
import { StatsManager } from '@/stats/StatsManager'
import { SettingsManager } from '@/settings/SettingsManager'
import { NEON_COLORS, LAYOUT_CONSTANTS } from '@/types'

/**
 * 統計パネル専用クラス
 * ゲーム統計情報の表示を担当
 */
export class StatsPanel {
  private container: PIXI.Container
  private statsManager: StatsManager
  private statsTexts: PIXI.Text[] = []

  constructor(statsManager: StatsManager, _settingsManager: SettingsManager) {
    this.container = new PIXI.Container()
    this.statsManager = statsManager
    
    this.setupStatsPanel()
  }

  private setupStatsPanel(): void {
    console.log('🔧 Setting up stats panel')
    
    // 統計パネル背景
    const panelBg = new PIXI.Graphics()
    panelBg
      .roundRect(0, 0, LAYOUT_CONSTANTS.STATS.PANEL_WIDTH, LAYOUT_CONSTANTS.STATS.PANEL_HEIGHT, 8)
      .fill({ color: NEON_COLORS.primary.darkGray, alpha: 0.8 })
      .stroke({ width: 1, color: NEON_COLORS.accent.neonCyan, alpha: 0.5 })
    this.container.addChild(panelBg)

    // 統計情報テキスト
    const stats = this.statsManager.getStats()
    const statsInfo = [
      `Total Games: ${stats.totalGames}`,
      `Wins: ${stats.totalWins}`,
      `Win Rate: ${(stats.winRate * 100).toFixed(1)}%`,
      `Best Times:`,
      `  Novice: ${this.formatTime(stats.bestTimes.NOVICE)}`,
      `  Agent: ${this.formatTime(stats.bestTimes.AGENT)}`,
      `  Hacker: ${this.formatTime(stats.bestTimes.HACKER)}`
    ]

    statsInfo.forEach((info, index) => {
      const text = this.createStatsText(info)
      text.x = 20
      text.y = 20 + index * 22
      this.container.addChild(text)
      this.statsTexts.push(text)
    })
  }

  private createStatsText(text: string): PIXI.Text {
    return new PIXI.Text({
      text,
      style: {
        fontFamily: LAYOUT_CONSTANTS.TEXT.FONT_FAMILY,
        fontSize: LAYOUT_CONSTANTS.TEXT.STATS_SIZE,
        fill: NEON_COLORS.text.lightGray,
        fontWeight: 'normal'
      }
    })
  }

  private formatTime(milliseconds: number | null): string {
    if (milliseconds === null) return '--:--'
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  public updateStats(): void {
    const stats = this.statsManager.getStats()
    const statsInfo = [
      `Total Games: ${stats.totalGames}`,
      `Wins: ${stats.totalWins}`,
      `Win Rate: ${(stats.winRate * 100).toFixed(1)}%`,
      `Best Times:`,
      `  Novice: ${this.formatTime(stats.bestTimes.NOVICE)}`,
      `  Agent: ${this.formatTime(stats.bestTimes.AGENT)}`,
      `  Hacker: ${this.formatTime(stats.bestTimes.HACKER)}`
    ]

    statsInfo.forEach((info, index) => {
      if (this.statsTexts[index]) {
        this.statsTexts[index].text = info
      }
    })
  }

  public setPosition(x: number, y: number): void {
    this.container.x = x
    this.container.y = y
  }

  public getContainer(): PIXI.Container {
    return this.container
  }

  public destroy(): void {
    this.container.destroy()
  }
}