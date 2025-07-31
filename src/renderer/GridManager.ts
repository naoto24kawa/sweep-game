import * as PIXI from 'pixi.js'
import { GameLogic } from '@/game/GameLogic'
import { RENDER_CONSTANTS } from '@/types'
import { CellRenderer } from './CellRenderer'

/**
 * グリッド管理専用クラス
 * セルグリッドの作成・更新・配置を管理
 */
export class GridManager {
  private readonly cellSize = RENDER_CONSTANTS.CELL.SIZE
  private readonly cellSpacing = RENDER_CONSTANTS.CELL.SPACING
  private gridContainer: PIXI.Container
  private cellRenderer: CellRenderer

  constructor(private gameLogic: GameLogic, private app: PIXI.Application) {
    this.gridContainer = new PIXI.Container()
    this.cellRenderer = new CellRenderer()
  }

  /**
   * グリッドを設定
   */
  public setupGrid(): void {
    const config = this.gameLogic.getConfig()
    const cells = this.gameLogic.getCells()

    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        const cellGraphics = this.cellRenderer.createCellGraphics(cells[y][x])
        cellGraphics.x = x * (this.cellSize + this.cellSpacing)
        cellGraphics.y = y * (this.cellSize + this.cellSpacing)
        cellGraphics.eventMode = 'static'
        cellGraphics.cursor = 'pointer'
        cellGraphics.label = `${x}-${y}`
        
        this.gridContainer.addChild(cellGraphics)
      }
    }

    this.app.stage.addChild(this.gridContainer)
    this.centerGrid()
  }

  /**
   * 表示を更新
   */
  public updateDisplay(): void {
    const cells = this.gameLogic.getCells()
    const config = this.gameLogic.getConfig()

    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        const cellId = `${x}-${y}`
        const cellContainer = this.gridContainer.children.find(
          child => (child as PIXI.Container).label === cellId
        ) as PIXI.Container
        
        if (cellContainer) {
          this.cellRenderer.updateCellDisplay(cellContainer, cells[y][x])
        }
      }
    }
  }

  /**
   * グリッドを適切な位置に配置（ヘッダーの下、中央揃え）
   */
  private centerGrid(): void {
    const config = this.gameLogic.getConfig()
    const gridWidth = config.width * (this.cellSize + this.cellSpacing) - this.cellSpacing
    const gridHeight = config.height * (this.cellSize + this.cellSpacing) - this.cellSpacing

    // グリッドが画面幅と同じ場合は左端に配置、そうでなければ中央に配置
    this.gridContainer.x = gridWidth >= this.app.screen.width ? 0 : (this.app.screen.width - gridWidth) / 2
    this.gridContainer.y = 120  // ヘッダー（100px）の下に配置
    
    console.log('🎯 Grid positioned:', { 
      x: this.gridContainer.x, 
      y: this.gridContainer.y, 
      gridWidth, 
      gridHeight,
      screenWidth: this.app.screen.width,
      screenHeight: this.app.screen.height,
      calculation: `(${this.app.screen.width} - ${gridWidth}) / 2 = ${(this.app.screen.width - gridWidth) / 2}`
    })
  }

  /**
   * グリッドコンテナを取得
   * @returns PIXIグリッドコンテナ
   */
  public getGridContainer(): PIXI.Container {
    return this.gridContainer
  }
}