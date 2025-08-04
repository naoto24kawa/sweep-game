import { GameLogic } from '@/game/GameLogic'
import { StatsManager } from '@/stats/StatsManager'
import { SettingsManager } from '@/settings/SettingsManager'
import { SoundManager } from '@/audio/SoundManager'
import { GameBootstrapper } from '@/core/GameBootstrapper'
import { GameUICoordinator } from '@/ui/GameUICoordinator'
import { GameLifecycleManager } from '@/game/GameLifecycleManager'
import { Difficulty } from '@/types'
import { UI_CONSTANTS } from '@/constants/ui'
import { ErrorHandler, ErrorType } from '@/core/ErrorHandler'
import { EventHandlerManager, EventHandlerCallbacks } from '@/core/EventHandlerManager'
import { Logger } from '@/core/Logger'

/**
 * 簡素化されたGameクラス - 統合ロジックのみを担当
 * 責任分離により、初期化、UI管理、ライフサイクル管理は専用クラスに委譲
 */
export class Game {
  private gameLogic!: GameLogic
  private statsManager!: StatsManager
  private settingsManager!: SettingsManager
  private soundManager!: SoundManager
  private uiCoordinator!: GameUICoordinator
  private lifecycleManager!: GameLifecycleManager
  private eventHandlerManager: EventHandlerManager
  private container: HTMLElement

  constructor(container: HTMLElement, difficulty: Difficulty = Difficulty.NOVICE) {
    this.container = container
    
    // イベントハンドリング用のコールバックを定義
    const callbacks: EventHandlerCallbacks = {
      onLevelSelect: (difficulty: Difficulty) => this.handleLevelSelection(difficulty),
      onLevelSelectorClose: () => this.handleLevelSelectorClose(),
      onStatsModalClose: () => this.handleStatsModalClose(),
      onStatsModalRestart: () => this.handleStatsModalRestart(),
      onStatsModalLevelSelect: () => this.handleStatsModalLevelSelect(),
      onRestart: () => this.restart(),
      onShowLevelSelector: () => this.showLevelSelector(),
      onGameSuccess: () => this.showStatsModal(),
      onGameFailed: () => this.showStatsModal()
    }
    
    this.eventHandlerManager = new EventHandlerManager(callbacks)
    this.initializeAsync(container, difficulty)
  }

  private async initializeAsync(container: HTMLElement, difficulty: Difficulty): Promise<void> {
    
    try {
      // GameBootstrapperを使用して全コンポーネントを初期化
      const components = await GameBootstrapper.initialize(container, difficulty)
      
      // 主要サービスを保存
      this.gameLogic = components.gameLogic
      this.statsManager = components.statsManager
      this.settingsManager = components.settingsManager
      this.soundManager = components.soundManager
      
      // UI管理システムを設定
      this.uiCoordinator = new GameUICoordinator(components.levelSelector, components.statsModal)
      this.uiCoordinator.setAchievementButton(components.achievementButton)
      this.uiCoordinator.setAchievementModal(components.achievementModal)
      this.uiCoordinator.setGridEventHandler(components.renderer.getEventHandler())
      
      // ライフサイクル管理システムを設定
      this.lifecycleManager = new GameLifecycleManager(
        components.gameLogic,
        components.renderer,
        components.gameUI,
        components.gameStateWatcher,
        components.soundManager,
        components.domHandler,
        this.uiCoordinator,
        difficulty,
        this.container,
        (newComponents: any) => this.setupEventHandlers(newComponents)
      )
      
      // イベントハンドラーを設定
      this.setupEventHandlers(components)
      
      this.uiCoordinator.markAsInitialized()
      
      
      // レベル選択画面を表示
      setTimeout(() => {
        this.uiCoordinator.showLevelSelector()
      }, UI_CONSTANTS.TIMING.DELAYS.LEVEL_SELECTOR_SHOW)
      
    } catch (error) {
      ErrorHandler.handleCritical(error as Error, {
        type: ErrorType.INITIALIZATION,
        component: 'Game',
        action: 'initialize',
        userMessage: 'ゲームの初期化に失敗しました。ページを再読み込みしてください。'
      })
      throw error
    }
  }

  /**
   * イベントハンドラーを設定（EventHandlerManagerに委譲）
   */
  private setupEventHandlers(components: any): void {
    // 新しいUICoordinatorが渡された場合は更新
    if (components.uiCoordinator && components.uiCoordinator !== this.uiCoordinator) {
      Logger.debug('Game: Updating UICoordinator reference to new instance')
      this.uiCoordinator = components.uiCoordinator
    }
    
    this.eventHandlerManager.setupEventHandlers(components)
  }

  /**
   * ゲームを再開始（ライフサイクル管理に委譲）
   */
  public restart(): void {
    Logger.debug('Game: restart called')
    this.lifecycleManager.restart()
  }

  private handleLevelSelection(difficulty: Difficulty): void {
    if (difficulty !== this.lifecycleManager.getCurrentDifficulty()) {
      this.changeDifficulty(difficulty)
    } else {
      // 同じ難易度が選択された場合もゲームをリセット
      Logger.debug('Game: Same difficulty selected, restarting game')
      this.restart()
    }
  }

  private handleLevelSelectorClose(): void {
    this.uiCoordinator.hideLevelSelector()
  }

  private handleStatsModalClose(): void {
    this.uiCoordinator.hideStatsModal()
  }

  private handleStatsModalRestart(): void {
    Logger.debug('Game: handleStatsModalRestart called')
    // モーダル状態をリセットしてグリッドイベントを有効化
    this.uiCoordinator.resetModalState()
    this.restart()
  }

  private handleStatsModalLevelSelect(): void {
    this.showLevelSelector()
  }

  /**
   * レベル選択画面を表示（UIコーディネーターに委譲）
   */
  public showLevelSelector(): void {
    this.uiCoordinator.showLevelSelector()
  }

  /**
   * 統計モーダルを表示（UIコーディネーターに委譲）
   */
  public showStatsModal(): void {
    this.uiCoordinator.showStatsModal()
  }

  /**
   * 難易度変更（ライフサイクル管理に委譲）
   */
  public async changeDifficulty(difficulty: Difficulty): Promise<void> {
    await this.lifecycleManager.changeDifficulty(difficulty)
  }

  // === 公開API ===
  
  /**
   * ゲームロジックへのアクセス
   */
  public getGameLogic(): GameLogic {
    return this.gameLogic
  }

  /**
   * 統計管理システムへのアクセス
   */
  public getStatsManager(): StatsManager {
    return this.statsManager
  }

  /**
   * 設定管理システムへのアクセス
   */
  public getSettingsManager(): SettingsManager {
    return this.settingsManager
  }

  /**
   * 音響管理システムへのアクセス
   */
  public getSoundManager(): SoundManager {
    return this.soundManager
  }

  /**
   * ゲームアプリケーション全体を破棄（ライフサイクル管理に委譲）
   */
  public destroy(): void {
    this.lifecycleManager.destroy()
  }
}