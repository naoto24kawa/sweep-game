import * as PIXI from 'pixi.js'
import { GameLogic } from '@/game/GameLogic'
import { CellState, RENDER_CONSTANTS, CellClickInfo, ActionResult } from '@/types'
// import { AnimationManager } from '@/animation/AnimationManager'  // 未使用のため削除
import { EffectManager } from '@/effects/EffectManager'
import { SoundManager, SoundType } from '@/audio/SoundManager'

/**
 * ゲーム入力イベント処理専用クラス
 * グリッドでのマウス・タッチイベントを管理
 */
export class GridEventHandler {
  private readonly cellSize = RENDER_CONSTANTS.CELL.SIZE
  private readonly cellSpacing = RENDER_CONSTANTS.CELL.SPACING
  private readonly LONG_PRESS_DURATION = 500 // 長押し判定時間（ミリ秒）
  private readonly DOUBLE_CLICK_DURATION = 300 // ダブルクリック判定時間（ミリ秒）

  private longPressTimer: number | null = null
  private isLongPress = false
  private longPressTarget: CellClickInfo | null = null
  
  private lastClickTime = 0
  private lastClickTarget: CellClickInfo | null = null
  private doubleClickTimer: number | null = null

  constructor(
    private gameLogic: GameLogic,
    // private animationManager: AnimationManager,  // 未使用のため削除
    private effectManager: EffectManager,
    private soundManager: SoundManager | null,
    private onDisplayUpdate: () => void
  ) {}

  private gridOffset = { x: 0, y: 0 }  // グリッドコンテナのオフセット

  /**
   * グリッドコンテナにイベントハンドラーを設定
   * @param gridContainer PIXIグリッドコンテナ
   */
  public setupEventHandlers(gridContainer: PIXI.Container): void {
    // グリッドの実際の位置を記録
    this.updateGridOffset(gridContainer)
    
    console.log('🎯 GridEventHandler: Grid offset recorded:', this.gridOffset)
    
    this.setupContainerEventMode(gridContainer)
    this.registerClickHandlers(gridContainer)
    this.registerHoverHandlers(gridContainer)
    this.registerContextMenuHandlers(gridContainer)
  }

  /**
   * コンテナのイベントモードを設定
   * @param gridContainer PIXIグリッドコンテナ
   */
  private setupContainerEventMode(gridContainer: PIXI.Container): void {
    gridContainer.eventMode = 'static'
  }

  /**
   * クリックハンドラーを登録
   * @param gridContainer PIXIグリッドコンテナ
   */
  private registerClickHandlers(gridContainer: PIXI.Container): void {
    gridContainer.on('pointerdown', this.handlePointerDown.bind(this))
    gridContainer.on('pointerup', this.handlePointerUp.bind(this))
    gridContainer.on('pointercancel', this.handlePointerCancel.bind(this))
  }

  /**
   * ホバーハンドラーを登録
   * @param gridContainer PIXIグリッドコンテナ
   */
  private registerHoverHandlers(gridContainer: PIXI.Container): void {
    gridContainer.on('pointerover', this.handleCellHover.bind(this))
    gridContainer.on('pointerout', this.handleCellOut.bind(this))
  }

  /**
   * 右クリックメニューハンドラーを登録
   * @param gridContainer PIXIグリッドコンテナ
   */
  private registerContextMenuHandlers(gridContainer: PIXI.Container): void {
    gridContainer.on('rightclick', (event: PIXI.FederatedPointerEvent) => {
      event.preventDefault()
    })
  }

  /**
   * ポインターダウンイベントを処理（長押し検出開始）
   * @param event PIXIポインターイベント
   */
  private handlePointerDown(event: PIXI.FederatedPointerEvent): void {
    const cellInfo = this.extractCellInfoFromEvent(event)
    if (!cellInfo) return

    this.isLongPress = false
    this.longPressTarget = cellInfo

    // 長押しタイマーを開始
    this.longPressTimer = window.setTimeout(() => {
      this.isLongPress = true
      this.handleLongPress(cellInfo)
    }, this.LONG_PRESS_DURATION)
  }

