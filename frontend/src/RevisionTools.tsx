import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, Check, ChevronLeft, ChevronRight, RotateCw, Search, Shuffle, Star, Trash2 } from 'lucide-react'
import { apiFetch } from './api'

type Formula = {
  category: string
  name: string
  formula: string
  explanation: string
  steps: string[]
  topic: string
}

type Flashcard = { topic: string; question: string; answer: string; explanation: string }
type Shortcut = { category: string; title: string; explanation: string; example: string }
type Mistake = {
  id: string
  mistakeKey: string
  attemptId: number
  attemptedAt: string
  category: string
  topic: string
  prompt: string
  options: string[]
  userAnswer: string
  correctAnswer: string
  explanation: string
  reviewed: boolean
}

const formulaRows: Array<[string, string, string, string, string, string]> = [
  ['Percentages', 'Percentage of a quantity', 'Part = whole × rate ÷ 100', 'Multiply the whole by the percentage and divide by 100.', 'Find 18% of 250: 250 × 18 ÷ 100 = 45.', 'Percent increase and decrease'],
  ['Percentages', 'Percentage change', 'Change % = (new − old) ÷ old × 100', 'Compare the change with the original value, not the new value.', 'From 80 to 100: (100 − 80) ÷ 80 × 100 = 25% increase.', 'Successive percentage change'],
  ['Profit and Loss', 'Profit percentage', 'Profit % = (selling price − cost price) ÷ cost price × 100', 'Profit is measured against cost price.', 'CP ₹400, SP ₹460: profit = 60; 60 ÷ 400 × 100 = 15%.', 'Profit and loss'],
  ['Profit and Loss', 'Discounted selling price', 'SP = Marked price × (100 − discount %) ÷ 100', 'A discount is applied to the marked price.', 'MP ₹1,200, discount 15%: SP = 1,200 × 85 ÷ 100 = ₹1,020.', 'Discount and marked price'],
  ['Ratio and Proportion', 'Equivalent ratio share', 'Share = total × part ratio ÷ sum of ratio parts', 'Convert a ratio into total equal units, then scale each share.', 'Split 72 in 5:7: total units 12; first share = 72 × 5 ÷ 12 = 30.', 'Partnership and ratio sharing'],
  ['Ratio and Proportion', 'Proportion rule', 'If a:b = c:d, then a × d = b × c', 'In a proportion, cross-products are equal.', 'x:12 = 5:8 gives 8x = 60, so x = 7.5.', 'Direct proportion'],
  ['Average', 'Arithmetic mean', 'Average = sum of observations ÷ number of observations', 'The mean distributes the total evenly across all observations.', 'For 12, 18, 20: (12 + 18 + 20) ÷ 3 = 50 ÷ 3.', 'Mean and averages'],
  ['Average', 'Combined average', 'Combined mean = (n₁a₁ + n₂a₂) ÷ (n₁ + n₂)', 'Weight each group average by its group size before combining.', '10 students average 70 and 15 average 80: (700 + 1200) ÷ 25 = 76.', 'Weighted average'],
  ['Simple and Compound Interest', 'Simple interest', 'SI = principal × rate × time ÷ 100', 'Interest is calculated on the original principal for every period.', '₹5,000 at 6% for 2 years: 5000 × 6 × 2 ÷ 100 = ₹600.', 'Simple interest'],
  ['Simple and Compound Interest', 'Compound amount', 'A = P(1 + r/100)ⁿ; CI = A − P', 'Each period earns interest on both principal and accumulated interest.', '₹1,000 at 10% for 2 years: A = 1000 × 1.1² = ₹1,210; CI = ₹210.', 'Annual compound interest'],
  ['Time and Work', 'Combined work rate', 'Combined rate = 1/A + 1/B; time = 1 ÷ combined rate', 'Add the fractions of the job completed per unit time.', 'A takes 6 days, B 3: rate = 1/6 + 1/3 = 1/2; together 2 days.', 'Work-rate problems'],
  ['Time and Work', 'Work, rate and time', 'Work = rate × time', 'For a fixed job, more workers or hours increase completed work proportionally.', '4 workers × 6 days = 24 worker-days; 8 workers need 24 ÷ 8 = 3 days.', 'Workers and efficiency'],
  ['Speed, Time and Distance', 'Speed formula', 'Speed = distance ÷ time; distance = speed × time', 'Use consistent units before calculating.', '150 km in 3 h: speed = 150 ÷ 3 = 50 km/h.', 'Average speed'],
  ['Speed, Time and Distance', 'Relative speed', 'Opposite directions: s₁+s₂; same direction: |s₁−s₂|', 'Relative speed is the rate at which the gap between objects changes.', 'Cars at 50 and 40 km/h in opposite directions separate at 90 km/h.', 'Trains and relative motion'],
  ['Problems on Ages', 'Age difference invariant', 'Age difference = older age − younger age (constant)', 'Both people age at the same rate, so their difference does not change.', 'A is 8 years older than B now; after 5 years the difference remains 8.', 'Present and future ages'],
  ['Problems on Ages', 'Age after n years', 'Future age = present age + n; past age = present age − n', 'Shift every person’s age by the same number of years.', 'A is twice B and their ages sum to 36: A=2B; 3B=36, so B=12 and A=24. After 4 years they are 28 and 16.', 'Age equations'],
  ['Number Systems', 'Division algorithm', 'Dividend = divisor × quotient + remainder', 'The remainder must be non-negative and smaller than the divisor.', '29 ÷ 6: 29 = 6 × 4 + 5, so quotient 4, remainder 5.', 'Remainders'],
  ['Number Systems', 'LCM and HCF relation', 'For two positive integers: LCM × HCF = product of the integers', 'This relation helps find one value when the other and both numbers are known.', 'For 12 and 18, HCF 6: LCM = 12 × 18 ÷ 6 = 36.', 'Factors and multiples'],
  ['Algebra', 'Linear equation', 'ax + b = c ⇒ x = (c − b) ÷ a, a ≠ 0', 'Undo addition/subtraction first, then undo multiplication/division.', '3x + 5 = 20: 3x = 15, hence x = 5.', 'Linear equations'],
  ['Algebra', 'Quadratic roots', 'For ax²+bx+c=0: x = (−b ± √(b²−4ac)) ÷ 2a', 'The discriminant b²−4ac determines the nature of the roots.', 'x²−5x+6=0: roots = (5 ± √1) ÷ 2 = 3 or 2.', 'Quadratic equations'],
  ['Probability', 'Classical probability', 'P(E) = favorable outcomes ÷ total equally likely outcomes', 'Count outcomes satisfying the event and divide by all possible outcomes.', 'Even number on a fair die: 3 ÷ 6 = 1/2.', 'Basic probability'],
  ['Probability', 'Complement rule', 'P(not E) = 1 − P(E)', 'Sometimes counting the outcomes where an event does not happen is easier.', 'If rain probability is 0.3, no-rain probability = 1 − 0.3 = 0.7.', 'Complementary events'],
  ['Permutations and Combinations', 'Permutation', 'ⁿPᵣ = n! ÷ (n−r)!', 'Use permutations when the order of selected objects matters.', 'Arrange 2 of 5 people: 5P2 = 5 × 4 = 20.', 'Arrangements'],
  ['Permutations and Combinations', 'Combination', 'ⁿCᵣ = n! ÷ (r!(n−r)!)', 'Use combinations when only the selected group matters, not its order.', 'Choose 2 of 5: 5C2 = (5 × 4) ÷ 2 = 10.', 'Selections'],
  ['Geometry and Mensuration', 'Rectangle area and perimeter', 'Area = length × width; perimeter = 2(length + width)', 'Area measures surface; perimeter measures the boundary length.', 'Length 8 cm, width 5 cm: area 40 cm²; perimeter 26 cm.', 'Plane figures'],
  ['Geometry and Mensuration', 'Circle area and circumference', 'Area = πr²; circumference = 2πr', 'Use the radius, which is half of the diameter.', 'Radius 7 cm, π=22/7: area = 22/7 × 49 = 154 cm².', 'Circles'],
  ['Statistics', 'Range', 'Range = maximum value − minimum value', 'The range measures the spread from the smallest to largest observation.', 'For 4, 9, 12, 20: range = 20 − 4 = 16.', 'Measures of spread'],
  ['Statistics', 'Population variance', 'Variance = Σ(x − mean)² ÷ number of values', 'Square each deviation from the mean, add them, and divide by the population size.', 'For 2, 4: mean 3; variance = ((−1)² + 1²) ÷ 2 = 1.', 'Variance and standard deviation'],
]
const formulas: Formula[] = formulaRows.map(([category, name, formula, explanation, example, topic]) => ({
  category, name, formula, explanation, steps: example.split('; '), topic,
}))
const formulaCategories = [...new Set(formulas.map((formula) => formula.category))]

