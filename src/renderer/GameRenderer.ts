import { GameLogic } from '@/game/GameLogic'
import { SoundManager } from '@/audio/SoundManager'
import { DeviceDetector } from '@/core/DeviceDetector'
import { CanvasSizeCalculator } from './CanvasSizeCalculator'
import { PixiAppManager } from './PixiAppManager'
import { GridManager } from './GridManager'
import { GridEventHandler } from './GridEventHandler'

/**
 * リファクタリングされたGameRenderer
 * 責任が明確に分離され、各専門クラスを統合管理
 * デバイス判定とサイズ計算は専用クラスに委譲
 */
export class GameRenderer {
  private pixiAppManager: PixiAppManager
  private gridManager!: GridManager
  private eventHandler!: GridEventHandler
  private initializationPromise: Promise<void>
  private deviceDetector: DeviceDetector
  private sizeCalculator: CanvasSizeCalculator

  constructor(gameLogic: GameLogic, soundManager?: SoundManager) {
    this.pixiAppManager = new PixiAppManager()
    this.deviceDetector = DeviceDetector.getInstance()
    this.sizeCalculator = new CanvasSizeCalculator()
    
    // 専用クラスでキャンバスサイズを計算
    const config = gameLogic.getConfig()
    const sizeInfo = this.sizeCalculator.calculateCanvasSize(config)
    
    console.log(`📱 ${sizeInfo.deviceType.toUpperCase()} device detected - using ${sizeInfo.isResponsive ? 'responsive' : 'fixed'} layout`)

    this.initializationPromise = this.initialize(
      gameLogic, 
      soundManager, 
      sizeInfo.canvas.width, 
      sizeInfo.canvas.height
    )
  }

  /**
   * 初期化処理
   * @param gameLogic ゲームロジック
   * @param soundManager サウンドマネージャー
   * @param width キャンバス幅
   * @param height キャンバス高さ
   */
  private async initialize(
    gameLogic: GameLogic, 
    soundManager: SoundManager | undefined, 
    width: number, 
    height: number
  ): Promise<void> {
    await this.pixiAppManager.initializeApp(width, height)
    
    this.gridManager = new GridManager(gameLogic, this.pixiAppManager.getApp())
    
    // リサイズ時にグリッドを再中央配置するコールバックを設定
    this.pixiAppManager.setResizeCallback(() => {
      this.gridManager.recenterGrid()
    })
    
    this.gridManager.setupGrid()

    this.eventHandler = new GridEventHandler(
      gameLogic,
      // this.pixiAppManager.getAnimationManager(),  // 削除
      this.pixiAppManager.getEffectManager(),
      soundManager || null,
      () => this.updateDisplay()
    )

    // グリッド位置変更時にイベントハンドラーのオフセットを更新
    this.gridManager.setGridPositionChangeCallback((gridContainer) => {
      this.eventHandler.updateGridOffset(gridContainer)
    })
  }

  /**
   * デバイス情報を取得（デバッグ用）
   * @returns デバイス情報
   */
  public getDeviceInfo() {
    return this.deviceDetector.getDeviceInfo()
  }

  /**
   * 初期化完了を待機
   */
  public async waitForReady(): Promise<void> {
    await this.initializationPromise
  }

  /**
   * 準備状態を確認
   * @returns 準備完了の真偽値
   */
  public isReady(): boolean {
    return this.pixiAppManager.isReady()
  }

  /**
   * イベントハンドラーを設定
   */
  public setupEventHandlers(): void {
    this.eventHandler.setupEventHandlers(this.gridManager.getGridContainer())
  }

  /**
   * 表示を更新
   */
  public updateDisplay(): void {
    this.gridManager.updateDisplay()
  }

  /**
   * グリッドを再中央配置
   */
  public recenterGrid(): void {
    this.gridManager.recenterGrid()
  }

  /**
   * キャンバス要素を取得
   * @returns HTMLCanvasElement
   */
  public getCanvas(): HTMLCanvasElement {
    return this.pixiAppManager.getCanvas()
  }

  /**
   * PIXIアプリケーションを取得
   * @returns PIXI.Application
   */
  public getApp(): any {
    return this.pixiAppManager.getApp()
  }

  /**
   * ビクトリー演出を実行
   */
  public playVictoryEffect(): void {
    this.pixiAppManager.getEffectManager().createVictoryEffect()
  }

  /**
   * ゲームオーバー演出を実行
   */
  public playGameOverEffect(): void {
    this.pixiAppManager.getEffectManager().createGameOverEffect()
  }

  /**
   * リソースを破棄
   */
  public destroy(): void {
    this.pixiAppManager.destroy()
  }
}