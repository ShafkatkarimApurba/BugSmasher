import { audioAssets } from './AudioAssetLoader';

/**
 * BUGSMASHER — Professional Sound System
 * 
 * Architecture:
 * - Advanced programmatic audio synthesis using Web Audio API
 * - Multi-layer oscillator design for rich, punchy SFX
 * - Adaptive soundtrack with biome-specific themes and intensity layering
 * - Voice synthesis for cutscenes via SpeechSynthesis API
 * - Audio effects chain: compressor → distortion → reverb → delay → master
 */

export interface VoiceLine {
  text: string;
  speaker: 'SYSTEM' | 'STATION AI' | '???' | string;
  mood?: 'normal' | 'glitch' | 'shiver' | 'alert';
}

// ─── Audio Effects Processors ───────────────────────────────────────────

class ReverbProcessor {
  private ctx: AudioContext;
  private convolver: ConvolverNode | null = null;
  private wetGain: GainNode;
  private dryGain: GainNode;

  constructor(ctx: AudioContext, dest: AudioNode) {
    this.ctx = ctx;
    this.wetGain = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.wetGain.gain.value = 0.3;
    this.dryGain.gain.value = 0.7;
    this.wetGain.connect(dest);
    this.dryGain.connect(dest);
    this.createImpulseResponse(2.0, 3.0); // Default medium hall
  }

  private createImpulseResponse(duration: number, decay: number) {
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }

    this.convolver = this.ctx.createConvolver();
    this.convolver.buffer = impulse;
    this.convolver.connect(this.wetGain);
  }

  getWetInput(): AudioNode { return this.convolver!; }

  setMix(wet: number) {
    this.wetGain.gain.setTargetAtTime(wet, this.ctx.currentTime, 0.05);
    this.dryGain.gain.setTargetAtTime(1 - wet, this.ctx.currentTime, 0.05);
  }

  setDecay(duration: number, decay: number) {
    this.createImpulseResponse(duration, decay);
  }
}

class CompressorProcessor {
  private compressor: DynamicsCompressorNode;

  constructor(ctx: AudioContext, dest: AudioNode) {
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -20;
    this.compressor.knee.value = 10;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.005;
    this.compressor.release.value = 0.1;
    this.compressor.connect(dest);
  }

  getInput(): AudioNode { return this.compressor; }

  setThreshold(db: number) {
    this.compressor.threshold.setTargetAtTime(db, this.compressor.context.currentTime, 0.05);
  }
}

class DistortionProcessor {
  private waveShaper: WaveShaperNode;

  constructor(ctx: AudioContext, dest: AudioNode, amount: number = 0.3) {
    this.waveShaper = ctx.createWaveShaper();
    this.waveShaper.curve = this.makeDistortionCurve(amount);
    this.waveShaper.connect(dest);
  }

  private makeDistortionCurve(amount: number): Float32Array {
    const samples = 256;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * Math.PI * 0.2) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  getInput(): AudioNode { return this.waveShaper; }
}

class DelayProcessor {
  private delay: DelayNode;
  private feedback: GainNode;
  private wetGain: GainNode;
  private dryGain: GainNode;

  constructor(ctx: AudioContext, dest: AudioNode) {
    this.delay = ctx.createDelay(1.0);
    this.delay.delayTime.value = 0.15;
    
    this.feedback = ctx.createGain();
    this.feedback.gain.value = 0.2;
    
    this.wetGain = ctx.createGain();
    this.wetGain.gain.value = 0.15;
    this.dryGain = ctx.createGain();
    this.dryGain.gain.value = 0.85;

    this.delay.connect(this.feedback);
    this.feedback.connect(this.delay);
    this.delay.connect(this.wetGain);
    this.wetGain.connect(dest);
    this.dryGain.connect(dest);
  }

  getInput(): AudioNode { return this.delay; }
}

// ─── Voice Synthesis Engine ─────────────────────────────────────────────

class VoiceSynthesizer {
  private static VOICE_CONFIGS: Record<string, { rate: number; pitch: number; voiceName?: string }> = {
    'SYSTEM': { rate: 0.7, pitch: 0.3 },
    'STATION AI': { rate: 0.9, pitch: 1.0 },
    '???': { rate: 1.2, pitch: 0.2 },
  };

  static speak(line: VoiceLine): Promise<void> {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        resolve();
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(line.text);
      const config = this.VOICE_CONFIGS[line.speaker] || { rate: 1.0, pitch: 1.0 };
      
      utterance.rate = config.rate;
      utterance.pitch = config.pitch;
      utterance.volume = 1.0;

      // Apply mood effects
      if (line.mood === 'glitch') {
        utterance.rate = Math.min(2, config.rate * 1.5);
        utterance.pitch = config.pitch + 0.3;
      } else if (line.mood === 'shiver') {
        utterance.rate = config.rate * 0.8;
        utterance.pitch = config.pitch * 0.7;
      } else if (line.mood === 'alert') {
        utterance.rate = config.rate * 1.3;
        utterance.pitch = config.pitch * 1.2;
      }

      // Find a matching voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes('Microsoft') || v.name.includes('Google') || v.lang.startsWith('en')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      // Chrome requires a small delay for SpeechSynthesis to work after page load
      window.speechSynthesis.speak(utterance);
      
      // Fallback resolve if speech takes too long
      setTimeout(resolve, 10000);
    });
  }

  static async preloadVoices(): Promise<void> {
    if (!window.speechSynthesis) return;
    // Trigger voice loading
    window.speechSynthesis.getVoices();
    // Chrome loads voices asynchronously
    if (window.speechSynthesis.addEventListener) {
      window.speechSynthesis.addEventListener('voiceschanged', () => {}, { once: true });
    }
  }
}

