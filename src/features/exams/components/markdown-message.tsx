import { memo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

// Compact element styling tuned for the small AI chat bubble.
const components: Components = {
  p: ({ children }) => <p className='mb-2 last:mb-0'>{children}</p>,
  ul: ({ children }) => (
    <ul className='mb-2 list-disc space-y-1 pl-5 last:mb-0'>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className='mb-2 list-decimal space-y-1 pl-5 last:mb-0'>{children}</ol>
  ),
  li: ({ children }) => <li className='leading-relaxed'>{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      target='_blank'
      rel='noreferrer'
      className='font-medium text-primary underline underline-offset-2'
    >
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className='font-semibold'>{children}</strong>
  ),
  em: ({ children }) => <em className='italic'>{children}</em>,
  h1: ({ children }) => (
    <h1 className='mt-3 mb-2 text-base font-semibold first:mt-0'>{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className='mt-3 mb-2 text-base font-semibold first:mt-0'>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className='mt-2 mb-1 text-sm font-semibold first:mt-0'>{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className='mt-2 mb-1 text-sm font-semibold first:mt-0'>{children}</h4>
  ),
  blockquote: ({ children }) => (
    <blockquote className='mb-2 border-l-2 border-muted-foreground/30 pl-3 text-muted-foreground last:mb-0'>
      {children}
    </blockquote>
  ),
  hr: () => <hr className='my-3 border-muted-foreground/20' />,
  code: ({ className, children }) => {
    const text = String(children ?? '')
    const isBlock = /^language-/.test(className ?? '') || text.includes('\n')
    return isBlock ? (
      <code className={cn('font-mono', className)}>{children}</code>
    ) : (
      <code className='rounded bg-muted-foreground/15 px-1 py-0.5 font-mono text-[0.85em]'>
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className='mb-2 overflow-x-auto rounded-md bg-foreground/5 p-3 text-xs last:mb-0'>
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className='mb-2 overflow-x-auto last:mb-0'>
      <table className='w-full border-collapse text-xs'>{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className='border border-border px-2 py-1 text-left font-semibold'>
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className='border border-border px-2 py-1'>{children}</td>
  ),
}

/**
 * Render an assistant reply as Markdown (GFM: tables, task lists,
 * strikethrough, autolinks). Raw HTML is intentionally not enabled, so model
 * output cannot inject markup. Memoized so streaming re-renders stay cheap.
 */
export const MarkdownMessage = memo(function MarkdownMessage({
  content,
}: {
  content: string
}) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  )
})
