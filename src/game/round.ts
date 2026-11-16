import { WORDS, type Article, type Word } from '../data/words'
import { isDue, isSeen, seenBySoonestDue, type Progress } from './progress'

export interface Answer {
  word: Word
  picked: Article
  correct: boolean
}

export const ROUND_SIZE = 10
const MAX_REVIEWS = 6
const NEW_WORD_WINDOW = 30
const MIN_HET_PER_ROUND = 4
const HET_SPREAD = 3

const WORD_BY_NL = new Map(WORDS.map((word) => [word.nl, word]))

export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function knownWords(nls: string[]): Word[] {
  return nls.flatMap((nl) => WORD_BY_NL.get(nl) ?? [])
}

// New words come from the most frequent unseen ones. Picking from a small window instead of
// strictly in order keeps rounds varied, and leaves room to steer the round's de/het mix.
function pickNewWords(progress: Progress, count: number, hetWanted: number): Word[] {
  const unseen = WORDS.filter((word) => !isSeen(progress, word.nl))
  const window = shuffle(unseen.slice(0, Math.max(NEW_WORD_WINDOW, count)))
  const het = window.filter((word) => word.article === 'het').slice(0, hetWanted)
  const rest = window.filter((word) => !het.includes(word)).sort((a, b) => articleOrder(a) - articleOrder(b))
  return [...het, ...rest].slice(0, count)
}

const articleOrder = (word: Word) => (word.article === 'de' ? 0 : 1)

export function buildRound(progress: Progress, size = ROUND_SIZE): Word[] {
  const seen = seenBySoonestDue(progress)
  const reviews = knownWords(seen.filter((nl) => isDue(progress, nl))).slice(0, MAX_REVIEWS)

  // The het target varies per round so the split can't be guessed by counting.
  const hetTarget = MIN_HET_PER_ROUND + Math.floor(Math.random() * HET_SPREAD)
  const hetInReviews = reviews.filter((word) => word.article === 'het').length
  const fresh = pickNewWords(progress, size - reviews.length, Math.max(0, hetTarget - hetInReviews))

  const round = [...reviews, ...fresh]
  // Once every word has been seen, top up with the ones that would come back soonest.
  const notYetDue = knownWords(seen).filter((word) => !round.includes(word))
  return shuffle([...round, ...notYetDue].slice(0, size))
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
