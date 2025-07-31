import { GameLogic } from '@/game/GameLogic'
import { GameRenderer } from '@/renderer/GameRenderer'
import { GameUI } from '@/ui/GameUI'
import { DOMHandler } from '@/ui/DOMHandler'
import { EventManager } from '@/ui/EventManager'
import { GameStateWatcher } from '@/game/GameStateWatcher'
import { SoundManager } from '@/audio/SoundManager'
import { StatsManager } from '@/stats/StatsManager'
import { SettingsManager } from '@/settings/SettingsManager'
import { PerformanceMonitor } from '@/performance/PerformanceMonitor'
import { LevelSelector } from '@/ui/LevelSelector'
import { StatsModal } from '@/ui/StatsModal'
import { Difficulty, DIFFICULTY_CONFIGS } from '@/types'

export class Game {
  private gameLogic: GameLogic
  private renderer: GameRenderer
  private gameUI!: GameUI
  private domHandler: DOMHandler
  private eventManager!: EventManager
  private gameStateWatcher!: GameStateWatcher
  private soundManager: SoundManager
  private statsManager: StatsManager
  private settingsManager: SettingsManager
  private performanceMonitor: PerformanceMonitor
  private levelSelector!: LevelSelector
  private statsModal!: StatsModal
  private container: HTMLElement
  private currentDifficulty: Difficulty
  private isInitialized = false

  constructor(container: HTMLElement, difficulty: Difficulty = Difficulty.NOVICE) {
    this.container = container
    this.currentDifficulty = difficulty
    const config = DIFFICULTY_CONFIGS[difficulty]
    
    this.domHandler = new DOMHandler(container)
    this.settingsManager = new SettingsManager()
    this.statsManager = new StatsManager()
    this.soundManager = new SoundManager()
    this.performanceMonitor = new PerformanceMonitor()
    this.gameLogic = new GameLogic(config)
    this.renderer = new GameRenderer(this.gameLogic, this.soundManager)
    
    this.initializeAsync()
  }

  private async initializeAsync(): Promise<void> {
    console.log('Game initializeAsync start')
    
    await this.initializeRenderer()
    await this.initializeUI()
    this.initializeLevelSelector()
    this.initializeStatsModal()
    this.initializeEventHandlers()
    this.initializeGameStateWatcher()
    this.applySettings()
    this.finalizeInitialization()
    
    this.isInitialized = true
    console.log('Game initialization complete')
    
    // 少し遅延してからレベル選択画面を表示
    setTimeout(() => {
      console.log('🎯 About to show level selector...')
      this.showLevelSelector()
    }, 100)
  }

  private async initializeRenderer(): Promise<void> {
    await this.renderer.waitForReady()
    console.log('Renderer ready')
    
    const canvas = this.renderer.getCanvas()
    console.log('🖼️ Canvas size:', { width: canvas.width, height: canvas.height })
    console.log('🎬 Stage size:', { width: this.renderer.getApp().screen.width, height: this.renderer.getApp().screen.height })
    
    this.domHandler.setupCanvas(canvas)
  }

  private async initializeUI(): Promise<void> {
    console.log('Creating GameUI')
    const stage = this.renderer.getApp().stage
    this.gameUI = new GameUI(stage, this.gameLogic, this.statsManager, this.settingsManager)
  }

  private initializeLevelSelector(): void {
    console.log('Creating LevelSelector')
    const stage = this.renderer.getApp().stage
    const app = this.renderer.getApp()
    this.levelSelector = new LevelSelector(stage, {
      onLevelSelect: (difficulty: Difficulty) => this.handleLevelSelection(difficulty),
      onClose: () => this.handleLevelSelectorClose(),
      canvasWidth: app.screen.width,
      canvasHeight: app.screen.height
    })
  }

  private initializeStatsModal(): void {
    console.log('Creating StatsModal')
    const stage = this.renderer.getApp().stage
    const app = this.renderer.getApp()
    this.statsModal = new StatsModal(stage, this.statsManager, this.gameLogic, {
      onClose: () => this.handleStatsModalClose(),
      onRestart: () => this.handleStatsModalRestart(),
      onLevelSelect: () => this.handleStatsModalLevelSelect(),
      canvasWidth: app.screen.width,
      canvasHeight: app.screen.height
    })
  }

