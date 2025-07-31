export enum SoundType {
  REVEAL = 'reveal',
  FLAG = 'flag',
  EXPLOSION = 'explosion',
  SUCCESS = 'success',
  HOVER = 'hover',
  CLICK = 'click'
}

interface SoundConfig {
  frequency: number
  duration: number
  type: OscillatorType
  volume: number
  envelope?: {
    attack: number
    decay: number
    sustain: number
    release: number
  }
}

export class SoundManager {
  private audioContext: AudioContext | null = null
  private masterVolume: number = 0.3
  private enabled: boolean = true
  private sounds: Map<SoundType, SoundConfig> = new Map()

  constructor() {
    this.initializeAudioContext()
    this.setupSounds()
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass()
      } else {
        throw new Error('AudioContext not supported')
      }
      
      if (this.audioContext.state === 'suspended') {
        document.addEventListener('click', this.resumeAudioContext.bind(this), { once: true })
        document.addEventListener('keydown', this.resumeAudioContext.bind(this), { once: true })
      }
    } catch (error) {
      console.warn('Web Audio API not supported:', error)
      this.enabled = false
    }
  }

  private async resumeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
  }

  private setupSounds(): void {
    this.sounds.set(SoundType.REVEAL, {
      frequency: 800,
      duration: 0.1,
      type: 'sine',
      volume: 0.3,
      envelope: {
        attack: 0.01,
        decay: 0.05,
        sustain: 0.3,
        release: 0.04
      }
    })

    this.sounds.set(SoundType.FLAG, {
      frequency: 1200,
      duration: 0.15,
      type: 'triangle',
      volume: 0.4,
      envelope: {
        attack: 0.02,
        decay: 0.08,
        sustain: 0.4,
        release: 0.05
      }
    })

    this.sounds.set(SoundType.EXPLOSION, {
      frequency: 150,
      duration: 0.5,
      type: 'sawtooth',
      volume: 0.6,
      envelope: {
        attack: 0.01,
        decay: 0.3,
        sustain: 0.1,
        release: 0.19
      }
    })

    this.sounds.set(SoundType.SUCCESS, {
      frequency: 523.25, // C5
      duration: 0.8,
      type: 'sine',
      volume: 0.5,
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.7,
        release: 0.5
      }
    })

    this.sounds.set(SoundType.HOVER, {
      frequency: 1000,
      duration: 0.05,
      type: 'sine',
      volume: 0.1,
      envelope: {
        attack: 0.01,
        decay: 0.02,
        sustain: 0.1,
        release: 0.02
      }
    })

    this.sounds.set(SoundType.CLICK, {
      frequency: 600,
      duration: 0.08,
      type: 'square',
      volume: 0.2,
      envelope: {
        attack: 0.01,
        decay: 0.03,
        sustain: 0.2,
        release: 0.04
      }
    })
  }

  public play(soundType: SoundType): void {
    if (!this.enabled || !this.audioContext || this.masterVolume === 0) {
      return
    }

    const config = this.sounds.get(soundType)
    if (!config) {
      console.warn(`Sound config not found for type: ${soundType}`)
      return
    }

    try {
      this.playSound(config)
    } catch (error) {
      console.warn('Failed to play sound:', error)
    }
  }

  private playSound(config: SoundConfig): void {
    if (!this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    const masterGain = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(masterGain)
    masterGain.connect(this.audioContext.destination)

    oscillator.type = config.type
    oscillator.frequency.setValueAtTime(config.frequency, this.audioContext.currentTime)

    masterGain.gain.setValueAtTime(this.masterVolume, this.audioContext.currentTime)

    if (config.envelope) {
      const { attack, decay, sustain, release } = config.envelope
      const now = this.audioContext.currentTime
      const attackTime = now + attack
      const decayTime = attackTime + decay
      const releaseTime = now + config.duration - release
      const endTime = now + config.duration

      gainNode.gain.setValueAtTime(0, now)
      gainNode.gain.linearRampToValueAtTime(config.volume, attackTime)
      gainNode.gain.exponentialRampToValueAtTime(config.volume * sustain, decayTime)
      gainNode.gain.setValueAtTime(config.volume * sustain, releaseTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, endTime)
    } else {
      gainNode.gain.setValueAtTime(config.volume, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + config.duration)
    }

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + config.duration)
  }

  public playSuccessSequence(): void {
    if (!this.enabled || !this.audioContext) return

    const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
    notes.forEach((frequency, index) => {
      setTimeout(() => {
        this.playCustomSound({
          frequency,
          duration: 0.3,
          type: 'sine',
          volume: 0.4,
          envelope: {
            attack: 0.05,
            decay: 0.1,
            sustain: 0.6,
            release: 0.15
          }
        })
      }, index * 150)
    })
  }

  private playCustomSound(config: SoundConfig): void {
    if (!this.audioContext) return

    try {
      this.playSound(config)
    } catch (error) {
      console.warn('Failed to play custom sound:', error)
    }
  }

  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume))
  }

  public getMasterVolume(): number {
    return this.masterVolume
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  public isEnabled(): boolean {
    return this.enabled
  }

  public destroy(): void {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}