import * as PIXI from 'pixi.js'
import { StatsManager } from '@/stats/StatsManager'
import { GameLogic } from '@/game/GameLogic'
import { GameState } from '@/types'
import { Logger } from '@/core/Logger'
// NEON_COLORSは数値で直接指定するため削除

interface StatsModalOptions {
  onClose: () => void
  onRestart: () => void
  onLevelSelect: () => void
  canvasWidth?: number
  canvasHeight?: number
}

/**
 * ゲームクリア後のstats表示モーダル
 */
export class StatsModal {
  private container: PIXI.Container
  private overlay: PIXI.Graphics
  private modalContainer: PIXI.Container
  private isVisible = false

  constructor(
    private stage: PIXI.Container,
    private statsManager: StatsManager,
    private gameLogic: GameLogic,
    private options: StatsModalOptions
  ) {
    this.container = new PIXI.Container()
    this.overlay = new PIXI.Graphics()
    this.modalContainer = new PIXI.Container()
    
    this.setupUI()
    this.stage.addChild(this.container)
    
    // レンダリング順序を最前面に設定（セレブレーション演出より上）
    this.container.zIndex = 10000
    this.stage.sortableChildren = true
    
  }

  private setupUI(): void {
    // キャンバスサイズを取得
    const canvasWidth = this.options.canvasWidth || 800
    const canvasHeight = this.options.canvasHeight || 600

    // オーバーレイ（背景）
    this.overlay
      .rect(0, 0, canvasWidth, canvasHeight)
      .fill({ color: 0x000000, alpha: 0.8 })
    this.overlay.eventMode = 'static'
    this.overlay.on('pointerdown', (e) => {
      e.stopPropagation()
      // 背景クリックでは閉じない（意図しない操作を防ぐため）
    })
    this.container.addChild(this.overlay)

    // モーダルコンテナ
    this.modalContainer.x = canvasWidth / 2
    this.modalContainer.y = canvasHeight / 2
    this.container.addChild(this.modalContainer)

    this.createModal()
    this.container.visible = false
  }

  private createModal(): void {
    // キャンバスサイズに基づいてモーダルサイズを調整
    const canvasWidth = this.options.canvasWidth || 800
    const canvasHeight = this.options.canvasHeight || 600
    
    // キャンバスサイズの85%を最大サイズとして設定
    const maxModalWidth = Math.min(500, canvasWidth * 0.85)
    const maxModalHeight = Math.min(400, canvasHeight * 0.85)
    
    // 最小サイズを保証
    const modalWidth = Math.max(300, maxModalWidth)
    const modalHeight = Math.max(250, maxModalHeight)
    
    // モーダル背景
    const modalBg = new PIXI.Graphics()
    modalBg
      .roundRect(-modalWidth / 2, -modalHeight / 2, modalWidth, modalHeight, 12)
      .fill({ color: 0x0d0d0d, alpha: 0.95 })
      .stroke({ width: 2, color: 0x00ff41, alpha: 0.8 })
    this.modalContainer.addChild(modalBg)

    // タイトル（ゲーム結果に応じて変更）
    const titleFontSize = Math.min(28, modalWidth / 14)
    const gameState = this.gameLogic.getGameState()
    const isSuccess = gameState === GameState.SUCCESS
    const titleText = isSuccess ? 'MISSION COMPLETE' : 'MISSION FAILED'
    const titleColor = isSuccess ? 0x00ff41 : 0xff0040
    
    const title = this.createText(titleText, titleFontSize, titleColor)
    title.anchor.set(0.5)
    title.y = -modalHeight / 2 + Math.min(40, modalHeight * 0.12)
    this.modalContainer.addChild(title)

    // stats情報を作成
    this.createStatsContent(modalWidth, modalHeight)

    // ボタンを作成
    this.createButtons(modalWidth, modalHeight)
  }

