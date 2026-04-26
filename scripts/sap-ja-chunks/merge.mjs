/**
 * Merge tmp/sap-ja-out/chunk-*.json into public/data/SAP-C02.json as contents.ja.
 * Expects each translated file: { "questions": [ { "id", "contentJa", "options": [{ "label", "contentJa" }] } ] }
 * Usage: node scripts/sap-ja-chunks/merge.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const DATA = join(ROOT, 'public/data/SAP-C02.json')
const JA_DIR = join(ROOT, 'tmp/sap-ja-out')

const data = JSON.parse(readFileSync(DATA, 'utf8'))
const byId = new Map()

const files = readdirSync(JA_DIR)
  .filter((f) => /^chunk-\d+\.json$/.test(f))
  .sort()

if (files.length === 0) {
  console.error(`No chunk-*.json in ${JA_DIR}`)
  process.exit(1)
}

for (const f of files) {
  const j = JSON.parse(readFileSync(join(JA_DIR, f), 'utf8'))
  const arr = j.questions
  if (!Array.isArray(arr)) {
    console.error(`Bad file ${f}: missing questions array`)
    process.exit(1)
  }
  for (const row of arr) {
    if (!row.id || typeof row.contentJa !== 'string') {
      console.error(`Bad row in ${f}: need id and contentJa string`)
      process.exit(1)
    }
    const opts = new Map()
    for (const o of row.options ?? []) {
      if (o.label && typeof o.contentJa === 'string') opts.set(o.label, o.contentJa.trim())
    }
    byId.set(row.id, { contentJa: row.contentJa.trim(), options: opts })
  }
}

let applied = 0
for (const q of data.questions) {
  const tr = byId.get(q.id)
  if (!tr) {
    console.error(`Missing translation for question id ${q.id} (#${q.questionNumber})`)
    process.exit(1)
  }
  q.contents = { ...q.contents, ja: tr.contentJa }
  for (const o of q.options ?? []) {
    const ja = tr.options.get(o.label)
    if (ja == null) {
      console.error(`Missing option ${o.label} for Q${q.questionNumber} (${q.id})`)
      process.exit(1)
    }
    o.contents = { ...o.contents, ja }
  }
  applied++
}

writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n', 'utf8')
console.log(`Merged ${applied} questions from ${files.length} files -> ${DATA}`)
