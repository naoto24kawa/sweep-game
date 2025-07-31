/**
 * 時間フォーマット専用クラス
 * 様々な時間表示形式の変換を担当
 */
export class TimeFormatter {
  /**
   * ミリ秒を MM:SS 形式にフォーマット
   * @param milliseconds ミリ秒
   * @returns フォーマットされた時間文字列
   */
  public static formatTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  /**
   * ミリ秒を HH:MM:SS 形式にフォーマット
   * @param milliseconds ミリ秒
   * @returns フォーマットされた時間文字列
   */
  public static formatDetailedTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
  }

  /**
   * ミリ秒を人間が読みやすい形式にフォーマット
   * @param milliseconds ミリ秒
   * @returns フォーマットされた時間文字列
   */
  public static formatHumanReadable(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000)
    
    if (totalSeconds < 60) {
      return `${totalSeconds}秒`
    } else if (totalSeconds < 3600) {
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      return seconds > 0 ? `${minutes}分${seconds}秒` : `${minutes}分`
    } else {
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60
      
      let result = `${hours}時間`
      if (minutes > 0) result += `${minutes}分`
      if (seconds > 0) result += `${seconds}秒`
      return result
    }
  }

  /**
   * 現在の日時を ISO 形式でフォーマット
   * @returns ISO形式の日時文字列
   */
  public static formatCurrentDateTime(): string {
    return new Date().toISOString()
  }

  /**
   * 日付を YYYY-MM-DD 形式でフォーマット
   * @param date 日付オブジェクト（省略時は現在日時）
   * @returns フォーマットされた日付文字列
   */
  public static formatDate(date?: Date): string {
    const d = date || new Date()
    const year = d.getFullYear()
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}