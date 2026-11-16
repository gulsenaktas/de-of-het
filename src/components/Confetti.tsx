import { useState } from 'react'
import { motion } from 'motion/react'

const PIECES = ['🌷', '🧡', '💙', '✨', '🌷', '🧀']
const COUNT = 14

export function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: COUNT }, (_, i) => {
      const angle = (i / COUNT) * Math.PI * 2 + Math.random() * 0.5
      const distance = 110 + Math.random() * 110
      return {
        id: i,
        emoji: PIECES[i % PIECES.length],
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 30,
        rotate: (Math.random() - 0.5) * 240,
        size: 18 + Math.random() * 16,
      }
    }),
  )

  return (
    <div className="confetti" aria-hidden>
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          style={{ fontSize: piece.size }}
          initial={{ x: 0, y: 0, scale: 0.2, opacity: 1, rotate: 0 }}
          animate={{
            x: piece.x,
            y: piece.y,
            scale: 1,
            rotate: piece.rotate,
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        >
          {piece.emoji}
        </motion.span>
      ))}
    </div>
  )
}
