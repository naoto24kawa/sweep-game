import * as PIXI from 'pixi.js'
import { NEON_COLORS } from '@/types'
import { AnimationManager } from '@/animation/AnimationManager'
import { EffectManager } from '@/effects/EffectManager'

/**
 * PixiJS アプリケーション初期化専用クラス
 * PIXIアプリケーションの作成・設定・ライフサイクル管理
 */
export class PixiAppManager {
  private app!: PIXI.Application
  private animationManager!: AnimationManager
  private effectManager!: EffectManager

  /**
   * PIXIアプリケーションを初期化
   * @param width キャンバス幅
   * @param height キャンバス高さ
   * @returns 初期化完了Promise
   */
  public async initializeApp(width: number, height: number): Promise<void> {
    this.app = new PIXI.Application()
    
    await this.app.init({
      width,
      height,
      backgroundColor: NEON_COLORS.primary.deepBlack,
      antialias: true
    })

    this.initializeManagers()
  }

  /**
   * 管理クラスを初期化
   */
  private initializeManagers(): void {
    this.animationManager = new AnimationManager()
    this.effectManager = new EffectManager(this.app.stage, this.animationManager)
  }

  /**
   * アプリケーションの準備状態を確認
   * @returns 準備完了の真偽値
   */
  public isReady(): boolean {
    return this.app && this.app.canvas != null
  }

  /**
   * PIXIアプリケーションを取得
   * @returns PIXIアプリケーション
   */
  public getApp(): PIXI.Application {
    return this.app
  }

  /**
   * アニメーションマネージャーを取得
   * @returns AnimationManager
   */
  public getAnimationManager(): AnimationManager {
    return this.animationManager
  }

  /**
   * エフェクトマネージャーを取得
   * @returns EffectManager
   */
  public getEffectManager(): EffectManager {
    return this.effectManager
  }

  /**
   * キャンバス要素を取得
   * @returns HTMLCanvasElement
   */
  public getCanvas(): HTMLCanvasElement {
    return this.app.canvas
  }

  /**
   * リソースを破棄
   */
  public destroy(): void {
    if (this.animationManager) {
      this.animationManager.destroy()
    }
    if (this.effectManager) {
      this.effectManager.destroy()
    }
    if (this.app) {
      this.app.destroy(true, true)
    }
  }
}