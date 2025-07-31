import { DeviceDetector } from '@/core/DeviceDetector'
import { GameConfig } from '@/types'

/**
 * キャンバスサイズ計算専用クラス
 * デバイス種別に応じた最適なキャンバスサイズを計算
 * Single Responsibility Principle: サイズ計算のみに特化
 */
export class CanvasSizeCalculator {
  private readonly deviceDetector: DeviceDetector
  
  // レイアウト定数
  private readonly LAYOUT_CONSTANTS = {
    CELL_SIZE: 32,
    CELL_SPACING: 2,
    HEADER_HEIGHT: 100,
    GRID_Y_POSITION: 120,
    STATS_HEIGHT: 180,
    STATS_MARGIN: 40,
    MOBILE_BREAKPOINT: 768
  } as const

  constructor() {
    this.deviceDetector = DeviceDetector.getInstance()
  }

  /**
   * ゲーム設定に基づいてキャンバスサイズを計算
   * @param config ゲーム設定
   * @returns キャンバスサイズ情報
   */
  public calculateCanvasSize(config: GameConfig): CanvasSizeInfo {
    const gameSize = this.calculateGameSize(config)
    const deviceType = this.deviceDetector.getDeviceType()
    
    let canvasSize: { width: number; height: number }
    
    switch (deviceType) {
      case 'mobile':
        canvasSize = this.calculateMobileCanvasSize()
        break
      case 'tablet':
        canvasSize = this.calculateTabletCanvasSize(gameSize)
        break
      case 'desktop':
      default:
        canvasSize = this.calculateDesktopCanvasSize(gameSize)
        break
    }

    const result: CanvasSizeInfo = {
      canvas: canvasSize,
      game: gameSize,
      deviceType,
      isResponsive: deviceType !== 'desktop'
    }

    console.log('🎨 Canvas size calculated:', result)
    return result
  }

  /**
   * ゲーム領域のサイズを計算
   * @param config ゲーム設定
   * @returns ゲーム領域サイズ
   */
  private calculateGameSize(config: GameConfig): { width: number; height: number } {
    const { CELL_SIZE, CELL_SPACING } = this.LAYOUT_CONSTANTS
    
    return {
      width: config.width * (CELL_SIZE + CELL_SPACING) - CELL_SPACING,
      height: config.height * (CELL_SIZE + CELL_SPACING) - CELL_SPACING
    }
  }

  /**
   * モバイル用キャンバスサイズを計算
   * 画面いっぱいを使用してプレイしやすさを向上
   * @returns モバイル用キャンバスサイズ
   */
  private calculateMobileCanvasSize(): { width: number; height: number } {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    }
  }

  /**
   * タブレット用キャンバスサイズを計算
   * モバイルとデスクトップの中間的なアプローチ
   * @param gameSize ゲーム領域サイズ
   * @returns タブレット用キャンバスサイズ
   */
  private calculateTabletCanvasSize(gameSize: { width: number; height: number }): { width: number; height: number } {
    const { HEADER_HEIGHT, GRID_Y_POSITION, STATS_HEIGHT, STATS_MARGIN } = this.LAYOUT_CONSTANTS
    
    // タブレットでは計算サイズと画面サイズの小さい方を使用
    const calculatedWidth = Math.max(gameSize.width, 600) // 最小幅を確保
    const calculatedHeight = HEADER_HEIGHT + GRID_Y_POSITION + gameSize.height + STATS_HEIGHT + STATS_MARGIN
    
    return {
      width: Math.min(calculatedWidth, window.innerWidth * 0.9), // 画面の90%まで
      height: Math.min(calculatedHeight, window.innerHeight * 0.9)
    }
  }

  /**
   * デスクトップ用キャンバスサイズを計算
   * 従来の固定サイズレイアウトを使用
   * @param gameSize ゲーム領域サイズ
   * @returns デスクトップ用キャンバスサイズ
   */
  private calculateDesktopCanvasSize(gameSize: { width: number; height: number }): { width: number; height: number } {
    const { HEADER_HEIGHT, GRID_Y_POSITION, STATS_HEIGHT, STATS_MARGIN } = this.LAYOUT_CONSTANTS
    
    return {
      width: gameSize.width,
      height: HEADER_HEIGHT + GRID_Y_POSITION + gameSize.height + STATS_HEIGHT + STATS_MARGIN
    }
  }

  /**
   * ビューポートサイズが変更された際の再計算
   * @param config ゲーム設定
   * @returns 更新されたキャンバスサイズ情報
   */
  public recalculateOnResize(config: GameConfig): CanvasSizeInfo {
    return this.calculateCanvasSize(config)
  }
}

/**
 * キャンバスサイズ情報の型定義
 */
export interface CanvasSizeInfo {
  canvas: { width: number; height: number }
  game: { width: number; height: number }
  deviceType: 'mobile' | 'tablet' | 'desktop'
  isResponsive: boolean
}