import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
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
  Zap,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
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
  readiness: number
  predictedScore: number
  successProbability: number
  streakDays: number
  averageAccuracy: number
  weeklyStudyHours: number
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
  difficulty: string
  prompt: string
  options: string[]
  correctAnswer: string
  explanation: string
}

type SessionState = {
  token: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
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
  studentName: 'Aarav Sharma',
  examTarget: 'UPSC CSE 2027',
  readiness: 82,
  predictedScore: 86,
  successProbability: 91,
  streakDays: 12,
  averageAccuracy: 78,
  weeklyStudyHours: 18.5,
  weakArea: 'Quantitative Aptitude',
  strongArea: 'Logical Reasoning',
  nextBestAction: 'Practice Probability and arithmetic drills for 30 minutes today.',
  upcomingPlan: [
    { title: 'Quant revision', detail: 'Probability + arithmetic', time: '30 min' },
    { title: 'Mock test', detail: 'Full reasoning set', time: '45 min' },
    { title: 'Concept recap', detail: 'Polity revision notes', time: '25 min' },
  ],
  subjectProgress: [
    { subject: 'Quant', progress: 78, trend: '+12%' },
    { subject: 'Reasoning', progress: 88, trend: '+16%' },
    { subject: 'English', progress: 73, trend: '+8%' },
    { subject: 'Polity', progress: 81, trend: '+10%' },
  ],
  weeklyTrend: [62, 68, 71, 75, 78, 84, 86],
  focusAreas: ['Probability', 'Arithmetic', 'Data Interpretation', 'Current Affairs'],
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

const leaderboardRows = [
  { rank: 1, name: 'Aarav S.', score: 978, accuracy: '92%', tests: 18, streak: '21d' },
  { rank: 2, name: 'Ishita M.', score: 961, accuracy: '90%', tests: 16, streak: '17d' },
  { rank: 3, name: 'Rohan K.', score: 948, accuracy: '88%', tests: 15, streak: '15d' },
  { rank: 4, name: 'Harshini', score: 934, accuracy: '86%', tests: 14, streak: '12d' },
  { rank: 5, name: 'Nisha P.', score: 921, accuracy: '85%', tests: 13, streak: '11d' },
]

const achievementList = [
  { title: '7 Day Streak', unlocked: true, detail: 'Daily practice streak maintained' },
  { title: 'First Mock Test', unlocked: true, detail: 'Completed your first full-length mock test' },
  { title: '90% Accuracy', unlocked: true, detail: 'Achieved a high-accuracy test readout' },
  { title: 'Speed Master', unlocked: false, detail: 'Solve 25 questions under time pressure' },
  { title: '100 Questions', unlocked: false, detail: 'Reach 100 solved questions this week' },
  { title: 'Consistency Champion', unlocked: false, detail: 'Complete 4 weeks of steady improvement' },
]

const recommendationItems = [
  { priority: 'HIGH', title: 'Practice Probability', reason: 'Low accuracy + high time per question in arithmetic sets.', improvement: '+11% accuracy', action: 'Start 20-question drill' },
  { priority: 'MEDIUM', title: 'Revise DBMS', reason: 'Repeated mistakes on query optimization and normalization.', improvement: '+8% conceptual score', action: 'Review last 3 topics' },
  { priority: 'LOW', title: 'Advanced Reasoning', reason: 'Strong performance trend with room for confidence building.', improvement: '+5% speed', action: 'Take 15 min puzzle set' },
]

const learningPath = [
  { name: 'Arrays', status: 'done' },
  { name: 'Linked Lists', status: 'done' },
  { name: 'Stacks', status: 'current' },
  { name: 'Queues', status: 'locked' },
  { name: 'Trees', status: 'locked' },
  { name: 'Graphs', status: 'locked' },
  { name: 'Dynamic Programming', status: 'locked' },
]

const notificationItems = [
  { title: 'Mock test result is ready', detail: 'Your Full-Length Quant Mock has an updated analysis.', time: '2 hours ago' },
  { title: 'Accuracy improved by 5%', detail: 'Reasoning accuracy jumped from 78% to 83% this week.', time: 'Today' },
  { title: 'Study goal pending', detail: 'Your probability drill is still incomplete for today.', time: '1 day ago' },
  { title: 'New recommendation available', detail: 'A new high-priority topic plan has been generated for you.', time: '2 days ago' },
]

const learningSubjects = [
  { name: 'Quantitative Aptitude', topics: ['Percentages', 'Profit & Loss', 'Time & Work', 'Probability', 'Permutation & Combination'] },
  { name: 'Logical Reasoning', topics: ['Coding-Decoding', 'Series', 'Syllogism', 'Blood Relations', 'Data Sufficiency'] },
  { name: 'Verbal Ability', topics: ['Reading Comprehension', 'Sentence Improvement', 'Cloze Test', 'Vocabulary', 'Grammar'] },
  { name: 'Data Interpretation', topics: ['Tables', 'Bar Graphs', 'Line Graphs', 'Caselets', 'Pie Charts'] },
  { name: 'General Awareness', topics: ['Economy', 'Science', 'History', 'Geography', 'Polity'] },
  { name: 'Current Affairs', topics: ['National', 'International', 'Economy', 'Sports', 'Government Schemes'] },
]

const pyqBank = [
  { question: 'A sum of money becomes 1.5 times itself in 4 years at simple interest. What is the rate of interest?', options: ['8%', '10%', '12%', '15%'], answer: '12%', explanation: 'For simple interest, SI = P × R × T / 100. With 1.5P, the interest is 0.5P. So 0.5P = P × R × 4 / 100 => R = 12.5% approximates to 12% in real exam rounding.', year: '2024', exam: 'SSC CGL', subject: 'Quant', topic: 'Simple Interest', difficulty: 'Medium' },
  { question: 'If 15 workers complete a project in 18 days, how many additional workers are needed to finish in 12 days?', options: ['5', '7', '8', '10'], answer: '8', explanation: 'Total work = 15 × 18 = 270 worker-days. For 12 days, required workers = 270 / 12 = 22.5, so 23 approx. Additional workers = 23 - 15 = 8.', year: '2023', exam: 'RRB', subject: 'Quant', topic: 'Time & Work', difficulty: 'Easy' },
  { question: 'Choose the word closest in meaning to “tenacious”.', options: ['Weak', 'Flexible', 'Persistent', 'Careless'], answer: 'Persistent', explanation: 'Tenacious means persistent or determined despite difficulties.', year: '2022', exam: 'Banking', subject: 'Verbal', topic: 'Vocabulary', difficulty: 'Easy' },
]

const mockExamModes = [
  { name: 'Full Length Mock', duration: '120 min', pattern: 'Sectional + overall scoring', level: 'Advanced' },
  { name: 'Sectional Mock', duration: '45 min', pattern: 'Quant / Reasoning / GA', level: 'Moderate' },
  { name: 'Previous Year Mock', duration: '90 min', pattern: 'Real exam style', level: 'High' },
  { name: 'Weak Area Mock', duration: '30 min', pattern: 'Targeted error recovery', level: 'Adaptive' },
]

const revisionCards = [
  { title: 'Formula Book', detail: 'Quick formulas for arithmetic, probability, ratios, and algebra.', badge: '12 formulas' },
  { title: 'Flashcards', detail: 'Active recall cards built around current-affairs and reasoning patterns.', badge: '48 cards' },
  { title: 'Mistake Book', detail: 'Repeated errors are tracked and suggested for review cycles.', badge: '26 errors' },
  { title: 'Shortcuts & Tricks', detail: 'Speed math tricks and elimination techniques for high-scoring questions.', badge: '9 shortcuts' },
]

const studyPlanDay = [
  { type: 'Quantitative Aptitude', slot: '30 min', task: 'Percentages + Profit & Loss' },
  { type: 'Logical Reasoning', slot: '25 min', task: 'Syllogism practice set' },
  { type: 'Current Affairs', slot: '20 min', task: 'Monthly revision capsule' },
  { type: 'Revision', slot: '15 min', task: 'Formula recall drills' },
  { type: 'Sectional Test', slot: '45 min', task: 'Reasoning mock section' },
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
  const [step, setStep] = useState(0)
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
              onClick={() => {
                if (isLastStep) {
                  setStep(steps.length - 1)
                  return
                }
                setStep((prev) => Math.min(prev + 1, steps.length - 1))
              }}
              className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950"
            >
              {isLastStep ? 'Finish setup' : 'Continue'}
            </button>
          </div>
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
              <div className="text-sm text-slate-400">Initial readiness score</div>
              <div className="mt-1 text-xl font-bold text-white">82%</div>
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

function AnalyticsPage() {
  const trendData = [
    { name: 'Mon', score: 68, accuracy: 76, hours: 2.4 },
    { name: 'Tue', score: 72, accuracy: 78, hours: 2.9 },
    { name: 'Wed', score: 77, accuracy: 80, hours: 3.1 },
    { name: 'Thu', score: 81, accuracy: 83, hours: 3.8 },
    { name: 'Fri', score: 84, accuracy: 86, hours: 4.1 },
    { name: 'Sat', score: 88, accuracy: 88, hours: 4.5 },
    { name: 'Sun', score: 91, accuracy: 90, hours: 4.8 },
  ]

  const subjectBreakdown = [
    { name: 'Quant', value: 32 },
    { name: 'Reasoning', value: 26 },
    { name: 'English', value: 18 },
    { name: 'Polity', value: 24 },
  ]

  return (
    <PageLayout
      title="Analytics Dashboard"
      subtitle="Track your readiness with performance trends, subject strength, time efficiency, and consistency across your prep cycle."
      actions={
        <div className="flex gap-2 text-xs font-medium text-slate-300">
          {['7 days', '30 days', '90 days', 'All time'].map((range) => (
            <button key={range} type="button" className="rounded-full border border-slate-600 px-3 py-2 hover:border-violet-400 hover:text-white">
              {range}
            </button>
          ))}
        </div>
      }
    >
      <div className="mt-8 grid gap-5 md:grid-cols-4">
        {[
          { label: 'Accuracy', value: '89%', note: '+6.2%' },
          { label: 'Avg score', value: '86/100', note: 'Best this month' },
          { label: 'Study hours', value: '24.5h', note: '+3.1h' },
          { label: 'Consistency', value: '82%', note: 'Stable output' },
        ].map((item) => (
          <div key={item.label} className="rounded-[24px] border border-slate-700 bg-slate-900/80 p-5">
            <div className="text-sm text-slate-400">{item.label}</div>
            <div className="mt-3 text-3xl font-black text-white">{item.value}</div>
            <div className="mt-1 text-xs text-emerald-300">{item.note}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-5">
          <div className="mb-4 text-xl font-bold text-white">Performance trend</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="accuracy" stroke="#22d3ee" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-5">
          <div className="mb-4 text-xl font-bold text-white">Subject distribution</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={subjectBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {subjectBreakdown.map((entry, index) => (
                    <Cell key={entry.name} fill={['#8b5cf6', '#22d3ee', '#f59e0b', '#34d399'][index % 4]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-5">
          <div className="mb-4 text-xl font-bold text-white">Study hours vs performance</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Area type="monotone" dataKey="hours" stroke="#34d399" fill="#34d399" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-5">
          <div className="mb-4 text-xl font-bold text-white">Time management</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="hours" radius={[8, 8, 0, 0]} fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

function PredictionPage() {
  const radarData = [
    { subject: 'Accuracy', value: 88 },
    { subject: 'Consistency', value: 82 },
    { subject: 'Study Hours', value: 76 },
    { subject: 'Weak Areas', value: 68 },
    { subject: 'Speed', value: 72 },
    { subject: 'Topic Coverage', value: 91 },
  ]

  const modelCards = [
    { name: 'Random Forest', purpose: 'Feature-rich classification', type: 'Classification', metric: 'F1 Score: 0.91' },
    { name: 'XGBoost', purpose: 'Performance ranking and risk scoring', type: 'Regression', metric: 'RMSE: 3.2' },
    { name: 'Logistic Regression', purpose: 'Probability estimation and readiness bands', type: 'Probability', metric: 'AUC: 0.89' },
  ]

  return (
    <PageLayout
      title="AI Prediction"
      subtitle="Demo / simulated prediction outputs are clearly labeled and ready for a production ML service integration later."
      actions={
        <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">
          Demo Dataset / Simulated Analytics
        </div>
      }
    >
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-violet-300">Prediction output</div>
              <h3 className="mt-2 text-3xl font-black text-white">86 / 100</h3>
            </div>
            <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-200">High Performer</div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
              <div className="text-sm text-slate-400">Success Probability</div>
              <div className="mt-2 text-2xl font-black text-white">91%</div>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
              <div className="text-sm text-slate-400">Risk Level</div>
              <div className="mt-2 text-2xl font-black text-emerald-300">Low</div>
            </div>
          </div>

          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#475569" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                <PolarRadiusAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Radar name="Readiness" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-5">
            <div className="text-xl font-bold text-white">Prediction factors</div>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {['Previous scores', 'Accuracy', 'Study hours', 'Topic coverage', 'Average solving time', 'Mock test performance'].map((factor) => (
                <li key={factor} className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-950/60 px-3 py-2">
                  <span>{factor}</span>
                  <span className="font-semibold text-violet-200">Strong</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-5">
            <div className="text-xl font-bold text-white">Model cards</div>
            <div className="mt-4 space-y-3">
              {modelCards.map((model) => (
                <div key={model.name} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-white">{model.name}</div>
                    <span className="rounded-full border border-slate-600 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300">{model.type}</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-300">{model.purpose}</div>
                  <div className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">{model.metric}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

function RecommendationsPage() {
  return (
    <PageLayout
      title="Smart Recommendations"
      subtitle="Adaptive guidance prioritized by urgency, impact, and expected productivity gain."
      actions={<button type="button" className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200">Generate new plan</button>}
    >
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {recommendationItems.map((item) => (
          <div key={item.title} className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-5">
            <div className="flex items-center justify-between">
              <div className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${item.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-200 border border-rose-500/30' : item.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-200 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/30'}`}>
                {item.priority}
              </div>
              <Zap className="h-5 w-5 text-violet-300" />
            </div>

            <h3 className="mt-5 text-2xl font-black text-white">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">{item.reason}</p>

            <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
              <div className="text-sm text-slate-400">Expected improvement</div>
              <div className="mt-2 text-lg font-bold text-white">{item.improvement}</div>
            </div>

            <button type="button" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-3 font-semibold text-slate-950">
              {item.action}
            </button>
          </div>
        ))}
      </div>
    </PageLayout>
  )
}

function LearningPathPage() {
  return (
    <PageLayout
      title="Learning Path"
      subtitle="DSA-powered recommendations guide your progress across topics, dependencies, and mastery milestones."
      actions={<button type="button" className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200">Resume progress</button>}
    >
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-6">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-white">DSA progression</div>
            <div className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-violet-200">Priority queue</div>
          </div>

          <div className="mt-8 space-y-5">
            {learningPath.map((item, index) => (
              <div key={item.name} className="flex items-center gap-4">
                <div className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm font-bold ${item.status === 'done' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : item.status === 'current' ? 'border-violet-500/30 bg-violet-500/10 text-violet-200' : 'border-slate-700 bg-slate-950/70 text-slate-400'}`}>
                  {index + 1}
                </div>
                <div className="flex-1 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-lg font-semibold text-white">{item.name}</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.status}</span>
                  </div>
                </div>
                {index < learningPath.length - 1 && <ArrowRight className="h-5 w-5 text-slate-500" />}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-6">
          <div className="text-xl font-bold text-white">Current focus</div>
          <div className="mt-5 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4">
            <div className="text-sm text-violet-200">Current topic</div>
            <div className="mt-2 text-2xl font-black text-white">Stacks</div>
            <div className="mt-3 text-sm text-slate-300">Master LIFO operations, balanced parentheses, and queue conversion patterns.</div>
          </div>
          <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
            <div className="text-sm text-slate-400">Progress</div>
            <div className="mt-2 text-3xl font-black text-white">68%</div>
            <div className="mt-3 h-2.5 rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: '68%' }} />
            </div>
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
      subtitle="Compare your performance against peers across weekly and monthly prep streaks."
      actions={
        <div className="flex gap-2">
          {['Global', 'Weekly', 'Monthly', 'Friends'].map((tab) => (
            <button key={tab} type="button" className="rounded-full border border-slate-600 px-3 py-2 text-xs font-medium text-slate-200 hover:border-violet-400">
              {tab}
            </button>
          ))}
        </div>
      }
    >
      <div className="mt-8 overflow-hidden rounded-[28px] border border-slate-700 bg-slate-900/80">
        <table className="min-w-full text-left text-sm text-slate-200">
          <thead className="bg-slate-950/80 text-slate-300">
            <tr>
              <th className="px-5 py-4">Rank</th>
              <th className="px-5 py-4">Student</th>
              <th className="px-5 py-4">Score</th>
              <th className="px-5 py-4">Accuracy</th>
              <th className="px-5 py-4">Tests</th>
              <th className="px-5 py-4">Streak</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardRows.map((row) => (
              <tr key={row.name} className={row.name === 'Harshini' ? 'bg-violet-500/10' : 'border-t border-slate-800'}>
                <td className="px-5 py-4 font-bold text-white">#{row.rank}</td>
                <td className="px-5 py-4 font-semibold text-white">{row.name}</td>
                <td className="px-5 py-4">{row.score}</td>
                <td className="px-5 py-4">{row.accuracy}</td>
                <td className="px-5 py-4">{row.tests}</td>
                <td className="px-5 py-4">{row.streak}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageLayout>
  )
}

function AchievementsPage() {
  return (
    <PageLayout
      title="Achievements"
      subtitle="Track milestones across consistency, speed, accuracy, and streak-based progress."
      actions={<div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200">6 unlocked</div>}
    >
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {achievementList.map((achievement) => (
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
  return (
    <PageLayout
      title="Notifications"
      subtitle="Stay on top of insights, study goals, mock-test feedback, and recommended actions."
      actions={<button type="button" className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200">Mark all read</button>}
    >
      <div className="mt-8 space-y-4">
        {notificationItems.map((item) => (
          <div key={item.title} className="rounded-[24px] border border-slate-700 bg-slate-900/80 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-lg font-bold text-white">{item.title}</div>
                <div className="mt-2 text-sm text-slate-300">{item.detail}</div>
              </div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.time}</div>
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
  return (
    <PageLayout
      title="Previous Year Questions"
      subtitle="Solve the most relevant previous papers with explanations, filters, and targeted revision loops."
      actions={<button type="button" className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200">Filter by exam</button>}
    >
      <div className="mt-8 grid gap-5 xl:grid-cols-3">
        {pyqBank.map((item, index) => (
          <div key={`${item.exam}-${item.year}-${index}`} className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-5">
            <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
              <span>{item.exam}</span>
              <span>{item.year}</span>
            </div>
            <div className="text-lg font-bold text-white">{item.question}</div>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              {item.options.map((option) => (
                <div key={option} className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2">{option}</div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
              Correct answer: {item.answer}
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">{item.explanation}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
              <span className="rounded-full border border-slate-700 px-2 py-1">{item.subject}</span>
              <span className="rounded-full border border-slate-700 px-2 py-1">{item.topic}</span>
              <span className="rounded-full border border-slate-700 px-2 py-1">{item.difficulty}</span>
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  )
}

function MockTestsPage() {
  return (
    <PageLayout
      title="Mock Tests"
      subtitle="Take sectionals, full-length mocks, and weak-area tests built around real competitive exam logic."
      actions={<Link to="/practice" className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-5 py-3 font-semibold text-slate-950">Launch practice</Link>}
    >
      <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        {mockExamModes.map((mode) => (
          <div key={mode.name} className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-violet-300">{mode.level}</div>
            <h3 className="mt-4 text-2xl font-black text-white">{mode.name}</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <div>Duration: {mode.duration}</div>
              <div>Pattern: {mode.pattern}</div>
            </div>
            <button type="button" className="mt-6 w-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-3 font-semibold text-slate-950">
              Start Test
            </button>
          </div>
        ))}
      </div>
    </PageLayout>
  )
}

function RevisionCenterPage() {
  return (
    <PageLayout
      title="Revision Center"
      subtitle="Keep high-yield formulas, fast tricks, and repeated mistakes in one place for last-minute revision."
      actions={<button type="button" className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200">Reset revision queue</button>}
    >
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {revisionCards.map((card) => (
          <div key={card.title} className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-300">{card.badge}</div>
            <h3 className="mt-4 text-2xl font-black text-white">{card.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">{card.detail}</p>
          </div>
        ))}
      </div>
    </PageLayout>
  )
}

function StudyPlannerPage() {
  return (
    <PageLayout
      title="Study Planner"
      subtitle="Map your exam timeline into daily study goals, revision blocks, and sectional test practice."
      actions={<div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">98 days left</div>}
    >
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-5">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Today</h3>
            <span className="text-sm text-slate-400">Daily goal: 2h 10m</span>
          </div>
          <div className="space-y-4">
            {studyPlanDay.map((item) => (
              <div key={item.type} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
                <div>
                  <div className="text-lg font-semibold text-white">{item.type}</div>
                  <div className="text-sm text-slate-300">{item.task}</div>
                </div>
                <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-200">{item.slot}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-5">
            <div className="text-xl font-bold text-white">Weekly target</div>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3">Quant: 4 sessions</div>
              <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3">Reasoning: 3 sessions</div>
              <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3">Current Affairs: 5 capsules</div>
            </div>
          </div>
          <div className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-5">
            <div className="text-xl font-bold text-white">Exam date</div>
            <div className="mt-4 text-3xl font-black text-white">22 Jun 2027</div>
            <div className="mt-3 text-sm text-slate-300">Target exam: UPSC CSE</div>
          </div>
        </div>
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
    const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

    fetch(`${apiBase}/api/ai/analyze`, { signal: controller.signal })
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

        <section id="analytics" className="mt-20 rounded-[32px] border border-slate-700 bg-slate-900/70 p-8">
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

  useEffect(() => {
    const currentSession = getStoredSession()
    if (!currentSession) {
      navigate('/login', { replace: true })
      return
    }

    setSession(currentSession)

    const controller = new AbortController()
    const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

    fetch(`${apiBase}/api/student/dashboard`, {
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${currentSession.token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }
        return response.json() as Promise<DashboardResponse>
      })
      .then((data) => {
        setDashboard(data)
        setError(null)
      })
      .catch((err) => {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError('Could not load the live dashboard, so the default student profile is shown.')
        }
      })
      .finally(() => {
        setLoading(false)
      })

    return () => controller.abort()
  }, [navigate])

  const handleLogout = () => {
    clearStoredSession()
    navigate('/', { replace: true })
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
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {error}
          </div>
        )}

        <section className="grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-5">
            <p className="text-sm text-slate-400">Readiness</p>
            <p className="mt-3 text-3xl font-bold text-white">{dashboard.readiness}%</p>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-5">
            <p className="text-sm text-slate-400">Predicted score</p>
            <p className="mt-3 text-3xl font-bold text-white">{dashboard.predictedScore}</p>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-5">
            <p className="text-sm text-slate-400">Success rate</p>
            <p className="mt-3 text-3xl font-bold text-emerald-300">{dashboard.successProbability}%</p>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-5">
            <p className="text-sm text-slate-400">Study streak</p>
            <p className="mt-3 text-3xl font-bold text-violet-200">{dashboard.streakDays}d</p>
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
                <span>{dashboard.readiness}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${dashboard.readiness}%` }} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                <p className="text-sm text-slate-400">Average accuracy</p>
                <p className="mt-2 text-2xl font-bold text-white">{dashboard.averageAccuracy}%</p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                <p className="text-sm text-slate-400">Weekly study</p>
                <p className="mt-2 text-2xl font-bold text-white">{dashboard.weeklyStudyHours}h</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm uppercase tracking-[0.2em] text-slate-400">This week</p>
              <div className="flex h-32 items-end gap-2">
                {dashboard.weeklyTrend.map((value, index) => (
                  <div key={`${value}-${index}`} className="flex-1 rounded-t-xl bg-gradient-to-t from-violet-500 to-cyan-400" style={{ height: `${value}%` }} />
                ))}
              </div>
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
    const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

    fetch(`${apiBase}/api/mock-test`, {
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
      const response = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:4000'}/api/mock-test/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ answers: selectedAnswers }),
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
  const [form, setForm] = useState({
    examTarget: 'UPSC CSE 2027',
    preferredStudyHours: 18,
    dailyGoal: 'Quant + reasoning focus',
    learningStyle: 'Goal-oriented',
    reminderPreference: 'Evening',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const currentSession = getStoredSession()
    if (!currentSession) {
      navigate('/login', { replace: true })
      return
    }

    setSession(currentSession)

    const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

    fetch(`${apiBase}/api/student/profile`, {
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
        setForm({
          examTarget: data.examTarget ?? form.examTarget,
          preferredStudyHours: Number(data.preferredStudyHours ?? form.preferredStudyHours),
          dailyGoal: data.dailyGoal ?? form.dailyGoal,
          learningStyle: data.learningStyle ?? form.learningStyle,
          reminderPreference: data.reminderPreference ?? form.reminderPreference,
        })
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to load your profile.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [navigate])

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
      const response = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:4000'}/api/student/profile`, {
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
            <button type="button" onClick={() => { clearStoredSession(); navigate('/'); }} className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200 transition hover:border-violet-400 hover:text-white">
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

          <form onSubmit={handleSubmit} className="rounded-[28px] border border-slate-700 bg-slate-900/80 p-6">
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
              <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                {error}
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
      const response = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:4000'}/api/auth/${isRegister ? 'register' : 'login'}`, {
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
            <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">82% readiness score</div>
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
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/pyqs" element={<PYQsPage />} />
        <Route path="/mock-tests" element={<MockTestsPage />} />
        <Route path="/revision" element={<RevisionCenterPage />} />
        <Route path="/ai-insights" element={<AiInsightsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/prediction" element={<PredictionPage />} />
        <Route path="/study-planner" element={<StudyPlannerPage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/learning-path" element={<LearningPathPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
