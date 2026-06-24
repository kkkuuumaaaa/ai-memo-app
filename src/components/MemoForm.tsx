'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Memo,
  MemoFormData,
  MEMO_CATEGORIES,
  DEFAULT_CATEGORIES,
} from '@/types/memo'
import MarkdownRenderer from '@/components/MarkdownRenderer'

interface MemoFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: MemoFormData) => void
  editingMemo?: Memo | null
}

type TagSuggestStatus = 'idle' | 'loading' | 'suggested' | 'error'

export default function MemoForm({
  isOpen,
  onClose,
  onSubmit,
  editingMemo,
}: MemoFormProps) {
  const [formData, setFormData] = useState<MemoFormData>({
    title: '',
    content: '',
    category: 'personal',
    tags: [],
  })
  const [tagInput, setTagInput] = useState('')

  const [tagSuggestStatus, setTagSuggestStatus] = useState<TagSuggestStatus>('idle')
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])
  const [selectedSuggestedTags, setSelectedSuggestedTags] = useState<string[]>([])
  const [tagSuggestError, setTagSuggestError] = useState('')

  useEffect(() => {
    if (editingMemo) {
      setFormData({
        title: editingMemo.title,
        content: editingMemo.content,
        category: editingMemo.category,
        tags: editingMemo.tags,
      })
    } else {
      setFormData({
        title: '',
        content: '',
        category: 'personal',
        tags: [],
      })
    }
    setTagInput('')
    setTagSuggestStatus('idle')
    setSuggestedTags([])
    setSelectedSuggestedTags([])
    setTagSuggestError('')
  }, [editingMemo, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.')
      return
    }
    onSubmit(formData)
    onClose()
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }))
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSuggestTags = useCallback(async () => {
    setTagSuggestStatus('loading')
    setSuggestedTags([])
    setSelectedSuggestedTags([])
    setTagSuggestError('')

    try {
      const res = await fetch('/api/memos/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formData.title, content: formData.content }),
      })

      const data = (await res.json()) as { tags?: string[]; error?: string }

      if (!res.ok || !data.tags) {
        setTagSuggestError(data.error ?? '태그 추천에 실패했습니다.')
        setTagSuggestStatus('error')
        return
      }

      const newTags = data.tags.filter(t => !formData.tags.includes(t))
      if (newTags.length === 0) {
        setTagSuggestError('이미 추가된 태그와 동일한 추천 결과입니다.')
        setTagSuggestStatus('error')
        return
      }

      setSuggestedTags(newTags)
      setSelectedSuggestedTags(newTags)
      setTagSuggestStatus('suggested')
    } catch {
      setTagSuggestError('네트워크 오류로 태그 추천에 실패했습니다.')
      setTagSuggestStatus('error')
    }
  }, [formData.title, formData.content, formData.tags])

  const handleToggleSuggestedTag = (tag: string) => {
    setSelectedSuggestedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleAddSuggestedTags = () => {
    if (selectedSuggestedTags.length === 0) return
    setFormData(prev => ({
      ...prev,
      tags: [
        ...prev.tags,
        ...selectedSuggestedTags.filter(t => !prev.tags.includes(t)),
      ],
    }))
    setTagSuggestStatus('idle')
    setSuggestedTags([])
    setSelectedSuggestedTags([])
  }

  const canSuggest =
    formData.title.trim().length > 0 && formData.content.trim().length >= 10

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingMemo ? '메모 편집' : '새 메모 작성'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                제목 *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                className="placeholder-gray-400 text-gray-400 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="메모 제목을 입력하세요"
                required
              />
            </div>

            {/* 카테고리 */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                카테고리
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                className="text-gray-400 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {DEFAULT_CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {MEMO_CATEGORIES[category]}
                  </option>
                ))}
              </select>
            </div>

            {/* 내용 - 좌우 분할 뷰 */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 왼쪽: 편집기 */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1.5">
                    <label
                      htmlFor="content"
                      className="text-sm font-medium text-gray-700"
                    >
                      내용 *
                    </label>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">편집</span>
                  </div>
                  <textarea
                    id="content"
                    value={formData.content}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    className="placeholder-gray-400 text-gray-700 w-full h-56 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none font-mono text-sm leading-relaxed"
                    placeholder={"# 제목\n\n내용을 입력하세요.\n\n**굵게**, *기울임*, `코드`\n- 목록 항목\n- [x] 체크박스"}
                    required
                  />
                </div>

                {/* 오른쪽: 미리보기 */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-medium text-gray-700">미리보기</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">실시간</span>
                  </div>
                  <div className="w-full h-56 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 overflow-y-auto">
                    {formData.content.trim() ? (
                      <MarkdownRenderer content={formData.content} />
                    ) : (
                      <p className="text-gray-400 text-sm mt-1">왼쪽에 내용을 입력하면<br />여기에 미리보기가 표시됩니다.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 태그 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  태그
                </label>
                <button
                  type="button"
                  onClick={handleSuggestTags}
                  disabled={!canSuggest || tagSuggestStatus === 'loading'}
                  data-testid="suggest-tags-btn"
                  title={!canSuggest ? '제목과 내용을 먼저 입력하세요' : 'AI로 태그를 추천받으세요'}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {tagSuggestStatus === 'loading' ? (
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
                      추천 중...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-3 h-3"
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
                      AI 태그 추천
                    </>
                  )}
                </button>
              </div>

              {/* 수동 태그 입력 */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  className="placeholder-gray-400 text-black flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="태그를 입력하고 Enter를 누르세요"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  추가
                </button>
              </div>

              {/* AI 추천 태그 패널 */}
              {tagSuggestStatus === 'suggested' && suggestedTags.length > 0 && (
                <div
                  className="mb-3 rounded-lg border border-purple-100 bg-purple-50 p-3"
                  data-testid="suggested-tags-panel"
                >
                  <p className="text-xs font-medium text-purple-700 mb-2">
                    AI 추천 태그 — 추가할 태그를 선택하세요
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {suggestedTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleSuggestedTag(tag)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          selectedSuggestedTags.includes(tag)
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-100'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddSuggestedTags}
                      disabled={selectedSuggestedTags.length === 0}
                      className="px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      선택한 태그 추가 ({selectedSuggestedTags.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTagSuggestStatus('idle')
                        setSuggestedTags([])
                        setSelectedSuggestedTags([])
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              )}

              {/* 태그 추천 오류 */}
              {tagSuggestStatus === 'error' && (
                <div
                  className="mb-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600"
                  data-testid="suggest-tags-error"
                >
                  {tagSuggestError}
                </div>
              )}

              {/* 현재 태그 목록 */}
              {formData.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <svg
                          className="w-3 h-3"
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
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              >
                {editingMemo ? '수정하기' : '저장하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
