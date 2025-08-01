import { GameLogic } from '@/game/GameLogic'
import { GameRenderer } from '@/renderer/GameRenderer'
import { GameUI } from '@/ui/GameUI'
import { GameStateWatcher } from '@/game/GameStateWatcher'
import { SoundManager } from '@/audio/SoundManager'
import { DOMHandler } from '@/ui/DOMHandler'
import { GameUICoordinator } from '@/ui/GameUICoordinator'
import { GameBootstrapper } from '@/core/GameBootstrapper'
import { Difficulty } from '@/types'

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
    console.log('GameLifecycleManager: Restarting game')
    this.gameLogic.reset()
    this.renderer.updateDisplay()
  }
  
  /**
   * 難易度を変更してゲームを再初期化
   */
  public async changeDifficulty(difficulty: Difficulty): Promise<void> {
    if (difficulty === this.currentDifficulty) {
      console.log('GameLifecycleManager: Same difficulty selected, ignoring')
      return
    }
    
    console.log(`GameLifecycleManager: Changing difficulty from ${this.currentDifficulty} to ${difficulty}`)
    
    try {
      // 現在のゲーム状態をクリーンアップ
      await this.cleanup()
      
      // 新しい難易度でゲームを再構築
      this.currentDifficulty = difficulty
      await this.reinitializeWithDifficulty(difficulty)
      
      console.log('GameLifecycleManager: Difficulty change completed')
      
    } catch (error) {
      console.error('GameLifecycleManager: Failed to change difficulty:', error)
      throw new Error(`難易度変更に失敗しました: ${error}`)
    }
  }
  
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
    console.log('GameLifecycleManager: Destroying game')
    
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
      
      console.log('GameLifecycleManager: Destruction completed')
      
    } catch (error) {
      console.error('GameLifecycleManager: Error during destruction:', error)
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
      this.gameLogic = components.gameLogic
      this.renderer = components.renderer
      this.gameUI = components.gameUI
      this.gameStateWatcher = components.gameStateWatcher
      this.soundManager = components.soundManager
      this.domHandler = components.domHandler
      this.uiCoordinator = new GameUICoordinator(components.levelSelector, components.statsModal)
      this.uiCoordinator.setAchievementButton(components.achievementButton)
      this.uiCoordinator.setAchievementModal(components.achievementModal)
      this.uiCoordinator.markAsInitialized()
      
      // コールバック関数が設定されていれば、新しいコンポーネントで再設定
      if (this.onReinitializeCallback) {
        this.onReinitializeCallback(components)
      }
      
      console.log(`GameLifecycleManager: Successfully reinitialized with ${difficulty} difficulty`)
      
    } catch (error) {
      console.error('GameLifecycleManager: Failed to reinitialize with difficulty:', error)
      throw error
    }
  }
}