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
  private resizeCallback?: () => void

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
      antialias: true,
      resizeTo: window // ウィンドウサイズに自動リサイズ
    })

    this.initializeManagers()
    this.setupResizeHandler()
    console.log('🎨 PIXI app initialized with size:', { width, height })
  }

  /**
   * 管理クラスを初期化
   */
  private initializeManagers(): void {
    this.animationManager = new AnimationManager()
    this.effectManager = new EffectManager(this.app.stage, this.animationManager)
  }

  /**
   * リサイズハンドラーを設定
   */
  private setupResizeHandler(): void {
    const handleResize = () => {
      // モバイルデバイスでの画面回転時などに対応
      if (this.isMobileDevice()) {
        this.app.renderer.resize(window.innerWidth, window.innerHeight)
        console.log('📱 Canvas resized for mobile:', { 
          width: window.innerWidth, 
          height: window.innerHeight 
        })
        
        // リサイズ後にコールバックを実行（グリッド再中央配置など）
        if (this.resizeCallback) {
          setTimeout(this.resizeCallback, 100) // 少し遅延してから実行
        }
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
  }

  /**
   * リサイズ時のコールバックを設定
   */
  public setResizeCallback(callback: () => void): void {
    this.resizeCallback = callback
  }

  /**
   * モバイルデバイスかどうかを判定
   */
  private isMobileDevice(): boolean {
    const userAgent = navigator.userAgent.toLowerCase()
    const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone']
    const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword))
    const isMobileScreen = window.innerWidth <= 768
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    
    return isMobileUA || (isMobileScreen && isTouchDevice)
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