const flashcards: Flashcard[] = [
  { topic: 'Aptitude', question: 'What is the percentage increase from 40 to 50?', answer: '25%.', explanation: 'Increase = 10; divide by the original 40: 10/40 × 100 = 25%.' },
  { topic: 'Aptitude', question: 'A can complete work in 8 days and B in 8 days. How long together?', answer: '4 days.', explanation: 'Their daily rates add: 1/8 + 1/8 = 1/4 job per day.' },
  { topic: 'Aptitude', question: 'What is the average of 6, 10, and 14?', answer: '10.', explanation: '(6 + 10 + 14) ÷ 3 = 30 ÷ 3 = 10.' },
  { topic: 'Reasoning', question: 'Complete the series: 1, 4, 9, 16, …', answer: '25.', explanation: 'These are consecutive squares: 1², 2², 3², 4²; the next is 5².' },
  { topic: 'Reasoning', question: 'If every poet is a reader, what follows about poets?', answer: 'Every poet belongs to the set of readers.', explanation: 'This is a direct subset relation; it does not imply that every reader is a poet.' },
  { topic: 'Reasoning', question: 'Facing north, turn right, then right again. Which way are you facing?', answer: 'South.', explanation: 'The first right turn faces east; the second faces south.' },
  { topic: 'English', question: 'What does “concise” mean?', answer: 'Brief but clear.', explanation: 'Concise writing expresses the intended meaning in few, well-chosen words.' },
  { topic: 'English', question: 'Choose the correct phrase: “Neither of the answers ___ correct.”', answer: 'is', explanation: '“Neither” is singular in standard formal usage, so it takes “is”.' },
  { topic: 'English', question: 'What is the passive form of “The team solved the problem”?', answer: 'The problem was solved by the team.', explanation: 'Move the object to subject position and use “was + past participle”.' },
  { topic: 'DSA', question: 'What is the average-case time complexity of binary search?', answer: 'O(log n).', explanation: 'Each comparison halves the remaining sorted search interval.' },
  { topic: 'DSA', question: 'Which data structure follows FIFO order?', answer: 'Queue.', explanation: 'A queue removes items in the same order they were inserted: first in, first out.' },
  { topic: 'DSA', question: 'What is the time complexity of inserting at the head of a linked list?', answer: 'O(1).', explanation: 'Only the new node’s pointer and the head reference need updating.' },
  { topic: 'DBMS', question: 'What does a primary key guarantee?', answer: 'Uniqueness and non-null identity for each row.', explanation: 'A table has one primary-key constraint, which may consist of multiple columns.' },
  { topic: 'DBMS', question: 'What is database normalization intended to reduce?', answer: 'Redundant data and update anomalies.', explanation: 'Normalization organizes relations and dependencies to avoid repeated facts.' },
  { topic: 'DBMS', question: 'What does ACID “Atomicity” mean?', answer: 'A transaction happens completely or not at all.', explanation: 'Partial transaction effects are rolled back if the transaction fails.' },
  { topic: 'Operating Systems', question: 'What is a process?', answer: 'A program in execution, with its own execution state and resources.', explanation: 'The OS tracks items such as process state, memory mappings, and scheduling context.' },
  { topic: 'Operating Systems', question: 'What does a mutex protect?', answer: 'A critical section from simultaneous access by multiple threads.', explanation: 'A thread must acquire the lock before accessing the protected shared resource.' },
  { topic: 'Operating Systems', question: 'What is virtual memory?', answer: 'An abstraction that gives processes a virtual address space backed by physical memory and storage.', explanation: 'Address translation and paging let the OS isolate processes and use memory efficiently.' },
  { topic: 'Computer Networks', question: 'Which transport protocol provides ordered, reliable byte-stream delivery?', answer: 'TCP.', explanation: 'TCP uses acknowledgements, retransmissions, and sequence numbers to provide reliable ordered delivery.' },
  { topic: 'Computer Networks', question: 'What does DNS do?', answer: 'Maps domain names to network records such as IP addresses.', explanation: 'Resolvers query DNS to find the address or other record associated with a name.' },
  { topic: 'Computer Networks', question: 'What is the purpose of an IP address?', answer: 'To identify a network interface for packet addressing and routing.', explanation: 'Routers use IP addressing to forward packets between networks.' },
  { topic: 'OOP', question: 'What is encapsulation?', answer: 'Bundling state with operations and controlling access to internal details.', explanation: 'A class can expose a stable public interface while protecting implementation invariants.' },
  { topic: 'OOP', question: 'What is polymorphism?', answer: 'Using a common interface while behavior varies by the underlying object or implementation.', explanation: 'Method overriding is a common runtime form of polymorphism.' },
  { topic: 'OOP', question: 'What does inheritance model?', answer: 'A relationship where a type derives or specializes behavior from another type.', explanation: 'Inheritance supports reuse but should represent a valid “is-a” relationship.' },
  { topic: 'General Knowledge', question: 'Which branch of the Indian government interprets the Constitution and laws?', answer: 'The judiciary.', explanation: 'Courts exercise judicial power and review the application of laws.' },
  { topic: 'General Knowledge', question: 'What is the capital of Australia?', answer: 'Canberra.', explanation: 'Canberra is Australia’s federal capital; it is not Sydney or Melbourne.' },
  { topic: 'General Knowledge', question: 'What is the SI unit of electric current?', answer: 'Ampere (A).', explanation: 'The ampere is the SI base unit for electric current.' },
]
const flashcardTopics = [...new Set(flashcards.map((card) => card.topic))]

