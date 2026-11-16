import { WORDS, type Article, type Level, type Word } from '../data/words'

export interface Answer {
  word: Word
  picked: Article
  correct: boolean
}

export const ROUND_SIZE = 10
const ROUND_LEVEL: Level = 1
const MIN_HET_SHARE = 0.4
const HET_SPREAD = 3

export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// The het count varies per round (4 to 6 of 10) so the split can't be guessed by counting.
export function buildRound(size = ROUND_SIZE): Word[] {
  const pool = WORDS.filter((word) => word.level === ROUND_LEVEL)
  const hetCount = Math.floor(size * MIN_HET_SHARE) + Math.floor(Math.random() * HET_SPREAD)
  const het = shuffle(pool.filter((word) => word.article === 'het')).slice(0, hetCount)
  const de = shuffle(pool.filter((word) => word.article === 'de')).slice(0, size - hetCount)
  return shuffle([...het, ...de])
}

const BEST_STREAK_KEY = 'de-of-het:best-streak'

export function readBestStreak(): number {
  try {
    return Number(localStorage.getItem(BEST_STREAK_KEY)) || 0
  } catch {
    return 0
  }
}

export function saveBestStreak(value: number): void {
  try {
    localStorage.setItem(BEST_STREAK_KEY, String(value))
  } catch {
    // localStorage throws in private mode; the game works without it.
  }
}
