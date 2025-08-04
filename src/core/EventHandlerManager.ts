/**
 * イベントハンドリング専用クラス
 * Game.tsの複雑なコールバック管理を分離し、単一責任原則を維持
 */

import { Difficulty } from '@/types'
import { Logger } from './Logger'
import { LevelSelector } from '@/ui/LevelSelector'
import { StatsModal } from '@/ui/StatsModal'
import { EventManager } from '@/ui/EventManager'
import { GameStateWatcher } from '@/game/GameStateWatcher'

export interface GameComponents {
  levelSelector: LevelSelector
  statsModal: StatsModal
  eventManager: EventManager
  gameStateWatcher: GameStateWatcher
  uiCoordinator?: any
}

export interface EventHandlerCallbacks {
  onLevelSelect: (difficulty: Difficulty) => void
  onLevelSelectorClose: () => void
  onStatsModalClose: () => void
  onStatsModalRestart: () => void
  onStatsModalLevelSelect: () => void
  onRestart: () => void
  onShowLevelSelector: () => void
  onGameSuccess: () => void
  onGameFailed: () => void
}

export class EventHandlerManager {
  private components: GameComponents | null = null
  private callbacks: EventHandlerCallbacks

  constructor(callbacks: EventHandlerCallbacks) {
    this.callbacks = callbacks
  }

  /**
   * コンポーネントを設定してイベントハンドラーを接続
   */
  setupEventHandlers(components: GameComponents): void {
    Logger.debug('EventHandlerManager: Setting up event handlers')
    
    this.components = components
    
    // UIコーディネーターが新しく作成された場合は更新
    if (components.uiCoordinator && components.uiCoordinator !== this.components?.uiCoordinator) {
      Logger.debug('EventHandlerManager: Updating UI coordinator reference')
      this.components.uiCoordinator = components.uiCoordinator
    }
    
    // 各コンポーネントのコールバックを設定
    this.setupLevelSelectorCallbacks(components.levelSelector)
    this.setupStatsModalCallbacks(components.statsModal)
    this.setupEventManagerCallbacks(components.eventManager)
    this.setupGameStateWatcherCallbacks(components.gameStateWatcher)
  }

  /**
   * レベル選択関連のコールバックを設定
   */
  private setupLevelSelectorCallbacks(levelSelector: LevelSelector): void {
    levelSelector.setOnLevelSelect((difficulty: Difficulty) => {
      Logger.debug(`EventHandlerManager: Level selected: ${difficulty}`)
      this.callbacks.onLevelSelect(difficulty)
    })
    
    levelSelector.setOnClose(() => {
      Logger.debug('EventHandlerManager: Level selector close requested')
      this.callbacks.onLevelSelectorClose()
    })
  }

  /**
   * 統計モーダル関連のコールバックを設定
   */
  private setupStatsModalCallbacks(statsModal: StatsModal): void {
    statsModal.updateCallbacks({
      onClose: () => {
        Logger.debug('EventHandlerManager: Stats modal close requested')
        this.callbacks.onStatsModalClose()
      },
      onRestart: () => {
        Logger.debug('EventHandlerManager: Stats modal restart requested')
        this.callbacks.onStatsModalRestart()
      },
      onLevelSelect: () => {
        Logger.debug('EventHandlerManager: Stats modal level select requested')
        this.callbacks.onStatsModalLevelSelect()
      }
    })
  }

  /**
   * イベントマネージャー関連のコールバックを設定
   */
  private setupEventManagerCallbacks(eventManager: EventManager): void {
    eventManager.restartCallback = () => {
      Logger.debug('EventHandlerManager: Event manager restart requested')
      this.callbacks.onRestart()
    }
    
    eventManager.showLevelSelectorCallback = () => {
      Logger.debug('EventHandlerManager: Event manager level selector show requested')
      this.callbacks.onShowLevelSelector()
    }
  }

  /**
   * ゲーム状態監視関連のコールバックを設定
   */
  private setupGameStateWatcherCallbacks(gameStateWatcher: GameStateWatcher): void {
    gameStateWatcher.updateCallbacks({
      onGameSuccess: () => {
        Logger.debug('EventHandlerManager: Game success detected, calling showStatsModal')
        this.callbacks.onGameSuccess()
      },
      onGameFailed: () => {
        Logger.debug('EventHandlerManager: Game failure detected, calling showStatsModal')
        this.callbacks.onGameFailed()
      }
    })
  }

  /**
   * コールバックを更新
   */
  updateCallbacks(newCallbacks: Partial<EventHandlerCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...newCallbacks }
    
    // 既にコンポーネントが設定されている場合は再設定
    if (this.components) {
      this.setupEventHandlers(this.components)
    }
  }

  /**
   * 現在のコンポーネント参照を取得
   */
  getComponents(): GameComponents | null {
    return this.components
  }
}