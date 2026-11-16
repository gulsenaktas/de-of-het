# De of Het?

A small swipe game for learning Dutch articles. A noun appears on a card; swipe left for **de**, right for **het**.

Built with React, TypeScript, Vite and Motion.

## Running

```bash
npm install
npm run dev
```

## Word list

`src/data/words.json` is generated, not written by hand:

```bash
npm run build:words
```

The script downloads two open datasets into `scripts/.cache/` (about 260 MB, not committed), picks the 1500 most frequent Dutch nouns with a single unambiguous article and writes them with an English meaning and a level (1 to 3, by frequency).

Two files in `scripts/` steer the result:

- `curated.json` fixes an article, meaning or emoji for a word, and rescues good nouns the automatic rules would skip (for example words that are also a verb form). `"pinned": true` puts a word in level 1 regardless of frequency.
- `blocklist.json` lists words to leave out.

After a run, `scripts/.cache/report.txt` lists every skipped candidate and why.

## Data sources

- Articles and meanings: [Wiktionary](https://en.wiktionary.org), via the machine-readable extract at [kaikki.org](https://kaikki.org/dictionary/Dutch/). Licensed CC BY-SA 4.0 and GFDL.
- Word frequencies: [FrequencyWords](https://github.com/hermitdave/FrequencyWords) by Hermit Dave, based on OpenSubtitles 2018. Content licensed CC BY-SA 4.0.
- Emoji names: [unicode-emoji-json](https://github.com/muan/unicode-emoji-json).
