/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmIntervalId: any = null;
  private currentBgmBeat: number = 0;
  private bgmOscillators: { osc: OscillatorNode; gain: GainNode }[] = [];
  private isBgmPlaying: boolean = false;

  constructor() {
    // Read cached setting if exists
    try {
      const stored = localStorage.getItem('kids_applet_synth_muted');
      if (stored) {
        this.isMuted = stored === 'true';
      }
    } catch {
      this.isMuted = false;
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
    return this.isMuted;
  }

  setMuteState(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('kids_applet_synth_muted', String(muted));
    } catch {}
    if (muted) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
  }

  toggleMute(): boolean {
    this.setMuteState(!this.isMuted);
    return this.isMuted;
  }

  // --- Background Music (BGM) Realtime Synthesizer ---
  startBgm() {
    if (this.isMuted) return;
    if (this.isBgmPlaying) return;

    const ctx = this.initContext();
    if (!ctx) return;

    this.isBgmPlaying = true;
    this.currentBgmBeat = 0;

    const scheduleNextSection = () => {
      if (!this.isBgmPlaying || this.isMuted) return;

      const now = ctx.currentTime;
      // Cozy, warm, sleepy pentatonic chord progression (Cmaj7 -> Am9 -> Fmaj7 -> G6)
      const chords = [
        [130.81, 196.00, 246.94, 329.63], // Cmaj7
        [110.00, 164.81, 261.63, 392.00], // Am9
        [87.31, 130.81, 220.00, 329.63],  // Fmaj7
        [98.00, 146.83, 246.94, 293.66]   // G6
      ];

      const currentChord = chords[this.currentBgmBeat % chords.length];

      // Stagger notes to sound like a gentle arpeggio harp
      currentChord.forEach((freq, idx) => {
        const delay = idx * 0.2;
        this.playPadNote(freq, now + delay, 4.2);
      });

      // Play soft high bell notes on odd beats
      if (this.currentBgmBeat % 2 === 1) {
        // Random pentatonic frequencies
        const pentatonicMelody = [523.25, 587.33, 659.25, 783.99, 880.00]; // C5, D5, E5, G5, A5
        const freq = pentatonicMelody[Math.floor(Math.random() * pentatonicMelody.length)];
        this.playBellNote(freq, now + 1.5);
      }

      this.currentBgmBeat++;

      // Recurse every 4.8 seconds for seamless overlapping transition
      this.bgmIntervalId = setTimeout(scheduleNextSection, 4800);
    };

    scheduleNextSection();
  }

  private playPadNote(freq: number, startTime: number, duration: number) {
    const ctx = this.ctx;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    // Filter to sweep low for warm lofi sound
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, startTime);

    // Warm soft fade-in
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.012, startTime + 1.2); 

    // Smooth fade-out 
    gain.gain.setValueAtTime(0.012, startTime + duration - 1.2);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);

    const activeNode = { osc, gain };
    this.bgmOscillators.push(activeNode);

    setTimeout(() => {
      this.bgmOscillators = this.bgmOscillators.filter(item => item !== activeNode);
    }, (duration + 1.2) * 1000);
  }

  private playBellNote(freq: number, startTime: number) {
    const ctx = this.ctx;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.006, startTime + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 2.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 2.3);
  }

  stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmIntervalId) {
      clearTimeout(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }

    this.bgmOscillators.forEach(({ osc }) => {
      try {
        osc.stop();
      } catch (e) {}
    });
    this.bgmOscillators = [];
  }

  // Cute pop bubble click sound
  playClick() {
    if (this.isMuted) return;
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
    if (this.isMuted) return;
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
    if (this.isMuted) return;
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
    if (this.isMuted) return;
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
    if (this.isMuted) return;
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
    if (this.isMuted) return;
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
    if (this.isMuted) return;
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
