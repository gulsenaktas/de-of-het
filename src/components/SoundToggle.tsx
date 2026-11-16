import { motion } from 'motion/react'

interface SoundToggleProps {
  enabled: boolean
  onToggle: () => void
}

export function SoundToggle({ enabled, onToggle }: SoundToggleProps) {
  return (
    <motion.button
      className="icon-btn"
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label={enabled ? 'Turn sound off' : 'Turn sound on'}
      whileHover={{ y: -2 }}
      whileTap={{ y: 3, boxShadow: '0 1px 0 #1A1A40' }}
    >
      <span aria-hidden>{enabled ? '🔊' : '🔇'}</span>
    </motion.button>
  )
}
