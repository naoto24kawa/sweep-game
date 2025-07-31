import { ServiceContainer, ServiceKeys } from './ServiceContainer'
import { GameLogic } from '@/game/GameLogic'
import { GameRendererRefactored } from '@/renderer/GameRendererRefactored'
import { SoundManager } from '@/audio/SoundManager'
import { StatsManager } from '@/stats/StatsManager'
import { SettingsManager } from '@/settings/SettingsManager'
import { PerformanceMonitor } from '@/performance/PerformanceMonitor'
import { Difficulty, DIFFICULTY_CONFIGS } from '@/types'

/**
 * ゲームサービスブートストラッパー
 * アプリケーション起動時にすべてのサービスを登録・初期化
 */
export class GameServiceBootstrapper {
  private container: ServiceContainer
  private difficulty: Difficulty

  constructor(difficulty: Difficulty = Difficulty.NOVICE) {
    this.container = new ServiceContainer()
    this.difficulty = difficulty
  }

  /**
   * すべてのサービスを登録
   */
  public registerServices(): void {
    this.registerCoreServices()
    this.registerUIServices()
    this.registerAudioServices()
    this.registerPerformanceServices()
  }

  /**
   * コアサービスを登録
   */
  private registerCoreServices(): void {
    // GameLogic（シングルトン）
    this.container.registerSingleton(ServiceKeys.GAME_LOGIC, () => {
      return new GameLogic(DIFFICULTY_CONFIGS[this.difficulty])
    })

    // SettingsManager（シングルトン）
    this.container.registerSingleton(ServiceKeys.SETTINGS_MANAGER, () => {
      return new SettingsManager()
    })

    // StatsManager（シングルトン）
    this.container.registerSingleton(ServiceKeys.STATS_MANAGER, () => {
      return new StatsManager()
    })
  }

  /**
   * UIサービスを登録
   */
  private registerUIServices(): void {
    // GameRenderer（シングルトン）
    this.container.registerSingleton(ServiceKeys.GAME_RENDERER, () => {
      const gameLogic = this.container.resolve<GameLogic>(ServiceKeys.GAME_LOGIC)
      const soundManager = this.container.resolve<SoundManager>(ServiceKeys.SOUND_MANAGER)
      return new GameRendererRefactored(gameLogic, soundManager)
    })
  }

  /**
   * オーディオサービスを登録
   */
  private registerAudioServices(): void {
    // SoundManager（シングルトン）
    this.container.registerSingleton(ServiceKeys.SOUND_MANAGER, () => {
      return new SoundManager()
    })
  }

  /**
   * パフォーマンスサービスを登録
   */
  private registerPerformanceServices(): void {
    // PerformanceMonitor（シングルトン）
    this.container.registerSingleton(ServiceKeys.PERFORMANCE_MONITOR, () => {
      return new PerformanceMonitor()
    })
  }

  /**
   * サービスコンテナを取得
   * @returns ServiceContainer
   */
  public getContainer(): ServiceContainer {
    return this.container
  }

  /**
   * すべてのサービスを初期化
   * 依存関係に従って適切な順序で初期化
   */
  public async initializeServices(): Promise<void> {
    try {
      // 設定とサウンドを最初に初期化
      this.container.resolve<SettingsManager>(ServiceKeys.SETTINGS_MANAGER)
      this.container.resolve<SoundManager>(ServiceKeys.SOUND_MANAGER)
      
      // パフォーマンス監視を開始
      this.container.resolve<PerformanceMonitor>(ServiceKeys.PERFORMANCE_MONITOR)
      
      // ゲームロジックを初期化
      this.container.resolve<GameLogic>(ServiceKeys.GAME_LOGIC)
      
      // レンダラーを初期化（非同期）
      const gameRenderer = this.container.resolve<GameRendererRefactored>(ServiceKeys.GAME_RENDERER)
      await gameRenderer.waitForReady()
      
      // 統計管理を初期化
      this.container.resolve<StatsManager>(ServiceKeys.STATS_MANAGER)
      
      console.log('✅ All services initialized successfully')
      
    } catch (error) {
      console.error('❌ Service initialization failed:', error)
      throw new Error(`Service initialization failed: ${error}`)
    }
  }

  /**
   * サービスの健全性をチェック
   * @returns チェック結果
   */
  public healthCheck(): { healthy: boolean, issues: string[] } {
    const issues: string[] = []
    
    try {
      // 各サービスの基本的な健全性をチェック
      const gameLogic = this.container.resolve<GameLogic>(ServiceKeys.GAME_LOGIC)
      if (!gameLogic.getConfig()) {
        issues.push('GameLogic configuration is invalid')
      }
      
      const gameRenderer = this.container.resolve<GameRendererRefactored>(ServiceKeys.GAME_RENDERER)
      if (!gameRenderer.isReady()) {
        issues.push('GameRenderer is not ready')
      }
      
      const settingsManager = this.container.resolve<SettingsManager>(ServiceKeys.SETTINGS_MANAGER)
      if (!settingsManager.getSettings()) {
        issues.push('SettingsManager has no settings')
      }
      
    } catch (error) {
      issues.push(`Service resolution failed: ${error}`)
    }
    
    return {
      healthy: issues.length === 0,
      issues
    }
  }

  /**
   * すべてのサービスを破棄
   */
  public destroy(): void {
    try {
      // 各サービスの破棄処理を実行
      const gameRenderer = this.container.resolve<GameRendererRefactored>(ServiceKeys.GAME_RENDERER)
      gameRenderer.destroy()
      
      // パフォーマンス監視を停止
      // performanceMonitor.destroy() // PerformanceMonitorにdestroyメソッドがない場合はコメントアウト
      
    } catch (error) {
      console.warn('Some services could not be properly destroyed:', error)
    } finally {
      this.container.clear()
    }
  }
}