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
    

    
    if (this.gridPosition) {
      // グリッド情報ベースの計算

      
      // タイマーコンテナの位置を正しく計算
      const containerPosition = this.calculateContainerPosition()
      const timerBottomY = containerPosition.y + UI_CONSTANTS.HEADER.HEIGHT
      const gridTopY = this.gridPosition.y
      const scoreTextHeight = UI_CONSTANTS.TEXT.STATUS_FONT_SIZE - 2
      
      // 利用可能なスペースを計算
      const totalGap = gridTopY - timerBottomY

      
      if (totalGap < 30) {
        // スペースが狭すぎる場合は、グリッドに被らない安全な位置に配置
        const textHalfHeight = scoreTextHeight / 2
        const safeY = gridTopY - textHalfHeight - UI_CONSTANTS.SPACING.TINY // グリッドから5px離す
        const finalY = Math.max(timerBottomY + UI_CONSTANTS.SPACING.TINY, safeY) // タイマーからも最低5px離す

        return { x, y: finalY }
      }
      
      // 十分なスペースがある場合は、適応的マージンを使用
      const maxMargin = UI_CONSTANTS.SPACING.STANDARD // 20px
      const requiredSpace = scoreTextHeight + (maxMargin * 2)
      
      let topMargin, bottomMargin
      if (totalGap >= requiredSpace) {
        // 十分なスペースがある場合
        topMargin = bottomMargin = maxMargin
      } else {
        // スペースが限られている場合は、proportional に縮小
        const availableMargin = (totalGap - scoreTextHeight) / 2
        topMargin = bottomMargin = Math.max(UI_CONSTANTS.SPACING.TINY, availableMargin)
      }
      
      const minScoreY = timerBottomY + topMargin
      const maxScoreY = gridTopY - (scoreTextHeight / 2) - bottomMargin
      const finalY = (minScoreY + maxScoreY) / 2
      

      return { x, y: finalY }
    }
    
    // フォールバック計算

    const containerPosition = this.calculateContainerPosition()
    const timerBottomY = containerPosition.y + UI_CONSTANTS.HEADER.HEIGHT
    const gridTopY = this.getGridTopPosition()
    const scoreTextHeight = UI_CONSTANTS.TEXT.STATUS_FONT_SIZE - 2
    
    // 利用可能なスペースを計算（フォールバック）
    const totalGap = gridTopY - timerBottomY

    
    if (totalGap < 30) {
      // スペースが狭すぎる場合は、グリッドに被らない安全な位置に配置
      const textHalfHeight = scoreTextHeight / 2
      const safeY = gridTopY - textHalfHeight - UI_CONSTANTS.SPACING.TINY // グリッドから5px離す
      const finalY = Math.max(timerBottomY + UI_CONSTANTS.SPACING.TINY, safeY) // タイマーからも最低5px離す

      return { x, y: finalY }
    }
    
    // 適応的マージンを使用
    const maxMargin = UI_CONSTANTS.SPACING.STANDARD // 20px
    const requiredSpace = scoreTextHeight + (maxMargin * 2)
    
    let topMargin, bottomMargin
    if (totalGap >= requiredSpace) {
      topMargin = bottomMargin = maxMargin
    } else {
      const availableMargin = (totalGap - scoreTextHeight) / 2
      topMargin = bottomMargin = Math.max(UI_CONSTANTS.SPACING.TINY, availableMargin)
    }
    
    const minScoreY = timerBottomY + topMargin
    const maxScoreY = gridTopY - (scoreTextHeight / 2) - bottomMargin
    const finalY = (minScoreY + maxScoreY) / 2
    

    
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