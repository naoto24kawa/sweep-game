import * as PIXI from 'pixi.js'
import { GameLogic } from '@/game/GameLogic'
import { CellState, RENDER_CONSTANTS, CellClickInfo, ActionResult } from '@/types'
import { AnimationManager } from '@/animation/AnimationManager'
import { EffectManager } from '@/effects/EffectManager'
import { SoundManager, SoundType } from '@/audio/SoundManager'

/**
 * ゲーム入力イベント処理専用クラス
 * グリッドでのマウス・タッチイベントを管理
 */
export class GridEventHandler {
  private readonly cellSize = RENDER_CONSTANTS.CELL.SIZE
  private readonly cellSpacing = RENDER_CONSTANTS.CELL.SPACING

  constructor(
    private gameLogic: GameLogic,
    private animationManager: AnimationManager,
    private effectManager: EffectManager,
    private soundManager: SoundManager | null,
    private onDisplayUpdate: () => void
  ) {}

  /**
   * グリッドコンテナにイベントハンドラーを設定
   * @param gridContainer PIXIグリッドコンテナ
   */
  public setupEventHandlers(gridContainer: PIXI.Container): void {
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
    gridContainer.on('pointerdown', this.handleCellClick.bind(this))
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
   * セルクリックイベントを処理
   * @param event PIXIポインターイベント
   */
  private handleCellClick(event: PIXI.FederatedPointerEvent): void {
    const cellInfo = this.extractCellInfoFromEvent(event)
    if (!cellInfo) return

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
   * ワールド座標を計算
   * @param coordinates セル座標
   * @returns ワールド座標
   */
  private calculateWorldPosition(coordinates: { x: number; y: number }): { x: number; y: number } {
    return {
      x: coordinates.x * (this.cellSize + this.cellSpacing),
      y: coordinates.y * (this.cellSize + this.cellSpacing)
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
    const { worldPosition, container } = cellInfo
    
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
        this.animationManager.bounce(container, RENDER_CONSTANTS.ANIMATION.BOUNCE_DURATION)
        if (this.soundManager) this.soundManager.play(SoundType.FLAG)
        break
    }
  }

  /**
   * セルホバーイベントを処理
   * @param _event PIXIポインターイベント
   */
  private handleCellHover(_event: PIXI.FederatedPointerEvent): void {
    // ホバーエフェクトを完全に無効化
    return
  }

  /**
   * セルアウトイベントを処理
   * @param _event PIXIポインターイベント
   */
  private handleCellOut(_event: PIXI.FederatedPointerEvent): void {
    // ホバーエフェクトを完全に無効化
    return
  }
}