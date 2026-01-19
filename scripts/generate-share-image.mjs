import { chromium } from 'playwright'

const url = process.env.SHARE_URL || 'http://localhost:5175/images/twitter-card.svg'
const out = process.env.OUT_PATH || 'public/images/twitter-card.png'
const width = Number(process.env.WIDTH || 1200)
const height = Number(process.env.HEIGHT || 630)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width, height } })
await page.goto(url, { waitUntil: 'networkidle' })
await page.screenshot({ path: out, type: 'png' })
await browser.close()
