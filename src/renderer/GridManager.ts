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
  private onGridPositionChanged?: (gridContainer: PIXI.Container) => void

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
   * グリッドを画面の中央に配置
   */
  private centerGrid(): void {
    const config = this.gameLogic.getConfig()
    const gridWidth = config.width * (this.cellSize + this.cellSpacing) - this.cellSpacing
    const gridHeight = config.height * (this.cellSize + this.cellSpacing) - this.cellSpacing

    // 最小マージンを確保
    const minMargin = 20
    const availableWidth = this.app.screen.width - (minMargin * 2)
    const availableHeight = this.app.screen.height - (minMargin * 2)
    
    // X座標：左右中央に配置
    if (gridWidth <= availableWidth) {
      this.gridContainer.x = (this.app.screen.width - gridWidth) / 2
    } else {
      this.gridContainer.x = minMargin
    }
    
    // Y座標：上下中央に配置
    if (gridHeight <= availableHeight) {
      this.gridContainer.y = (this.app.screen.height - gridHeight) / 2
    } else {
      this.gridContainer.y = minMargin
    }
    
    // グリッドの中央配置完了

    // グリッド位置が変更されたことを通知
    if (this.onGridPositionChanged) {
      this.onGridPositionChanged(this.gridContainer)
    }
  }

  /**
   * グリッドを再配置（外部から呼び出し可能）
   */
  public recenterGrid(): void {
    this.centerGrid()
  }

  /**
   * グリッドコンテナを取得
   * @returns PIXIグリッドコンテナ
   */
  public getGridContainer(): PIXI.Container {
    return this.gridContainer
  }

  /**
   * グリッド位置変更時のコールバックを設定
   * @param callback グリッド位置変更時のコールバック関数
   */
  public setGridPositionChangeCallback(callback: (gridContainer: PIXI.Container) => void): void {
    this.onGridPositionChanged = callback
  }
}