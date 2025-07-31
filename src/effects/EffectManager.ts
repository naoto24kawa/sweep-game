import * as PIXI from 'pixi.js'
import { AnimationManager } from '@/animation/AnimationManager'
import { NEON_COLORS } from '@/types'

export class EffectManager {
  private container: PIXI.Container
  private animationManager: AnimationManager
  private stage: PIXI.Container

  constructor(stage: PIXI.Container, animationManager: AnimationManager) {
    this.container = new PIXI.Container()
    this.animationManager = animationManager
    this.stage = stage
    
    // エフェクトコンテナを最前面に設定
    this.container.zIndex = 9999
    stage.addChild(this.container)
    stage.sortableChildren = true
  }

  public createGlowEffect(x: number, y: number, color: number = 0x00ffff, size: number = 32): void {
    const glow = new PIXI.Graphics()
    glow
      .circle(0, 0, size / 2) // サイズを半分に
      .fill({ color, alpha: 0.2 }) // 透明度を下げる
    
    glow.x = x + size / 2
    glow.y = y + size / 2
    glow.alpha = 0
    
    this.container.addChild(glow)

    this.animationManager.fadeIn(glow, 150, () => {
      this.animationManager.fadeOut(glow, 200, () => {
        this.container.removeChild(glow)
        glow.destroy()
      })
    })

    this.animationManager.to(glow, { 'scale.x': 1.3, 'scale.y': 1.3 }, { // スケールを控えめに
      duration: 350,
      easing: (t: number) => 1 - Math.pow(1 - t, 3)
    })
  }

  public createExplosionEffect(x: number, y: number, size: number = 32): void {
    const particleCount = 6 // パーティクル数を半分に
    const colors = [
      NEON_COLORS.warning.neonRed,
      NEON_COLORS.warning.neonOrange,
      '#ffff00'
    ]

    for (let i = 0; i < particleCount; i++) {
      const particle = new PIXI.Graphics()
      const color = colors[Math.floor(Math.random() * colors.length)]
      
      particle
        .circle(0, 0, Math.random() * 2 + 1) // サイズを小さく
        .fill({ color, alpha: 0.7 }) // 透明度を追加

      particle.x = x + size / 2
      particle.y = y + size / 2

      const angle = (i / particleCount) * Math.PI * 2
      const distance = Math.random() * 25 + 15 // 距離を短く
      const targetX = particle.x + Math.cos(angle) * distance
      const targetY = particle.y + Math.sin(angle) * distance

      this.container.addChild(particle)

      this.animationManager.to(particle, { x: targetX, y: targetY }, {
        duration: 400, // 時間を短く
        easing: (t: number) => 1 - Math.pow(1 - t, 2)
      })

      this.animationManager.fadeOut(particle, 400, () => {
        this.container.removeChild(particle)
        particle.destroy()
      })
    }

    // ショックウェーブを控えめに
    const shockwave = new PIXI.Graphics()
    shockwave
      .circle(0, 0, 1)
      .stroke({ width: 2, color: NEON_COLORS.warning.neonRed, alpha: 0.5 }) // 透明度を下げる
    shockwave.x = x + size / 2
    shockwave.y = y + size / 2

    this.container.addChild(shockwave)

    this.animationManager.to(shockwave, { 'scale.x': 20, 'scale.y': 20 }, { // スケールを小さく
      duration: 300, // 時間を短く
      easing: (t: number) => 1 - Math.pow(1 - t, 3)
    })

    this.animationManager.fadeOut(shockwave, 300, () => {
      this.container.removeChild(shockwave)
      shockwave.destroy()
    })
  }

  public createFlagEffect(x: number, y: number, size: number = 32): void {
    const sparkles = new PIXI.Container()
    sparkles.x = x + size / 2
    sparkles.y = y + size / 2

    this.container.addChild(sparkles)

    for (let i = 0; i < 4; i++) { // 数を半分に
      const sparkle = new PIXI.Graphics()
      sparkle
        .star(0, 0, 3, 2, 1) // サイズを小さく
        .fill({ color: NEON_COLORS.warning.neonOrange, alpha: 0.6 }) // 透明度を下げる

      const angle = (i / 4) * Math.PI * 2
      sparkle.x = Math.cos(angle) * 10 // 距離を短く
      sparkle.y = Math.sin(angle) * 10
      sparkle.scale.set(0)

      sparkles.addChild(sparkle)

      this.animationManager.to(sparkle, { 'scale.x': 0.8, 'scale.y': 0.8 }, { // スケールを小さく
        duration: 150, // 時間を短く
        easing: (t: number) => 1 - Math.pow(1 - t, 3)
      })

      setTimeout(() => {
        this.animationManager.fadeOut(sparkle, 150, () => {
          sparkles.removeChild(sparkle)
          sparkle.destroy()
        })
      }, 200) // タイミングを早く
    }

    setTimeout(() => {
      this.container.removeChild(sparkles)
      sparkles.destroy()
    }, 500) // 全体時間を短く
  }

