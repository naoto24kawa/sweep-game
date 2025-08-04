import { LevelSelector } from '@/ui/LevelSelector'
import { StatsModal } from '@/ui/StatsModal'
import { AchievementButton } from '@/ui/AchievementButton'
import { AchievementModal } from '@/ui/AchievementModal'
import { ModalEventController } from '@/ui/ModalEventController'
import { Logger } from '@/core/Logger'

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
   * StatsModalのGameLogicインスタンスを更新
   */
  public updateStatsModalGameLogic(newGameLogic: any): void {
    this.statsModal.updateGameLogic(newGameLogic)
    Logger.debug('GameUICoordinator: StatsModal GameLogic updated')
  }

  /**
   * レベル選択画面を表示
   */
  public showLevelSelector(): void {
    if (this.levelSelector && this.isInitialized) {
      // statsModalが表示中なら先に非表示にする
      if (this.statsModal.isShowing()) {
        this.statsModal.hide()
      }
      
      // モーダル表示のイベント処理を実行（保留中の非表示処理をキャンセル）
      this.modalEventController.onModalShow()
      
      // 少し遅延してレベル選択画面を表示（競合状態を回避）
      setTimeout(() => {
        this.levelSelector.show()
      }, 50)
    } else {
      Logger.warn('GameUICoordinator: Cannot show level selector - not initialized')
    }
  }
  
  /**
   * 統計モーダルを表示
   */
  public showStatsModal(): void {
    Logger.debug('GameUICoordinator: showStatsModal called', {
      hasStatsModal: !!this.statsModal,
      isInitialized: this.isInitialized
    })
    
    if (this.statsModal && this.isInitialized) {
      Logger.debug('GameUICoordinator: Showing stats modal')
      this.modalEventController.onModalShow()
      this.statsModal.show()
    } else {
      Logger.warn('GameUICoordinator: Cannot show stats modal - not initialized')
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
      Logger.warn('GameUICoordinator: Cannot show achievement modal - not initialized')
    }
  }
  
  /**
   * 全てのモーダルを非表示にする
   */
  public hideAllModals(): void {
    // 将来的に複数のモーダルがある場合の拡張ポイント
  }
  
  /**
   * モーダル状態をリセット（リスタート時に使用）
   */
  public resetModalState(): void {
    Logger.debug('GameUICoordinator: resetModalState called')
    this.modalEventController.restartModalState()
  }

  /**
   * レベル変更開始時にモーダル状態をリセット（遅延なし）
   */
  public resetModalStateForLevelChange(): void {
    this.modalEventController.resetModalState()
  }
  
  /**
   * レベル変更後にグリッドイベントを有効化
   */
  public enableGridAfterLevelChange(): void {
    this.modalEventController.enableGridAfterLevelChange()
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