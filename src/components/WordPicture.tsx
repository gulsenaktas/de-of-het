import type { Word } from '../data/words'

const TONE_COUNT = 4

interface WordPictureProps {
  word: Word
  className?: string
}

export function WordPicture({ word, className = '' }: WordPictureProps) {
  if (word.emoji) {
    return (
      <span className={`picture ${className}`} aria-hidden>
        {word.emoji}
      </span>
    )
  }

  const tone = word.nl.charCodeAt(0) % TONE_COUNT
  return (
    <span className={`picture picture--initial picture--tone-${tone} ${className}`} aria-hidden>
      <span>{word.nl[0].toUpperCase()}</span>
    </span>
  )
}
