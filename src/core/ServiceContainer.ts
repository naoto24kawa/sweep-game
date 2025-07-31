/**
 * サービス識別子の型
 */
export type ServiceKey = string | symbol

/**
 * サービスファクトリー関数の型
 */
export type ServiceFactory<T = any> = (container: ServiceContainer) => T

/**
 * サービス定義インターフェース
 */
export interface ServiceDefinition<T = any> {
  factory: ServiceFactory<T>
  singleton: boolean
  instance?: T
}

/**
 * 依存性注入コンテナ
 * アプリケーションの依存関係を管理し、サービスの生成・提供を行う
 */
export class ServiceContainer {
  private services = new Map<ServiceKey, ServiceDefinition>()
  private singletonInstances = new Map<ServiceKey, any>()

  /**
   * サービスを登録（シングルトン）
   * @param key サービスキー
   * @param factory ファクトリー関数
   */
  public registerSingleton<T>(key: ServiceKey, factory: ServiceFactory<T>): void {
    this.services.set(key, {
      factory,
      singleton: true
    })
  }

  /**
   * サービスを登録（トランジェント - 毎回新しいインスタンス）
   * @param key サービスキー
   * @param factory ファクトリー関数
   */
  public registerTransient<T>(key: ServiceKey, factory: ServiceFactory<T>): void {
    this.services.set(key, {
      factory,
      singleton: false
    })
  }

  /**
   * インスタンスを直接登録
   * @param key サービスキー
   * @param instance インスタンス
   */
  public registerInstance<T>(key: ServiceKey, instance: T): void {
    this.singletonInstances.set(key, instance)
    this.services.set(key, {
      factory: () => instance,
      singleton: true,
      instance
    })
  }

  /**
   * サービスを解決（取得）
   * @param key サービスキー
   * @returns サービスインスタンス
   */
  public resolve<T>(key: ServiceKey): T {
    // 既にシングルトンインスタンスが存在する場合
    if (this.singletonInstances.has(key)) {
      return this.singletonInstances.get(key)
    }

    const serviceDefinition = this.services.get(key)
    if (!serviceDefinition) {
      throw new Error(`Service '${String(key)}' is not registered`)
    }

    const instance = serviceDefinition.factory(this)

    // シングルトンの場合はインスタンスを保存
    if (serviceDefinition.singleton) {
      this.singletonInstances.set(key, instance)
      serviceDefinition.instance = instance
    }

    return instance
  }

  /**
   * サービスが登録されているかチェック
   * @param key サービスキー
   * @returns 登録済みの真偽値
   */
  public has(key: ServiceKey): boolean {
    return this.services.has(key)
  }

  /**
   * サービスの登録を解除
   * @param key サービスキー
   */
  public unregister(key: ServiceKey): void {
    this.services.delete(key)
    this.singletonInstances.delete(key)
  }

  /**
   * 全サービスをクリア
   */
  public clear(): void {
    this.services.clear()
    this.singletonInstances.clear()
  }

  /**
   * 登録済みサービス一覧を取得
   * @returns サービスキー配列
   */
  public getRegisteredServices(): ServiceKey[] {
    return Array.from(this.services.keys())
  }

  /**
   * サービスの依存関係を自動解決
   * 循環依存のチェック付き
   * @param key サービスキー
   * @param resolving 現在解決中のサービス（循環依存チェック用）
   * @returns サービスインスタンス
   */
  public safeResolve<T>(key: ServiceKey, resolving: Set<ServiceKey> = new Set()): T {
    if (resolving.has(key)) {
      const cycle = Array.from(resolving).concat(String(key)).join(' -> ')
      throw new Error(`Circular dependency detected: ${cycle}`)
    }

    // 既にシングルトンインスタンスが存在する場合
    if (this.singletonInstances.has(key)) {
      return this.singletonInstances.get(key)
    }

    const serviceDefinition = this.services.get(key)
    if (!serviceDefinition) {
      throw new Error(`Service '${String(key)}' is not registered`)
    }

    resolving.add(key)
    
    try {
      const instance = serviceDefinition.factory(this)

      // シングルトンの場合はインスタンスを保存
      if (serviceDefinition.singleton) {
        this.singletonInstances.set(key, instance)
        serviceDefinition.instance = instance
      }

      return instance
    } finally {
      resolving.delete(key)
    }
  }
}

/**
 * サービスキー定数
 * 型安全なサービス識別子
 */
export const ServiceKeys = {
  GAME_LOGIC: Symbol('GameLogic'),
  GAME_RENDERER: Symbol('GameRenderer'),
  SOUND_MANAGER: Symbol('SoundManager'),
  STATS_MANAGER: Symbol('StatsManager'),
  SETTINGS_MANAGER: Symbol('SettingsManager'),
  PERFORMANCE_MONITOR: Symbol('PerformanceMonitor'),
  ANIMATION_MANAGER: Symbol('AnimationManager'),
  EFFECT_MANAGER: Symbol('EffectManager')
} as const