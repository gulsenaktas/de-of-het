interface Note {
  frequency: number
  start: number
  duration: number
}

interface Sound {
  wave: OscillatorType
  volume: number
  notes: Note[]
}

const G4 = 392.0
const C5 = 523.25
const E5 = 659.25
const G5 = 783.99
const C6 = 1046.5
const G3 = 196.0

const SOUNDS = {
  correct: {
    wave: 'sine',
    volume: 0.13,
    notes: [
      { frequency: C5, start: 0, duration: 0.2 },
      { frequency: E5, start: 0.1, duration: 0.34 },
    ],
  },
  wrong: {
    wave: 'sine',
    volume: 0.25,
    notes: [{ frequency: G3, start: 0, duration: 0.32 }],
  },
  streak: {
    wave: 'triangle',
    volume: 0.2,
    notes: [
      { frequency: E5, start: 0, duration: 0.12 },
      { frequency: G5, start: 0.08, duration: 0.12 },
      { frequency: C6, start: 0.16, duration: 0.3 },
    ],
  },
  roundEnd: {
    wave: 'triangle',
    volume: 0.2,
    notes: [
      { frequency: G4, start: 0, duration: 0.18 },
      { frequency: C5, start: 0.14, duration: 0.35 },
    ],
  },
  roundEndGreat: {
    wave: 'triangle',
    volume: 0.2,
    notes: [
      { frequency: C5, start: 0, duration: 0.14 },
      { frequency: E5, start: 0.11, duration: 0.14 },
      { frequency: G5, start: 0.22, duration: 0.14 },
      { frequency: C6, start: 0.33, duration: 0.45 },
    ],
  },
} satisfies Record<string, Sound>

export type SoundName = keyof typeof SOUNDS

const ATTACK_SECONDS = 0.01
const SILENCE = 0.001

let context: AudioContext | undefined

function audioContext(): AudioContext | undefined {
  if (typeof AudioContext === 'undefined') return undefined
  context ??= new AudioContext()
  if (context.state !== 'running') void context.resume()
  return context
}

const UNLOCK_EVENTS = ['pointerup', 'touchend', 'keydown'] as const

// Browsers only let audio start from a tap, click or key press. The end of a swipe does not
// count on iOS, so a player who only swipes would never hear anything. Waking the context on
// any earlier tap (the Start button, for one) makes the first swipe audible.
export function unlockAudioOnFirstGesture(): () => void {
  const unlock = () => void audioContext()
  for (const event of UNLOCK_EVENTS) window.addEventListener(event, unlock, { passive: true })
  return () => {
    for (const event of UNLOCK_EVENTS) window.removeEventListener(event, unlock)
  }
}

export function playSound(name: SoundName): void {
  const ctx = audioContext()
  if (!ctx) return
  const { wave, volume, notes }: Sound = SOUNDS[name]

  for (const { frequency, start, duration } of notes) {
    const startAt = ctx.currentTime + start
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.type = wave
    oscillator.frequency.value = frequency
    // A fast fade in and an exponential fade out avoid the click of an abrupt start or stop.
    gain.gain.setValueAtTime(SILENCE, startAt)
    gain.gain.linearRampToValueAtTime(volume, startAt + ATTACK_SECONDS)
    gain.gain.exponentialRampToValueAtTime(SILENCE, startAt + duration)

    oscillator.connect(gain).connect(ctx.destination)
    oscillator.start(startAt)
    oscillator.stop(startAt + duration)
  }
}
