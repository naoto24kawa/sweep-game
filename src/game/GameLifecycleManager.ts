import { GameLogic } from '@/game/GameLogic'
import { GameRenderer } from '@/renderer/GameRenderer'
import { GameUI } from '@/ui/GameUI'
import { GameStateWatcher } from '@/game/GameStateWatcher'
import { SoundManager } from '@/audio/SoundManager'
import { DOMHandler } from '@/ui/DOMHandler'
import { GameUICoordinator } from '@/ui/GameUICoordinator'
import { Difficulty, DIFFICULTY_CONFIGS } from '@/types'

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
  
  constructor(
    gameLogic: GameLogic,
    renderer: GameRenderer,
    gameUI: GameUI,
    gameStateWatcher: GameStateWatcher,
    soundManager: SoundManager,
    domHandler: DOMHandler,
    uiCoordinator: GameUICoordinator,
    initialDifficulty: Difficulty
  ) {
    this.gameLogic = gameLogic
    this.renderer = renderer
    this.gameUI = gameUI
    this.gameStateWatcher = gameStateWatcher
    this.soundManager = soundManager
    this.domHandler = domHandler
    this.uiCoordinator = uiCoordinator
    this.currentDifficulty = initialDifficulty
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
   * 注意: この実装は簡略化されており、実際にはGameBootstrapperを使用するべき
   */
  private async reinitializeWithDifficulty(difficulty: Difficulty): Promise<void> {
    const config = DIFFICULTY_CONFIGS[difficulty]
    
    // 新しいゲームロジックとレンダラーを作成
    this.gameLogic = new GameLogic(config)
    this.renderer = new GameRenderer(this.gameLogic, this.soundManager)
    
    // レンダラーの準備
    await this.renderer.waitForReady()
    const canvas = this.renderer.getCanvas()
    this.domHandler.setupCanvas(canvas)
    
    // UIの再作成（簡略化 - 実際にはより完全な初期化が必要）
    // Note: このメソッドは今後GameBootstrapperを使用するように改善される予定
    
    this.renderer.setupEventHandlers()
  }
}