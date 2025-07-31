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
  private container: HTMLElement

  constructor(container: HTMLElement, difficulty: Difficulty = Difficulty.NOVICE) {
    this.container = container
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
    this.initializeEventHandlers()
    this.initializeGameStateWatcher()
    this.applySettings()
    this.finalizeInitialization()
    
    console.log('Game initialization complete')
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

  private initializeEventHandlers(): void {
    this.eventManager = new EventManager(this.gameUI, () => this.restart())
    this.eventManager.setupKeyboardControls()
  }

  private initializeGameStateWatcher(): void {
    this.gameStateWatcher = new GameStateWatcher(
      this.gameLogic, 
      this.soundManager, 
      this.statsManager, 
      this.renderer
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

  public async changeDifficulty(difficulty: Difficulty): Promise<void> {
    await this.cleanupCurrentGame()
    await this.initializeWithDifficulty(difficulty)
  }

  private async cleanupCurrentGame(): Promise<void> {
    this.renderer.destroy()
    this.gameUI.destroy()
    this.domHandler.clearContainer()
  }

  private async initializeWithDifficulty(difficulty: Difficulty): Promise<void> {
    const config = DIFFICULTY_CONFIGS[difficulty]
    this.gameLogic = new GameLogic(config)
    this.renderer = new GameRenderer(this.gameLogic, this.soundManager)
    
    await this.initializeRenderer()
    await this.initializeUI()
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
    this.renderer.destroy()
    this.gameUI.destroy()
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