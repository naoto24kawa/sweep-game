/**
 * 統一ログ管理システム
 * アプリケーション全体でのログ出力を標準化し、プロダクション環境での制御を可能にする
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

export class Logger {
  private static level: LogLevel = LogLevel.INFO
  private static isDevelopment = (import.meta as any).env?.DEV || false

  /**
   * ログレベルを設定
   */
  static setLevel(level: LogLevel): void {
    this.level = level
  }

  /**
   * 開発時のみ表示されるデバッグログ
   */
  static debug(message: string, data?: any): void {
    if (this.level <= LogLevel.DEBUG && this.isDevelopment) {
      console.log(`🔧 [DEBUG] ${message}`, data ? data : '')
    }
  }

  /**
   * 一般的な情報ログ
   */
  static info(message: string, data?: any): void {
    if (this.level <= LogLevel.INFO) {
      console.log(`ℹ️ [INFO] ${message}`, data ? data : '')
    }
  }

  /**
   * 警告ログ
   */
  static warn(message: string, data?: any): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`⚠️ [WARN] ${message}`, data ? data : '')
    }
  }

  /**
   * エラーログ
   */
  static error(message: string, error?: Error | any): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`❌ [ERROR] ${message}`, error ? error : '')
    }
  }

  /**
   * ゲーム固有のログ出力
   */
  static game(message: string, data?: any): void {
    if (this.level <= LogLevel.INFO) {
      console.log(`🎮 [GAME] ${message}`, data ? data : '')
    }
  }

  /**
   * パフォーマンス関連のログ出力
   */
  static performance(message: string, data?: any): void {
    if (this.level <= LogLevel.DEBUG && this.isDevelopment) {
      console.log(`⚡ [PERF] ${message}`, data ? data : '')
    }
  }

  /**
   * UI関連のログ出力
   */
  static ui(message: string, data?: any): void {
    if (this.level <= LogLevel.DEBUG && this.isDevelopment) {
      console.log(`🖥️ [UI] ${message}`, data ? data : '')
    }
  }
}