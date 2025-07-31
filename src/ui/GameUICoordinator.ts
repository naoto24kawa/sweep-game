import { LevelSelector } from '@/ui/LevelSelector'
import { StatsModal } from '@/ui/StatsModal'

/**
 * UIモーダル表示の統合管理を行う専用クラス
 * 単一責任: UI表示状態のコーディネーション
 */
export class GameUICoordinator {
  private levelSelector: LevelSelector
  private statsModal: StatsModal
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
   * レベル選択画面を表示
   */
  public showLevelSelector(): void {
    if (this.levelSelector && this.isInitialized) {
      console.log('GameUICoordinator: Showing level selector')
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
      console.log('GameUICoordinator: Showing stats modal')
      this.statsModal.show()
    } else {
      console.warn('GameUICoordinator: Cannot show stats modal - not initialized')
    }
  }
  
  /**
   * 全てのモーダルを非表示にする
   */
  public hideAllModals(): void {
    // 将来的に複数のモーダルがある場合の拡張ポイント
    console.log('GameUICoordinator: Hiding all modals')
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
    this.isInitialized = false
  }
}