  private createStatsContent(modalWidth: number, modalHeight: number): void {
    const stats = this.statsManager.getStats()
    const config = this.gameLogic.getConfig()
    const gameStats = this.gameLogic.getStats()
    
    const contentY = -modalHeight / 4
    const fontSize = Math.min(14, modalWidth / 28)
    const lineHeight = fontSize + 4

    // 現在のゲーム状態を明確に表示
    let gameStatusText = ''
    let statusColor = 0xffffff
    
    if (gameStats.startTime === null) {
      gameStatusText = '🎮 新しいゲーム開始準備完了!'
      statusColor = 0x00ff41
    } else if (gameStats.endTime === null) {
      gameStatusText = `🎯 プレイ中: ${this.formatTime(gameStats.elapsedTime)}`
      statusColor = 0x00ffff
    } else {
      const gameState = this.gameLogic.getGameState()
      const result = gameState === GameState.SUCCESS ? '🎉 成功!' : '💥 失敗'
      gameStatusText = `${result} 時間: ${this.formatTime(gameStats.elapsedTime)}`
      statusColor = gameState === GameState.SUCCESS ? 0x00ff41 : 0xff0040
    }

    const statusText = this.createText(gameStatusText, fontSize + 2, statusColor)
    statusText.anchor.set(0.5)
    statusText.y = contentY
    this.modalContainer.addChild(statusText)

    // 難易度表示
    const difficultyText = this.createText(
      `難易度: ${config.difficulty}`,
      fontSize,
      0xcccccc
    )
    difficultyText.anchor.set(0.5)
    difficultyText.y = contentY + lineHeight
    this.modalContainer.addChild(difficultyText)

    // 現在のゲームスコア
    const currentScoreText = this.createText(
      `現在のスコア: ${gameStats.score.toLocaleString()}`,
      fontSize + 1,
      0x00ffff
    )
    currentScoreText.anchor.set(0.5)
    currentScoreText.y = contentY + lineHeight * 2
    this.modalContainer.addChild(currentScoreText)

    // 統計情報（2列レイアウト）
    const leftColumn = -modalWidth / 4
    const rightColumn = modalWidth / 4
    const currentY = contentY + lineHeight * 3

    // 左列
    const gamesText = this.createText(`Games: ${stats.totalGames}`, fontSize, 0xcccccc)
    gamesText.anchor.set(0.5)
    gamesText.x = leftColumn
    gamesText.y = currentY
    this.modalContainer.addChild(gamesText)

    const winsText = this.createText(`Wins: ${stats.totalWins}`, fontSize, 0xcccccc)
    winsText.anchor.set(0.5)
    winsText.x = leftColumn
    winsText.y = currentY + lineHeight
    this.modalContainer.addChild(winsText)

    const winRateText = this.createText(`Win Rate: ${stats.winRate.toFixed(1)}%`, fontSize, 0xcccccc)
    winRateText.anchor.set(0.5)
    winRateText.x = leftColumn
    winRateText.y = currentY + lineHeight * 2
    this.modalContainer.addChild(winRateText)

    // 右列
    const streakText = this.createText(`Streak: ${stats.streaks.current}`, fontSize, 0xcccccc)
    streakText.anchor.set(0.5)
    streakText.x = rightColumn
    streakText.y = currentY
    this.modalContainer.addChild(streakText)

    const bestStreakText = this.createText(`Best: ${stats.streaks.best}`, fontSize, 0xcccccc)
    bestStreakText.anchor.set(0.5)
    bestStreakText.x = rightColumn
    bestStreakText.y = currentY + lineHeight
    this.modalContainer.addChild(bestStreakText)

    const bestTimeText = this.createText(
      `Best Time: ${stats.bestTimes[config.difficulty] ? 
        this.statsManager.formatTime(stats.bestTimes[config.difficulty]!) : 'N/A'}`,
      fontSize,
      0xcccccc
    )
    bestTimeText.anchor.set(0.5)
    bestTimeText.x = rightColumn
    bestTimeText.y = currentY + lineHeight * 2
    this.modalContainer.addChild(bestTimeText)

    // スコア情報行を追加
    const bestScoreText = this.createText(
      `Best Score: ${stats.bestScore[config.difficulty].toLocaleString()}`,
      fontSize,
      0x00ffff
    )
    bestScoreText.anchor.set(0.5)
    bestScoreText.x = leftColumn
    bestScoreText.y = currentY + lineHeight * 3
    this.modalContainer.addChild(bestScoreText)

    const avgScoreText = this.createText(
      `Avg Score: ${Math.round(stats.averageScore[config.difficulty]).toLocaleString()}`,
      fontSize,
      0x00ffff
    )
    avgScoreText.anchor.set(0.5)
    avgScoreText.x = rightColumn
    avgScoreText.y = currentY + lineHeight * 3
    this.modalContainer.addChild(avgScoreText)

    // コンボ情報
    const comboText = this.createText(
      `Combo: ${gameStats.comboCount} | Best: ${gameStats.bestCombo}`,
      fontSize,
      0xffff00
    )
    comboText.anchor.set(0.5)
    comboText.x = 0
    comboText.y = currentY + lineHeight * 4
    this.modalContainer.addChild(comboText)

  }

  private createButtons(modalWidth: number, modalHeight: number): void {
    const buttonY = modalHeight / 2 - 60
    const buttonWidth = Math.min(80, modalWidth / 6)
    const buttonHeight = Math.min(35, modalHeight / 12)
    const buttonSpacing = Math.min(100, modalWidth / 5)
    
    // 再開ボタン
    const restartButton = this.createButton('RESTART', buttonWidth, buttonHeight, 0x00ff41, () => {
      this.hide()
      this.options.onRestart()
    })
    restartButton.x = -buttonSpacing
    restartButton.y = buttonY
    this.modalContainer.addChild(restartButton)

    // レベル選択ボタン
    const levelButton = this.createButton('LEVELS', buttonWidth, buttonHeight, 0x00ffff, () => {
      this.hide()
      this.options.onLevelSelect()
    })
    levelButton.x = 0
    levelButton.y = buttonY
    this.modalContainer.addChild(levelButton)

    // 閉じるボタン
    const closeButton = this.createButton('CLOSE', buttonWidth, buttonHeight, 0xff0040, () => {
      this.hide()
      this.options.onClose()
    })
    closeButton.x = buttonSpacing
    closeButton.y = buttonY
    this.modalContainer.addChild(closeButton)
  }

