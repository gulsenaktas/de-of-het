import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { createInterface } from 'node:readline'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import emojiByChar from 'unicode-emoji-json' with { type: 'json' }

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url))
const CACHE_DIR = path.join(SCRIPTS_DIR, '.cache')
const OUTPUT_FILE = path.join(SCRIPTS_DIR, '../src/data/words.json')
const REPORT_FILE = path.join(CACHE_DIR, 'report.txt')

const DICTIONARY = {
  url: 'https://kaikki.org/dictionary/Dutch/kaikki.org-dictionary-Dutch.jsonl',
  file: path.join(CACHE_DIR, 'dutch.jsonl'),
}
const FREQUENCY = {
  url: 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/nl/nl_50k.txt',
  file: path.join(CACHE_DIR, 'nl_50k.txt'),
}

const WORD_COUNT = 1500
const LEVEL_SIZE = 500
const MAX_MEANING_LENGTH = 22
const VERB_DOMINANCE_RATIO = 0.3

const CONFLICTING_CLASSES = new Set([
  'adj', 'pron', 'det', 'article', 'prep', 'conj', 'adv', 'intj', 'particle', 'num', 'contraction', 'postp',
])
const RUDE_TAGS = ['vulgar', 'derogatory', 'offensive', 'slur', 'ethnic']
const NOT_A_SENSE_TAGS = [
  'form-of', 'alt-of', 'obsolete', 'archaic', 'plural', 'plural-only', 'abbreviation', 'initialism',
  'misspelling', 'nonstandard',
]
const MARGINAL_SENSE_TAGS = [
  'dated', 'rare', 'uncommon', 'dialectal', 'regional', 'Belgium', 'Suriname', 'Indonesia', 'Brabant',
  'Flanders', 'Southern', 'slang', 'clipping', 'childish',
]
const UNSUITABLE_EMOJI_GROUPS = new Set(['Flags', 'Symbols'])

const readJson = (name) => JSON.parse(readFileSync(path.join(SCRIPTS_DIR, name), 'utf8'))
const hasAny = (tags, list) => list.some((tag) => tags.includes(tag))
const firstNonEmpty = (...collections) => collections.find((items) => items.size ?? items.length) ?? collections[0]

