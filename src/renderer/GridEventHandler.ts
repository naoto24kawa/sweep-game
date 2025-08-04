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
    console.log(`🔧 GridEventHandler: Initialized with modalActive=${initialModalActive}`)
  }

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
    console.log('⬇️ PIXI PointerDown event received:', {
      button: event.button,
      type: event.type,
      isModalActive: this.isModalActive
    })
    
    // 右クリック（button=2）をここで処理
    if (event.button === 2) {
      console.log('🖱️ Right click detected via pointerdown')
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
    console.log('⬆️ PIXI PointerUp event received:', {
      button: event.button,
      type: event.type,
      isModalActive: this.isModalActive
    })
    
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
      type: event.type,
      rightClickProcessed: this.rightClickProcessed
    })
    
    // 重複処理をチェック
    if (this.rightClickProcessed && event.type !== 'pointerdown') {
      console.log('🚫 Right click blocked - already processed')
      return
    }
    
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
    if (!event.target) {
      console.warn('⚠️ Event target is undefined')
      return null
    }
    
    // gameLogicが存在することを確認
    if (!this.gameLogic) {
      console.warn('⚠️ GameLogic is undefined')
      return null
    }
    
    const cellContainer = this.findCellContainer(event.target as PIXI.Container)
    if (!cellContainer?.label) {
      console.warn('⚠️ Cell container or label is undefined')
      return null
    }

    const coordinates = this.parseCellCoordinates(cellContainer.label)
    console.log('🔍 Parsed coordinates:', { label: cellContainer.label, coordinates })
    
    const cells = this.gameLogic.getCells()
    
    // cells配列が存在することを確認
    if (!cells || !Array.isArray(cells)) {
      console.warn('⚠️ Cells array is undefined or not an array:', cells)
      return null
    }
    
    console.log('🔍 Cells array info:', { 
      cellsLength: cells.length, 
      firstRowLength: cells[0]?.length,
      coordinates,
      cellContainer: cellContainer.label 
    })
    
    // セル配列の境界チェック
    if (coordinates.y < 0 || coordinates.y >= cells.length || 
        coordinates.x < 0 || !cells[coordinates.y] || coordinates.x >= cells[coordinates.y].length) {
      console.warn('⚠️ Cell coordinates out of bounds:', { 
        coordinates, 
        cellsLength: cells.length,
        rowLength: cells[coordinates.y]?.length,
        label: cellContainer.label
      })
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
        console.log('🔍 Found cell container:', { label: current.label, level: i })
        return current
      }
      
      if (!current?.parent) break
      current = current.parent as PIXI.Container
    }
    
    console.warn('⚠️ Could not find cell container for target:', {
      targetLabel: target.label,
      targetType: target.constructor.name,
      parentLabel: target.parent?.label,
      parentType: target.parent?.constructor.name
    })
    
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
      console.warn('⚠️ Invalid cell label format:', label)
      return { x: -1, y: -1 } // 無効な座標を返す
    }
    
    const x = parseInt(parts[0], 10)
    const y = parseInt(parts[1], 10)
    
    if (isNaN(x) || isNaN(y)) {
      console.warn('⚠️ Invalid cell coordinates in label:', { label, x, y })
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
    console.log(`🔄 Modal state changed: ${this.isModalActive} → ${isActive}`)
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
    console.log('🚫 Temporarily disabling grid events for level change')
    this.isTemporarilyDisabled = true
    // 500ms後に再有効化
    setTimeout(() => {
      this.isTemporarilyDisabled = false
      console.log('✅ Grid events re-enabled after level change')
    }, 500)
  }
}