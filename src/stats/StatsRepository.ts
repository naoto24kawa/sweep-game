/**
 * 統計データの永続化専用クラス
 * LocalStorageとの入出力処理のみを担当
 */
export class StatsRepository {
  private readonly STORAGE_KEY = 'sweap-game-stats'

  /**
   * 統計データをLocalStorageから読み込み
   * @returns 統計データまたはnull
   */
  public loadStats(): any | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.warn('Failed to load stats from localStorage:', error)
      return null
    }
  }

  /**
   * 統計データをLocalStorageに保存
   * @param stats 統計データ
   */
  public saveStats(stats: any): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stats))
    } catch (error) {
      console.warn('Failed to save stats to localStorage:', error)
    }
  }

  /**
   * 統計データをクリア
   */
  public clearStats(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear stats from localStorage:', error)
    }
  }

  /**
   * ストレージが利用可能かチェック
   * @returns 利用可能な真偽値
   */
  public isStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }
}