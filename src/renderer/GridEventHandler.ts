import * as PIXI from 'pixi.js'
import { GameLogic } from '@/game/GameLogic'
import { CellState, RENDER_CONSTANTS, CellClickInfo, ActionResult } from '@/types'
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

  constructor(
    private gameLogic: GameLogic,
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
    console.log('🔧 Setting up event handlers on grid container:', {
      children: gridContainer.children.length,
      eventMode: gridContainer.eventMode,
      interactive: gridContainer.interactive,
      visible: gridContainer.visible
    })
    
    // グリッドの実際の位置を記録
    this.updateGridOffset(gridContainer)
    
    this.setupContainerEventMode(gridContainer)
    this.registerClickHandlers(gridContainer)
    this.registerHoverHandlers(gridContainer)
    this.registerContextMenuHandlers(gridContainer)
    
    console.log('✅ Event handlers setup complete. Container state:', {
      eventMode: gridContainer.eventMode,
      interactive: gridContainer.interactive,
      listenerCount: gridContainer.listenerCount('pointerdown')
    })
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
   * @param gridContainer PIXIグリッドコンテナ
   */
  private registerContextMenuHandlers(gridContainer: PIXI.Container): void {
    gridContainer.on('rightclick', this.handleRightClick.bind(this))
  }

  /**
   * ポインターダウンイベントを処理
   * @param _event PIXIポインターイベント
   */
  private handlePointerDown(_event: PIXI.FederatedPointerEvent): void {
    console.log('⬇️ PIXI PointerDown event received:', {
      button: _event.button,
      type: _event.type,
      isModalActive: this.isModalActive
    })
  }

  /**
   * ポインターアップイベントを処理（左クリック - セル開放）
   * @param event PIXIポインターイベント
   */
  private handlePointerUp(event: PIXI.FederatedPointerEvent): void {
    console.log('⬆️ PIXI PointerUp event received:', {
      button: event.button,
      type: event.type,
      isModalActive: this.isModalActive
    })
    this.handleLeftClick(event)
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
    console.log('👆 Left click processing:', {
      isModalActive: this.isModalActive,
      isTemporarilyDisabled: this.isTemporarilyDisabled,
      button: event.button,
      type: event.type
    })
    
    if (this.isModalActive) {
      console.log('🚫 Left click blocked - modal is active')
      return
    }
    
    if (this.isTemporarilyDisabled) {
      console.log('🚫 Left click blocked - temporarily disabled for level change')
      return
    }
    
    const cellInfo = this.extractCellInfoFromEvent(event)
    console.log('🎯 Cell info extracted:', cellInfo ? `${cellInfo.coordinates.x},${cellInfo.coordinates.y}` : 'null')
    
    if (!cellInfo) return
    
    const actionResult = this.processUserAction(0, cellInfo) // 左クリック
    console.log('🎮 Action result:', actionResult)
    
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
    console.log('🖱️ Right click detected', {
      isModalActive: this.isModalActive,
      isTemporarilyDisabled: this.isTemporarilyDisabled,
      button: event.button,
      type: event.type
    })
    
    event.preventDefault()
    
    if (this.isModalActive) {
      console.log('🚫 Right click blocked - modal is active')
      return
    }
    
    if (this.isTemporarilyDisabled) {
      console.log('🚫 Right click blocked - temporarily disabled for level change')
      return
    }
    
    const cellInfo = this.extractCellInfoFromEvent(event)
    console.log('🎯 Cell info extracted:', cellInfo ? `${cellInfo.coordinates.x},${cellInfo.coordinates.y}` : 'null')
    
    if (!cellInfo) return
    
    const actionResult = this.processUserAction(2, cellInfo) // 右クリック
    console.log('🎮 Action result:', actionResult)
    
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
    console.log(`🔄 Modal state changed: ${this.isModalActive} → ${isActive}`)
    this.isModalActive = isActive
  }

  /**
   * レベル変更時に一時的にグリッドイベントを無効化
   * pointerupイベントのクリックスルーを防ぐ
   */
  public temporarilyDisableEvents(): void {
    console.log('🚫 Temporarily disabling grid events for level change')
    this.isTemporarilyDisabled = true
    // 500ms後に再有効化
    setTimeout(() => {
      this.isTemporarilyDisabled = false
      console.log('✅ Grid events re-enabled after level change')
    }, 500)
  }
}