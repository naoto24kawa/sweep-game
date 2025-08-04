import * as PIXI from 'pixi.js'
import { GameLogic } from '@/game/GameLogic'
import { RENDER_CONSTANTS, CellClickInfo, ActionResult } from '@/types'
import { EffectManager } from '@/effects/EffectManager'
import { SoundManager, SoundType } from '@/audio/SoundManager'

/**
 * ゲーム入力イベント処理専用クラス
 * グリッドでのマウス・タッチイベントを管理
 */
export class GridEventHandler {
  private readonly cellSize = RENDER_CONSTANTS.CELL.SIZE
  private readonly cellSpacing = RENDER_CONSTANTS.CELL.SPACING
  private isModalActive = false
  private isTemporarilyDisabled = false
  private rightClickProcessed = false // 右クリックの重複処理防止

  constructor(
    private gameLogic: GameLogic,
    private effectManager: EffectManager,
    private soundManager: SoundManager | null,
    private onDisplayUpdate: () => void,
    initialModalActive: boolean = false
  ) {
    this.isModalActive = initialModalActive

  }

  private gridOffset = { x: 0, y: 0 }  // グリッドコンテナのオフセット

  /**
   * グリッドコンテナにイベントハンドラーを設定
   * @param gridContainer PIXIグリッドコンテナ
   */
  public setupEventHandlers(gridContainer: PIXI.Container): void {

    
    // グリッドの実際の位置を記録
    this.updateGridOffset(gridContainer)
    
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
    gridContainer.cursor = 'default' // カーソル設定を明示的に指定
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
   * @param _gridContainer PIXIグリッドコンテナ（未使用）
   */
  private registerContextMenuHandlers(_gridContainer: PIXI.Container): void {
    // 右クリックはpointerdownで処理するため、rightclickハンドラーは無効化
    // _gridContainer.on('rightclick', this.handleRightClick.bind(this))
  }

  /**
   * ポインターダウンイベントを処理
   * @param event PIXIポインターイベント
   */
  private handlePointerDown(event: PIXI.FederatedPointerEvent): void {

    
    // 右クリック（button=2）をここで処理
    if (event.button === 2) {

      this.rightClickProcessed = true // フラグを設定
      this.handleRightClick(event)
      
      // 少し遅延してフラグをリセット
      setTimeout(() => {
        this.rightClickProcessed = false
      }, 50)
    }
  }

  /**
   * ポインターアップイベントを処理（左クリック - セル開放）
   * @param event PIXIポインターイベント
   */
  private handlePointerUp(event: PIXI.FederatedPointerEvent): void {

    
    // 左クリック（button=0）のみ処理
    if (event.button === 0) {
      this.handleLeftClick(event)
    }
  }

  /**
   * ポインターキャンセルイベントを処理
   * @param _event PIXIポインターイベント
   */
  private handlePointerCancel(_event: PIXI.FederatedPointerEvent): void {
    // シンプル化のため特別な処理は不要
  }

  /**
   * 左クリック処理（セル開放）
   * @param event PIXIポインターイベント
   */
  private handleLeftClick(event: PIXI.FederatedPointerEvent): void {

    
    if (this.isModalActive) {

      return
    }
    
    if (this.isTemporarilyDisabled) {

      return
    }
    
    const cellInfo = this.extractCellInfoFromEvent(event)

    
    if (!cellInfo) return
    
    const actionResult = this.processUserAction(0, cellInfo) // 左クリック

    
    if (actionResult.shouldPlayEffect) {
      this.playInteractionEffects(actionResult, cellInfo)
    }
    this.onDisplayUpdate()
  }

  /**
   * 右クリック処理（フラッグ切り替え）
   * @param event PIXIポインターイベント
   */
  private handleRightClick(event: PIXI.FederatedPointerEvent): void {

    
    // 重複処理をチェック
    if (this.rightClickProcessed && event.type !== 'pointerdown') {

      return
    }
    
    event.preventDefault()
    
    if (this.isModalActive) {

      return
    }
    
    if (this.isTemporarilyDisabled) {

      return
    }
    
    const cellInfo = this.extractCellInfoFromEvent(event)

    
    if (!cellInfo) return
    
    const actionResult = this.processUserAction(2, cellInfo) // 右クリック

    
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
    if (!event.target) {

      return null
    }
    
    // gameLogicが存在することを確認
    if (!this.gameLogic) {

      return null
    }
    
    const cellContainer = this.findCellContainer(event.target as PIXI.Container)
    if (!cellContainer?.label) {

      return null
    }

    const coordinates = this.parseCellCoordinates(cellContainer.label)

    
    const cells = this.gameLogic.getCells()
    
    // cells配列が存在することを確認
    if (!cells || !Array.isArray(cells)) {

      return null
    }
    

    
    // セル配列の境界チェック
    if (coordinates.y < 0 || coordinates.y >= cells.length || 
        coordinates.x < 0 || !cells[coordinates.y] || coordinates.x >= cells[coordinates.y].length) {

      return null
    }
    
    const cell = cells[coordinates.y][coordinates.x]
    
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
    let current = target
    
    // 最大3階層まで親を遡ってセルコンテナを探す
    for (let i = 0; i < 3; i++) {
      if (current?.label && typeof current.label === 'string' && current.label.includes('-')) {

        return current
      }
      
      if (!current?.parent) break
      current = current.parent as PIXI.Container
    }
    

    
    return null
  }

  /**
   * セル座標を解析
   * @param label セルラベル（例: "3-5"）
   * @returns 座標オブジェクト
   */
  private parseCellCoordinates(label: string): { x: number; y: number } {
    const parts = label.split('-')
    if (parts.length !== 2) {

      return { x: -1, y: -1 } // 無効な座標を返す
    }
    
    const x = parseInt(parts[0], 10)
    const y = parseInt(parts[1], 10)
    
    if (isNaN(x) || isNaN(y)) {

      return { x: -1, y: -1 } // 無効な座標を返す
    }
    
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
      if (wasToggled) {
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
        if (this.soundManager) this.soundManager.play(SoundType.EXPLOSION)
        break
      case 'reveal':
        this.effectManager.createRevealEffect(worldPosition.x, worldPosition.y, this.cellSize)
        if (this.soundManager) this.soundManager.play(SoundType.REVEAL)
        break
      case 'flag':
        this.effectManager.createFlagEffect(worldPosition.x, worldPosition.y, this.cellSize)
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
  }

  /**
   * モーダル状態を設定
   * @param isActive モーダルがアクティブかどうか
   */
  public setModalActive(isActive: boolean): void {

    this.isModalActive = isActive
  }

  /**
   * 現在のモーダル状態を取得
   * @returns モーダルがアクティブかどうか
   */
  public getModalActive(): boolean {
    return this.isModalActive
  }

  /**
   * レベル変更時に一時的にグリッドイベントを無効化
   * pointerupイベントのクリックスルーを防ぐ
   */
  public temporarilyDisableEvents(): void {

    this.isTemporarilyDisabled = true
    // 500ms後に再有効化
    setTimeout(() => {
      this.isTemporarilyDisabled = false

    }, 500)
  }
}