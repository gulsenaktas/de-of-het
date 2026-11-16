import { motion, useMotionValue, useTransform, type PanInfo, type Variants } from 'motion/react'
import type { Article, Word } from '../data/words'
import { WordPicture } from './WordPicture'

const SWIPE_THRESHOLD = 110

const variants: Variants = {
  enter: { scale: 0.92, y: 18 },
  center: {
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 420, damping: 24 },
  },
  exit: (direction: number) => ({
    x: direction * 460,
    rotate: direction * 26,
    opacity: 0,
    transition: { duration: 0.3, ease: 'easeIn' },
  }),
}

interface WordCardProps {
  word: Word
  exitDirection: number
  showHint: boolean
  onAnswer: (article: Article) => void
}

export function WordCard({ word, exitDirection, showHint, onAnswer }: WordCardProps) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 220], [-14, 14])
  const backgroundColor = useTransform(x, [-150, 0, 150], ['#FFE0BF', '#FFFFFF', '#D6DEFF'])
  const deOpacity = useTransform(x, [-100, -20], [1, 0])
  const hetOpacity = useTransform(x, [20, 100], [0, 1])

  function handleDragEnd(_: unknown, info: PanInfo) {
    const swipe = info.offset.x + info.velocity.x * 0.2
    if (swipe < -SWIPE_THRESHOLD) onAnswer('de')
    else if (swipe > SWIPE_THRESHOLD) onAnswer('het')
  }

  return (
    <motion.div
      className="card"
      style={{ x, rotate, backgroundColor }}
      variants={variants}
      custom={exitDirection}
      initial="enter"
      animate="center"
      exit="exit"
      drag="x"
      dragSnapToOrigin
      dragElastic={0.9}
      whileDrag={{ scale: 1.04, cursor: 'grabbing' }}
      onDragEnd={handleDragEnd}
    >
      <motion.span className="stamp stamp--de" style={{ opacity: deOpacity }} aria-hidden>
        de
      </motion.span>
      <motion.span className="stamp stamp--het" style={{ opacity: hetOpacity }} aria-hidden>
        het
      </motion.span>

      <WordPicture word={word} className="card__picture" />
      <p className="card__word">
        <span className="card__blank" aria-label="de or het">
          ?
        </span>
        {word.nl}
      </p>
      <p className="card__meaning">{word.en}</p>

      {showHint && <p className="card__hint">swipe ← de &nbsp;·&nbsp; het →</p>}
    </motion.div>
  )
}
