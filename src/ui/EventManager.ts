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
    document.addEventListener('keydown', (event) => {
      switch (event.code) {
        case 'F5':
          event.preventDefault()
          if (this.restartCallback) {
            this.restartCallback()
          }
          break
        case 'Escape':
          event.preventDefault()
          break
        case 'KeyS':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            this.gameUI.toggleStatsPanel()
          }
          break
        case 'KeyL':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            if (this.showLevelSelectorCallback) {
              this.showLevelSelectorCallback()
            }
          }
          break
      }
    })
  }
}