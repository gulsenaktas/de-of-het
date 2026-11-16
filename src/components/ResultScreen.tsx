import { motion } from 'motion/react'
import type { Answer } from '../game/round'
import { WordPicture } from './WordPicture'

function headline(score: number, total: number): { nl: string; en: string } {
  const ratio = score / total
  if (ratio === 1) return { nl: 'Helemaal goed!', en: 'A perfect round.' }
  if (ratio >= 0.8) return { nl: 'Lekker bezig!', en: 'You are on a roll.' }
  if (ratio >= 0.5) return { nl: 'Niet slecht!', en: 'Not bad at all.' }
  return { nl: 'Oefening baart kunst', en: 'Practice makes perfect.' }
}

interface ResultScreenProps {
  answers: Answer[]
  bestStreak: number
  onPlayAgain: () => void
}

export function ResultScreen({ answers, bestStreak, onPlayAgain }: ResultScreenProps) {
  const score = answers.filter((a) => a.correct).length
  const mistakes = answers.filter((a) => !a.correct)
  const title = headline(score, answers.length)

  return (
    <motion.section
      className="result"
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <h2 className="result__title">{title.nl}</h2>
      <p className="result__subtitle">{title.en}</p>

      <p className="result__score">
        {score}
        <span>/{answers.length}</span>
      </p>

      <div className="result__tulips" aria-hidden>
        {answers.map((answer, i) => (
          <motion.span
            key={i}
            className={answer.correct ? 'tulip' : 'tulip tulip--missed'}
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 14, delay: 0.25 + i * 0.06 }}
          >
            🌷
          </motion.span>
        ))}
      </div>

      {mistakes.length > 0 && (
        <div className="result__mistakes">
          <h3>Worth another look</h3>
          <ul>
            {mistakes.map(({ word }) => (
              <li key={word.nl}>
                <WordPicture word={word} className="result__picture" />
                <strong>
                  <em className={`article article--${word.article}`}>{word.article}</em> {word.nl}
                </strong>
                <span className="result__meaning">{word.en}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="result__best">🔥 Best streak: {bestStreak}</p>

      <motion.button
        className="btn btn--play"
        onClick={onPlayAgain}
        whileHover={{ y: -2 }}
        whileTap={{ y: 5, boxShadow: '0 1px 0 #1A1A40' }}
      >
        Nog een keer!
      </motion.button>
    </motion.section>
  )
}
