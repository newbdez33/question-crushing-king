import admin from 'firebase-admin'

function parseArgs(argv) {
  const args = {}
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=')
      if (typeof v === 'undefined') {
        args[k] = true
      } else {
        args[k] = v
      }
    }
  }
  return args
}

function parseDuration(input) {
  if (!input) return null
  const m = String(input).match(/^(\d+)([smhd])$/)
  if (!m) return null
  const n = Number(m[1])
  const unit = m[2]
  const map = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }
  return n * map[unit]
}

async function main() {
  const args = parseArgs(process.argv)
  const emailPattern = args['email-pattern']
    ? new RegExp(args['email-pattern'])
    : /^e2e\./
  const createdWithinMs = parseDuration(args['created-within'])
  const provider = args['provider'] || 'password'
  const dryRun = args['dry-run'] !== undefined ? true : !args['force']
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID ||
    undefined

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (!credPath) {
    console.error(
      'ERROR: GOOGLE_APPLICATION_CREDENTIALS 未设置。请将其指向服务账号 JSON 文件路径。'
    )
    process.exit(1)
  }

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId,
  })
  const auth = admin.auth()

  const now = Date.now()
  let nextPageToken = undefined
  let candidates = []
  let scanned = 0

  do {
    const res = await auth.listUsers(1000, nextPageToken)
    scanned += res.users.length
    for (const u of res.users) {
      const email = u.email || ''
      const providers = (u.providerData || []).map((p) => p.providerId)
      const createdAt = u.userMetadata?.creationTime
        ? Date.parse(u.userMetadata.creationTime)
        : undefined
      const matchEmail = email && emailPattern.test(email)
      const matchProvider = providers.includes(provider)
      const matchCreatedWithin =
        createdWithinMs == null ||
        (createdAt != null && now - createdAt <= createdWithinMs)
      if (matchEmail && matchProvider && matchCreatedWithin) {
        candidates.push({ uid: u.uid, email })
      }
    }
    nextPageToken = res.pageToken
  } while (nextPageToken)

  if (!candidates.length) {
    console.log(
      `扫描完成，共检查 ${scanned} 个用户；未找到匹配的测试用户。`
    )
    return
  }

  console.log(
    `扫描完成，共检查 ${scanned} 个用户；匹配到 ${candidates.length} 个候选。`
  )
  console.log(
    '示例（最多显示前 10 条）：',
    candidates.slice(0, 10).map((c) => c.email)
  )

  if (dryRun) {
    console.log(
      '干运行模式：未执行删除。使用 --force 以实际删除匹配用户。'
    )
    return
  }

  const chunkSize = 1000
  for (let i = 0; i < candidates.length; i += chunkSize) {
    const chunk = candidates.slice(i, i + chunkSize)
    const uids = chunk.map((c) => c.uid)
    const res = await auth.deleteUsers(uids)
    console.log(
      `删除批次 ${i / chunkSize + 1}：成功 ${res.successCount}，失败 ${res.failureCount}`
    )
    if (res.failureCount) {
      for (const e of res.errors) {
        console.warn(`删除失败 uid=${e.index != null ? uids[e.index] : '?'}: ${e.error}`)
      }
    }
  }
  console.log('删除完成。')
}

main().catch((err) => {
  console.error('执行失败：', err)
  process.exit(1)
})

