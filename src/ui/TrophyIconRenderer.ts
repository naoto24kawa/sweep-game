import * as PIXI from 'pixi.js'

interface TrophyIconOptions {
  scale?: number
  color?: number
  darkColor?: number
}

/**
 * トロフィーアイコンのレンダリングを統一管理するユーティリティクラス
 */
export class TrophyIconRenderer {
  /**
   * トロフィーアイコンを作成
   */
  public static create(options: TrophyIconOptions = {}): PIXI.Graphics {
    const { scale = 1, color = 0xffd700, darkColor = 0xb8860b } = options
    
    const trophy = new PIXI.Graphics()
    
    // トロフィーのカップ部分
    trophy
      .moveTo(-8 * scale, -5 * scale)
      .lineTo(-8 * scale, 0)
      .quadraticCurveTo(-8 * scale, 5 * scale, -3 * scale, 5 * scale)
      .lineTo(3 * scale, 5 * scale)
      .quadraticCurveTo(8 * scale, 5 * scale, 8 * scale, 0)
      .lineTo(8 * scale, -5 * scale)
      .quadraticCurveTo(8 * scale, -10 * scale, 3 * scale, -10 * scale)
      .lineTo(-3 * scale, -10 * scale)
      .quadraticCurveTo(-8 * scale, -10 * scale, -8 * scale, -5 * scale)
      .fill({ color })

    // トロフィーの持ち手（左右）
    trophy
      .circle(-10 * scale, -2 * scale, 2 * scale)
      .fill({ color })
    trophy
      .circle(10 * scale, -2 * scale, 2 * scale)
      .fill({ color })

    // トロフィーの台座
    trophy
      .rect(-5 * scale, 5 * scale, 10 * scale, 3 * scale)
      .fill({ color: darkColor })

    trophy
      .rect(-7 * scale, 8 * scale, 14 * scale, 2 * scale)
      .fill({ color: darkColor })

    return trophy
  }
}