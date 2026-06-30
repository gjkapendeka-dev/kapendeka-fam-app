'use client';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (typeof window === 'undefined') return null;
    
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.ctx) {
      this.ctx.suspend();
    } else if (!muted && this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  // --- Sound Synthesizers ---

  public playBlip(freq: number = 400, type: OscillatorType = 'square') {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  public playCoin() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
    osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.1); // E6
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }

  public playCrash() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    
    // Trigger haptic feedback if available
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(200);
    }
  }

  public playAGTBuzzer() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 3.2;

    // ── LAYER 1: Main AGT Buzz (harsh square wave, descending) ───────────
    // The classic "BZZZZT" - square wave at ~180Hz dropping to ~60Hz
    const buzz = ctx.createOscillator();
    const buzzGain = ctx.createGain();
    const buzzDistort = ctx.createWaveShaper();

    // Waveshaper for distortion/harsh clipping
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 400) * x / (Math.PI + 400 * Math.abs(x));
    }
    buzzDistort.curve = curve;

    buzz.type = 'square';
    buzz.frequency.setValueAtTime(185, now);
    buzz.frequency.setValueAtTime(180, now + 0.05); // tiny stutter on hit
    buzz.frequency.linearRampToValueAtTime(130, now + 1.5);
    buzz.frequency.linearRampToValueAtTime(75, now + duration);

    buzzGain.gain.setValueAtTime(0, now);
    buzzGain.gain.linearRampToValueAtTime(0.55, now + 0.02); // sharp attack
    buzzGain.gain.setValueAtTime(0.55, now + 0.8);
    buzzGain.gain.linearRampToValueAtTime(0.4, now + 1.8);
    buzzGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    buzz.connect(buzzDistort);
    buzzDistort.connect(buzzGain);
    buzzGain.connect(ctx.destination);
    buzz.start(now);
    buzz.stop(now + duration);

    // ── LAYER 2: Second buzz stab (the classic "double-hit" feel) ────────
    const buzz2 = ctx.createOscillator();
    const buzz2Gain = ctx.createGain();
    buzz2.type = 'sawtooth';
    buzz2.frequency.setValueAtTime(200, now + 0.12);
    buzz2.frequency.linearRampToValueAtTime(160, now + 0.6);
    buzz2.frequency.linearRampToValueAtTime(90, now + duration);
    buzz2Gain.gain.setValueAtTime(0, now + 0.12);
    buzz2Gain.gain.linearRampToValueAtTime(0.3, now + 0.15);
    buzz2Gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    buzz2.connect(buzz2Gain);
    buzz2Gain.connect(ctx.destination);
    buzz2.start(now + 0.12);
    buzz2.stop(now + duration);

    // ── LAYER 3: Sub Bass Thud on impact ─────────────────────────────────
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(90, now);
    sub.frequency.exponentialRampToValueAtTime(30, now + 0.8);
    subGain.gain.setValueAtTime(0.8, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 0.8);

    // ── LAYER 4: Noise crunch for extra aggression ────────────────────────
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(800, now);
    noiseFilter.Q.value = 0.5;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    // ── LAYER 5: Descending tonal whomp (the dramatic tail) ──────────────
    const whomp = ctx.createOscillator();
    const whompGain = ctx.createGain();
    whomp.type = 'sawtooth';
    whomp.frequency.setValueAtTime(160, now + 0.5);
    whomp.frequency.exponentialRampToValueAtTime(50, now + duration);
    whompGain.gain.setValueAtTime(0, now + 0.5);
    whompGain.gain.linearRampToValueAtTime(0.2, now + 0.7);
    whompGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    whomp.connect(whompGain);
    whompGain.connect(ctx.destination);
    whomp.start(now + 0.5);
    whomp.stop(now + duration);

    // ── HAPTIC ────────────────────────────────────────────────────────────
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([500, 50, 300, 50, 200]);
    }
  }

  
  public playBoom() {
    const ctx = this.getContext();
    if (!ctx) return;

    // 1. Deep sub bass drop (808 style)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    
    osc.type = 'sine';
    // Rapid pitch drop from 150Hz to 10Hz
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    // Volume envelope
    oscGain.gain.setValueAtTime(1, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);
    
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    
    // 2. Add some distortion/noise for the "crunch" of the boom
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // white noise
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(800, ctx.currentTime);
    noiseFilter.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.5);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    // Start both
    osc.start();
    osc.stop(ctx.currentTime + 1.0);
    noise.start();
    
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }

  public playExplosion() {
    const ctx = this.getContext();
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * 0.5; // 0.5 seconds of noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // white noise
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter to make it sound like an explosion (lowpass)
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  }

  
  public playSad() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    const now = ctx.currentTime;
    
    // Sad descending slide (trombone style "womp womp")
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.5);
    osc.frequency.setValueAtTime(200, now + 0.6);
    osc.frequency.exponentialRampToValueAtTime(100, now + 1.2);
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(now + 1.2);
    
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 200, 300]);
    }
  }

  public playDramatic3D(pan: number = 0, intensity: number = 1) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Low frequency hum
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(60, now);
    osc1.frequency.exponentialRampToValueAtTime(30, now + 1.0);
    
    // High frequency dissonance
    const osc2 = ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(300, now);
    osc2.frequency.exponentialRampToValueAtTime(150, now + 1.0);
    
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.3 * intensity, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
    
    let panner: StereoPannerNode | null = null;
    if (ctx.createStereoPanner) {
      panner = ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan));
    }

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    
    if (panner) {
      gainNode.connect(panner);
      panner.connect(ctx.destination);
    } else {
      gainNode.connect(ctx.destination);
    }

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.0);
    osc2.stop(now + 1.0);
    
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100 * intensity, 50, 100 * intensity]);
    }
  }

  public playGoldenBuzzer() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 5.0;

    // ── LAYER 1: Deep Sub Bass Rise ──────────────────────────────────────
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(40, now);
    sub.frequency.exponentialRampToValueAtTime(120, now + 0.5);
    sub.frequency.exponentialRampToValueAtTime(80, now + duration);
    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.8, now + 0.2);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + duration);

    // ── LAYER 2: Brass Swell (sawtooth, sweeping up) ─────────────────────
    const brass = ctx.createOscillator();
    const brassGain = ctx.createGain();
    const brassFilter = ctx.createBiquadFilter();
    brass.type = 'sawtooth';
    brass.frequency.setValueAtTime(110, now);
    brass.frequency.exponentialRampToValueAtTime(440, now + 1.5);
    brass.frequency.exponentialRampToValueAtTime(880, now + 3.0);
    brass.frequency.exponentialRampToValueAtTime(660, now + duration);
    brassFilter.type = 'lowpass';
    brassFilter.frequency.setValueAtTime(400, now);
    brassFilter.frequency.exponentialRampToValueAtTime(4000, now + 2.0);
    brassGain.gain.setValueAtTime(0, now);
    brassGain.gain.linearRampToValueAtTime(0.25, now + 0.5);
    brassGain.gain.linearRampToValueAtTime(0.35, now + 2.5);
    brassGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    brass.connect(brassFilter);
    brassFilter.connect(brassGain);
    brassGain.connect(ctx.destination);
    brass.start(now);
    brass.stop(now + duration);

    // ── LAYER 3: Bright Harmonic Twinkle ─────────────────────────────────
    const sparkle = ctx.createOscillator();
    const sparkleGain = ctx.createGain();
    sparkle.type = 'square';
    sparkle.frequency.setValueAtTime(880, now + 0.5);
    sparkle.frequency.setValueAtTime(1108, now + 1.0);
    sparkle.frequency.setValueAtTime(1318, now + 1.5);
    sparkle.frequency.setValueAtTime(1760, now + 2.0);
    sparkle.frequency.setValueAtTime(2093, now + 2.5);
    sparkle.frequency.setValueAtTime(2637, now + 3.0);
    sparkle.frequency.setValueAtTime(3520, now + 3.5);
    sparkleGain.gain.setValueAtTime(0, now);
    sparkleGain.gain.linearRampToValueAtTime(0.07, now + 0.8);
    sparkleGain.gain.linearRampToValueAtTime(0.12, now + 2.5);
    sparkleGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    sparkle.connect(sparkleGain);
    sparkleGain.connect(ctx.destination);
    sparkle.start(now + 0.5);
    sparkle.stop(now + duration);

    // ── LAYER 4: Triumphant Chord Stabs ─────────────────────────────────
    const chordNotes = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C major
    chordNotes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + 1.0);
      osc.frequency.setValueAtTime(freq * 2, now + 2.0);
      osc.frequency.setValueAtTime(freq * 3, now + 3.0);
      g.gain.setValueAtTime(0, now + 1.0);
      g.gain.linearRampToValueAtTime(0.15, now + 1.2 + i * 0.05);
      g.gain.exponentialRampToValueAtTime(0.01, now + duration);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + 1.0);
      osc.stop(now + duration);
    });

    // ── LAYER 5: Noise Cymbal Crash ──────────────────────────────────────
    const bufferSize = ctx.sampleRate * 0.6;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const crash = ctx.createBufferSource();
    crash.buffer = buffer;
    const crashFilter = ctx.createBiquadFilter();
    crashFilter.type = 'highpass';
    crashFilter.frequency.setValueAtTime(6000, now);
    const crashGain = ctx.createGain();
    crashGain.gain.setValueAtTime(0.4, now);
    crashGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    crash.connect(crashFilter);
    crashFilter.connect(crashGain);
    crashGain.connect(ctx.destination);
    crash.start(now);

    // Second crash at the peak
    const crash2 = ctx.createBufferSource();
    crash2.buffer = buffer;
    const crash2Filter = ctx.createBiquadFilter();
    crash2Filter.type = 'highpass';
    crash2Filter.frequency.setValueAtTime(8000, now + 2.0);
    const crash2Gain = ctx.createGain();
    crash2Gain.gain.setValueAtTime(0.6, now + 2.0);
    crash2Gain.gain.exponentialRampToValueAtTime(0.01, now + 2.6);
    crash2.connect(crash2Filter);
    crash2Filter.connect(crash2Gain);
    crash2Gain.connect(ctx.destination);
    crash2.start(now + 2.0);

    // ── LAYER 6: 3D Stereo Pan Sweep ────────────────────────────────────
    if (ctx.createStereoPanner) {
      const sweepOsc = ctx.createOscillator();
      const sweepGain = ctx.createGain();
      const panner = ctx.createStereoPanner();
      sweepOsc.type = 'sine';
      sweepOsc.frequency.setValueAtTime(220, now + 1.5);
      sweepOsc.frequency.exponentialRampToValueAtTime(880, now + 3.5);
      // Sweep pan from left to right
      panner.pan.setValueAtTime(-1, now + 1.5);
      panner.pan.linearRampToValueAtTime(1, now + 4.0);
      panner.pan.linearRampToValueAtTime(0, now + duration);
      sweepGain.gain.setValueAtTime(0, now + 1.5);
      sweepGain.gain.linearRampToValueAtTime(0.18, now + 2.0);
      sweepGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
      sweepOsc.connect(sweepGain);
      sweepGain.connect(panner);
      panner.connect(ctx.destination);
      sweepOsc.start(now + 1.5);
      sweepOsc.stop(now + duration);
    }

    // ── HAPTIC ────────────────────────────────────────────────────────────
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([300, 100, 300, 100, 300, 100, 800]);
    }
  }

  public playWin() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    
    // Arpeggio
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(440, now); // A4
    osc.frequency.setValueAtTime(554.37, now + 0.1); // C#5
    osc.frequency.setValueAtTime(659.25, now + 0.2); // E5
    osc.frequency.setValueAtTime(880, now + 0.3); // A5
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(now + 0.6);
    
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([50, 50, 50, 50, 100]);
    }
  }
}

export const audio = new AudioEngine();
