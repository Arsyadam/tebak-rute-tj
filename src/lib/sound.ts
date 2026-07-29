/** Lightweight Web Audio SFX — no asset files needed */

let ctx: AudioContext | null = null

function ac() {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.08,
  when = 0,
) {
  const c = ac()
  const t0 = c.currentTime + when
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(g)
  g.connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

function noiseBurst(duration = 0.08, gain = 0.04, when = 0) {
  const c = ac()
  const t0 = c.currentTime + when
  const len = Math.floor(c.sampleRate * duration)
  const buffer = c.createBuffer(1, len, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = c.createBufferSource()
  src.buffer = buffer
  const g = c.createGain()
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 1800
  g.gain.setValueAtTime(gain, t0)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  src.connect(filter)
  filter.connect(g)
  g.connect(c.destination)
  src.start(t0)
  src.stop(t0 + duration + 0.02)
}

export const sound = {
  unlock() {
    ac()
  },
  click() {
    tone(480, 0.05, 'triangle', 0.035)
  },
  /** Satisfying “found a stop” sting — not a flat green beep */
  correct() {
    noiseBurst(0.06, 0.035, 0)
    tone(660, 0.07, 'triangle', 0.06, 0.01)
    tone(880, 0.1, 'sine', 0.07, 0.07)
    tone(1175, 0.18, 'sine', 0.08, 0.14)
    tone(1568, 0.12, 'triangle', 0.04, 0.22)
  },
  wrong() {
    tone(210, 0.16, 'sawtooth', 0.035)
    tone(160, 0.2, 'triangle', 0.03, 0.09)
  },
  guess() {
    tone(420, 0.05, 'square', 0.02)
  },
  win() {
    noiseBurst(0.1, 0.03)
    ;[523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'sine', 0.065, 0.05 + i * 0.09))
  },
  tick() {
    tone(760, 0.03, 'triangle', 0.02)
  },
  /** Urgent countdown tick when under 10s remaining */
  urgentTick() {
    tone(880, 0.04, 'square', 0.04)
    tone(660, 0.05, 'triangle', 0.025, 0.04)
  },
  /** Time ran out */
  timeout() {
    tone(180, 0.22, 'sawtooth', 0.05)
    tone(120, 0.28, 'triangle', 0.04, 0.12)
    noiseBurst(0.12, 0.03, 0.05)
  },
  join() {
    tone(392, 0.08, 'triangle', 0.04)
    tone(523, 0.12, 'triangle', 0.045, 0.08)
  },
}
