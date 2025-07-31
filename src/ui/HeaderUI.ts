import * as PIXI from 'pixi.js'
import { GameLogic } from '@/game/GameLogic'
import { NEON_COLORS, LAYOUT_CONSTANTS, RENDER_CONSTANTS } from '@/types'

/**
 * ヘッダーUI専用クラス
 * タイマー、地雷数、ステータス表示を担当
 */
export class HeaderUI {
  private container: PIXI.Container
  private gameLogic: GameLogic
  
  private timerText: PIXI.Text
  private mineCountText: PIXI.Text
  private statusText: PIXI.Text
  private scoreText: PIXI.Text

  constructor(gameLogic: GameLogic) {
    this.container = new PIXI.Container()
    this.gameLogic = gameLogic
    
    this.timerText = this.createText('00:00', LAYOUT_CONSTANTS.TEXT.TIMER_SIZE)
    this.mineCountText = this.createText('000', LAYOUT_CONSTANTS.TEXT.MINE_COUNT_SIZE)
    this.statusText = this.createText('READY', LAYOUT_CONSTANTS.TEXT.STATUS_SIZE)
    this.scoreText = this.createText('Score: 0', LAYOUT_CONSTANTS.TEXT.STATS_SIZE + 2)
    
    this.setupHeader()
  }

  private createText(text: string, fontSize: number): PIXI.Text {
    return new PIXI.Text({
      text,
      style: {
        fontFamily: LAYOUT_CONSTANTS.TEXT.FONT_FAMILY,
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

  private setupHeader(): void {
    const config = this.gameLogic.getConfig()
    const gameWidth = config.width * (RENDER_CONSTANTS.CELL.SIZE + RENDER_CONSTANTS.CELL.SPACING) - RENDER_CONSTANTS.CELL.SPACING
    
    // ヘッダー背景
    const headerBg = new PIXI.Graphics()
    headerBg
      .roundRect(0, 0, gameWidth, LAYOUT_CONSTANTS.HEADER.HEIGHT, LAYOUT_CONSTANTS.HEADER.BACKGROUND_RADIUS)
      .fill({ color: NEON_COLORS.primary.darkGray, alpha: LAYOUT_CONSTANTS.HEADER.BACKGROUND_ALPHA })
      .stroke({ 
        width: LAYOUT_CONSTANTS.HEADER.BORDER_WIDTH, 
        color: NEON_COLORS.accent.neonBlue, 
        alpha: LAYOUT_CONSTANTS.HEADER.BORDER_ALPHA 
      })
    this.container.addChild(headerBg)

    // 地雷数表示
    this.mineCountText.x = LAYOUT_CONSTANTS.HEADER.MARGIN
    this.mineCountText.y = LAYOUT_CONSTANTS.HEADER.MARGIN
    this.container.addChild(this.mineCountText)

    // 地雷アイコン
    const mineIcon = this.createMineIcon()
    mineIcon.x = this.mineCountText.x + this.mineCountText.width + 10
    mineIcon.y = this.mineCountText.y + 5
    this.container.addChild(mineIcon)

    // タイマー表示
    this.timerText.x = gameWidth - 100
    this.timerText.y = LAYOUT_CONSTANTS.HEADER.MARGIN
    this.container.addChild(this.timerText)

    // ステータス表示
    this.statusText.x = gameWidth / 2 - this.statusText.width / 2
    this.statusText.y = 15
    this.container.addChild(this.statusText)

    // 難易度表示
    const difficultyText = this.createText(config.difficulty, LAYOUT_CONSTANTS.TEXT.DIFFICULTY_SIZE)
    difficultyText.style.fill = NEON_COLORS.accent.neonGreen
    difficultyText.x = gameWidth / 2 - difficultyText.width / 2
    difficultyText.y = 45
    this.container.addChild(difficultyText)

    // スコア表示
    this.scoreText.style.fill = NEON_COLORS.accent.neonCyan
    this.scoreText.x = LAYOUT_CONSTANTS.HEADER.MARGIN
    this.scoreText.y = 45
    this.container.addChild(this.scoreText)
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

  public updateTimer(time: string): void {
    this.timerText.text = time
  }

  public updateMineCount(count: number): void {
    this.mineCountText.text = count.toString().padStart(3, '0')
  }

  public updateStatus(status: string): void {
    this.statusText.text = status
  }

  public updateScore(score: number): void {
    this.scoreText.text = `Score: ${score.toLocaleString()}`
  }

  public getContainer(): PIXI.Container {
    return this.container
  }

  public destroy(): void {
    this.container.destroy()
  }
}