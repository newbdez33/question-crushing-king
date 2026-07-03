export interface QuestionContext {
  questionId: string
  examId: string
  questionText: string
  options: { letter: string; text: string }[]
  correctLetters: string[]
  userSelectedLetters: string[]
  language: string
  builtinExplanation?: string
}

function languageName(language: string): string {
  switch (language) {
    case 'zh':
      return 'Simplified Chinese'
    case 'zh-TC':
      return 'Traditional Chinese'
    case 'ja':
      return 'Japanese'
    default:
      return language
  }
}

/**
 * Render the current question as reference context (stem, options, correct
 * answer, the user's answer, and any built-in explanation).
 *
 * This is injected into the system message on *every* request so the model
 * always knows which question is being discussed — whether the user clicks
 * "Explain this question" or types a free-form follow-up like "explain in
 * Chinese". It intentionally contains no instruction of its own.
 */
export function buildQuestionContext(ctx: QuestionContext): string {
  const lines: string[] = []
  lines.push('Question:')
  lines.push(ctx.questionText)
  lines.push('')
  lines.push('Options:')
  ctx.options.forEach((o) => {
    lines.push(`${o.letter}. ${o.text}`)
  })
  lines.push('')
  lines.push(`Correct answer: ${ctx.correctLetters.join(', ')}`)
  if (ctx.userSelectedLetters.length > 0) {
    lines.push(`My answer: ${ctx.userSelectedLetters.join(', ')}`)
  }
  if (ctx.builtinExplanation) {
    lines.push('')
    lines.push(`Existing explanation (for reference): ${ctx.builtinExplanation}`)
  }
  return lines.join('\n')
}

/**
 * The message sent when the user clicks "Explain this question". The question
 * itself lives in the system context (see {@link buildQuestionContext}), so
 * this carries only the ask plus the response-language directive.
 */
export function buildExplainInstruction(ctx: QuestionContext): string {
  const lines: string[] = [
    'Please explain why the correct answer is right and why each other option is wrong, in plain language.',
  ]
  if (ctx.language && ctx.language !== 'en') {
    lines.push(`Respond in ${languageName(ctx.language)}.`)
  }
  return lines.join('\n')
}

/**
 * Compose the system message: the user's own system prompt (if any) followed by
 * the current question context. Either part may be empty.
 */
export function buildSystemPrompt(
  systemPrompt: string | undefined,
  ctx: QuestionContext
): string {
  return [systemPrompt?.trim(), buildQuestionContext(ctx)]
    .filter(Boolean)
    .join('\n\n')
}
