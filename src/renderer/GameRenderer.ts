import * as PIXI from 'pixi.js'
import { GameLogic } from '@/game/GameLogic'
import { Cell, CellState, NEON_COLORS, GameState, RENDER_CONSTANTS, CellClickInfo, ActionResult } from '@/types'
import { AnimationManager } from '@/animation/AnimationManager'
import { EffectManager } from '@/effects/EffectManager'
import { SoundManager, SoundType } from '@/audio/SoundManager'

export class GameRenderer {
  private app!: PIXI.Application
  private gameLogic: GameLogic
  private gridContainer: PIXI.Container
  private readonly cellSize = RENDER_CONSTANTS.CELL.SIZE
  private readonly cellSpacing = RENDER_CONSTANTS.CELL.SPACING
  private animationManager!: AnimationManager
  private effectManager!: EffectManager
  private soundManager: SoundManager | null = null
  private hoveredCell: PIXI.Container | null = null

  private initializationPromise: Promise<void>

  constructor(gameLogic: GameLogic, soundManager?: SoundManager) {
    this.gameLogic = gameLogic
    this.soundManager = soundManager || null
    this.gridContainer = new PIXI.Container()
    
    const config = gameLogic.getConfig()
    const canvasWidth = config.width * (this.cellSize + this.cellSpacing) - this.cellSpacing
    const canvasHeight = config.height * (this.cellSize + this.cellSpacing) - this.cellSpacing

    this.initializationPromise = this.initializeApp(canvasWidth, canvasHeight)
  }

  public async waitForReady(): Promise<void> {
    await this.initializationPromise
  }

  public isReady(): boolean {
    console.log('isReady check:', {
      app: !!this.app,
      canvas: this.app?.canvas,
      screen: this.app?.screen
    })
    return this.app && this.app.canvas != null
  }

  private async initializeApp(width: number, height: number): Promise<void> {
    console.log('initializeApp start')
    this.app = new PIXI.Application()
    console.log('Application created:', this.app)
    
    await this.app.init({
      width,
      height,
      backgroundColor: NEON_COLORS.primary.deepBlack,
      antialias: true
    })
    console.log('Application initialized:', {
      canvas: !!this.app.canvas,
      screen: this.app.screen
    })

    this.animationManager = new AnimationManager()
    this.effectManager = new EffectManager(this.app.stage, this.animationManager)

    this.setupGrid()
    console.log('initializeApp complete')
  }

