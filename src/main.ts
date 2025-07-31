import { Game } from '@/game/Game'
import { Difficulty } from '@/types'

function init() {
  console.log('Initializing SWEAP Game')
  const app = document.getElementById('app')
  console.log('App container:', app)
  
  if (!app) {
    console.error('App container not found')
    return
  }

  console.log('Creating Game instance')
  const game = new Game(app, Difficulty.NOVICE)

  console.log('SWEAP Game initialized')
  console.log('Controls:')
  console.log('- Left click: Reveal cell')
  console.log('- Right click: Toggle flag')
  console.log('- F5: Restart game')

  ;(window as typeof window & { game?: Game }).game = game
  console.log('Game instance attached to window.game')
}

document.addEventListener('DOMContentLoaded', init)