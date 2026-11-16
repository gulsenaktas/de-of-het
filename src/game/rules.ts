import type { Article, Word } from '../data/words'

interface SuffixRule {
  suffix: string
  article: Article
  text: string
}

const SUFFIX_RULES: SuffixRule[] = [
  { suffix: 'je', article: 'het', text: 'Diminutives ending in -je are always het.' },
  { suffix: 'heid', article: 'de', text: 'Words ending in -heid are always de.' },
  { suffix: 'teit', article: 'de', text: 'Words ending in -teit are always de.' },
  { suffix: 'tie', article: 'de', text: 'Words ending in -tie are de.' },
  { suffix: 'ing', article: 'de', text: 'Words ending in -ing are usually de.' },
  { suffix: 'isme', article: 'het', text: 'Words ending in -isme are het.' },
  { suffix: 'ment', article: 'het', text: 'Words ending in -ment are usually het.' },
  { suffix: 'um', article: 'het', text: 'Words ending in -um are usually het.' },
]

const MIN_LENGTH_FOR_SUFFIX_RULE = 5

export function ruleFor(word: Word): string | undefined {
  if (word.nl.length < MIN_LENGTH_FOR_SUFFIX_RULE) return undefined
  return SUFFIX_RULES.find((rule) => rule.article === word.article && word.nl.endsWith(rule.suffix))?.text
}