const shortcuts: Shortcut[] = [
  { category: 'Fast calculations', title: 'Multiply by 5 mentally', explanation: 'Multiply by 10, then halve the result.', example: '68 × 5 = 680 ÷ 2 = 340.' },
  { category: 'Percentage shortcuts', title: 'Swap percentage and base', explanation: 'a% of b equals b% of a, which can make mental arithmetic easier.', example: '16% of 25 = 25% of 16 = 4.' },
  { category: 'Multiplication tricks', title: 'Square numbers ending in 5', explanation: 'For a number 10a+5, calculate a×(a+1), then append 25.', example: '75²: 7×8 = 56; append 25 → 5,625.' },
  { category: 'Divisibility rules', title: 'Test divisibility by 9', explanation: 'A number is divisible by 9 when the sum of its digits is divisible by 9.', example: '5,832: 5+8+3+2 = 18, so it is divisible by 9.' },
  { category: 'Number series', title: 'Compare first differences', explanation: 'Subtract neighboring terms; if differences change regularly, inspect their differences too.', example: '2, 5, 10, 17 has differences 3, 5, 7; next difference 9 gives 26.' },
  { category: 'Logical reasoning', title: 'Translate quantifiers carefully', explanation: 'Use small sets or a Venn sketch. “All A are B” does not mean “All B are A”.', example: 'All cats are mammals does not imply all mammals are cats.' },
  { category: 'Time-saving aptitude', title: 'Estimate before calculating', explanation: 'Round values to nearby convenient numbers to eliminate implausible choices, then verify the closest option.', example: '49.8% of 202 is close to 50% of 200 = 100.' },
  { category: 'MCQ elimination', title: 'Check units and boundary cases', explanation: 'Reject choices with impossible units or behavior at zero/one before doing full algebra.', example: 'For a distance question, a choice in km² is dimensionally impossible.' },
  { category: 'DSA strategies', title: 'State the invariant first', explanation: 'Write what must remain true after each iteration; it often clarifies correctness and loop boundaries.', example: 'In binary search, the target—if present—remains inside the current inclusive interval [lo, hi].' },
  { category: 'Exam time management', title: 'Use a two-pass attempt', explanation: 'Answer confident questions first, flag time-consuming ones, then return with remaining time.', example: 'In a 60-minute section, reserve the final 10 minutes for flagged questions and review.' },
]
const shortcutCategories = [...new Set(shortcuts.map((item) => item.category))]

