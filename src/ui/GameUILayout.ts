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
  
  constructor(gameLogic: GameLogic, stage: PIXI.Container) {
    this.gameLogic = gameLogic
    this.stage = stage
  }
  
  /**
   * UIの実効幅を計算（デバイスに応じた調整）
   */
  public getEffectiveUIWidth(): number {
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
   * グリッドの上部位置を計算
   */
  public getGridTopPosition(): number {
    const app = (this.stage as any).app || (this.stage as any)._app
    const stageHeight = app ? app.screen.height : window.innerHeight
    return stageHeight * 0.3 // 画面上部30%の位置
  }
  
  /**
   * UIコンテナの位置を計算
   */
  public calculateContainerPosition(): { x: number, y: number } {
    const effectiveWidth = this.getEffectiveUIWidth()
    const app = (this.stage as any).app || (this.stage as any)._app
    const canvasWidth = app ? app.screen.width : window.innerWidth
    
    const x = (canvasWidth - effectiveWidth) / 2
    const gridTopPosition = this.getGridTopPosition()
    const y = Math.max(UI_CONSTANTS.HEADER.MIN_TOP_MARGIN, gridTopPosition - UI_CONSTANTS.HEADER.GRID_OFFSET)
    
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