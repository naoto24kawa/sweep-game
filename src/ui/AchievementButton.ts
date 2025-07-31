import * as PIXI from 'pixi.js'
import { StatsManager } from '@/stats/StatsManager'

interface AchievementButtonOptions {
  onAchievementClick: () => void
}

/**
 * Achievement表示ボタン
 * 画面左上にトロフィーアイコンとして表示
 */
export class AchievementButton {
  private container: PIXI.Container
  private button!: PIXI.Container
  private statsManager: StatsManager
  private options: AchievementButtonOptions
  private achievementCount: number = 0

  constructor(
    private stage: PIXI.Container,
    statsManager: StatsManager,
    options: AchievementButtonOptions
  ) {
    this.container = new PIXI.Container()
    this.statsManager = statsManager
    this.options = options
    
    this.createButton()
    this.updateAchievementCount()
    this.stage.addChild(this.container)
    
    // 画面左上に配置（少し内側に）
    this.container.x = 40
    this.container.y = 60
    this.container.zIndex = 1000
    this.stage.sortableChildren = true
  }

  private createButton(): void {
    this.button = new PIXI.Container()
    
    // ボタン背景
    const buttonBg = new PIXI.Graphics()
    buttonBg
      .circle(0, 0, 25) // 円形ボタン
      .fill({ color: 0x1a1a1a, alpha: 0.8 })
      .stroke({ width: 2, color: 0xffd700, alpha: 0.7 }) // ゴールド色のボーダー
    
    buttonBg.eventMode = 'static'
    buttonBg.cursor = 'pointer'
    
    // ホバーエフェクト
    buttonBg.on('pointerover', () => {
      buttonBg.clear()
      buttonBg
        .circle(0, 0, 25)
        .fill({ color: 0xffd700, alpha: 0.3 }) // ホバー時はゴールド色
        .stroke({ width: 2, color: 0xffd700, alpha: 1.0 })
    })
    
    buttonBg.on('pointerout', () => {
      buttonBg.clear()
      buttonBg
        .circle(0, 0, 25)
        .fill({ color: 0x1a1a1a, alpha: 0.8 })
        .stroke({ width: 2, color: 0xffd700, alpha: 0.7 })
    })

    buttonBg.on('pointerdown', () => {
      this.options.onAchievementClick()
    })

    this.button.addChild(buttonBg)

    // トロフィーアイコンを作成
    const trophy = this.createTrophyIcon()
    this.button.addChild(trophy)

    // Achievement数のバッジ（実績がある場合のみ）
    this.createAchievementBadge()

    this.container.addChild(this.button)
  }

  private createTrophyIcon(): PIXI.Graphics {
    const trophy = new PIXI.Graphics()
    
    // トロフィーのカップ部分
    trophy
      .moveTo(-8, -5)
      .lineTo(-8, 0)
      .quadraticCurveTo(-8, 5, -3, 5)
      .lineTo(3, 5)
      .quadraticCurveTo(8, 5, 8, 0)
      .lineTo(8, -5)
      .quadraticCurveTo(8, -10, 3, -10)
      .lineTo(-3, -10)
      .quadraticCurveTo(-8, -10, -8, -5)
      .fill({ color: 0xffd700 })

    // トロフィーの持ち手（左右）
    trophy
      .circle(-10, -2, 2)
      .fill({ color: 0xffd700 })
    trophy
      .circle(10, -2, 2)
      .fill({ color: 0xffd700 })

    // トロフィーの台座
    trophy
      .rect(-5, 5, 10, 3)
      .fill({ color: 0xb8860b }) // ダークゴールド

    trophy
      .rect(-7, 8, 14, 2)
      .fill({ color: 0xb8860b })

    return trophy
  }

  private createAchievementBadge(): void {
    if (this.achievementCount > 0) {
      // バッジの背景（右上に小さな円）
      const badge = new PIXI.Graphics()
      badge
        .circle(15, -15, 8)
        .fill({ color: 0xff0040, alpha: 0.9 })
        .stroke({ width: 1, color: 0xffffff, alpha: 0.8 })

      // バッジのテキスト
      const badgeText = new PIXI.Text({
        text: this.achievementCount.toString(),
        style: {
          fontFamily: 'Courier New, monospace',
          fontSize: 10,
          fill: 0xffffff,
          fontWeight: 'bold'
        }
      })
      badgeText.anchor.set(0.5)
      badgeText.x = 15
      badgeText.y = -15

      this.button.addChild(badge)
      this.button.addChild(badgeText)
    }
  }

  private updateAchievementCount(): void {
    const stats = this.statsManager.getStats()
    this.achievementCount = stats.achievements.length
  }

  public refresh(): void {
    // ボタンを再作成して実績数を更新
    this.container.removeChildren()
    this.createButton()
    this.updateAchievementCount()
  }

  public destroy(): void {
    if (this.container.parent) {
      this.container.parent.removeChild(this.container)
    }
    this.container.destroy({ children: true })
  }
}