  public createRevealEffect(x: number, y: number, size: number = 32): void {
    const ripple = new PIXI.Graphics()
    ripple
      .rect(-size/2, -size/2, size, size)
      .stroke({ width: 1, color: NEON_COLORS.accent.neonBlue, alpha: 0.4 }) // 線幅と透明度を控えめに
    ripple.x = x + size / 2
    ripple.y = y + size / 2
    ripple.scale.set(0)

    this.container.addChild(ripple)

    this.animationManager.to(ripple, { 'scale.x': 1.2, 'scale.y': 1.2 }, { // スケールを小さく
      duration: 200, // 時間を短く
      easing: (t: number) => 1 - Math.pow(1 - t, 2)
    })

    this.animationManager.fadeOut(ripple, 200, () => {
      this.container.removeChild(ripple)
      ripple.destroy()
    })
  }

  public screenShake(intensity: number = 10, duration: number = 300): void {
    if (this.container.parent) {
      this.animationManager.shake(this.container.parent, intensity, duration)
    }
  }

  public createVictoryEffect(): void {
    console.log('🔧 Creating cyberpunk victory effect across full canvas')
    this.createMatrixRain()
    this.createGlitchOverlay()
    this.createVictoryText()
    this.createHexagonGrid()
    this.createBinaryRain()
    // 震えるアニメーションを無効化
    // this.screenShake(15, 800)
  }

  public createGameOverEffect(): void {
    console.log('💥 Creating game over explosion effect')
    this.createMassiveExplosion()
    this.createFailureGlitchOverlay()
    this.createFailureText()
    this.createExplosionParticles()
    this.screenShake(20, 1000)
  }

  private createMatrixRain(): void {
    const characters = '0123456789ABCDEF#※▓▒░'
    const { stageWidth, stageHeight } = this.getStageSize()
    const columnCount = Math.min(50, Math.floor(stageWidth / 15)) // より密度の高いマトリックスレイン

    for (let i = 0; i < columnCount; i++) {
      const column = new PIXI.Container()
      column.x = (i / columnCount) * stageWidth
      this.container.addChild(column)

      const dropCount = Math.floor(Math.random() * 12) + 8 // より多くの文字を表示
      const matrixFontSize = Math.min(16, Math.max(10, stageWidth / 50)) // 画面幅に応じてフォントサイズを調整
      
      for (let j = 0; j < dropCount; j++) {
        const char = characters[Math.floor(Math.random() * characters.length)]
        const text = new PIXI.Text({
          text: char,
          style: {
            fontFamily: 'monospace',
            fontSize: matrixFontSize,
            fill: NEON_COLORS.accent.neonGreen,
            fontWeight: 'bold'
          }
        })
        
        text.x = Math.random() * 20 - 10
        text.y = -Math.random() * 500 - 100
        text.alpha = Math.random() * 0.8 + 0.2
        column.addChild(text)

        this.animationManager.to(text, { y: stageHeight + 100 }, {
          duration: Math.random() * 3000 + 2000,
          easing: (t: number) => t
        })

        this.animationManager.fadeOut(text, Math.random() * 1000 + 2000, () => {
          if (text.parent) {
            text.parent.removeChild(text)
          }
          if (!text.destroyed) {
            text.destroy()
          }
        })
      }

      setTimeout(() => {
        if (column.parent) {
          column.parent.removeChild(column)
        }
        if (!column.destroyed) {
          column.destroy({ children: true })
        }
      }, 5000)
    }
  }

