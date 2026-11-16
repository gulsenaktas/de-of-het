import { useCallback, useEffect, useState } from 'react'
import { playSound, unlockAudioOnFirstGesture, type SoundName } from './sound'

const SOUND_KEY = 'de-of-het:sound'

function readEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off'
  } catch {
    return true
  }
}

export function useSound() {
  const [enabled, setEnabled] = useState(readEnabled)

  useEffect(unlockAudioOnFirstGesture, [])

  useEffect(() => {
    try {
      localStorage.setItem(SOUND_KEY, enabled ? 'on' : 'off')
    } catch {
      // localStorage throws in private mode; the setting then lasts for this visit only.
    }
  }, [enabled])

  const play = useCallback(
    (name: SoundName) => {
      if (enabled) playSound(name)
    },
    [enabled],
  )

  const toggle = useCallback(() => {
    if (!enabled) playSound('correct')
    setEnabled(!enabled)
  }, [enabled])

  return { enabled, play, toggle }
}
