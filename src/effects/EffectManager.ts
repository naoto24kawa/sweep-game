import * as PIXI from 'pixi.js'
import { AnimationManager } from '@/animation/AnimationManager'
import { NEON_COLORS } from '@/types'

export class EffectManager {
  private container: PIXI.Container
  private animationManager: AnimationManager

  constructor(stage: PIXI.Container, animationManager: AnimationManager) {
    this.container = new PIXI.Container()
    this.animationManager = animationManager
    stage.addChild(this.container)
  }

  public createGlowEffect(x: number, y: number, color: number = 0x00ffff, size: number = 32): void {
    const glow = new PIXI.Graphics()
    glow
      .circle(0, 0, size)
      .fill({ color, alpha: 0.3 })
    
    glow.x = x + size / 2
    glow.y = y + size / 2
    glow.alpha = 0
    
    this.container.addChild(glow)

    this.animationManager.fadeIn(glow, 200, () => {
      this.animationManager.fadeOut(glow, 300, () => {
        this.container.removeChild(glow)
        glow.destroy()
      })
    })

    this.animationManager.to(glow, { 'scale.x': 2, 'scale.y': 2 }, {
      duration: 500,
      easing: (t: number) => 1 - Math.pow(1 - t, 3)
    })
  }

  public createExplosionEffect(x: number, y: number, size: number = 32): void {
    const particleCount = 12
    const colors = [
      NEON_COLORS.warning.neonRed,
      NEON_COLORS.warning.neonOrange,
      '#ffff00',
      '#ffffff'
    ]

    for (let i = 0; i < particleCount; i++) {
      const particle = new PIXI.Graphics()
      const color = colors[Math.floor(Math.random() * colors.length)]
      
      particle
        .circle(0, 0, Math.random() * 3 + 2)
        .fill({ color })

      particle.x = x + size / 2
      particle.y = y + size / 2

      const angle = (i / particleCount) * Math.PI * 2
      const distance = Math.random() * 50 + 30
      const targetX = particle.x + Math.cos(angle) * distance
      const targetY = particle.y + Math.sin(angle) * distance

      this.container.addChild(particle)

      this.animationManager.to(particle, { x: targetX, y: targetY }, {
        duration: 600,
        easing: (t: number) => 1 - Math.pow(1 - t, 2)
      })

      this.animationManager.fadeOut(particle, 600, () => {
        this.container.removeChild(particle)
        particle.destroy()
      })
    }

    const shockwave = new PIXI.Graphics()
    shockwave
      .circle(0, 0, 1)
      .stroke({ width: 3, color: NEON_COLORS.warning.neonRed, alpha: 0.8 })
    shockwave.x = x + size / 2
    shockwave.y = y + size / 2

    this.container.addChild(shockwave)

    this.animationManager.to(shockwave, { 'scale.x': 50, 'scale.y': 50 }, {
      duration: 400,
      easing: (t: number) => 1 - Math.pow(1 - t, 3)
    })

    this.animationManager.fadeOut(shockwave, 400, () => {
      this.container.removeChild(shockwave)
      shockwave.destroy()
    })
  }

  public createFlagEffect(x: number, y: number, size: number = 32): void {
    const sparkles = new PIXI.Container()
    sparkles.x = x + size / 2
    sparkles.y = y + size / 2

    this.container.addChild(sparkles)

    for (let i = 0; i < 8; i++) {
      const sparkle = new PIXI.Graphics()
      sparkle
        .star(0, 0, 4, 3, 1)
        .fill({ color: NEON_COLORS.warning.neonOrange, alpha: 0.8 })

      const angle = (i / 8) * Math.PI * 2
      sparkle.x = Math.cos(angle) * 15
      sparkle.y = Math.sin(angle) * 15
      sparkle.scale.set(0)

      sparkles.addChild(sparkle)

      this.animationManager.to(sparkle, { 'scale.x': 1, 'scale.y': 1 }, {
        duration: 200,
        easing: (t: number) => 1 - Math.pow(1 - t, 3)
      })

      setTimeout(() => {
        this.animationManager.fadeOut(sparkle, 200, () => {
          sparkles.removeChild(sparkle)
          sparkle.destroy()
        })
      }, 300)
    }

    setTimeout(() => {
      this.container.removeChild(sparkles)
      sparkles.destroy()
    }, 800)
  }

  public createRevealEffect(x: number, y: number, size: number = 32): void {
    const ripple = new PIXI.Graphics()
    ripple
      .rect(-size/2, -size/2, size, size)
      .stroke({ width: 2, color: NEON_COLORS.accent.neonBlue, alpha: 0.6 })
    ripple.x = x + size / 2
    ripple.y = y + size / 2
    ripple.scale.set(0)

    this.container.addChild(ripple)

    this.animationManager.to(ripple, { 'scale.x': 1.5, 'scale.y': 1.5 }, {
      duration: 300,
      easing: (t: number) => 1 - Math.pow(1 - t, 2)
    })

    this.animationManager.fadeOut(ripple, 300, () => {
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
    this.createMatrixRain()
    this.createGlitchOverlay()
    this.createVictoryText()
    this.createHexagonGrid()
    // 震えるアニメーションを無効化
    // this.screenShake(15, 800)
  }

  private createMatrixRain(): void {
    const characters = '0123456789ABCDEF#※▓▒░'
    const columnCount = 30
    const stageWidth = this.container.parent ? (this.container.parent as any).width || 800 : 800
    const stageHeight = this.container.parent ? (this.container.parent as any).height || 600 : 600

    for (let i = 0; i < columnCount; i++) {
      const column = new PIXI.Container()
      column.x = (i / columnCount) * stageWidth
      this.container.addChild(column)

      const dropCount = Math.floor(Math.random() * 8) + 5
      for (let j = 0; j < dropCount; j++) {
        const char = characters[Math.floor(Math.random() * characters.length)]
        const text = new PIXI.Text({
          text: char,
          style: {
            fontFamily: 'monospace',
            fontSize: 16,
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
    const stageWidth = this.container.parent ? (this.container.parent as any).width || 800 : 800
    const stageHeight = this.container.parent ? (this.container.parent as any).height || 600 : 600
    
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
    
    const stageWidth = this.container.parent ? (this.container.parent as any).width || 800 : 800
    const stageHeight = this.container.parent ? (this.container.parent as any).height || 600 : 600

    const text = new PIXI.Text({
      text: message,
      style: {
        fontFamily: 'monospace',
        fontSize: 48,
        fill: NEON_COLORS.accent.neonCyan,
        fontWeight: 'bold',
        stroke: { color: 0x000000, width: 3 },
        dropShadow: {
          color: NEON_COLORS.accent.neonCyan,
          blur: 10,
          distance: 0,
          alpha: 0.8
        }
      }
    })

    text.anchor.set(0.5)
    text.x = stageWidth / 2
    text.y = stageHeight / 2
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
    const textGlitchInterval = setInterval(() => {
      text.style.fill = Math.random() > 0.5 ? NEON_COLORS.accent.neonCyan : NEON_COLORS.warning.neonRed
      text.x = stageWidth / 2 + (Math.random() - 0.5) * 20
      
      glitchTextCount++
      if (glitchTextCount > 15) {
        clearInterval(textGlitchInterval)
        text.x = stageWidth / 2
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
    const hexSize = 30
    const stageWidth = this.container.parent ? (this.container.parent as any).width || 800 : 800
    const stageHeight = this.container.parent ? (this.container.parent as any).height || 600 : 600
    
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

  public destroy(): void {
    this.container.destroy({ children: true })
  }
}