async function download({ url, file }) {
  if (existsSync(file)) return
  console.log(`Downloading ${url}`)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`)
  await pipeline(Readable.fromWeb(response.body), createWriteStream(file))
}

function readFrequencies() {
  const ranks = new Map()
  const counts = new Map()
  for (const line of readFileSync(FREQUENCY.file, 'utf8').split('\n')) {
    const [word, count] = line.split(' ')
    if (!word) continue
    ranks.set(word, ranks.size)
    counts.set(word, Number(count))
  }
  return { ranks, counts }
}

function cleanMeaning(gloss) {
  return gloss
    .replace(/\s*\([^)]*\)/g, '')
    .split(/[;,:]/)[0]
    .replace(/^(an?|the|some)\s+/i, '')
    .replace(/\.$/, '')
    .trim()
}

function articlesOf(genders) {
  const articles = []
  if (genders.includes('neuter') || genders.includes('n')) articles.push('het')
  if (hasAny(genders, ['masculine', 'feminine', 'common-gender', 'm', 'f', 'c'])) articles.push('de')
  return articles
}

// "misdaad f (plural misdaden)" -> ['f'], "deksel n or m (plural deksels)" -> ['n', 'm']
function headwordGenders(entry) {
  const expansion = entry.head_templates?.[0]?.expansion ?? ''
  return expansion.match(/^\S+ ((?:[mfnc]\b(?: or )?)+)/)?.[1].split(' or ') ?? []
}

function buildEmojiLookup() {
  const byName = new Map()
  for (const [emoji, { name, group }] of Object.entries(emojiByChar)) {
    if (!UNSUITABLE_EMOJI_GROUPS.has(group)) byName.set(name, emoji)
  }
  return byName
}

function readVerb(entry, verbs) {
  const verb = verbs.get(entry.word) ?? { isInfinitive: false, infinitives: new Set() }
  verbs.set(entry.word, verb)
  for (const sense of entry.senses ?? []) {
    if (!sense.form_of && entry.word.endsWith('n')) verb.isInfinitive = true
    for (const { word } of sense.form_of ?? []) verb.infinitives.add(word)
  }
}

function readNoun(entry, nouns) {
  const noun = nouns.get(entry.word) ?? {
    articles: new Set(),
    headwordArticles: new Set(),
    plurals: new Set(),
    meanings: [],
    marginalMeanings: [],
    rudeFirst: undefined,
  }
  nouns.set(entry.word, noun)

  for (const { form, tags } of entry.forms ?? []) {
    if (tags?.includes('plural')) noun.plurals.add(form)
  }

  let hasRealSense = false
  for (const sense of entry.senses ?? []) {
    const tags = sense.tags ?? []
    const rude = hasAny(tags, RUDE_TAGS)
    // Only the primary sense decides, so "zak" (bag) survives its slang use.
    noun.rudeFirst ??= rude
    if (rude || hasAny(tags, NOT_A_SENSE_TAGS)) continue
    hasRealSense = true

    const meaning = cleanMeaning(sense.glosses?.[0] ?? '')
    const usableMeaning = meaning && meaning.length <= MAX_MEANING_LENGTH

    // Regional senses often use a different gender than standard Dutch, so they don't vote.
    if (hasAny(tags, MARGINAL_SENSE_TAGS)) {
      if (usableMeaning) noun.marginalMeanings.push(meaning)
      continue
    }
    for (const article of articlesOf(tags)) noun.articles.add(article)
    if (usableMeaning) noun.meanings.push(meaning)
  }

  if (hasRealSense) {
    for (const article of articlesOf(headwordGenders(entry))) noun.headwordArticles.add(article)
  }
}

async function readDictionary(wanted) {
  const nouns = new Map()
  const verbs = new Map()
  const conflicts = new Set()
  const lines = createInterface({ input: createReadStream(DICTIONARY.file) })

  for await (const line of lines) {
    const entry = JSON.parse(line)
    if (!wanted(entry.word)) continue

    const hasRealSense = entry.senses?.some((sense) => !hasAny(sense.tags ?? [], NOT_A_SENSE_TAGS))
    if (CONFLICTING_CLASSES.has(entry.pos) && hasRealSense) conflicts.add(entry.word)
    if (entry.pos === 'verb') readVerb(entry, verbs)
    if (entry.pos === 'noun' && /^[a-zà-ÿ]{2,}$/.test(entry.word)) readNoun(entry, nouns)
  }

  return { nouns, verbs, conflicts }
}

// The frequency list counts spellings, not meanings: "weet" ranks high as a form of "weten",
// not as the rare noun. A spelling counts as a verb when it is an infinitive, or when its
// infinitive is common relative to it. An infinitive that doubles as the noun's own plural
// ("dag" / "dagen") proves nothing either way, so those are kept.
function isMostlyVerb(word, noun, { verbs, counts }) {
  const verb = verbs.get(word)
  if (!verb) return false
  if (verb.isInfinitive) return true
  const threshold = counts.get(word) * VERB_DOMINANCE_RATIO
  return [...verb.infinitives].some(
    (infinitive) => !noun.plurals.has(infinitive) && (counts.get(infinitive) ?? 0) >= threshold,
  )
}

function resolve(word, noun, context) {
  const { conflicts, blocklist, curated } = context
  const override = curated[word]
  const articles = [...firstNonEmpty(noun.articles, noun.headwordArticles)]
  const meaning = firstNonEmpty(noun.meanings, noun.marginalMeanings)[0]

  if (blocklist.has(word)) return { reason: 'blocked' }
  if (!override && conflicts.has(word)) return { reason: 'conflict', articles, meaning }
  if (!override && isMostlyVerb(word, noun, context)) return { reason: 'verb', articles, meaning }
  if (!override?.article && articles.length !== 1) return { reason: 'article', articles, meaning }
  if (!override?.en && !meaning) return { reason: 'meaning', articles }
  if (!override && noun.rudeFirst) return { reason: 'rude', articles, meaning }

  return { article: override?.article ?? articles[0], en: override?.en ?? meaning, emoji: override?.emoji }
}

async function main() {
  mkdirSync(CACHE_DIR, { recursive: true })
  await download(DICTIONARY)
  await download(FREQUENCY)

  const { ranks, counts } = readFrequencies()
  const curated = readJson('curated.json')
  const blocklist = new Set(readJson('blocklist.json'))
  const { nouns, verbs, conflicts } = await readDictionary((word) => ranks.has(word) || word in curated)
  const emojiByName = buildEmojiLookup()
  const context = { conflicts, verbs, counts, blocklist, curated }

  const rankOf = (word) => (curated[word]?.pinned ? 0 : (ranks.get(word) ?? Infinity))
  const candidates = [...nouns].sort(([a], [b]) => rankOf(a) - rankOf(b))

  const words = []
  const rejected = []
  for (const [word, noun] of candidates) {
    if (words.length === WORD_COUNT) break
    const { reason, articles = [], meaning = '', article, en, emoji } = resolve(word, noun, context)
    if (reason) {
      rejected.push([reason, word, articles.join('/'), meaning].join('\t'))
      continue
    }
    const picture = emoji ?? emojiByName.get(en.toLowerCase())
    words.push({
      nl: word,
      article,
      en,
      level: Math.floor(words.length / LEVEL_SIZE) + 1,
      ...(picture && { emoji: picture }),
    })
  }

  writeFileSync(OUTPUT_FILE, `[\n${words.map((word) => JSON.stringify(word)).join(',\n')}\n]\n`)
  writeFileSync(REPORT_FILE, `${rejected.join('\n')}\n`)

  const hetCount = words.filter((word) => word.article === 'het').length
  const emojiCount = words.filter((word) => word.emoji).length
  console.log(`Wrote ${words.length} words: ${words.length - hetCount} de, ${hetCount} het, ${emojiCount} with emoji`)
  console.log(`Skipped ${rejected.length} candidates, listed in ${path.relative(process.cwd(), REPORT_FILE)}`)
}

await main()
