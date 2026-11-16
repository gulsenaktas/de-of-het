import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion, useAnimate } from 'motion/react'
import type { Article, Word } from './data/words'
import { completeRound, readProgress, recordAnswer, saveProgress } from './game/progress'
import { buildRound, readBestStreak, saveBestStreak, type Answer } from './game/round'
import { ruleFor } from './game/rules'
import { useSound } from './game/useSound'
import { Confetti } from './components/Confetti'
import { ResultScreen } from './components/ResultScreen'
import { Skyline } from './components/Skyline'
import { SoundToggle } from './components/SoundToggle'
import { WordCard } from './components/WordCard'
import './App.css'

const PRAISE = ['Goed zo!', 'Lekker!', 'Top!', 'Precies!', 'Helemaal goed!']
const CORRECT_FEEDBACK_MS = 1400
const WRONG_FEEDBACK_MS = 2600
const RESULT_DELAY_MS = 900
const STREAK_MILESTONE = 5
const GREAT_SCORE_SHARE = 0.8

interface Feedback {
  id: number
  word: Word
  correct: boolean
  title: string
  rule?: string
}

export default function App() {
  const [progress, setProgress] = useState(readProgress)
  const [round, setRound] = useState(() => buildRound(progress))
  const [answers, setAnswers] = useState<Answer[]>([])
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(readBestStreak)
  const [exitDirection, setExitDirection] = useState(1)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [stackRef, animateStack] = useAnimate<HTMLDivElement>()
  const sound = useSound()
  const playSound = sound.play

  const index = answers.length
  const current = round[index]
  const finished = index >= round.length

  const answer = useCallback(
    (picked: Article) => {
      if (!current) return
      const correct = picked === current.article
      const nextStreak = correct ? streak + 1 : 0
      const isLastWord = index === round.length - 1

      setExitDirection(picked === 'de' ? -1 : 1)
      setAnswers((prev) => [...prev, { word: current, picked, correct }])
      setProgress((prev) => {
        const next = recordAnswer(prev, current.nl, correct)
        return isLastWord ? completeRound(next) : next
      })
      setStreak(nextStreak)
      if (nextStreak > bestStreak) {
        setBestStreak(nextStreak)
        saveBestStreak(nextStreak)
      }

      const isMilestone = correct && nextStreak % STREAK_MILESTONE === 0
      const title = !correct
        ? 'Oeps!'
        : isMilestone
          ? `${nextStreak} op rij! 🔥`
          : PRAISE[Math.floor(Math.random() * PRAISE.length)]
      playSound(!correct ? 'wrong' : isMilestone ? 'streak' : 'correct')
      setFeedback({ id: index, word: current, correct, title, rule: ruleFor(current) })

      if (!correct) {
        animateStack(stackRef.current, { x: [0, -12, 12, -7, 7, 0] }, { duration: 0.4 })
      }
    },
    [current, streak, bestStreak, index, round.length, animateStack, stackRef, playSound],
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') answer('de')
      if (event.key === 'ArrowRight') answer('het')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [answer])

  useEffect(() => saveProgress(progress), [progress])

  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), feedback.correct ? CORRECT_FEEDBACK_MS : WRONG_FEEDBACK_MS)
    return () => clearTimeout(timer)
  }, [feedback])

  useEffect(() => {
    if (!finished || showResult) return
    const score = answers.filter((item) => item.correct).length
    const timer = setTimeout(() => {
      setShowResult(true)
      playSound(score >= answers.length * GREAT_SCORE_SHARE ? 'roundEndGreat' : 'roundEnd')
    }, RESULT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [finished, showResult, answers, playSound])

  function playAgain() {
    setRound(buildRound(progress))
    setAnswers([])
    setStreak(0)
    setFeedback(null)
    setShowResult(false)
  }

  return (
    <div className="app">
      <div className="cloud cloud--one" aria-hidden />
      <div className="cloud cloud--two" aria-hidden />
      <Skyline />

      <main className="game">
        <header className="hud">
          <h1 className="logo">
            <span className="logo__de">de</span> of <span className="logo__het">het</span>?
          </h1>
          <div className="hud__actions">
            <SoundToggle enabled={sound.enabled} onToggle={sound.toggle} />
            <motion.div
              key={streak}
              className="streak"
              initial={{ scale: streak > 0 ? 1.35 : 1 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 12 }}
              aria-label={`Streak: ${streak}`}
            >
              🔥 {streak}
            </motion.div>
          </div>
        </header>

        {showResult ? (
          <ResultScreen answers={answers} bestStreak={bestStreak} progress={progress} onPlayAgain={playAgain} />
        ) : (
          <>
            <ol className="progress" aria-label={`Word ${Math.min(index + 1, round.length)} of ${round.length}`}>
              {round.map((word, i) => {
                const state = answers[i] ? (answers[i].correct ? 'right' : 'wrong') : i === index ? 'current' : 'todo'
                return <li key={word.nl} className={`progress__dot progress__dot--${state}`} />
              })}
            </ol>

            <div className="stack" ref={stackRef}>
              {index + 1 < round.length && <div className="card card--back" aria-hidden />}
              <AnimatePresence custom={exitDirection}>
                {current && (
                  <WordCard
                    key={current.nl}
                    word={current}
                    exitDirection={exitDirection}
                    showHint={index === 0}
                    onAnswer={answer}
                  />
                )}
              </AnimatePresence>
              {feedback?.correct && <Confetti key={feedback.id} />}
            </div>

            <div className="feedback-slot" aria-live="polite">
              <AnimatePresence mode="wait">
                {feedback && (
                  <motion.div
                    key={feedback.id}
                    className={`feedback feedback--${feedback.correct ? 'right' : 'wrong'}`}
                    initial={{ opacity: 0, y: 16, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, transition: { duration: 0.12 } }}
                    transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  >
                    <p className="feedback__main">
                      <strong>{feedback.title}</strong>{' '}
                      {feedback.correct ? '' : "It's "}
                      <em className={`article article--${feedback.word.article}`}>{feedback.word.article}</em>{' '}
                      {feedback.word.nl}
                    </p>
                    {!feedback.correct && feedback.rule && (
                      <p className="feedback__rule">💡 {feedback.rule}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="answers">
              <motion.button
                className="btn btn--de"
                onClick={() => answer('de')}
                disabled={finished}
                whileHover={{ y: -2 }}
                whileTap={{ y: 5, boxShadow: '0 1px 0 #1A1A40' }}
              >
                <span className="btn__arrow" aria-hidden>
                  ←
                </span>
                de
              </motion.button>
              <motion.button
                className="btn btn--het"
                onClick={() => answer('het')}
                disabled={finished}
                whileHover={{ y: -2 }}
                whileTap={{ y: 5, boxShadow: '0 1px 0 #1A1A40' }}
              >
                het
                <span className="btn__arrow" aria-hidden>
                  →
                </span>
              </motion.button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
