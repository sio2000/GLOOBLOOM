import { OrganismMood, Season } from "@/types/organism";

interface AudioNodes {
  ctx: AudioContext;
  masterGain: GainNode;
  breathGain: GainNode;
  padOsc1: OscillatorNode;
  padOsc2: OscillatorNode;
  padOsc3: OscillatorNode;
  padGain: GainNode;
  noiseSource: AudioBufferSourceNode | null;
  noiseGain: GainNode;
  filterLow: BiquadFilterNode;
  filterHigh: BiquadFilterNode;
  reverbConvolver: ConvolverNode;
  reverbGain: GainNode;
  dryGain: GainNode;
}

const MASTER_VOLUME_DESKTOP = 0.1;
const MASTER_VOLUME_MOBILE = 0.24;

function isMobileAudio(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 640px), (pointer: coarse)").matches;
}

function masterVolume(): number {
  return isMobileAudio() ? MASTER_VOLUME_MOBILE : MASTER_VOLUME_DESKTOP;
}

type Listener = () => void;

function createReverb(ctx: AudioContext, duration = 4.5, decay = 3.2): AudioBuffer {
  const len = ctx.sampleRate * duration;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

/** Warm garden pentatonic — organic, not clinical “healing tone” pads. */
function getMoodFreqs(mood: OrganismMood): [number, number, number] {
  const map: Record<OrganismMood, [number, number, number]> = {
    transcendent: [392, 494, 587],
    thriving:     [330, 392, 494],
    content:      [294, 370, 440],
    thirsty:      [262, 330, 392],
    dormant:      [220, 277, 330],
    decaying:     [196, 247, 294],
    critical:     [175, 220, 262],
  };
  return map[mood] ?? [294, 370, 440];
}

function getSeasonDetune(season: Season): number {
  return { bloom: 0, mist: -6, golden_decay: -12, neon_rain: 8 }[season] ?? 0;
}

function createBrownNoiseBuffer(ctx: AudioContext, seconds = 3): AudioBuffer {
  const len = ctx.sampleRate * seconds;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + white * 0.04) / 1.04;
    data[i] = last * 2.8;
  }
  return buf;
}

class AudioEngine {
  private nodes: AudioNodes | null = null;
  private started = false;
  private muted = false;
  private listeners = new Set<Listener>();
  private moodFreqs: [number, number, number] = getMoodFreqs("content");
  private melodyTimer: ReturnType<typeof setInterval> | null = null;
  private melodyStep = 0;

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  get isStarted() {
    return this.started;
  }

  get isMuted() {
    return this.muted;
  }

  init() {
    if (this.started) {
      this.nodes?.ctx.resume();
      if (this.muted) this.setMuted(false);
      return;
    }
    this.started = true;

    const ctx = new AudioContext();

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(masterVolume(), ctx.currentTime + 3.5);
    masterGain.connect(ctx.destination);

    const breathGain = ctx.createGain();
    breathGain.gain.value = 1;
    breathGain.connect(masterGain);

    const filterHigh = ctx.createBiquadFilter();
    filterHigh.type = "highpass";
    filterHigh.frequency.value = 120;
    filterHigh.Q.value = 0.4;
    filterHigh.connect(breathGain);

    const filterLow = ctx.createBiquadFilter();
    filterLow.type = "lowpass";
    filterLow.frequency.value = 1100;
    filterLow.Q.value = 0.5;
    filterLow.connect(filterHigh);

    const reverbConvolver = ctx.createConvolver();
    reverbConvolver.buffer = createReverb(ctx, 4.5, 3.2);
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.45;
    reverbConvolver.connect(reverbGain);
    reverbGain.connect(breathGain);

    const dryGain = ctx.createGain();
    dryGain.gain.value = 0.5;
    dryGain.connect(filterLow);

    const [f1, f2, f3] = getMoodFreqs("content");

    function makePad(
      freq: number,
      gain: number,
      type: OscillatorType = "triangle"
    ): OscillatorNode {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = gain;
      osc.connect(g);
      g.connect(dryGain);
      g.connect(reverbConvolver);
      osc.start();
      return osc;
    }

    const padOsc1 = makePad(f1, 0.28, "triangle");
    const padOsc2 = makePad(f2, 0.2, "triangle");
    const padOsc3 = makePad(f3, 0.12, "sine");

    const noiseBuf = createBrownNoiseBuffer(ctx);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuf;
    noiseSource.loop = true;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.035;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 420;
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(dryGain);
    noiseGain.connect(reverbConvolver);
    noiseSource.start();

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.035;
    const lfoScale = ctx.createGain();
    lfoScale.gain.value = 0.06;
    lfo.connect(lfoScale);
    lfoScale.connect(breathGain.gain);
    lfo.start();

    const filterLfo = ctx.createOscillator();
    filterLfo.type = "sine";
    filterLfo.frequency.value = 0.018;
    const filterScale = ctx.createGain();
    filterScale.gain.value = 120;
    filterLfo.connect(filterScale);
    filterScale.connect(filterLow.frequency);
    filterLfo.start();

    this.nodes = {
      ctx,
      masterGain,
      breathGain,
      padOsc1,
      padOsc2,
      padOsc3,
      padGain: dryGain,
      noiseSource,
      noiseGain,
      filterLow,
      filterHigh,
      reverbConvolver,
      reverbGain,
      dryGain,
    };
    this.moodFreqs = getMoodFreqs("content");
    this.muted = false;
    this.startMelody();
    this.notify();
  }

