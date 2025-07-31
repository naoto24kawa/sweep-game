export interface GameSettings {
  audio: {
    enabled: boolean
    masterVolume: number
  }
  gameplay: {
    showTimer: boolean
    showMineCount: boolean
    firstClickSafe: boolean
  }
}

export class SettingsManager {
  private readonly STORAGE_KEY = 'sweep-game-settings'
  private settings: GameSettings
  private listeners: Map<string, ((settings: GameSettings) => void)[]> = new Map()

  constructor() {
    this.settings = this.loadSettings()
    this.validateSettings()
  }

  private getDefaultSettings(): GameSettings {
    return {
      audio: {
        enabled: true,
        masterVolume: 0.3
      },
      gameplay: {
        showTimer: true,
        showMineCount: true,
        firstClickSafe: true
      }
    }
  }

  private loadSettings(): GameSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return this.mergeSettings(this.getDefaultSettings(), parsed)
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error)
    }
    return this.getDefaultSettings()
  }

  private mergeSettings(defaults: GameSettings, stored: unknown): GameSettings {
    if (!this.isValidSettingsObject(stored)) {
      return defaults
    }

    return {
      audio: this.mergeAudioSettings(defaults.audio, stored.audio),
      gameplay: this.mergeGameplaySettings(defaults.gameplay, stored.gameplay)
    }
  }

  private isValidSettingsObject(obj: unknown): obj is Partial<GameSettings> {
    return obj != null && 
           typeof obj === 'object' && 
           !Array.isArray(obj)
  }

  private mergeAudioSettings(
    defaults: GameSettings['audio'], 
    stored: unknown
  ): GameSettings['audio'] {
    if (!this.isPartialAudioSettings(stored)) {
      return defaults
    }

    return {
      enabled: stored.enabled ?? defaults.enabled,
      masterVolume: this.clampVolume(stored.masterVolume ?? defaults.masterVolume)
    }
  }

  private mergeGameplaySettings(
    defaults: GameSettings['gameplay'], 
    stored: unknown
  ): GameSettings['gameplay'] {
    if (!this.isPartialGameplaySettings(stored)) {
      return defaults
    }

    return {
      showTimer: stored.showTimer ?? defaults.showTimer,
      showMineCount: stored.showMineCount ?? defaults.showMineCount,
      firstClickSafe: stored.firstClickSafe ?? defaults.firstClickSafe
    }
  }

  private isPartialAudioSettings(obj: unknown): obj is Partial<GameSettings['audio']> {
    if (typeof obj !== 'object' || obj === null) return false
    const settings = obj as Record<string, unknown>
    
    return (settings.enabled === undefined || typeof settings.enabled === 'boolean') &&
           (settings.masterVolume === undefined || typeof settings.masterVolume === 'number')
  }

  private isPartialGameplaySettings(obj: unknown): obj is Partial<GameSettings['gameplay']> {
    if (typeof obj !== 'object' || obj === null) return false
    const settings = obj as Record<string, unknown>
    
    return (settings.showTimer === undefined || typeof settings.showTimer === 'boolean') &&
           (settings.showMineCount === undefined || typeof settings.showMineCount === 'boolean') &&
           (settings.firstClickSafe === undefined || typeof settings.firstClickSafe === 'boolean')
  }

  private clampVolume(volume: number): number {
    return Math.max(0, Math.min(1, volume))
  }

  private validateSettings(): void {
    this.settings.audio.masterVolume = Math.max(0, Math.min(1, this.settings.audio.masterVolume))
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings))
      this.notifyListeners()
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error)
    }
  }

  public getSettings(): GameSettings {
    return JSON.parse(JSON.stringify(this.settings))
  }

  public updateSettings(updates: Partial<GameSettings>): void {
    this.settings = this.mergeSettings(this.settings, updates)
    this.validateSettings()
    this.saveSettings()
  }

  public setSetting<T extends keyof GameSettings>(
    category: T,
    key: keyof GameSettings[T],
    value: GameSettings[T][keyof GameSettings[T]]
  ): void {
    (this.settings[category] as any)[key] = value
    this.validateSettings()
    this.saveSettings()
  }

  public getSetting<T extends keyof GameSettings>(
    category: T,
    key: keyof GameSettings[T]
  ): GameSettings[T][keyof GameSettings[T]] {
    return this.settings[category][key]
  }

  public resetSettings(): void {
    this.settings = this.getDefaultSettings()
    this.saveSettings()
  }

  public resetCategory<T extends keyof GameSettings>(category: T): void {
    this.settings[category] = this.getDefaultSettings()[category]
    this.validateSettings()
    this.saveSettings()
  }

  public exportSettings(): string {
    return JSON.stringify(this.settings, null, 2)
  }

  public importSettings(data: string): boolean {
    try {
      const parsed = JSON.parse(data)
      this.settings = this.mergeSettings(this.getDefaultSettings(), parsed)
      this.validateSettings()
      this.saveSettings()
      return true
    } catch (error) {
      console.error('Failed to import settings:', error)
      return false
    }
  }

  public addEventListener(event: string, callback: (settings: GameSettings) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  public removeEventListener(event: string, callback: (settings: GameSettings) => void): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      const index = eventListeners.indexOf(callback)
      if (index > -1) {
        eventListeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        try {
          callback(this.getSettings())
        } catch (error) {
          console.error(`Error in settings listener for ${event}:`, error)
        }
      })
    })
  }

}