  /**
   * ポインターアップイベントを処理
   * 複雑なクリック判定ロジック：長押し、ダブルクリック、通常クリックを区別
   * タイミングベースの状態管理でユーザー意図を正確に判定
   * @param event PIXIポインターイベント
   */
  private handlePointerUp(event: PIXI.FederatedPointerEvent): void {
    this.clearLongPressTimer()

    // 長押しでない場合のみクリック処理を行う
    if (!this.isLongPress && this.longPressTarget) {
      const currentTime = Date.now()
      const cellInfo = this.longPressTarget
      
      // ダブルクリック判定：同じセルを300ms以内に再クリック
      if (this.lastClickTarget && 
          this.lastClickTarget.coordinates.x === cellInfo.coordinates.x &&
          this.lastClickTarget.coordinates.y === cellInfo.coordinates.y &&
          currentTime - this.lastClickTime < this.DOUBLE_CLICK_DURATION) {
        
        // ダブルクリック: フラッグ切り替え（PCでの右クリックの代替）
        this.handleDoubleClick(cellInfo)
        this.clearDoubleClickTimer()
        this.lastClickTarget = null
        this.lastClickTime = 0
      } else {
        // 通常クリック: 遅延実行でダブルクリックを待つ（300msタイマー）
        this.scheduleNormalClick(event, cellInfo)
        this.lastClickTarget = cellInfo
        this.lastClickTime = currentTime
      }
    }

    this.longPressTarget = null
  }

  /**
   * ポインターキャンセルイベントを処理
   * @param _event PIXIポインターイベント
   */
  private handlePointerCancel(_event: PIXI.FederatedPointerEvent): void {
    this.clearLongPressTimer()
    this.clearDoubleClickTimer()
    this.longPressTarget = null
    this.lastClickTarget = null
  }

  /**
   * 長押しタイマーをクリア
   */
  private clearLongPressTimer(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
  }

  /**
   * ダブルクリックタイマーをクリア
   */
  private clearDoubleClickTimer(): void {
    if (this.doubleClickTimer) {
      clearTimeout(this.doubleClickTimer)
      this.doubleClickTimer = null
    }
  }

  /**
   * 通常クリックを遅延実行（ダブルクリック待ち）
   * @param event PIXIポインターイベント
   * @param cellInfo セル情報
   */
  private scheduleNormalClick(event: PIXI.FederatedPointerEvent, cellInfo: CellClickInfo): void {
    this.clearDoubleClickTimer()
    this.doubleClickTimer = window.setTimeout(() => {
      this.handleNormalClick(event, cellInfo)
      this.lastClickTarget = null
      this.lastClickTime = 0
    }, this.DOUBLE_CLICK_DURATION)
  }

  /**
   * ダブルクリック処理（フラッグ切り替え）
   * @param cellInfo セル情報
   */
  private handleDoubleClick(cellInfo: CellClickInfo): void {
    const actionResult = this.processUserAction(2, cellInfo) // 右クリック相当として処理
    if (actionResult.shouldPlayEffect) {
      this.playInteractionEffects(actionResult, cellInfo)
    }
    this.onDisplayUpdate()
  }

  /**
   * 長押し処理（フラッグ切り替え）
   * @param cellInfo セル情報
   */
  private handleLongPress(cellInfo: CellClickInfo): void {
    const actionResult = this.processUserAction(2, cellInfo) // 右クリック相当として処理
    if (actionResult.shouldPlayEffect) {
      this.playInteractionEffects(actionResult, cellInfo)
    }
    this.onDisplayUpdate()
  }

  /**
   * 通常クリック処理（セル開放）
   * @param event PIXIポインターイベント
   * @param cellInfo セル情報
   */
  private handleNormalClick(event: PIXI.FederatedPointerEvent, cellInfo: CellClickInfo): void {
    const actionResult = this.processUserAction(event.button, cellInfo)
    if (actionResult.shouldPlayEffect) {
      this.playInteractionEffects(actionResult, cellInfo)
    }
    this.onDisplayUpdate()
  }

  /**
   * イベントからセル情報を抽出
   * @param event PIXIポインターイベント
   * @returns セルクリック情報またはnull
   */
  private extractCellInfoFromEvent(event: PIXI.FederatedPointerEvent): CellClickInfo | null {
    const cellContainer = this.findCellContainer(event.target as PIXI.Container)
    if (!cellContainer?.label) return null

    const coordinates = this.parseCellCoordinates(cellContainer.label)
    const cell = this.gameLogic.getCells()[coordinates.y][coordinates.x]
    
    return {
      coordinates,
      cell,
      container: cellContainer,
      worldPosition: this.calculateWorldPosition(coordinates)
    }
  }

