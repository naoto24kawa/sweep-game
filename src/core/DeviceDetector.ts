/**
 * デバイス種別検出専用クラス
 * Single Responsibility Principle: デバイス判定のみに特化
 * 複数の判定方法を組み合わせて信頼性の高い検出を実現
 */
export class DeviceDetector {
  private static instance: DeviceDetector | null = null

  /**
   * シングルトンインスタンスを取得
   * @returns DeviceDetectorインスタンス
   */
  public static getInstance(): DeviceDetector {
    if (!DeviceDetector.instance) {
      DeviceDetector.instance = new DeviceDetector()
    }
    return DeviceDetector.instance
  }

  /**
   * モバイルデバイスかどうかを判定
   * 3つの指標を組み合わせた信頼性の高い判定アルゴリズム
   * @returns モバイルデバイスならtrue
   */
  public isMobileDevice(): boolean {
    const userAgentResult = this.checkUserAgent()
    const screenSizeResult = this.checkScreenSize()
    const touchResult = this.checkTouchSupport()
    
    console.log('🔍 Device detection results:', { 
      userAgent: userAgentResult, 
      screenSize: screenSizeResult, 
      touch: touchResult,
      screenDimensions: { width: window.innerWidth, height: window.innerHeight }
    })
    
    // User-Agent判定が最優先、その他は補完的
    return userAgentResult || (screenSizeResult && touchResult)
  }

  /**
   * タブレットデバイスかどうかを判定
   * @returns タブレットデバイスならtrue
   */
  public isTabletDevice(): boolean {
    const userAgent = navigator.userAgent.toLowerCase()
    const tabletKeywords = ['ipad', 'tablet']
    const isTabletUA = tabletKeywords.some(keyword => userAgent.includes(keyword))
    
    // 画面サイズがタブレット範囲（768px-1024px）かどうか
    const isTabletScreen = window.innerWidth >= 768 && window.innerWidth <= 1024
    
    return isTabletUA || (isTabletScreen && this.checkTouchSupport())
  }

  /**
   * デスクトップデバイスかどうかを判定
   * @returns デスクトップデバイスならtrue
   */
  public isDesktopDevice(): boolean {
    return !this.isMobileDevice() && !this.isTabletDevice()
  }

  /**
   * 現在のデバイス種別を取得
   * @returns デバイス種別文字列
   */
  public getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (this.isMobileDevice()) return 'mobile'
    if (this.isTabletDevice()) return 'tablet'
    return 'desktop'
  }

  /**
   * User-Agentベースの判定
   * @returns モバイルUser-Agentが検出されたらtrue
   */
  private checkUserAgent(): boolean {
    const userAgent = navigator.userAgent.toLowerCase()
    const mobileKeywords = [
      'mobile', 'android', 'iphone', 'ipod', 
      'blackberry', 'windows phone', 'opera mini'
    ]
    
    return mobileKeywords.some(keyword => userAgent.includes(keyword))
  }

  /**
   * 画面サイズベースの判定
   * @returns モバイルサイズの画面ならtrue
   */
  private checkScreenSize(): boolean {
    // 768px以下をモバイルとして判定（一般的なブレークポイント）
    return window.innerWidth <= 768
  }

  /**
   * タッチサポートの判定
   * @returns タッチサポートありならtrue
   */
  private checkTouchSupport(): boolean {
    return 'ontouchstart' in window || 
           navigator.maxTouchPoints > 0 || 
           (window as any).DocumentTouch && document instanceof (window as any).DocumentTouch
  }

  /**
   * 詳細なデバイス情報を取得
   * @returns デバイス情報オブジェクト
   */
  public getDeviceInfo(): DeviceInfo {
    return {
      type: this.getDeviceType(),
      isMobile: this.isMobileDevice(),
      isTablet: this.isTabletDevice(),
      isDesktop: this.isDesktopDevice(),
      hasTouch: this.checkTouchSupport(),
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      userAgent: navigator.userAgent.substring(0, 100) + '...' // セキュリティのため切り詰め
    }
  }
}

/**
 * デバイス情報の型定義
 */
export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop'
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  hasTouch: boolean
  screenWidth: number
  screenHeight: number
  userAgent: string
}