const navLinks = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Revision Center', to: '/revision' },
]const sessionKey = 'examiq_session'

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(sessionKey) ?? 'null') as { token?: string; user?: { id?: string } } | null
  } catch {
    return null
  }
}

function useSavedSet(key: string) {
  const [values, setValues] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? '[]') as string[]
    } catch {
      return []
    }
  })
  useEffect(() => { localStorage.setItem(key, JSON.stringify(values)) }, [key, values])
  const toggle = (id: string) => setValues((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])
  return [values, toggle] as const
}

function ToolLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 rounded-[28px] border border-slate-700 bg-slate-900/80 p-5 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link to="/revision" className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 font-black text-slate-950">E</span>
              <span className="text-xl font-black">ExamIQ</span>
            </Link>
            <nav className="flex flex-wrap gap-2">{navLinks.map((item) => <Link key={item.to} to={item.to} className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-violet-400">{item.label}</Link>)}</nav>
          </div>
          <p className="mt-5 text-xs uppercase tracking-[0.25em] text-violet-300">Revision Center</p>
          <h1 className="mt-2 text-3xl font-black md:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
        </header>
        {children}
      </div>
    </div>
  )
}

function FilterBar({ search, setSearch, categories, category, setCategory }: {
  search: string; setSearch: (value: string) => void; categories: string[]; category: string; setCategory: (value: string) => void
}) {
  return (
    <div className="mb-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_280px]">
      <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-4">
        <Search className="h-4 w-4 text-slate-400" />
        <input aria-label="Search learning content" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search topics, formulas, and examples..." className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-500" />
      </label>
      <select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white">
        <option value="All">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}
      </select>
    </div>
  )
}

