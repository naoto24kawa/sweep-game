import { GameLogic } from '@/game/GameLogic'
import { SoundManager } from '@/audio/SoundManager'
import { PixiAppManager } from './PixiAppManager'
import { GridManager } from './GridManager'
import { GridEventHandler } from './GridEventHandler'

/**
 * リファクタリングされたGameRenderer
 * 責任が明確に分離され、各専門クラスを統合管理
 */
export class GameRendererRefactored {
  private pixiAppManager: PixiAppManager
  private gridManager!: GridManager
  private eventHandler!: GridEventHandler
  private initializationPromise: Promise<void>

  constructor(gameLogic: GameLogic, soundManager?: SoundManager) {
    this.pixiAppManager = new PixiAppManager()
    
    const config = gameLogic.getConfig()
    const canvasWidth = config.width * (32 + 2) - 2  // cellSize + cellSpacing
    const canvasHeight = config.height * (32 + 2) - 2

    this.initializationPromise = this.initialize(gameLogic, soundManager, canvasWidth, canvasHeight)
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
    this.gridManager.setupGrid()

    this.eventHandler = new GridEventHandler(
      gameLogic,
      this.pixiAppManager.getAnimationManager(),
      this.pixiAppManager.getEffectManager(),
      soundManager || null,
      () => this.updateDisplay()
    )
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
   * リソースを破棄
   */
  public destroy(): void {
    this.pixiAppManager.destroy()
  }
}