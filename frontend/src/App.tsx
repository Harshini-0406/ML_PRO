import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { BrowserRouter, Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import MockTestRunner from './MockTestRunner'
import RevisionToolPage from './RevisionTools'
import { apiFetch } from './api'
import type { ChangeEvent, FormEvent } from 'react'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Gauge,
  LayoutDashboard,
  Layers3,
  Medal,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type AnalysisResponse = {
  readiness: number
  predictedScore: number
  successProbability: number
  riskLevel: string
  weakArea: string
  strongArea: string
  nextBestAction: string
  note: string
}

type DashboardResponse = {
  studentName: string
  examTarget: string
  readiness: number | null
  predictedScore: number | null
  successProbability: number | null
  streakDays: number | null
  averageAccuracy: number | null
  weeklyStudyHours: number | null
  weakArea: string
  strongArea: string
  nextBestAction: string
  upcomingPlan: Array<{ title: string; detail: string; time: string }>
  subjectProgress: Array<{ subject: string; progress: number; trend: string }>
  weeklyTrend: number[]
  focusAreas: string[]
  recentAttempts?: Array<{
    id?: number
    score: number
    total: number
    percentage: number
    verdict: string
    weaknesses: string
    createdAt?: string
  }>
  profile?: {
    examTarget: string
    preferredStudyHours: number
    dailyGoal: string
    learningStyle: string
    reminderPreference: string
  }
  topicMastery?: Array<{
    topic: string
    mastery: number
    attempts: number
    accuracy: number
    updatedAt?: string
  }>
}

type MockQuestion = {
  id: string
  category: string
  topic: string
  difficulty: string
  prompt: string
  options: string[]
  correctAnswer?: string
  explanation?: string
  marks: number
}

type MockTestConfig = { category: string; difficulty: string; count: number; durationMinutes: number; adaptive: boolean }

type SessionState = {
  token: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

type MockAttemptSummary = {
  id: number
  category: string
  difficulty: string
  score: number
  total: number
  percentage: number
  correctCount: number
  incorrectCount: number
  unansweredCount: number
  timeTakenSeconds: number
  createdAt: string
}
type TopicPerformance = { topic: string; category: string; correct: number; total: number; percentage: number }
type MockAttemptResult = {
  id: number
  topicPerformance?: TopicPerformance[]
  performanceAnalysis?: { source: string; classification: string; note: string }
}

const loadMockTestHistory = async (token: string, signal?: AbortSignal) => {
  const response = await apiFetch('/api/mock-test/history', {
    signal,
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await response.json() as { attempts?: MockAttemptSummary[]; results?: MockAttemptResult[]; message?: string }
  if (!response.ok) throw new Error(data.message ?? `Test history request failed (${response.status}).`)
  return { attempts: data.attempts ?? [], results: data.results ?? [] }
}

const SESSION_KEY = 'examiq_session'


const defaultAnalysis: AnalysisResponse = {
  readiness: 82,
  predictedScore: 86,
  successProbability: 91,
  riskLevel: 'LOW',
  weakArea: 'Quantitative Aptitude',
  strongArea: 'Logical Reasoning',
  nextBestAction: 'Practice Probability for 30 minutes',
  note: 'Demo analytics data is shown until the backend is reachable.',
}

const defaultDashboard: DashboardResponse = {
  studentName: 'Student',
  examTarget: 'Set your exam target in Profile',
  readiness: null,
  predictedScore: null,
  successProbability: null,
  streakDays: null,
  averageAccuracy: null,
  weeklyStudyHours: null,
  weakArea: 'Take a test to identify focus areas',
  strongArea: 'No topic data yet',
  nextBestAction: 'Complete a practice or mock test to build your learning snapshot.',
  upcomingPlan: [],
  subjectProgress: [],
  weeklyTrend: [],
  focusAreas: [],
}

const defaultProfile = {
  examTarget: 'UPSC CSE 2027',
  preferredStudyHours: 18,
  dailyGoal: 'Quant + reasoning focus',
  learningStyle: 'Goal-oriented',
  reminderPreference: 'Evening',
}

const pipeline = [
  { title: 'Student Activity', icon: Layers3, text: 'Mock tests, study time, revisions, and attempts feed the intelligence engine.' },
  { title: 'Data Processing', icon: BarChart3, text: 'Cleansing, validation, feature engineering, and trend normalization happen in real time.' },
  { title: 'Performance Analytics', icon: TrendingUp, text: 'Accuracy, speed, consistency, and weak-area analysis are converted into actionable signals.' },
  { title: 'Machine Learning', icon: BrainCircuit, text: 'Scoring, success probability, and classification models estimate outcome risk.' },
  { title: 'DSA Engine', icon: Search, text: 'Tries, graphs, and priority queues support smart ranking, search, and recommendations.' },
  { title: 'Exam Intelligence', icon: Gauge, text: 'The system identifies readiness, weak areas, and the likely next best action.' },
  { title: 'Personalized Action', icon: Target, text: 'The student receives focused study steps mapped to preparation priorities.' },
]

const features = [
  'Select Exam',
  'Understand Syllabus',
  'Learn',
  'Practice',
  'Solve PYQs',
  'Revision',
  'Mock Test',
  'Analyze',
  'AI Recommendation',
  'Improve',
  'Reassess',
]

const prepModes = [
  { title: 'Exam Selection', description: 'Choose the right competitive exam and focus on the exact syllabus that matters.', accent: 'from-violet-500 to-purple-500' },
  { title: 'Concept Learning', description: 'Build clarity with structured theory, topicwise notes, and chapter-level practice.', accent: 'from-cyan-500 to-sky-500' },
  { title: 'Mock Simulation', description: 'Take timed tests that mirror the real paper pattern, difficulty, and pressure.', accent: 'from-emerald-500 to-teal-500' },
  { title: 'AI Revision Loop', description: 'Use weak-area analysis and personalized recommendations to improve every cycle.', accent: 'from-amber-500 to-orange-500' },
]

const exams = [
  { name: 'UPSC', subjects: 'Polity • History • GS', difficulty: 'Advanced', duration: '3 hrs', count: 100 },
  { name: 'SSC CGL', subjects: 'Quant • Reasoning • English', difficulty: 'Moderate', duration: '2 hrs', count: 100 },
  { name: 'GATE', subjects: 'Core Engineering • Aptitude', difficulty: 'High', duration: '3 hrs', count: 65 },
  { name: 'CAT', subjects: 'VARC • DILR • QA', difficulty: 'High', duration: '2 hrs', count: 66 },
]

const dashboardLinks = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Exams', path: '/exams', icon: BookOpen },
  { label: 'Learn', path: '/learn', icon: BookOpen },
  { label: 'Practice', path: '/practice', icon: Target },
  { label: 'PYQs', path: '/pyqs', icon: Search },
  { label: 'Mock Tests', path: '/mock-tests', icon: Trophy },
  { label: 'Revision', path: '/revision', icon: Layers3 },
  { label: 'AI Insights', path: '/ai-insights', icon: BrainCircuit },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Study Planner', path: '/study-planner', icon: Gauge },
  { label: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  { label: 'Profile', path: '/profile', icon: Medal },
]

const examCatalog = [
  { slug: 'upsc-cse', name: 'UPSC CSE', category: 'Government', description: 'Civil services preparation with polity, essay, and current affairs mastery.', subjects: ['Polity', 'History', 'GS', 'Essay'], difficulty: 'Advanced', duration: '3h 30m', questions: 200, upcoming: 'Jun 2027', accent: 'from-violet-500 to-purple-500' },
  { slug: 'ssc-cgl', name: 'SSC CGL', category: 'Government', description: 'High-speed quantitative and reasoning preparation for competitive aptitude.', subjects: ['Quant', 'Reasoning', 'English', 'GK'], difficulty: 'Moderate', duration: '2h', questions: 160, upcoming: 'Sep 2027', accent: 'from-cyan-500 to-sky-500' },
  { slug: 'gate', name: 'GATE', category: 'Engineering', description: 'Concept-first engineering exam strategy with strong technical depth.', subjects: ['DSA', 'DBMS', 'Algorithms', 'Core'], difficulty: 'High', duration: '3h', questions: 65, upcoming: 'Feb 2028', accent: 'from-emerald-500 to-teal-500' },
  { slug: 'cat', name: 'CAT', category: 'Management', description: 'Data interpretation and verbal reasoning for top-tier management exams.', subjects: ['VARC', 'DILR', 'QA'], difficulty: 'High', duration: '2h', questions: 66, upcoming: 'Nov 2027', accent: 'from-amber-500 to-orange-500' },
  { slug: 'neet', name: 'NEET', category: 'Medical', description: 'Biology and chemistry strategy with time-efficient recall blocks.', subjects: ['Biology', 'Chemistry', 'Physics'], difficulty: 'High', duration: '3h 20m', questions: 200, upcoming: 'May 2028', accent: 'from-rose-500 to-pink-500' },
  { slug: 'banking', name: 'Banking', category: 'Government', description: 'Speed and accuracy roadmap for IBPS, SBI, and RBI aspirants.', subjects: ['Quant', 'Reasoning', 'English', 'GK'], difficulty: 'Moderate', duration: '1h', questions: 120, upcoming: 'Aug 2027', accent: 'from-indigo-500 to-blue-500' },
]

const learningPathTopics = ['Arrays', 'Linked Lists', 'Stacks', 'Queues', 'Trees', 'Graphs', 'Dynamic Programming']

const learningSubjects = [
  { name: 'Quantitative Aptitude', topics: ['Percentages', 'Profit & Loss', 'Time & Work', 'Probability', 'Permutation & Combination'] },
  { name: 'Logical Reasoning', topics: ['Coding-Decoding', 'Series', 'Syllogism', 'Blood Relations', 'Data Sufficiency'] },
  { name: 'Verbal Ability', topics: ['Reading Comprehension', 'Sentence Improvement', 'Cloze Test', 'Vocabulary', 'Grammar'] },
  { name: 'Data Interpretation', topics: ['Tables', 'Bar Graphs', 'Line Graphs', 'Caselets', 'Pie Charts'] },
  { name: 'General Awareness', topics: ['Economy', 'Science', 'History', 'Geography', 'Polity'] },
  { name: 'Current Affairs', topics: ['National', 'International', 'Economy', 'Sports', 'Government Schemes'] },
]

const pyqBank = [
  { question: 'A sum of money becomes 1.5 times itself in 4 years at simple interest. What is the rate of interest?', options: ['8%', '10%', '12%', '12.5%'], answer: '12.5%', explanation: 'For simple interest, SI = P × R × T / 100. The interest is 0.5P, so 0.5P = P × R × 4 / 100 and R = 12.5%.', year: 'Sample', exam: 'Practice set', subject: 'Quantitative Aptitude', topic: 'Simple Interest', difficulty: 'Beginner' },
  { question: 'If 15 workers complete a project in 18 days, how many additional whole workers are needed to finish in 12 days?', options: ['5', '7', '8', '10'], answer: '8', explanation: 'Total work = 15 × 18 = 270 worker-days. At 12 days, 270 ÷ 12 = 22.5, so at least 23 whole workers are required: 23 − 15 = 8 additional workers.', year: 'Sample', exam: 'Practice set', subject: 'Quantitative Aptitude', topic: 'Time and Work', difficulty: 'Intermediate' },
  { question: 'Choose the word closest in meaning to “tenacious”.', options: ['Weak', 'Flexible', 'Persistent', 'Careless'], answer: 'Persistent', explanation: 'Tenacious means persistent or determined despite difficulties.', year: 'Sample', exam: 'Practice set', subject: 'Verbal Ability and English', topic: 'Vocabulary', difficulty: 'Beginner' },
]

const mockExamModes = [
  { name: 'Full Length Mock', duration: '120 min', pattern: 'Sectional + overall scoring', level: 'Advanced' },
  { name: 'Sectional Mock', duration: '45 min', pattern: 'Quant / Reasoning / GA', level: 'Moderate' },
  { name: 'Previous Year Mock', duration: '90 min', pattern: 'Real exam style', level: 'High' },
  { name: 'Weak Area Mock', duration: '30 min', pattern: 'Targeted error recovery', level: 'Adaptive' },
]

const questionCategoryNames = [
  'Quantitative Aptitude',
  'Logical Reasoning',
  'Verbal Ability and English',
  'Data Structures and Algorithms',
  'Programming and Coding',
  'Computer Science Fundamentals',
  'General Knowledge and Current Affairs',
  'Placement Preparation',
]

const revisionCards = [
  { title: 'Formula Book', detail: 'Learn essential formulas with explanations and worked examples across 14 aptitude topics.', badge: '28 worked formulas', path: '/revision/formulas' },
  { title: 'Flashcards', detail: 'Practice active recall across aptitude, reasoning, English, core computing, and general knowledge.', badge: '27 study cards', path: '/revision/flashcards' },
  { title: 'Mistake Book', detail: 'Review incorrect answers saved from your mock tests and practice sessions.', badge: 'From your attempts', path: '/revision/mistakes' },
  { title: 'Shortcuts & Tricks', detail: 'Build speed with practical calculation, reasoning, coding, and exam strategies.', badge: '10 worked strategies', path: '/revision/shortcuts' },
]

const getStoredSession = (): SessionState | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as SessionState) : null
  } catch {
    return null
  }
}

const setStoredSession = (session: SessionState) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

const clearStoredSession = () => {
  localStorage.removeItem(SESSION_KEY)
}

function PageLayout({ title, subtitle, actions, children }: { title: string; subtitle: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white md:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-[28px] border border-slate-700 bg-slate-900/80 p-4 shadow-2xl shadow-slate-950/30 md:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 font-black text-slate-950">E</div>
                <div>
                  <div className="text-xl font-black tracking-wide">ExamIQ</div>
                </div>
              </div>

              <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                {dashboardLinks.map(({ label, path, icon: Icon }) => (
                  <Link key={path} to={path} className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/60 px-3 py-2 transition hover:border-violet-400 hover:text-white">
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-violet-300">Exam Intelligence</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">{title}</h1>
              </div>
              {actions}
            </div>
          </div>
        </header>

        <div className="text-sm text-slate-300">{subtitle}</div>
        {children}
      </div>
    </div>
  )
}

function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    exam: 'UPSC CSE',
    level: 'Advanced',
    hours: '4.5',
    targetScore: '90',
    strongSubjects: ['Reasoning', 'Data Interpretation'],
    weakSubjects: ['Quantitative Aptitude', 'Probability'],
    examDate: 'Jun 2027',
  })

  const steps = [
    { label: 'Target exam', options: ['UPSC CSE', 'SSC CGL', 'GATE', 'CAT', 'NEET', 'Banking'] },
    { label: 'Preparation stage', options: ['Foundation', 'Intermediate', 'Advanced', 'Targeted revision'] },
    { label: 'Daily study time', options: ['2 hours', '3 hours', '4.5 hours', '6+ hours'] },
    { label: 'Target score', options: ['75', '80', '90', '95'] },
    { label: 'Strong subjects', options: ['Reasoning', 'Data Interpretation', 'Verbal', 'Current Affairs'] },
    { label: 'Weak subjects', options: ['Quantitative Aptitude', 'Probability', 'Polity', 'Time & Work'] },
    { label: 'Exam date', options: ['Jun 2027', 'Sep 2027', 'Feb 2028', 'Nov 2027'] },
  ]

  const currentStep = steps[step]

  const updateField = (value: string) => {
    if (step === 0) setForm((prev) => ({ ...prev, exam: value }))
    if (step === 1) setForm((prev) => ({ ...prev, level: value }))
    if (step === 2) setForm((prev) => ({ ...prev, hours: value }))
    if (step === 3) setForm((prev) => ({ ...prev, targetScore: value }))
    if (step === 4) {
      const alreadySelected = form.strongSubjects.includes(value)
      setForm((prev) => ({
        ...prev,
        strongSubjects: alreadySelected ? prev.strongSubjects.filter((item) => item !== value) : [...prev.strongSubjects, value],
      }))
      return
    }
    if (step === 5) {
      const alreadySelected = form.weakSubjects.includes(value)
      setForm((prev) => ({
        ...prev,
        weakSubjects: alreadySelected ? prev.weakSubjects.filter((item) => item !== value) : [...prev.weakSubjects, value],
      }))
      return
    }
    if (step === 6) setForm((prev) => ({ ...prev, examDate: value }))
  }

  const isLastStep = step === steps.length - 1
  const continueSetup = async () => {
    if (!isLastStep) {
      setStep((prev) => Math.min(prev + 1, steps.length - 1))
      return
    }
    const session = getStoredSession()
    if (!session) {
      navigate('/login', { replace: true })
      return
    }
    setSaving(true)
    setError(null)
    try {
      const response = await apiFetch('/api/student/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({
          examTarget: form.exam,
          preferredStudyHours: Math.min(80, Math.round((Number.parseFloat(form.hours) || 1) * 7)),
          dailyGoal: `Focus: ${form.weakSubjects.join(', ') || 'mixed practice'}; target score: ${form.targetScore}/100`,
          learningStyle: 'Goal-oriented',
          reminderPreference: 'Evening',
        }),
      })
      const data = await response.json() as { message?: string }
      if (!response.ok) throw new Error(data.message ?? 'Could not save your preparation profile.')
      navigate('/dashboard', { replace: true })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save your preparation profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageLayout
      title="Build your exam intelligence profile"
      subtitle="Customize your preparation strategy, target score, and weekly routine to shape your AI-driven study plan."
      actions={
        <Link to="/dashboard" className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-5 py-3 font-semibold text-slate-950">
          Continue to dashboard
        </Link>
      }
    >
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-5 md:p-7">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Step {step + 1} of {steps.length}</p>
              <h2 className="mt-2 text-2xl font-black text-white">{currentStep.label}</h2>
            </div>
            <div className="rounded-full border border-slate-600 bg-slate-950/80 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
              {form.level}
            </div>
          </div>

          <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {currentStep.options.map((option) => {
              const selected =
                step === 0 ? form.exam === option :
                step === 1 ? form.level === option :
                step === 2 ? form.hours === option :
                step === 3 ? form.targetScore === option :
                step === 4 ? form.strongSubjects.includes(option) :
                step === 5 ? form.weakSubjects.includes(option) :
                form.examDate === option

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateField(option)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${selected ? 'border-violet-400 bg-violet-500/10 text-white shadow-lg shadow-violet-500/10' : 'border-slate-700 bg-slate-950/60 text-slate-200 hover:border-slate-500'}`}
                >
                  {option}
                </button>
              )
            })}
          </div>

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
              disabled={step === 0}
              className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <button
              type="button"
              onClick={() => void continueSetup()}
              disabled={saving}
              className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950"
            >
              {saving ? 'Saving…' : isLastStep ? 'Finish setup' : 'Continue'}
            </button>
          </div>
          {error && <p role="alert" className="mt-4 text-sm text-rose-200">{error}</p>}
        </div>

        <div className="rounded-[30px] border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-slate-900 to-cyan-500/10 p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-violet-300">Profile summary</p>
          <h2 className="mt-4 text-2xl font-black text-white">Your Exam Intelligence Profile</h2>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
              <div className="text-sm text-slate-400">Target exam</div>
              <div className="mt-1 text-xl font-bold text-white">{form.exam}</div>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
              <div className="text-sm text-slate-400">Preparation level</div>
              <div className="mt-1 text-xl font-bold text-white">{form.level}</div>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
              <div className="text-sm text-slate-400">Recommended daily hours</div>
              <div className="mt-1 text-xl font-bold text-white">{form.hours} hours</div>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
              <div className="text-sm text-slate-400">Target score</div>
              <div className="mt-1 text-xl font-bold text-white">{form.targetScore} / 100</div>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
              <div className="text-sm text-slate-400">Readiness score</div>
              <div className="mt-1 text-xl font-bold text-white">Available after your first test</div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

function ExamsPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [difficulty, setDifficulty] = useState('All')

  const filteredExams = useMemo(() => {
    return examCatalog.filter((exam) => {
      const matchesCategory = category === 'All' || exam.category === category
      const matchesDifficulty = difficulty === 'All' || exam.difficulty === difficulty
      const matchesSearch = exam.name.toLowerCase().includes(search.toLowerCase()) || exam.subjects.some((subject) => subject.toLowerCase().includes(search.toLowerCase()))
      return matchesCategory && matchesDifficulty && matchesSearch
    })
  }, [category, difficulty, search])

  return (
    <PageLayout
      title="Exam Explorer"
      subtitle="Discover the right exam strategy, preparation pattern, and testing rhythm for your target competition."
      actions={
        <div className="flex flex-wrap gap-3">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search exams or subjects" className="rounded-full border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-400" />
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-full border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-violet-400">
            <option value="All">All categories</option>
            <option value="Government">Government</option>
            <option value="Engineering">Engineering</option>
            <option value="Management">Management</option>
            <option value="Medical">Medical</option>
          </select>
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="rounded-full border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-violet-400">
            <option value="All">All levels</option>
            <option value="Advanced">Advanced</option>
            <option value="Moderate">Moderate</option>
            <option value="High">High</option>
          </select>
        </div>
      }
    >
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredExams.length === 0 ? (
          <div className="col-span-full rounded-[28px] border border-slate-700 bg-slate-900/80 p-8 text-center text-slate-300">
            No exams match your search. Try another keyword or category.
          </div>
        ) : filteredExams.map((exam) => (
          <div key={exam.name} className="overflow-hidden rounded-[28px] border border-slate-700 bg-slate-900/80">
            <div className={`h-2 bg-gradient-to-r ${exam.accent}`} />
            <div className="p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-slate-600 bg-slate-950/70 px-3 py-1 text-xs font-medium text-slate-300">{exam.category}</span>
                <span className="text-xs text-slate-400">{exam.difficulty}</span>
              </div>

              <h3 className="mt-5 text-2xl font-black text-white">{exam.name}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{exam.description}</p>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-300">
                <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-3">
                  <div className="text-slate-400">Duration</div>
                  <div className="mt-2 font-semibold text-white">{exam.duration}</div>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-3">
                  <div className="text-slate-400">Questions</div>
                  <div className="mt-2 font-semibold text-white">{exam.questions}</div>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Subjects</div>
                <div className="flex flex-wrap gap-2">
                  {exam.subjects.map((subject) => (
                    <span key={subject} className="rounded-full border border-slate-700 bg-slate-950/70 px-2.5 py-1.5 text-xs text-slate-200">{subject}</span>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-sm text-slate-300">
                <span>Upcoming exam</span>
                <span className="font-semibold text-white">{exam.upcoming}</span>
              </div>

              <Link to={`/exams/${exam.slug}`} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-3 font-semibold text-slate-950">
                Start Preparation <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  )
}

function ExamDetailsPage() {
  const { slug = '' } = useParams()
  const [exam, setExam] = useState<(typeof examCatalog)[number] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    apiFetch(`/api/exams/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json() as (typeof examCatalog)[number] & { message?: string }
        if (!response.ok) throw new Error(data.message ?? `Exam request failed (${response.status}).`)
        setExam(data)
        setError(null)
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof Error && loadError.name !== 'AbortError') setError(loadError.message)
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [retryCount, slug])

  if (loading) return <PageLayout title="Loading exam…" subtitle="Retrieving exam information."><p className="mt-6 text-sm text-slate-400">Loading exam details…</p></PageLayout>
  if (error || !exam) {
    return <PageLayout title="Exam information unavailable" subtitle={error ?? 'This exam was not found.'} actions={<Link to="/exams" className="rounded-full border border-slate-600 px-4 py-2 text-slate-200">Back to exams</Link>}>
      {error && <button type="button" onClick={() => setRetryCount((value) => value + 1)} className="mt-6 rounded-full bg-violet-500 px-5 py-3 font-semibold text-white">Retry</button>}
    </PageLayout>
  }

  return <PageLayout title={exam.name} subtitle={exam.description} actions={<Link to="/exams" className="rounded-full border border-slate-600 px-4 py-2 text-slate-200">Back to exams</Link>}>
    <div className="mt-8 grid gap-5 md:grid-cols-2">
      <div className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Exam overview</p>
        <h2 className="mt-3 text-2xl font-bold text-white">Preparation outline</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">This catalog entry is general preparation guidance. Confirm exam dates, eligibility, syllabus, and official pattern with the exam authority.</p>
        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3"><dt className="text-slate-400">Category</dt><dd className="mt-1 text-white">{exam.category}</dd></div>
          <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3"><dt className="text-slate-400">Difficulty</dt><dd className="mt-1 text-white">{exam.difficulty}</dd></div>
          <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3"><dt className="text-slate-400">Typical duration</dt><dd className="mt-1 text-white">{exam.duration}</dd></div>
          <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3"><dt className="text-slate-400">Catalog question count</dt><dd className="mt-1 text-white">{exam.questions}</dd></div>
        </dl>
      </div>
      <div className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-6">
        <h2 className="text-2xl font-bold text-white">Subjects to prepare</h2>
        <div className="mt-5 flex flex-wrap gap-2">{exam.subjects.map((subject) => <span key={subject} className="rounded-full border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">{subject}</span>)}</div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/learn" className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-5 py-3 font-semibold text-slate-950">Browse learning topics</Link>
          <Link to="/practice" className="rounded-full border border-slate-600 px-5 py-3 font-semibold text-slate-200">Start practice</Link>
        </div>
      </div>
    </div>
  </PageLayout>
}

function NotFoundPage() {
  const destination = getStoredSession() ? '/dashboard' : '/'
  return <PageLayout title="Page not found" subtitle="That ExamIQ page does not exist or may have moved." actions={<Link to={destination} className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-5 py-3 font-semibold text-slate-950">{destination === '/' ? 'Go home' : 'Return to dashboard'}</Link>}>
    <p className="mt-6 text-sm text-slate-400">Check the address or use the navigation to continue.</p>
  </PageLayout>
}

function AnalyticsPage() {
  type Attempt = {
    id: number
    category: string
    difficulty: string
    score: number
    total: number
    percentage: number
    correctCount: number
    incorrectCount: number
    unansweredCount: number
    timeTakenSeconds: number
    createdAt: string
  }
  type TopicStat = { topic: string; category: string; correct: number; total: number; percentage: number }
  type SavedResult = { id: number; topicPerformance?: TopicStat[] }
  const navigate = useNavigate()
  const [session] = useState<SessionState | null>(() => getStoredSession())
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [results, setResults] = useState<SavedResult[]>([])
  const [range, setRange] = useState('30 days')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!session) {
      navigate('/login', { replace: true })
      return
    }
    const controller = new AbortController()
    setLoading(true)
    apiFetch('/api/mock-test/history', {
      signal: controller.signal,
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then(async (response) => {
        const data = await response.json() as { attempts?: Attempt[]; results?: SavedResult[]; message?: string }
        if (!response.ok) throw new Error(data.message ?? `Analytics request failed (${response.status}).`)
        setAttempts(data.attempts ?? [])
        setResults(data.results ?? [])
        setError(null)
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof Error && loadError.name !== 'AbortError') setError(loadError.message)
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [navigate, retryCount, session])

  const filteredAttempts = useMemo(() => {
    if (range === 'All time') return attempts
    const days = Number.parseInt(range, 10)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return attempts.filter((attempt) => new Date(attempt.createdAt.replace(' ', 'T') + 'Z') >= cutoff)
  }, [attempts, range])
  const totalAnswered = filteredAttempts.reduce((sum, attempt) => sum + attempt.correctCount + attempt.incorrectCount, 0)
  const totalCorrect = filteredAttempts.reduce((sum, attempt) => sum + attempt.correctCount, 0)
  const averageScore = filteredAttempts.length
    ? Math.round(filteredAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / filteredAttempts.length)
    : null
  const totalTimeMinutes = Math.round(filteredAttempts.reduce((sum, attempt) => sum + attempt.timeTakenSeconds, 0) / 60)
  const trendData = [...filteredAttempts].reverse().map((attempt) => ({
    name: new Date(attempt.createdAt.replace(' ', 'T') + 'Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: attempt.percentage,
    accuracy: attempt.total ? Math.round((attempt.correctCount / attempt.total) * 100) : 0,
  }))
  const categoryMap = new Map<string, number>()
  for (const attempt of filteredAttempts) categoryMap.set(attempt.category, (categoryMap.get(attempt.category) ?? 0) + attempt.total)
  const subjectBreakdown = [...categoryMap].map(([name, value]) => ({ name, value }))
  const visibleIds = new Set(filteredAttempts.map((attempt) => attempt.id))
  const topicStats = new Map<string, { category: string; correct: number; total: number }>()
  for (const result of results.filter((item) => visibleIds.has(item.id))) {
    for (const topic of result.topicPerformance ?? []) {
      const stats = topicStats.get(topic.topic) ?? { category: topic.category, correct: 0, total: 0 }
      stats.correct += topic.correct
      stats.total += topic.total
      topicStats.set(topic.topic, stats)
    }
  }
  const weakTopics = [...topicStats].map(([topic, stats]) => ({
    topic,
    category: stats.category,
    accuracy: stats.total ? Math.round((stats.correct / stats.total) * 100) : 0,
    attempts: stats.total,
  })).sort((left, right) => left.accuracy - right.accuracy)

  return (
    <PageLayout
      title="Analytics Dashboard"
      subtitle="Explore performance from your saved mock-test attempts. Untracked study hours and unsupported predictions are not estimated."
      actions={
        <div className="flex gap-2 text-xs font-medium text-slate-300">
          {['7 days', '30 days', '90 days', 'All time'].map((option) => (
            <button key={option} type="button" aria-pressed={range === option} onClick={() => setRange(option)} className={`rounded-full border px-3 py-2 hover:border-violet-400 hover:text-white ${range === option ? 'border-violet-400 text-white' : 'border-slate-600'}`}>
              {option}
            </button>
          ))}
        </div>
      }
    >
      {error && <div role="alert" className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"><span>Could not load analytics: {error}</span><button type="button" onClick={() => setRetryCount((value) => value + 1)} className="underline">Retry</button></div>}
      {loading && <p className="mt-6 text-sm text-slate-400">Loading saved test analytics…</p>}
      <div className="mt-8 grid gap-5 md:grid-cols-4">
        {[
          { label: 'Tests attempted', value: String(filteredAttempts.length), note: range },
          { label: 'Question accuracy', value: totalAnswered ? `${Math.round((totalCorrect / totalAnswered) * 100)}%` : '—', note: `${totalCorrect}/${totalAnswered} answered correctly` },
          { label: 'Average test score', value: averageScore === null ? '—' : `${averageScore}%`, note: 'Across saved attempts' },
          { label: 'Time in tests', value: totalTimeMinutes ? `${totalTimeMinutes} min` : '—', note: 'Study hours are not tracked' },
        ].map((item) => (
          <div key={item.label} className="rounded-[24px] border border-slate-700 bg-slate-900/80 p-5">
            <div className="text-sm text-slate-400">{item.label}</div>
            <div className="mt-3 text-3xl font-black text-white">{item.value}</div>
            <div className="mt-1 text-xs text-slate-400">{item.note}</div>
          </div>
        ))}
      </div>

      {!loading && !error && filteredAttempts.length === 0 && <div className="mt-8 rounded-[28px] border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center text-slate-300">No saved test attempts in this period. Complete a mock test to see your real performance trends.</div>}
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-5">
          <div className="mb-4 text-xl font-bold text-white">Score and accuracy by attempt</div>
          <div className="h-72">
            {trendData.length ? <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis domain={[0, 100]} stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="score" name="Score %" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#22d3ee" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer> : <div className="flex h-full items-center justify-center text-sm text-slate-500">No test data for this period.</div>}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-5">
          <div className="mb-4 text-xl font-bold text-white">Questions by test category</div>
          <div className="h-72">
            {subjectBreakdown.length ? <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={subjectBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {subjectBreakdown.map((entry, index) => (
                    <Cell key={entry.name} fill={['#8b5cf6', '#22d3ee', '#f59e0b', '#34d399'][index % 4]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer> : <div className="flex h-full items-center justify-center text-sm text-slate-500">Category data appears after your first test.</div>}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-5">
          <div className="mb-4 text-xl font-bold text-white">Lowest-performing topics</div>
          {weakTopics.length ? <div className="space-y-3">{weakTopics.slice(0, 6).map((topic) => (
            <div key={topic.topic} className="flex items-center justify-between gap-4 rounded-xl border border-slate-700 bg-slate-950/60 p-3">
              <div><div className="font-semibold text-white">{topic.topic}</div><div className="text-xs text-slate-400">{topic.category} · {topic.attempts} question{topic.attempts === 1 ? '' : 's'}</div></div>
              <div className="font-bold text-rose-200">{topic.accuracy}%</div>
            </div>
          ))}</div> : <p className="text-sm text-slate-400">Topic-level results will appear after a test.</p>}
        </div>
        <div className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-5">
          <h3 className="mb-4 text-xl font-bold text-white">Recent test attempts</h3>
          {filteredAttempts.length ? <div className="space-y-3">{filteredAttempts.slice(0, 6).map((attempt) => (
            <div key={attempt.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-700 bg-slate-950/60 p-3">
              <div><div className="font-semibold text-white">{attempt.category}</div><div className="text-xs text-slate-400">{new Date(attempt.createdAt.replace(' ', 'T') + 'Z').toLocaleString()} · {attempt.timeTakenSeconds}s</div></div>
              <div className="text-right"><div className="font-bold text-violet-200">{attempt.percentage}%</div><div className="text-xs text-slate-400">{attempt.correctCount}/{attempt.total} correct</div></div>
            </div>
          ))}</div> : <p className="text-sm text-slate-400">No attempts to show.</p>}
        </div>
      </div>
    </PageLayout>
  )
}

function PredictionPage() {
  const navigate = useNavigate()
  const [session] = useState<SessionState | null>(() => getStoredSession())
  const [attempts, setAttempts] = useState<MockAttemptSummary[]>([])
  const [results, setResults] = useState<MockAttemptResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const retryHistory = () => {
    setLoading(true)
    setRetryCount((count) => count + 1)
  }

  useEffect(() => {
    if (!session) {
      navigate('/login', { replace: true })
      return
    }
    const controller = new AbortController()
    loadMockTestHistory(session.token, controller.signal)
      .then((history) => {
        setAttempts(history.attempts)
        setResults(history.results)
        setError(null)
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof Error && loadError.name !== 'AbortError') setError(loadError.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [navigate, retryCount, session])

  const averageScore = attempts.length
    ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length)
    : null
  const bestScore = attempts.length ? Math.max(...attempts.map((attempt) => attempt.percentage)) : null
  const topicSummary = results.flatMap((result) => result.topicPerformance ?? []).reduce<Record<string, { category: string; correct: number; total: number }>>((summary, topic) => {
    const current = summary[topic.topic] ?? { category: topic.category, correct: 0, total: 0 }
    current.correct += topic.correct
    current.total += topic.total
    summary[topic.topic] = current
    return summary
  }, {})
  const weakTopics = Object.entries(topicSummary)
    .map(([topic, performance]) => ({ topic, ...performance, percentage: performance.total ? Math.round(performance.correct / performance.total * 100) : 0 }))
    .filter((topic) => topic.percentage < 70)
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 5)
  const latestAnalysis = results[0]?.performanceAnalysis
  const scoreTrend = [...attempts].reverse().map((attempt, index) => ({
    test: `Test ${index + 1}`,
    score: attempt.percentage,
  }))

  return (
    <PageLayout
      title="Performance & AI Insights"
      subtitle="Insights use your saved mock-test results. Classification identifies its source; recommendations are rule-based when model output is unavailable."
      actions={
        <div className="flex gap-3">
          <button type="button" onClick={retryHistory} disabled={loading} className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200 disabled:opacity-50">
            {loading ? 'Loading…' : 'Retry'}
          </button>
          <Link to="/mock-tests" className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">Take a mock test</Link>
        </div>
      }
    >
      {loading ? (
        <div role="status" className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/70 p-8 text-center text-slate-300">Loading your saved performance…</div>
      ) : error ? (
        <div role="alert" className="mt-8 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-100">
          <p>{error}</p>
          <button type="button" onClick={retryHistory} className="mt-4 rounded-full border border-rose-300/40 px-4 py-2 text-sm">Retry</button>
        </div>
      ) : attempts.length === 0 ? (
        <div className="mt-8 rounded-[28px] border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center">
          <h2 className="text-xl font-bold text-white">Complete a mock test to get personal insights</h2>
          <p className="mt-2 text-sm text-slate-300">Scores, topic strengths, weak areas, and classification are based on your saved attempts—there are no sample predictions here.</p>
          <Link to="/mock-tests" className="mt-5 inline-flex rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-5 py-3 font-semibold text-slate-950">Start a mock test</Link>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Average actual score', value: `${averageScore}%` },
              { label: 'Best actual score', value: `${bestScore}%` },
              { label: 'Saved attempts analyzed', value: `${attempts.length}` },
            ].map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
                <div className="text-sm text-slate-400">{metric.label}</div>
                <div className="mt-2 text-3xl font-black text-white">{metric.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-5">
              <h2 className="text-xl font-bold text-white">Your score trend</h2>
              {scoreTrend.length > 1 ? (
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scoreTrend}>
                      <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                      <XAxis dataKey="test" stroke="#94a3b8" />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" name="Score %" stroke="#8b5cf6" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="mt-4 text-sm text-slate-300">Complete another test to see a score trend.</p>}
            </section>

            <section className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-5">
              <h2 className="text-xl font-bold text-white">Latest performance classification</h2>
              {latestAnalysis ? (
                <>
                  <div className="mt-4 inline-flex rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-sm font-semibold text-violet-200">{latestAnalysis.classification}</div>
                  <p className="mt-4 text-sm leading-6 text-slate-300">{latestAnalysis.note}</p>
                  <p className="mt-3 text-xs text-slate-400">Source: {latestAnalysis.source}</p>
                </>
              ) : <p className="mt-4 text-sm leading-6 text-slate-300">No model classification was saved for the latest test. Review your results for rule-based topic recommendations.</p>}
              <h3 className="mt-6 font-semibold text-white">Topics to review</h3>
              {weakTopics.length ? (
                <ul className="mt-3 space-y-2">
                  {weakTopics.map((topic) => <li key={topic.topic} className="flex justify-between rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm"><span className="text-slate-200">{topic.topic} <span className="text-slate-500">· {topic.category}</span></span><span className="font-semibold text-amber-300">{topic.percentage}%</span></li>)}
                </ul>
              ) : <p className="mt-2 text-sm text-slate-300">No weak topics identified in the saved topic results so far.</p>}
              <Link to="/recommendations" className="mt-5 inline-flex text-sm font-semibold text-violet-300">See practice recommendations <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </section>
          </div>
        </>
      )}
    </PageLayout>
  )
}

function RecommendationsPage() {
  const navigate = useNavigate()
  const [session] = useState<SessionState | null>(() => getStoredSession())
  const [history, setHistory] = useState<{ attempts: MockAttemptSummary[]; results: MockAttemptResult[] }>({ attempts: [], results: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  useEffect(() => {
    if (!session) {
      navigate('/login', { replace: true })
      return
    }
    const controller = new AbortController()
    setLoading(true)
    loadMockTestHistory(session.token, controller.signal)
      .then((data) => { setHistory(data); setError(null) })
      .catch((loadError: unknown) => {
        if (loadError instanceof Error && loadError.name !== 'AbortError') setError(loadError.message)
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [navigate, retryCount, session])
  const topicTotals = new Map<string, { category: string; correct: number; total: number }>()
  for (const result of history.results) {
    for (const topic of result.topicPerformance ?? []) {
      const existing = topicTotals.get(topic.topic) ?? { category: topic.category, correct: 0, total: 0 }
      existing.correct += topic.correct
      existing.total += topic.total
      topicTotals.set(topic.topic, existing)
    }
  }
  const recommendations = [...topicTotals].map(([topic, totals]) => ({
    topic,
    category: totals.category,
    attempts: totals.total,
    accuracy: totals.total ? Math.round((totals.correct / totals.total) * 100) : 0,
  })).sort((left, right) => left.accuracy - right.accuracy).slice(0, 6)

  return (
    <PageLayout
      title="Smart Recommendations"
      subtitle="Rule-based topic recommendations from your saved mock-test results. No unsupported score-improvement claims are made."
      actions={<Link to="/study-planner" className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200">Plan a study session</Link>}
    >
      {loading && <p className="mt-6 text-sm text-slate-400">Analyzing your saved attempts…</p>}
      {error && <div role="alert" className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"><span>{error}</span><button type="button" onClick={() => setRetryCount((count) => count + 1)} className="underline">Retry</button></div>}
      {!loading && !error && recommendations.length === 0 && <div className="mt-8 rounded-[28px] border border-dashed border-slate-700 p-8 text-center text-slate-300">Complete a mock test to receive recommendations based on your actual topic performance. <Link to="/mock-tests" className="ml-1 text-violet-300 underline">Start a test</Link></div>}
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {recommendations.map((item, index) => (
          <article key={item.topic} className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-5">
            <div className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${index === 0 ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : 'border-amber-500/30 bg-amber-500/10 text-amber-200'}`}>
              {index === 0 ? 'Priority' : 'Practice'}
            </div>
            <h3 className="mt-5 text-2xl font-black text-white">{item.topic}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">Your saved answers show {item.accuracy}% accuracy across {item.attempts} question{item.attempts === 1 ? '' : 's'} in {item.category}.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/mock-tests" className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950">Build a focused test</Link>
              <Link to="/revision/mistakes" className="rounded-full border border-slate-600 px-4 py-3 text-sm text-slate-200">Review mistakes</Link>
            </div>
          </article>
        ))}
      </div>
    </PageLayout>
  )
}

function LearningPathPage() {
  return (
    <PageLayout
      title="Learning Path"
      subtitle="A suggested DSA topic sequence. Per-lesson completion is not tracked yet; use your saved test results and Mistake Book to review mastery."
      actions={<Link to="/learn" className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200">Browse learning topics</Link>}
    >
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-6">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-white">DSA topic sequence</div>
            <div className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-violet-200">Suggested order</div>
          </div>

          <div className="mt-8 space-y-5">
            {learningPathTopics.map((topic, index) => (
              <div key={topic} className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-950/70 text-sm font-bold text-slate-300">
                  {index + 1}
                </div>
                <div className="flex-1 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-lg font-semibold text-white">{topic}</span>
                    <Link to="/mock-tests" className="text-sm font-semibold text-violet-300 hover:text-white">Practice</Link>
                  </div>
                </div>
                {index < learningPathTopics.length - 1 && <ArrowRight className="h-5 w-5 text-slate-500" />}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-6">
          <div className="text-xl font-bold text-white">How to continue</div>
          <div className="mt-5 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4">
            <div className="text-sm text-violet-200">Suggested starting point</div>
            <div className="mt-2 text-2xl font-black text-white">Arrays</div>
            <div className="mt-3 text-sm text-slate-300">Start with array traversal and indexing, then move through linked structures, stacks, trees, and graphs.</div>
            <Link to="/mock-tests" className="mt-4 inline-flex rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-white">Choose a DSA test</Link>
          </div>
          <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
            <div className="text-sm text-slate-300">To review actual performance, use Analytics or your saved Mistake Book after completing tests.</div>
            <Link to="/analytics" className="mt-3 inline-flex text-sm font-semibold text-violet-300">Open Analytics <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

function LeaderboardPage() {
  return (
    <PageLayout
      title="Leaderboard"
      subtitle="ExamIQ does not publish shared student rankings yet. No peer names or scores are fabricated."
    >
      <div className="mt-8 rounded-[28px] border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center">
        <Trophy className="mx-auto h-10 w-10 text-violet-300" />
        <h2 className="mt-4 text-xl font-bold text-white">Community rankings are not enabled</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-300">A privacy-aware leaderboard requires an explicit sharing/opt-in setting. Until that exists, your results remain private to your account.</p>
        <Link to="/analytics" className="mt-5 inline-flex rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-5 py-3 font-semibold text-slate-950">View my analytics</Link>
      </div>
    </PageLayout>
  )
}

function AchievementsPage() {
  const navigate = useNavigate()
  const [session] = useState<SessionState | null>(() => getStoredSession())
  const [attempts, setAttempts] = useState<MockAttemptSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  useEffect(() => {
    if (!session) {
      navigate('/login', { replace: true })
      return
    }
    const controller = new AbortController()
    setLoading(true)
    loadMockTestHistory(session.token, controller.signal)
      .then((data) => { setAttempts(data.attempts); setError(null) })
      .catch((loadError: unknown) => {
        if (loadError instanceof Error && loadError.name !== 'AbortError') setError(loadError.message)
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [navigate, retryCount, session])
  const totalQuestions = attempts.reduce((sum, attempt) => sum + attempt.total, 0)
  const achievements = [
    { title: 'First Mock Test', unlocked: attempts.length >= 1, detail: attempts.length ? `Completed ${attempts.length} saved mock test${attempts.length === 1 ? '' : 's'}.` : 'Complete and save a mock test to unlock this milestone.' },
    { title: '100 Questions', unlocked: totalQuestions >= 100, detail: `${totalQuestions} questions attempted across saved mock tests.` },
    { title: '90% Test Score', unlocked: attempts.some((attempt) => attempt.percentage >= 90), detail: attempts.length ? `Best saved test score: ${Math.max(...attempts.map((attempt) => attempt.percentage))}%.` : 'A saved test score of 90% or higher unlocks this milestone.' },
  ]
  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length

  return (
    <PageLayout
      title="Achievements"
      subtitle="Milestones are calculated from your actual saved mock-test attempts."
      actions={<div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200">{unlockedCount} of {achievements.length} unlocked</div>}
    >
      {loading && <p className="mt-6 text-sm text-slate-400">Loading your saved achievements…</p>}
      {error && <div role="alert" className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"><span>{error}</span><button type="button" onClick={() => setRetryCount((count) => count + 1)} className="underline">Retry</button></div>}
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {achievements.map((achievement) => (
          <div key={achievement.title} className={`rounded-[28px] border p-5 ${achievement.unlocked ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-slate-700 bg-slate-900/80'}`}>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950/80 text-2xl">
                {achievement.unlocked ? '🏆' : '🔒'}
              </div>
              {achievement.unlocked ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : <ShieldCheck className="h-5 w-5 text-slate-400" />}
            </div>
            <h3 className="mt-5 text-xl font-black text-white">{achievement.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">{achievement.detail}</p>
          </div>
        ))}
      </div>
    </PageLayout>
  )
}

function NotificationsPage() {
  const navigate = useNavigate()
  const [session] = useState<SessionState | null>(() => getStoredSession())
  const [attempts, setAttempts] = useState<MockAttemptSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const notificationKey = `examiq_notifications_read_${session?.user.id ?? 'guest'}`
  const [readIds, setReadIds] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem(notificationKey) ?? '[]') as number[] } catch { return [] }
  })
  useEffect(() => { localStorage.setItem(notificationKey, JSON.stringify(readIds)) }, [notificationKey, readIds])
  useEffect(() => {
    if (!session) {
      navigate('/login', { replace: true })
      return
    }
    const controller = new AbortController()
    setLoading(true)
    loadMockTestHistory(session.token, controller.signal)
      .then((data) => { setAttempts(data.attempts); setError(null) })
      .catch((loadError: unknown) => {
        if (loadError instanceof Error && loadError.name !== 'AbortError') setError(loadError.message)
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [navigate, retryCount, session])
  const unreadCount = attempts.filter((attempt) => !readIds.includes(attempt.id)).length

  return (
    <PageLayout
      title="Notifications"
      subtitle="Recent notifications are generated from your actual saved mock-test attempts."
      actions={<button type="button" disabled={unreadCount === 0} onClick={() => setReadIds((current) => [...new Set([...current, ...attempts.map((attempt) => attempt.id)])])} className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-50">Mark all read ({unreadCount})</button>}
    >
      {loading && <p className="mt-6 text-sm text-slate-400">Loading notifications…</p>}
      {error && <div role="alert" className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"><span>{error}</span><button type="button" onClick={() => setRetryCount((count) => count + 1)} className="underline">Retry</button></div>}
      {!loading && !error && attempts.length === 0 && <div className="mt-8 rounded-[28px] border border-dashed border-slate-700 p-8 text-center text-slate-300">No notifications yet. Your saved test results will appear here after your first mock test.</div>}
      <div className="mt-8 space-y-4">
        {attempts.map((attempt) => (
          <div key={attempt.id} className={`rounded-[24px] border p-5 ${readIds.includes(attempt.id) ? 'border-slate-700 bg-slate-900/80' : 'border-violet-500/40 bg-violet-500/5'}`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-lg font-bold text-white">{attempt.category} test completed · {attempt.percentage}%</div>
                <div className="mt-2 text-sm text-slate-300">{attempt.correctCount} correct, {attempt.incorrectCount} incorrect, {attempt.unansweredCount} unanswered · {attempt.timeTakenSeconds}s</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-400">{new Date(attempt.createdAt.replace(' ', 'T') + 'Z').toLocaleString()}</div>
                {!readIds.includes(attempt.id) && <button type="button" onClick={() => setReadIds((current) => [...current, attempt.id])} className="rounded-full border border-violet-400/40 px-3 py-2 text-xs text-violet-200">Mark read</button>}
                <Link to="/analytics" className="text-sm text-violet-300">View analytics</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  )
}

function LearnPage() {
  return (
    <PageLayout
      title="Learn"
      subtitle="Build conceptual clarity through subject-first learning, topic breakdowns, and short revision loops."
      actions={<Link to="/practice" className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-5 py-3 font-semibold text-slate-950">Start practice</Link>}
    >
      <div className="mt-8 grid gap-5 xl:grid-cols-2">
        {learningSubjects.map((subject) => (
          <div key={subject.name} className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">{subject.name}</h3>
              <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-violet-200">Core</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {subject.topics.map((topic) => (
                <span key={topic} className="rounded-full border border-slate-700 bg-slate-950/70 px-2.5 py-1.5 text-xs text-slate-200">{topic}</span>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
              <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                <span>Topic progress</span>
                <span>72%</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: '72%' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  )
}

function PYQsPage() {
  const [search, setSearch] = useState('')
  const [examFilter, setExamFilter] = useState('All')
  const [subjectFilter, setSubjectFilter] = useState('All')
  const [session] = useState<SessionState | null>(() => getStoredSession())
  const bookmarkKey = `examiq_pyq_bookmarks_${session?.user.id ?? 'guest'}`
  const responseKey = `examiq_pyq_responses_${session?.user.id ?? 'guest'}`
  const [bookmarks, setBookmarks] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem(bookmarkKey) ?? '[]') as number[] } catch { return [] }
  })
  const [responses, setResponses] = useState<Record<number, { answer: string; checked: boolean }>>(() => {
    try { return JSON.parse(localStorage.getItem(responseKey) ?? '{}') as Record<number, { answer: string; checked: boolean }> } catch { return {} }
  })
  useEffect(() => { localStorage.setItem(bookmarkKey, JSON.stringify(bookmarks)) }, [bookmarkKey, bookmarks])
  useEffect(() => { localStorage.setItem(responseKey, JSON.stringify(responses)) }, [responseKey, responses])
  const examsAvailable = [...new Set(pyqBank.map((item) => item.exam))]
  const subjectsAvailable = [...new Set(pyqBank.map((item) => item.subject))]
  const filteredQuestions = pyqBank.map((item, index) => ({ item, index })).filter(({ item }) => (
    (examFilter === 'All' || item.exam === examFilter)
    && (subjectFilter === 'All' || item.subject === subjectFilter)
    && `${item.question} ${item.topic} ${item.subject}`.toLowerCase().includes(search.toLowerCase())
  ))

  return (
    <PageLayout
      title="Previous Year Questions"
      subtitle="The current small bank contains clearly labelled sample practice questions, not verified official previous-year papers."
      actions={
        <div className="flex flex-wrap gap-2">
          <input aria-label="Search questions" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search question or topic" className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white" />
          <select aria-label="Filter by exam" value={examFilter} onChange={(event) => setExamFilter(event.target.value)} className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white">
            <option>All</option>{examsAvailable.map((exam) => <option key={exam}>{exam}</option>)}
          </select>
          <select aria-label="Filter by subject" value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)} className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white">
            <option>All</option>{subjectsAvailable.map((subject) => <option key={subject}>{subject}</option>)}
          </select>
        </div>
      }
    >
      <div className="mt-5 text-sm text-slate-400">{filteredQuestions.length} sample question{filteredQuestions.length === 1 ? '' : 's'} · {Object.values(responses).filter((answer) => answer.checked).length} answered</div>
      {filteredQuestions.length === 0 ? <div className="mt-8 rounded-[28px] border border-dashed border-slate-700 p-8 text-center text-slate-300">No sample questions match those filters.</div> : null}
      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        {filteredQuestions.map(({ item, index }) => {
          const response = responses[index]
          const checked = Boolean(response?.checked)
          return <div key={`${item.exam}-${item.year}-${index}`} className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-5">
            <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
              <span>{item.exam} · {item.year}</span>
              <button type="button" aria-pressed={bookmarks.includes(index)} onClick={() => setBookmarks((current) => current.includes(index) ? current.filter((saved) => saved !== index) : [...current, index])} className={`rounded-full border px-3 py-1 normal-case tracking-normal ${bookmarks.includes(index) ? 'border-amber-400 text-amber-200' : 'border-slate-600 text-slate-300'}`}>
                {bookmarks.includes(index) ? '★ Saved' : '☆ Save'}
              </button>
            </div>
            <div className="text-lg font-bold text-white">{item.question}</div>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              {item.options.map((option) => {
                const selected = response?.answer === option
                const isCorrect = checked && option === item.answer
                const isWrongSelection = checked && selected && !isCorrect
                return <button key={option} type="button" disabled={checked} onClick={() => setResponses((current) => ({ ...current, [index]: { answer: option, checked: false } }))} className={`block w-full rounded-xl border px-3 py-2 text-left disabled:cursor-default ${isCorrect ? 'border-emerald-400 bg-emerald-500/10 text-emerald-100' : isWrongSelection ? 'border-rose-400 bg-rose-500/10 text-rose-100' : selected ? 'border-violet-400 bg-violet-500/10 text-white' : 'border-slate-700 bg-slate-950/70 hover:border-violet-400'}`}>{option}</button>
              })}
            </div>
            {!checked ? <button type="button" disabled={!response?.answer} onClick={() => setResponses((current) => ({ ...current, [index]: { answer: current[index]!.answer, checked: true } }))} className="mt-4 rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Check answer</button> : <>
              <div className={`mt-4 rounded-2xl border p-3 text-sm ${response?.answer === item.answer ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100' : 'border-rose-500/20 bg-rose-500/10 text-rose-100'}`}>
                {response?.answer === item.answer ? 'Correct.' : `Not quite. Correct answer: ${item.answer}`}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{item.explanation}</p>
              <button type="button" onClick={() => setResponses((current) => { const next = { ...current }; delete next[index]; return next })} className="mt-3 rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200">Try again</button>
            </>}
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
              <span className="rounded-full border border-slate-700 px-2 py-1">{item.subject}</span>
              <span className="rounded-full border border-slate-700 px-2 py-1">{item.topic}</span>
              <span className="rounded-full border border-slate-700 px-2 py-1">{item.difficulty}</span>
            </div>
          </div>
        })}
      </div>
    </PageLayout>
  )
}

function MockTestsPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<MockTestConfig>({
    category: 'Mixed',
    difficulty: 'Mixed',
    count: 10,
    durationMinutes: 15,
    adaptive: false,
  })
  const [history, setHistory] = useState<Array<{
    id: number; category: string; difficulty: string; score: number; total: number;
    percentage: number; createdAt: string
  }>>([])
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    const session = getStoredSession()
    if (!session) {
      navigate('/login', { replace: true })
      return
    }
    apiFetch(`/api/mock-test/history`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load test history.')
        return response.json() as Promise<{ attempts: typeof history }>
      })
      .then((data) => {
        setHistory(data.attempts)
        setHistoryError(null)
      })
      .catch((error: unknown) => {
        setHistoryError(error instanceof Error ? error.message : 'Unable to load test history.')
      })
      .finally(() => setHistoryLoading(false))
  }, [navigate])

  const handleStartTest = (durationMinutes = config.durationMinutes) => {
    navigate('/mock-test-take', { state: { config: { ...config, durationMinutes } } })
  }

  return (
    <PageLayout
      title="Mock Tests"
      subtitle="Take sectionals, full-length mocks, and weak-area tests built around real competitive exam logic."
      actions={<Link to="/practice" className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-5 py-3 font-semibold text-slate-950">Launch practice</Link>}
    >
      <section className="mt-8 rounded-[28px] border border-slate-700 bg-slate-900/80 p-5 md:p-7">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Build your test</p>
          <h2 className="mt-2 text-xl font-bold text-white">Choose a category, level, and question count</h2>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm text-slate-300">Category
            <select value={config.category} onChange={(event) => setConfig((current) => ({ ...current, category: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white">
              <option>Mixed</option>
              {questionCategoryNames.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label className="text-sm text-slate-300">Difficulty
            <select value={config.difficulty} onChange={(event) => setConfig((current) => ({ ...current, difficulty: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white">
              <option>Mixed</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option>
            </select>
          </label>
          <label className="text-sm text-slate-300">Number of questions
            <input type="number" min={1} max={50} value={config.count} onChange={(event) => setConfig((current) => ({ ...current, count: Math.max(1, Math.min(50, Number(event.target.value) || 1)) }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white" />
          </label>
          <label className="text-sm text-slate-300">Time limit (minutes)
            <input type="number" min={1} max={180} value={config.durationMinutes} onChange={(event) => setConfig((current) => ({ ...current, durationMinutes: Math.max(1, Math.min(180, Number(event.target.value) || 1)) }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white" />
          </label>
          <label className="flex items-center gap-3 self-end rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-200">
            <input type="checkbox" checked={config.adaptive} onChange={(event) => setConfig((current) => ({ ...current, adaptive: event.target.checked }))} className="accent-violet-500" />
            Focus on my weak topics
          </label>
        </div>
        <button type="button" onClick={() => handleStartTest()} className="mt-5 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-6 py-3 font-semibold text-slate-950">
          Start Test
        </button>
      </section>

      <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        {mockExamModes.map((mode) => (
          <div key={mode.name} className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-violet-300">{mode.level}</div>
            <h3 className="mt-4 text-2xl font-black text-white">{mode.name}</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <div>Duration: {mode.duration}</div>
              <div>Pattern: {mode.pattern}</div>
            </div>
            <button
              type="button"
              onClick={() => handleStartTest(Number.parseInt(mode.duration, 10))}
              className="mt-6 w-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:opacity-90 transition-opacity cursor-pointer"
            >
              Start Test
            </button>
          </div>
        ))}
      </div>
      <section className="mt-8 rounded-[28px] border border-slate-700 bg-slate-900/80 p-5 md:p-7">
        <h2 className="text-xl font-bold text-white">Previous test history</h2>
        {historyLoading ? <p className="mt-4 text-sm text-slate-400">Loading your saved attempts...</p> : null}
        {historyError ? <p role="alert" className="mt-4 text-sm text-rose-300">{historyError}</p> : null}
        {!historyLoading && !historyError && history.length === 0 ? <p className="mt-4 text-sm text-slate-400">Your completed tests will appear here.</p> : null}
        {history.length > 0 && <div className="mt-4 space-y-3">{history.map((attempt) => (
          <div key={attempt.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
            <div><div className="font-semibold text-white">{attempt.category} · {attempt.difficulty}</div><div className="mt-1 text-xs text-slate-400">{new Date(attempt.createdAt).toLocaleString()}</div></div>
            <div className="text-sm text-slate-200">{attempt.score}/{attempt.total} · {attempt.percentage}%</div>
          </div>
        ))}</div>}
      </section>
    </PageLayout>
  )
}

function RevisionCenterPage() {
  return (
    <PageLayout
      title="Revision Center"
      subtitle="Build confidence with solved formulas, active-recall flashcards, your real attempt mistakes, and practical shortcuts."
    >
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {revisionCards.map((card) => (
          <Link key={card.title} to={card.path} className="group flex min-h-56 flex-col rounded-[28px] border border-slate-700 bg-slate-900/80 p-5 transition hover:-translate-y-1 hover:border-violet-400 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-300">{card.badge}</div>
            <h2 className="mt-4 text-2xl font-black text-white group-hover:text-violet-200">{card.title}</h2>
            <p className="mt-3 flex-1 text-sm leading-6 text-slate-300">{card.detail}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-300">Open learning tool <ArrowRight size={16} /></span>
          </Link>
        ))}
      </div>
    </PageLayout>
  )
}

function StudyPlannerPage() {
  type PlanItem = {
    id: number
    day: string
    title: string
    detail: string
    durationMinutes: number
    completed: boolean
  }
  type PlannerForm = { day: string; title: string; subject: string; topic: string; durationMinutes: number }
  const makeForm = (): PlannerForm => ({
    day: new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10),
    title: '',
    subject: questionCategoryNames[0]!,
    topic: '',
    durationMinutes: 30,
  })
  const navigate = useNavigate()
  const [session] = useState<SessionState | null>(() => getStoredSession())
  const [items, setItems] = useState<PlanItem[]>([])
  const [form, setForm] = useState<PlannerForm>(makeForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [filter, setFilter] = useState<'upcoming' | 'completed' | 'all'>('upcoming')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!session) {
      navigate('/login', { replace: true })
      return
    }
    const controller = new AbortController()
    setLoading(true)
    apiFetch('/api/student/study-plan', {
      signal: controller.signal,
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then(async (response) => {
        const data = await response.json() as { items?: PlanItem[]; message?: string }
        if (!response.ok) throw new Error(data.message ?? 'Could not load your study plan.')
        setItems(data.items ?? [])
        setError(null)
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof Error && loadError.name !== 'AbortError') setError(loadError.message)
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [navigate, retryCount, session])

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session) {
      navigate('/login', { replace: true })
      return
    }
    setSaving(true)
    setError(null)
    setNotice(null)
    const payload = {
      day: form.day,
      title: form.title.trim(),
      detail: `${form.subject} · ${form.topic.trim()}`,
      durationMinutes: form.durationMinutes,
      completed: editingId === null ? false : items.find((item) => item.id === editingId)?.completed ?? false,
    }
    try {
      const response = await apiFetch(editingId === null ? '/api/student/study-plan' : `/api/student/study-plan/${editingId}`, {
        method: editingId === null ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify(payload),
      })
      const data = await response.json() as { item?: PlanItem; message?: string }
      if (!response.ok || !data.item) throw new Error(data.message ?? 'Could not save this study task.')
      setItems((current) => editingId === null
        ? [...current, data.item!].sort((left, right) => left.day.localeCompare(right.day) || left.id - right.id)
        : current.map((item) => item.id === editingId ? data.item! : item))
      setNotice(editingId === null ? 'Study task added.' : 'Study task updated.')
      setEditingId(null)
      setForm(makeForm())
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save this study task.')
    } finally {
      setSaving(false)
    }
  }

  const updateItem = async (item: PlanItem, patch: Partial<PlanItem>) => {
    if (!session) {
      navigate('/login', { replace: true })
      return
    }
    const updated = { ...item, ...patch }
    setError(null)
    try {
      const response = await apiFetch(`/api/student/study-plan/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify(updated),
      })
      const data = await response.json() as { item?: PlanItem; message?: string }
      if (!response.ok || !data.item) throw new Error(data.message ?? 'Could not update this study task.')
      setItems((current) => current.map((saved) => saved.id === item.id ? data.item! : saved))
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update this study task.')
    }
  }

  const removeItem = async (item: PlanItem) => {
    if (!session) {
      navigate('/login', { replace: true })
      return
    }
    if (!window.confirm(`Delete “${item.title}” from your study plan?`)) return
    setError(null)
    try {
      const response = await apiFetch(`/api/student/study-plan/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.token}` },
      })
      if (!response.ok) {
        const data = await response.json() as { message?: string }
        throw new Error(data.message ?? 'Could not delete this study task.')
      }
      setItems((current) => current.filter((saved) => saved.id !== item.id))
      if (editingId === item.id) {
        setEditingId(null)
        setForm(makeForm())
      }
      setNotice('Study task deleted.')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete this study task.')
    }
  }

  const startEdit = (item: PlanItem) => {
    const [subject, ...topicParts] = item.detail.split(' · ')
    setEditingId(item.id)
    setForm({
      day: item.day,
      title: item.title,
      subject: questionCategoryNames.includes(subject ?? '') ? subject! : questionCategoryNames[0]!,
      topic: questionCategoryNames.includes(subject ?? '') ? topicParts.join(' · ') : item.detail,
      durationMinutes: item.durationMinutes,
    })
    setNotice(null)
  }
  const visibleItems = items.filter((item) => filter === 'all' || (filter === 'completed' ? item.completed : !item.completed))
  const plannedMinutes = visibleItems.reduce((total, item) => total + item.durationMinutes, 0)

  return (
    <PageLayout
      title="Study Planner"
      subtitle="Create and manage your own study sessions. Tasks are saved to your account and remain available after refresh."
      actions={<div className="rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-200">{items.length} saved tasks</div>}
    >
      <div className="mt-8 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <form onSubmit={handleSave} className="h-fit rounded-[28px] border border-slate-700 bg-slate-900/80 p-5 md:p-7">
          <h2 className="text-xl font-bold text-white">{editingId === null ? 'Add a study task' : 'Edit study task'}</h2>
          <div className="mt-5 space-y-4">
            <label className="block text-sm text-slate-300">Task title
              <input required maxLength={120} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white" placeholder="e.g. Revise percentages" />
            </label>
            <label className="block text-sm text-slate-300">Date
              <input required type="date" value={form.day} onChange={(event) => setForm((current) => ({ ...current, day: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white" />
            </label>
            <label className="block text-sm text-slate-300">Subject
              <select value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white">
                {questionCategoryNames.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label className="block text-sm text-slate-300">Topic or activity
              <input required maxLength={500} value={form.topic} onChange={(event) => setForm((current) => ({ ...current, topic: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white" placeholder="e.g. 20-question practice set" />
            </label>
            <label className="block text-sm text-slate-300">Duration (minutes)
              <input required type="number" min={1} max={600} value={form.durationMinutes} onChange={(event) => setForm((current) => ({ ...current, durationMinutes: Number(event.target.value) }))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white" />
            </label>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="submit" disabled={saving || loading} className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50">{saving ? 'Saving…' : editingId === null ? 'Add task' : 'Save changes'}</button>
            {editingId !== null && <button type="button" onClick={() => { setEditingId(null); setForm(makeForm()) }} className="rounded-full border border-slate-600 px-5 py-3 text-slate-200">Cancel edit</button>}
          </div>
        </form>

        <section className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-5 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white">Your study plan</h2>
              <p className="mt-1 text-sm text-slate-400">{plannedMinutes} minutes in this view</p>
            </div>
            <div className="flex gap-2" aria-label="Filter study tasks">
              {(['upcoming', 'completed', 'all'] as const).map((value) => (
                <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`rounded-full border px-3 py-2 text-xs capitalize ${filter === value ? 'border-violet-400 bg-violet-500/10 text-white' : 'border-slate-700 text-slate-300'}`}>{value}</button>
              ))}
            </div>
          </div>
          {error && <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200"><span>{error}</span><button type="button" onClick={() => setRetryCount((value) => value + 1)} className="underline">Retry</button></div>}
          {notice && <p role="status" className="mt-4 text-sm text-emerald-300">{notice}</p>}
          {loading ? <p className="mt-6 text-sm text-slate-400">Loading saved tasks…</p> : null}
          {!loading && visibleItems.length === 0 && !error && <div className="mt-6 rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">{items.length === 0 ? 'Your plan is empty. Add a task to organize your next study session.' : `No ${filter} tasks right now.`}</div>}
          <div className="mt-5 space-y-3">
            {visibleItems.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`font-semibold ${item.completed ? 'text-slate-400 line-through' : 'text-white'}`}>{item.title}</h3>
                      {item.completed && <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200">Completed</span>}
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
                    <p className="mt-2 text-xs text-slate-400">{item.day} · {item.durationMinutes} min</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void updateItem(item, { completed: !item.completed })} className="rounded-full border border-emerald-500/30 px-3 py-2 text-xs text-emerald-200">{item.completed ? 'Reopen' : 'Complete'}</button>
                    <button type="button" onClick={() => startEdit(item)} className="rounded-full border border-slate-600 px-3 py-2 text-xs text-slate-200">Edit</button>
                    <button type="button" onClick={() => void removeItem(item)} className="rounded-full border border-rose-500/30 px-3 py-2 text-xs text-rose-200">Delete</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </PageLayout>
  )
}

function AiInsightsPage() {
  return <PredictionPage />
}

function LandingPage() {
  const [analysis, setAnalysis] = useState<AnalysisResponse>(defaultAnalysis)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    apiFetch(`/api/ai/analyze`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }
        return response.json() as Promise<AnalysisResponse>
      })
      .then((data) => {
        setAnalysis(data)
        setError(null)
      })
      .catch((err) => {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError('Backend is unavailable right now, so demo data is being displayed.')
        }
      })
      .finally(() => {
        setLoading(false)
      })

    return () => controller.abort()
  }, [])

  const metrics = [
    { label: 'Exam Readiness', value: `${analysis.readiness}%`, detail: 'Strong final-stage momentum' },
    { label: 'Predicted Score', value: `${analysis.predictedScore}/100`, detail: 'Based on recent mock trends' },
    { label: 'Success Probability', value: `${analysis.successProbability}%`, detail: 'Low risk profile' },
  ]

  return (
    <div className="min-h-screen bg-background text-text">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 font-bold text-slate-950 shadow-glow">
            E
          </div>
          <div>
            <div className="text-xl font-bold tracking-wide">ExamIQ</div>
          </div>
        </div>

        <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          <a href="#home" className="transition hover:text-white">Home</a>
          <a href="#how-it-works" className="transition hover:text-white">How It Works</a>
          <a href="#features" className="transition hover:text-white">Features</a>
          <a href="#analytics" className="transition hover:text-white">Analytics</a>
          <a href="#exams" className="transition hover:text-white">Exams</a>
          <a href="#about" className="transition hover:text-white">About</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login" className="rounded-full border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-violet-400 hover:text-white">
            Login
          </Link>
          <Link to="/register" className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-glow transition hover:scale-[1.02]">
            Get Started
          </Link>
        </div>
      </header>

      <main id="home" className="mx-auto max-w-7xl px-6 pb-16 pt-4 lg:px-10">
        <section className="relative overflow-hidden rounded-[32px] border border-slate-700/70 bg-slate-950/40 px-6 py-10 shadow-panel md:px-10 lg:px-12 lg:py-14">
          <div className="absolute inset-0 grid-glow opacity-80" />
          <div className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
                <Sparkles className="h-3.5 w-3.5" />
                AI exam intelligence platform
              </div>

              <h1 className="max-w-xl text-4xl font-black tracking-[-0.06em] text-white md:text-6xl">
                Prepare Smarter.
                <span className="block bg-gradient-to-r from-violet-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                  Practice Better. Perform Better.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base text-slate-300 md:text-lg">
                Learn concepts, practice real exam-style questions, analyze your performance, and build a personalized preparation strategy with AI-powered exam intelligence.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-5 py-3 font-semibold text-slate-950 shadow-glow transition hover:scale-[1.02]">
                  Start Preparing <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/exams" className="rounded-full border border-slate-600 px-5 py-3 font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-white">
                  Explore Exams
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {metrics.map((m) => (
                  <div key={m.label} className="glass-panel rounded-2xl border border-slate-700/80 p-4">
                    <div className="text-sm text-slate-400">{m.label}</div>
                    <div className="mt-2 text-2xl font-bold text-white">{m.value}</div>
                    <div className="mt-1 text-xs text-slate-400">{m.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="glass-panel relative overflow-hidden rounded-[28px] border border-slate-700/80 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">ExamIQ Intelligence</p>
                    <p className="text-xl font-bold text-white">Readiness Overview</p>
                  </div>
                  <div className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                    {analysis.riskLevel}
                  </div>
                </div>

                {error && (
                  <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Readiness Score</span>
                      <span className="text-2xl font-bold text-violet-200">{analysis.readiness}%</span>
                    </div>
                    <div className="mt-3 h-2.5 rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${analysis.readiness}%` }} />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                      <div className="text-sm text-slate-400">Predicted Score</div>
                      <div className="mt-2 flex items-end gap-2">
                        <span className="text-3xl font-bold text-white">{analysis.predictedScore}</span>
                        <span className="pb-1 text-sm text-slate-400">/ 100</span>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                      <div className="text-sm text-slate-400">Success Probability</div>
                      <div className="mt-2 flex items-end gap-2">
                        <span className="text-3xl font-bold text-emerald-300">{analysis.successProbability}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                    <div className="mb-3 flex items-center justify-between text-sm text-slate-300">
                      <span className="font-medium">Next best action</span>
                      <span className="text-emerald-300">{loading ? 'Loading...' : 'Ready'}</span>
                    </div>
                    <p className="text-sm text-slate-300">{analysis.nextBestAction}</p>
                    <p className="mt-2 text-xs text-slate-400">{analysis.note}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                    <div className="mb-3 flex items-center justify-between text-sm text-slate-300">
                      <span>Performance Trend</span>
                      <span className="text-emerald-300">+12.7%</span>
                    </div>
                    <div className="flex h-24 items-end gap-2">
                      {[38, 45, 52, 58, 64, 74, 86].map((height, index) => (
                        <div key={height} className={`w-full rounded-t-xl ${index === 6 ? 'bg-gradient-to-t from-violet-500 to-cyan-400' : 'bg-slate-700'}`} style={{ height: `${height}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 shadow-glow">
                <div className="text-[10px] uppercase tracking-[0.2em] text-rose-200">Weak topic</div>
                <div className="mt-1 font-semibold text-white">Quantitative Aptitude</div>
              </div>
            </div>
          </div>
        </section>

        <section id="journey" className="mt-20">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">Exam journey</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white md:text-5xl">
              Your complete competitive exam preparation loop
            </h2>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-slate-200">
            {['Select Exam', 'Understand Syllabus', 'Learn', 'Practice', 'Solve PYQs', 'Revision', 'Mock Test', 'Analyze', 'AI Recommendation', 'Improve', 'Reassess'].map((step, index, arr) => (
              <div key={step} className="flex items-center gap-3">
                <div className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-2 text-center shadow-lg shadow-slate-950/20">
                  {step}
                </div>
                {index < arr.length - 1 && <ArrowRight className="h-4 w-4 text-violet-300" />}
              </div>
            ))}
          </div>
        </section>

        <section id="problem" className="mt-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">The gap</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white md:text-5xl">
              Most candidates study randomly. ExamIQ helps them prepare strategically.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              'Unclear syllabus coverage and chapter prioritization.',
              'No real signal on improvement across mocks and PYQs.',
              'No next-step plan after every attempt and revision cycle.',
            ].map((item, index) => (
              <div key={item} className="glass-panel rounded-3xl border border-slate-700/80 p-6 text-center text-slate-200">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 text-lg font-bold text-violet-200">
                  {index + 1}
                </div>
                <p className="text-lg font-medium">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center text-xl font-semibold text-slate-200 md:text-2xl">
            ExamIQ closes that loop with intelligence, structure, and accountability.
          </div>
        </section>

        <section id="how-it-works" className="mt-20">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Intelligence engine</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white md:text-5xl">Student Intelligence Pipeline</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
            {pipeline.map(({ title, icon: Icon, text }, index) => (
              <div key={title} className="rounded-3xl border border-slate-700 bg-slate-900/60 p-4 text-left">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  {index < pipeline.length - 1 && <ArrowRight className="h-4 w-4 text-slate-500" />}
                </div>
                <div className="text-lg font-bold text-white">{title}</div>
                <p className="mt-2 text-sm text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mt-20">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Platform flow</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white md:text-5xl">Competitive exam preparation, built into one system</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <div key={feature} className="glass-panel rounded-2xl border border-slate-700/80 p-5">
                <div className="mb-3 inline-flex rounded-full bg-violet-500/10 p-2 text-violet-200">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <p className="text-base font-semibold text-white">{feature}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="analytics" className="mt-20">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Analytics preview</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white md:text-5xl">Performance Signals That Matter</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass-panel rounded-3xl border border-slate-700/80 p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="text-lg font-semibold text-white">Performance Trend</div>
                <div className="text-sm text-slate-400">Demo / simulated</div>
              </div>
              <div className="flex h-44 items-end gap-2">
                {[20, 26, 31, 42, 58, 71, 82, 88].map((height, index) => (
                  <div key={height} className={`w-full rounded-t-2xl ${index % 2 === 0 ? 'bg-gradient-to-t from-violet-500 to-cyan-400' : 'bg-slate-700'}`} style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-3xl border border-slate-700/80 p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="text-lg font-semibold text-white">Subject Radar</div>
                <div className="text-sm text-slate-400">7-day view</div>
              </div>
              <div className="flex h-44 items-center justify-center rounded-2xl bg-slate-950/60">
                <div className="grid grid-cols-3 gap-3 text-center text-sm text-slate-300">
                  {['Quant', 'Reasoning', 'English', 'GK', 'Math', 'Verbal'].map((subject) => (
                    <div key={subject} className="rounded-xl border border-slate-700 px-3 py-2">{subject}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-3xl border border-slate-700/80 p-6 lg:col-span-2">
              <div className="mb-5 flex items-center justify-between">
                <div className="text-lg font-semibold text-white">Topic Heatmap</div>
                <div className="text-sm text-slate-400">Focused strength map</div>
              </div>
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                {['#3b82f6', '#7c3aed', '#22d3ee', '#34d399', '#fbbf24', '#fb7185', '#a78bfa', '#38bdf8', '#60a5fa', '#2dd4bf', '#f59e0b', '#f43f5e'].map((color, index) => (
                  <div key={color + index} className="h-16 rounded-2xl" style={{ background: color, opacity: 0.75 + index * 0.04 }} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="exams" className="mt-20">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">Supported exams</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white md:text-5xl">Your Competitive Exam Ecosystem</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {exams.map((exam) => (
              <div key={exam.name} className="glass-panel rounded-3xl border border-slate-700/80 p-5">
                <div className="mb-6 flex items-center justify-between">
                  <div className="text-2xl font-bold text-white">{exam.name}</div>
                  <div className="rounded-full bg-cyan-500/15 px-2 py-1 text-xs font-medium text-cyan-200">{exam.difficulty}</div>
                </div>
                <p className="text-sm text-slate-300">{exam.subjects}</p>
                <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
                  <span>Duration</span>
                  <span>{exam.duration}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-slate-400">
                  <span>Questions</span>
                  <span>{exam.count}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="performance-preview" className="mt-20 rounded-[32px] border border-slate-700 bg-slate-900/70 p-8">
          <div className="mb-8 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Prep modes</p>
            <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">Choose how you want to study</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {prepModes.map((mode) => (
              <div key={mode.title} className="rounded-[24px] border border-slate-700 bg-slate-950/60 p-5">
                <div className={`mb-4 h-2 w-20 rounded-full bg-gradient-to-r ${mode.accent}`} />
                <h3 className="text-xl font-bold text-white">{mode.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{mode.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="about" className="mt-20 pb-10">
          <div className="glass-panel rounded-[32px] border border-slate-700/80 p-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200">
              <ShieldCheck className="h-4 w-4" />
              Built for real preparation analytics
            </div>
            <h2 className="mt-6 text-3xl font-black tracking-[-0.05em] text-white md:text-5xl">
              AI, Data Science, ML, and DSA are integrated into one exam intelligence system.
            </h2>
            <p className="mt-5 mx-auto max-w-3xl text-slate-300">
              ExamIQ gives students more than tests and scores. It measures readiness, highlights weak areas, adapts recommendations, and helps them move from preparation chaos to strategic action.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

function DashboardPage() {
  const navigate = useNavigate()
  const [session, setSession] = useState<SessionState | null>(null)
  const [dashboard, setDashboard] = useState<DashboardResponse>(defaultDashboard)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const currentSession = getStoredSession()
    if (!currentSession) {
      navigate('/login', { replace: true })
      return
    }

    setSession(currentSession)

    const controller = new AbortController()
    apiFetch('/api/student/dashboard', {
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${currentSession.token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Dashboard request failed (${response.status}).`)
        }
        return response.json() as Promise<DashboardResponse>
      })
      .then((data) => {
        setDashboard(data)
        setError(null)
      })
      .catch((err) => {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message)
        }
      })
      .finally(() => {
        setLoading(false)
      })

    return () => controller.abort()
  }, [navigate, retryCount])

  const handleLogout = () => {
    clearStoredSession()
    navigate('/login', { replace: true })
  }

  const quickActions = [
    { title: 'Select Exam', description: 'Choose your target exam and syllabus focus', route: '/exams' },
    { title: 'Syllabus Flow', description: 'Review chapter priorities and learning path', route: '/learn' },
    { title: 'Solve PYQs', description: 'Practice previous-year questions with explanations', route: '/pyqs' },
    { title: 'Mock Test', description: 'Attempt a timed exam-style assessment', route: '/mock-tests' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 font-bold text-slate-950 shadow-glow">
            E
          </div>
          <div>
            <div className="text-xl font-bold tracking-wide">ExamIQ</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm text-slate-300 transition hover:text-white">
            Home
          </Link>
          <Link to="/profile" className="text-sm text-slate-300 transition hover:text-white">
            Profile
          </Link>
          <Link to="/practice" className="text-sm text-slate-300 transition hover:text-white">
            Practice
          </Link>
          <div className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-sm text-slate-200">
            {session?.user.name ?? dashboard.studentName}
          </div>
          <button type="button" onClick={handleLogout} className="rounded-full border border-slate-600 px-3 py-1.5 text-sm text-slate-200 transition hover:border-violet-400 hover:text-white">
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 pb-12 pt-4 lg:px-10">
        {error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <span>Could not load your dashboard: {error}</span>
            <button type="button" onClick={() => setRetryCount((value) => value + 1)} className="rounded-full border border-amber-300/40 px-4 py-2 font-semibold hover:bg-amber-500/10">
              Retry
            </button>
          </div>
        )}

        <section className="grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-5">
            <p className="text-sm text-slate-400">Readiness</p>
            <p className="mt-3 text-3xl font-bold text-white">{dashboard.readiness === null ? '—' : `${dashboard.readiness}%`}</p>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-5">
            <p className="text-sm text-slate-400">Predicted score</p>
            <p className="mt-3 text-3xl font-bold text-white">{dashboard.predictedScore === null ? 'Not available' : dashboard.predictedScore}</p>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-5">
            <p className="text-sm text-slate-400">Success rate</p>
            <p className="mt-3 text-3xl font-bold text-emerald-300">{dashboard.successProbability === null ? 'Not available' : `${dashboard.successProbability}%`}</p>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-5">
            <p className="text-sm text-slate-400">Study streak</p>
            <p className="mt-3 text-3xl font-bold text-violet-200">{dashboard.streakDays === null ? 'Not tracked' : `${dashboard.streakDays}d`}</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[28px] border border-slate-700 bg-slate-900/70 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Student overview</p>
                <h2 className="text-2xl font-bold text-white">{dashboard.examTarget}</h2>
              </div>
              <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                {loading ? 'Updating...' : 'On track'}
              </div>
            </div>

            <div className="mb-6 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
              <div className="mb-3 flex items-center justify-between text-sm text-slate-200">
                <span>Overall progress</span>
                <span>{dashboard.readiness === null ? 'No test data yet' : `${dashboard.readiness}%`}</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${dashboard.readiness ?? 0}%` }} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                <p className="text-sm text-slate-400">Average accuracy</p>
                <p className="mt-2 text-2xl font-bold text-white">{dashboard.averageAccuracy === null ? '—' : `${dashboard.averageAccuracy}%`}</p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                <p className="text-sm text-slate-400">Weekly study</p>
                <p className="mt-2 text-2xl font-bold text-white">{dashboard.weeklyStudyHours === null ? 'Not tracked' : `${dashboard.weeklyStudyHours}h`}</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm uppercase tracking-[0.2em] text-slate-400">This week</p>
              <div className="flex h-32 items-end gap-2">
                {dashboard.weeklyTrend.map((value, index) => (
                  <div key={`${value}-${index}`} className="flex-1 rounded-t-xl bg-gradient-to-t from-violet-500 to-cyan-400" style={{ height: `${value}%` }} />
                ))}
              </div>
              {dashboard.weeklyTrend.length === 0 && <p className="mt-3 text-sm text-slate-400">Complete a test to start your score trend.</p>}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-700 bg-slate-900/70 p-5">
              <p className="text-sm text-slate-400">Next best action</p>
              <h3 className="mt-2 text-xl font-bold text-white">{dashboard.nextBestAction}</h3>
            </div>

            <div className="rounded-[28px] border border-slate-700 bg-slate-900/70 p-5">
              <p className="text-sm text-slate-400">Weak area</p>
              <p className="mt-2 text-xl font-bold text-rose-300">{dashboard.weakArea}</p>
              <p className="mt-2 text-sm text-slate-300">Strong area: <span className="text-emerald-300">{dashboard.strongArea}</span></p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-slate-700 bg-slate-900/70 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Subject progress</h3>
              <span className="text-sm text-slate-400">Updated today</span>
            </div>

            <div className="space-y-4">
              {dashboard.subjectProgress.map((subject) => (
                <div key={subject.subject}>
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                    <span>{subject.subject}</span>
                    <span>{subject.trend}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: `${subject.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-700 bg-slate-900/70 p-5">
            <h3 className="text-xl font-bold text-white">Today’s plan</h3>
            <div className="mt-5 space-y-4">
              {dashboard.upcomingPlan.map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-300">{item.detail}</p>
                    </div>
                    <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-xs text-violet-200">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-700 bg-slate-900/70 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Quick options</h3>
            <span className="text-sm text-slate-400">Choose your next move</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => (
              <Link key={action.title} to={action.route} className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 transition hover:border-violet-400 hover:bg-slate-900">
                <div className="text-lg font-semibold text-white">{action.title}</div>
                <p className="mt-2 text-sm text-slate-300">{action.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-700 bg-slate-900/70 p-5">
          <h3 className="text-xl font-bold text-white">Focus area signals</h3>
          <div className="mt-5 flex flex-wrap gap-3">
            {dashboard.focusAreas.map((area) => (
              <span key={area} className="rounded-full border border-slate-600 bg-slate-950/60 px-3 py-2 text-sm text-slate-200">
                {area}
              </span>
            ))}
          </div>
        </section>

        {dashboard.profile && (
          <section className="rounded-[28px] border border-slate-700 bg-slate-900/70 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Learning profile</h3>
              <span className="text-sm text-slate-400">Personalized</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                <div className="text-sm text-slate-400">Exam target</div>
                <div className="mt-2 font-semibold text-white">{dashboard.profile.examTarget}</div>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                <div className="text-sm text-slate-400">Study hours</div>
                <div className="mt-2 font-semibold text-white">{dashboard.profile.preferredStudyHours}h/week</div>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                <div className="text-sm text-slate-400">Daily goal</div>
                <div className="mt-2 font-semibold text-white">{dashboard.profile.dailyGoal}</div>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                <div className="text-sm text-slate-400">Reminder preference</div>
                <div className="mt-2 font-semibold text-white">{dashboard.profile.reminderPreference}</div>
              </div>
            </div>
          </section>
        )}

        {dashboard.topicMastery && dashboard.topicMastery.length > 0 && (
          <section className="rounded-[28px] border border-slate-700 bg-slate-900/70 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Topic mastery</h3>
              <span className="text-sm text-slate-400">Across attempts</span>
            </div>

            <div className="space-y-4">
              {dashboard.topicMastery.map((topic) => (
                <div key={topic.topic}>
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                    <span>{topic.topic}</span>
                    <span>{topic.mastery}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${topic.mastery}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {dashboard.recentAttempts && dashboard.recentAttempts.length > 0 && (
          <section className="rounded-[28px] border border-slate-700 bg-slate-900/70 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Assessment history</h3>
              <span className="text-sm text-slate-400">Saved history</span>
            </div>

            <div className="space-y-3">
              {dashboard.recentAttempts.map((attempt) => (
                <div key={attempt.id ?? `${attempt.createdAt}-${attempt.percentage}`} className="flex flex-col gap-2 rounded-2xl border border-slate-700 bg-slate-950/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm text-slate-400">
                      {attempt.createdAt ? new Date(attempt.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent practice'}
                    </div>
                    <div className="mt-1 text-lg font-semibold text-white">{attempt.score}/{attempt.total} • {attempt.percentage}%</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-200">
                      {attempt.verdict}
                    </span>
                    {attempt.weaknesses && (
                      <span className="text-sm text-slate-300">Weakness: {attempt.weaknesses}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function PracticePage() {
  const navigate = useNavigate()
  const [session, setSession] = useState<SessionState | null>(null)
  const [questions, setQuestions] = useState<MockQuestion[]>([])
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<null | {
    score: number
    total: number
    percentage: number
    verdict: string
    weakTopics: string[]
    recommendations: Array<{ topic: string; action: string; priority: string }>
    nextBestAction: string
  }>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const currentSession = getStoredSession()
    if (!currentSession) {
      navigate('/login', { replace: true })
      return
    }

    setSession(currentSession)

    const controller = new AbortController()
    apiFetch(`/api/mock-test?mode=practice&count=10`, {
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${currentSession.token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }
        return response.json() as Promise<MockQuestion[]>
      })
      .then((data) => {
        setQuestions(data)
        setError(null)
      })
      .catch((err) => {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError('Unable to load the practice set. Please try again in a moment.')
        }
      })
      .finally(() => {
        setLoading(false)
      })

    return () => controller.abort()
  }, [navigate])

  const currentQuestion = questions[currentIndex]
  const score = questions.reduce((total, question) => total + (selectedAnswers[question.id] === question.correctAnswer ? 1 : 0), 0)
  const completed = Object.keys(selectedAnswers).length

  const handleAnswer = (answer: string) => {
    if (!currentQuestion) return
    setSelectedAnswers((current) => ({
      ...current,
      [currentQuestion.id]: answer,
    }))
  }

  const goToNext = () => {
    setCurrentIndex((index) => Math.min(index + 1, questions.length - 1))
  }

  const goToPrevious = () => {
    setCurrentIndex((index) => Math.max(index - 1, 0))
  }

  const resetPractice = () => {
    setSelectedAnswers({})
    setCurrentIndex(0)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 px-6 py-5 text-lg font-semibold">
          Loading practice session...
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="w-full max-w-xl rounded-[28px] border border-slate-700 bg-slate-900/80 p-8 text-center">
          <h1 className="text-3xl font-black">Practice ready</h1>
          <p className="mt-4 text-slate-300">{error ?? 'No questions available yet.'}</p>
          <Link to="/dashboard" className="mt-6 inline-block rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-5 py-3 font-semibold text-slate-950">
            Return to dashboard
          </Link>
        </div>
      </div>
    )
  }

  const isFinished = questions.length > 0 && completed === questions.length

  const handleSubmitPractice = async () => {
    if (!session || !questions.length) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await apiFetch(`/api/mock-test/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          answers: selectedAnswers,
          questionIds: questions.map((question) => question.id),
          category: 'Mixed',
          difficulty: 'Mixed',
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message ?? 'Unable to submit your results.')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit your results.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Practice mode</p>
            <h1 className="mt-2 text-3xl font-black">Mock assessment</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200 transition hover:border-violet-400 hover:text-white">
              Dashboard
            </Link>
            <div className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-sm text-slate-200">
              {session?.user.name ?? 'Student'}
            </div>
          </div>
        </header>

        <section className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-6 md:p-8">
          {result ? (
            <div className="space-y-6">
              <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6">
                <div className="text-sm uppercase tracking-[0.2em] text-emerald-200">Practice result</div>
                <div className="mt-3 text-4xl font-black text-white">{result.score} / {result.total}</div>
                <div className="mt-2 text-lg font-semibold text-emerald-300">{result.percentage}% • {result.verdict}</div>
                <p className="mt-3 text-slate-200">{result.nextBestAction}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-5">
                  <h3 className="text-lg font-bold text-white">Priority areas</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {result.weakTopics.length ? (
                      result.weakTopics.map((topic) => (
                        <span key={topic} className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-200">
                          {topic}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-300">No weak topics identified — your performance is strong.</span>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-5">
                  <h3 className="text-lg font-bold text-white">Action plan</h3>
                  <ul className="mt-4 space-y-3 text-sm text-slate-200">
                    {result.recommendations.map((item) => (
                      <li key={`${item.topic}-${item.priority}`} className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                        <div className="font-semibold text-white">{item.topic}</div>
                        <div className="mt-1 text-slate-300">{item.action}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => setResult(null)} className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200">
                  Try again
                </button>
                <Link to="/dashboard" className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">
                  Back to dashboard
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Question {currentIndex + 1} of {questions.length}</p>
                  <h2 className="mt-2 text-xl font-bold text-white">{currentQuestion.category} • {currentQuestion.difficulty}</h2>
                </div>
                <div className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-sm font-semibold text-violet-200">
                  Score: {score}/{questions.length}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-700 bg-slate-950/60 p-6">
                <p className="text-xl font-semibold leading-8 text-white">{currentQuestion.prompt}</p>

                <div className="mt-6 space-y-3">
                  {currentQuestion.options.map((option) => {
                    const selected = selectedAnswers[currentQuestion.id] === option
                    const isCorrect = currentQuestion.correctAnswer === option
                    const reveal = isFinished && isCorrect

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleAnswer(option)}
                        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                          selected
                            ? 'border-violet-400 bg-violet-500/10 text-white'
                            : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500'
                        } ${reveal ? 'border-emerald-500 bg-emerald-500/10' : ''}`}
                      >
                        <span>{option}</span>
                        {isFinished && reveal && <span className="text-xs font-semibold text-emerald-300">Correct</span>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                  {error}
                </div>
              )}

              <div className="mt-6 flex flex-wrap justify-between gap-3">
                <button type="button" onClick={goToPrevious} disabled={currentIndex === 0} className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-40">
                  Previous
                </button>

                <div className="flex gap-3">
                  <button type="button" onClick={resetPractice} className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200">
                    Reset
                  </button>
                  {currentIndex < questions.length - 1 ? (
                    <button type="button" onClick={goToNext} className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">
                      Next question
                    </button>
                  ) : (
                    <button type="button" onClick={handleSubmitPractice} disabled={!isFinished || submitting} className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70">
                      {submitting ? 'Submitting...' : 'Submit practice'}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

function ProfilePage() {
  const navigate = useNavigate()
  const [session, setSession] = useState<SessionState | null>(null)
  const [form, setForm] = useState(defaultProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    const currentSession = getStoredSession()
    if (!currentSession) {
      navigate('/login', { replace: true })
      return
    }

    setSession(currentSession)
    setLoading(true)
    setLoadFailed(false)
    setError(null)
    apiFetch(`/api/student/profile`, {
      headers: {
        Authorization: `Bearer ${currentSession.token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to load your profile.')
        }
        return response.json() as Promise<typeof form>
      })
      .then((data) => {
        setLoadFailed(false)
        setForm({
          examTarget: data.examTarget ?? defaultProfile.examTarget,
          preferredStudyHours: Number(data.preferredStudyHours ?? defaultProfile.preferredStudyHours),
          dailyGoal: data.dailyGoal ?? defaultProfile.dailyGoal,
          learningStyle: data.learningStyle ?? defaultProfile.learningStyle,
          reminderPreference: data.reminderPreference ?? defaultProfile.reminderPreference,
        })
      })
      .catch((err) => {
        setLoadFailed(true)
        setError(err instanceof Error ? err.message : 'Unable to load your profile.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [navigate, retryCount])

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: name === 'preferredStudyHours' ? Number(value) : value,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await apiFetch(`/api/student/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(form),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message ?? 'Unable to save your profile.')
      }

      setForm({
        examTarget: data.examTarget,
        preferredStudyHours: Number(data.preferredStudyHours),
        dailyGoal: data.dailyGoal,
        learningStyle: data.learningStyle,
        reminderPreference: data.reminderPreference,
      })
      setSuccess('Your profile has been updated and your dashboard will use these preferences.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save your profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Student settings</p>
            <h1 className="mt-2 text-3xl font-black">Customize your prep profile</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200 transition hover:border-violet-400 hover:text-white">
              Dashboard
            </Link>
            <button type="button" onClick={() => { clearStoredSession(); navigate('/login', { replace: true }); }} className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200 transition hover:border-violet-400 hover:text-white">
              Logout
            </button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-6">
            <h2 className="text-xl font-bold text-white">Your learning snapshot</h2>
            <div className="mt-5 space-y-4 text-sm text-slate-300">
              <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                <div className="text-slate-400">Exam target</div>
                <div className="mt-2 text-lg font-semibold text-white">{form.examTarget}</div>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                <div className="text-slate-400">Weekly study time</div>
                <div className="mt-2 text-lg font-semibold text-white">{form.preferredStudyHours} hours</div>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                <div className="text-slate-400">Daily focus</div>
                <div className="mt-2 text-lg font-semibold text-white">{form.dailyGoal}</div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} aria-busy={loading || saving} className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-6">
            {loading && <p role="status" className="mb-5 text-sm text-slate-400">Loading your saved profile…</p>}
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm text-slate-300">Exam target</span>
                <input name="examTarget" value={form.examTarget} onChange={handleChange} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-violet-400" placeholder="UPSC CSE 2027" required />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Preferred study hours / week</span>
                <input type="number" name="preferredStudyHours" min={1} max={80} value={form.preferredStudyHours} onChange={handleChange} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-violet-400" required />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Learning style</span>
                <select name="learningStyle" value={form.learningStyle} onChange={handleChange} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-violet-400">
                  <option>Goal-oriented</option>
                  <option>Visual</option>
                  <option>Analytical</option>
                  <option>Practice-heavy</option>
                  <option>Revision-first</option>
                </select>
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm text-slate-300">Daily goal</span>
                <textarea name="dailyGoal" value={form.dailyGoal} onChange={handleChange} rows={3} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-violet-400" placeholder="Quant + reasoning focus" required />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm text-slate-300">Reminder preference</span>
                <select name="reminderPreference" value={form.reminderPreference} onChange={handleChange} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-violet-400">
                  <option>Morning</option>
                  <option>Afternoon</option>
                  <option>Evening</option>
                  <option>Night</option>
                </select>
              </label>
            </div>

            {error && (
              <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                <span>{error}</span>
                {loadFailed && <button type="button" onClick={() => setRetryCount((value) => value + 1)} className="underline">Retry loading</button>}
              </div>
            )}

            {success && (
              <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                {success}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="submit" disabled={saving || loading} className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70">
                {saving ? 'Saving...' : 'Save profile'}
              </button>
              <Link to="/dashboard" className="rounded-full border border-slate-600 px-5 py-3 text-sm text-slate-200 transition hover:border-violet-400 hover:text-white">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate()
  const isRegister = mode === 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (getStoredSession()) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const response = await apiFetch(`/api/auth/${isRegister ? 'register' : 'login'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message ?? 'Authentication failed.')
      }

      setStoredSession({
        token: data.token,
        user: data.user,
      })

      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[32px] border border-slate-700 bg-slate-900/80 shadow-2xl lg:grid-cols-2">
        <div className="bg-gradient-to-br from-violet-600/30 via-slate-900 to-cyan-600/20 p-8 lg:p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 font-bold text-slate-950">
              E
            </div>
            <div className="text-2xl font-bold">ExamIQ</div>
          </div>

          <h1 className="mt-10 text-4xl font-black tracking-tight">
            {isRegister ? 'Build your prep profile.' : 'Welcome back.'}
          </h1>
          <p className="mt-4 max-w-md text-slate-300">
            Track readiness, improve weak areas, and move from random preparation to confident strategy.
          </p>

          <div className="mt-10 space-y-4 text-sm text-slate-200">
            <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">Readiness insights from your saved tests</div>
            <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">Focused weekly improvement plan</div>
            <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">AI-powered topic direction</div>
          </div>
        </div>

        <div className="flex items-center justify-center p-8 lg:p-12">
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-violet-300">{isRegister ? 'Create account' : 'Sign in'}</p>
              <h2 className="mt-2 text-3xl font-bold text-white">{isRegister ? 'Get started' : 'Log into your dashboard'}</h2>
            </div>

            {isRegister && (
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Full name</span>
                <input name="name" value={form.name} onChange={handleChange} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-violet-400" placeholder="Aarav Sharma" required />
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Email</span>
              <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-violet-400" placeholder="student@example.com" required />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Password</span>
              <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-violet-400" placeholder="••••••••" required />
            </label>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70">
              {submitting ? 'Please wait...' : isRegister ? 'Create account' : 'Log in'}
            </button>

            <p className="text-center text-sm text-slate-400">
              {isRegister ? 'Already have an account?' : 'Need an account?'}{' '}
              <Link to={isRegister ? '/login' : '/register'} className="font-semibold text-violet-300 hover:text-violet-200">
                {isRegister ? 'Sign in' : 'Create one'}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

function MockTestTakePage() {
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token = getStoredSession()?.token;
        const response = await apiFetch(`/api/mock-test?mode=practice&count=10`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setQuestions(data);
          setLoading(false);
        } else {
          setLoadError(`Could not load questions (HTTP ${response.status}).`);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load mock test:', error);
        setLoadError('The question service could not be reached. Check the backend and retry.');
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers({
      ...answers,
      [questionId]: answer,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const token = getStoredSession()?.token;
      const response = await apiFetch(`/api/mock-test/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          answers,
          questionIds: questions.map((question) => question.id),
          category: 'Mixed',
          difficulty: 'Mixed',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
        setSubmitted(true);
      } else {
        setLoadError('Unable to submit this test. Please retry.');
      }
    } catch (error) {
      console.error('Failed to submit test:', error);
      setLoadError('The test could not be submitted. Check the connection and retry.');
    }
  };

  if (loading) {
    return (
      <PageLayout title="Loading Test..." subtitle="">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
        </div>
      </PageLayout>
    );
  }

  if (submitted && results) {
    return (
      <PageLayout
        title="Test Results"
        subtitle={`Your Score: ${results.percentage}%`}
        actions={<Link to="/mock-tests" className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-5 py-3 font-semibold text-slate-950">Back to Mock Tests</Link>}
      >
        <div className="mt-8 space-y-6">
          <div className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-8">
            <div className="mb-6">
              <div className="text-lg font-semibold text-slate-200 mb-2">Verdict: <span className={`${results.verdict === 'Excellent' ? 'text-emerald-400' : results.verdict === 'Strong' ? 'text-blue-400' : 'text-orange-400'}`}>{results.verdict}</span></div>
              <div className="text-sm text-slate-400">
                Correct Answers: {results.correctCount} / {results.total}
              </div>
            </div>

            {results.recommendations && results.recommendations.length > 0 && (
              <div>
                <h4 className="text-slate-200 font-semibold mb-3">Recommendations:</h4>
                <div className="space-y-3">
                  {results.recommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="rounded-lg border border-slate-600 bg-slate-800/50 p-3">
                      <div className="text-sm font-semibold text-violet-300">{rec.topic}</div>
                      <div className="text-sm text-slate-300 mt-1">{rec.action}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </PageLayout>
    );
  }

  if (questions.length === 0) {
    return (
      <PageLayout title="Unable to Load Test" subtitle={loadError ?? 'No questions were returned for this test.'}>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => window.location.reload()} className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-5 py-3 font-semibold text-slate-950">Retry</button>
          <Link to="/mock-tests" className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-5 py-3 font-semibold text-slate-950">Back to Mock Tests</Link>
        </div>
      </PageLayout>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = Math.round(((currentQuestionIndex + 1) / questions.length) * 100);

  return (
    <PageLayout
      title={`Question ${currentQuestionIndex + 1} of ${questions.length}`}
      subtitle="Answer the following question"
    >
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-8">
          <div className="mb-6">
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-slate-400">{progress}% Complete</div>
          </div>

          <div className="mb-6">
            <div className="text-xs uppercase tracking-[0.2em] text-violet-300 mb-2">{currentQuestion.category}</div>
            <h3 className="text-xl font-semibold text-white">{currentQuestion.prompt}</h3>
          </div>

          {loadError && <div role="alert" className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{loadError}</div>}

          <div className="space-y-3 mb-8">
            {Object.entries(currentQuestion.options || {}).map(([key, value]) => (
              <label key={key} className="flex items-center p-4 rounded-lg border-2 border-slate-700 bg-slate-800/50 cursor-pointer hover:border-violet-500 transition">
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value={key}
                  checked={answers[currentQuestion.id] === key}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  className="mr-3"
                />
                <span className="flex-1 text-slate-200">{key}. {value}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="flex-1 rounded-full border border-violet-500 px-6 py-3 font-semibold text-violet-400 hover:bg-violet-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {currentQuestionIndex === questions.length - 1 ? (
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:opacity-90 transition-opacity"
              >
                Submit Test
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:opacity-90 transition-opacity"
              >
                Next
              </button>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-4">
          <h4 className="text-sm font-semibold text-slate-200 mb-3">Questions Summary</h4>
          <div className="grid grid-cols-4 gap-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`aspect-square rounded-lg font-semibold text-xs transition ${
                  idx === currentQuestionIndex
                    ? 'bg-violet-500 text-white'
                    : answers[q.id]
                      ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-violet-500'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/exams" element={<ExamsPage />} />
        <Route path="/exams/:slug" element={<ExamDetailsPage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/pyqs" element={<PYQsPage />} />
        <Route path="/mock-tests" element={<MockTestsPage />} />
        <Route path="/mock-test-take" element={<MockTestRunner />} />
        <Route path="/mock-test-take-legacy" element={<MockTestTakePage />} />
        <Route path="/revision" element={<RevisionCenterPage />} />
        <Route path="/revision/:section" element={<RevisionToolPage />} />
        <Route path="/ai-insights" element={<AiInsightsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/prediction" element={<PredictionPage />} />
        <Route path="/study-planner" element={<StudyPlannerPage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/learning-path" element={<LearningPathPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