function FormulaBook() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const session = getSession()
  const [favorites, toggleFavorite] = useSavedSet(`examiq_revision_${session?.user?.id ?? 'guest'}_formula_favorites`)
  const filtered = useMemo(() => formulas.filter((item) =>
    (category === 'All' || item.category === category)
    && `${item.name} ${item.category} ${item.formula} ${item.explanation} ${item.topic} ${item.steps.join(' ')}`.toLowerCase().includes(search.toLowerCase()),
  ), [category, search])
  return (
    <ToolLayout title="Formula Book" subtitle="Learn the core competitive-exam formulas with clear explanations and worked examples.">
      <Link to="/revision" className="mb-5 inline-flex items-center gap-2 text-sm text-violet-300 hover:text-white"><ArrowLeft size={16} />Back to Revision</Link>
      <FilterBar search={search} setSearch={setSearch} categories={formulaCategories} category={category} setCategory={setCategory} />
      <p className="mb-4 text-sm text-slate-400">{filtered.length} formulas · {favorites.length} favorites</p>
      {filtered.length === 0 ? <EmptyState text="No formulas match that search. Try another keyword or category." /> : (
        <div className="grid gap-4 lg:grid-cols-2">{filtered.map((item) => {
          const id = `${item.category}:${item.name}`
          const favorite = favorites.includes(id)
          return <article key={id} className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5 md:p-6">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-widest text-violet-300">{item.category} · {item.topic}</p><h2 className="mt-2 text-xl font-bold">{item.name}</h2></div><button type="button" aria-label={favorite ? 'Remove formula from favorites' : 'Add formula to favorites'} aria-pressed={favorite} onClick={() => toggleFavorite(id)} className="rounded-full p-2 text-amber-300 hover:bg-slate-800"><Star fill={favorite ? 'currentColor' : 'none'} size={19} /></button></div>
            <p className="mt-4 rounded-xl bg-slate-950 p-4 font-mono text-violet-200">{item.formula}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{item.explanation}</p>
            <div className="mt-4 rounded-xl border border-slate-700 p-4"><h3 className="text-sm font-semibold text-white">Worked example</h3><ol className="mt-2 list-inside list-decimal space-y-1 text-sm leading-6 text-slate-300">{item.steps.map((step) => <li key={step}>{step}</li>)}</ol></div>
          </article>
        })}</div>
      )}
    </ToolLayout>
  )
}

