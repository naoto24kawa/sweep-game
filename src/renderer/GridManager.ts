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
   * グリッドを中央に配置
   */
  private centerGrid(): void {
    const config = this.gameLogic.getConfig()
    const gridWidth = config.width * (this.cellSize + this.cellSpacing) - this.cellSpacing
    const gridHeight = config.height * (this.cellSize + this.cellSpacing) - this.cellSpacing

    this.gridContainer.x = (this.app.screen.width - gridWidth) / 2
    this.gridContainer.y = (this.app.screen.height - gridHeight) / 2
  }

  /**
   * グリッドコンテナを取得
   * @returns PIXIグリッドコンテナ
   */
  public getGridContainer(): PIXI.Container {
    return this.gridContainer
  }
}