import * as PIXI from 'pixi.js'
import { GameLogic } from '@/game/GameLogic'
import { GAME_CONSTANTS } from '@/constants/game'
import { UI_CONSTANTS } from '@/constants/ui'

/**
 * UI要素のレイアウト計算を専門に行うクラス
 * 単一責任: 位置とサイズの計算
 */
export class GameUILayout {
  private gameLogic: GameLogic
  private stage: PIXI.Container
  private gridPosition: { x: number, y: number, width: number, height: number } | null = null
  
  constructor(gameLogic: GameLogic, stage: PIXI.Container) {
    this.gameLogic = gameLogic
    this.stage = stage
  }

  /**
   * グリッドの位置とサイズ情報を設定
   */
  public setGridInfo(x: number, y: number, width: number, height: number): void {
    this.gridPosition = { x, y, width, height }
    console.log('🎯 GameUILayout: Grid info updated:', this.gridPosition)
  }
  
  /**
   * UIの実効幅を計算（グリッド幅を基準に）
   */
  public getEffectiveUIWidth(): number {
    if (this.gridPosition) {
      // グリッド幅を基準にUI幅を決定
      return this.gridPosition.width
    }
    
    // フォールバック：従来の計算方法
    const logicalGameWidth = this.getLogicalGameWidth()
    
    // モバイルデバイスの判定
    if (this.isMobileDevice()) {
      const app = (this.stage as any).app || (this.stage as any)._app
      const screenWidth = app ? app.screen.width : window.innerWidth
      return Math.min(logicalGameWidth, screenWidth - 40) // モバイル時は左右20pxずつマージン
    }
    
    return Math.max(320, logicalGameWidth) // 最小幅320px保証
  }
  
  /**
   * グリッドの上部位置を計算（GridManagerのロジックに合わせる）
   */
  public getGridTopPosition(): number {
    const app = (this.stage as any).app || (this.stage as any)._app
    const screenHeight = app ? app.screen.height : window.innerHeight
    
    const config = this.gameLogic.getConfig()
    const cellSize = 32 // RENDER_CONSTANTS.CELL.SIZE
    const cellSpacing = 2 // RENDER_CONSTANTS.CELL.SPACING
    const gridHeight = config.height * (cellSize + cellSpacing) - cellSpacing
    
    const minMargin = 20
    const availableHeight = screenHeight - (minMargin * 2)
    
    // GridManagerと同じロジック：画面中央に配置
    if (gridHeight <= availableHeight) {
      return (screenHeight - gridHeight) / 2
    } else {
      return minMargin
    }
  }
  
  /**
   * UIコンテナの位置を計算（グリッド位置を基準に）
   */
  public calculateContainerPosition(): { x: number, y: number } {
    if (this.gridPosition) {
      // グリッド位置を基準にUI要素を配置
      const headerMargin = UI_CONSTANTS.SPACING.STANDARD
      const headerHeight = UI_CONSTANTS.HEADER.HEIGHT
      
      const x = this.gridPosition.x
      const y = Math.max(
        UI_CONSTANTS.HEADER.MIN_TOP_MARGIN,
        this.gridPosition.y - headerHeight - headerMargin
      )
      
      console.log('🎯 GameUILayout: Container position (grid-based):', { x, y, gridY: this.gridPosition.y })
      return { x, y }
    }
    
    // フォールバック：グリッド中央配置に合わせてタイマーを配置
    const effectiveWidth = this.getEffectiveUIWidth()
    const app = (this.stage as any).app || (this.stage as any)._app
    const canvasWidth = app ? app.screen.width : window.innerWidth
    
    const x = (canvasWidth - effectiveWidth) / 2
    const gridTopPosition = this.getGridTopPosition()
    
    // グリッドの上に適切な間隔でタイマーを配置
    const headerHeight = UI_CONSTANTS.HEADER.HEIGHT
    const headerMargin = UI_CONSTANTS.SPACING.STANDARD
    const y = Math.max(
      UI_CONSTANTS.HEADER.MIN_TOP_MARGIN,
      gridTopPosition - headerHeight - headerMargin
    )
    
    console.log('🎯 GameUILayout: Container position (fallback):', { 
      x, y, gridTopPosition, headerHeight, headerMargin,
      calculation: `${gridTopPosition} - ${headerHeight} - ${headerMargin} = ${gridTopPosition - headerHeight - headerMargin}`
    })
    return { x, y }
  }
  
  /**
   * 要素を水平中央に配置するX座標を計算
   */
  public centerElementX(elementWidth: number, containerWidth: number): number {
    return containerWidth / 2 - elementWidth / 2
  }
  
  /**
   * 統計パネルの位置を計算
   */
  public calculateStatsPanelPosition(gameWidth: number): { x: number, y: number } {
    const x = (gameWidth - Math.min(280, gameWidth * 0.8)) / 2
    const y = UI_CONSTANTS.HEADER.HEIGHT + 10
    return { x, y }
  }

  /**
   * スコア表示の位置を計算（タイマーとグリッドの間に安全に配置）
   */
  public calculateScorePosition(_gameWidth: number): { x: number, y: number } {
    const app = (this.stage as any).app || (this.stage as any)._app
    const screenWidth = app ? app.screen.width : window.innerWidth
    
    // X座標：画面中央
    const x = screenWidth / 2 // アンカーが0.5なので中央座標
    
    // Y座標：タイマーとグリッドの中間に配置（グリッドに被らないよう調整）
    const containerPosition = this.calculateContainerPosition()
    const timerBottomY = containerPosition.y + UI_CONSTANTS.HEADER.HEIGHT
    const gridTopY = this.getGridTopPosition()
    
    // タイマーとグリッドの中間点を計算
    const gapCenterY = timerBottomY + ((gridTopY - timerBottomY) / 2)
    
    // スコアのフォントサイズを考慮して、グリッドに被らないよう微調整
    const scoreTextHeight = UI_CONSTANTS.TEXT.STATUS_FONT_SIZE - 2 // GameUI.tsでのスコアフォントサイズ
    const safeMargin = UI_CONSTANTS.SPACING.TINY // 最小限の安全マージン
    const maxScoreY = gridTopY - (scoreTextHeight / 2) - safeMargin // グリッドに被らない最下位置（アンカー0.5対応）
    
    // 中間点とグリッド安全位置の小さい方を選択
    const finalY = Math.min(gapCenterY, maxScoreY)
    
    console.log('🎯 GameUILayout: Score position (center with safety):', { 
      x, 
      y: finalY,
      timerBottomY,
      gridTopY,
      gapCenterY,
      maxScoreY,
      scoreTextHeight,
      safeMargin,
      gapSize: gridTopY - timerBottomY,
      chosenPosition: finalY === gapCenterY ? 'center' : 'safety'
    })
    
    return { x, y: finalY }
  }
  
  /**
   * 論理的なゲーム幅を取得（ブロック配置に基づく）
   */
  private getLogicalGameWidth(): number {
    const config = this.gameLogic.getConfig()
    return config.width * GAME_CONSTANTS.GRID.EFFECTIVE_CELL_WIDTH - GAME_CONSTANTS.GRID.CELL_OFFSET
  }
  
  /**
   * モバイルデバイスかどうかを判定
   */
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768
  }
}