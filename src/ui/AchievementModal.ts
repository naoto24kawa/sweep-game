import * as PIXI from 'pixi.js'
import { StatsManager } from '@/stats/StatsManager'
import { TrophyIconRenderer } from './TrophyIconRenderer'
import { AchievementInfo, ACHIEVEMENT_DEFINITIONS } from '@/constants/achievements'

interface AchievementModalOptions {
  onClose: () => void
  canvasWidth?: number
  canvasHeight?: number
}


/**
 * Achievement一覧表示モーダル
 */
export class AchievementModal {
  private container: PIXI.Container
  private overlay: PIXI.Graphics
  private modalContainer: PIXI.Container
  private isVisible = false

  constructor(
    private stage: PIXI.Container,
    private statsManager: StatsManager,
    private options: AchievementModalOptions
  ) {
    this.container = new PIXI.Container()
    this.overlay = new PIXI.Graphics()
    this.modalContainer = new PIXI.Container()
    
    this.setupUI()
    this.stage.addChild(this.container)
    
    // レンダリング順序を最前面に設定
    this.container.zIndex = 10001
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
      // 背景クリックで閉じる
      this.hide()
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
    
    // キャンバスサイズの90%を最大サイズとして設定
    const maxModalWidth = Math.min(600, canvasWidth * 0.9)
    const maxModalHeight = Math.min(500, canvasHeight * 0.9)
    
    // 最小サイズを保証
    const modalWidth = Math.max(400, maxModalWidth)
    const modalHeight = Math.max(350, maxModalHeight)
    
    // モーダル背景
    const modalBg = new PIXI.Graphics()
    modalBg
      .roundRect(-modalWidth / 2, -modalHeight / 2, modalWidth, modalHeight, 12)
      .fill({ color: 0x0d0d0d, alpha: 0.95 })
      .stroke({ width: 2, color: 0xffd700, alpha: 0.8 })
    this.modalContainer.addChild(modalBg)

    // タイトル
    const titleFontSize = Math.min(24, modalWidth / 20)
    const title = this.createText('ACHIEVEMENTS', titleFontSize, 0xffd700)
    title.anchor.set(0.5)
    title.y = -modalHeight / 2 + Math.min(35, modalHeight * 0.1)
    this.modalContainer.addChild(title)

    // Achievement一覧を作成
    this.createAchievementGrid(modalWidth, modalHeight)

    // 閉じるボタンを作成
    this.createCloseButton(modalWidth, modalHeight)
  }

  private createAchievementGrid(modalWidth: number, modalHeight: number): void {
    const achievements = ACHIEVEMENT_DEFINITIONS
    const obtainedAchievements = this.statsManager.getAchievements()
    
    // グリッド設定
    const cols = 3
    const rows = Math.ceil(achievements.length / cols)
    const cellWidth = Math.min(120, (modalWidth - 80) / cols)
    const cellHeight = Math.min(100, (modalHeight - 150) / rows)
    const spacing = 10
    
    // グリッドの開始位置
    const gridWidth = cols * cellWidth + (cols - 1) * spacing
    const gridHeight = rows * cellHeight + (rows - 1) * spacing
    const startX = -gridWidth / 2
    const startY = -gridHeight / 2 + 20
    
    achievements.forEach((achievement, index) => {
      const row = Math.floor(index / cols)
      const col = index % cols
      
      const x = startX + col * (cellWidth + spacing) + cellWidth / 2
      const y = startY + row * (cellHeight + spacing) + cellHeight / 2
      
      const isObtained = obtainedAchievements.includes(achievement.id)
      this.createAchievementCard(achievement, x, y, cellWidth, cellHeight, isObtained)
    })
  }

  private createAchievementCard(
    achievement: AchievementInfo, 
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    obtained: boolean
  ): void {
    const card = new PIXI.Container()
    card.x = x
    card.y = y
    
    // カード背景
    const cardBg = new PIXI.Graphics()
    const bgColor = obtained ? 0x1a4a1a : 0x1a1a1a
    const borderColor = obtained ? 0x00ff41 : 0x444444
    const alpha = obtained ? 1.0 : 0.5
    
    cardBg
      .roundRect(-width / 2, -height / 2, width, height, 8)
      .fill({ color: bgColor, alpha: 0.8 })
      .stroke({ width: 2, color: borderColor, alpha })
    card.addChild(cardBg)
    
    // アイコン（トロフィー）
    const icon = TrophyIconRenderer.create({ 
      scale: 0.8, 
      color: obtained ? 0xffd700 : 0x666666,
      darkColor: obtained ? 0xb8860b : 0x444444
    })
    icon.y = -height / 4
    card.addChild(icon)
    
    // Achievement名
    const fontSize = Math.min(10, width / 12)
    const nameText = this.createText(achievement.name, fontSize, obtained ? 0xffd700 : 0x888888)
    nameText.anchor.set(0.5)
    nameText.y = height / 4 - 15
    card.addChild(nameText)
    
    // 説明文
    const descFontSize = Math.min(8, width / 15)
    const descText = this.createText(achievement.description, descFontSize, obtained ? 0xcccccc : 0x666666)
    descText.anchor.set(0.5)
    descText.y = height / 4
    // テキストが長い場合は改行
    if (descText.width > width - 10) {
      descText.style.wordWrap = true
      descText.style.wordWrapWidth = width - 10
    }
    card.addChild(descText)
    
    this.modalContainer.addChild(card)
  }


  private createCloseButton(_modalWidth: number, modalHeight: number): void {
    const buttonY = modalHeight / 2 - 40
    const buttonWidth = 80
    const buttonHeight = 30
    
    const closeButton = this.createButton('CLOSE', buttonWidth, buttonHeight, 0xff0040, () => {
      this.hide()
    })
    closeButton.x = 0
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

    const buttonBg = new PIXI.Graphics()
    buttonBg
      .roundRect(-width / 2, -height / 2, width, height, 6)
      .fill({ color: 0x1a1a1a, alpha: 0.8 })
      .stroke({ width: 2, color, alpha: 0.6 })
    
    buttonBg.eventMode = 'static'
    buttonBg.cursor = 'pointer'
    
    // ホバーエフェクト
    buttonBg.on('pointerover', () => {
      buttonBg.clear()
      buttonBg
        .roundRect(-width / 2, -height / 2, width, height, 6)
        .fill({ color, alpha: 0.2 })
        .stroke({ width: 2, color, alpha: 1.0 })
    })
    
    buttonBg.on('pointerout', () => {
      buttonBg.clear()
      buttonBg
        .roundRect(-width / 2, -height / 2, width, height, 6)
        .fill({ color: 0x1a1a1a, alpha: 0.8 })
        .stroke({ width: 2, color, alpha: 0.6 })
    })

    buttonBg.on('pointerdown', onClick)

    buttonContainer.addChild(buttonBg)

    // ボタンテキスト
    const fontSize = Math.min(12, height / 2.5)
    const buttonText = this.createText(text, fontSize, color)
    buttonText.anchor.set(0.5)
    // テキストがクリックをブロックしないように設定
    buttonText.eventMode = 'none'
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


  public show(): void {
    if (!this.isVisible) {
      // モーダルコンテンツを再作成（Achievement状態に応じて表示を更新）
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