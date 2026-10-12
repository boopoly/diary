import { useEffect, useRef, useState } from 'react'
import { addDiary, fetchDiaries, removeDiary } from './api/diaries.js'

const emotions = [
  {
    value: 'joy',
    label: '기쁨',
    emoji: '😊',
    selected: 'border-[#efaa52] bg-[#fff4df] text-[#75480f]',
    idle: 'border-[#efe6d5] bg-white hover:border-[#efaa52]',
  },
  {
    value: 'calm',
    label: '평온',
    emoji: '😌',
    selected: 'border-[#69a78b] bg-[#eaf5ed] text-[#285d46]',
    idle: 'border-[#dce9df] bg-white hover:border-[#69a78b]',
  },
  {
    value: 'sad',
    label: '슬픔',
    emoji: '😢',
    selected: 'border-[#7d9ac2] bg-[#edf2fa] text-[#3e5579]',
    idle: 'border-[#e0e6ef] bg-white hover:border-[#7d9ac2]',
  },
  {
    value: 'angry',
    label: '화남',
    emoji: '😠',
    selected: 'border-[#db7766] bg-[#fff0ec] text-[#873c30]',
    idle: 'border-[#f0e1dd] bg-white hover:border-[#db7766]',
  },
  {
    value: 'anxious',
    label: '불안',
    emoji: '😰',
    selected: 'border-[#aa8ac1] bg-[#f5eff8] text-[#614576]',
    idle: 'border-[#e9e0ed] bg-white hover:border-[#aa8ac1]',
  },
]

const todayLabel = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'full' }).format(
  new Date(),
)

function formatError(error) {
  return error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.'
}

function formatDate(value) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value))
}

