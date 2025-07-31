import { GameState, GameConfig, Cell, CellState, GameStats } from '@/types'

export class GameLogic {
  private config: GameConfig
  private cells: Cell[][]
  private gameState: GameState
  private stats: GameStats
  private firstClick: boolean

  constructor(config: GameConfig) {
    this.config = config
    this.gameState = GameState.READY
    this.firstClick = true
    this.stats = {
      startTime: null,
      endTime: null,
      elapsedTime: 0,
      flagsUsed: 0,
      cellsRevealed: 0
    }
    this.cells = this.initializeCells()
  }

  private initializeCells(): Cell[][] {
    const cells: Cell[][] = []
    for (let y = 0; y < this.config.height; y++) {
      cells[y] = []
      for (let x = 0; x < this.config.width; x++) {
        cells[y][x] = {
          x,
          y,
          state: CellState.HIDDEN,
          isMine: false,
          adjacentMines: 0,
          id: `${x}-${y}`
        }
      }
    }
    return cells
  }

  private placeMines(excludeX: number, excludeY: number): void {
    const availableCells: { x: number; y: number }[] = []

    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        if (x !== excludeX || y !== excludeY) {
          availableCells.push({ x, y })
        }
      }
    }

    for (let i = 0; i < this.config.mines; i++) {
      if (availableCells.length === 0) break
      
      const randomIndex = Math.floor(Math.random() * availableCells.length)
      const { x, y } = availableCells.splice(randomIndex, 1)[0]
      this.cells[y][x].isMine = true
    }

    this.calculateAdjacentMines()
  }

  private calculateAdjacentMines(): void {
    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        if (!this.cells[y][x].isMine) {
          this.cells[y][x].adjacentMines = this.countAdjacentMines(x, y)
        }
      }
    }
  }

  private countAdjacentMines(x: number, y: number): number {
    let count = 0
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue
        const nx = x + dx
        const ny = y + dy
        if (this.isValidCell(nx, ny) && this.cells[ny][nx].isMine) {
          count++
        }
      }
    }
    return count
  }

  private isValidCell(x: number, y: number): boolean {
    return x >= 0 && x < this.config.width && y >= 0 && y < this.config.height
  }

  public revealCell(x: number, y: number): boolean {
    if (!this.isValidCell(x, y) || this.gameState !== GameState.ACTIVE && this.gameState !== GameState.READY) {
      return false
    }

    const cell = this.cells[y][x]
    if (cell.state !== CellState.HIDDEN) {
      return false
    }

    if (this.firstClick) {
      this.placeMines(x, y)
      this.firstClick = false
      this.gameState = GameState.ACTIVE
      this.stats.startTime = Date.now()
    }

    cell.state = CellState.REVEALED
    this.stats.cellsRevealed++

    if (cell.isMine) {
      this.gameState = GameState.FAILED
      this.stats.endTime = Date.now()
      this.stats.elapsedTime = this.stats.endTime - (this.stats.startTime || 0)
      this.revealAllMines()
      return false
    }

    if (cell.adjacentMines === 0) {
      this.revealAdjacentCells(x, y)
    }

    this.checkWinCondition()
    return true
  }

  private revealAdjacentCells(x: number, y: number): void {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue
        const nx = x + dx
        const ny = y + dy
        if (this.isValidCell(nx, ny)) {
          const adjacentCell = this.cells[ny][nx]
          if (adjacentCell.state === CellState.HIDDEN && !adjacentCell.isMine) {
            adjacentCell.state = CellState.REVEALED
            this.stats.cellsRevealed++
            
            // 隣接セルも空（adjacentMines === 0）なら再帰的に開放
            if (adjacentCell.adjacentMines === 0) {
              this.revealAdjacentCells(nx, ny)
            }
          }
        }
      }
    }
  }

  private revealAllMines(): void {
    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        if (this.cells[y][x].isMine) {
          this.cells[y][x].state = CellState.REVEALED
        }
      }
    }
  }

  public toggleFlag(x: number, y: number): boolean {
    console.log(`toggleFlag called for (${x}, ${y}), gameState: ${this.gameState}`)
    
    if (!this.isValidCell(x, y) || (this.gameState !== GameState.ACTIVE && this.gameState !== GameState.READY)) {
      console.log(`toggleFlag failed: invalid cell or wrong game state`)
      return false
    }

    const cell = this.cells[y][x]
    console.log(`toggleFlag cell state before: ${cell.state}`)
    
    if (cell.state === CellState.REVEALED) {
      console.log(`toggleFlag failed: cell already revealed`)
      return false
    }

    switch (cell.state) {
      case CellState.HIDDEN:
        cell.state = CellState.FLAGGED
        this.stats.flagsUsed++
        console.log(`Cell flagged, new state: ${cell.state}`)
        break
      case CellState.FLAGGED:
        cell.state = CellState.QUESTIONED
        this.stats.flagsUsed--
        console.log(`Cell questioned, new state: ${cell.state}`)
        break
      case CellState.QUESTIONED:
        cell.state = CellState.HIDDEN
        console.log(`Cell hidden, new state: ${cell.state}`)
        break
    }

    return true
  }

  private checkWinCondition(): void {
    const totalCells = this.config.width * this.config.height
    const revealedCells = this.stats.cellsRevealed
    const mineCells = this.config.mines

    if (revealedCells === totalCells - mineCells) {
      this.gameState = GameState.SUCCESS
      this.stats.endTime = Date.now()
      this.stats.elapsedTime = this.stats.endTime - (this.stats.startTime || 0)
    }
  }

  public getGameState(): GameState {
    return this.gameState
  }

  public getCells(): Cell[][] {
    return this.cells
  }

  public getStats(): GameStats {
    return { ...this.stats }
  }

  public getConfig(): GameConfig {
    return { ...this.config }
  }

  public getRemainingMines(): number {
    return this.config.mines - this.stats.flagsUsed
  }

  public reset(): void {
    this.gameState = GameState.READY
    this.firstClick = true
    this.stats = {
      startTime: null,
      endTime: null,
      elapsedTime: 0,
      flagsUsed: 0,
      cellsRevealed: 0
    }
    this.cells = this.initializeCells()
  }
}