  private createButton(
    text: string, 
    width: number, 
    height: number, 
    color: number, 
    onClick: () => void
  ): PIXI.Container {
    const buttonContainer = new PIXI.Container()
    
    // ボタンコンテナ全体でイベントを受け取るよう設定
    buttonContainer.eventMode = 'static'
    buttonContainer.cursor = 'pointer'

    const buttonBg = new PIXI.Graphics()
    buttonBg
      .roundRect(-width / 2, -height / 2, width, height, 6)
      .fill({ color: 0x1a1a1a, alpha: 0.8 })
      .stroke({ width: 2, color, alpha: 0.6 })
    
    buttonBg.eventMode = 'static'
    buttonBg.cursor = 'pointer'
    
    // ホバーエフェクト（背景用）
    const handleHoverIn = () => {
      buttonBg.clear()
      buttonBg
        .roundRect(-width / 2, -height / 2, width, height, 6)
        .fill({ color, alpha: 0.2 })
        .stroke({ width: 2, color, alpha: 1.0 })
    }
    
    const handleHoverOut = () => {
      buttonBg.clear()
      buttonBg
        .roundRect(-width / 2, -height / 2, width, height, 6)
        .fill({ color: 0x1a1a1a, alpha: 0.8 })
        .stroke({ width: 2, color, alpha: 0.6 })
    }
    
    // クリックハンドラー（イベント伝播を防ぐ）
    const handleClick = (event: PIXI.FederatedPointerEvent) => {
      event.stopPropagation()
      event.preventDefault()
      onClick()
    }

    // 背景にイベントリスナーを設定
    buttonBg.on('pointerover', handleHoverIn)
    buttonBg.on('pointerout', handleHoverOut)
    buttonBg.on('pointerdown', handleClick)
    
    // コンテナにもイベントリスナーを設定（テキスト領域も含む）
    buttonContainer.on('pointerover', handleHoverIn)
    buttonContainer.on('pointerout', handleHoverOut)
    buttonContainer.on('pointerdown', handleClick)

    buttonContainer.addChild(buttonBg)

    // ボタンテキスト（イベントを無効化してクリックをブロックしない）
    const fontSize = Math.min(12, height / 2.5)
    const buttonText = this.createText(text, fontSize, color)
    buttonText.anchor.set(0.5)
    buttonText.eventMode = 'none' // テキストがイベントをブロックしないよう設定
    buttonContainer.addChild(buttonText)

    return buttonContainer
  }

  private createText(text: string, fontSize: number, color?: number): PIXI.Text {
    return new PIXI.Text({
      text,
      style: {
        fontFamily: 'Courier New, monospace',
        fontSize,
        fill: color || 0xffffff,
        fontWeight: 'bold',
        dropShadow: {
          color: color || 0x00ffff,
          distance: 1,
          blur: 2,
          alpha: 0.6,
          angle: Math.PI / 4
        }
      }
    })
  }

  private formatTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  /**
   * コールバック関数を動的に更新するメソッド
   */
  public updateCallbacks(callbacks: {
    onClose?: () => void
    onRestart?: () => void
    onLevelSelect?: () => void
  }): void {
    if (callbacks.onClose) {
      this.options.onClose = callbacks.onClose
    }
    if (callbacks.onRestart) {
      this.options.onRestart = callbacks.onRestart
    }
    if (callbacks.onLevelSelect) {
      this.options.onLevelSelect = callbacks.onLevelSelect
    }
  }
  
  /**
   * GameLogicインスタンスを更新（難易度変更時）
   */
  public updateGameLogic(newGameLogic: GameLogic): void {
    this.gameLogic = newGameLogic
    Logger.debug('StatsModal: GameLogic updated to new instance')
  }

  public show(): void {
    if (!this.isVisible) {
      // モーダルコンテンツを再作成（ゲーム状態に応じて表示を更新）
      this.modalContainer.removeChildren()
      this.createModal()
      
      this.container.visible = true
      this.isVisible = true
      
      // アニメーション
      this.modalContainer.scale.set(0.8)
      this.modalContainer.alpha = 0
      
      const fadeIn = () => {
        this.modalContainer.alpha += 0.1
        this.modalContainer.scale.x += 0.02
        this.modalContainer.scale.y += 0.02
        
        if (this.modalContainer.alpha < 1) {
          requestAnimationFrame(fadeIn)
        } else {
          this.modalContainer.alpha = 1
          this.modalContainer.scale.set(1)
        }
      }
      fadeIn()
    }
  }

  public hide(): void {
    if (this.isVisible) {
      this.container.visible = false
      this.isVisible = false
      // onClose は手動で hide() を呼び出すときのみ実行、ボタンからは実行済み
    }
  }

  public isShowing(): boolean {
    return this.isVisible
  }

  public destroy(): void {
    if (this.container.parent) {
      this.container.parent.removeChild(this.container)
    }
    this.container.destroy({ children: true })
  }
}