/**
 * 統一エラーハンドリングシステム
 * アプリケーション全体でのエラー処理を一元化し、ユーザーフレンドリーなエラー表示を提供
 */

import { Logger } from './Logger'

export enum ErrorType {
  INITIALIZATION = 'INITIALIZATION',
  GAME_LOGIC = 'GAME_LOGIC',
  RENDERING = 'RENDERING',
  AUDIO = 'AUDIO',
  STORAGE = 'STORAGE',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN'
}

export interface ErrorContext {
  type: ErrorType
  component: string
  action: string
  userMessage?: string
  recoverable?: boolean
}

export class ErrorHandler {
  private static errorHistory: Array<{ timestamp: Date; context: ErrorContext; error: Error }> = []
  private static maxHistorySize = 50

  /**
   * エラーを処理し、適切なログ出力とユーザー通知を行う
   */
  static handle(error: Error, context: ErrorContext): void {
    // エラー履歴に追加
    this.addToHistory(error, context)

    // コンソールにエラーログを出力
    const errorMessage = `${context.component}: ${context.action} failed`
    Logger.error(errorMessage, error)

    // デバッグ情報を出力
    Logger.debug(`Error context: ${JSON.stringify(context)}`)

    // 回復可能なエラーの場合は警告として扱う
    if (context.recoverable) {
      Logger.warn(`Recoverable error in ${context.component}: ${context.action}`)
    }

    // ユーザー向けメッセージが指定されている場合は表示
    if (context.userMessage) {
      this.showUserMessage(context.userMessage, context.type)
    }
  }

  /**
   * 重大なエラーを処理（アプリケーション停止を伴う可能性あり）
   */
  static handleCritical(error: Error, context: ErrorContext): void {
    Logger.error(`CRITICAL ERROR in ${context.component}: ${context.action}`, error)
    
    // 重大なエラーの場合は必ずユーザーに通知
    const userMessage = context.userMessage || 'アプリケーションで重大なエラーが発生しました。ページを再読み込みしてください。'
    this.showUserMessage(userMessage, context.type, true)
    
    this.addToHistory(error, { ...context, recoverable: false })
  }

  /**
   * 警告レベルのエラーを処理
   */
  static handleWarning(message: string, context: Partial<ErrorContext> = {}): void {
    const fullContext: ErrorContext = {
      type: ErrorType.UNKNOWN,
      component: 'Unknown',
      action: 'Unknown',
      recoverable: true,
      ...context
    }

    Logger.warn(`${fullContext.component}: ${message}`)
    
    if (fullContext.userMessage) {
      this.showUserMessage(fullContext.userMessage, fullContext.type)
    }
  }

  /**
   * 非同期操作のエラーをキャッチして処理
   */
  static async wrapAsync<T>(
    asyncFn: () => Promise<T>,
    context: ErrorContext
  ): Promise<T | null> {
    try {
      return await asyncFn()
    } catch (error) {
      this.handle(error as Error, context)
      return null
    }
  }

  /**
   * 同期操作のエラーをキャッチして処理
   */
  static wrapSync<T>(
    syncFn: () => T,
    context: ErrorContext
  ): T | null {
    try {
      return syncFn()
    } catch (error) {
      this.handle(error as Error, context)
      return null
    }
  }

  /**
   * エラー履歴を取得
   */
  static getErrorHistory(): Array<{ timestamp: Date; context: ErrorContext; error: Error }> {
    return [...this.errorHistory]
  }

  /**
   * エラー履歴をクリア
   */
  static clearHistory(): void {
    this.errorHistory = []
  }

  /**
   * エラー履歴に追加
   */
  private static addToHistory(error: Error, context: ErrorContext): void {
    this.errorHistory.push({
      timestamp: new Date(),
      context,
      error
    })

    // 履歴サイズを制限
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift()
    }
  }

  /**
   * ユーザーにエラーメッセージを表示
   */
  private static showUserMessage(message: string, _type: ErrorType, isCritical = false): void {
    // 開発環境では常にアラートで表示
    if ((import.meta as any).env?.DEV) {
      const prefix = isCritical ? '[CRITICAL] ' : '[ERROR] '
      console.warn(`${prefix}${message}`)
      return
    }

    // プロダクション環境では、重大なエラーのみアラート表示
    if (isCritical) {
      alert(message)
    }
  }

  /**
   * コンポーネント固有のエラーハンドラーを作成
   */
  static createComponentHandler(component: string) {
    return {
      handle: (error: Error, action: string, errorType: ErrorType = ErrorType.UNKNOWN, userMessage?: string) => {
        this.handle(error, {
          type: errorType,
          component,
          action,
          userMessage,
          recoverable: true
        })
      },
      
      handleCritical: (error: Error, action: string, errorType: ErrorType = ErrorType.UNKNOWN, userMessage?: string) => {
        this.handleCritical(error, {
          type: errorType,
          component,
          action,
          userMessage,
          recoverable: false
        })
      },
      
      warn: (message: string, userMessage?: string) => {
        this.handleWarning(message, {
          component,
          userMessage
        })
      }
    }
  }
}