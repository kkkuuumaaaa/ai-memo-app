'use client'

import { useEffect, useState, useCallback } from 'react'
import { Memo, MEMO_CATEGORIES } from '@/types/memo'
import MarkdownRenderer from '@/components/MarkdownRenderer'

interface MemoDetailModalProps {
  memo: Memo | null
  onClose: () => void
  onSaveSummary?: (id: string, summary: string) => Promise<void>
}

type SummaryStatus = 'idle' | 'loading' | 'success' | 'error'

export default function MemoDetailModal({ memo, onClose, onSaveSummary }: MemoDetailModalProps) {
  const [summaryStatus, setSummaryStatus] = useState<SummaryStatus>('idle')
  const [summaryText, setSummaryText] = useState('')
  const [summaryError, setSummaryError] = useState('')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    if (memo?.summary) {
      setSummaryStatus('success')
      setSummaryText(memo.summary)
    } else {
      setSummaryStatus('idle')
      setSummaryText('')
    }
    setSummaryError('')
  }, [memo?.id, memo?.summary])

  const handleSummarize = useCallback(async () => {
    if (!memo) return

    setSummaryStatus('loading')
    setSummaryText('')
    setSummaryError('')

    try {
      const res = await fetch('/api/memos/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: memo.title, content: memo.content }),
      })

      const data = (await res.json()) as { summary?: string; error?: string }

      if (!res.ok || !data.summary) {
        setSummaryError(data.error ?? '요약을 생성하지 못했습니다.')
        setSummaryStatus('error')
        return
      }

      setSummaryText(data.summary)
      setSummaryStatus('success')

      if (onSaveSummary) {
        try {
          await onSaveSummary(memo.id, data.summary)
        } catch {
          // 저장 실패해도 UI는 유지
        }
      }
    } catch {
      setSummaryError('네트워크 오류로 요약을 생성하지 못했습니다.')
      setSummaryStatus('error')
    }
  }, [memo, onSaveSummary])

  if (!memo) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      personal: 'bg-blue-100 text-blue-800',
      work: 'bg-green-100 text-green-800',
      study: 'bg-purple-100 text-purple-800',
      idea: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800',
    }
    return colors[category] ?? colors.other
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      data-testid="memo-detail-modal"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 pr-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {memo.title}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(memo.category)}`}
                >
                  {MEMO_CATEGORIES[memo.category as keyof typeof MEMO_CATEGORIES] ?? memo.category}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="닫기"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 날짜 정보 */}
          <div className="flex flex-col gap-1 mb-5 text-xs text-gray-500">
            <span>작성일: {formatDate(memo.createdAt)}</span>
            {memo.createdAt !== memo.updatedAt && (
              <span>수정일: {formatDate(memo.updatedAt)}</span>
            )}
          </div>

          {/* 구분선 */}
          <hr className="border-gray-200 mb-5" />

          {/* AI 요약 섹션 */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-purple-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-700">AI 요약</span>
              </div>
              <button
                onClick={handleSummarize}
                disabled={summaryStatus === 'loading'}
                data-testid="summarize-btn"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {summaryStatus === 'loading' ? (
                  <>
                    <svg
                      className="w-3 h-3 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    요약 중...
                  </>
                ) : summaryStatus === 'success' ? (
                  '다시 요약'
                ) : (
                  '요약하기'
                )}
              </button>
            </div>

            {summaryStatus === 'success' && summaryText && (
              <div
                className="rounded-lg bg-purple-50 border border-purple-100 px-4 py-3 text-sm text-gray-700 leading-relaxed"
                data-testid="summary-result"
              >
                {summaryText}
              </div>
            )}

            {summaryStatus === 'error' && (
              <div
                className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600"
                data-testid="summary-error"
              >
                {summaryError}
              </div>
            )}

            {summaryStatus === 'idle' && (
              <p className="text-xs text-gray-400">
                버튼을 눌러 메모 내용을 AI로 요약해 보세요.
              </p>
            )}
          </div>

          {/* 구분선 */}
          <hr className="border-gray-200 mb-5" />

          {/* 본문 내용 */}
          <MarkdownRenderer content={memo.content} className="mb-5" />

          {/* 태그 */}
          {memo.tags.length > 0 && (
            <>
              <hr className="border-gray-200 mb-4" />
              <div className="flex gap-2 flex-wrap">
                {memo.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
