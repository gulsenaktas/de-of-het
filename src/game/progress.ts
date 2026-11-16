export interface WordProgress {
  box: number
  dueRound: number
}

export interface Progress {
  round: number
  words: Record<string, WordProgress>
}

export const LEARNED_BOX = 5
const FIRST_BOX = 1
const ROUNDS_UNTIL_DUE = [0, 1, 2, 4, 8, 16]

const PROGRESS_KEY = 'de-of-het:progress'
const STORAGE_VERSION = 1

export const EMPTY_PROGRESS: Progress = { round: 0, words: {} }

export function recordAnswer(progress: Progress, nl: string, correct: boolean): Progress {
  const previousBox = progress.words[nl]?.box ?? 0
  const box = correct ? Math.min(previousBox + 1, LEARNED_BOX) : FIRST_BOX
  return {
    ...progress,
    words: { ...progress.words, [nl]: { box, dueRound: progress.round + ROUNDS_UNTIL_DUE[box] } },
  }
}

export function completeRound(progress: Progress): Progress {
  return { ...progress, round: progress.round + 1 }
}

export function isSeen(progress: Progress, nl: string): boolean {
  return nl in progress.words
}

export function seenBySoonestDue(progress: Progress): string[] {
  return Object.entries(progress.words)
    .sort(([, a], [, b]) => a.dueRound - b.dueRound || a.box - b.box)
    .map(([nl]) => nl)
}

export function isDue(progress: Progress, nl: string): boolean {
  return progress.words[nl].dueRound <= progress.round
}

export function summarize(progress: Progress): { learned: number; practising: number } {
  const boxes = Object.values(progress.words).map((word) => word.box)
  const learned = boxes.filter((box) => box === LEARNED_BOX).length
  return { learned, practising: boxes.length - learned }
}

function isProgress(value: unknown): value is Progress {
  if (typeof value !== 'object' || value === null) return false
  const { round, words } = value as Partial<Progress>
  return typeof round === 'number' && typeof words === 'object' && words !== null
}

export function readProgress(): Progress {
  try {
    const stored = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? 'null')
    if (stored?.version !== STORAGE_VERSION || !isProgress(stored)) return EMPTY_PROGRESS
    return { round: stored.round, words: stored.words }
  } catch {
    return EMPTY_PROGRESS
  }
}

export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ version: STORAGE_VERSION, ...progress }))
  } catch {
    // localStorage throws in private mode; progress then lasts for this visit only.
  }
}
