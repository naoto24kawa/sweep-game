import * as PIXI from 'pixi.js'
import { GameLogic } from '@/game/GameLogic'
import { StatsManager } from '@/stats/StatsManager'
import { SettingsManager } from '@/settings/SettingsManager'
import { GameUIRenderer } from '@/ui/GameUIRenderer'
import { GameStatusDisplay } from '@/ui/GameStatusDisplay'
import { GameUILayout } from '@/ui/GameUILayout'
import { GameTimer } from '@/ui/GameTimer'
import { UI_CONSTANTS } from '@/constants/ui'

/**
 * 簡素化されたGameUIクラス - UI要素の統合管理のみを担当
 * 責任分離により、レンダリング、レイアウト、タイマー、状態表示は専用クラスに委譲
 */
export class GameUI {
  private container: PIXI.Container
  private scoreContainer: PIXI.Container
  private gameLogic: GameLogic
  
  // 委譲先のクラス
  private renderer: GameUIRenderer
  private statusDisplay: GameStatusDisplay
  private layout: GameUILayout
  private timer: GameTimer
  
  // UI要素
  private timerText!: PIXI.Text
  private mineCountText!: PIXI.Text
  private statusText!: PIXI.Text
  private scoreText!: PIXI.Text
  private statsPanel!: PIXI.Container
  private statsTexts: PIXI.Text[] = []

  constructor(
    stage: PIXI.Container,
    gameLogic: GameLogic,
    statsManager: StatsManager,
    _settingsManager: SettingsManager
  ) {
    this.container = new PIXI.Container()
    this.scoreContainer = new PIXI.Container()
    this.gameLogic = gameLogic

    // 専用クラスのインスタンス化
    this.renderer = new GameUIRenderer()
    this.statusDisplay = new GameStatusDisplay(gameLogic, statsManager)
    this.layout = new GameUILayout(gameLogic, stage)
    this.timer = new GameTimer(gameLogic, (time) => this.handleTimeUpdate(time))
    
    // UI要素の作成
    this.createUIElements()
    
    // UIの配置
    this.setupUI()
    stage.addChild(this.container)
    stage.addChild(this.scoreContainer)
    
    // タイマー開始
    this.timer.start()
  }

  /**
   * UI要素を作成（レンダラーに委譲）
   */
  private createUIElements(): void {
    this.timerText = this.renderer.createText('00:00', UI_CONSTANTS.TEXT.TIMER_FONT_SIZE)
    this.mineCountText = this.renderer.createText('000', UI_CONSTANTS.TEXT.TIMER_FONT_SIZE)
    this.statusText = this.renderer.createText('READY', UI_CONSTANTS.TEXT.STATUS_FONT_SIZE)
    this.scoreText = this.renderer.createText('Score: 0', UI_CONSTANTS.TEXT.STATUS_FONT_SIZE - 2)
    this.statsPanel = this.renderer.createStatsPanel(this.layout.getEffectiveUIWidth())
    this.statsTexts = this.renderer.createStatsTexts()
    
    // 統計テキストを統計パネルに追加
    this.statsTexts.forEach(text => this.statsPanel.addChild(text))
  }

  private setupUI(): void {
    
    // レイアウト計算（専用クラスに委譲）
    const position = this.layout.calculateContainerPosition()
    this.container.x = position.x
    this.container.y = position.y
    
    // ヘッダー背景作成
    const effectiveWidth = this.layout.getEffectiveUIWidth()
    const headerBg = this.renderer.createHeaderBackground(effectiveWidth, UI_CONSTANTS.HEADER.HEIGHT)
    this.container.addChild(headerBg)
    
    // UI要素配置
    this.setupHeaderElements(effectiveWidth)
    this.setupStatsPanel(effectiveWidth)
  }

