import * as PIXI from 'pixi.js'
import { Cell, CellState, NEON_COLORS, RENDER_CONSTANTS } from '@/types'

/**
 * セルの描画専用クラス
 * 単一のセルのビジュアル表現を管理
 */
export class CellRenderer {
  private readonly cellSize = RENDER_CONSTANTS.CELL.SIZE

  /**
   * セルのグラフィックコンテナを作成
   * @param cell セルデータ
   * @returns 作成されたPIXIコンテナ
   */
  public createCellGraphics(cell: Cell): PIXI.Container {
    const container = new PIXI.Container()
    container.label = `${cell.x}-${cell.y}`
    container.sortableChildren = true

    const background = new PIXI.Graphics()
    background.zIndex = 1
    this.drawCellBackground(background, cell)
    container.addChild(background)

    this.addCellContent(container, cell)
    
    return container
  }

  /**
   * セルの表示を更新
   * @param container セルコンテナ
   * @param cell セルデータ
   */
  public updateCellDisplay(container: PIXI.Container, cell: Cell): void {
    container.sortableChildren = true
    container.removeChildren()

    // 背景を追加
    const background = new PIXI.Graphics()
    background.zIndex = 1
    this.drawCellBackground(background, cell)
    container.addChild(background)

    // セルの状態に応じて表示を追加
    this.addCellContent(container, cell)
  }

  /**
   * セルの内容（数字、フラグ、地雷等）を追加
   * @param container セルコンテナ
   * @param cell セルデータ
   */
  private addCellContent(container: PIXI.Container, cell: Cell): void {
    if (cell.state === CellState.REVEALED && !cell.isMine && cell.adjacentMines > 0) {
      const numberText = this.createNumberText(cell.adjacentMines)
      container.addChild(numberText)
    } else if (cell.state === CellState.FLAGGED) {
      const flag = this.createFlagGraphics()
      container.addChild(flag)
    } else if (cell.state === CellState.QUESTIONED) {
      const question = this.createQuestionGraphics()
      container.addChild(question)
    } else if (cell.state === CellState.REVEALED && cell.isMine) {
      const mine = this.createMineGraphics()
      container.addChild(mine)
    }
  }

  /**
   * セルの背景を描画
   * @param graphics PIXIグラフィックオブジェクト
   * @param cell セルデータ
   */
  private drawCellBackground(graphics: PIXI.Graphics, cell: Cell): void {
    graphics.clear()

    switch (cell.state) {
      case CellState.HIDDEN:
      case CellState.FLAGGED:
      case CellState.QUESTIONED:
        graphics
          .rect(0, 0, this.cellSize, this.cellSize)
          .fill({ color: NEON_COLORS.primary.darkGray })
          .stroke({ width: 1, color: NEON_COLORS.accent.neonBlue, alpha: 0.3 })
        break
      case CellState.REVEALED:
        if (cell.isMine) {
          graphics
            .rect(0, 0, this.cellSize, this.cellSize)
            .fill({ color: NEON_COLORS.warning.neonRed, alpha: 0.8 })
            .stroke({ width: 1, color: NEON_COLORS.warning.neonRed })
        } else {
          graphics
            .rect(0, 0, this.cellSize, this.cellSize)
            .fill({ color: NEON_COLORS.primary.deepBlack, alpha: 0.8 })
            .stroke({ width: 1, color: NEON_COLORS.accent.neonBlue, alpha: 0.2 })
        }
        break
    }
  }

  /**
   * 数字テキストを作成
   * @param adjacentMines 隣接地雷数
   * @returns PIXIテキストオブジェクト
   */
  private createNumberText(adjacentMines: number): PIXI.Text {
    const color = NEON_COLORS.numbers[adjacentMines as keyof typeof NEON_COLORS.numbers]
    
    const text = new PIXI.Text({
      text: adjacentMines.toString(),
      style: {
        fontFamily: 'Courier New, monospace',
        fontSize: 18,
        fill: color || '#00ffff',
        fontWeight: 'bold'
      }
    })
    
    text.x = this.cellSize / 2
    text.y = this.cellSize / 2
    text.anchor.set(0.5, 0.5)
    text.zIndex = 10
    
    return text
  }

  /**
   * フラググラフィックを作成
   * @returns PIXIグラフィックオブジェクト
   */
  private createFlagGraphics(): PIXI.Graphics {
    const flag = new PIXI.Graphics()
    
    const centerX = this.cellSize / 2
    const centerY = this.cellSize / 2
    
    // フラグの三角形（サイズを縮小し、中心に配置）
    flag.poly([
      centerX - 3, centerY - 6,   // 左上
      centerX + 6, centerY - 1,   // 右中
      centerX - 3, centerY + 2    // 左下
    ])
    flag.fill(NEON_COLORS.warning.neonOrange)

    // フラグのポール（中心に配置）
    flag.moveTo(centerX - 3, centerY - 6)
    flag.lineTo(centerX - 3, centerY + 8)
    flag.stroke({ width: 2, color: NEON_COLORS.text.lightGray })

    flag.zIndex = 10
    
    return flag
  }

  /**
   * クエスチョンマークグラフィックを作成
   * @returns PIXIコンテナ
   */
  private createQuestionGraphics(): PIXI.Container {
    const question = new PIXI.Container()
    question.zIndex = 10
    
    const text = new PIXI.Text({
      text: '?',
      style: {
        fontFamily: 'Courier New, monospace',
        fontSize: 20,
        fill: NEON_COLORS.accent.neonBlue,
        fontWeight: 'bold'
      }
    })
    
    text.x = this.cellSize / 2
    text.y = this.cellSize / 2
    text.anchor.set(0.5, 0.5)
    text.zIndex = 10
    
    question.addChild(text)
    return question
  }

  /**
   * 地雷グラフィックを作成
   * @returns PIXIグラフィックオブジェクト
   */
  private createMineGraphics(): PIXI.Graphics {
    const mine = new PIXI.Graphics()
    
    // 地雷の円
    mine
      .circle(this.cellSize / 2, this.cellSize / 2, 8)
      .fill({ color: NEON_COLORS.warning.neonRed })

    // 地雷の針
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4
      const startX = this.cellSize / 2 + Math.cos(angle) * 4
      const startY = this.cellSize / 2 + Math.sin(angle) * 4
      const endX = this.cellSize / 2 + Math.cos(angle) * 12
      const endY = this.cellSize / 2 + Math.sin(angle) * 12
      
      mine
        .moveTo(startX, startY)
        .lineTo(endX, endY)
        .stroke({ width: 2, color: NEON_COLORS.text.white })
    }

    return mine
  }
}