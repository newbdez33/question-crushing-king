const ISSUE_NEW_URL = 'https://github.com/newbdez33/question-crushing-king/issues/new'
const TEMPLATE = 'exam-request.yml'

/** Link to the pre-filled "Request an Exam" GitHub issue form. */
export function buildExamRequestIssueUrl(options: { contact?: string | null } = {}): string {
  const params = new URLSearchParams({ template: TEMPLATE })
  const contact = options.contact?.trim()
  if (contact) params.set('contact', contact)
  return `${ISSUE_NEW_URL}?${params.toString()}`
}
