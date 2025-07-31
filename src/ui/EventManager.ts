import type { GameUI } from './GameUI'

export class EventManager {
  private gameUI: GameUI
  private restartFunction: () => void
  private showLevelSelectorFunction?: () => void

  constructor(gameUI: GameUI, restartFunction: () => void, showLevelSelectorFunction?: () => void) {
    this.gameUI = gameUI
    this.restartFunction = restartFunction
    this.showLevelSelectorFunction = showLevelSelectorFunction
  }

  setupKeyboardControls(): void {
    document.addEventListener('keydown', (event) => {
      switch (event.code) {
        case 'F5':
          event.preventDefault()
          this.restartFunction()
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
            if (this.showLevelSelectorFunction) {
              this.showLevelSelectorFunction()
            }
          }
          break
      }
    })
  }
}