  private initializeEventHandlers(): void {
    this.eventManager = new EventManager(
      this.gameUI, 
      () => this.restart(),
      () => this.showLevelSelector()
    )
    this.eventManager.setupKeyboardControls()
  }

  private initializeGameStateWatcher(): void {
    this.gameStateWatcher = new GameStateWatcher(
      this.gameLogic, 
      this.soundManager, 
      this.statsManager, 
      this.renderer,
      {
        onGameSuccess: () => this.showStatsModal(),
        onGameFailed: () => {
          // 失敗時は特に何もしない（将来的に失敗時の処理があれば追加）
        }
      }
    )
    this.gameStateWatcher.startWatching()
  }

  private finalizeInitialization(): void {
    console.log('Setting up renderer event handlers')
    this.renderer.setupEventHandlers()
  }



  private applySettings(): void {
    const settings = this.settingsManager.getSettings()
    
    this.soundManager.setEnabled(settings.audio.enabled)
    this.soundManager.setMasterVolume(settings.audio.masterVolume)
  }


  public restart(): void {
    this.gameLogic.reset()
    this.renderer.updateDisplay()
  }

  private handleLevelSelection(difficulty: Difficulty): void {
    console.log('Level selected:', difficulty)
    if (difficulty !== this.currentDifficulty) {
      this.changeDifficulty(difficulty)
    }
  }

  private handleLevelSelectorClose(): void {
    console.log('Level selector closed')
    // レベルが選択されていない場合のデフォルトの動作は特に設定しない
  }

  private handleStatsModalClose(): void {
    console.log('Stats modal closed')
  }

  private handleStatsModalRestart(): void {
    console.log('Stats modal restart requested')
    this.restart()
  }

  private handleStatsModalLevelSelect(): void {
    console.log('Stats modal level select requested')
    this.showLevelSelector()
  }

  public showLevelSelector(): void {
    if (this.levelSelector && this.isInitialized) {
      this.levelSelector.show()
    }
  }

  public showStatsModal(): void {
    if (this.statsModal && this.isInitialized) {
      this.statsModal.show()
    }
  }

  public async changeDifficulty(difficulty: Difficulty): Promise<void> {
    console.log('Changing difficulty to:', difficulty)
    this.currentDifficulty = difficulty
    await this.cleanupCurrentGame()
    await this.initializeWithDifficulty(difficulty)
  }

  private async cleanupCurrentGame(): Promise<void> {
    if (this.gameStateWatcher) {
      this.gameStateWatcher.stopWatching()
    }
    this.renderer.destroy()
    this.gameUI.destroy()
    if (this.levelSelector) {
      this.levelSelector.destroy()
    }
    if (this.statsModal) {
      this.statsModal.destroy()
    }
    this.domHandler.clearContainer()
  }

  private async initializeWithDifficulty(difficulty: Difficulty): Promise<void> {
    const config = DIFFICULTY_CONFIGS[difficulty]
    this.gameLogic = new GameLogic(config)
    this.renderer = new GameRenderer(this.gameLogic, this.soundManager)
    
    await this.initializeRenderer()
    await this.initializeUI()
    this.initializeLevelSelector()
    this.initializeStatsModal()
    this.initializeGameStateWatcher()
    this.finalizeInitialization()
  }

  public getGameLogic(): GameLogic {
    return this.gameLogic
  }

  public getStatsManager(): StatsManager {
    return this.statsManager
  }

  public getSettingsManager(): SettingsManager {
    return this.settingsManager
  }

  public getSoundManager(): SoundManager {
    return this.soundManager
  }

  public destroy(): void {
    if (this.gameStateWatcher) {
      this.gameStateWatcher.stopWatching()
    }
    this.renderer.destroy()
    this.gameUI.destroy()
    if (this.levelSelector) {
      this.levelSelector.destroy()
    }
    if (this.statsModal) {
      this.statsModal.destroy()
    }
    this.soundManager.destroy()
    this.performanceMonitor.stop()
    
    // パフォーマンス情報表示を削除
    const perfDiv = document.getElementById('performance-info')
    if (perfDiv) {
      perfDiv.remove()
    }
    
    this.container.innerHTML = ''
  }
}