  /**
   * セルコンテナを検索
   * @param target ターゲットコンテナ
   * @returns セルコンテナまたはnull
   */
  private findCellContainer(target: PIXI.Container): PIXI.Container | null {
    let cellContainer = target
    if (!cellContainer.label && cellContainer.parent) {
      cellContainer = cellContainer.parent as PIXI.Container
    }
    return cellContainer?.label ? cellContainer : null
  }

  /**
   * セル座標を解析
   * @param label セルラベル（例: "3-5"）
   * @returns 座標オブジェクト
   */
  private parseCellCoordinates(label: string): { x: number; y: number } {
    const [x, y] = label.split('-').map(Number)
    return { x, y }
  }

  /**
   * ワールド座標を計算（グリッドオフセットを考慮）
   * @param coordinates セル座標
   * @returns ワールド座標
   */
  private calculateWorldPosition(coordinates: { x: number; y: number }): { x: number; y: number } {
    const localX = coordinates.x * (this.cellSize + this.cellSpacing)
    const localY = coordinates.y * (this.cellSize + this.cellSpacing)
    
    return {
      x: localX + this.gridOffset.x,
      y: localY + this.gridOffset.y
    }
  }

  /**
   * ユーザーアクションを処理
   * @param button マウスボタン（0=左、2=右）
   * @param cellInfo セル情報
   * @returns アクション結果
   */
  private processUserAction(button: number, cellInfo: CellClickInfo): ActionResult {
    const { coordinates, cell } = cellInfo
    
    if (button === 0) {
      const wasRevealed = this.gameLogic.revealCell(coordinates.x, coordinates.y)
      if (wasRevealed) {
        return {
          shouldPlayEffect: true,
          effectType: cell.isMine ? 'explosion' : 'reveal'
        }
      }
    } else if (button === 2) {
      const wasToggled = this.gameLogic.toggleFlag(coordinates.x, coordinates.y)
      if (wasToggled && cell.state === CellState.FLAGGED) {
        return {
          shouldPlayEffect: true,
          effectType: 'flag'
        }
      }
    }
    
    return { shouldPlayEffect: false }
  }

  /**
   * インタラクションエフェクトを再生
   * @param actionResult アクション結果
   * @param cellInfo セル情報
   */
  private playInteractionEffects(actionResult: ActionResult, cellInfo: CellClickInfo): void {
    const { worldPosition } = cellInfo
    
    switch (actionResult.effectType) {
      case 'explosion':
        this.effectManager.createExplosionEffect(worldPosition.x, worldPosition.y, this.cellSize)
        // 震えるアニメーションを無効化
        // this.effectManager.screenShake(RENDER_CONSTANTS.EFFECTS.SHAKE_INTENSITY, RENDER_CONSTANTS.EFFECTS.SHAKE_DURATION)
        if (this.soundManager) this.soundManager.play(SoundType.EXPLOSION)
        break
      case 'reveal':
        this.effectManager.createRevealEffect(worldPosition.x, worldPosition.y, this.cellSize)
        if (this.soundManager) this.soundManager.play(SoundType.REVEAL)
        break
      case 'flag':
        this.effectManager.createFlagEffect(worldPosition.x, worldPosition.y, this.cellSize)
        // bounceアニメーションを無効化（ブロックサイズを変更させない）
        // this.animationManager.bounce(container, RENDER_CONSTANTS.ANIMATION.BOUNCE_DURATION)
        if (this.soundManager) this.soundManager.play(SoundType.FLAG)
        break
    }
  }

  /**
   * セルホバーイベントを処理
   * @param _event PIXIポインターイベント（未使用）
   */
  private handleCellHover(_event: PIXI.FederatedPointerEvent): void {
    // ホバーエフェクトを完全に無効化
    return
  }

  /**
   * セルアウトイベントを処理
   * @param _event PIXIポインターイベント（未使用）
   */
  private handleCellOut(_event: PIXI.FederatedPointerEvent): void {
    // ホバーエフェクトを完全に無効化
    return
  }

  /**
   * グリッドオフセットを更新
   * @param gridContainer PIXIグリッドコンテナ
   */
  public updateGridOffset(gridContainer: PIXI.Container): void {
    this.gridOffset.x = gridContainer.x
    this.gridOffset.y = gridContainer.y
    console.log('🔄 GridEventHandler: Grid offset updated:', this.gridOffset)
  }
}