  private createGlitchOverlay(): void {
    const overlay = new PIXI.Graphics()
    const { stageWidth, stageHeight } = this.getStageSize()
    
    overlay.rect(0, 0, stageWidth, stageHeight)
    overlay.fill({ color: 0x00ffff, alpha: 0.15 })
    this.container.addChild(overlay)

    let glitchCount = 0
    const glitchInterval = setInterval(() => {
      overlay.alpha = Math.random() * 0.3
      overlay.tint = Math.random() > 0.5 ? 0x00ffff : 0xff00ff
      
      glitchCount++
      if (glitchCount > 20) {
        clearInterval(glitchInterval)
        this.animationManager.fadeOut(overlay, 500, () => {
          if (overlay.parent) {
            overlay.parent.removeChild(overlay)
          }
          if (!overlay.destroyed) {
            overlay.destroy()
          }
        })
      }
    }, 100)
  }

  private createVictoryText(): void {
    const messages = ['SYSTEM BREACHED', 'ACCESS GRANTED', 'MISSION COMPLETE', 'NEURAL LINK ESTABLISHED']
    const message = messages[Math.floor(Math.random() * messages.length)]
    
    const { stageWidth } = this.getStageSize()
    // 画面サイズに応じてフォントサイズを調整
    const fontSize = Math.min(48, Math.max(24, stageWidth / 16))

    const text = new PIXI.Text({
      text: message,
      style: {
        fontFamily: 'monospace',
        fontSize,
        fill: NEON_COLORS.accent.neonCyan,
        fontWeight: 'bold',
        stroke: { color: 0x000000, width: Math.max(1, fontSize / 16) },
        dropShadow: {
          color: NEON_COLORS.accent.neonCyan,
          blur: fontSize / 5,
          distance: 0,
          alpha: 0.8
        }
      }
    })

    text.anchor.set(0.5)
    text.x = stageWidth / 2
    
    // グリッドの下部に配置
    const gridPosition = this.getGridBottomPosition()
    text.y = gridPosition
    
    text.scale.set(0)
    text.alpha = 0

    this.container.addChild(text)

    this.animationManager.to(text, { 'scale.x': 1.2, 'scale.y': 1.2 }, {
      duration: 300,
      easing: (t: number) => 1 - Math.pow(1 - t, 3)
    })

    this.animationManager.fadeIn(text, 300, () => {
      setTimeout(() => {
        this.animationManager.to(text, { 'scale.x': 1, 'scale.y': 1 }, {
          duration: 200,
          easing: (t: number) => 1 - Math.pow(1 - t, 2)
        })
      }, 100)
    })

    let glitchTextCount = 0
    const originalY = text.y
    const textGlitchInterval = setInterval(() => {
      text.style.fill = Math.random() > 0.5 ? NEON_COLORS.accent.neonCyan : NEON_COLORS.warning.neonRed
      text.x = stageWidth / 2 + (Math.random() - 0.5) * 20
      text.y = originalY + (Math.random() - 0.5) * 10 // Y座標も少しグリッチさせる
      
      glitchTextCount++
      if (glitchTextCount > 15) {
        clearInterval(textGlitchInterval)
        text.x = stageWidth / 2
        text.y = originalY
        text.style.fill = NEON_COLORS.accent.neonCyan
        
        setTimeout(() => {
          this.animationManager.fadeOut(text, 1000, () => {
            if (text.parent) {
              text.parent.removeChild(text)
            }
            if (!text.destroyed) {
              text.destroy()
            }
          })
        }, 1500)
      }
    }, 150)
  }

