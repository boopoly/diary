import { supabase } from '../lib/supabase.js'

const tableName = 'diaries'
const diaryColumns = 'id, content, emotion, created_at'

function getClient() {
  if (!supabase) {
    throw new Error(
      'VITE_SUPABASE_URL과 VITE_SUPABASE_PUBLISHABLE_KEY를 설정해주세요.',
    )
  }

  return supabase
}

export async function fetchDiaries() {
  const { data, error } = await getClient()
    .from(tableName)
    .select(diaryColumns)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function addDiary({ content, emotion }) {
  const { data, error } = await getClient()
    .from(tableName)
    .insert({ content, emotion })
    .select(diaryColumns)
    .single()

  if (error) throw error
  return data
}

export async function removeDiary(id) {
  const { error } = await getClient().from(tableName).delete().eq('id', id)

  if (error) throw error
}