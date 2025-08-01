import { LevelSelector } from '@/ui/LevelSelector'
import { StatsModal } from '@/ui/StatsModal'
import { AchievementButton } from '@/ui/AchievementButton'
import { AchievementModal } from '@/ui/AchievementModal'
import { ModalEventController } from '@/ui/ModalEventController'

/**
 * UIモーダル表示の統合管理を行う専用クラス
 * 単一責任: UI表示状態のコーディネーション（イベント制御は分離）
 */
export class GameUICoordinator {
  private levelSelector: LevelSelector
  private statsModal: StatsModal
  private achievementButton: AchievementButton | null = null
  private achievementModal: AchievementModal | null = null
  private modalEventController = new ModalEventController()
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
  public setGridEventHandler(gridEventHandler: any): void {
    this.modalEventController.setGridEventHandler(gridEventHandler)
  }

  /**
   * レベル選択画面を表示
   */
  public showLevelSelector(): void {
    if (this.levelSelector && this.isInitialized) {
      this.modalEventController.onModalShow()
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
      this.modalEventController.onModalShow()
      this.statsModal.show()
    } else {
      console.warn('GameUICoordinator: Cannot show stats modal - not initialized')
    }
  }

  /**
   * レベル選択画面を非表示
   */
  public hideLevelSelector(): void {
    this.modalEventController.onLevelSelectorHide()
  }

  /**
   * 統計モーダルを非表示
   */
  public hideStatsModal(): void {
    this.modalEventController.onStatsModalHide()
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
      this.modalEventController.onModalShow()
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