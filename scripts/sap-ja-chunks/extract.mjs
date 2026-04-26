/**
 * Split SAP-C02.json into translation chunks (stems + options only).
 * Usage: node scripts/sap-ja-chunks/extract.mjs
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const DATA = join(ROOT, 'public/data/SAP-C02.json')
const OUT_DIR = join(ROOT, 'tmp/sap-chunks')
const CHUNK = 15

const data = JSON.parse(readFileSync(DATA, 'utf8'))
const qs = data.questions
mkdirSync(OUT_DIR, { recursive: true })

let idx = 0
for (let i = 0; i < qs.length; i += CHUNK) {
  const slice = qs.slice(i, i + CHUNK).map((q) => ({
    id: q.id,
    questionNumber: q.questionNumber,
    content: q.content,
    options: (q.options ?? []).map((o) => ({ label: o.label, content: o.content })),
  }))
  const name = `chunk-${String(idx).padStart(2, '0')}.json`
  writeFileSync(
    join(OUT_DIR, name),
    JSON.stringify({ chunkIndex: idx, startQuestion: slice[0].questionNumber, questions: slice }, null, 2),
    'utf8',
  )
  idx++
}
console.log(`Wrote ${idx} chunks (${CHUNK} questions each, last may be shorter) -> ${OUT_DIR}`)