function FlashcardDeck() {
  const [topic, setTopic] = useState('All')
  const [position, setPosition] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const session = getSession()
  const storageKey = `examiq_revision_${session?.user?.id ?? 'guest'}_flashcard_progress`
  const [status, setStatus] = useState<Record<string, 'known' | 'review'>>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) ?? '{}') as Record<string, 'known' | 'review'> } catch { return {} }
  })
  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(status)) }, [status, storageKey])
  const deck = useMemo(() => flashcards.filter((card) => topic === 'All' || card.topic === topic), [topic])
  const card = deck[position]
  const setTopicAndReset = (value: string) => { setTopic(value); setPosition(0); setFlipped(false) }
  const step = (delta: number) => { setPosition((current) => (current + delta + deck.length) % deck.length); setFlipped(false) }
  const shuffle = () => {
    if (deck.length < 2) return
    const current = deck[position]
    let next = position
    while (next === position) next = Math.floor(Math.random() * deck.length)
    setPosition(next)
    setFlipped(false)
    if (current === deck[next]) setPosition((position + 1) % deck.length)
  }
  const knownCount = Object.values(status).filter((value) => value === 'known').length
  const reviewCount = Object.values(status).filter((value) => value === 'review').length
  return (
    <ToolLayout title="Flashcards" subtitle="Use active recall to review concepts across aptitude, reasoning, language, computing, and general knowledge.">
      <Link to="/revision" className="mb-5 inline-flex items-center gap-2 text-sm text-violet-300 hover:text-white"><ArrowLeft size={16} />Back to Revision</Link>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <label className="text-sm text-slate-300">Topic
          <select value={topic} onChange={(event) => setTopicAndReset(event.target.value)} className="ml-3 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-white"><option>All</option>{flashcardTopics.map((item) => <option key={item}>{item}</option>)}</select>
        </label>
        <div className="text-sm text-slate-400">Known {knownCount} · Need revision {reviewCount} · {Object.keys(status).length}/{flashcards.length} tracked</div>
      </div>
      {card ? <div className="mx-auto max-w-3xl">
        <button type="button" onClick={() => setFlipped((value) => !value)} className="min-h-[280px] w-full rounded-[28px] border border-violet-500/30 bg-gradient-to-br from-slate-900 to-violet-950/50 p-8 text-left shadow-xl md:min-h-[340px] md:p-12">
          <div className="flex items-center justify-between text-xs uppercase tracking-widest text-violet-300"><span>{card.topic}</span><span>{position + 1} / {deck.length}</span></div>
          <h2 className="mt-10 text-2xl font-bold leading-relaxed md:text-3xl">{flipped ? card.answer : card.question}</h2>
          {flipped && <p className="mt-5 text-base leading-7 text-slate-300">{card.explanation}</p>}
          <p className="mt-8 text-sm text-slate-500">{flipped ? 'Tap to show the question' : 'Tap to flip and reveal the answer'}</p>
        </button>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => step(-1)} className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2.5 hover:border-violet-400"><ChevronLeft size={17} />Previous</button>
          <button type="button" onClick={() => setFlipped((value) => !value)} className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2.5 hover:border-violet-400"><RotateCw size={16} />Flip</button>
          <button type="button" onClick={shuffle} className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2.5 hover:border-violet-400"><Shuffle size={16} />Shuffle</button>
          <button type="button" onClick={() => step(1)} className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2.5 hover:border-violet-400">Next<ChevronRight size={17} /></button>
        </div>
        <div className="mt-4 flex justify-center gap-3">
          <button type="button" onClick={() => setStatus((old) => ({ ...old, [card.question]: 'known' }))} className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-5 py-2.5 text-emerald-200 hover:bg-emerald-500/25"><Check size={17} />Known</button>
          <button type="button" onClick={() => setStatus((old) => ({ ...old, [card.question]: 'review' }))} className="rounded-full bg-amber-500/15 px-5 py-2.5 text-amber-200 hover:bg-amber-500/25">Need Revision</button>
        </div>
      </div> : <EmptyState text="There are no flashcards in this topic yet." />}
    </ToolLayout>
  )
}

