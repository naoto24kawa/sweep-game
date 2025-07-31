import * as PIXI from 'pixi.js'
import { GameLogic } from '@/game/GameLogic'
import { GameState, NEON_COLORS } from '@/types'
import { StatsManager } from '@/stats/StatsManager'
import { SettingsManager } from '@/settings/SettingsManager'

export class GameUI {
  private container: PIXI.Container
  private gameLogic: GameLogic
  private statsManager: StatsManager
  private settingsManager: SettingsManager
  
  private timerText: PIXI.Text
  private mineCountText: PIXI.Text
  private statusText: PIXI.Text
  private statsPanel: PIXI.Container
  
  private startTime: number | null = null
  private currentTime: number = 0
  private updateTimer: number | null = null

  constructor(
    stage: PIXI.Container,
    gameLogic: GameLogic,
    statsManager: StatsManager,
    settingsManager: SettingsManager
  ) {
    this.container = new PIXI.Container()
    this.gameLogic = gameLogic
    this.statsManager = statsManager
    this.settingsManager = settingsManager

    this.timerText = this.createText('00:00', 24)
    this.mineCountText = this.createText('000', 24)
    this.statusText = this.createText('READY', 20)
    this.statsPanel = new PIXI.Container()

    this.setupUI()
    stage.addChild(this.container)
    
    this.startUpdateLoop()
  }

  private createText(text: string, fontSize: number): PIXI.Text {
    return new PIXI.Text({
      text,
      style: {
        fontFamily: 'Courier New, monospace',
        fontSize,
        fill: NEON_COLORS.text.white,
        fontWeight: 'bold',
        dropShadow: {
          color: NEON_COLORS.accent.neonBlue,
          distance: 2,
          blur: 4,
          alpha: 0.8,
          angle: Math.PI / 4
        }
      }
    })
  }

  private setupUI(): void {
    const headerHeight = 80
    const config = this.gameLogic.getConfig()
    const gameWidth = config.width * 34 - 2
    
    this.container.y = -headerHeight - 20

    const headerBg = new PIXI.Graphics()
    headerBg
      .roundRect(0, 0, gameWidth, headerHeight, 8)
      .fill({ color: NEON_COLORS.primary.darkGray, alpha: 0.9 })
      .stroke({ width: 2, color: NEON_COLORS.accent.neonBlue, alpha: 0.5 })
    this.container.addChild(headerBg)

    this.mineCountText.x = 20
    this.mineCountText.y = 20
    this.container.addChild(this.mineCountText)

    const mineIcon = this.createMineIcon()
    mineIcon.x = this.mineCountText.x + this.mineCountText.width + 10
    mineIcon.y = this.mineCountText.y + 5
    this.container.addChild(mineIcon)

    this.timerText.x = gameWidth - 100
    this.timerText.y = 20
    this.container.addChild(this.timerText)

    this.statusText.x = gameWidth / 2 - this.statusText.width / 2
    this.statusText.y = 15
    this.container.addChild(this.statusText)

    const difficultyText = this.createText(config.difficulty, 16)
    difficultyText.style.fill = NEON_COLORS.accent.neonGreen
    difficultyText.x = gameWidth / 2 - difficultyText.width / 2
    difficultyText.y = 45
    this.container.addChild(difficultyText)

    this.setupStatsPanel(gameWidth)
  }

  private createMineIcon(): PIXI.Graphics {
    const icon = new PIXI.Graphics()
    
    // 地雷の円
    icon
      .circle(0, 0, 6)
      .fill({ color: NEON_COLORS.warning.neonRed })

    // 地雷の針
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4
      const startX = Math.cos(angle) * 3
      const startY = Math.sin(angle) * 3
      const endX = Math.cos(angle) * 10
      const endY = Math.sin(angle) * 10
      
      icon
        .moveTo(startX, startY)
        .lineTo(endX, endY)
        .stroke({ width: 1, color: NEON_COLORS.text.white })
    }