  /**
   * ヘッダー内の各UI要素を配置（レイアウト計算は専用クラスに委譲）
   */
  private setupHeaderElements(effectiveWidth: number): void {
    const config = this.gameLogic.getConfig()
    
    // マインカウンターとアイコン
    this.mineCountText.x = UI_CONSTANTS.SPACING.STANDARD
    this.mineCountText.y = UI_CONSTANTS.SPACING.STANDARD
    this.container.addChild(this.mineCountText)

    const mineIcon = this.renderer.createMineIcon()
    mineIcon.x = this.mineCountText.x + this.mineCountText.width + UI_CONSTANTS.SPACING.SMALL
    mineIcon.y = this.mineCountText.y + UI_CONSTANTS.SPACING.TINY
    this.container.addChild(mineIcon)

    // タイマーを右端に配置
    this.timerText.x = effectiveWidth - this.timerText.width - UI_CONSTANTS.SPACING.STANDARD
    this.timerText.y = UI_CONSTANTS.SPACING.STANDARD
    this.container.addChild(this.timerText)

    // ステータステキストを中央に配置
    this.statusText.x = this.layout.centerElementX(this.statusText.width, effectiveWidth)
    this.statusText.y = UI_CONSTANTS.TEXT.STATUS_TOP_OFFSET
    this.container.addChild(this.statusText)

    // 難易度テキストを中央下部に配置
    const difficultyText = this.renderer.createText(config.difficulty, UI_CONSTANTS.TEXT.DIFFICULTY_FONT_SIZE)
    difficultyText.style.fill = { color: 0x00ff00 } // NEON_COLORS.accent.neonGreen
    difficultyText.x = this.layout.centerElementX(difficultyText.width, effectiveWidth)
    difficultyText.y = UI_CONSTANTS.SPACING.LARGE
    this.container.addChild(difficultyText)

    // スコア表示を独立したコンテナに配置（タイマーとグリッドの間）
    this.scoreText.style.fill = { color: 0x00ffff } // NEON_COLORS.accent.neonCyan
    const scorePosition = this.layout.calculateScorePosition(effectiveWidth)
    this.scoreText.anchor.set(0.5, 0) // 中央揃え
    this.scoreText.x = scorePosition.x
    this.scoreText.y = scorePosition.y
    this.scoreContainer.addChild(this.scoreText)
  }

  private setupStatsPanel(gameWidth: number): void {
    // 統計パネルの位置計算（レイアウト専用クラスに委譲）
    const position = this.layout.calculateStatsPanelPosition(gameWidth)
    this.statsPanel.x = position.x
    this.statsPanel.y = position.y
    
    this.container.addChild(this.statsPanel)

  }
  
  /**
   * タイマー更新時のコールバック
   */
  private handleTimeUpdate(time: number): void {
    this.statusDisplay.updateTimer(this.timerText, time)
    this.statusDisplay.updateMineCount(this.mineCountText)
    this.statusDisplay.updateGameStatus(this.statusText)
    this.statusDisplay.updateScore(this.scoreText)
    this.statusDisplay.updateStatsPanel(this.statsTexts)
  }

  // === 公開API ===
  
  /**
   * グリッド情報を設定（レイアウト計算に使用）
   */
  public setGridInfo(x: number, y: number, width: number, height: number): void {

    this.layout.setGridInfo(x, y, width, height)
    // グリッド情報変更時にUIを再配置
    this.updateUILayout()
  }

  /**
   * UIレイアウトを更新
   */
  private updateUILayout(): void {
    // UIコンテナの位置を再計算
    const position = this.layout.calculateContainerPosition()
    this.container.x = position.x
    this.container.y = position.y
    
    // スコア表示の位置を再計算（独立したコンテナなので絶対座標）
    const effectiveWidth = this.layout.getEffectiveUIWidth()
    const scorePosition = this.layout.calculateScorePosition(effectiveWidth)
    this.scoreContainer.x = 0 // スコアコンテナは絶対位置
    this.scoreContainer.y = 0
    this.scoreText.anchor.set(0.5, 0) // 中央揃え
    this.scoreText.x = scorePosition.x
    this.scoreText.y = scorePosition.y
    

  }
  
  /**
   * 統計パネルを表示
   */
  public showStatsPanel(): void {
    this.statsPanel.visible = true
  }

  /**
   * 統計パネルを非表示
   */
  public hideStatsPanel(): void {
    this.statsPanel.visible = false
  }

  /**
   * 統計パネルの表示/非表示を切り替え
   */
  public toggleStatsPanel(): void {
    this.statsPanel.visible = !this.statsPanel.visible
  }

  /**
   * 現在のタイマー時間を取得
   */
  public getCurrentTime(): number {
    return this.timer.getCurrentTime()
  }

  /**
   * UI全体を破棄
   */
  public destroy(): void {
    this.timer.destroy()
    this.container.destroy({ children: true })
    this.scoreContainer.destroy({ children: true })
  }
}