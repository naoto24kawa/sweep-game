import type { GameUI } from './GameUI'

export class EventManager {
  private gameUI: GameUI
  
  // Game.tsからアクセスされるコールバックプロパティ
  public restartCallback?: () => void
  public showLevelSelectorCallback?: () => void

  constructor(gameUI: GameUI, restartFunction: () => void, showLevelSelectorFunction?: () => void) {
    this.gameUI = gameUI
    
    // 初期設定
    this.restartCallback = restartFunction
    this.showLevelSelectorCallback = showLevelSelectorFunction
  }

  setupKeyboardControls(): void {
    console.log('🎮 EventManager: Setting up keyboard controls')
    document.addEventListener('keydown', (event) => {
      console.log('⌨️ KeyDown event:', { code: event.code, key: event.key })
      switch (event.code) {
        case 'F5':
          event.preventDefault()
          console.log('🔄 F5 pressed, restartCallback:', !!this.restartCallback)
          if (this.restartCallback) {
            console.log('🔄 Executing restart callback')
            this.restartCallback()
          } else {
            console.warn('⚠️ No restart callback available')
          }
          break
        case 'Escape':
          event.preventDefault()
          console.log('🚪 Escape pressed')
          break
        case 'KeyS':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            console.log('📊 Ctrl+S pressed - toggling stats panel')
            this.gameUI.toggleStatsPanel()
          }
          break
        case 'KeyL':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            console.log('📋 Ctrl+L pressed, showLevelSelectorCallback:', !!this.showLevelSelectorCallback)
            if (this.showLevelSelectorCallback) {
              console.log('📋 Executing level selector callback')
              this.showLevelSelectorCallback()
            } else {
              console.warn('⚠️ No level selector callback available')
            }
          }
          break
      }
    })
  }
}