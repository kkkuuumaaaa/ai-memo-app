'use client'

import { Memo, MEMO_CATEGORIES } from '@/types/memo'

interface MemoItemProps {
  memo: Memo
  onView: (memo: Memo) => void
  onEdit: (memo: Memo) => void
  onDelete: (id: string) => void
  onToggleFavorite: (id: string) => void
}

export default function MemoItem({ memo, onView, onEdit, onDelete, onToggleFavorite }: MemoItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      personal: 'bg-blue-100 text-blue-800',
      work: 'bg-green-100 text-green-800',
      study: 'bg-purple-100 text-purple-800',
      idea: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800',
    }
    return colors[category as keyof typeof colors] || colors.other
  }

  return (
    <div
      className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={() => onView(memo)}
      data-testid="memo-item"
    >
      {/* 헤더 */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {memo.title}
          </h3>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(memo.category)}`}
            >
              {MEMO_CATEGORIES[memo.category as keyof typeof MEMO_CATEGORIES] ||
                memo.category}
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(memo.updatedAt)}
            </span>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2 ml-4">
          <button
            onClick={e => { e.stopPropagation(); onToggleFavorite(memo.id) }}
            className={`p-2 rounded-lg transition-colors ${memo.isFavorite ? 'text-yellow-400 hover:text-yellow-500 hover:bg-yellow-50' : 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-50'}`}
            title={memo.isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
            aria-label={memo.isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
          >
            <svg
              className="w-4 h-4"
              fill={memo.isFavorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
          <button
            onClick={e => { e.stopPropagation(); onEdit(memo) }}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="편집"
            aria-label="편집"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={e => {
              e.stopPropagation()
              if (window.confirm('정말로 이 메모를 삭제하시겠습니까?')) {
                onDelete(memo.id)
              }
            }}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="삭제"
            aria-label="삭제"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 내용 */}
      <div className="mb-4">
        <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
          {memo.content}
        </p>
      </div>

      {/* 태그 */}
      {memo.tags.length > 0 && (
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
      )}
    </div>
  )
}
