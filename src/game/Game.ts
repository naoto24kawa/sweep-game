import { GameLogic } from '@/game/GameLogic'
import { GameRendererRefactored as GameRenderer } from '@/renderer/GameRendererRefactored'
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
    // RendererのPixiJS初期化を待つ
    await this.renderer.waitForReady()
    
    console.log('Renderer ready, creating GameUI')
    const canvas = this.renderer.getCanvas()
    console.log('🖼️ Canvas size:', { width: canvas.width, height: canvas.height })
    console.log('🎬 Stage size:', { width: this.renderer.getApp().screen.width, height: this.renderer.getApp().screen.height })
    
    this.gameUI = new GameUI(this.renderer.getApp().stage, this.gameLogic, this.statsManager, this.settingsManager)
    
    this.domHandler.setupCanvas(this.renderer.getCanvas())
    
    this.eventManager = new EventManager(this.gameUI, () => this.restart())
    this.eventManager.setupKeyboardControls()
    
    this.gameStateWatcher = new GameStateWatcher(this.gameLogic, this.soundManager, this.statsManager, this.renderer)
    this.gameStateWatcher.startWatching()
    
    this.applySettings()
    
    // イベントハンドラーを最後に設定
    console.log('Setting up renderer event handlers')
    this.renderer.setupEventHandlers()
    console.log('Game initialization complete')
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
    this.renderer.destroy()
    this.gameUI.destroy()
    this.container.innerHTML = ''
    
    const config = DIFFICULTY_CONFIGS[difficulty]
    this.gameLogic = new GameLogic(config)
    this.renderer = new GameRenderer(this.gameLogic, this.soundManager)
    
    // RendererのPixiJS初期化を待つ
    await this.renderer.waitForReady()
    
    this.gameUI = new GameUI(this.renderer.getApp().stage, this.gameLogic, this.statsManager, this.settingsManager)
    
    this.domHandler.setupCanvas(this.renderer.getCanvas())
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