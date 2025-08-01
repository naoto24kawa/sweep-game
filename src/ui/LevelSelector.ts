import * as PIXI from 'pixi.js'
import { Difficulty } from '@/types'

interface LevelSelectorOptions {
  onLevelSelect: (difficulty: Difficulty) => void
  onClose: () => void
  canvasWidth?: number
  canvasHeight?: number
}

/**
 * レベル選択UI管理クラス
 * ゲーム開始時の難易度選択画面を提供
 */
export class LevelSelector {
  private container: PIXI.Container
  private overlay: PIXI.Graphics
  private modalContainer: PIXI.Container
  private isVisible = false

  constructor(
    private stage: PIXI.Container,
    private options: LevelSelectorOptions
  ) {
    this.container = new PIXI.Container()
    this.overlay = new PIXI.Graphics()
    this.modalContainer = new PIXI.Container()
    
    this.setupUI()
    this.stage.addChild(this.container)
    
    // レンダリング順序を最前面に設定
    this.container.zIndex = 1000
    this.stage.sortableChildren = true
    
    console.log('🎮 LevelSelector created and added to stage with zIndex:', this.container.zIndex)
  }

  private setupUI(): void {
    // キャンバスサイズを取得（オプションから優先、なければデフォルト）
    const canvasWidth = this.options.canvasWidth || 800
    const canvasHeight = this.options.canvasHeight || 600
    
    console.log('📐 Canvas size for LevelSelector:', { canvasWidth, canvasHeight })

    // オーバーレイ（背景）
    this.overlay
      .rect(0, 0, canvasWidth, canvasHeight)
      .fill({ color: 0x000000, alpha: 0.8 })
    this.overlay.eventMode = 'static'
    this.overlay.on('pointerdown', () => this.hide())
    this.container.addChild(this.overlay)

    // モーダルコンテナ
    this.modalContainer.x = canvasWidth / 2
    this.modalContainer.y = canvasHeight / 2
    this.container.addChild(this.modalContainer)

    this.createModal()
    this.container.visible = false
    
    console.log('✅ LevelSelector UI setup complete')
  }

  private createModal(): void {
    // キャンバスサイズに基づいてモーダルサイズを調整
    const canvasWidth = this.options.canvasWidth || 800
    const canvasHeight = this.options.canvasHeight || 600
    
    // キャンバスサイズの80%を最大サイズとして設定、最小サイズも保証
    const maxModalWidth = Math.min(400, canvasWidth * 0.8)
    const maxModalHeight = Math.min(350, canvasHeight * 0.8)
    
    // 最小サイズを保証（小さすぎる画面でも最低限の操作が可能）
    const modalWidth = Math.max(250, maxModalWidth)
    const modalHeight = Math.max(200, maxModalHeight)
    
    console.log('📐 Modal size calculated:', { 
      modalWidth, 
      modalHeight, 
      canvasWidth, 
      canvasHeight 
    })
    
    // モーダル背景
    const modalBg = new PIXI.Graphics()
    modalBg
      .roundRect(-modalWidth / 2, -modalHeight / 2, modalWidth, modalHeight, 12)
      .fill({ color: 0x0d0d0d, alpha: 0.95 })
      .stroke({ width: 2, color: 0x00ffff, alpha: 0.8 })
    this.modalContainer.addChild(modalBg)

    // タイトル（モーダルサイズに応じてフォントサイズを調整）
    const titleFontSize = Math.min(24, modalWidth / 16)
    const title = this.createText('LEVEL SELECT', titleFontSize, 0x00ffff)
    title.anchor.set(0.5)
    title.y = -modalHeight / 2 + Math.min(40, modalHeight * 0.12)
    this.modalContainer.addChild(title)

    // レベルボタンを作成
    this.createLevelButtons(modalWidth, modalHeight)

    // 閉じるボタン
    this.createCloseButton(modalWidth, modalHeight)
  }

  private createLevelButtons(modalWidth: number, modalHeight: number): void {
    const levels = [
      { 
        difficulty: Difficulty.NOVICE, 
        name: 'NOVICE', 
        description: '9×9 - 10 mines',
        color: 0x00ff41
      },
      { 
        difficulty: Difficulty.AGENT, 
        name: 'AGENT', 
        description: '16×16 - 40 mines',
        color: 0xff9500
      },
      { 
        difficulty: Difficulty.HACKER, 
        name: 'HACKER', 
        description: '30×16 - 99 mines',
        color: 0xff0040
      }
    ]

    // ボタン間隔をモーダルサイズに応じて調整
    const buttonSpacing = Math.min(80, modalHeight / 5)
    const startY = Math.min(-50, -modalHeight / 4)

    levels.forEach((level, index) => {
      const button = this.createLevelButton(level, modalWidth, modalHeight)
      button.y = startY + (index * buttonSpacing)
      this.modalContainer.addChild(button)
    })
  }

