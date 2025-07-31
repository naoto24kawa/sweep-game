import { Game } from '@/game/Game'
import { Difficulty, GameInitializationError } from '@/types'

async function initializeGame(): Promise<void> {
  try {
    const appContainer = document.getElementById('app')
    if (!appContainer) {
      throw new GameInitializationError('App container element not found', 'CONTAINER_NOT_FOUND')
    }

    const game = new Game(appContainer, Difficulty.NOVICE)
    
    setupGlobalErrorHandlers(game)
    setupGameGlobals(game)
    logGameInstructions()
    
  } catch (error) {
    handleGameInitializationFailure(error)
  }
}

function setupGlobalErrorHandlers(game: Game): void {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    handleCriticalError(game, event.reason)
  })

  window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error)
    handleCriticalError(game, event.error)
  })
}

function setupGameGlobals(game: Game): void {
  // TypeScript-safe global assignment
  (window as any).game = game
}

function logGameInstructions(): void {
  console.log('🎮 SWEEP Game initialized successfully')
  console.log('📋 Controls:')
  console.log('  • Left click: Reveal cell')
  console.log('  • Right click: Toggle flag')
  console.log('  • F5: Restart game')
  console.log('🎯 Access game instance via window.game')
}

function handleGameInitializationFailure(error: unknown): void {
  const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error'
  const errorCode = error instanceof GameInitializationError ? error.code : 'UNKNOWN_ERROR'
  
  console.error(`❌ Game initialization failed [${errorCode}]:`, errorMessage)
  
  // Display user-friendly error message
  const appContainer = document.getElementById('app')
  if (appContainer) {
    appContainer.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        font-family: 'Courier New', monospace;
        background: #0d0d0d;
        color: #ff0040;
        text-align: center;
      ">
        <h1 style="color: #00ffff; margin-bottom: 20px;">⚠️ SWEEP Game Error</h1>
        <p style="margin-bottom: 10px;">Failed to initialize game: ${errorMessage}</p>
        <p style="color: #cccccc; font-size: 14px;">Error Code: ${errorCode}</p>
        <button 
          onclick="location.reload()" 
          style="
            margin-top: 20px;
            padding: 10px 20px;
            background: #00ffff;
            color: #0d0d0d;
            border: none;
            border-radius: 4px;
            font-family: inherit;
            cursor: pointer;
          "
        >
          🔄 Retry
        </button>
      </div>
    `
  }
}

function handleCriticalError(_game: Game, error: unknown): void {
  console.error('💥 Critical error occurred:', error)
  
  // Attempt graceful shutdown
  try {
    // Game クラスに destroy メソッドがあると仮定
    // _game.destroy?.()
  } catch (shutdownError) {
    console.error('Failed to shutdown game gracefully:', shutdownError)
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initializeGame().catch((error) => {
    console.error('Failed to start initialization:', error)
    handleGameInitializationFailure(error)
  })
})