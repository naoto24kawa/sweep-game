import * as PIXI from 'pixi.js'
import { StatsManager } from '@/stats/StatsManager'
import { TrophyIconRenderer } from './TrophyIconRenderer'
import { UI_CONSTANTS } from '@/constants/ui'

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
    this.container.x = UI_CONSTANTS.ACHIEVEMENT.BUTTON_X
    this.container.y = UI_CONSTANTS.ACHIEVEMENT.BUTTON_Y
    this.container.zIndex = UI_CONSTANTS.ACHIEVEMENT.BUTTON_Z_INDEX
    this.stage.sortableChildren = true
  }

  private createButton(): void {
    this.button = new PIXI.Container()
    
    // ボタン背景
    const buttonBg = new PIXI.Graphics()
    buttonBg
      .circle(0, 0, UI_CONSTANTS.ACHIEVEMENT.BUTTON_RADIUS) // 円形ボタン
      .fill({ color: 0x1a1a1a, alpha: 0.8 })
      .stroke({ width: 2, color: 0xffd700, alpha: 0.7 }) // ゴールド色のボーダー
    
    buttonBg.eventMode = 'static'
    buttonBg.cursor = 'pointer'
    
    // ホバーエフェクト
    buttonBg.on('pointerover', () => {
      buttonBg.clear()
      buttonBg
        .circle(0, 0, UI_CONSTANTS.ACHIEVEMENT.BUTTON_RADIUS)
        .fill({ color: 0xffd700, alpha: 0.3 }) // ホバー時はゴールド色
        .stroke({ width: 2, color: 0xffd700, alpha: 1.0 })
    })
    
    buttonBg.on('pointerout', () => {
      buttonBg.clear()
      buttonBg
        .circle(0, 0, UI_CONSTANTS.ACHIEVEMENT.BUTTON_RADIUS)
        .fill({ color: 0x1a1a1a, alpha: 0.8 })
        .stroke({ width: 2, color: 0xffd700, alpha: 0.7 })
    })

    buttonBg.on('pointerdown', () => {
      this.options.onAchievementClick()
    })

    this.button.addChild(buttonBg)

    // トロフィーアイコンを作成
    const trophy = TrophyIconRenderer.create()
    // アイコンがクリックをブロックしないように設定
    trophy.eventMode = 'none'
    this.button.addChild(trophy)

    // Achievement数のバッジ（実績がある場合のみ）
    this.createAchievementBadge()

    this.container.addChild(this.button)
  }


  private createAchievementBadge(): void {
    if (this.achievementCount > 0) {
      // バッジの背景（右上に小さな円）
      const badge = new PIXI.Graphics()
      badge
        .circle(UI_CONSTANTS.ACHIEVEMENT.BADGE_X, UI_CONSTANTS.ACHIEVEMENT.BADGE_Y, UI_CONSTANTS.ACHIEVEMENT.BADGE_RADIUS)
        .fill({ color: 0xff0040, alpha: 0.9 })
        .stroke({ width: 1, color: 0xffffff, alpha: 0.8 })

      // バッジのテキスト
      const badgeText = new PIXI.Text({
        text: this.achievementCount.toString(),
        style: {
          fontFamily: 'Courier New, monospace',
          fontSize: UI_CONSTANTS.ACHIEVEMENT.BADGE_FONT_SIZE,
          fill: 0xffffff,
          fontWeight: 'bold'
        }
      })
      badgeText.anchor.set(0.5)
      badgeText.x = UI_CONSTANTS.ACHIEVEMENT.BADGE_X
      badgeText.y = UI_CONSTANTS.ACHIEVEMENT.BADGE_Y

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