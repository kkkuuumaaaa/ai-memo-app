'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div
      className={`prose prose-sm max-w-none
        prose-headings:font-semibold prose-headings:text-gray-900
        prose-p:text-gray-700 prose-p:leading-relaxed
        prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
        prose-strong:text-gray-900
        prose-code:text-pink-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
        prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg
        prose-blockquote:border-l-4 prose-blockquote:border-blue-300 prose-blockquote:text-gray-600 prose-blockquote:italic
        prose-ul:text-gray-700 prose-ol:text-gray-700
        prose-li:marker:text-gray-400
        prose-hr:border-gray-200
        prose-table:text-sm
        prose-th:bg-gray-50 prose-th:text-gray-700
        prose-td:text-gray-700
        prose-img:rounded-lg
        ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
