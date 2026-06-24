import { Memo, MemoFormData } from '@/types/memo'
import { supabase } from '@/utils/supabaseClient'

interface MemoRow {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  summary: string | null
  created_at: string
  updated_at: string
}

function mapRowToMemo(row: MemoRow): Memo {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    tags: row.tags,
    summary: row.summary ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const memoStorage = {
  getMemos: async (): Promise<Memo[]> => {
    const { data, error } = await supabase
      .from('memos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading memos:', error)
      return []
    }

    return (data as MemoRow[]).map(mapRowToMemo)
  },

  addMemo: async (memo: Memo): Promise<void> => {
    const { error } = await supabase.from('memos').insert({
      id: memo.id,
      title: memo.title,
      content: memo.content,
      category: memo.category,
      tags: memo.tags,
      summary: memo.summary ?? null,
      created_at: memo.createdAt,
      updated_at: memo.updatedAt,
    })

    if (error) {
      console.error('Error adding memo:', error)
      throw error
    }
  },

  updateMemo: async (updatedMemo: Memo): Promise<void> => {
    const { error } = await supabase
      .from('memos')
      .update({
        title: updatedMemo.title,
        content: updatedMemo.content,
        category: updatedMemo.category,
        tags: updatedMemo.tags,
        summary: updatedMemo.summary ?? null,
        updated_at: updatedMemo.updatedAt,
      })
      .eq('id', updatedMemo.id)

    if (error) {
      console.error('Error updating memo:', error)
      throw error
    }
  },

  updateSummary: async (id: string, summary: string): Promise<void> => {
    const { error } = await supabase
      .from('memos')
      .update({ summary, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error updating summary:', error)
      throw error
    }
  },

  deleteMemo: async (id: string): Promise<void> => {
    const { error } = await supabase.from('memos').delete().eq('id', id)

    if (error) {
      console.error('Error deleting memo:', error)
      throw error
    }
  },

  getMemoById: async (id: string): Promise<Memo | null> => {
    const { data, error } = await supabase
      .from('memos')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null

    return mapRowToMemo(data as MemoRow)
  },

  searchMemos: async (query: string): Promise<Memo[]> => {
    const memos = await memoStorage.getMemos()
    const lowercaseQuery = query.toLowerCase()

    return memos.filter(
      memo =>
        memo.title.toLowerCase().includes(lowercaseQuery) ||
        memo.content.toLowerCase().includes(lowercaseQuery) ||
        memo.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    )
  },

  getMemosByCategory: async (category: string): Promise<Memo[]> => {
    if (category === 'all') return memoStorage.getMemos()

    const { data, error } = await supabase
      .from('memos')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading memos by category:', error)
      return []
    }

    return (data as MemoRow[]).map(mapRowToMemo)
  },

  clearMemos: async (): Promise<void> => {
    const { error } = await supabase.from('memos').delete().neq('id', '')

    if (error) {
      console.error('Error clearing memos:', error)
      throw error
    }
  },

  saveMemos: async (memos: Memo[]): Promise<void> => {
    await memoStorage.clearMemos()
    if (memos.length === 0) return

    const rows = memos.map(memo => ({
      id: memo.id,
      title: memo.title,
      content: memo.content,
      category: memo.category,
      tags: memo.tags,
      summary: memo.summary ?? null,
      created_at: memo.createdAt,
      updated_at: memo.updatedAt,
    }))

    const { error } = await supabase.from('memos').insert(rows)

    if (error) {
      console.error('Error saving memos:', error)
      throw error
    }
  },
}

export type MemoStorageFormData = MemoFormData
