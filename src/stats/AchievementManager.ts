import { Difficulty } from '@/types'

/**
 * 実績情報インターフェース
 */
export interface Achievement {
  id: string
  title: string
  description: string
  unlockedAt?: string
  isUnlocked: boolean
}

/**
 * 実績チェック用の簡略ゲーム結果
 */
export interface AchievementGameResult {
  won: boolean
  time: number
  difficulty: Difficulty
  date: string
}

/**
 * 実績システム専用クラス
 * ゲーム結果に基づく実績の管理・判定
 */
export class AchievementManager {
  private achievements: Achievement[] = [
    {
      id: 'first_win',
      title: '初勝利',
      description: '初めてゲームに勝利',
      isUnlocked: false
    },
    {
      id: 'speed_demon_novice',
      title: 'スピードデーモン（初心者）',
      description: '初心者レベルを30秒以内でクリア',
      isUnlocked: false
    },
    {
      id: 'speed_demon_agent',
      title: 'スピードデーモン（エージェント）',
      description: 'エージェントレベルを120秒以内でクリア',
      isUnlocked: false
    },
    {
      id: 'speed_demon_hacker',
      title: 'スピードデーモン（ハッカー）',
      description: 'ハッカーレベルを300秒以内でクリア',
      isUnlocked: false
    },
    {
      id: 'win_streak_5',
      title: '連勝記録',
      description: '5連勝達成',
      isUnlocked: false
    },
    {
      id: 'perfectionist',
      title: 'パーフェクト主義者',
      description: 'フラグミスなしでクリア',
      isUnlocked: false
    }
  ]

  private gameHistory: AchievementGameResult[] = []

  /**
   * ゲーム結果から実績をチェック
   * @param result ゲーム結果
   * @returns 新たに獲得した実績
   */
  public checkAchievements(result: AchievementGameResult): Achievement[] {
    const newAchievements: Achievement[] = []
    
    if (result.won) {
      // 初勝利チェック
      if (!this.achievements.find(a => a.id === 'first_win')?.isUnlocked) {
        const achievement = this.unlockAchievement('first_win')
        if (achievement) newAchievements.push(achievement)
      }

      // スピード実績チェック
      const speedAchievement = this.checkSpeedAchievements(result)
      if (speedAchievement) newAchievements.push(speedAchievement)

      // 連勝記録チェック
      const streakAchievement = this.checkWinStreakAchievements()
      if (streakAchievement) newAchievements.push(streakAchievement)
    }

    this.gameHistory.push(result)
    return newAchievements
  }

  /**
   * スピード系実績をチェック
   * @param result ゲーム結果
   * @returns 獲得した実績またはnull
   */
  private checkSpeedAchievements(result: AchievementGameResult): Achievement | null {
    const timeInSeconds = result.time / 1000

    switch (result.difficulty) {
      case Difficulty.NOVICE:
        if (timeInSeconds <= 30) {
          return this.unlockAchievement('speed_demon_novice')
        }
        break
      case Difficulty.AGENT:
        if (timeInSeconds <= 120) {
          return this.unlockAchievement('speed_demon_agent')
        }
        break
      case Difficulty.HACKER:
        if (timeInSeconds <= 300) {
          return this.unlockAchievement('speed_demon_hacker')
        }
        break
    }

    return null
  }

  /**
   * 連勝記録実績をチェック
   * @returns 獲得した実績またはnull
   */
  private checkWinStreakAchievements(): Achievement | null {
    const currentStreak = this.getCurrentWinStreak()

    if (currentStreak >= 5) {
      return this.unlockAchievement('win_streak_5')
    }

    return null
  }

  /**
   * 現在の連勝数を取得
   * @returns 連勝数
   */
  private getCurrentWinStreak(): number {
    let streak = 0
    for (let i = this.gameHistory.length - 1; i >= 0; i--) {
      if (this.gameHistory[i].won) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  /**
   * 実績をアンロック
   * @param achievementId 実績ID
   * @returns アンロックした実績またはnull
   */
  private unlockAchievement(achievementId: string): Achievement | null {
    const achievement = this.achievements.find(a => a.id === achievementId)
    if (achievement && !achievement.isUnlocked) {
      achievement.isUnlocked = true
      achievement.unlockedAt = new Date().toISOString()
      return achievement
    }
    return null
  }

  /**
   * 全実績を取得
   * @returns 実績配列
   */
  public getAllAchievements(): Achievement[] {
    return [...this.achievements]
  }

  /**
   * アンロック済み実績を取得
   * @returns アンロック済み実績配列
   */
  public getUnlockedAchievements(): Achievement[] {
    return this.achievements.filter(a => a.isUnlocked)
  }

  /**
   * 実績の進捗率を取得
   * @returns 進捗率（0-1）
   */
  public getProgress(): number {
    const unlockedCount = this.achievements.filter(a => a.isUnlocked).length
    return unlockedCount / this.achievements.length
  }

  /**
   * データをリセット
   */
  public reset(): void {
    this.achievements.forEach(achievement => {
      achievement.isUnlocked = false
      delete achievement.unlockedAt
    })
    this.gameHistory = []
  }

  /**
   * データを復元
   * @param data 保存データ
   */
  public restore(data: { achievements: Achievement[], gameHistory: AchievementGameResult[] }): void {
    if (data.achievements) {
      this.achievements = data.achievements
    }
    if (data.gameHistory) {
      this.gameHistory = data.gameHistory
    }
  }

  /**
   * データを取得
   * @returns 保存用データ
   */
  public getData(): { achievements: Achievement[], gameHistory: AchievementGameResult[] } {
    return {
      achievements: this.achievements,
      gameHistory: this.gameHistory
    }
  }
}