function App() {
  const [diaries, setDiaries] = useState([])
  const [selectedEmotion, setSelectedEmotion] = useState('')
  const [content, setContent] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState('')
  const savingRef = useRef(false)
  const deletingRef = useRef(false)

  useEffect(() => {
    let isCurrent = true

    async function loadDiaries() {
      setIsLoading(true)
      setError(null)

      try {
        const records = await fetchDiaries()
        if (isCurrent) setDiaries(records)
      } catch (loadError) {
        if (isCurrent) {
          setError({
            message: `기록을 불러오지 못했습니다. ${formatError(loadError)}`,
            retry: true,
          })
        }
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    void loadDiaries()

    return () => {
      isCurrent = false
    }
  }, [reloadKey])

  const filteredDiaries =
    activeFilter === 'all'
      ? diaries
      : diaries.filter((diary) => diary.emotion === activeFilter)
  const canSave = Boolean(selectedEmotion && content.trim()) && !isSaving

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmedContent = content.trim()

    if (!selectedEmotion || !trimmedContent || savingRef.current) return

    savingRef.current = true
    setIsSaving(true)
    setError(null)
    setNotice('')

    try {
      const newDiary = await addDiary({
        content: trimmedContent,
        emotion: selectedEmotion,
      })
      setDiaries((current) => [newDiary, ...current])
      setContent('')
      setSelectedEmotion('')
      setActiveFilter('all')
      setNotice('기록을 저장했습니다.')
    } catch (saveError) {
      setError({
        message: `저장하지 못했습니다. ${formatError(saveError)}`,
        retry: false,
      })
    } finally {
      savingRef.current = false
      setIsSaving(false)
    }
  }

  async function handleDelete(id) {
    if (deletingRef.current) return

    deletingRef.current = true
    setDeletingId(id)
    setError(null)
    setNotice('')

    try {
      await removeDiary(id)
      setDiaries((current) => current.filter((diary) => diary.id !== id))
      setNotice('기록을 삭제했습니다.')
    } catch (deleteError) {
      setError({
        message: `삭제하지 못했습니다. ${formatError(deleteError)}`,
        retry: false,
      })
    } finally {
      deletingRef.current = false
      setDeletingId(null)
    }
  }

  return (
    <div className="page-shell min-h-screen px-4 pb-8 sm:px-7">
      <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-[#dce5dc] py-5">
        <a href="#top" className="flex items-center gap-3 text-[#21332d] no-underline">
          <span className="grid size-10 place-items-center rounded-xl bg-[#27664e] text-xl text-white">
            ✳
          </span>
          <span className="font-semibold">마음결</span>
        </a>
        <span className="hidden text-sm text-[#6e8176] sm:block">감정 일기</span>
      </header>

      <main id="top" className="mx-auto max-w-6xl">
        <section className="enter-view flex flex-col justify-between gap-5 py-9 sm:flex-row sm:items-end sm:py-12">
          <div>
            <p className="mb-3 text-xs font-bold uppercase text-[#668173]">
              {todayLabel}
            </p>
            <h1 className="font-display text-4xl leading-tight text-[#21332d] sm:text-5xl">
              마음의 기록
            </h1>
            <p className="mt-3 text-base text-[#718078]">
              오늘의 마음을 천천히 돌아봅니다.
            </p>
          </div>
          <p className="text-sm text-[#718078]">
            쌓인 기록 <span className="ml-2 font-semibold text-[#27664e]">{diaries.length}</span>
          </p>
        </section>

        {error && (
          <div
            className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e9b6a9] bg-[#fff2ed] px-4 py-3 text-sm text-[#7a392d]"
            role="alert"
          >
            <span>{error.message}</span>
            <div className="flex items-center gap-3">
              {error.retry && (
                <button
                  type="button"
                  className="font-semibold underline underline-offset-4"
                  onClick={() => setReloadKey((current) => current + 1)}
                >
                  다시 시도
                </button>
              )}
              <button
                type="button"
                className="grid size-8 place-items-center rounded-full text-lg hover:bg-[#f8dfd7]"
                aria-label="오류 메시지 닫기"
                onClick={() => setError(null)}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {notice && (
          <p className="mb-5 text-sm font-medium text-[#27664e]" role="status">
            {notice}
          </p>
        )}

        <div className="enter-view-delayed grid items-start gap-8 lg:grid-cols-[minmax(290px,0.78fr)_minmax(0,1.22fr)] lg:gap-10">
          <section className="rounded-2xl border border-[#e0e8df] bg-white p-5 shadow-[0_14px_42px_-32px_rgba(31,64,48,0.5)] sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[#638272]">새 기록</p>
                <h2 className="mt-1 font-display text-2xl text-[#21332d]">지금 기분은 어때요?</h2>
              </div>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#edf5ed] text-lg" aria-hidden="true">
                ✎
              </span>
            </div>

            <form onSubmit={handleSubmit}>
              <fieldset className="mb-5 border-0 p-0">
                <legend className="mb-3 text-sm font-semibold text-[#435b4e]">
                  오늘의 감정
                </legend>
                <div className="grid grid-cols-5 gap-2" role="group" aria-label="감정 선택">
                  {emotions.map((emotion) => {
                    const isSelected = selectedEmotion === emotion.value

                    return (
                      <button
                        key={emotion.value}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => {
                          setSelectedEmotion(emotion.value)
                          setNotice('')
                        }}
                        className={`flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-xl border text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#27664e] ${isSelected ? emotion.selected : emotion.idle}`}
                      >
                        <span className="text-xl" aria-hidden="true">{emotion.emoji}</span>
                        <span>{emotion.label}</span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <label htmlFor="diary-content" className="mb-2 block text-sm font-semibold text-[#435b4e]">
                오늘의 한 줄
              </label>
              <textarea
                id="diary-content"
                value={content}
                onChange={(event) => {
                  setContent(event.target.value)
                  setNotice('')
                }}
                placeholder="지금 떠오르는 마음을 적어보세요."
                rows={6}
                className="w-full resize-y rounded-xl border border-[#dfe7df] bg-[#fbfcfa] px-4 py-3 text-sm leading-6 text-[#263a30] outline-none transition placeholder:text-[#a3b0a7] focus:border-[#75a88a] focus:ring-4 focus:ring-[#dceee1]"
              />
              <div className="mt-4 flex items-center justify-between gap-4">
                <span className="text-xs text-[#8a9a8f]">{content.length}자</span>
                <button
                  type="submit"
                  disabled={!canSave}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#27664e] px-5 text-sm font-semibold text-white transition hover:bg-[#1e553f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#27664e] disabled:bg-[#a8b8ae]"
                >
                  {isSaving ? '저장 중...' : '기록 저장'}
                  {!isSaving && <span aria-hidden="true">↗</span>}
                </button>
              </div>
            </form>
          </section>

          <section aria-labelledby="diary-list-title" className="min-w-0">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-[#638272]">나의 아카이브</p>
                <h2 id="diary-list-title" className="mt-1 font-display text-2xl text-[#21332d]">
                  기록 모아보기
                </h2>
              </div>
              <span className="text-sm text-[#718078]">{filteredDiaries.length}개</span>
            </div>

            <div className="mb-5 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="감정별 필터">
              <button
                type="button"
                aria-pressed={activeFilter === 'all'}
                onClick={() => setActiveFilter('all')}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${activeFilter === 'all' ? 'bg-[#27664e] text-white' : 'border border-[#dce5dc] bg-white/75 text-[#5d7265] hover:border-[#8fac98]'}`}
              >
                전체 {diaries.length}
              </button>
              {emotions.map((emotion) => {
                const count = diaries.filter((diary) => diary.emotion === emotion.value).length

                return (
                  <button
                    key={emotion.value}
                    type="button"
                    aria-pressed={activeFilter === emotion.value}
                    onClick={() => setActiveFilter(emotion.value)}
                    className={`shrink-0 rounded-full px-3 py-2 text-sm transition ${activeFilter === emotion.value ? 'bg-[#dceee1] font-semibold text-[#24573f]' : 'border border-[#dce5dc] bg-white/75 text-[#5d7265] hover:border-[#8fac98]'}`}
                  >
                    <span aria-hidden="true">{emotion.emoji}</span>
                    <span className="ml-1">{emotion.label}</span>
                    <span className="ml-1 text-xs opacity-70">{count}</span>
                  </button>
                )
              })}
            </div>

            <div aria-live="polite">
              {isLoading ? (
                <div className="rounded-2xl border border-[#e0e8df] bg-white/80 px-5 py-12 text-center text-sm text-[#718078]">
                  <span className="mx-auto mb-3 block size-6 animate-spin rounded-full border-2 border-[#cbd9ce] border-t-[#27664e]" aria-hidden="true" />
                  기록을 불러오는 중...
                </div>
              ) : filteredDiaries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#cbd9ce] bg-white/55 px-5 py-12 text-center">
                  <span className="mb-3 block text-3xl" aria-hidden="true">
                    {activeFilter === 'all' ? '✿' : emotions.find((emotion) => emotion.value === activeFilter)?.emoji}
                  </span>
                  <p className="font-medium text-[#496454]">
                    {activeFilter === 'all' ? '아직 기록이 없습니다.' : '이 감정의 기록이 없습니다.'}
                  </p>
                  {activeFilter === 'all' && (
                    <p className="mt-1 text-sm text-[#819087]">오늘의 마음을 첫 기록으로 남겨보세요.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDiaries.map((diary) => {
                    const emotion = emotions.find((item) => item.value === diary.emotion)

                    return (
                      <article
                        key={diary.id}
                        className="rounded-2xl border border-[#e0e8df] bg-white/90 p-4 shadow-[0_10px_30px_-28px_rgba(31,64,48,0.55)] sm:p-5"
                      >
                        <div className="flex items-start gap-3">
                          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f1f5ef] text-2xl" aria-hidden="true">
                            {emotion?.emoji ?? '📝'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                              <span className="text-sm font-semibold text-[#40594a]">
                                {emotion?.label ?? '기록'}
                              </span>
                              <time className="text-xs text-[#88968d]" dateTime={diary.created_at}>
                                {formatDate(diary.created_at)}
                              </time>
                            </div>
                            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#34453b]">
                              {diary.content}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => void handleDelete(diary.id)}
                            disabled={deletingId !== null}
                            aria-label={`${formatDate(diary.created_at)} ${emotion?.label ?? ''} 기록 삭제`}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#8b655c] transition hover:bg-[#fff1ed] hover:text-[#8b392c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#db7766] disabled:opacity-50"
                          >
                            {deletingId === diary.id ? '삭제 중...' : '삭제'}
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <footer className="mx-auto mt-10 max-w-6xl border-t border-[#dce5dc] pt-5 text-center text-xs leading-5 text-[#7b8b80]">
        공용 일기장 · 등록한 기록은 누구나 볼 수 있고 삭제할 수 있습니다.
      </footer>
    </div>
  )
}

export default App