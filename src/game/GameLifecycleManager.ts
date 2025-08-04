import { GameLogic } from '@/game/GameLogic'
import { GameRenderer } from '@/renderer/GameRenderer'
import { GameUI } from '@/ui/GameUI'
import { GameStateWatcher } from '@/game/GameStateWatcher'
import { SoundManager } from '@/audio/SoundManager'
import { DOMHandler } from '@/ui/DOMHandler'
import { GameUICoordinator } from '@/ui/GameUICoordinator'
import { GameBootstrapper } from '@/core/GameBootstrapper'
import { Difficulty } from '@/types'
import { GameStateFlags } from '@/core/GameStateFlags'
import { Logger } from '@/core/Logger'

/**
 * ゲームのライフサイクル管理を行う専用クラス
 * 単一責任: ゲームの再始動、難易度変更、破棄処理
 */
export class GameLifecycleManager {
  private gameLogic: GameLogic
  private renderer: GameRenderer
  private gameUI: GameUI
  private gameStateWatcher: GameStateWatcher
  private soundManager: SoundManager
  private domHandler: DOMHandler
  private uiCoordinator: GameUICoordinator
  private currentDifficulty: Difficulty
  private container: HTMLElement
  private onReinitializeCallback?: (components: any) => void
  
  constructor(
    gameLogic: GameLogic,
    renderer: GameRenderer,
    gameUI: GameUI,
    gameStateWatcher: GameStateWatcher,
    soundManager: SoundManager,
    domHandler: DOMHandler,
    uiCoordinator: GameUICoordinator,
    initialDifficulty: Difficulty,
    container: HTMLElement,
    onReinitializeCallback?: (components: any) => void
  ) {
    this.gameLogic = gameLogic
    this.renderer = renderer
    this.gameUI = gameUI
    this.gameStateWatcher = gameStateWatcher
    this.soundManager = soundManager
    this.domHandler = domHandler
    this.uiCoordinator = uiCoordinator
    this.currentDifficulty = initialDifficulty
    this.container = container
    this.onReinitializeCallback = onReinitializeCallback
  }
  
  /**
   * ゲームを再開始（リセット）
   */
  public restart(): void {
    Logger.debug('GameLifecycleManager: restart called')
    this.gameLogic.reset()
    this.renderer.updateDisplay()
  }
  
  /**
   * 難易度を変更してゲームを再初期化（アニメーション付き）
   */
  public async changeDifficulty(difficulty: Difficulty): Promise<void> {
    Logger.debug(`GameLifecycleManager: changeDifficulty called with ${difficulty}`)
    

    
    try {
      Logger.debug('GameLifecycleManager: Starting difficulty change process')
      
      // レベル変更状態を設定（新しいGridEventHandlerが無効状態で作成されるように）
      GameStateFlags.getInstance().setLevelChanging(true)
      
      // レベル変更中はグリッドイベントを完全に無効化

      this.uiCoordinator.resetModalStateForLevelChange()
      
      // 1. 現在のグリッドをフェードアウト
      if (this.renderer) {
        await this.renderer.animateLevelChange()
      }
      
      // 2. 現在のゲーム状態をクリーンアップ
      Logger.debug('GameLifecycleManager: Starting cleanup')
      await this.cleanup()
      Logger.debug('GameLifecycleManager: Cleanup completed')
      
      // 3. 新しい難易度でゲームを再構築
      Logger.debug('GameLifecycleManager: Starting reinitializeWithDifficulty')
      this.currentDifficulty = difficulty
      await this.reinitializeWithDifficulty(difficulty)
      Logger.debug('GameLifecycleManager: reinitializeWithDifficulty completed')
      
      // 4. 新しいグリッドをフェードイン
      if (this.renderer) {
        await this.renderer.completeAnimateLevelChange()
      }
      
      // 5. レベル変更完了処理（即座に実行してUIを有効化）
      if (this.uiCoordinator) {
        // 新しいGridEventHandlerを確実に接続
        Logger.debug('GameLifecycleManager: Connecting GridEventHandler to UICoordinator')
        this.uiCoordinator.setGridEventHandler(this.renderer.getEventHandler())
        
        // レベル変更状態をリセットしてからグリッドを有効化
        GameStateFlags.getInstance().setLevelChanging(false)
        this.uiCoordinator.enableGridAfterLevelChange()
        
        Logger.debug('GameLifecycleManager: Level change completed, grid enabled')
      }
      
    } catch (error) {
      // エラー時もレベル変更状態をリセット
      GameStateFlags.getInstance().setLevelChanging(false)
      Logger.error('GameLifecycleManager: Failed to change difficulty', error)
      throw new Error(`難易度変更に失敗しました: ${error}`)
    }
  }
  
