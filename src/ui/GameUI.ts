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
  private stage: PIXI.Container
  
  private timerText: PIXI.Text
  private mineCountText: PIXI.Text
  private statusText: PIXI.Text
  private statsPanel: PIXI.Container
  private statsTexts: PIXI.Text[] = []
  
  private startTime: number | null = null
  private currentTime: number = 0
  private updateTimer: number | null = null
  private lastUpdateTime: number = 0
  private isActive: boolean = false

  constructor(
    stage: PIXI.Container,
    gameLogic: GameLogic,
    statsManager: StatsManager,
    settingsManager: SettingsManager
  ) {
    this.container = new PIXI.Container()
    this.stage = stage
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
    console.log('🎮 Setting up GameUI')
    const headerHeight = 80
    const config = this.gameLogic.getConfig()
    const effectiveWidth = this.getEffectiveUIWidth()
    
    console.log('⚙️ Game config:', config)
    console.log('📏 Effective UI width:', effectiveWidth)
    
    // ヘッダーコンテナを配置
    const app = (this.stage as any).app || (this.stage as any)._app
    const canvasWidth = app ? app.screen.width : window.innerWidth
    
    this.container.x = (canvasWidth - effectiveWidth) / 2
    // グリッドの上部に配置
    const gridTopPosition = this.getGridTopPosition()
    this.container.y = Math.max(20, gridTopPosition - 100) // グリッドの上に100px確保
    
    console.log('📦 Container position:', { 
      x: this.container.x, 
      y: this.container.y, 
      canvasWidth, 
      effectiveWidth 
    })

    const headerBg = new PIXI.Graphics()
    headerBg
      .roundRect(0, 0, effectiveWidth, headerHeight, 8)
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

    // タイマーを右端に配置
    this.timerText.x = effectiveWidth - this.timerText.width - 20
    this.timerText.y = 20
    this.container.addChild(this.timerText)

    this.statusText.x = effectiveWidth / 2 - this.statusText.width / 2
    this.statusText.y = 15  // 元の位置に戻す
    this.container.addChild(this.statusText)

    const difficultyText = this.createText(config.difficulty, 16)
    difficultyText.style.fill = NEON_COLORS.accent.neonGreen
    difficultyText.x = effectiveWidth / 2 - difficultyText.width / 2
    difficultyText.y = 45  // statusTextの下に配置
    this.container.addChild(difficultyText)

    this.setupStatsPanel(effectiveWidth)
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
    console.log('🔧 Setting up stats panel')
    console.log('📊 Game width:', gameWidth)
    
    const config = this.gameLogic.getConfig()
    const gameHeight = config.height * (32 + 2) - 2
    
    // statsパネルをゲーム領域の下に配置（完全にゲーム領域外）
    this.statsPanel.x = 0
    const gridYPosition = 120
    this.statsPanel.y = gridYPosition + gameHeight + 20  // グリッド位置 + ゲーム高さ + マージン
    
    console.log('📍 Stats panel position:', { x: this.statsPanel.x, y: this.statsPanel.y })
    console.log('🎮 Game dimensions:', { gameWidth, gameHeight })

    const stats = this.statsManager.getStats()
    console.log('📈 Current stats:', stats)
    
    const panelHeight = 180
    const panelWidth = gameWidth  // キャンバス幅に合わせる

    const panelBg = new PIXI.Graphics()
    panelBg
      .roundRect(0, 0, panelWidth, panelHeight, 8)
      .fill({ color: NEON_COLORS.primary.deepBlack, alpha: 0.9 })
      .stroke({ width: 2, color: NEON_COLORS.accent.neonBlue, alpha: 0.7 })
    this.statsPanel.addChild(panelBg)
    
    console.log('🎨 Stats panel background created:', { width: panelWidth, height: panelHeight })

    const statsTitle = this.createText('STATS', 16)
    statsTitle.style.fill = NEON_COLORS.accent.neonBlue
    statsTitle.x = 15
    statsTitle.y = 10
    this.statsPanel.addChild(statsTitle)

    // 左側の列
    const gamesText = this.createText(`Games: ${stats.totalGames}`, 12)
    gamesText.x = 15
    gamesText.y = 35
    this.statsPanel.addChild(gamesText)
    this.statsTexts.push(gamesText)

    const winsText = this.createText(`Wins: ${stats.totalWins}`, 12)
    winsText.x = 15
    winsText.y = 55
    this.statsPanel.addChild(winsText)
    this.statsTexts.push(winsText)

    const winRateText = this.createText(`Win Rate: ${stats.winRate.toFixed(1)}%`, 12)
    winRateText.x = 15
    winRateText.y = 75
    this.statsPanel.addChild(winRateText)
    this.statsTexts.push(winRateText)

    // 右側の列
    const streakText = this.createText(`Streak: ${stats.streaks.current} (Best: ${stats.streaks.best})`, 12)
    streakText.x = panelWidth / 2 + 10
    streakText.y = 35
    this.statsPanel.addChild(streakText)
    this.statsTexts.push(streakText)

    const bestTimeText = this.createText(
      `Best Time: ${stats.bestTimes[this.gameLogic.getConfig().difficulty] ? 
        this.statsManager.formatTime(stats.bestTimes[this.gameLogic.getConfig().difficulty]!) : 'N/A'}`, 
      12
    )
    bestTimeText.x = panelWidth / 2 + 10
    bestTimeText.y = 55
    this.statsPanel.addChild(bestTimeText)
    this.statsTexts.push(bestTimeText)

    const avgTimeText = this.createText(
      `Avg Time: ${stats.averageGameTime > 0 ? this.statsManager.formatTime(stats.averageGameTime) : 'N/A'}`, 
      12
    )
    avgTimeText.x = panelWidth / 2 + 10
    avgTimeText.y = 75
    this.statsPanel.addChild(avgTimeText)
    this.statsTexts.push(avgTimeText)

    if (stats.achievements.length > 0) {
      const achievementsText = this.createText('Recent Achievement:', 12)
      achievementsText.style.fill = NEON_COLORS.warning.neonOrange
      achievementsText.x = 15
      achievementsText.y = 100
      this.statsPanel.addChild(achievementsText)

      const recentAchievement = this.createText(
        this.statsManager.getAchievementName(stats.achievements[stats.achievements.length - 1]),
        11
      )
      recentAchievement.style.fill = NEON_COLORS.warning.neonOrange
      recentAchievement.x = 15
      recentAchievement.y = 115
      this.statsPanel.addChild(recentAchievement)
    }

    this.statsPanel.visible = false  // デフォルトで非表示（モーダルで表示するため）
    this.container.addChild(this.statsPanel)
    
    console.log('✅ Stats panel setup complete')
    console.log('👁️ Stats panel visible:', this.statsPanel.visible)
    console.log('🏗️ Stats panel children count:', this.statsPanel.children.length)
    console.log('📦 Container children count:', this.container.children.length)
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
      // タイマーテキストの位置を再調整（テキスト幅が変わった場合に対応）
      this.updateTimerPosition()
    } else {
      this.timerText.visible = false
    }

    this.centerStatusText()
    this.updateHeaderPosition()
    this.updateStatsPanel()
  }

  private centerStatusText(): void {
    const effectiveWidth = this.getEffectiveUIWidth()
    this.statusText.x = effectiveWidth / 2 - this.statusText.width / 2
  }

  private updateTimerPosition(): void {
    const effectiveWidth = this.getEffectiveUIWidth()
    // タイマーを右端に配置
    this.timerText.x = effectiveWidth - this.timerText.width - 20
  }

  private updateHeaderPosition(): void {
    const effectiveWidth = this.getEffectiveUIWidth()
    const app = (this.stage as any).app || (this.stage as any)._app
    const canvasWidth = app ? app.screen.width : window.innerWidth
    
    // ヘッダーコンテナをグリッドの上部に配置
    this.container.x = (canvasWidth - effectiveWidth) / 2
    const gridTopPosition = this.getGridTopPosition()
    this.container.y = Math.max(20, gridTopPosition - 100)
  }

  /**
   * UI配置に使用する有効幅を取得
   * モバイルではキャンバス幅、PCではブロック幅を使用
   */
  private getEffectiveUIWidth(): number {
    // PIXIアプリケーションから実際のキャンバスサイズを取得
    const app = (this.stage as any).app || (this.stage as any)._app
    if (app && app.screen) {
      const canvasWidth = app.screen.width
      // モバイル判定（簡易版）
      const isMobile = canvasWidth >= window.innerWidth * 0.9
      
      if (isMobile) {
        // モバイルではキャンバス幅から適切なマージンを引いた値を使用
        return Math.min(canvasWidth - 40, this.getLogicalGameWidth())
      }
    }
    
    // PCまたはフォールバック: 論理的なゲーム幅を使用
    return this.getLogicalGameWidth()
  }

  /**
   * グリッドの上部位置を取得
   */
  private getGridTopPosition(): number {
    // stageからグリッドコンテナを探す
    const findGridContainer = (container: PIXI.Container): PIXI.Container | null => {
      for (const child of container.children) {
        if (child instanceof PIXI.Container) {
          // グリッドコンテナは通常多数の子要素（セル）を持つ
          if (child.children.length > 10) {
            // 子要素の最初の要素にlabelプロパティがあるかチェック（セルの特徴）
            const firstChild = child.children[0] as any
            if (firstChild && firstChild.label && typeof firstChild.label === 'string') {
              return child
            }
          }
          // 再帰的に探索
          const found = findGridContainer(child)
          if (found) return found
        }
      }
      return null
    }

    const gridContainer = findGridContainer(this.stage)
    if (gridContainer) {
      const bounds = gridContainer.getBounds()
      console.log('📍 Grid top position found:', bounds.y)
      return bounds.y
    }
    
    // グリッドが見つからない場合のフォールバック
    const app = (this.stage as any).app || (this.stage as any)._app
    const stageHeight = app ? app.screen.height : window.innerHeight
    return stageHeight * 0.3 // 画面上部30%の位置
  }

  /**
   * 論理的なゲーム幅を取得（ブロック配置に基づく）
   */
  private getLogicalGameWidth(): number {
    const config = this.gameLogic.getConfig()
    return config.width * 34 - 2
  }

  private updateStatsPanel(): void {
    if (!this.statsPanel.visible || this.statsTexts.length === 0) return

    const stats = this.statsManager.getStats()
    const config = this.gameLogic.getConfig()

    // 各statsテキストを更新
    if (this.statsTexts[0]) this.statsTexts[0].text = `Games: ${stats.totalGames}`
    if (this.statsTexts[1]) this.statsTexts[1].text = `Wins: ${stats.totalWins}`
    if (this.statsTexts[2]) this.statsTexts[2].text = `Win Rate: ${stats.winRate.toFixed(1)}%`
    if (this.statsTexts[3]) this.statsTexts[3].text = `Streak: ${stats.streaks.current} (Best: ${stats.streaks.best})`
    if (this.statsTexts[4]) {
      this.statsTexts[4].text = `Best Time: ${stats.bestTimes[config.difficulty] ? 
        this.statsManager.formatTime(stats.bestTimes[config.difficulty]!) : 'N/A'}`
    }
    if (this.statsTexts[5]) {
      this.statsTexts[5].text = `Avg Time: ${stats.averageGameTime > 0 ? 
        this.statsManager.formatTime(stats.averageGameTime) : 'N/A'}`
    }
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  private startUpdateLoop(): void {
    this.isActive = true
    this.lastUpdateTime = performance.now()
    
    const updateLoop = () => {
      if (this.shouldUpdateUI()) {
        this.update()
      }
      
      if (this.isActive) {
        this.updateTimer = requestAnimationFrame(updateLoop) as unknown as number
      }
    }
    
    this.updateTimer = requestAnimationFrame(updateLoop) as unknown as number
  }

  private shouldUpdateUI(): boolean {
    const now = performance.now()
    if (now - this.lastUpdateTime < this.getUpdateInterval()) {
      return false
    }
    
    this.lastUpdateTime = now
    return true
  }

  private getUpdateInterval(): number {
    const gameState = this.gameLogic.getGameState()
    
    switch (gameState) {
      case GameState.ACTIVE: 
        return 100 // アクティブ時は100ms
      case GameState.READY: 
        return 500 // 待機時は500ms
      default: 
        return 1000 // その他は1秒
    }
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
    this.isActive = false
    if (this.updateTimer) {
      cancelAnimationFrame(this.updateTimer)
      this.updateTimer = null
    }
    this.container.destroy({ children: true })
  }
}