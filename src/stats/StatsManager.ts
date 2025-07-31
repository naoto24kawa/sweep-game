import { Difficulty, GameResult } from '@/types'

export interface PlayerStats {
  totalGames: number
  totalWins: number
  totalLosses: number
  winRate: number
  totalPlayTime: number
  averageGameTime: number
  bestTimes: Record<Difficulty, number | null>
  difficultyStats: Record<Difficulty, {
    games: number
    wins: number
    losses: number
    winRate: number
    bestTime: number | null
    averageTime: number
  }>
  recentGames: GameResult[]
  achievements: string[]
  streaks: {
    current: number
    best: number
  }
}

export class StatsManager {
  private readonly STORAGE_KEY = 'sweep-game-stats'
  private readonly MAX_RECENT_GAMES = 50
  private stats: PlayerStats

  constructor() {
    this.stats = this.loadStats()
  }

  private getDefaultStats(): PlayerStats {
    return {
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0,
      winRate: 0,
      totalPlayTime: 0,
      averageGameTime: 0,
      bestTimes: {
        [Difficulty.NOVICE]: null,
        [Difficulty.AGENT]: null,
        [Difficulty.HACKER]: null,
        [Difficulty.CUSTOM]: null
      },
      difficultyStats: {
        [Difficulty.NOVICE]: { games: 0, wins: 0, losses: 0, winRate: 0, bestTime: null, averageTime: 0 },
        [Difficulty.AGENT]: { games: 0, wins: 0, losses: 0, winRate: 0, bestTime: null, averageTime: 0 },
        [Difficulty.HACKER]: { games: 0, wins: 0, losses: 0, winRate: 0, bestTime: null, averageTime: 0 },
        [Difficulty.CUSTOM]: { games: 0, wins: 0, losses: 0, winRate: 0, bestTime: null, averageTime: 0 }
      },
      recentGames: [],
      achievements: [],
      streaks: {
        current: 0,
        best: 0
      }
    }
  }

  private loadStats(): PlayerStats {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return { ...this.getDefaultStats(), ...parsed }
      }
    } catch (error) {
      console.warn('Failed to load stats from localStorage:', error)
    }
    return this.getDefaultStats()
  }

  private saveStats(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.stats))
    } catch (error) {
      console.warn('Failed to save stats to localStorage:', error)
    }
  }

  public recordGame(result: GameResult): void {
    this.stats.totalGames++
    this.stats.totalPlayTime += result.duration

    const difficultyStats = this.stats.difficultyStats[result.difficulty]
    difficultyStats.games++

    if (result.success) {
      this.stats.totalWins++
      difficultyStats.wins++
      this.stats.streaks.current++

      if (this.stats.streaks.current > this.stats.streaks.best) {
        this.stats.streaks.best = this.stats.streaks.current
      }

      if (!this.stats.bestTimes[result.difficulty] || result.duration < this.stats.bestTimes[result.difficulty]!) {
        this.stats.bestTimes[result.difficulty] = result.duration
      }

      if (!difficultyStats.bestTime || result.duration < difficultyStats.bestTime) {
        difficultyStats.bestTime = result.duration
      }

      this.checkAchievements(result)
    } else {
      this.stats.totalLosses++
      difficultyStats.losses++
      this.stats.streaks.current = 0
    }

    this.updateCalculatedStats()
    
    this.stats.recentGames.unshift(result)
    if (this.stats.recentGames.length > this.MAX_RECENT_GAMES) {
      this.stats.recentGames = this.stats.recentGames.slice(0, this.MAX_RECENT_GAMES)
    }

    this.saveStats()
  }

  private updateCalculatedStats(): void {
    this.stats.winRate = this.stats.totalGames > 0 ? 
      (this.stats.totalWins / this.stats.totalGames) * 100 : 0

    this.stats.averageGameTime = this.stats.totalGames > 0 ? 
      this.stats.totalPlayTime / this.stats.totalGames : 0

    Object.values(this.stats.difficultyStats).forEach(diffStats => {
      diffStats.winRate = diffStats.games > 0 ? 
        (diffStats.wins / diffStats.games) * 100 : 0

      const difficultyGames = this.stats.recentGames.filter(game => 
        game.difficulty === Object.keys(this.stats.difficultyStats)
          .find(key => this.stats.difficultyStats[key as Difficulty] === diffStats) as Difficulty
      )
      
      diffStats.averageTime = difficultyGames.length > 0 ? 
        difficultyGames.reduce((sum, game) => sum + game.duration, 0) / difficultyGames.length : 0
    })
  }

  private checkAchievements(result: GameResult): void {
    const achievements: string[] = []

    if (result.difficulty === Difficulty.NOVICE && result.duration < 60000) {
      achievements.push('speed_novice')
    }
    if (result.difficulty === Difficulty.AGENT && result.duration < 300000) {
      achievements.push('speed_agent')
    }
    if (result.difficulty === Difficulty.HACKER && result.duration < 600000) {
      achievements.push('speed_hacker')
    }

    if (this.stats.totalWins === 1) {
      achievements.push('first_win')
    }
    if (this.stats.totalWins === 10) {
      achievements.push('veteran')
    }
    if (this.stats.totalWins === 100) {
      achievements.push('master')
    }

    if (this.stats.streaks.current === 5) {
      achievements.push('streak_5')
    }
    if (this.stats.streaks.current === 10) {
      achievements.push('streak_10')
    }

    if (result.flagsUsed === result.mines) {
      achievements.push('perfect_flags')
    }

    achievements.forEach(achievement => {
      if (!this.stats.achievements.includes(achievement)) {
        this.stats.achievements.push(achievement)
      }
    })
  }

  public getStats(): PlayerStats {
    return { ...this.stats }
  }

  public getBestTime(difficulty: Difficulty): number | null {
    return this.stats.bestTimes[difficulty]
  }

  public getWinRate(difficulty?: Difficulty): number {
    if (difficulty) {
      return this.stats.difficultyStats[difficulty].winRate
    }
    return this.stats.winRate
  }

  public getRecentGames(count: number = 10): GameResult[] {
    return this.stats.recentGames.slice(0, count)
  }

  public getAchievements(): string[] {
    return [...this.stats.achievements]
  }

  public formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  public getAchievementName(achievementId: string): string {
    const names: Record<string, string> = {
      'first_win': '初勝利',
      'veteran': 'ベテラン',
      'master': 'マスター',
      'speed_novice': 'ノービス速攻',
      'speed_agent': 'エージェント速攻',
      'speed_hacker': 'ハッカー速攻',
      'streak_5': '連勝5',
      'streak_10': '連勝10',
      'perfect_flags': '完璧なフラグ'
    }
    return names[achievementId] || achievementId
  }

  public resetStats(): void {
    this.stats = this.getDefaultStats()
    this.saveStats()
  }

  public exportStats(): string {
    return JSON.stringify(this.stats, null, 2)
  }

  public importStats(data: string): boolean {
    try {
      const parsed = JSON.parse(data)
      this.stats = { ...this.getDefaultStats(), ...parsed }
      this.saveStats()
      return true
    } catch (error) {
      console.error('Failed to import stats:', error)
      return false
    }
  }
}