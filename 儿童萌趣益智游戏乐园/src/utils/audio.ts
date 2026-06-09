/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { readStorageString, storageKeys, writeStorageString } from './gameStorage';

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isEffectsMuted: boolean = false;
  private isMusicMuted: boolean = false;
  private isBgmPlaying: boolean = false;
  private bgmAudio: HTMLAudioElement | null = null;
  private readonly bgmSource = `${import.meta.env.BASE_URL}audio/Sunlight_on_the_Sandbox.mp3`;
  private readonly bgmVolume = 0.22;
  private bgmFadeFrame: number | null = null;

  constructor() {
    // Read cached setting if exists
    try {
      const legacyMuted = readStorageString(storageKeys.synthMutedLegacy);
      const storedEffects = readStorageString(storageKeys.effectsMuted);
      const storedMusic = readStorageString(storageKeys.musicMuted);

      if (storedEffects !== null) {
        this.isEffectsMuted = storedEffects === 'true';
      } else if (legacyMuted !== null) {
        this.isEffectsMuted = legacyMuted === 'true';
      }

      if (storedMusic !== null) {
        this.isMusicMuted = storedMusic === 'true';
      } else if (legacyMuted !== null) {
        this.isMusicMuted = legacyMuted === 'true';
      }
    } catch {
      this.isEffectsMuted = false;
      this.isMusicMuted = false;
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    // Resume context if state is suspended (common browser requirement)
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  getMuteState(): boolean {
    return this.isEffectsMuted && this.isMusicMuted;
  }

  getEffectsMuteState(): boolean {
    return this.isEffectsMuted;
  }

  getMusicMuteState(): boolean {
    return this.isMusicMuted;
  }

  setMuteState(muted: boolean) {
    this.setEffectsMuteState(muted);
    this.setMusicMuteState(muted);
  }

  setEffectsMuteState(muted: boolean) {
    this.isEffectsMuted = muted;
    try {
      writeStorageString(storageKeys.synthMutedLegacy, String(muted));
      writeStorageString(storageKeys.effectsMuted, String(muted));
    } catch {}
  }

  setMusicMuteState(muted: boolean) {
    this.isMusicMuted = muted;
    try {
      writeStorageString(storageKeys.synthMutedLegacy, String(muted && this.isEffectsMuted));
      writeStorageString(storageKeys.musicMuted, String(muted));
    } catch {}

    if (muted) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
  }

  toggleMute(): boolean {
    this.setMuteState(!this.getMuteState());
    return this.getMuteState();
  }

  toggleEffectsMute(): boolean {
    this.setEffectsMuteState(!this.isEffectsMuted);
    return this.isEffectsMuted;
  }

  toggleMusicMute(): boolean {
    this.setMusicMuteState(!this.isMusicMuted);
    return this.isMusicMuted;
  }

  private fadeBgmTo(targetVolume: number, durationMs: number, onComplete?: () => void) {
    if (!this.bgmAudio) return;
    if (this.bgmFadeFrame !== null) {
      window.cancelAnimationFrame(this.bgmFadeFrame);
      this.bgmFadeFrame = null;
    }

    const audio = this.bgmAudio;
    const startVolume = audio.volume;
    const startTime = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / durationMs);
      audio.volume = startVolume + (targetVolume - startVolume) * progress;
      if (progress < 1) {
        this.bgmFadeFrame = window.requestAnimationFrame(step);
      } else {
        this.bgmFadeFrame = null;
        onComplete?.();
      }
    };

    this.bgmFadeFrame = window.requestAnimationFrame(step);
  }

  // --- Background Music (BGM) file playback ---
  startBgm() {
    if (this.isMusicMuted) return;
    if (this.isBgmPlaying) return;

    this.initContext();

    if (!this.bgmAudio) {
      this.bgmAudio = new Audio(this.bgmSource);
      this.bgmAudio.loop = true;
      this.bgmAudio.preload = 'auto';
      this.bgmAudio.volume = 0;
    }

    this.isBgmPlaying = true;
    this.bgmAudio.currentTime = this.bgmAudio.currentTime || 0;
    this.bgmAudio.play()
      .then(() => {
        this.fadeBgmTo(this.bgmVolume, 900);
      })
      .catch(() => {
        this.isBgmPlaying = false;
      });
  }

  stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmAudio) {
      this.fadeBgmTo(0, 450, () => {
        if (!this.isBgmPlaying && this.bgmAudio) {
          this.bgmAudio.pause();
        }
      });
    }
  }

  // Cute pop bubble click sound
  playClick() {
    if (this.isEffectsMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    
    // Quick sweep from 400Hz to 1200Hz in 50ms for a "pop" bubble effect
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.05);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Wooden block slither or grid move swoosh sound
  playMove() {
    if (this.isEffectsMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Use triangle wave for wood-like warm acoustic texture
    osc.type = 'triangle';
    
    const now = ctx.currentTime;
    // Rapid sliding pitch drop
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.07);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Metallic coin ring for adding score or claim rewards
  playScore() {
    if (this.isEffectsMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Dual metal frequency ring (987Hz & 1320Hz)
    [987, 1318].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      // Subtle pitch bend upwards
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + 0.15);

      gain.gain.setValueAtTime(idx === 0 ? 0.08 : 0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    });
  }

  // Success chime for winning a turn, solving a sub-puzzle level
  playSuccess() {
    if (this.isEffectsMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const melody = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const noteDuration = 0.08;

    melody.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * noteDuration);

      gain.gain.setValueAtTime(0.08, now + index * noteDuration);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * noteDuration + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * noteDuration);
      osc.stop(now + index * noteDuration + 0.16);
    });
  }

  // Grand celebratory win fanfare (rich chords + sweep)
  playWin() {
    if (this.isEffectsMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Play an energetic rising melody
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4-E4-G4-C5-E5-G5-C6
    const step = 0.065;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * step);

      gain.gain.setValueAtTime(0.07, now + idx * step);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * step + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * step);
      osc.stop(now + idx * step + 0.28);
    });

    // Final glorious stable target major triad chord at the end of the melody
    const finalChord = [523.25, 659.25, 783.99, 1046.50]; // C5 - E5 - G5 - C6
    const chordStart = now + notes.length * step;

    finalChord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, chordStart);
      
      gain.gain.setValueAtTime(0.05, chordStart);
      gain.gain.linearRampToValueAtTime(0.05, chordStart + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, chordStart + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(chordStart);
      osc.stop(chordStart + 0.65);
    });
  }

  // Comic warning drop tone or mascot confused error sound
  playWarning() {
    if (this.isEffectsMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.25);

    // Apply a cartoon lowpass filter to make it "kawaii" and warm instead of harsh
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.linearRampToValueAtTime(150, now + 0.25);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.27);
  }

  // Bomb exploded sound effect: rumbly safe cartoon crash noise
  playExplode() {
    if (this.isEffectsMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Low rumble frequency drop
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);

    // Filter to sweep low for a rumbling "Boom!"
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.exponentialRampToValueAtTime(50, now + 0.4);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);

    // Add a secondary cute retro white-noise puff
    try {
      const bufferSize = ctx.sampleRate * 0.3; // 0.3 seconds
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(300, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(80, now + 0.3);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.12, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noiseNode.start(now);
      noiseNode.stop(now + 0.3);
    } catch (e) {
      // Fallback if buffer creation fails
    }
  }
}

export const soundSynth = new SoundSynthesizer();