// ─── Adaptive Music Engine ──────────────────────────────────────────────

interface MusicLayer {
  oscillators: OscillatorNode[];
  gains: GainNode[];
  targetGain: number;
  currentGain: number;
  frequency: number;
  type: OscillatorType;
  detune: number;
}

interface BiomeMusicConfig {
  rootFreq: number;
  scale: number[];
  layers: { freq: number; type: OscillatorType; gain: number; detune: number }[];
  texture: 'drone' | 'pulse' | 'arpeggio' | 'chaos';
}

const BIOME_MUSIC: Record<string, BiomeMusicConfig> = {
  neon_core: {
    rootFreq: 55, // A1
    scale: [0, 3, 7, 12],
    layers: [
      { freq: 1, type: 'sine', gain: 0.08, detune: 0 },
      { freq: 2, type: 'triangle', gain: 0.04, detune: 3 },
      { freq: 3, type: 'sawtooth', gain: 0.015, detune: -2 },
    ],
    texture: 'drone',
  },
  quantum_void: {
    rootFreq: 65.41, // C2
    scale: [0, 2, 5, 7, 10],
    layers: [
      { freq: 1, type: 'triangle', gain: 0.06, detune: 5 },
      { freq: 1.5, type: 'sine', gain: 0.04, detune: -5 },
      { freq: 3, type: 'sawtooth', gain: 0.02, detune: 7 },
    ],
    texture: 'pulse',
  },
  ember_depths: {
    rootFreq: 49, // G1
    scale: [0, 3, 7, 10, 14],
    layers: [
      { freq: 1, type: 'sawtooth', gain: 0.07, detune: -10 },
      { freq: 2.01, type: 'square', gain: 0.03, detune: 0 },
      { freq: 4, type: 'sine', gain: 0.02, detune: 3 },
    ],
    texture: 'arpeggio',
  },
  frostbyte: {
    rootFreq: 73.42, // D2
    scale: [0, 2, 5, 9, 12],
    layers: [
      { freq: 1, type: 'sine', gain: 0.05, detune: 0 },
      { freq: 2, type: 'sine', gain: 0.03, detune: 2 },
      { freq: 5, type: 'triangle', gain: 0.015, detune: -3 },
    ],
    texture: 'drone',
  },
  void_abyss: {
    rootFreq: 41.2, // E1
    scale: [0, 4, 7, 11],
    layers: [
      { freq: 0.5, type: 'sine', gain: 0.1, detune: -5 },
      { freq: 1.5, type: 'triangle', gain: 0.03, detune: 0 },
      { freq: 3, type: 'sawtooth', gain: 0.01, detune: -7 },
    ],
    texture: 'drone',
  },
  golden_cache: {
    rootFreq: 58.27, // B1
    scale: [0, 4, 7, 12],
    layers: [
      { freq: 1, type: 'triangle', gain: 0.06, detune: 3 },
      { freq: 2, type: 'sine', gain: 0.04, detune: -2 },
      { freq: 4, type: 'square', gain: 0.01, detune: 5 },
    ],
    texture: 'arpeggio',
  },
  golden_spire: {
    rootFreq: 58.27, // B1
    scale: [0, 4, 7, 12],
    layers: [
      { freq: 1, type: 'square', gain: 0.05, detune: 7 },
      { freq: 2, type: 'sawtooth', gain: 0.03, detune: -5 },
      { freq: 3, type: 'sine', gain: 0.02, detune: 0 },
    ],
    texture: 'chaos',
  },
};

// ─── Main SoundManager ──────────────────────────────────────────────────

export class SoundManager {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  sfxGain: GainNode | null = null;
  musicGain: GainNode | null = null;
  voiceGain: GainNode | null = null;
  enabled: boolean = false;

  // Audio processing chain
  private compressor: CompressorProcessor | null = null;
  private reverb: ReverbProcessor | null = null;
  private sfxBus: GainNode | null = null;
  private preMaster: GainNode | null = null;
  private musicUpdateTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Settings
  masterVolume: number = 1.0;
  sfxVolume: number = 0.8;
  musicVolume: number = 0.6;
  voiceVolume: number = 0.7;
  isMuted: boolean = false;

  noiseBuffer: AudioBuffer | null = null;

  // Music system state
  private musicLayers: MusicLayer[] = [];
  private currentBiome: string = 'neon_core';
  private targetIntensity: number = 1.0;
  private currentIntensity: number = 1.0;
  private isBossActive: boolean = false;
  private isLowHealth: boolean = false;
  private musicUpdateTimer: number = 0;
  private arpeggioTimer: number = 0;
  private arpeggioIndex: number = 0;
  private beatTimer: number = 0;
  private beatPhase: boolean = false;

  // Voice state
  private isSpeaking: boolean = false;

  constructor() {
    this.loadSettings();
    this.preloadVoices();
  }

