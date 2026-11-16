import words from './words.json'

export type Article = 'de' | 'het'
export type Level = 1 | 2 | 3

export interface Word {
  nl: string
  article: Article
  en: string
  level: Level
  emoji?: string
}

export const WORDS = words as Word[]