  /**
   * Slow, sparse bell arpeggio in the current mood's pentatonic scale.
   * Gives the ambience a gentle, magical "bioluminescent garden" melody
   * instead of a flat drone — soft enough to stay in the background.
   */
  private startMelody() {
    if (this.melodyTimer) return;
    const tick = () => this.playMelodyPhrase();
    // First phrase a touch after the pad fades in, then on a relaxed loop.
    setTimeout(tick, 2200);
    this.melodyTimer = setInterval(tick, 3400);
  }

  private playMelodyPhrase() {
    const n = this.nodes;
    if (!n || this.muted) return;

    // Two-octave pentatonic pool drawn from the active mood chord.
    const [f1, f2, f3] = this.moodFreqs;
    const pool = [f1 * 2, f2 * 2, f3 * 2, f1 * 3, f2 * 3];
    const noteCount = 2 + (this.melodyStep % 2); // 2–3 notes per phrase
    const baseT = n.ctx.currentTime + 0.05;

    for (let i = 0; i < noteCount; i++) {
      const freq = pool[(this.melodyStep * 2 + i * 3) % pool.length]!;
      const t = baseT + i * 0.42;
      this.playBell(freq, t, 0.7 + Math.random() * 0.5);
    }
    this.melodyStep++;
  }

  private playBell(freq: number, startT: number, dur: number) {
    const n = this.nodes;
    if (!n) return;
    const ctx = n.ctx;
    const mobile = isMobileAudio();
    const peak = (mobile ? 0.05 : 0.035) * (0.7 + Math.random() * 0.5);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    // Faint detuned shimmer partner for a glassy, dreamy timbre.
    const shimmer = ctx.createOscillator();
    shimmer.type = "triangle";
    shimmer.frequency.value = freq * 2.01;

    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = 0.18;
    shimmer.connect(shimmerGain);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, startT);
    env.gain.linearRampToValueAtTime(peak, startT + 0.06);
    env.gain.exponentialRampToValueAtTime(0.0001, startT + dur + 1.4);

    osc.connect(env);
    shimmerGain.connect(env);
    env.connect(n.reverbConvolver);
    env.connect(n.masterGain);

    osc.start(startT);
    shimmer.start(startT);
    osc.stop(startT + dur + 1.6);
    shimmer.stop(startT + dur + 1.6);
  }

  private applyMasterVolume(volume: number, rampSec = 0.35) {
    const n = this.nodes;
    if (!n) return;
    const t = n.ctx.currentTime;
    n.masterGain.gain.cancelScheduledValues(t);
    n.masterGain.gain.setValueAtTime(n.masterGain.gain.value, t);
    n.masterGain.gain.linearRampToValueAtTime(volume, t + rampSec);
  }

  setMuted(muted: boolean) {
    const n = this.nodes;
    if (!n) return;
    this.muted = muted;
    this.applyMasterVolume(muted ? 0 : masterVolume());
    this.notify();
  }

  toggleMute() {
    if (!this.started) {
      this.init();
      return false;
    }
    this.setMuted(!this.muted);
    return this.muted;
  }

  updateMood(mood: OrganismMood, season: Season) {
    const n = this.nodes;
    if (!n) return;

    const [f1, f2, f3] = getMoodFreqs(mood);
    this.moodFreqs = [f1, f2, f3];
    const detune = getSeasonDetune(season);
    const t = n.ctx.currentTime;

    n.padOsc1.frequency.linearRampToValueAtTime(f1, t + 8);
    n.padOsc2.frequency.linearRampToValueAtTime(f2, t + 8);
    n.padOsc3.frequency.linearRampToValueAtTime(f3, t + 8);

    n.padOsc1.detune.linearRampToValueAtTime(detune, t + 6);
    n.padOsc2.detune.linearRampToValueAtTime(detune + 3, t + 6);
    n.padOsc3.detune.linearRampToValueAtTime(detune - 2, t + 6);

    const cutoff =
      mood === "transcendent"
        ? 1600
        : mood === "thriving"
          ? 1200
          : mood === "decaying"
            ? 700
            : mood === "critical"
              ? 520
              : 1000;
    n.filterLow.frequency.linearRampToValueAtTime(cutoff, t + 6);

    const rev =
      mood === "transcendent" ? 0.55 : mood === "decaying" ? 0.5 : 0.42;
    n.reverbGain.gain.linearRampToValueAtTime(rev, t + 6);

    const wind =
      mood === "critical" || mood === "decaying" ? 0.05 : 0.032;
    n.noiseGain.gain.linearRampToValueAtTime(wind, t + 6);
  }

  playWaterChime() {
    const n = this.nodes;
    if (!n || this.muted) return;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    const t = n.ctx.currentTime;

    notes.forEach((freq, i) => {
      const osc = n.ctx.createOscillator();
      const env = n.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0, t + i * 0.07);
      env.gain.linearRampToValueAtTime(
        isMobileAudio() ? 0.14 : 0.08,
        t + i * 0.07 + 0.01
      );
      env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 1.2);
      osc.connect(env);
      env.connect(n.reverbConvolver);
      env.connect(n.masterGain);
      osc.start(t + i * 0.07);
      osc.stop(t + i * 0.07 + 1.3);
    });
  }

  resume() {
    this.nodes?.ctx.resume();
  }

  destroy() {
    if (this.melodyTimer) {
      clearInterval(this.melodyTimer);
      this.melodyTimer = null;
    }
    this.nodes?.noiseSource?.stop();
    this.nodes?.ctx.close();
    this.nodes = null;
    this.started = false;
  }
}

export const audioEngine = new AudioEngine();