  private async preloadVoices() {
    VoiceSynthesizer.preloadVoices();
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem('bugsmasher_master_volume');
      if (saved !== null) this.masterVolume = parseFloat(saved);
      const savedSfx = localStorage.getItem('bugsmasher_sfx_volume');
      if (savedSfx !== null) this.sfxVolume = parseFloat(savedSfx);
      const savedMusic = localStorage.getItem('bugsmasher_music_volume');
      if (savedMusic !== null) this.musicVolume = parseFloat(savedMusic);
      const savedVoice = localStorage.getItem('bugsmasher_voice_volume');
      if (savedVoice !== null) this.voiceVolume = parseFloat(savedVoice);
      const savedMute = localStorage.getItem('bugsmasher_muted');
      if (savedMute !== null) this.isMuted = savedMute === 'true';
    } catch (e) {
      console.warn("Could not load audio settings", e);
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem('bugsmasher_master_volume', this.masterVolume.toString());
      localStorage.setItem('bugsmasher_sfx_volume', this.sfxVolume.toString());
      localStorage.setItem('bugsmasher_music_volume', this.musicVolume.toString());
      localStorage.setItem('bugsmasher_voice_volume', this.voiceVolume.toString());
      localStorage.setItem('bugsmasher_muted', this.isMuted.toString());
    } catch (e) {
      console.warn("Could not save audio settings", e);
    }
  }

  setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    this.updateGains();
    this.saveSettings();
  }

  setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    this.updateGains();
    this.saveSettings();
  }

  setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    this.updateGains();
    this.saveSettings();
  }

  setVoiceVolume(vol: number) {
    this.voiceVolume = Math.max(0, Math.min(1, vol));
    this.updateGains();
    this.saveSettings();
  }

  private updateGains() {
    if (!this.ctx || !this.preMaster) return;
    const time = this.ctx.currentTime;
    const masterTarget = this.isMuted ? 0 : this.masterVolume;
    this.preMaster.gain.setTargetAtTime(masterTarget, time, 0.05);
    
    if (this.sfxGain) this.sfxGain.gain.setTargetAtTime(this.sfxVolume, time, 0.05);
    if (this.musicGain) this.musicGain.gain.setTargetAtTime(this.musicVolume, time, 0.05);
    if (this.voiceGain) this.voiceGain.gain.setTargetAtTime(this.voiceVolume, time, 0.05);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.updateGains();
    this.saveSettings();
    if (!this.isMuted) {
      this.init();
      this.uiClick();
    }
    return this.isMuted;
  }

  init() {
    if (!this.ctx) {
      const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
      const AudioContextClass = w.AudioContext || w.webkitAudioContext;
      if (!AudioContextClass) return;

      this.ctx = new AudioContextClass();

      // Build audio processing chain:
      // Source → SFXBus/MusicBus → Reverb → Compressor → Master
      
      this.preMaster = this.ctx.createGain();
      this.preMaster.gain.value = this.masterVolume;
      this.preMaster.connect(this.ctx.destination);

      // Compressor (master bus)
      this.compressor = new CompressorProcessor(this.ctx, this.preMaster);

      // Reverb (send/return)
      this.reverb = new ReverbProcessor(this.ctx, this.preMaster);

      // Main mix bus
      const mixBus = this.ctx.createGain();
      mixBus.connect(this.compressor.getInput());

      // Dry signal goes through compressor directly
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(mixBus);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(mixBus);

      this.voiceGain = this.ctx.createGain();
      this.voiceGain.gain.value = this.voiceVolume;
      this.voiceGain.connect(mixBus);

      // Reverb send from SFX
      const reverbSend = this.ctx.createGain();
      reverbSend.gain.value = 0.25;
      this.sfxGain.connect(reverbSend);
      reverbSend.connect(this.reverb!.getWetInput());
      
      // Reverb send from music (smaller)
      const musicReverb = this.ctx.createGain();
      musicReverb.gain.value = 0.15;
      this.musicGain.connect(musicReverb);
      musicReverb.connect(this.reverb!.getWetInput());

      // Generate noise buffer
      const bufferSize = this.ctx.sampleRate * 2;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.updateGains();
      this.enabled = true;
      void audioAssets.init(this.ctx);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // ─── Advanced Synthesis Utilities ──────────────────────────────────

  /** Create a rich tone with multiple oscillator layers and effects */
  private playRichTone(
    config: {
      frequencies: number[];
      types: OscillatorType[];
      durations: number[];
      volumes: number[];
      slideTo?: number[];
      filterFreq?: number;
      filterType?: BiquadFilterType;
      filterQ?: number;
    },
    isMusic: boolean = false
  ): { oscillators: OscillatorNode[] } {
    if (!this.enabled || !this.ctx || !this.sfxGain || !this.musicGain) return { oscillators: [] };

    const targetGain = isMusic ? this.musicGain : this.sfxGain;
    const oscs: OscillatorNode[] = [];
    const count = Math.min(config.frequencies.length, config.types.length, config.durations.length, config.volumes.length);

    for (let i = 0; i < count; i++) {
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = config.types[i];
        osc.frequency.setValueAtTime(config.frequencies[i], this.ctx.currentTime);

        if (config.slideTo && i < config.slideTo.length) {
          osc.frequency.exponentialRampToValueAtTime(
            Math.max(20, config.slideTo[i]),
            this.ctx.currentTime + config.durations[i]
          );
        }

        filter.type = config.filterType || 'lowpass';
        filter.frequency.setValueAtTime(config.filterFreq || 20000, this.ctx.currentTime);
        if (config.filterQ) {
          filter.Q.setValueAtTime(config.filterQ, this.ctx.currentTime);
        }
        // Auto filter sweep
        if (config.filterFreq && config.filterFreq < 20000) {
          filter.frequency.exponentialRampToValueAtTime(
            20, this.ctx.currentTime + config.durations[i]
          );
        }

        gain.gain.setValueAtTime(config.volumes[i], this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + config.durations[i]);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(targetGain);

        osc.start();
        osc.stop(this.ctx.currentTime + config.durations[i]);
        oscs.push(osc);
      } catch (e) {
        // Silently skip failed oscillators
      }
    }

    return { oscillators: oscs };
  }

  /** Create a shaped noise burst with filter envelope */
  private playShapedNoise(
    duration: number,
    volume: number,
    filterStart: number = 2000,
    filterEnd: number = 20,
    filterType: BiquadFilterType = 'lowpass'
  ) {
    if (!this.enabled || !this.ctx || !this.sfxGain || !this.noiseBuffer) return;

    try {
      const source = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      const filter2 = this.ctx.createBiquadFilter();

      source.buffer = this.noiseBuffer;

      filter.type = filterType;
      filter.frequency.setValueAtTime(filterStart, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(filterEnd, this.ctx.currentTime + duration);

      // Secondary filter for resonance
      filter2.type = 'bandpass';
      filter2.frequency.setValueAtTime(filterStart * 0.5, this.ctx.currentTime);
      filter2.Q.setValueAtTime(1.5, this.ctx.currentTime);

      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      source.connect(filter);
      filter.connect(filter2);
      filter2.connect(gain);
      gain.connect(this.sfxGain);

      source.start();
      source.stop(this.ctx.currentTime + duration);
    } catch (e) { /* ignore */ }
  }

  /** Apply amplitude modulation to create rich textures */
  private playModulatedTone(
    freq: number,
    modFreq: number,
    type: OscillatorType,
    duration: number,
    volume: number = 0.1
  ) {
    if (!this.enabled || !this.ctx || !this.sfxGain) return;

    try {
      const carrier = this.ctx.createOscillator();
      const modulator = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();
      const gain = this.ctx.createGain();

      carrier.type = type;
      carrier.frequency.setValueAtTime(freq, this.ctx.currentTime);

      modulator.type = 'sine';
      modulator.frequency.setValueAtTime(modFreq, this.ctx.currentTime);
      modGain.gain.setValueAtTime(0.5, this.ctx.currentTime);

      // Modulator modulates carrier amplitude
      modulator.connect(modGain);
      modGain.connect(gain.gain);

      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      carrier.connect(gain);
      gain.connect(this.sfxGain);

      carrier.start();
      modulator.start();
      carrier.stop(this.ctx.currentTime + duration);
      modulator.stop(this.ctx.currentTime + duration);
    } catch (e) { /* ignore */ }
  }

  /** Generate a subsonic bass hit with impact transient */
  private playImpact(
    freq: number = 60,
    duration: number = 0.5,
    volume: number = 0.3,
    punch: boolean = true
  ) {
    if (!this.enabled || !this.ctx || !this.sfxGain) return;

    try {
      // Sub bass layer
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(freq, this.ctx.currentTime);
      sub.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + duration);
      subGain.gain.setValueAtTime(volume, this.ctx.currentTime);
      subGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      sub.connect(subGain);
      subGain.connect(this.sfxGain);
      sub.start();
      sub.stop(this.ctx.currentTime + duration);

      if (punch) {
        // Transient click for impact
        const trans = this.ctx.createOscillator();
        const transGain = this.ctx.createGain();
        trans.type = 'square';
        trans.frequency.setValueAtTime(200, this.ctx.currentTime);
        trans.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.05);
        transGain.gain.setValueAtTime(volume * 0.5, this.ctx.currentTime);
        transGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        trans.connect(transGain);
        transGain.connect(this.sfxGain);
        trans.start();
        trans.stop(this.ctx.currentTime + 0.05);

        // Noise burst
        this.playShapedNoise(0.08, volume * 0.3, 5000, 50, 'lowpass');
      }
    } catch (e) { /* ignore */ }
  }

  /** Play a musical note with harmonics for richer tone */
  private playNote(
    baseFreq: number,
    type: OscillatorType,
    duration: number,
    volume: number,
    harmonics: number[] = [1, 2, 3],
    harmonicVolumes: number[] = [1, 0.3, 0.15],
    isMusic: boolean = false
  ) {
    return this.playRichTone({
      frequencies: harmonics.map((h, i) => baseFreq * h),
      types: harmonics.map(() => type),
      durations: harmonics.map(() => duration),
      volumes: harmonics.map((_, i) => volume * (harmonicVolumes[i] || 0.1)),
      slideTo: undefined,
      filterFreq: baseFreq * 8,
      filterType: 'lowpass',
    }, isMusic);
  }

  // ─── SFX Methods ──────────────────────────────────────────────────

  playHitstop(intensity: number) {
    if (!this.enabled || !this.ctx || !this.sfxGain) return;
    try {
      const duration = 0.05 + intensity * 0.15;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + duration);
      gain.gain.setValueAtTime(this.sfxVolume * 0.2, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // ignore
    }
  }

  shoot() {
    if (this.ctx && this.sfxGain && audioAssets.play('shoot', this.sfxGain, this.sfxVolume * 0.5))
      return;
    // Punchy sci-fi gunshot: transient click + mid punch + noise tail
    this.playRichTone({
      frequencies: [1200, 600, 200],
      types: ['square', 'sawtooth', 'sine'],
      durations: [0.03, 0.08, 0.15],
      volumes: [0.06, 0.04, 0.03],
      slideTo: [200, 100, 30],
      filterFreq: 8000,
      filterType: 'highpass',
    });
    this.playShapedNoise(0.06, 0.03, 4000, 100, 'bandpass');
  }

  splat() {
    if (this.ctx && this.sfxGain && audioAssets.play('splat', this.sfxGain, this.sfxVolume * 0.6))
      return;
    // Satisfying wet squish: pitched noise + squelch
    this.playShapedNoise(0.2, 0.1, 2000, 30, 'lowpass');
    this.playRichTone({
      frequencies: [300, 150, 80],
      types: ['sawtooth', 'sine', 'sine'],
      durations: [0.15, 0.25, 0.3],
      volumes: [0.08, 0.06, 0.04],
      slideTo: [50, 30, 20],
      filterFreq: 1500,
      filterType: 'lowpass',
    });
    // Wet squelch modulation
    this.playModulatedTone(200, 35, 'sawtooth', 0.15, 0.05);
  }

  hitBase() {
    // Heavy structural impact: deep bass + metallic hit + long rumble
    this.playImpact(80, 0.6, 0.35, true);
    this.playShapedNoise(0.5, 0.15, 800, 20, 'lowpass');
    // Metallic ring
    this.playRichTone({
      frequencies: [300, 450],
      types: ['triangle', 'triangle'],
      durations: [0.3, 0.5],
      volumes: [0.04, 0.02],
      filterFreq: 2000,
      filterType: 'bandpass',
      filterQ: 10,
    });
  }

  powerup(type?: string) {
    if (type === 'shield') {
      // Sci-fi shield hum
      this.playRichTone({
        frequencies: [200, 400, 800],
        types: ['sine', 'triangle', 'sine'],
        durations: [0.3, 0.4, 0.6],
        volumes: [0.08, 0.05, 0.03],
        slideTo: [800, 1200, 1600],
        filterFreq: 4000,
      });
    } else if (type === 'rapid_fire') {
      // Machine gun spin up
      for (let i = 0; i < 4; i++) {
        const delay = i * 0.04;
        setTimeout(() => {
          this.playRichTone({
            frequencies: [400 + i * 200, 800 + i * 300],
            types: ['square', 'sawtooth'],
            durations: [0.03, 0.05],
            volumes: [0.04, 0.02],
            slideTo: [200 + i * 100, 400 + i * 200],
            filterFreq: 4000 + i * 1000,
            filterType: 'highpass',
          });
        }, delay * 1000);
      }
    } else if (type === 'multiplier') {
      // Ascending arpeggio with sparkle
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
      notes.forEach((freq, i) => {
        setTimeout(() => {
          this.playNote(freq, 'triangle', 0.2, 0.06, [1, 3, 5], [1, 0.2, 0.1]);
        }, i * 80);
      });
      // Sparkly top
      setTimeout(() => {
        this.playRichTone({
          frequencies: [1568, 2093],
          types: ['sine', 'sine'],
          durations: [0.4, 0.3],
          volumes: [0.04, 0.02],
          slideTo: [2093, 2637],
          filterFreq: 8000,
          filterType: 'highpass',
        });
      }, 320);
    } else if (type === 'slow_mo') {
      // Descending time vortex
      this.playRichTone({
        frequencies: [600, 400, 200, 100],
        types: ['triangle', 'sawtooth', 'sine', 'sine'],
        durations: [0.2, 0.3, 0.5, 0.8],
        volumes: [0.06, 0.04, 0.03, 0.02],
        slideTo: [200, 100, 50, 20],
        filterFreq: 3000,
      });
      this.playShapedNoise(0.6, 0.04, 2000, 10, 'lowpass');
    } else if (type === 'overdrive') {
      // Overdrive power surge
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          this.playRichTone({
            frequencies: [100 + i * 80, 200 + i * 100, 300 + i * 120],
            types: ['sawtooth', 'square', 'sine'],
            durations: [0.08, 0.1, 0.12],
            volumes: [0.05, 0.03, 0.02],
            slideTo: [200 + i * 120, 400 + i * 150, 600 + i * 200],
            filterFreq: 3000 + i * 500,
            filterType: 'highpass',
          });
        }, i * 40);
      }
    } else {
      // Default powerup: classic ascending tone
      this.playNote(440, 'triangle', 0.15, 0.08);
      setTimeout(() => this.playNote(660, 'triangle', 0.2, 0.06), 80);
      setTimeout(() => this.playNote(880, 'sine', 0.3, 0.05, [1, 2], [1, 0.3]), 160);
    }
  }

  resource(type: string) {
    switch(type) {
      case 'scrap':
        // Metallic ping
        this.playRichTone({
          frequencies: [1200, 1800],
          types: ['triangle', 'sine'],
          durations: [0.05, 0.08],
          volumes: [0.03, 0.015],
          slideTo: [1800, 2400],
          filterFreq: 6000,
          filterType: 'bandpass',
          filterQ: 8,
        });
        break;
      case 'plasma':
        // Energy crackle
        this.playRichTone({
          frequencies: [800, 1200],
          types: ['sine', 'triangle'],
          durations: [0.1, 0.15],
          volumes: [0.04, 0.02],
          slideTo: [1200, 1600],
        });
        this.playShapedNoise(0.08, 0.02, 3000, 500, 'bandpass');
        break;
      case 'alloy':
        // Heavy clank
        this.playImpact(200, 0.12, 0.06, true);
        break;
      case 'flux':
        // Ethereal shimmer
        this.playRichTone({
          frequencies: [1500, 2000, 2500],
          types: ['sine', 'triangle', 'sine'],
          durations: [0.15, 0.2, 0.25],
          volumes: [0.04, 0.02, 0.01],
          slideTo: [500, 800, 1000],
          filterFreq: 4000,
        });
        break;
      case 'neural_core':
        // Legendary chime - slow, resonant, layered
        this.playNote(300, 'sine', 0.4, 0.06, [1, 2, 3, 5], [1, 0.5, 0.3, 0.15]);
        setTimeout(() => this.playNote(450, 'sine', 0.5, 0.04, [1, 2, 3], [1, 0.4, 0.2]), 200);
        setTimeout(() => this.playNote(600, 'triangle', 0.6, 0.03, [1, 3], [1, 0.3]), 400);
        break;
      default:
        this.uiHover();
    }
  }

  bossHit() {
    // Heavy thud with armor resonance
    this.playImpact(100, 0.15, 0.2, true);
    this.playRichTone({
      frequencies: [400, 600],
      types: ['square', 'triangle'],
      durations: [0.1, 0.15],
      volumes: [0.1, 0.05],
      slideTo: [50, 80],
      filterFreq: 2000,
      filterType: 'bandpass',
      filterQ: 5,
    });
    this.playShapedNoise(0.1, 0.08, 1000, 50, 'bandpass');
  }

  bossDeath() {
    // Epic boss death: massive explosion + metal screech + fade
    this.playImpact(40, 1.5, 0.5, true);
    this.playShapedNoise(2.0, 0.35, 2000, 5, 'lowpass');
    
    // Ascending metallic screech
    this.playRichTone({
      frequencies: [100, 200, 400, 800],
      types: ['sawtooth', 'square', 'sawtooth', 'square'],
      durations: [0.5, 0.6, 0.8, 1.0],
      volumes: [0.15, 0.1, 0.06, 0.03],
      slideTo: [2000, 3000, 4000, 5000],
      filterFreq: 8000,
      filterType: 'highpass',
    });
    
    // Deep sub-bass rumble
    setTimeout(() => {
      this.playImpact(30, 1.0, 0.3, false);
    }, 500);
  }

  bossWarning() {
    // Ominous alarm: pulsing low tone with glitch
    this.playRichTone({
      frequencies: [80, 80],
      types: ['square', 'sawtooth'],
      durations: [0.6, 0.6],
      volumes: [0.15, 0.08],
      slideTo: [60, 50],
      filterFreq: 500,
      filterType: 'lowpass',
    });
    setTimeout(() => {
      this.playRichTone({
        frequencies: [80, 80],
        types: ['square', 'sawtooth'],
        durations: [0.6, 0.6],
        volumes: [0.18, 0.1],
        slideTo: [60, 50],
        filterFreq: 500,
      });
    }, 700);
    setTimeout(() => {
      this.playRichTone({
        frequencies: [60, 40],
        types: ['square', 'sawtooth'],
        durations: [0.8, 1.0],
        volumes: [0.25, 0.12],
        slideTo: [40, 20],
        filterFreq: 300,
      });
    }, 1400);
    // Alert siren overlay
    setTimeout(() => {
      this.playModulatedTone(400, 8, 'square', 1.2, 0.04);
    }, 200);
  }

  bossAbility() {
    // Charging energy sound
    this.playRichTone({
      frequencies: [200, 300, 500],
      types: ['sawtooth', 'square', 'sawtooth'],
      durations: [0.3, 0.4, 0.5],
      volumes: [0.08, 0.05, 0.03],
      slideTo: [800, 1200, 1600],
      filterFreq: 3000,
      filterType: 'bandpass',
      filterQ: 3,
    });
    this.playShapedNoise(0.3, 0.05, 5000, 100, 'bandpass');
  }

  skillUpgrade() {
    // Satisfying upgrade: ascending arpeggio with sparkle
    const notes = [400, 500, 600, 800, 1200];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playNote(freq, 'triangle', 0.12, 0.06, [1, 2, 3], [1, 0.3, 0.1]);
      }, i * 60);
    });
    // Final chime
    setTimeout(() => {
      this.playRichTone({
        frequencies: [1200, 1500, 1800],
        types: ['sine', 'sine', 'sine'],
        durations: [0.5, 0.4, 0.3],
        volumes: [0.08, 0.04, 0.02],
        slideTo: [1500, 1800, 2400],
        filterFreq: 8000,
        filterType: 'highpass',
      });
    }, 300);

    // Sub bass impact
    setTimeout(() => {
      this.playImpact(60, 0.3, 0.15, false);
    }, 320);
  }

  nuke() {
    // Massive nuclear explosion
    // Phase 1: initial impact
    this.playImpact(40, 1.5, 0.6, true);
    
    // Phase 2: shockwave rumble
    this.playShapedNoise(2.5, 0.4, 1500, 5, 'lowpass');
    
    // Phase 3: debris crackle
    setTimeout(() => {
      this.playShapedNoise(1.5, 0.15, 5000, 100, 'highpass');
    }, 300);
    
    // Phase 4: low end resonance
    setTimeout(() => {
      this.playImpact(25, 2.0, 0.25, false);
    }, 600);

    // Metallic ring
    this.playRichTone({
      frequencies: [150, 300],
      types: ['square', 'sawtooth'],
      durations: [0.8, 1.0],
      volumes: [0.15, 0.08],
      slideTo: [30, 50],
      filterFreq: 2000,
      filterType: 'bandpass',
      filterQ: 3,
    });
  }

  dash() {
    // Whoosh: fast frequency sweep with air
    this.playRichTone({
      frequencies: [300, 600, 1200],
      types: ['triangle', 'sine', 'sine'],
      durations: [0.12, 0.15, 0.18],
      volumes: [0.1, 0.06, 0.03],
      slideTo: [1200, 1800, 2400],
      filterFreq: 8000,
      filterType: 'highpass',
    });
    this.playShapedNoise(0.15, 0.08, 3000, 50, 'bandpass');
    // Subsonic push
    this.playImpact(80, 0.15, 0.1, false);
  }

  upgrade() {
    // Tech upgrade: mechanical clicks + power up
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.playRichTone({
          frequencies: [500 + i * 200, 400 + i * 300],
          types: ['square', 'triangle'],
          durations: [0.06, 0.1],
          volumes: [0.04, 0.02],
          slideTo: [400 + i * 200, 300 + i * 300],
          filterFreq: 4000 + i * 1000,
          filterType: 'bandpass',
          filterQ: 5,
        });
      }, i * 120);
    }
    // Final power hum
    setTimeout(() => {
      this.playRichTone({
        frequencies: [800, 1000],
        types: ['sine', 'triangle'],
        durations: [0.4, 0.5],
        volumes: [0.06, 0.03],
        slideTo: [1000, 1200],
        filterFreq: 5000,
      });
    }, 360);
  }

  uiHover() {
    // Subtle click
    this.playRichTone({
      frequencies: [800, 1200],
      types: ['sine', 'triangle'],
      durations: [0.04, 0.03],
      volumes: [0.015, 0.008],
      filterFreq: 6000,
      filterType: 'bandpass',
      filterQ: 10,
    });
  }

  uiClick() {
    if (this.ctx && this.sfxGain && audioAssets.play('ui_click', this.sfxGain, this.sfxVolume * 0.4))
      return;
    // Satisfying click: transient + body
    this.playRichTone({
      frequencies: [1000, 1500],
      types: ['triangle', 'sine'],
      durations: [0.05, 0.04],
      volumes: [0.025, 0.012],
      filterFreq: 5000,
      filterType: 'bandpass',
      filterQ: 8,
    });
  }

  uiError() {
    // Error buzz
    this.playRichTone({
      frequencies: [200, 150],
      types: ['sawtooth', 'square'],
      durations: [0.2, 0.15],
      volumes: [0.04, 0.02],
      slideTo: [100, 80],
      filterFreq: 800,
      filterType: 'lowpass',
    });
  }

  scoreTick() {
    // Quick percussive tick
    this.playRichTone({
      frequencies: [2000, 3000],
      types: ['square', 'sine'],
      durations: [0.02, 0.015],
      volumes: [0.015, 0.008],
      filterFreq: 8000,
      filterType: 'bandpass',
      filterQ: 15,
    });
  }

  // ─── Armory UI Sounds ────────────────────────────────────────────

  /** Equip/apply sound for selecting skins and themes — satisfying magnetic snap */
  armoryEquip() {
    // Metallic snap: brief resonant ping with magnetic pull
    this.playRichTone({
      frequencies: [1200, 1800, 2400],
      types: ['triangle', 'sine', 'sine'],
      durations: [0.06, 0.1, 0.08],
      volumes: [0.04, 0.025, 0.015],
      slideTo: [1800, 2400, 3000],
      filterFreq: 6000,
      filterType: 'bandpass',
      filterQ: 12,
    });
    // Sub bass confirmation thump
    this.playImpact(100, 0.08, 0.04, false);
  }

  /** Tab switch sound — quick airy swoosh */
  armoryTabSwitch() {
    // Fast sweep: swoosh with slight pitch bend
    this.playRichTone({
      frequencies: [400, 800, 1200],
      types: ['sine', 'triangle', 'sine'],
      durations: [0.06, 0.08, 0.06],
      volumes: [0.02, 0.015, 0.008],
      slideTo: [1200, 1600, 2000],
      filterFreq: 5000,
      filterType: 'highpass',
    });
    // Air noise
    this.playShapedNoise(0.06, 0.015, 3000, 500, 'bandpass');
  }

  /** Premium unlock fanfare for redeeming a supporter key */
  armoryUnlockTier() {
    // Stage 1: Ascending chime sequence (triumphant)
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5 E5 G5 C6 E6
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playNote(freq, 'triangle', 0.25, 0.07, [1, 2, 3], [1, 0.4, 0.2]);
      }, i * 90);
    });

    // Stage 2: Sparkly shimmer on top
    setTimeout(() => {
      this.playRichTone({
        frequencies: [1568, 2093, 2637],
        types: ['sine', 'sine', 'sine'],
        durations: [0.6, 0.5, 0.4],
        volumes: [0.06, 0.04, 0.02],
        slideTo: [2093, 2637, 3136],
        filterFreq: 10000,
        filterType: 'highpass',
      });
    }, 450);

    // Stage 3: Deep bass impact for weight
    setTimeout(() => {
      this.playImpact(50, 0.6, 0.25, true);
    }, 480);

    // Stage 4: Resonant pad swell
    setTimeout(() => {
      this.playRichTone({
        frequencies: [261.63, 392, 523.25], // C4 G4 C5
        types: ['sine', 'triangle', 'sine'],
        durations: [1.2, 1.0, 0.8],
        volumes: [0.04, 0.025, 0.015],
        slideTo: [392, 523.25, 659.25],
        filterFreq: 3000,
      });
    }, 500);

    // Stage 5: Golden sparkle dust
    setTimeout(() => {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          this.playRichTone({
            frequencies: [2000 + i * 400, 2500 + i * 500],
            types: ['sine', 'triangle'],
            durations: [0.15, 0.12],
            volumes: [0.02, 0.01],
            slideTo: [1500 + i * 300, 2000 + i * 400],
            filterFreq: 8000,
            filterType: 'bandpass',
            filterQ: 10,
          });
        }, i * 100);
      }
    }, 600);
  }

  // ─── Adaptive Soundtrack ──────────────────────────────────────────

  /** Update the music system's intensity based on current game state */
  updateGameState(state: { intensity: number; healthPercent: number; isBossWave: boolean }) {
    this.targetIntensity = Math.max(0.3, Math.min(2.0, state.intensity));
    this.isBossActive = state.isBossWave;
    this.isLowHealth = state.healthPercent < 0.3;
  }

  stopMusic() {
    // Clear any pending music update
    if (this.musicUpdateTimeoutId !== null) {
      clearTimeout(this.musicUpdateTimeoutId);
      this.musicUpdateTimeoutId = null;
    }

    this.musicLayers.forEach(layer => {
      layer.oscillators.forEach((osc, i) => {
        if (this.ctx) {
          // Instant volume kill to prevent overlap
          layer.gains[i].gain.setValueAtTime(0, this.ctx.currentTime);
          setTimeout(() => {
            try { osc.stop(); } catch (e) { /* already stopped */ }
          }, 10);
        }
      });
    });
    this.musicLayers = [];
    this.currentIntensity = 1.0;
    this.arpeggioIndex = 0;
    this.beatPhase = false;
  }

  playBiomeMusic(biome: string) {
    if (!this.enabled || !this.ctx || !this.musicGain) return;
    
    // Fade out current music
    this.stopMusic();
    this.currentBiome = biome;

    const config = BIOME_MUSIC[biome] || BIOME_MUSIC.neon_core;
    const now = this.ctx.currentTime;

    // Create music layers based on biome config
    config.layers.forEach((layerConfig, layerIdx) => {
      const oscs: OscillatorNode[] = [];
      const gains: GainNode[] = [];
      const oscCount = config.texture === 'arpeggio' ? 3 : (config.texture === 'chaos' ? 4 : 2);

      for (let i = 0; i < oscCount; i++) {
        try {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();

          osc.type = layerConfig.type;
          const freqMult = 1 + i * (1 + layerConfig.freq);
          osc.frequency.setValueAtTime(config.rootFreq * freqMult, now);
          
          // Add slight detune for richness
          osc.detune.setValueAtTime(layerConfig.detune + (Math.random() - 0.5) * 3, now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.exponentialRampToValueAtTime(layerConfig.gain, now + 2);

          osc.connect(gain);
          gain.connect(this.musicGain!);
          osc.start();

          oscs.push(osc);
          gains.push(gain);
        } catch (e) { /* ignore */ }
      }

      this.musicLayers.push({
        oscillators: oscs,
        gains,
        targetGain: layerConfig.gain,
        currentGain: layerConfig.gain,
        frequency: config.rootFreq,
        type: layerConfig.type,
        detune: layerConfig.detune,
      });
    });

    // Start periodic modulation timer
    this.musicUpdateTimer = 0;
    this.arpeggioTimer = 0;
    
    // Start music update loop
    this.scheduleMusicUpdate();
  }

  private scheduleMusicUpdate() {
    if (!this.ctx) return;
    const updateInterval = 0.1; // 100ms intervals
    this.musicUpdateTimer += updateInterval;

    // Update all layer frequencies and gains based on intensity
    const intensityFactor = this.targetIntensity;
    const bossFactor = this.isBossActive ? 0.7 : 1.0;
    const healthCrisis = this.isLowHealth ? 1.5 : 1.0;
    const combinedFactor = intensityFactor * bossFactor * healthCrisis;

    this.musicLayers.forEach((layer) => {
      const now = this.ctx!.currentTime;
      
      layer.gains.forEach((gain) => {
        const baseGain = layer.currentGain * Math.min(2, combinedFactor);
        gain.gain.setTargetAtTime(
          Math.min(0.3, baseGain),
          now,
          0.3
        );
      });

      layer.oscillators.forEach((osc, i) => {
        const pitchShift = 1 + (combinedFactor - 1) * 0.2;
        const baseFreq = layer.frequency * (1 + i * 2);
        osc.frequency.setTargetAtTime(
          baseFreq * Math.min(2, pitchShift),
          now,
          0.5
        );
      });
    });

    // Schedule next update if still playing — clear first to prevent stacked orphan chains
    if (this.musicLayers.length > 0) {
      if (this.musicUpdateTimeoutId !== null) {
        clearTimeout(this.musicUpdateTimeoutId);
      }
      this.musicUpdateTimeoutId = setTimeout(() => this.scheduleMusicUpdate(), updateInterval * 1000);
    }
  }

  // ─── Voice Synthesis ──────────────────────────────────────────────

  /** Speak a dialogue line for cutscenes using Speech Synthesis */
  async speak(line: VoiceLine): Promise<void> {
    this.isSpeaking = true;
    try {
      await VoiceSynthesizer.speak(line);
    } catch (e) {
      console.warn('Voice synthesis failed:', e);
    }
    this.isSpeaking = false;
  }

  /** Stop any ongoing voice playback */
  stopSpeaking() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
  }

  get isVoicePlaying(): boolean {
    return this.isSpeaking;
  }

  // ─── Cleanup ──────────────────────────────────────────────────────

  destroy() {
    this.stopMusic();
    this.stopSpeaking();
    if (this.ctx) {
      this.ctx.close();
    }
    this.ctx = null;
    this.enabled = false;
  }
}

export const soundManager = new SoundManager();