  private setupGrid(): void {
    console.log('Setting up grid')
    const config = this.gameLogic.getConfig()
    const cells = this.gameLogic.getCells()

    console.log('Grid config:', config)
    console.log('Creating cells:', config.width, 'x', config.height)

    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        const cellGraphics = this.createCellGraphics(cells[y][x])
        cellGraphics.x = x * (this.cellSize + this.cellSpacing)
        cellGraphics.y = y * (this.cellSize + this.cellSpacing)
        cellGraphics.eventMode = 'static'
        cellGraphics.cursor = 'pointer'
        cellGraphics.label = `${x}-${y}`
        
        console.log(`Created cell at (${x}, ${y}):`, {
          label: cellGraphics.label,
          eventMode: cellGraphics.eventMode,
          cursor: cellGraphics.cursor,
          position: { x: cellGraphics.x, y: cellGraphics.y }
        })
        
        this.gridContainer.addChild(cellGraphics)
      }
    }

    console.log('Grid container children count:', this.gridContainer.children.length)
    console.log('Adding grid container to stage')
    this.app.stage.addChild(this.gridContainer)
    this.centerGrid()
    console.log('Grid setup complete')
  }

  private createCellGraphics(cell: Cell): PIXI.Container {
    const container = new PIXI.Container()
    container.label = `${cell.x}-${cell.y}`
    container.sortableChildren = true  // Z-indexソートを有効化

    const background = new PIXI.Graphics()
    background.zIndex = 1  // 背景は後ろに
    this.drawCellBackground(background, cell)
    container.addChild(background)

    // 数字テキストを作成・追加
    if (cell.state === CellState.REVEALED && !cell.isMine && cell.adjacentMines > 0) {
      const color = NEON_COLORS.numbers[cell.adjacentMines as keyof typeof NEON_COLORS.numbers]
      
      // PixiJS v8では Graphics に子要素を追加できないため、直接Textを作成
      const text = new PIXI.Text({
        text: cell.adjacentMines.toString(),
        style: {
          fontFamily: 'Courier New, monospace',
          fontSize: 18,
          fill: color || '#00ffff',
          fontWeight: 'bold'
        }
      })
      
      // 位置とアンカーを設定
      text.x = this.cellSize / 2
      text.y = this.cellSize / 2
      text.anchor.set(0.5, 0.5)
      text.zIndex = 10
      text.visible = true
      text.alpha = 1
      
      console.log(`Creating text for cell (${cell.x}, ${cell.y}):`, {
        text: text.text,
        visible: text.visible,
        alpha: text.alpha,
        width: text.width,
        height: text.height,
        x: text.x,
        y: text.y,
        zIndex: text.zIndex,
        color: color,
        adjacentMines: cell.adjacentMines
      })
      
      // 直接コンテナに追加
      container.addChild(text)
    } else if (cell.state === CellState.FLAGGED) {
      const flag = this.createFlagGraphics()
      container.addChild(flag)
    } else if (cell.state === CellState.QUESTIONED) {
      const question = this.createQuestionGraphics()
      container.addChild(question)
    } else if (cell.state === CellState.REVEALED && cell.isMine) {
      const mine = this.createMineGraphics()
      container.addChild(mine)
    }

    return container
  }

  private drawCellBackground(graphics: PIXI.Graphics, cell: Cell): void {
    graphics.clear()

    switch (cell.state) {
      case CellState.HIDDEN:
      case CellState.FLAGGED:
      case CellState.QUESTIONED:
        graphics
          .rect(0, 0, this.cellSize, this.cellSize)
          .fill({ color: NEON_COLORS.primary.darkGray })
          .stroke({ width: 1, color: NEON_COLORS.accent.neonBlue, alpha: 0.3 })
        break
      case CellState.REVEALED:
        if (cell.isMine) {
          graphics
            .rect(0, 0, this.cellSize, this.cellSize)
            .fill({ color: NEON_COLORS.warning.neonRed, alpha: 0.8 })
            .stroke({ width: 1, color: NEON_COLORS.warning.neonRed })
        } else {
          graphics
            .rect(0, 0, this.cellSize, this.cellSize)
            .fill({ color: NEON_COLORS.primary.deepBlack, alpha: 0.8 })
            .stroke({ width: 1, color: NEON_COLORS.accent.neonBlue, alpha: 0.2 })
          
          // 数字は別途Textオブジェクトで描画する
        }
        break
    }
  }


  private createFlagGraphics(): PIXI.Graphics {
    const flag = new PIXI.Graphics()
    
    // より大きくて見やすいフラグを作成
    const centerX = this.cellSize / 2
    const centerY = this.cellSize / 2
    
    // フラグの三角形（もっと大きく）
    flag.poly([
      centerX - 8, centerY - 10,  // 左上
      centerX + 8, centerY - 2,   // 右中
      centerX - 8, centerY + 4    // 左下
    ])
    flag.fill(NEON_COLORS.warning.neonOrange)

    // フラグのポール（もっと太く）
    flag.moveTo(centerX - 8, centerY - 10)
    flag.lineTo(centerX - 8, centerY + 10)
    flag.stroke({ width: 3, color: NEON_COLORS.text.lightGray })

    // フラグを前面に表示
    flag.zIndex = 10
    
    console.log(`Flag graphics created: centerX=${centerX}, centerY=${centerY}, cellSize=${this.cellSize}`)
    return flag
  }

  private createQuestionGraphics(): PIXI.Container {
    const question = new PIXI.Container()
    question.zIndex = 10
    
    const text = new PIXI.Text({
      text: '?',
      style: {
        fontFamily: 'Courier New, monospace',
        fontSize: 20,
        fill: NEON_COLORS.accent.neonBlue,
        fontWeight: 'bold'
      }
    })
    
    text.x = this.cellSize / 2
    text.y = this.cellSize / 2
    text.anchor.set(0.5, 0.5)
    text.zIndex = 10
    
    question.addChild(text)
    console.log(`Question mark created with cellSize: ${this.cellSize}`)
    return question
  }

  private createMineGraphics(): PIXI.Graphics {
    const mine = new PIXI.Graphics()
    
    // 地雷の円
    mine
      .circle(this.cellSize / 2, this.cellSize / 2, 8)
      .fill({ color: NEON_COLORS.warning.neonRed })

    // 地雷の針
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4
      const startX = this.cellSize / 2 + Math.cos(angle) * 4
      const startY = this.cellSize / 2 + Math.sin(angle) * 4
      const endX = this.cellSize / 2 + Math.cos(angle) * 12
      const endY = this.cellSize / 2 + Math.sin(angle) * 12
      
      mine
        .moveTo(startX, startY)
        .lineTo(endX, endY)
        .stroke({ width: 2, color: NEON_COLORS.text.white })
    }

    return mine
  }

  private centerGrid(): void {
    const config = this.gameLogic.getConfig()
    const gridWidth = config.width * (this.cellSize + this.cellSpacing) - this.cellSpacing
    const gridHeight = config.height * (this.cellSize + this.cellSpacing) - this.cellSpacing

    this.gridContainer.x = (this.app.screen.width - gridWidth) / 2
    this.gridContainer.y = (this.app.screen.height - gridHeight) / 2
  }

  public setupEventHandlers(): void {
    this.setupContainerEventMode()
    this.registerClickHandlers()
    this.registerHoverHandlers()
    this.registerContextMenuHandlers()
  }

  private setupContainerEventMode(): void {
    this.gridContainer.eventMode = 'static'
  }

  private registerClickHandlers(): void {
    this.gridContainer.on('pointerdown', this.handleCellClick.bind(this))
  }

  private registerHoverHandlers(): void {
    this.gridContainer.on('pointerover', this.handleCellHover.bind(this))
    this.gridContainer.on('pointerout', this.handleCellOut.bind(this))
  }

  private registerContextMenuHandlers(): void {
    this.gridContainer.on('rightclick', (event: PIXI.FederatedPointerEvent) => {
      event.preventDefault()
    })
  }

  private handleCellClick(event: PIXI.FederatedPointerEvent): void {
    const cellInfo = this.extractCellInfoFromEvent(event)
    if (!cellInfo) return

    const actionResult = this.processUserAction(event.button, cellInfo)
    if (actionResult.shouldPlayEffect) {
      this.playInteractionEffects(actionResult, cellInfo)
    }
    
    this.updateDisplay()
  }

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

  private findCellContainer(target: PIXI.Container): PIXI.Container | null {
    let cellContainer = target
    if (!cellContainer.label && cellContainer.parent) {
      cellContainer = cellContainer.parent as PIXI.Container
    }
    return cellContainer?.label ? cellContainer : null
  }

  private parseCellCoordinates(label: string): { x: number; y: number } {
    const [x, y] = label.split('-').map(Number)
    return { x, y }
  }

  private calculateWorldPosition(coordinates: { x: number; y: number }): { x: number; y: number } {
    return {
      x: coordinates.x * (this.cellSize + this.cellSpacing),
      y: coordinates.y * (this.cellSize + this.cellSpacing)
    }
  }

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

  private playInteractionEffects(actionResult: ActionResult, cellInfo: CellClickInfo): void {
    const { worldPosition, container } = cellInfo
    
    switch (actionResult.effectType) {
      case 'explosion':
        this.effectManager.createExplosionEffect(worldPosition.x, worldPosition.y, this.cellSize)
        this.effectManager.screenShake(RENDER_CONSTANTS.EFFECTS.SHAKE_INTENSITY, RENDER_CONSTANTS.EFFECTS.SHAKE_DURATION)
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

  private handleCellHover(event: PIXI.FederatedPointerEvent): void {
    const cellContainer = this.findCellContainer(event.target as PIXI.Container)
    if (!cellContainer?.label) return

    const coordinates = this.parseCellCoordinates(cellContainer.label)
    const cell = this.gameLogic.getCells()[coordinates.y][coordinates.x]
    
    if (cell.state === CellState.HIDDEN && this.gameLogic.getGameState() === GameState.ACTIVE) {
      this.hoveredCell = cellContainer
      this.addHoverEffect(cellContainer)
      if (this.soundManager) this.soundManager.play(SoundType.HOVER)
    }
  }

  private handleCellOut(event: PIXI.FederatedPointerEvent): void {
    const cellContainer = this.findCellContainer(event.target as PIXI.Container)
    if (cellContainer === this.hoveredCell && cellContainer) {
      this.removeHoverEffect(cellContainer)
      this.hoveredCell = null
    }
  }

  private addHoverEffect(cellContainer: PIXI.Container): void {
    const background = cellContainer.children[0] as PIXI.Graphics
    
    background.tint = 0x00ffff
    background.alpha = 0.8
    
    this.animationManager.pulse(cellContainer, 0.05, 2000)
    
    const cellX = cellContainer.x
    const cellY = cellContainer.y
    this.effectManager.createGlowEffect(cellX, cellY, 0x00ffff, this.cellSize / 2)
  }

  private removeHoverEffect(cellContainer: PIXI.Container): void {
    const background = cellContainer.children[0] as PIXI.Graphics
    background.tint = 0xffffff
    background.alpha = 1
    
    this.animationManager.stop(cellContainer)
    cellContainer.scale.set(1)
  }

  private updateCellDisplay(container: PIXI.Container, cell: Cell): void {
    container.sortableChildren = true

    // 背景を追加
    const background = new PIXI.Graphics()
    background.zIndex = 1
    this.drawCellBackground(background, cell)
    container.addChild(background)

    // セルの状態に応じて表示を追加
    console.log(`updateCellDisplay for cell (${cell.x}, ${cell.y}): state=${cell.state}`)
    
    if (cell.state === CellState.FLAGGED) {
      console.log(`Creating flag for cell (${cell.x}, ${cell.y})`)
      const flag = this.createFlagGraphics()
      container.addChild(flag)
      console.log(`Flag added, container children: ${container.children.length}`)
    } else if (cell.state === CellState.QUESTIONED) {
      console.log(`Creating question for cell (${cell.x}, ${cell.y})`)
      const question = this.createQuestionGraphics()  
      container.addChild(question)
    } else if (cell.state === CellState.REVEALED && cell.isMine) {
      console.log(`Creating mine for cell (${cell.x}, ${cell.y})`)
      const mine = this.createMineGraphics()
      container.addChild(mine)
    } else if (cell.state === CellState.REVEALED && !cell.isMine && cell.adjacentMines > 0) {
      console.log(`Creating number text for cell (${cell.x}, ${cell.y}): ${cell.adjacentMines}`)
      // 数字テキストを追加
      const color = NEON_COLORS.numbers[cell.adjacentMines as keyof typeof NEON_COLORS.numbers]
      
      const text = new PIXI.Text({
        text: cell.adjacentMines.toString(),
        style: {
          fontFamily: 'Courier New, monospace',
          fontSize: 18,
          fill: color || '#00ffff',
          fontWeight: 'bold'
        }
      })
      
      text.x = this.cellSize / 2
      text.y = this.cellSize / 2
      text.anchor.set(0.5, 0.5)
      text.zIndex = 10
      
      container.addChild(text)
      console.log(`Number text added, container children: ${container.children.length}`)
    } else {
      console.log(`No special display for cell (${cell.x}, ${cell.y}), state: ${cell.state}`)
    }
  }

  public updateDisplay(): void {
    const cells = this.gameLogic.getCells()
    const config = this.gameLogic.getConfig()
    
    console.log(`updateDisplay called, checking cell (3,3) state: ${cells[3][3].state}`)

    for (let y = 0; y < config.height; y++) {
      for (let x = 0; x < config.width; x++) {
        const cellId = `${x}-${y}`
        const cellContainer = this.gridContainer.children.find(child => (child as PIXI.Container).label === cellId) as PIXI.Container
        
        if (cellContainer) {
          // 古い内容を削除
          cellContainer.removeChildren()
          
          // セルを直接更新
          this.updateCellDisplay(cellContainer, cells[y][x])


          // アニメーション効果（一時的に無効化）
          // if (cells[y][x].state === CellState.REVEALED && !cells[y][x].isMine) {
          //   this.animationManager.fadeIn(cellContainer, 200)
          //   this.animationManager.scaleUp(cellContainer, 150)
          // }
        }
      }
    }
  }

  public getCanvas(): HTMLCanvasElement {
    return this.app.canvas
  }

  public getApp(): PIXI.Application {
    return this.app
  }

  public destroy(): void {
    this.animationManager.destroy()
    this.effectManager.destroy()
    this.app.destroy(true, true)
  }
}