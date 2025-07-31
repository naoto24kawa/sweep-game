import { GameLogic } from '@/game/GameLogic'
import { StatsManager } from '@/stats/StatsManager'
import { SettingsManager } from '@/settings/SettingsManager'
import { SoundManager } from '@/audio/SoundManager'
import { GameBootstrapper } from '@/core/GameBootstrapper'
import { GameUICoordinator } from '@/ui/GameUICoordinator'
import { GameLifecycleManager } from '@/game/GameLifecycleManager'
import { Difficulty } from '@/types'
import { UI_CONSTANTS } from '@/constants/ui'

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

  constructor(container: HTMLElement, difficulty: Difficulty = Difficulty.NOVICE) {
    this.initializeAsync(container, difficulty)
  }

  private async initializeAsync(container: HTMLElement, difficulty: Difficulty): Promise<void> {
    console.log('Game: Starting initialization')
    
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
      
      // ライフサイクル管理システムを設定
      this.lifecycleManager = new GameLifecycleManager(
        components.gameLogic,
        components.renderer,
        components.gameUI,
        components.gameStateWatcher,
        components.soundManager,
        components.domHandler,
        this.uiCoordinator,
        difficulty
      )
      
      // イベントハンドラーを設定
      this.setupEventHandlers(components)
      
      this.uiCoordinator.markAsInitialized()
      
      console.log('Game: Initialization complete')
      
      // レベル選択画面を表示
      setTimeout(() => {
        this.uiCoordinator.showLevelSelector()
      }, UI_CONSTANTS.INITIALIZATION.LEVEL_SELECTOR_DELAY)
      
    } catch (error) {
      console.error('Game: Initialization failed:', error)
      throw error
    }
  }

  /**
   * イベントハンドラーを設定（コールバック関数の接続）
   */
  private setupEventHandlers(components: any): void {
    // LevelSelectorのコールバックを更新
    components.levelSelector.onLevelSelect = (difficulty: Difficulty) => this.handleLevelSelection(difficulty)
    components.levelSelector.onClose = () => this.handleLevelSelectorClose()
    
    // StatsModalのコールバックを更新
    components.statsModal.onClose = () => this.handleStatsModalClose()
    components.statsModal.onRestart = () => this.handleStatsModalRestart()
    components.statsModal.onLevelSelect = () => this.handleStatsModalLevelSelect()
    
    // EventManagerのコールバックを更新
    components.eventManager.restartCallback = () => this.restart()
    components.eventManager.showLevelSelectorCallback = () => this.showLevelSelector()
    
    // GameStateWatcherのコールバックを更新
    components.gameStateWatcher.updateCallbacks({
      onGameSuccess: () => this.showStatsModal(),
      onGameFailed: () => this.showStatsModal()
    })
  }

  /**
   * ゲームを再開始（ライフサイクル管理に委譲）
   */
  public restart(): void {
    this.lifecycleManager.restart()
  }

  private handleLevelSelection(difficulty: Difficulty): void {
    console.log('Level selected:', difficulty)
    if (difficulty !== this.lifecycleManager.getCurrentDifficulty()) {
      this.changeDifficulty(difficulty)
    }
  }

  private handleLevelSelectorClose(): void {
    console.log('Level selector closed')
  }

  private handleStatsModalClose(): void {
    console.log('Stats modal closed')
  }

  private handleStatsModalRestart(): void {
    console.log('Stats modal restart requested')
    this.restart()
  }

  private handleStatsModalLevelSelect(): void {
    console.log('Stats modal level select requested')
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