function MistakeBook() {
  const navigate = useNavigate()
  const [mistakes, setMistakes] = useState<Mistake[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryId, setRetryId] = useState<string | null>(null)
  const [retryAnswer, setRetryAnswer] = useState('')
  const [checked, setChecked] = useState<string | null>(null)
  const session = getSession()

  const loadMistakes = useCallback(async () => {
    if (!session?.token) { navigate('/login', { replace: true }); return }
    try {
      const response = await apiFetch(`/api/revision/mistakes`, { headers: { Authorization: `Bearer ${session.token}` } })
      const data = await response.json() as { mistakes?: Mistake[]; message?: string }
      if (!response.ok) throw new Error(data.message ?? 'Unable to load your saved mistakes.')
      setMistakes(data.mistakes ?? [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load your saved mistakes.')
    } finally { setLoading(false) }
  }, [navigate, session?.token])
  useEffect(() => { void Promise.resolve().then(loadMistakes) }, [loadMistakes])

  const updateMistake = async (mistake: Mistake, action: 'review' | 'delete') => {
    if (!session?.token) { navigate('/login', { replace: true }); return }
    try {
      const response = await apiFetch(`/api/revision/mistakes/${mistake.attemptId}/${encodeURIComponent(mistake.id)}`, {
        method: action === 'review' ? 'PATCH' : 'DELETE',
        headers: { Authorization: `Bearer ${session.token}`, ...(action === 'review' ? { 'Content-Type': 'application/json' } : {}) },
        ...(action === 'review' ? { body: JSON.stringify({ reviewed: !mistake.reviewed }) } : {}),
      })
      if (!response.ok) {
        const data = await response.json() as { message?: string }
        throw new Error(data.message ?? `Unable to ${action === 'review' ? 'update' : 'remove'} this mistake.`)
      }
      if (action === 'delete') setMistakes((current) => current.filter((item) => item.mistakeKey !== mistake.mistakeKey))
      else setMistakes((current) => current.map((item) => item.mistakeKey === mistake.mistakeKey ? { ...item, reviewed: !item.reviewed } : item))
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update this mistake.')
    }
  }

  const checkRetry = (mistake: Mistake) => {
    if (!retryAnswer) return
    const correct = retryAnswer === mistake.correctAnswer
    setChecked(correct ? 'Correct. Great recall!' : `Not quite. The correct answer is ${mistake.correctAnswer}.`)
    if (correct && !mistake.reviewed) void updateMistake(mistake, 'review')
  }

  return (
    <ToolLayout title="Mistake Book" subtitle="Review incorrect answers saved from your real mock-test and practice attempts.">
      <Link to="/revision" className="mb-5 inline-flex items-center gap-2 text-sm text-violet-300 hover:text-white"><ArrowLeft size={16} />Back to Revision</Link>
      {loading ? <div className="rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center text-slate-300" aria-live="polite">Loading saved mistakes...</div> : null}
      {error && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200"><span>{error}</span><button type="button" onClick={() => { setLoading(true); setError(null); void loadMistakes() }} className="rounded-full border border-rose-400/40 px-4 py-2">Retry</button></div>}
      {!loading && !error && mistakes.length === 0 ? <EmptyState text="No incorrect answers have been saved yet. Complete a mock test or practice session and any missed answers will appear here." /> : null}
      <div className="space-y-4">{mistakes.map((mistake) => (
        <article key={mistake.mistakeKey} className={`rounded-2xl border bg-slate-900/80 p-5 md:p-6 ${mistake.reviewed ? 'border-emerald-500/30' : 'border-slate-700'}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400"><span>{mistake.category} · {mistake.topic} · Attempt #{mistake.attemptId}</span><span>{new Date(`${mistake.attemptedAt.replace(' ', 'T')}Z`).toLocaleString()}</span></div>
          <h2 className="mt-3 text-lg font-semibold leading-7">{mistake.prompt}</h2>
          <p className="mt-3 text-sm text-rose-200">Your answer: {mistake.userAnswer}</p>
          <p className="mt-1 text-sm text-emerald-200">Correct answer: {mistake.correctAnswer}</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">{mistake.explanation}</p>
          {retryId === mistake.mistakeKey ? <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950 p-4">
            <div className="space-y-2">{mistake.options.map((option) => <label key={option} className="flex items-center gap-3 rounded-lg border border-slate-800 p-3 text-sm text-slate-200"><input type="radio" name={`retry-${mistake.mistakeKey}`} checked={retryAnswer === option} onChange={() => { setRetryAnswer(option); setChecked(null) }} className="accent-violet-500" />{option}</label>)}</div>
            {checked && <p role="status" className="mt-3 text-sm text-violet-200">{checked}</p>}
            <button type="button" onClick={() => checkRetry(mistake)} disabled={!retryAnswer} className="mt-4 rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold disabled:opacity-40">Check answer</button>
          </div> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => { setRetryId(retryId === mistake.mistakeKey ? null : mistake.mistakeKey); setRetryAnswer(''); setChecked(null) }} className="rounded-full bg-violet-500/15 px-4 py-2 text-sm text-violet-200 hover:bg-violet-500/25">{retryId === mistake.mistakeKey ? 'Close retry' : 'Retry Question'}</button>
            <button type="button" onClick={() => void updateMistake(mistake, 'review')} className="rounded-full border border-emerald-500/30 px-4 py-2 text-sm text-emerald-200">{mistake.reviewed ? '✓ Reviewed · Undo' : 'Mark as Reviewed'}</button>
            <button type="button" onClick={() => void updateMistake(mistake, 'delete')} className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 px-4 py-2 text-sm text-rose-200 hover:bg-rose-500/10"><Trash2 size={15} />Remove from book</button>
          </div>
        </article>
      ))}</div>
    </ToolLayout>
  )
}

function ShortcutsPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const session = getSession()
  const [favorites, toggleFavorite] = useSavedSet(`examiq_revision_${session?.user?.id ?? 'guest'}_shortcut_favorites`)
  const filtered = useMemo(() => shortcuts.filter((item) =>
    (category === 'All' || item.category === category)
    && `${item.category} ${item.title} ${item.explanation} ${item.example}`.toLowerCase().includes(search.toLowerCase()),
  ), [category, search])
  return (
    <ToolLayout title="Shortcuts & Tricks" subtitle="Practical, verifiable methods to improve speed and decision-making in competitive exams.">
      <Link to="/revision" className="mb-5 inline-flex items-center gap-2 text-sm text-violet-300 hover:text-white"><ArrowLeft size={16} />Back to Revision</Link>
      <FilterBar search={search} setSearch={setSearch} categories={shortcutCategories} category={category} setCategory={setCategory} />
      <p className="mb-4 text-sm text-slate-400">{filtered.length} learning strategies · {favorites.length} favorites</p>
      {filtered.length === 0 ? <EmptyState text="No shortcuts match your search. Try another keyword or category." /> : (
        <div className="grid gap-4 md:grid-cols-2">{filtered.map((item) => {
          const favorite = favorites.includes(item.title)
          return <article key={item.title} className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-widest text-violet-300">{item.category}</p><h2 className="mt-2 text-xl font-bold">{item.title}</h2></div><button type="button" aria-label={favorite ? 'Remove shortcut from favorites' : 'Add shortcut to favorites'} aria-pressed={favorite} onClick={() => toggleFavorite(item.title)} className="rounded-full p-2 text-amber-300 hover:bg-slate-800"><Star fill={favorite ? 'currentColor' : 'none'} size={19} /></button></div>
            <p className="mt-4 text-sm leading-6 text-slate-300">{item.explanation}</p>
            <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950 p-4"><p className="text-xs uppercase tracking-widest text-slate-500">Worked example</p><p className="mt-2 text-sm leading-6 text-violet-100">{item.example}</p></div>
          </article>
        })}</div>
      )}
    </ToolLayout>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-[28px] border border-slate-700 bg-slate-900/70 p-8 text-center"><BookOpen className="mx-auto h-8 w-8 text-violet-300" /><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300">{text}</p></div>
}

export default function RevisionToolPage() {
  const { section } = useParams()
  if (section === 'formulas') return <FormulaBook />
  if (section === 'flashcards') return <FlashcardDeck />
  if (section === 'mistakes') return <MistakeBook />
  if (section === 'shortcuts') return <ShortcutsPage />
  return <ToolLayout title="Revision tool not found" subtitle="Choose a tool from your Revision Center."><Link to="/revision" className="inline-flex items-center gap-2 text-violet-300"><ArrowLeft size={16} />Back to Revision</Link></ToolLayout>
}
