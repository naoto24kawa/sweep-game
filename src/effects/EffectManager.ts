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

  public destroy(): void {
    this.container.destroy({ children: true })
  }
}