    return icon
  }

  private setupStatsPanel(gameWidth: number): void {
    // statsパネルをゲーム領域の右側に配置
    this.statsPanel.x = gameWidth + 20
    this.statsPanel.y = 0

    const stats = this.statsManager.getStats()
    const panelHeight = 160
    const panelWidth = 250

    const panelBg = new PIXI.Graphics()
    panelBg
      .roundRect(0, 0, panelWidth, panelHeight, 8)
      .fill({ color: NEON_COLORS.primary.deepBlack, alpha: 0.9 })
      .stroke({ width: 2, color: NEON_COLORS.accent.neonBlue, alpha: 0.7 })
    this.statsPanel.addChild(panelBg)

    const statsTitle = this.createText('STATS', 16)
    statsTitle.style.fill = NEON_COLORS.accent.neonBlue
    statsTitle.x = 15
    statsTitle.y = 10
    this.statsPanel.addChild(statsTitle)

    const gamesText = this.createText(`Games: ${stats.totalGames}`, 12)
    gamesText.x = 15
    gamesText.y = 35
    this.statsPanel.addChild(gamesText)

    const winsText = this.createText(`Wins: ${stats.totalWins}`, 12)
    winsText.x = 15
    winsText.y = 50
    this.statsPanel.addChild(winsText)

    const winRateText = this.createText(`Win Rate: ${stats.winRate.toFixed(1)}%`, 12)
    winRateText.x = 15
    winRateText.y = 65
    this.statsPanel.addChild(winRateText)

    const streakText = this.createText(`Streak: ${stats.streaks.current} (Best: ${stats.streaks.best})`, 12)
    streakText.x = 15
    streakText.y = 80
    this.statsPanel.addChild(streakText)

    const bestTimeText = this.createText(
      `Best Time: ${stats.bestTimes[this.gameLogic.getConfig().difficulty] ? 
        this.statsManager.formatTime(stats.bestTimes[this.gameLogic.getConfig().difficulty]!) : 'N/A'}`, 
      12
    )
    bestTimeText.x = 15
    bestTimeText.y = 95
    this.statsPanel.addChild(bestTimeText)

    const avgTimeText = this.createText(
      `Avg Time: ${stats.averageGameTime > 0 ? this.statsManager.formatTime(stats.averageGameTime) : 'N/A'}`, 
      12
    )
    avgTimeText.x = 15
    avgTimeText.y = 110
    this.statsPanel.addChild(avgTimeText)

    if (stats.achievements.length > 0) {
      const achievementsText = this.createText('Recent Achievement:', 12)
      achievementsText.style.fill = NEON_COLORS.warning.neonOrange
      achievementsText.x = 15
      achievementsText.y = 125
      this.statsPanel.addChild(achievementsText)

      const recentAchievement = this.createText(
        this.statsManager.getAchievementName(stats.achievements[stats.achievements.length - 1]),
        11
      )
      recentAchievement.style.fill = NEON_COLORS.warning.neonOrange
      recentAchievement.x = 15
      recentAchievement.y = 140
      this.statsPanel.addChild(recentAchievement)
    }

    this.container.addChild(this.statsPanel)
  }

  public update(): void {
    const gameState = this.gameLogic.getGameState()
    const stats = this.gameLogic.getStats()
    const config = this.gameLogic.getConfig()
    const settings = this.settingsManager.getSettings()

    if (!settings.gameplay.showMineCount) {
      this.mineCountText.visible = false
      return
    }

    this.mineCountText.text = (config.mines - stats.flagsUsed).toString().padStart(3, '0')

    switch (gameState) {
      case GameState.READY:
        this.statusText.text = 'READY'
        this.statusText.style.fill = NEON_COLORS.text.white
        this.currentTime = 0
        this.startTime = null
        break

      case GameState.ACTIVE:
        this.statusText.text = 'ACTIVE'
        this.statusText.style.fill = NEON_COLORS.accent.neonGreen
        if (!this.startTime) {
          this.startTime = Date.now()
        }
        this.currentTime = Date.now() - this.startTime
        break

      case GameState.SUCCESS:
        this.statusText.text = 'SUCCESS!'
        this.statusText.style.fill = NEON_COLORS.accent.neonGreen
        break

      case GameState.FAILED:
        this.statusText.text = 'FAILED'
        this.statusText.style.fill = NEON_COLORS.warning.neonRed
        break

      case GameState.PAUSED:
        this.statusText.text = 'PAUSED'
        this.statusText.style.fill = NEON_COLORS.warning.neonOrange
        break
    }

    if (settings.gameplay.showTimer) {
      this.timerText.text = this.formatTime(Math.floor(this.currentTime / 1000))
      this.timerText.visible = true
    } else {
      this.timerText.visible = false
    }

    this.centerStatusText()
  }

  private centerStatusText(): void {
    const config = this.gameLogic.getConfig()
    const gameWidth = config.width * 34 - 2
    this.statusText.x = gameWidth / 2 - this.statusText.width / 2
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  private startUpdateLoop(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer)
    }

    this.updateTimer = window.setInterval(() => {
      this.update()
    }, 100)
  }

  public showStatsPanel(): void {
    this.statsPanel.visible = true
  }

  public hideStatsPanel(): void {
    this.statsPanel.visible = false
  }

  public toggleStatsPanel(): void {
    this.statsPanel.visible = !this.statsPanel.visible
  }

  public getCurrentTime(): number {
    return this.currentTime
  }

  public destroy(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer)
      this.updateTimer = null
    }
    this.container.destroy({ children: true })
  }
}