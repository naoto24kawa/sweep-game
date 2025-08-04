/**
 * ゲーム全体の状態フラグを管理するシングルトンクラス
 * レベル変更中などの一時的な状態を追跡
 */
export class GameStateFlags {
  private static instance: GameStateFlags | null = null
  private isLevelChanging = false

  private constructor() {}

  public static getInstance(): GameStateFlags {
    if (!GameStateFlags.instance) {
      GameStateFlags.instance = new GameStateFlags()
    }
    return GameStateFlags.instance
  }

  /**
   * レベル変更状態を設定
   */
  /**
   * レベル変更状態を設定
   */
  public setLevelChanging(isChanging: boolean): void {
    const stack = new Error().stack?.split('\n')[2]?.trim() || 'unknown'
    console.log(`🏗️ GameStateFlags: Level changing state: ${this.isLevelChanging} → ${isChanging} (called from: ${stack})`)
    this.isLevelChanging = isChanging
  }

  /**
   * レベル変更中かどうかを取得
   */
  public isLevelChangingActive(): boolean {
    return this.isLevelChanging
  }

  /**
   * すべての状態をリセット
   */
  public reset(): void {
    this.isLevelChanging = false
  }
}