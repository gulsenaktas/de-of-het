import { useState } from 'react'
import { motion, type Variants } from 'motion/react'
import { summarize, type Progress } from '../game/progress'
import { SoundToggle } from './SoundToggle'

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.92 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 420, damping: 20 } },
}

interface StartScreenProps {
  progress: Progress
  bestStreak: number
  soundEnabled: boolean
  onToggleSound: () => void
  onStart: () => void
  onReset: () => void
}

export function StartScreen({
  progress,
  bestStreak,
  soundEnabled,
  onToggleSound,
  onStart,
  onReset,
}: StartScreenProps) {
  const [confirmingReset, setConfirmingReset] = useState(false)
  const { learned, practising } = summarize(progress)
  const isReturning = learned + practising > 0

  function confirmReset() {
    onReset()
    setConfirmingReset(false)
  }

  return (
    <motion.section className="start" variants={container} initial="hidden" animate="visible">
      <div className="start__top">
        <SoundToggle enabled={soundEnabled} onToggle={onToggleSound} />
      </div>

      <motion.h1 className="logo start__logo" variants={item}>
        <span className="logo__de">de</span> of <span className="logo__het">het</span>?
      </motion.h1>
      <motion.p className="start__tagline" variants={item}>
        Learn Dutch articles, one swipe at a time.
      </motion.p>

      <motion.div className="start__demo" variants={item} aria-hidden>
        <motion.div
          className="start__demo-card"
          animate={{ x: [0, -26, 0, 26, 0], rotate: [0, -9, 0, 9, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span>🚲</span>
          fiets
        </motion.div>
      </motion.div>

      <motion.ul className="start__how" variants={item}>
        <li>
          <span className="chip chip--de">← de</span> Swipe left
        </li>
        <li>
          <span className="chip chip--het">het →</span> Swipe right
        </li>
        <li>
          <span className="chip">🔁</span> Missed words come back
        </li>
      </motion.ul>

      {isReturning && (
        <motion.p className="stats" variants={item}>
          <span>🌱 {practising} practising</span>
          <span>🎓 {learned} learned</span>
          <span>🔥 Best streak: {bestStreak}</span>
        </motion.p>
      )}

      <motion.div className="start__actions" variants={item}>
        <motion.button
          className="btn btn--play"
          onClick={onStart}
          whileHover={{ y: -2 }}
          whileTap={{ y: 5, boxShadow: '0 1px 0 #1A1A40' }}
        >
          {isReturning ? 'Continue' : 'Start'}
        </motion.button>

        {isReturning &&
          (confirmingReset ? (
            <p className="start__confirm" role="alert">
              Erase all progress?
              <button className="link-btn link-btn--danger" onClick={confirmReset}>
                Yes, reset
              </button>
              <button className="link-btn" onClick={() => setConfirmingReset(false)}>
                Cancel
              </button>
            </p>
          ) : (
            <button className="link-btn" onClick={() => setConfirmingReset(true)}>
              Reset progress
            </button>
          ))}
      </motion.div>
    </motion.section>
  )
}
