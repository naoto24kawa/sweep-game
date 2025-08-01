import { LevelSelector } from '@/ui/LevelSelector'
import { StatsModal } from '@/ui/StatsModal'
import { AchievementButton } from '@/ui/AchievementButton'
import { AchievementModal } from '@/ui/AchievementModal'
import { GridEventHandler } from '@/renderer/GridEventHandler'

/**
 * UIモーダル表示の統合管理を行う専用クラス
 * 単一責任: UI表示状態のコーディネーション
 */
export class GameUICoordinator {
  private levelSelector: LevelSelector
  private statsModal: StatsModal
  private achievementButton: AchievementButton | null = null
  private achievementModal: AchievementModal | null = null
  private gridEventHandler: GridEventHandler | null = null
  private isInitialized: boolean = false
  
  constructor(levelSelector: LevelSelector, statsModal: StatsModal) {
    this.levelSelector = levelSelector
    this.statsModal = statsModal
  }
  
  /**
   * UIコーディネーターを使用可能状態にする
   */
  public markAsInitialized(): void {
    this.isInitialized = true
  }
  
  /**
   * GridEventHandlerを設定
   */
  public setGridEventHandler(gridEventHandler: GridEventHandler): void {
    console.log('🔗 Setting GridEventHandler in GameUICoordinator')
    this.gridEventHandler = gridEventHandler
    // 初期状態でモーダルは非アクティブに設定
    this.gridEventHandler.setModalActive(false)
  }

  /**
   * レベル選択画面を表示
   */
  public showLevelSelector(): void {
    if (this.levelSelector && this.isInitialized) {
      if (this.gridEventHandler) {
        this.gridEventHandler.setModalActive(true)
      }
      this.levelSelector.show()
    } else {
      console.warn('GameUICoordinator: Cannot show level selector - not initialized')
    }
  }
  
  /**
   * 統計モーダルを表示
   */
  public showStatsModal(): void {
    if (this.statsModal && this.isInitialized) {
      if (this.gridEventHandler) {
        this.gridEventHandler.setModalActive(true)
      }
      this.statsModal.show()
    } else {
      console.warn('GameUICoordinator: Cannot show stats modal - not initialized')
    }
  }

  /**
   * レベル選択画面を非表示
   */
  public hideLevelSelector(): void {
    if (this.gridEventHandler) {
      // レベル変更時は即座にモーダルを非アクティブにしてクリックスルーを防ぐ
      console.log('⚡ Immediate modal deactivation for level selector')
      this.gridEventHandler.setModalActive(false)
      // さらに一時的にグリッドイベントを無効化してpointerupイベントもブロック
      this.gridEventHandler.temporarilyDisableEvents()
    }
  }

  /**
   * 統計モーダルを非表示
   */
  public hideStatsModal(): void {
    if (this.gridEventHandler) {
      // より長い遅延で統計モーダル処理の完了を確実に待つ
      setTimeout(() => {
        console.log('🕐 Delayed modal deactivation for stats modal (300ms)')
        this.gridEventHandler!.setModalActive(false)
      }, 300)
    }
  }

  /**
   * Achievement表示ボタンを設定
   */
  public setAchievementButton(achievementButton: AchievementButton): void {
    this.achievementButton = achievementButton
  }

  /**
   * AchievementModalを設定
   */
  public setAchievementModal(achievementModal: AchievementModal): void {
    this.achievementModal = achievementModal
  }

  /**
   * Achievement一覧を表示
   */
  public showAchievements(): void {
    if (this.achievementModal && this.isInitialized) {
      this.achievementModal.show()
    } else {
      console.warn('GameUICoordinator: Cannot show achievement modal - not initialized')
    }
  }
  
  /**
   * 全てのモーダルを非表示にする
   */
  public hideAllModals(): void {
    // 将来的に複数のモーダルがある場合の拡張ポイント
  }
  
  /**
   * UIコンポーネントの破棄
   */
  public destroy(): void {
    if (this.levelSelector) {
      this.levelSelector.destroy()
    }
    if (this.statsModal) {
      this.statsModal.destroy()
    }
    if (this.achievementButton) {
      this.achievementButton.destroy()
    }
    if (this.achievementModal) {
      this.achievementModal.destroy()
    }
    this.isInitialized = false
  }
}