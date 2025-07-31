import * as PIXI from 'pixi.js'
import { NEON_COLORS } from '@/types'
import { UI_CONSTANTS } from '@/constants/ui'

/**
 * PIXI.js UI要素の作成と描画を専門に行うクラス
 * 単一責任: UI要素の視覚的表現の作成
 */
export class GameUIRenderer {
  
  /**
   * 標準的なテキストオブジェクトを作成
   */
  public createText(text: string, fontSize: number): PIXI.Text {
    return new PIXI.Text({
      text,
      style: {
        fontFamily: 'Courier New, monospace',
        fontSize,
        fill: NEON_COLORS.text.white,
        fontWeight: 'bold',
        dropShadow: {
          color: NEON_COLORS.accent.neonBlue,
          distance: UI_CONSTANTS.SHADOW.DISTANCE,
          blur: UI_CONSTANTS.SHADOW.BLUR,
          alpha: UI_CONSTANTS.SHADOW.ALPHA,
          angle: Math.PI / 4
        }
      }
    })
  }
  
  /**
   * ヘッダー背景を作成
   */
  public createHeaderBackground(width: number, height: number): PIXI.Graphics {
    const headerBg = new PIXI.Graphics()
    headerBg
      .roundRect(0, 0, width, height, UI_CONSTANTS.BORDER.RADIUS)
      .fill({ color: NEON_COLORS.primary.darkGray, alpha: 0.9 })
      .stroke({ width: UI_CONSTANTS.BORDER.WIDTH, color: NEON_COLORS.accent.neonBlue, alpha: 0.5 })
    return headerBg
  }
  
  /**
   * 地雷アイコンを作成
   */
  public createMineIcon(): PIXI.Graphics {
    const icon = new PIXI.Graphics()
    
    // 地雷の円
    icon
      .circle(0, 0, 6)
      .fill({ color: NEON_COLORS.warning.neonRed })

    // 地雷の針
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4
      const startX = Math.cos(angle) * 3
      const startY = Math.sin(angle) * 3
      const endX = Math.cos(angle) * 10
      const endY = Math.sin(angle) * 10
      
      icon
        .moveTo(startX, startY)
        .lineTo(endX, endY)
        .stroke({ width: 1, color: NEON_COLORS.text.white })
    }

    return icon
  }
  
  /**
   * 統計パネルの背景を作成
   */
  public createStatsPanel(width: number): PIXI.Container {
    const statsPanel = new PIXI.Container()
    
    const panelBg = new PIXI.Graphics()
    panelBg
      .roundRect(0, 0, width, 200, UI_CONSTANTS.BORDER.RADIUS)
      .fill({ color: NEON_COLORS.primary.darkGray, alpha: 0.8 })
      .stroke({ width: UI_CONSTANTS.BORDER.WIDTH, color: NEON_COLORS.accent.neonGreen, alpha: 0.6 })

    statsPanel.addChild(panelBg)
    statsPanel.visible = false
    
    return statsPanel
  }
  
  /**
   * 統計テキスト要素の配列を作成
   */
  public createStatsTexts(): PIXI.Text[] {
    const statsTexts: PIXI.Text[] = []
    const statLabels = [
      'Games: 0',
      'Wins: 0', 
      'Win Rate: 0.0%',
      'Streak: 0 (Best: 0)',
      'Best Time: N/A',
      'Avg Time: N/A'
    ]
    
    statLabels.forEach((label, index) => {
      const text = this.createText(label, 14)
      text.style.fill = NEON_COLORS.accent.neonGreen
      text.x = 15
      text.y = 20 + (index * 25)
      statsTexts.push(text)
    })
    
    return statsTexts
  }
}