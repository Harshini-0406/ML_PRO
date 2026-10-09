import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiFetch } from './api'

type TestConfig = { category: string; difficulty: string; count: number; durationMinutes: number; adaptive: boolean }
type Question = {
  id: string
  category: string
  topic: string
  difficulty: string
  prompt: string
  options: string[]
  marks: number
}
type TestReview = Question & {
  correctAnswer: string
  explanation: string
  userAnswer: string | null
  isCorrect: boolean
  marksAwarded: number
}
type TestResult = {
  attemptId: number
  score: number
  total: number
  percentage: number
  verdict: string
  correctCount: number
  incorrectCount: number
  unansweredCount: number
  timeTakenSeconds: number
  weakTopics: string[]
  topicPerformance: Array<{ topic: string; category: string; correct: number; total: number; percentage: number }>
  categoryPerformance: Array<{ category: string; correct: number; total: number; percentage: number }>
  recommendations: Array<{ topic: string; action: string; priority: string }>
  nextBestAction: string
  performanceAnalysis: { source: string; classification: string; note: string }
  review: TestReview[]
}
type Session = { token: string }
type TestResponse = {
  category: string
  difficulty: string
  questions: Question[]
  durationSeconds: number
  availableCount: number
  adaptive: boolean
}

const sessionKey = 'examiq_session'
const defaultConfig: TestConfig = { category: 'Mixed', difficulty: 'Mixed', count: 10, durationMinutes: 15, adaptive: false }
const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`

function getSession(): Session | null {
  try {
    const stored = localStorage.getItem(sessionKey)
    return stored ? JSON.parse(stored) as Session : null
  } catch {
    return null
  }
}

export default function MockTestRunner() {
  const navigate = useNavigate()
  const location = useLocation()
  const config = (location.state as { config?: TestConfig } | null)?.config ?? defaultConfig
  const [test, setTest] = useState<TestResponse | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [marked, setMarked] = useState<string[]>([])
  const [index, setIndex] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [result, setResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submitLock = useRef(false)

  const loadTest = async () => {
    const session = getSession()
    if (!session) {
      navigate('/login', { replace: true })
      return
    }
    setLoading(true)
    setError(null)
    setTest(null)
    setResult(null)
    setAnswers({})
    setMarked([])
    setIndex(0)
    submitLock.current = false
    try {
      const params = new URLSearchParams({
        category: config.category,
        difficulty: config.difficulty === 'Mixed' ? '' : config.difficulty,
        count: String(config.count),
        durationMinutes: String(config.durationMinutes),
        adaptive: String(config.adaptive),
      })
      const response = await apiFetch(`/api/mock-test?${params}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      })
      const data = await response.json() as TestResponse & { message?: string }
      if (!response.ok) throw new Error(data.message ?? `Could not load the test (${response.status}).`)
      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('No questions match these settings. Choose a different category or difficulty.')
      }
      setTest(data)
      setRemaining(data.durationSeconds)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load this test.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTest()
    // A new location state intentionally loads a new attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.category, config.difficulty, config.count, config.durationMinutes, config.adaptive, navigate])

  const submitTest = async (automatic = false) => {
    if (!test || result || submitLock.current) return
    if (!automatic && !window.confirm('Submit this test now? You cannot change your answers after submission.')) return
    const session = getSession()
    if (!session) {
      navigate('/login', { replace: true })
      return
    }
    submitLock.current = true
    setSubmitting(true)
    setError(null)
    try {
      const response = await apiFetch('/api/mock-test/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          answers,
          questionIds: test.questions.map((question) => question.id),
          category: test.category,
          difficulty: test.difficulty,
          timeTakenSeconds: Math.max(0, test.durationSeconds - remaining),
        }),
      })
      const data = await response.json() as TestResult & { message?: string }
      if (!response.ok) throw new Error(data.message ?? `Could not submit this test (${response.status}).`)
      setResult(data)
    } catch (submitError) {
      submitLock.current = false
      setError(submitError instanceof Error ? submitError.message : 'Could not submit this test.')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!test || result || loading || remaining <= 0) return
    const timer = window.setTimeout(() => setRemaining((seconds) => seconds - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [loading, remaining, result, test])

  useEffect(() => {
    if (test && !loading && !result && remaining === 0) void submitTest(true)
    // Submit once when the countdown reaches zero.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, remaining, result, test])

  const page = (title: string, subtitle: string, children: ReactNode) => (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white md:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-[28px] border border-slate-700 bg-slate-900/80 p-5 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link to="/mock-tests" className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 font-black text-slate-950">E</span>
              <span className="text-xl font-black">ExamIQ</span>
            </Link>
            <Link to="/mock-tests" className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:border-violet-400">Exit test</Link>
          </div>
          <p className="mt-5 text-xs uppercase tracking-[0.25em] text-violet-300">Exam Intelligence</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
        </header>
        {children}
      </div>
    </div>
  )

  if (loading) return page('Preparing your test...', 'Loading questions and setting up your timed session.', (
    <div className="mt-8 rounded-[28px] border border-slate-700 bg-slate-900/80 p-10 text-center" aria-live="polite">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-violet-400" />
      <p className="mt-4 text-slate-300">Loading your question set...</p>
    </div>
  ))

  if (error && !test) return page('Unable to load test', 'Your selected test could not be prepared.', (
    <div className="mt-8 rounded-[28px] border border-rose-500/30 bg-slate-900/80 p-8">
      <p role="alert" className="text-rose-200">{error}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={() => void loadTest()} className="rounded-full bg-violet-500 px-5 py-3 font-semibold text-white">Retry</button>
        <Link to="/mock-tests" className="rounded-full border border-slate-600 px-5 py-3 text-slate-200">Change test settings</Link>
      </div>
    </div>
  ))

  if (result) return page('Test results', `${result.percentage}% · ${result.verdict} · Attempt #${result.attemptId}`, (
    <div className="mt-8 space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ['Score', `${result.score} / ${result.total}`],
          ['Correct', String(result.correctCount)],
          ['Incorrect', String(result.incorrectCount)],
          ['Unanswered', String(result.unansweredCount)],
          ['Time taken', formatTime(result.timeTakenSeconds)],
        ].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5"><div className="text-sm text-slate-400">{label}</div><div className="mt-2 text-2xl font-black text-white">{value}</div></div>)}
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-6">
          <h2 className="text-xl font-bold">Category performance</h2>
          <div className="mt-4 space-y-4">{result.categoryPerformance.map((item) => (
            <div key={item.category}>
              <div className="flex justify-between gap-3 text-sm"><span>{item.category}</span><span>{item.correct}/{item.total} · {item.percentage}%</span></div>
              <div className="mt-2 h-2 rounded-full bg-slate-700"><div className="h-2 rounded-full bg-violet-400" style={{ width: `${item.percentage}%` }} /></div>
            </div>
          ))}</div>
        </div>
        <div className="rounded-[28px] border border-violet-500/20 bg-violet-500/5 p-6">
          <h2 className="text-xl font-bold">Study recommendations</h2>
          <p className="mt-2 text-xs text-slate-400">{result.performanceAnalysis.source}: {result.performanceAnalysis.note}</p>
          <p className="mt-3 text-sm text-violet-200">Performance analysis: {result.performanceAnalysis.classification}</p>
          <p className="mt-4 text-sm text-slate-200">{result.nextBestAction}</p>
          {result.weakTopics.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{result.weakTopics.map((topic) => <span key={topic} className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs text-rose-200">Review: {topic}</span>)}</div>}
          <div className="mt-4 space-y-3">{result.recommendations.map((rec) => <div key={rec.topic} className="rounded-xl border border-slate-700 bg-slate-950/60 p-3"><div className="font-semibold text-violet-200">{rec.topic}</div><p className="mt-1 text-sm text-slate-300">{rec.action}</p></div>)}</div>
          <Link to="/mock-test-take" state={{ config: { category: result.weakTopics.length ? result.review.find((question) => result.weakTopics.includes(question.topic))?.category ?? 'Mixed' : 'Mixed', difficulty: 'Mixed', count: Math.min(10, result.review.length), durationMinutes: 15, adaptive: true } }} className="mt-5 inline-flex rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 font-semibold text-slate-950">Recommended next test</Link>
        </div>
      </section>
      <section className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-6">
        <h2 className="text-xl font-bold">Answer review</h2>
        <div className="mt-4 space-y-4">{result.review.map((question, questionIndex) => (
          <article key={question.id} className="rounded-2xl border border-slate-700 bg-slate-950/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400"><span>Question {questionIndex + 1} · {question.category} · {question.topic}</span><span className={question.isCorrect ? 'text-emerald-300' : 'text-rose-300'}>{question.isCorrect ? 'Correct' : question.userAnswer ? 'Incorrect' : 'Unanswered'}</span></div>
            <h3 className="mt-3 font-semibold text-white">{question.prompt}</h3>
            <p className="mt-2 text-sm text-slate-300">Your answer: {question.userAnswer ?? 'Not answered'} · Correct answer: <span className="text-emerald-200">{question.correctAnswer}</span></p>
            <p className="mt-2 text-sm leading-6 text-slate-400">{question.explanation}</p>
          </article>
        ))}</div>
      </section>
      <Link to="/mock-tests" className="inline-flex rounded-full border border-slate-600 px-5 py-3 text-slate-200">Back to Mock Tests</Link>
    </div>
  ))

  const questions = test?.questions ?? []
  const current = questions[index]
  if (!test || !current) return page('Test unavailable', 'This test did not return any questions.', <Link to="/mock-tests" className="mt-6 inline-flex text-violet-300">Back to Mock Tests</Link>)
  const answeredCount = Object.keys(answers).length
  const progress = Math.round(((index + 1) / questions.length) * 100)

  return page(`Question ${index + 1} of ${questions.length}`, `${test.category} · ${test.difficulty} · ${answeredCount} answered`, (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-5 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-sm text-violet-200">{current.category} · {current.topic} · {current.difficulty}</span>
          <span role="timer" aria-live="off" className={`rounded-full border px-4 py-2 font-mono text-lg font-bold ${remaining < 60 ? 'border-rose-500/40 text-rose-200' : 'border-slate-600 text-white'}`}>{formatTime(remaining)}</span>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all" style={{ width: `${progress}%` }} /></div>
        <div className="mt-2 text-xs text-slate-400">Question {index + 1} of {questions.length} · {progress}% progress · {current.marks} mark</div>
        <h2 className="mt-7 text-xl font-semibold leading-8 text-white md:text-2xl">{current.prompt}</h2>
        <div className="mt-6 space-y-3">{current.options.map((option, optionIndex) => {
          const selected = answers[current.id] === option
          return <label key={option} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${selected ? 'border-violet-400 bg-violet-500/10' : 'border-slate-700 bg-slate-950/50 hover:border-slate-500'}`}>
            <input type="radio" name={`question-${current.id}`} value={option} checked={selected} onChange={() => setAnswers((old) => ({ ...old, [current.id]: option }))} className="accent-violet-500" />
            <span className="text-sm text-slate-200"><span className="mr-2 text-slate-500">{String.fromCharCode(65 + optionIndex)}.</span>{option}</span>
          </label>
        })}</div>
        <button type="button" onClick={() => setMarked((old) => old.includes(current.id) ? old.filter((id) => id !== current.id) : [...old, current.id])} className={`mt-5 rounded-full border px-4 py-2 text-sm ${marked.includes(current.id) ? 'border-amber-400 text-amber-200' : 'border-slate-600 text-slate-300'}`}>
          {marked.includes(current.id) ? '★ Marked for review' : '☆ Mark for review'}
        </button>
        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error} <button type="button" onClick={() => void submitTest(true)} className="ml-2 underline">Retry submission</button></p>}
        <div className="mt-7 flex flex-wrap justify-between gap-3">
          <button type="button" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0} className="rounded-full border border-slate-600 px-5 py-3 text-slate-200 disabled:opacity-40">Previous</button>
          <div className="flex flex-wrap gap-3">
            {index < questions.length - 1 && <button type="button" onClick={() => setIndex((value) => Math.min(questions.length - 1, value + 1))} className="rounded-full bg-violet-500 px-5 py-3 font-semibold text-white">Next</button>}
            <button type="button" disabled={submitting} onClick={() => void submitTest()} className="rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60">{submitting ? 'Submitting...' : 'Submit Test'}</button>
          </div>
        </div>
      </section>
      <aside className="h-fit rounded-[28px] border border-slate-700 bg-slate-900/80 p-5">
        <h2 className="font-bold text-white">Question navigator</h2>
        <div className="mt-4 grid grid-cols-5 gap-2">{questions.map((question, questionIndex) => (
          <button key={question.id} type="button" aria-label={`Question ${questionIndex + 1}${marked.includes(question.id) ? ', marked for review' : ''}${answers[question.id] ? ', answered' : ', unanswered'}`} onClick={() => setIndex(questionIndex)} className={`aspect-square rounded-xl border text-sm font-semibold ${questionIndex === index ? 'border-violet-300 bg-violet-500 text-white' : marked.includes(question.id) ? 'border-amber-400 bg-amber-500/10 text-amber-200' : answers[question.id] ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200' : 'border-slate-700 bg-slate-950 text-slate-400'}`}>{questionIndex + 1}</button>
        ))}</div>
        <div className="mt-5 space-y-2 text-xs text-slate-400"><div>{answeredCount} answered</div><div>{questions.length - answeredCount} unanswered</div><div>{marked.length} marked for review</div></div>
        {test.adaptive && <p className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 text-xs text-violet-200">Adaptive set includes questions from your previously identified weak topics.</p>}
      </aside>
    </div>
  ))
}