  private createLevelButton(
    level: { difficulty: Difficulty; name: string; description: string; color: number },
    modalWidth: number,
    modalHeight: number
  ): PIXI.Container {
    const buttonContainer = new PIXI.Container()
    const buttonWidth = modalWidth - Math.min(80, modalWidth * 0.2)
    const buttonHeight = Math.min(60, modalHeight / 6)

    // ボタン背景
    const buttonBg = new PIXI.Graphics()
    buttonBg
      .roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8)
      .fill({ color: 0x1a1a1a, alpha: 0.8 })
      .stroke({ width: 2, color: level.color, alpha: 0.6 })
    
    buttonBg.eventMode = 'static'
    buttonBg.cursor = 'pointer'
    
    // ホバーエフェクト
    buttonBg.on('pointerover', () => {
      buttonBg.clear()
      buttonBg
        .roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8)
        .fill({ color: level.color, alpha: 0.2 })
        .stroke({ width: 2, color: level.color, alpha: 1.0 })
    })
    
    buttonBg.on('pointerout', () => {
      buttonBg.clear()
      buttonBg
        .roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8)
        .fill({ color: 0x1a1a1a, alpha: 0.8 })
        .stroke({ width: 2, color: level.color, alpha: 0.6 })
    })

    buttonBg.on('pointerdown', () => {
      this.selectLevel(level.difficulty)
    })

    buttonContainer.addChild(buttonBg)

    // レベル名（ボタンサイズに応じてフォントサイズを調整）
    const levelNameFontSize = Math.min(18, buttonHeight / 3)
    const levelName = this.createText(level.name, levelNameFontSize, level.color)
    levelName.anchor.set(0.5)
    levelName.y = -buttonHeight / 4
    buttonContainer.addChild(levelName)

    // 説明文（ボタンサイズに応じてフォントサイズを調整）
    const descriptionFontSize = Math.min(12, buttonHeight / 5)
    const description = this.createText(level.description, descriptionFontSize, 0xcccccc)
    description.anchor.set(0.5)
    description.y = buttonHeight / 6
    buttonContainer.addChild(description)

    return buttonContainer
  }

  private createCloseButton(modalWidth: number, modalHeight: number): void {
    const closeButton = new PIXI.Container()
    const buttonSize = Math.min(15, modalWidth / 20)
    const margin = Math.min(30, modalWidth / 10)
    
    closeButton.x = modalWidth / 2 - margin
    closeButton.y = -modalHeight / 2 + margin

    const closeBg = new PIXI.Graphics()
    closeBg
      .circle(0, 0, buttonSize)
      .fill({ color: 0xff0040, alpha: 0.8 })
    closeBg.eventMode = 'static'
    closeBg.cursor = 'pointer'
    closeBg.on('pointerdown', () => this.hide())
    
    const closeFontSize = Math.min(20, buttonSize * 1.3)
    const closeText = this.createText('×', closeFontSize, 0xffffff)
    closeText.anchor.set(0.5)
    
    closeButton.addChild(closeBg)
    closeButton.addChild(closeText)
    this.modalContainer.addChild(closeButton)
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
          distance: 2,
          blur: 4,
          alpha: 0.6,
          angle: Math.PI / 4
        }
      }
    })
  }

  private selectLevel(difficulty: Difficulty): void {
    this.hide()
    this.options.onLevelSelect(difficulty)
  }

  /**
   * レベル選択コールバックを更新
   */
  public setOnLevelSelect(callback: (difficulty: Difficulty) => void): void {
    this.options.onLevelSelect = callback
  }

  /**
   * 閉じるコールバックを更新
   */
  public setOnClose(callback: () => void): void {
    this.options.onClose = callback
  }

  public show(): void {
    console.log('🎮 LevelSelector.show() called, current visible:', this.isVisible)
    if (!this.isVisible) {
      this.container.visible = true
      this.isVisible = true
      
      console.log('✅ LevelSelector is now visible')
      console.log('📊 Container children:', this.container.children.length)
      console.log('📦 Modal container position:', { x: this.modalContainer.x, y: this.modalContainer.y })
      
      // アニメーション（オプション）
      this.modalContainer.scale.set(0.8)
      this.modalContainer.alpha = 0
      
      // 簡単なフェードイン効果
      const fadeIn = () => {
        this.modalContainer.alpha += 0.1
        this.modalContainer.scale.x += 0.02
        this.modalContainer.scale.y += 0.02
        
        if (this.modalContainer.alpha < 1) {
          requestAnimationFrame(fadeIn)
        } else {
          this.modalContainer.alpha = 1
          this.modalContainer.scale.set(1)
          console.log('🎬 Fade-in animation complete')
        }
      }
      fadeIn()
    }
  }

  public hide(): void {
    if (this.isVisible) {
      this.container.visible = false
      this.isVisible = false
      this.options.onClose()
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