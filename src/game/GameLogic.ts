import { GameState, GameConfig, Cell, CellState, GameStats, ScoreConfig, SCORE_CONFIGS } from '@/types'
import { Logger } from '@/core/Logger'

export class GameLogic {
  private config: GameConfig
  private cells: Cell[][]
  private gameState: GameState
  private stats: GameStats
  private firstClick: boolean
  private scoreConfig: ScoreConfig

  constructor(config: GameConfig) {
    this.config = config
    this.scoreConfig = SCORE_CONFIGS[config.difficulty]
    this.gameState = GameState.READY
    this.firstClick = true
    this.stats = {
      startTime: null,
      endTime: null,
      elapsedTime: 0,
      flagsUsed: 0,
      cellsRevealed: 0,
      score: 0,
      comboCount: 0,
      bestCombo: 0,
      lastCellRevealTime: null
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

  /**
   * 地雷を配置する（最初のクリック時に実行）
   * アルゴリズム: Fisher-Yates風シャッフルで公平なランダム配置を実現
   * @param excludeX 最初にクリックされたセルのX座標（地雷を配置しない）
   * @param excludeY 最初にクリックされたセルのY座標（地雷を配置しない）
   */
  private placeMines(excludeX: number, excludeY: number): void {
    Logger.debug(`GameLogic: Placing mines, excluding first click at (${excludeX}, ${excludeY})`)
    
    // 最初のクリック位置を除く全セルを候補として収集
    const availableCells: { x: number; y: number }[] = []

    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        if (x !== excludeX || y !== excludeY) {
          availableCells.push({ x, y })
        }
      }
    }

    // Fisher-Yates風アルゴリズムでランダムに地雷を配置
    const minePositions: string[] = []
    for (let i = 0; i < this.config.mines; i++) {
      if (availableCells.length === 0) break
      
      const randomIndex = Math.floor(Math.random() * availableCells.length)
      const { x, y } = availableCells.splice(randomIndex, 1)[0]
      this.cells[y][x].isMine = true
      minePositions.push(`(${x},${y})`)
    }
    
    Logger.debug(`GameLogic: Placed ${minePositions.length} mines at: ${minePositions.join(', ')}`)

    // 地雷配置完了後、各セルの隣接地雷数を計算
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

  /**
   * 指定セルの周囲8方向の地雷数をカウント
   * マインスイーパーの基本アルゴリズム：3x3グリッドを走査して中央を除外
   * @param x セルのX座標
   * @param y セルのY座標
   * @returns 隣接地雷数（0-8）
   */
  private countAdjacentMines(x: number, y: number): number {
    let count = 0
    // 3x3の範囲をチェック（-1, -1から+1, +1まで）
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue // 中央セル（自分自身）は除外
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
    Logger.debug(`GameLogic: Revealing cell at (${x}, ${y})`)
    
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

    const shouldContinueCombo = cell.adjacentMines === 0
    if (shouldContinueCombo) {
      this.updateComboCount()
    } else {
      this.stats.comboCount = 0
      this.stats.lastCellRevealTime = Date.now()
    }

    const cellScore = this.calculateCellScore(cell.adjacentMines, shouldContinueCombo)
    this.stats.score += cellScore

    if (cell.adjacentMines === 0) {
      this.revealAdjacentCells(x, y)
    }

    this.checkWinCondition()
    return true
  }

  /**
   * 隣接セルを再帰的に開放（連鎖開放アルゴリズム）
   * 空セル（adjacentMines=0）をクリックした時の典型的な挙動
   * Flood Fill アルゴリズムの変形で、境界は地雷または数字セルまで
   * @param x 開始セルのX座標
   * @param y 開始セルのY座標
   */
  private revealAdjacentCells(x: number, y: number): void {
    // 8方向の隣接セルを走査
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue // 中央（自分自身）は除外
        const nx = x + dx
        const ny = y + dy
        if (this.isValidCell(nx, ny)) {
          const adjacentCell = this.cells[ny][nx]
          if (adjacentCell.state === CellState.HIDDEN && !adjacentCell.isMine) {
            adjacentCell.state = CellState.REVEALED
            this.stats.cellsRevealed++
            
            const shouldContinueCombo = adjacentCell.adjacentMines === 0
            if (shouldContinueCombo) {
              this.updateComboCount()
            }

            const cellScore = this.calculateCellScore(adjacentCell.adjacentMines, shouldContinueCombo)
            this.stats.score += cellScore
            
            // 隣接セルも空（adjacentMines === 0）なら再帰的に開放
            // これによりマインスイーパー特有の「連鎖開放」が実現される
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
    if (!this.isValidCellForFlagging(x, y)) {
      return false
    }

    const cell = this.cells[y][x]
    this.performCellStateTransition(cell)
    
    return true
  }

  /**
   * 勝利条件をチェック
   * マインスイーパーの勝利条件：地雷以外の全セルが開放されること
   * 数式：開放セル数 = 全セル数 - 地雷数
   */
  private checkWinCondition(): void {
    const totalCells = this.config.width * this.config.height
    const revealedCells = this.stats.cellsRevealed
    const mineCells = this.config.mines

    // 地雷以外の全セルが開放されたら勝利
    if (revealedCells === totalCells - mineCells) {
      this.gameState = GameState.SUCCESS
      this.stats.endTime = Date.now()
      this.stats.elapsedTime = this.stats.endTime - (this.stats.startTime || 0)
      
      this.stats.score = this.calculateFinalScore()
    }
  }

  public getGameState(): GameState {
    return this.gameState
  }

  public getCells(): Cell[][] {
    return this.cells
  }

  private isValidCellForFlagging(x: number, y: number): boolean {
    return this.isValidCell(x, y) && 
           (this.gameState === GameState.ACTIVE || this.gameState === GameState.READY) &&
           this.cells[y][x].state !== CellState.REVEALED
  }

  private performCellStateTransition(cell: Cell): void {
    switch (cell.state) {
      case CellState.HIDDEN:
        cell.state = CellState.FLAGGED
        this.stats.flagsUsed++
        break
      case CellState.FLAGGED:
        cell.state = CellState.QUESTIONED
        this.stats.flagsUsed--
        break
      case CellState.QUESTIONED:
        cell.state = CellState.HIDDEN
        break
    }
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
      cellsRevealed: 0,
      score: 0,
      comboCount: 0,
      bestCombo: 0,
      lastCellRevealTime: null
    }
    this.cells = this.initializeCells()
  }

  private calculateCellScore(adjacentMines: number, isCombo: boolean): number {
    const baseScore = this.scoreConfig.baseRevealScore
    
    if (adjacentMines === 0 && isCombo) {
      const comboBonus = Math.floor(baseScore * this.scoreConfig.comboMultiplier * this.stats.comboCount)
      return baseScore + comboBonus
    }
    
    return baseScore
  }

  private updateComboCount(): void {
    const currentTime = Date.now()
    const shouldContinueCombo = this.stats.lastCellRevealTime && 
      (currentTime - this.stats.lastCellRevealTime) < this.scoreConfig.comboTimeThreshold

    if (shouldContinueCombo) {
      this.stats.comboCount++
    } else {
      this.stats.comboCount = 1
    }

    if (this.stats.comboCount > this.stats.bestCombo) {
      this.stats.bestCombo = this.stats.comboCount
    }

    this.stats.lastCellRevealTime = currentTime
  }

  private calculateFinalScore(): number {
    let finalScore = this.stats.score

    if (this.gameState === GameState.SUCCESS) {
      finalScore += this.scoreConfig.completionBonus

      if (this.stats.flagsUsed === this.config.mines) {
        finalScore += this.scoreConfig.perfectFlagBonus
      }

      if (this.stats.elapsedTime > 0) {
        const timeBonusBase = 60000
        const timeBonus = Math.max(0, timeBonusBase - this.stats.elapsedTime) * this.scoreConfig.timeBonusMultiplier
        finalScore += Math.floor(timeBonus)
      }
    }

    return Math.floor(finalScore)
  }

  public getCurrentScore(): number {
    return this.calculateFinalScore()
  }
}