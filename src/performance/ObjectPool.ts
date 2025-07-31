export class ObjectPool<T> {
  private pool: T[] = []
  private createFn: () => T
  private resetFn: (obj: T) => void
  private maxSize: number

  constructor(
    createFn: () => T,
    resetFn: (obj: T) => void,
    initialSize: number = 10,
    maxSize: number = 100
  ) {
    this.createFn = createFn
    this.resetFn = resetFn
    this.maxSize = maxSize

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn())
    }
  }

  public get(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    return this.createFn()
  }

  public release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.resetFn(obj)
      this.pool.push(obj)
    }
  }

  public clear(): void {
    this.pool.length = 0
  }

  public getPoolSize(): number {
    return this.pool.length
  }
}

export class MemoryManager {
  private static instance: MemoryManager
  private pools: Map<string, ObjectPool<any>> = new Map()
  private gcThreshold: number = 50 * 1024 * 1024 // 50MB

  public static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager()
    }
    return MemoryManager.instance
  }

  public createPool<T>(
    name: string,
    createFn: () => T,
    resetFn: (obj: T) => void,
    initialSize: number = 10,
    maxSize: number = 100
  ): ObjectPool<T> {
    const pool = new ObjectPool(createFn, resetFn, initialSize, maxSize)
    this.pools.set(name, pool)
    return pool
  }

  public getPool<T>(name: string): ObjectPool<T> | null {
    return this.pools.get(name) || null
  }

  public clearPool(name: string): void {
    const pool = this.pools.get(name)
    if (pool) {
      pool.clear()
    }
  }

  public clearAllPools(): void {
    this.pools.forEach(pool => pool.clear())
  }

  public getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize
    }
    return 0
  }

  public forceGarbageCollection(): void {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc()
    }
  }

  public shouldRunGC(): boolean {
    return this.getMemoryUsage() > this.gcThreshold
  }

  public getPoolStats(): Record<string, number> {
    const stats: Record<string, number> = {}
    this.pools.forEach((pool, name) => {
      stats[name] = pool.getPoolSize()
    })
    return stats
  }

  public optimizeMemory(): void {
    if (this.shouldRunGC()) {
      this.clearAllPools()
      this.forceGarbageCollection()
    }
  }
}