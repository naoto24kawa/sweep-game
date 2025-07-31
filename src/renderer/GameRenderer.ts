import { GameLogic } from '@/game/GameLogic'
import { SoundManager } from '@/audio/SoundManager'
import { PixiAppManager } from './PixiAppManager'
import { GridManager } from './GridManager'
import { GridEventHandler } from './GridEventHandler'

/**
 * リファクタリングされたGameRenderer
 * 責任が明確に分離され、各専門クラスを統合管理
 */
export class GameRenderer {
  private pixiAppManager: PixiAppManager
  private gridManager!: GridManager
  private eventHandler!: GridEventHandler
  private initializationPromise: Promise<void>

  constructor(gameLogic: GameLogic, soundManager?: SoundManager) {
    this.pixiAppManager = new PixiAppManager()
    
    const config = gameLogic.getConfig()
    const gameWidth = config.width * (32 + 2) - 2  // cellSize + cellSpacing
    const gameHeight = config.height * (32 + 2) - 2
    
    // デバイス検出
    const isMobile = this.isMobileDevice()
    
    let canvasWidth: number
    let canvasHeight: number
    
    if (isMobile) {
      // スマートフォンでは画面いっぱいに設定
      canvasWidth = window.innerWidth
      canvasHeight = window.innerHeight
      console.log('📱 Mobile device detected - using full screen:', { canvasWidth, canvasHeight })
    } else {
      // PCでは従来通りゲームサイズに基づいて計算
      const headerHeight = 100
      const gridYPosition = 120
      const statsHeight = 180  // statsパネル自体の高さ
      const statsMargin = 40   // statsパネル上下のマージン
      canvasWidth = gameWidth
      canvasHeight = headerHeight + gridYPosition + gameHeight + statsHeight + statsMargin
      console.log('💻 Desktop device - using calculated size')
    }
    
    console.log('🎨 Final canvas size:', { 
      gameWidth, 
      gameHeight, 
      canvasWidth, 
      canvasHeight,
      isMobile
    })

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
   * モバイルデバイスかどうかを判定
   * @returns モバイルデバイスの真偽値
   */
  private isMobileDevice(): boolean {
    // User-Agentベースの基本的な判定
    const userAgent = navigator.userAgent.toLowerCase()
    const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone']
    const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword))
    
    // 画面サイズベースの判定
    const isMobileScreen = window.innerWidth <= 768
    
    // タッチデバイスの判定
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    
    console.log('🔍 Device detection:', { 
      userAgent: userAgent.substring(0, 50) + '...', 
      isMobileUA, 
      isMobileScreen, 
      isTouchDevice,
      screenSize: { width: window.innerWidth, height: window.innerHeight }
    })
    
    return isMobileUA || (isMobileScreen && isTouchDevice)
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
   * リソースを破棄
   */
  public destroy(): void {
    this.pixiAppManager.destroy()
  }
}