  /**
   * リスタート通知を表示
   */

  
  /**
   * 現在の難易度を取得
   */
  public getCurrentDifficulty(): Difficulty {
    return this.currentDifficulty
  }
  
  /**
   * ゲームアプリケーション全体を破棄
   */
  public destroy(): void {

    
    try {
      if (this.gameStateWatcher) {
        this.gameStateWatcher.stopWatching()
      }
      
      this.renderer.destroy()
      this.gameUI.destroy()
      this.uiCoordinator.destroy()
      this.soundManager.destroy()
      
      // パフォーマンス情報表示を削除
      const perfDiv = document.getElementById('performance-info')
      if (perfDiv) {
        perfDiv.remove()
      }
      
      // DOMコンテナをクリア
      this.domHandler.clearContainer()
      

      
    } catch (error) {
      Logger.error('GameLifecycleManager: Error during destruction', error)
    }
  }
  
  /**
   * 現在のゲーム状態をクリーンアップ
   */
  private async cleanup(): Promise<void> {
    if (this.gameStateWatcher) {
      this.gameStateWatcher.stopWatching()
    }
    this.renderer.destroy()
    this.gameUI.destroy()
    this.uiCoordinator.destroy()
    this.domHandler.clearContainer()
  }
  
  /**
   * 指定された難易度でゲームを再初期化
   * GameBootstrapperを使用して完全な再初期化を行う
   */
  private async reinitializeWithDifficulty(difficulty: Difficulty): Promise<void> {
    try {
      // GameBootstrapperを使用して完全なコンポーネントセットを初期化
      const components = await GameBootstrapper.initialize(this.container, difficulty)
      
      // 新しいコンポーネントで自分自身のプロパティを更新
      const oldGameLogic = this.gameLogic
      this.gameLogic = components.gameLogic
      Logger.debug(`GameLifecycleManager: GameLogic updated from ${oldGameLogic ? 'existing' : 'null'} to new instance`)
      
      this.renderer = components.renderer
      this.gameUI = components.gameUI
      this.gameStateWatcher = components.gameStateWatcher
      this.soundManager = components.soundManager
      this.domHandler = components.domHandler
      
      // 新しいUICoordinatorを作成し、即座に新しいGameLogicで初期化
      this.uiCoordinator = new GameUICoordinator(components.levelSelector, components.statsModal)
      this.uiCoordinator.setAchievementButton(components.achievementButton)
      this.uiCoordinator.setAchievementModal(components.achievementModal)
      
      // 新しいStatsModalに新しいGameLogicを確実に設定
      Logger.debug('GameLifecycleManager: Setting new GameLogic to new StatsModal')
      this.uiCoordinator.updateStatsModalGameLogic(this.gameLogic)
      Logger.debug('GameLifecycleManager: StatsModal now has new GameLogic reference')
      
      // レベル変更中なので、GridEventHandlerとの接続前に状態を確認
      const newGridEventHandler = components.renderer.getEventHandler()

      
      this.uiCoordinator.setGridEventHandler(newGridEventHandler)
      // レベル変更中は明示的に無効状態を維持
      this.uiCoordinator.resetModalStateForLevelChange()
      this.uiCoordinator.markAsInitialized()
      
      // 新しいUICoordinatorをcomponentsに追加
      ;(components as any).uiCoordinator = this.uiCoordinator
      
      // コールバック関数が設定されていれば、新しいコンポーネントで再設定
      if (this.onReinitializeCallback) {
        this.onReinitializeCallback(components)
      }
      
      // コールバック設定後bUICoordinatorを確実に初期化
      this.uiCoordinator.markAsInitialized()
      Logger.debug('GameLifecycleManager: GameUICoordinator marked as initialized after callback setup')
      
      // GameStateWatcherが確実にコールバックを持つことを確認
      Logger.debug('GameLifecycleManager: Checking GameStateWatcher callbacks after reinitialize')
      
      Logger.debug('GameLifecycleManager: Reinitialize completed with new components')
      
    } catch (error) {
      Logger.error('GameLifecycleManager: Failed to reinitialize with difficulty', error)
      throw error
    }
  }
}