import { GameLogic } from '@/game/GameLogic'
import { GameRenderer } from '@/renderer/GameRenderer'
import { GameUI } from '@/ui/GameUI'
import { DOMHandler } from '@/ui/DOMHandler'
import { EventManager } from '@/ui/EventManager'
import { GameStateWatcher } from '@/game/GameStateWatcher'
import { SoundManager } from '@/audio/SoundManager'
import { StatsManager } from '@/stats/StatsManager'
import { SettingsManager } from '@/settings/SettingsManager'
import { PerformanceMonitor } from '@/performance/PerformanceMonitor'
import { LevelSelector } from '@/ui/LevelSelector'
import { StatsModal } from '@/ui/StatsModal'
import { AchievementButton } from '@/ui/AchievementButton'
import { AchievementModal } from '@/ui/AchievementModal'
import { Difficulty, DIFFICULTY_CONFIGS } from '@/types'

/**
 * ゲームの初期化プロセスを管理する専用クラス
 * 単一責任: アプリケーションの起動と初期設定
 */
export class GameBootstrapper {
  /**
   * ゲームアプリケーションを初期化し、完全に設定されたGameインスタンスを返す
   */
  public static async initialize(
    container: HTMLElement, 
    difficulty: Difficulty = Difficulty.NOVICE
  ): Promise<{
    gameLogic: GameLogic,
    renderer: GameRenderer,
    gameUI: GameUI,
    domHandler: DOMHandler,
    eventManager: EventManager,
    gameStateWatcher: GameStateWatcher,
    soundManager: SoundManager,
    statsManager: StatsManager,
    settingsManager: SettingsManager,
    performanceMonitor: PerformanceMonitor,
    levelSelector: LevelSelector,
    statsModal: StatsModal,
    achievementButton: AchievementButton,
    achievementModal: AchievementModal
  }> {
    console.log('GameBootstrapper: Initializing game application')
    
    try {
      // 基本サービスの作成
      const services = this.createCoreServices(container, difficulty)
      
      // レンダリングシステムの初期化
      await this.initializeRenderer(services)
      
      // UIシステムの初期化
      const uiComponents = await this.initializeUI(services)
      
      // ゲーム状態管理の初期化
      const gameManagement = this.initializeGameManagement(services, uiComponents)
      
      // 設定の適用
      this.applyInitialSettings(services)
      
      console.log('GameBootstrapper: Initialization complete')
      
      return {
        ...services,
        ...uiComponents,
        ...gameManagement
      }
      
    } catch (error) {
      console.error('GameBootstrapper: Initialization failed:', error)
      throw new Error(`ゲームの初期化に失敗しました: ${error}`)
    }
  }
  
  /**
   * コアサービス（ロジック、レンダラー、管理系）を作成
   */
  private static createCoreServices(container: HTMLElement, difficulty: Difficulty) {
    const config = DIFFICULTY_CONFIGS[difficulty]
    
    const domHandler = new DOMHandler(container)
    const settingsManager = new SettingsManager()
    const statsManager = new StatsManager()
    const soundManager = new SoundManager()
    const performanceMonitor = new PerformanceMonitor()
    const gameLogic = new GameLogic(config)
    const renderer = new GameRenderer(gameLogic, soundManager)
    
    return {
      domHandler,
      settingsManager,
      statsManager,
      soundManager,
      performanceMonitor,
      gameLogic,
      renderer
    }
  }
  
  /**
   * レンダリングシステムを初期化
   */
  private static async initializeRenderer(services: any): Promise<void> {
    await services.renderer.waitForReady()
    const canvas = services.renderer.getCanvas()
    services.domHandler.setupCanvas(canvas)
  }
  
  /**
   * UIコンポーネントを初期化
   */
  private static async initializeUI(services: any) {
    const stage = services.renderer.getApp().stage
    const app = services.renderer.getApp()
    
    const gameUI = new GameUI(stage, services.gameLogic, services.statsManager, services.settingsManager)
    
    const levelSelector = new LevelSelector(stage, {
      onLevelSelect: () => {}, // これは後で Game クラスで設定される
      onClose: () => {},
      canvasWidth: app.screen.width,
      canvasHeight: app.screen.height
    })
    
    const statsModal = new StatsModal(stage, services.statsManager, services.gameLogic, {
      onClose: () => {},
      onRestart: () => {},
      onLevelSelect: () => {},
      canvasWidth: app.screen.width,
      canvasHeight: app.screen.height
    })

    const achievementModal = new AchievementModal(stage, services.statsManager, {
      onClose: () => {},
      canvasWidth: app.screen.width,
      canvasHeight: app.screen.height
    })

    const achievementButton = new AchievementButton(stage, services.statsManager, {
      onAchievementClick: () => {
        console.log('Achievement button clicked')
        achievementModal.show()
      }
    })
    
    return {
      gameUI,
      levelSelector,
      statsModal,
      achievementButton,
      achievementModal
    }
  }
  
  /**
   * ゲーム状態管理システムを初期化
   */
  private static initializeGameManagement(services: any, uiComponents: any) {
    const eventManager = new EventManager(
      uiComponents.gameUI,
      () => {}, // restart callback - Game クラスで設定される
      () => {}  // showLevelSelector callback - Game クラスで設定される
    )
    eventManager.setupKeyboardControls()
    
    const gameStateWatcher = new GameStateWatcher(
      services.gameLogic,
      services.soundManager,
      services.statsManager,
      services.renderer,
      {
        onGameSuccess: () => {}, // Game クラスで設定される
        onGameFailed: () => {}
      }
    )
    gameStateWatcher.startWatching()
    
    return {
      eventManager,
      gameStateWatcher
    }
  }
  
  /**
   * 初期設定を適用
   */
  private static applyInitialSettings(services: any): void {
    const settings = services.settingsManager.getSettings()
    services.soundManager.setEnabled(settings.audio.enabled)
    services.soundManager.setMasterVolume(settings.audio.masterVolume)
    services.renderer.setupEventHandlers()
  }
}