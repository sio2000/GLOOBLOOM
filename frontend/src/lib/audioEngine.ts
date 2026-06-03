import { OrganismMood, Season } from "@/types/organism";

interface AudioNodes {
  ctx: AudioContext;
  masterGain: GainNode;
  breathGain: GainNode;
  padOsc1: OscillatorNode;
  padOsc2: OscillatorNode;
  padOsc3: OscillatorNode;
  padGain: GainNode;
  filterLow: BiquadFilterNode;
  filterHigh: BiquadFilterNode;
  reverbConvolver: ConvolverNode;
  reverbGain: GainNode;
  dryGain: GainNode;
}

const MASTER_VOLUME_DESKTOP = 0.08;
const MASTER_VOLUME_MOBILE = 0.22;

function isMobileAudio(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 640px), (pointer: coarse)").matches;
}

function masterVolume(): number {
  return isMobileAudio() ? MASTER_VOLUME_MOBILE : MASTER_VOLUME_DESKTOP;
}

type Listener = () => void;

function createReverb(ctx: AudioContext, duration = 6, decay = 4): AudioBuffer {
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

function getMoodFreqs(mood: OrganismMood): [number, number, number] {
  const map: Record<OrganismMood, [number, number, number]> = {
    transcendent: [528, 639, 741],
    thriving:     [432, 528, 648],
    content:      [396, 528, 594],
    thirsty:      [341, 440, 528],
    dormant:      [288, 396, 432],
    decaying:     [256, 341, 432],
    critical:     [228, 304, 396],
  };
  return map[mood] ?? [432, 528, 648];
}

function getSeasonDetune(season: Season): number {
  return { bloom: 0, mist: -8, golden_decay: -16, neon_rain: 10 }[season] ?? 0;
}

class AudioEngine {
  private nodes: AudioNodes | null = null;
  private started = false;
  private muted = false;
  private listeners = new Set<Listener>();

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
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
    masterGain.gain.linearRampToValueAtTime(masterVolume(), ctx.currentTime + 4);
    masterGain.connect(ctx.destination);

    const breathGain = ctx.createGain();
    breathGain.gain.value = 1;
    breathGain.connect(masterGain);

    const filterHigh = ctx.createBiquadFilter();
    filterHigh.type = "highpass";
    filterHigh.frequency.value = 180;
    filterHigh.Q.value = 0.5;
    filterHigh.connect(breathGain);

    const filterLow = ctx.createBiquadFilter();
    filterLow.type = "lowpass";
    filterLow.frequency.value = 1400;
    filterLow.Q.value = 0.7;
    filterLow.connect(filterHigh);

    const reverbConvolver = ctx.createConvolver();
    reverbConvolver.buffer = createReverb(ctx, 6, 4);
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.6;
    reverbConvolver.connect(reverbGain);
    reverbGain.connect(breathGain);

    const dryGain = ctx.createGain();
    dryGain.gain.value = 0.4;
    dryGain.connect(filterLow);

    const [f1, f2, f3] = getMoodFreqs("content");

    function makePad(freq: number, gain: number): OscillatorNode {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = gain;
      osc.connect(g);
      g.connect(dryGain);
      g.connect(reverbConvolver);
      osc.start();
      return osc;
    }

    const padOsc1 = makePad(f1, 0.35);
    const padOsc2 = makePad(f2, 0.22);
    const padOsc3 = makePad(f3, 0.14);

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.05;
    const lfoScale = ctx.createGain();
    lfoScale.gain.value = 0.08;
    lfo.connect(lfoScale);
    lfoScale.connect(breathGain.gain);
    lfo.start();

    const filterLfo = ctx.createOscillator();
    filterLfo.type = "sine";
    filterLfo.frequency.value = 0.03;
    const filterScale = ctx.createGain();
    filterScale.gain.value = 150;
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
      filterLow,
      filterHigh,
      reverbConvolver,
      reverbGain,
      dryGain,
    };
    this.muted = false;
    this.notify();
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
    const detune = getSeasonDetune(season);
    const t = n.ctx.currentTime;

    n.padOsc1.frequency.linearRampToValueAtTime(f1, t + 6);
    n.padOsc2.frequency.linearRampToValueAtTime(f2, t + 6);
    n.padOsc3.frequency.linearRampToValueAtTime(f3, t + 6);

    n.padOsc1.detune.linearRampToValueAtTime(detune, t + 5);
    n.padOsc2.detune.linearRampToValueAtTime(detune + 2, t + 5);
    n.padOsc3.detune.linearRampToValueAtTime(detune - 1, t + 5);

    const cutoff = mood === "transcendent" ? 2000
      : mood === "thriving" ? 1400
      : mood === "decaying" ? 600
      : mood === "critical" ? 400
      : 900;
    n.filterLow.frequency.linearRampToValueAtTime(cutoff, t + 5);

    const rev = mood === "transcendent" ? 0.9 : mood === "decaying" ? 0.75 : 0.55;
    n.reverbGain.gain.linearRampToValueAtTime(rev, t + 5);
  }

  playWaterChime() {
    const n = this.nodes;
    if (!n || this.muted) return;

    const notes = [880, 1108, 1320, 1760];
    const t = n.ctx.currentTime;

    notes.forEach((freq, i) => {
      const osc = n.ctx.createOscillator();
      const env = n.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0, t + i * 0.06);
      env.gain.linearRampToValueAtTime(isMobileAudio() ? 0.18 : 0.09, t + i * 0.06 + 0.008);
      env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 1.0);
      osc.connect(env);
      env.connect(n.reverbConvolver);
      env.connect(n.masterGain);
      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 1.1);
    });
  }

  resume() {
    this.nodes?.ctx.resume();
  }

  destroy() {
    this.nodes?.ctx.close();
    this.nodes = null;
    this.started = false;
  }
}

export const audioEngine = new AudioEngine();