  private createHexagonGrid(): void {
    const { stageWidth, stageHeight } = this.getStageSize()
    const hexSize = Math.min(30, Math.max(15, stageWidth / 30)) // 画面サイズに応じてヘキサゴンサイズを調整
    
    const cols = Math.ceil(stageWidth / (hexSize * 1.5)) + 2
    const rows = Math.ceil(stageHeight / (hexSize * Math.sqrt(3))) + 2

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (Math.random() > 0.7) {
          const hex = new PIXI.Graphics()
          const points: number[] = []
          
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3
            points.push(
              Math.cos(angle) * hexSize * 0.8,
              Math.sin(angle) * hexSize * 0.8
            )
          }
          
          hex.poly(points)
          hex.stroke({ width: 2, color: NEON_COLORS.accent.neonBlue, alpha: 0.4 })

          hex.x = col * hexSize * 1.5 + (row % 2) * hexSize * 0.75
          hex.y = row * hexSize * Math.sqrt(3) * 0.5
          hex.alpha = 0
          hex.scale.set(0)

          this.container.addChild(hex)

          const delay = Math.random() * 1000
          setTimeout(() => {
            this.animationManager.to(hex, { 'scale.x': 1, 'scale.y': 1 }, {
              duration: 400,
              easing: (t: number) => 1 - Math.pow(1 - t, 3)
            })
            
            this.animationManager.fadeIn(hex, 400, () => {
              setTimeout(() => {
                this.animationManager.fadeOut(hex, 800, () => {
                  if (hex.parent) {
                    hex.parent.removeChild(hex)
                  }
                  if (!hex.destroyed) {
                    hex.destroy()
                  }
                })
              }, Math.random() * 1000 + 500)
            })
          }, delay)
        }
      }
    }
  }

  /**
   * ステージサイズを正確に取得
   */
  private getStageSize(): { stageWidth: number; stageHeight: number } {
    // PIXIアプリケーションから直接サイズを取得
    let stageWidth = 800
    let stageHeight = 600
    
    // stageからアプリケーションを辿ってサイズを取得
    const app = (this.stage as any).app || (this.stage as any)._app
    if (app && app.screen) {
      stageWidth = app.screen.width
      stageHeight = app.screen.height
    } else if (this.stage.parent && (this.stage.parent as any).width) {
      // 親コンテナからサイズを取得
      stageWidth = (this.stage.parent as any).width
      stageHeight = (this.stage.parent as any).height
    } else {
      // フォールバック: ウィンドウサイズを使用
      stageWidth = window.innerWidth
      stageHeight = window.innerHeight
    }
    
    console.log('🎬 Effect stage size:', { stageWidth, stageHeight })
    return { stageWidth, stageHeight }
  }

  /**
   * グリッドの下部位置を計算
   */
  private getGridBottomPosition(): number {
    // stageからグリッドコンテナを探す
    const findGridContainer = (container: PIXI.Container): PIXI.Container | null => {
      for (const child of container.children) {
        if (child instanceof PIXI.Container) {
          // グリッドコンテナは通常多数の子要素（セル）を持つ
          if (child.children.length > 10) {
            // 子要素の最初の要素にlabelプロパティがあるかチェック（セルの特徴）
            const firstChild = child.children[0] as any
            if (firstChild && firstChild.label && typeof firstChild.label === 'string') {
              return child
            }
          }
          // 再帰的に探索
          const found = findGridContainer(child)
          if (found) return found
        }
      }
      return null
    }

    const gridContainer = findGridContainer(this.stage)
    if (gridContainer) {
      // グリッドの境界を計算
      const bounds = gridContainer.getBounds()
      const gridBottom = bounds.y + bounds.height
      const { stageHeight } = this.getStageSize()
      
      // グリッドの下部から画面下端までの中間位置に配置
      const availableSpace = stageHeight - gridBottom
      const textPosition = gridBottom + Math.max(60, availableSpace / 2)
      
      console.log('📍 Victory text position:', { 
        gridBottom, 
        stageHeight, 
        availableSpace, 
        textPosition 
      })
      
      return Math.min(textPosition, stageHeight - 50) // 画面下端から最低50px確保
    }
    
    // グリッドが見つからない場合のフォールバック
    const { stageHeight } = this.getStageSize()
    return stageHeight * 0.75 // 画面下部75%の位置
  }


  /**
   * 大規模爆発エフェクト（ゲーム失敗時）
   */
  private createMassiveExplosion(): void {
    const { stageWidth, stageHeight } = this.getStageSize()
    const centerX = stageWidth / 2
    const centerY = stageHeight / 2

    // 中央から広がる大爆発
    const explosionCount = 8
    for (let i = 0; i < explosionCount; i++) {
      setTimeout(() => {
        const angle = (i / explosionCount) * Math.PI * 2
        const distance = Math.random() * 150 + 50
        const x = centerX + Math.cos(angle) * distance
        const y = centerY + Math.sin(angle) * distance
        
        this.createLargeExplosion(x, y)
      }, i * 200)
    }

    // 画面全体のフラッシュ
    this.createExplosionFlash()
  }

  private createLargeExplosion(x: number, y: number): void {
    const particleCount = 20
    const colors = [
      NEON_COLORS.warning.neonRed,
      NEON_COLORS.warning.neonOrange,
      '#ffff00',
      '#ff6600'
    ]

    for (let i = 0; i < particleCount; i++) {
      const particle = new PIXI.Graphics()
      const color = colors[Math.floor(Math.random() * colors.length)]
      const size = Math.random() * 8 + 4
      
      particle
        .circle(0, 0, size)
        .fill({ color, alpha: 0.9 })

      particle.x = x
      particle.y = y

      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5
      const distance = Math.random() * 200 + 100
      const targetX = particle.x + Math.cos(angle) * distance
      const targetY = particle.y + Math.sin(angle) * distance

      this.container.addChild(particle)

      this.animationManager.to(particle, { x: targetX, y: targetY }, {
        duration: 800,
        easing: (t: number) => 1 - Math.pow(1 - t, 2)
      })

      this.animationManager.fadeOut(particle, 800, () => {
        this.container.removeChild(particle)
        particle.destroy()
      })
    }

    // 爆発の中心にショックウェーブ
    const shockwave = new PIXI.Graphics()
    shockwave
      .circle(0, 0, 5)
      .stroke({ width: 4, color: NEON_COLORS.warning.neonRed, alpha: 0.8 })
    shockwave.x = x
    shockwave.y = y

    this.container.addChild(shockwave)

    this.animationManager.to(shockwave, { 'scale.x': 40, 'scale.y': 40 }, {
      duration: 600,
      easing: (t: number) => 1 - Math.pow(1 - t, 3)
    })

    this.animationManager.fadeOut(shockwave, 600, () => {
      this.container.removeChild(shockwave)
      shockwave.destroy()
    })
  }

  private createExplosionFlash(): void {
    const { stageWidth, stageHeight } = this.getStageSize()
    const flash = new PIXI.Graphics()
    
    flash.rect(0, 0, stageWidth, stageHeight)
    flash.fill({ color: 0xff4400, alpha: 0.8 })
    this.container.addChild(flash)

    // 3回フラッシュ
    let flashCount = 0
    const flashInterval = setInterval(() => {
      flash.alpha = flash.alpha > 0.1 ? 0 : 0.6
      flashCount++
      
      if (flashCount > 6) {
        clearInterval(flashInterval)
        this.animationManager.fadeOut(flash, 300, () => {
          this.container.removeChild(flash)
          flash.destroy()
        })
      }
    }, 100)
  }

  private createFailureGlitchOverlay(): void {
    const overlay = new PIXI.Graphics()
    const { stageWidth, stageHeight } = this.getStageSize()
    
    overlay.rect(0, 0, stageWidth, stageHeight)
    overlay.fill({ color: 0xff0000, alpha: 0.2 })
    this.container.addChild(overlay)

    let glitchCount = 0
    const glitchInterval = setInterval(() => {
      overlay.alpha = Math.random() * 0.4 + 0.1
      overlay.tint = Math.random() > 0.5 ? 0xff0000 : 0xff4400
      
      glitchCount++
      if (glitchCount > 30) {
        clearInterval(glitchInterval)
        this.animationManager.fadeOut(overlay, 800, () => {
          if (overlay.parent) {
            overlay.parent.removeChild(overlay)
          }
          if (!overlay.destroyed) {
            overlay.destroy()
          }
        })
      }
    }, 80)
  }

  private createFailureText(): void {
    const messages = ['SYSTEM FAILURE', 'ACCESS DENIED', 'MISSION FAILED', 'NEURAL LINK SEVERED']
    const message = messages[Math.floor(Math.random() * messages.length)]
    
    const { stageWidth } = this.getStageSize()
    const fontSize = Math.min(48, Math.max(24, stageWidth / 16))

    const text = new PIXI.Text({
      text: message,
      style: {
        fontFamily: 'monospace',
        fontSize,
        fill: NEON_COLORS.warning.neonRed,
        fontWeight: 'bold',
        stroke: { color: 0x000000, width: Math.max(1, fontSize / 16) },
        dropShadow: {
          color: NEON_COLORS.warning.neonRed,
          blur: fontSize / 5,
          distance: 0,
          alpha: 0.8
        }
      }
    })

    text.anchor.set(0.5)
    text.x = stageWidth / 2
    
    const gridPosition = this.getGridBottomPosition()
    text.y = gridPosition
    
    text.scale.set(0)
    text.alpha = 0

    this.container.addChild(text)

    this.animationManager.to(text, { 'scale.x': 1.2, 'scale.y': 1.2 }, {
      duration: 400,
      easing: (t: number) => 1 - Math.pow(1 - t, 3)
    })

    this.animationManager.fadeIn(text, 400, () => {
      setTimeout(() => {
        this.animationManager.to(text, { 'scale.x': 1, 'scale.y': 1 }, {
          duration: 200,
          easing: (t: number) => 1 - Math.pow(1 - t, 2)
        })
      }, 100)
    })

    // 激しいグリッチエフェクト
    let glitchTextCount = 0
    const originalY = text.y
    const textGlitchInterval = setInterval(() => {
      text.style.fill = Math.random() > 0.3 ? NEON_COLORS.warning.neonRed : NEON_COLORS.warning.neonOrange
      text.x = stageWidth / 2 + (Math.random() - 0.5) * 30
      text.y = originalY + (Math.random() - 0.5) * 20
      
      glitchTextCount++
      if (glitchTextCount > 25) {
        clearInterval(textGlitchInterval)
        text.x = stageWidth / 2
        text.y = originalY
        text.style.fill = NEON_COLORS.warning.neonRed
        
        setTimeout(() => {
          this.animationManager.fadeOut(text, 1000, () => {
            if (text.parent) {
              text.parent.removeChild(text)
            }
            if (!text.destroyed) {
              text.destroy()
            }
          })
        }, 1000)
      }
    }, 100)
  }

  private createExplosionParticles(): void {
    const { stageWidth, stageHeight } = this.getStageSize()
    const particleCount = 50

    for (let i = 0; i < particleCount; i++) {
      setTimeout(() => {
        const particle = new PIXI.Graphics()
        const colors = [NEON_COLORS.warning.neonRed, NEON_COLORS.warning.neonOrange, '#ffff00']
        const color = colors[Math.floor(Math.random() * colors.length)]
        
        particle
          .rect(-2, -2, 4, 4)
          .fill({ color, alpha: 0.8 })

        particle.x = Math.random() * stageWidth
        particle.y = -20
        particle.rotation = Math.random() * Math.PI * 2

        this.container.addChild(particle)

        const targetY = stageHeight + 50
        const targetX = particle.x + (Math.random() - 0.5) * 200

        this.animationManager.to(particle, { 
          x: targetX, 
          y: targetY, 
          rotation: particle.rotation + Math.PI * 4 
        }, {
          duration: Math.random() * 2000 + 1500,
          easing: (t: number) => t
        })

        this.animationManager.fadeOut(particle, Math.random() * 1000 + 2000, () => {
          if (particle.parent) {
            particle.parent.removeChild(particle)
          }
          if (!particle.destroyed) {
            particle.destroy()
          }
        })
      }, Math.random() * 2000)
    }
  }

  /**
   * バイナリレインエフェクト（0と1の雨）
   */
  private createBinaryRain(): void {
    const { stageWidth, stageHeight } = this.getStageSize()
    const columnCount = Math.min(20, Math.floor(stageWidth / 30))

    for (let i = 0; i < columnCount; i++) {
      setTimeout(() => {
        const column = new PIXI.Container()
        column.x = (i / columnCount) * stageWidth + Math.random() * 30
        this.container.addChild(column)

        const dropCount = Math.floor(Math.random() * 15) + 10
        const fontSize = Math.min(14, Math.max(10, stageWidth / 60))
        
        for (let j = 0; j < dropCount; j++) {
          const binary = Math.random() > 0.5 ? '1' : '0'
          const text = new PIXI.Text({
            text: binary,
            style: {
              fontFamily: 'monospace',
              fontSize,
              fill: NEON_COLORS.warning.neonOrange,
              fontWeight: 'bold'
            }
          })
          
          text.x = Math.random() * 10 - 5
          text.y = -Math.random() * 300 - 50
          text.alpha = Math.random() * 0.7 + 0.3
          column.addChild(text)

          this.animationManager.to(text, { y: stageHeight + 50 }, {
            duration: Math.random() * 2000 + 3000,
            easing: (t: number) => t
          })

          this.animationManager.fadeOut(text, Math.random() * 1000 + 3000, () => {
            if (text.parent) {
              text.parent.removeChild(text)
            }
            if (!text.destroyed) {
              text.destroy()
            }
          })
        }

        setTimeout(() => {
          if (column.parent) {
            column.parent.removeChild(column)
          }
          if (!column.destroyed) {
            column.destroy({ children: true })
          }
        }, 5000)
      }, Math.random() * 1500)
    }
  }

  public destroy(): void {
    this.container.destroy({ children: true })
  }
}