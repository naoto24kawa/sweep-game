import { GridEventHandler } from '@/renderer/GridEventHandler'

/**
 * モーダル表示時のイベント制御を専門に管理するクラス
 * 単一責任: モーダル表示状態とグリッドイベントの協調制御
 */
export class ModalEventController {
  private gridEventHandler: GridEventHandler | null = null
  
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
   * より長い遅延で統計モーダル処理の完了を確実に待つ
   */
  public onStatsModalHide(): void {
    if (this.gridEventHandler) {
      setTimeout(() => {
        this.gridEventHandler!.setModalActive(false)
      }, 300)
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
}