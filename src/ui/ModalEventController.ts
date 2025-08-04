import { GridEventHandler } from '@/renderer/GridEventHandler'
import { Logger } from '@/core/Logger'
import { UI_CONSTANTS } from '@/constants/ui'

/**
 * モーダル表示時のイベント制御を専門に管理するクラス
 * 単一責任: モーダル表示状態とグリッドイベントの協調制御
 */
export class ModalEventController {
  private gridEventHandler: GridEventHandler | null = null
  private pendingHideTimeout: NodeJS.Timeout | null = null
  
  /**
   * GridEventHandlerを設定
   */
  public setGridEventHandler(gridEventHandler: GridEventHandler): void {
    this.gridEventHandler = gridEventHandler
    // 初期状態でモーダルは非アクティブに設定
    this.gridEventHandler.setModalActive(false)
  }
  
  /**
   * モーダル表示開始時の処理
   */
  public onModalShow(): void {
    // 保留中の非表示処理をキャンセル
    if (this.pendingHideTimeout) {
      clearTimeout(this.pendingHideTimeout)
      this.pendingHideTimeout = null
    }
    
    if (this.gridEventHandler) {
      this.gridEventHandler.setModalActive(true)
    }
  }
  
  /**
   * レベル選択モーダル非表示時の処理
   * レベル変更時は即座にモーダルを非アクティブにしてクリックスルーを防ぐ
   */
  public onLevelSelectorHide(): void {
    if (this.gridEventHandler) {
      this.gridEventHandler.setModalActive(false)
      // さらに一時的にグリッドイベントを無効化してpointerupイベントもブロック
      this.gridEventHandler.temporarilyDisableEvents()
    }
  }
  
  /**
   * 統計モーダル非表示時の処理
   * より短い遅延で統計モーダル処理の完了を確実に待つ
   */
  public onStatsModalHide(): void {
    if (this.gridEventHandler) {
      // 保留中の処理があればキャンセル
      if (this.pendingHideTimeout) {
        clearTimeout(this.pendingHideTimeout)
      }
      
      this.pendingHideTimeout = setTimeout(() => {
        if (this.gridEventHandler) {
          this.gridEventHandler.setModalActive(false)
        }
        this.pendingHideTimeout = null
      }, UI_CONSTANTS.TIMING.DELAYS.STATS_MODAL_HIDE)
    }
  }
  
  /**
   * 汎用モーダル非表示時の処理
   */
  public onModalHide(): void {
    if (this.gridEventHandler) {
      this.gridEventHandler.setModalActive(false)  
    }
  }
  
  /**
   * ゲームリスタート時にモーダル状態をリセット
   */
  /**
   * ゲームリスタート時にモーダル状態をリセット
   */
  public resetModalState(): void {
    // 保留中の非表示処理をキャンセル
    if (this.pendingHideTimeout) {
      clearTimeout(this.pendingHideTimeout)
      this.pendingHideTimeout = null
    }
    
    // レベル変更時はグリッドを無効化したまま
    // 後でenableGridAfterLevelChange()で明示的に有効化される
    if (this.gridEventHandler) {
      this.gridEventHandler.setModalActive(true)
    }
  }
  
  /**
   * ゲームリスタート時にモーダル状態をリセット（遅延付き）
   */
  public restartModalState(): void {
    // 保留中の非表示処理をキャンセル
    if (this.pendingHideTimeout) {
      clearTimeout(this.pendingHideTimeout)
      this.pendingHideTimeout = null
    }
    
    // 一時的にモーダルをアクティブのままにしてクリック貫通を防ぐ
    if (this.gridEventHandler) {
      this.gridEventHandler.setModalActive(true)
      
      // 200ms後にグリッドイベントを有効化（リスタート処理完了を待つ）
      setTimeout(() => {
        if (this.gridEventHandler) {
          this.gridEventHandler.setModalActive(false)
        }
      }, UI_CONSTANTS.TIMING.DELAYS.RESTART_MODAL_RESET)
    }
  }
  
  /**
   * レベル変更後にグリッドイベントを有効化
   */
  /**
   * レベル変更後にグリッドイベントを有効化
   */
  public enableGridAfterLevelChange(): void {
    Logger.ui('ModalEventController: Enabling grid after level change')
    
    // 保留中の非表示処理をキャンセル
    if (this.pendingHideTimeout) {
      clearTimeout(this.pendingHideTimeout)
      this.pendingHideTimeout = null
      Logger.ui('ModalEventController: Cancelled pending hide timeout')
    }
    
    // グリッドイベントを有効化
    if (this.gridEventHandler) {
      Logger.ui('ModalEventController: Setting grid modal active to false')
      this.gridEventHandler.setModalActive(false)
      
      // レベル変更直後の状態を確認
      setTimeout(() => {
        if (this.gridEventHandler) {
          const modalState = this.gridEventHandler.getModalActive()
          Logger.ui(`ModalEventController: Final grid modal state: ${modalState}`)
        }
      }, UI_CONSTANTS.TIMING.DELAYS.MODAL_SHOW)
    } else {
      Logger.warn('ModalEventController: No grid event handler available for enabling')
    }
  }
}