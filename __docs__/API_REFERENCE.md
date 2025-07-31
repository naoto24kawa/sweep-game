# SWEEP Game - API リファレンス

## 目次
- [Game](#game-class)
- [GameLogic](#gamelogic-class)  
- [ServiceContainer](#servicecontainer-class)
- [GameRenderer](#gamerenderer-class)
- [アニメーションシステム](#animation-system)
- [設定システム](#settings-system)
- [統計システム](#stats-system)

---

## Game Class

メインゲームクラス。アプリケーション全体のライフサイクルを管理。

```typescript
class Game {
  constructor(container: HTMLElement, difficulty?: Difficulty)
  public start(): Promise<void>
  public restart(): void
  public pause(): void
  public resume(): void
  public destroy(): void
}
```

### 使用例
```typescript
const app = document.getElementById('app')
const game = new Game(app, Difficulty.NOVICE)
await game.start()
```

---

## GameLogic Class

ピュアなマインスイーパーロジックを実装。

```typescript
class GameLogic {
  constructor(difficulty: Difficulty)
  
  // セル操作
  public revealCell(x: number, y: number): boolean
  public toggleFlag(x: number, y: number): boolean
  
  // 状態取得
  public getGameState(): GameState
  public getCells(): Cell[][]
  public getConfig(): GameConfig
  public getStats(): GameStats
  public getRemainingMines(): number
  
  // ゲーム制御
  public reset(): void
  public pause(): void
  public resume(): void
}
```

### Cell インターフェース
```typescript
interface Cell {
  x: number
  y: number
  state: CellState
  isMine: boolean
  adjacentMines: number
  id: string
}
```

### CellState 列挙型
```typescript
enum CellState {
  HIDDEN = 'HIDDEN',
  REVEALED = 'REVEALED',
  FLAGGED = 'FLAGGED',
  QUESTIONED = 'QUESTIONED'
}
```

### 使用例
```typescript
const gameLogic = new GameLogic(Difficulty.AGENT)

// セルを開く
const wasRevealed = gameLogic.revealCell(3, 5)

// フラグを切り替え
const wasToggled = gameLogic.toggleFlag(2, 4)

// ゲーム状態を確認
if (gameLogic.getGameState() === GameState.SUCCESS) {
  console.log('ゲームクリア！')
}
```

---

## ServiceContainer Class

依存性注入コンテナ。サービスの登録・解決を管理。

```typescript
class ServiceContainer {
  // サービス登録
  public registerSingleton<T>(key: ServiceKey, factory: ServiceFactory<T>): void
  public registerTransient<T>(key: ServiceKey, factory: ServiceFactory<T>): void
  public registerInstance<T>(key: ServiceKey, instance: T): void
  
  // サービス解決
  public resolve<T>(key: ServiceKey): T
  public safeResolve<T>(key: ServiceKey, resolving?: Set<ServiceKey>): T
  
  // 管理
  public has(key: ServiceKey): boolean
  public unregister(key: ServiceKey): void
  public clear(): void
}
```

### ServiceKeys 定数
```typescript
const ServiceKeys = {
  GAME_LOGIC: Symbol('GameLogic'),
  GAME_RENDERER: Symbol('GameRenderer'),
  SOUND_MANAGER: Symbol('SoundManager'),
  STATS_MANAGER: Symbol('StatsManager'),
  SETTINGS_MANAGER: Symbol('SettingsManager'),
  PERFORMANCE_MONITOR: Symbol('PerformanceMonitor')
} as const
```

### 使用例
```typescript
const container = new ServiceContainer()

// サービス登録
container.registerSingleton(ServiceKeys.GAME_LOGIC, () => {
  return new GameLogic(Difficulty.NOVICE)
})

// サービス解決
const gameLogic = container.resolve<GameLogic>(ServiceKeys.GAME_LOGIC)
```

---

## GameRenderer Class

レンダリングシステムの統合管理クラス。

```typescript
class GameRendererRefactored {
  constructor(gameLogic: GameLogic, soundManager?: SoundManager)
  
  // 初期化
  public async waitForReady(): Promise<void>
  public isReady(): boolean
  
  // イベント
  public setupEventHandlers(): void
  
  // 表示
  public updateDisplay(): void
  
  // リソース
  public getCanvas(): HTMLCanvasElement
  public getApp(): PIXI.Application
  public destroy(): void
}
```

### 使用例
```typescript
const renderer = new GameRendererRefactored(gameLogic, soundManager)
await renderer.waitForReady()

document.body.appendChild(renderer.getCanvas())
renderer.setupEventHandlers()
```

---

## Animation System

### TweenEngine Class

基本的なトゥイーンエンジン。

```typescript
class TweenEngine {
  public startTween(
    target: PIXI.Container,
    endValues: Record<string, number>,
    duration: number,
    easing?: (t: number) => number,
    onComplete?: () => void
  ): string
  
  public stopTween(id: string): void
  public stopAllTweensForTarget(target: PIXI.Container): void
  public stopAllTweens(): void
  public getActiveTweenCount(): number
}
```

### EasingFunctions Class

イージング関数群。

```typescript
class EasingFunctions {
  static linear(t: number): number
  static easeInQuad(t: number): number
  static easeOutQuad(t: number): number
  static easeInOutQuad(t: number): number
  static easeOutBack(t: number): number
  static easeOutBounce(t: number): number
  static easeOutElastic(t: number): number
}
```

### HighLevelAnimations Class

高レベルアニメーションAPI。

```typescript
class HighLevelAnimations {
  public fadeIn(target: PIXI.Container, duration: number, onComplete?: () => void): string
  public fadeOut(target: PIXI.Container, duration: number, onComplete?: () => void): string
  public scaleUp(target: PIXI.Container, duration: number, onComplete?: () => void): string
  public bounce(target: PIXI.Container, duration: number, onComplete?: () => void): string
  public pulse(target: PIXI.Container, intensity: number, duration: number, onComplete?: () => void): string
  public shake(target: PIXI.Container, intensity: number, duration: number, onComplete?: () => void): string
  public spinFadeOut(target: PIXI.Container, duration: number, onComplete?: () => void): string
  public stop(target: PIXI.Container): void
  public stopAll(): void
}
```

### 使用例
```typescript
// 基本的なトゥイーン
const tweenId = tweenEngine.startTween(
  myContainer,
  { x: 100, y: 50, alpha: 0.5 },
  1000,
  EasingFunctions.easeOutBack
)

// 高レベルアニメーション
animations.bounce(cellContainer, 400, () => {
  console.log('バウンス完了！')
})

animations.pulse(button, 0.1, 2000)
```

---

## Settings System

### SettingsManager Class

ユーザー設定の管理。

```typescript
class SettingsManager {
  constructor()
  
  // 設定取得・更新
  public getSettings(): GameSettings
  public updateAudioSettings(audioSettings: Partial<GameSettings['audio']>): void
  public updateGameplaySettings(gameplaySettings: Partial<GameSettings['gameplay']>): void
  
  // イベント
  public on(event: string, callback: (settings: GameSettings) => void): void
  public off(event: string, callback: (settings: GameSettings) => void): void
  
  // リセット
  public resetToDefaults(): void
}
```

### GameSettings インターフェース
```typescript
interface GameSettings {
  audio: {
    enabled: boolean
    masterVolume: number
  }
  gameplay: {
    showTimer: boolean
    showMineCount: boolean
    firstClickSafe: boolean
  }
}
```

### 使用例
```typescript
const settings = new SettingsManager()

// 設定更新
settings.updateAudioSettings({ masterVolume: 0.8 })

// 設定変更の監視
settings.on('settingsChanged', (newSettings) => {
  console.log('設定が変更されました:', newSettings)
})
```

---

## Stats System

### StatsManager Class

統計データの管理。

```typescript
class StatsManager {
  constructor(settingsManager: SettingsManager)
  
  // 統計取得
  public getOverallStats(): OverallStats
  public getDifficultyStats(difficulty: Difficulty): DifficultyStats
  public getBestTimes(): BestTimes
  public getAchievements(): Achievement[]
  
  // ゲーム記録
  public recordGameStart(difficulty: Difficulty): void
  public recordGameEnd(result: GameResult): void
  
  // リセット
  public resetStats(): void
  public resetDifficultyStats(difficulty: Difficulty): void
}
```

### OverallStats インターフェース
```typescript
interface OverallStats {
  totalGames: number
  totalWins: number
  totalTime: number
  winRate: number
  averageTime: number
  currentStreak: number
  bestStreak: number
}
```

### GameResult インターフェース
```typescript
interface GameResult {
  won: boolean
  time: number
  difficulty: Difficulty
  date: string
  flagsUsed: number
  cellsRevealed: number
}
```

### 使用例
```typescript
const statsManager = new StatsManager(settingsManager)

// ゲーム開始記録
statsManager.recordGameStart(Difficulty.AGENT)

// ゲーム終了記録
statsManager.recordGameEnd({
  won: true,
  time: 85000,
  difficulty: Difficulty.AGENT,
  date: new Date().toISOString(),
  flagsUsed: 38,
  cellsRevealed: 216
})

// 統計取得
const stats = statsManager.getOverallStats()
console.log(`勝率: ${(stats.winRate * 100).toFixed(1)}%`)
```

---

## TimeFormatter Class

時間フォーマットユーティリティ。

```typescript
class TimeFormatter {
  static formatTime(milliseconds: number): string
  static formatDetailedTime(milliseconds: number): string
  static formatHumanReadable(milliseconds: number): string
  static formatCurrentDateTime(): string
  static formatDate(date?: Date): string
}
```

### 使用例
```typescript
const time = 125000 // 2分5秒

console.log(TimeFormatter.formatTime(time))           // "02:05"
console.log(TimeFormatter.formatDetailedTime(time))   // "02:05"
console.log(TimeFormatter.formatHumanReadable(time))  // "2分5秒"
```

---

## 定数とタイプ

### DIFFICULTY_CONFIGS
```typescript
const DIFFICULTY_CONFIGS: Record<Difficulty, GameConfig> = {
  [Difficulty.NOVICE]: { width: 9, height: 9, mines: 10 },
  [Difficulty.AGENT]: { width: 16, height: 16, mines: 40 },
  [Difficulty.HACKER]: { width: 30, height: 16, mines: 99 }
}
```

### RENDER_CONSTANTS
```typescript
const RENDER_CONSTANTS = {
  CELL: {
    SIZE: 32,
    SPACING: 2,
    BORDER_WIDTH: 1,
    CORNER_RADIUS: 2
  },
  ANIMATION: {
    REVEAL_DURATION: 200,
    FLAG_DURATION: 150,
    BOUNCE_DURATION: 400,
    FADE_DURATION: 300
  },
  EFFECTS: {
    PULSE_INTENSITY: 0.05,
    PULSE_DURATION: 2000,
    SHAKE_INTENSITY: 15,
    SHAKE_DURATION: 500
  }
} as const
```

### NEON_COLORS
```typescript
const NEON_COLORS = {
  numbers: {
    1: '#00ffff', 2: '#00ff41', 3: '#ffff00', 4: '#bf00ff',
    5: '#ff00bf', 6: '#ff9500', 7: '#80ff00', 8: '#ff0040'
  },
  primary: { darkGray: '#1a1a1a', deepBlack: '#0d0d0d' },
  accent: { neonBlue: '#00ffff', neonGreen: '#00ff41' },
  warning: { neonRed: '#ff0040', neonOrange: '#ff9500' },
  text: { white: '#ffffff', lightGray: '#cccccc' }
}
```