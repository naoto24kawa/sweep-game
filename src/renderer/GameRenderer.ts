import { GameLogic } from '@/game/GameLogic'
import { SoundManager } from '@/audio/SoundManager'
import { DeviceDetector } from '@/core/DeviceDetector'
import { CanvasSizeCalculator } from './CanvasSizeCalculator'
import { PixiAppManager } from './PixiAppManager'
import { GridManager } from './GridManager'
import { GridEventHandler } from './GridEventHandler'
import { AnimationManager } from '@/animation/AnimationManager'
import { GameStateFlags } from '@/core/GameStateFlags'
import type { EffectManager } from '@/effects/EffectManager'

/**
 * リファクタリングされたGameRenderer
 * 責任が明確に分離され、各専門クラスを統合管理
 * デバイス判定とサイズ計算は専用クラスに委譲
 */
export class GameRenderer {
  private pixiAppManager: PixiAppManager
  private gridManager!: GridManager
  private eventHandler!: GridEventHandler
  private animationManager: AnimationManager
  private initializationPromise: Promise<void>
  private deviceDetector: DeviceDetector
  private sizeCalculator: CanvasSizeCalculator
  private onGridInfoChanged?: (x: number, y: number, width: number, height: number) => void

  constructor(gameLogic: GameLogic, soundManager?: SoundManager) {
    this.pixiAppManager = new PixiAppManager()
    this.deviceDetector = DeviceDetector.getInstance()
    this.sizeCalculator = new CanvasSizeCalculator()
    this.animationManager = new AnimationManager()
    
    // 専用クラスでキャンバスサイズを計算
    const config = gameLogic.getConfig()
    const sizeInfo = this.sizeCalculator.calculateCanvasSize(config)

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

    // レベル変更中かどうかを確認してGridEventHandlerの初期状態を決定
    const isLevelChanging = GameStateFlags.getInstance().isLevelChangingActive()
    
    this.eventHandler = new GridEventHandler(
      gameLogic,
      this.pixiAppManager.getEffectManager(),
      soundManager || null,
      () => this.updateDisplay(),
      isLevelChanging // レベル変更中は無効状態で開始
    )

    // グリッド位置変更時にイベントハンドラーのオフセットを更新
    this.gridManager.setGridPositionChangeCallback((gridContainer) => {
      this.eventHandler.updateGridOffset(gridContainer)
      
      // UI要素にグリッド情報を通知
      this.notifyGridInfo(gameLogic, gridContainer)
    })
    
    // 初期化完了時にもグリッド情報を通知（遅延実行で確実に）
    setTimeout(() => {
      const gridContainer = this.gridManager.getGridContainer()
      this.notifyGridInfo(gameLogic, gridContainer)
    }, 10)
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
   * グリッド情報変更時のコールバックを設定
   */
  public setGridInfoChangeCallback(callback: (x: number, y: number, width: number, height: number) => void): void {
    this.onGridInfoChanged = callback
  }

  /**
   * GridEventHandlerを取得
   * @returns GridEventHandler
   */
  public getEventHandler(): GridEventHandler {
    if (!this.eventHandler) {
      throw new Error('GameRenderer: Event handler not initialized')
    }
    return this.eventHandler
  }

  /**
   * EffectManagerを取得
   * @returns EffectManager
   */
  public getEffectManager(): EffectManager {
    return this.pixiAppManager.getEffectManager()
  }

  /**
   * グリッド情報を通知
   */
  private notifyGridInfo(gameLogic: any, gridContainer: any): void {
    if (this.onGridInfoChanged) {
      const config = gameLogic.getConfig()
      const gridWidth = config.width * (32 + 2) - 2  // RENDER_CONSTANTS.CELL.SIZE + SPACING
      const gridHeight = config.height * (32 + 2) - 2
      
      this.onGridInfoChanged(gridContainer.x, gridContainer.y, gridWidth, gridHeight)
    }
  }

  /**
   * レベル変更アニメーション開始（現在のグリッドをフェードアウト）
   */
  public async animateLevelChange(): Promise<void> {
    const gridContainer = this.gridManager.getGridContainer()
    
    // 1. 現在のグリッドをフェードアウト (300ms)
    await this.animationManager.fadeOut(gridContainer, 300)
    
    // ここで新しいグリッドが作成される（外部で実行）
    
    return Promise.resolve()
  }

  /**
   * 新しいグリッドをフェードイン
   */
  public async completeAnimateLevelChange(): Promise<void> {
    const gridContainer = this.gridManager.getGridContainer()
    
    // 新しいグリッドを透明から開始
    gridContainer.alpha = 0
    
    // 2. 新しいグリッドをフェードイン (200ms)
    await this.animationManager.fadeIn(gridContainer, 200)
  }

  /**
   * リソースを破棄
   */
  public destroy(): void {
    this.pixiAppManager.destroy()
  }
}