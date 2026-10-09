import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pathToFileURL } from 'node:url';

import {
  createUser,
  deleteStudyPlan,
  getMockTestAttemptResults,
  getMockTestAttemptsByUser,
  getMockTestQuestions,
  getPracticeAttemptsByUser,
  getRevisionMistakesByUser,
  getStudyPlansByUser,
  getUserByEmail,
  getUserById,
  initializeDatabase,
  listUsers,
  savePracticeAttempt,
  saveMockTestAttempt,
  saveStudyPlan,
  updateStudyPlan,
  upsertTopicMastery,
  getTopicMasteryByUser,
  saveStudentProfile,
  getStudentProfileByUser,
  updateRevisionMistakeState,
} from './db.js';
import { questionCategories } from './questionBank.js';

dotenv.config();

export const app = express();
const port = Number(process.env.PORT ?? 4000);
const database = initializeDatabase();
export const closeDatabase = () => database.close();
const users = new Map<string, { id: string; name: string; email: string; passwordHash: string; role: string }>();
const examCatalog = [
  {
    slug: 'upsc-cse',
    name: 'UPSC CSE',
    category: 'Government',
    description: 'Civil services preparation with polity, essay, and current affairs mastery.',
    subjects: ['Polity', 'History', 'GS', 'Essay'],
    difficulty: 'Advanced',
    duration: '3h 30m',
    questions: 200,
    upcoming: 'Jun 2027',
    accent: 'from-violet-500 to-purple-500',
  },
  {
    slug: 'ssc-cgl',
    name: 'SSC CGL',
    category: 'Government',
    description: 'High-speed quantitative and reasoning preparation for competitive aptitude.',
    subjects: ['Quant', 'Reasoning', 'English', 'GK'],
    difficulty: 'Moderate',
    duration: '2h',
    questions: 160,
    upcoming: 'Sep 2027',
    accent: 'from-cyan-500 to-sky-500',
  },
  {
    slug: 'gate',
    name: 'GATE',
    category: 'Engineering',
    description: 'Concept-first engineering exam strategy with strong technical depth.',
    subjects: ['DSA', 'DBMS', 'Algorithms', 'Core'],
    difficulty: 'High',
    duration: '3h',
    questions: 65,
    upcoming: 'Feb 2028',
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    slug: 'cat',
    name: 'CAT',
    category: 'Management',
    description: 'Data interpretation and verbal reasoning for top-tier management exams.',
    subjects: ['VARC', 'DILR', 'QA'],
    difficulty: 'High',
    duration: '2h',
    questions: 66,
    upcoming: 'Nov 2027',
    accent: 'from-amber-500 to-orange-500',
  },
  {
    slug: 'neet',
    name: 'NEET',
    category: 'Medical',
    description: 'Biology and chemistry strategy with time-efficient recall blocks.',
    subjects: ['Biology', 'Chemistry', 'Physics'],
    difficulty: 'High',
    duration: '3h 20m',
    questions: 200,
    upcoming: 'May 2028',
    accent: 'from-rose-500 to-pink-500',
  },
  {
    slug: 'banking',
    name: 'Banking',
    category: 'Government',
    description: 'Speed and accuracy roadmap for IBPS, SBI, and RBI aspirants.',
    subjects: ['Quant', 'Reasoning', 'English', 'GK'],
    difficulty: 'Moderate',
    duration: '1h',
    questions: 120,
    upcoming: 'Aug 2027',
    accent: 'from-indigo-500 to-blue-500',
  },
];
const buildMockQuestionSet = () => [
  {
    id: 'quant-01',
    category: 'Quantitative Aptitude',
    difficulty: 'Easy',
    questionType: 'multiple-choice',
    prompt: 'If a train travels 180 km in 3 hours, what is its average speed?',
    options: ['45 km/h', '50 km/h', '60 km/h', '75 km/h'],
    correctAnswer: '60 km/h',
    explanation: 'Average speed is total distance divided by total time: 180 ÷ 3 = 60 km/h.',
  },
  {
    id: 'quant-02',
    category: 'Quantitative Aptitude',
    difficulty: 'Medium',
    questionType: 'multiple-choice',
    prompt: 'A shopkeeper marks a product 25% above cost price and offers a 10% discount. What is the net profit percentage?',
    options: ['10%', '12.5%', '15%', '17.5%'],
    correctAnswer: '12.5%',
    explanation: 'If the cost price is 100, marked price = 125, selling price after 10% discount = 112.5, so profit = 12.5%.',
  },
  {
    id: 'reasoning-01',
    category: 'Reasoning',
    difficulty: 'Medium',
    questionType: 'multiple-choice',
    prompt: 'Which number comes next in the sequence: 2, 6, 12, 20, 30, ?',
    options: ['36', '40', '42', '48'],
    correctAnswer: '42',
    explanation: 'The sequence follows n(n + 1): 1×2, 2×3, 3×4, 4×5, 5×6, so the next is 6×7 = 42.',
  },
  {
    id: 'reasoning-02',
    category: 'Reasoning',
    difficulty: 'Hard',
    questionType: 'multiple-choice',
    prompt: 'If all roses are flowers and some flowers fade quickly, which statement must be true?',
    options: ['All roses fade quickly', 'Some roses fade quickly', 'Some flowers are roses', 'No roses are flowers'],
    correctAnswer: 'Some flowers are roses',
    explanation: 'From the premises, roses are a subset of flowers, so some flowers are definitely roses.',
  },
  {
    id: 'di-01',
    category: 'Data Interpretation',
    difficulty: 'Medium',
    questionType: 'multiple-choice',
    prompt: 'A student scored 80, 75, 90, and 85 in four tests. What is the average score?',
    options: ['80', '83', '85', '87'],
    correctAnswer: '83',
    explanation: 'Total = 330; 330 ÷ 4 = 82.5, which rounds to 83 in this quiz context.',
  },
  {
    id: 'verbal-01',
    category: 'Verbal Ability',
    difficulty: 'Easy',
    questionType: 'multiple-choice',
    prompt: 'Choose the best synonym for the word “meticulous.”',
    options: ['Careless', 'Precise', 'Quick', 'Loud'],
    correctAnswer: 'Precise',
    explanation: 'Meticulous means showing great attention to detail, which aligns closely with precise.',
  },
  {
    id: 'verbal-02',
    category: 'Verbal Ability',
    difficulty: 'Medium',
    questionType: 'multiple-choice',
    prompt: 'Select the sentence with correct grammar.',
    options: [
      'She do not like coffee.',
      'She does not likes coffee.',
      'She does not like coffee.',
      'She not does like coffee.',
    ],
    correctAnswer: 'She does not like coffee.',
    explanation: 'With a singular subject, the verb takes the third-person singular form: “does.”',
  },
  {
    id: 'gk-01',
    category: 'General Awareness',
    difficulty: 'Medium',
    questionType: 'multiple-choice',
    prompt: 'Which of the following is the capital of Karnataka?',
    options: ['Hyderabad', 'Chennai', 'Bengaluru', 'Pune'],
    correctAnswer: 'Bengaluru',
    explanation: 'Bengaluru is the capital city of Karnataka.',
  },
  {
    id: 'gk-02',
    category: 'Current Affairs',
    difficulty: 'Medium',
    questionType: 'multiple-choice',
    prompt: 'Who is credited with discovering the laws of motion?',
    options: ['Albert Einstein', 'Isaac Newton', 'Galileo Galilei', 'Nikola Tesla'],
    correctAnswer: 'Isaac Newton',
    explanation: 'Isaac Newton formulated the laws of motion and universal gravitation.',
  },
  {
    id: 'dsa-01',
    category: 'DSA',
    difficulty: 'Hard',
    questionType: 'multiple-choice',
    prompt: 'Which data structure follows the LIFO principle?',
    options: ['Queue', 'Tree', 'Stack', 'Graph'],
    correctAnswer: 'Stack',
    explanation: 'A stack uses Last In, First Out ordering, unlike a queue which is FIFO.',
  },
  {
    id: 'dsa-02',
    category: 'DSA',
    difficulty: 'Hard',
    questionType: 'multiple-choice',
    prompt: 'What is the time complexity of binary search on a sorted array?',
    options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
    correctAnswer: 'O(log n)',
    explanation: 'Binary search halves the search space at each step, leading to logarithmic time complexity.',
  },
  {
    id: 'polity-01',
    category: 'Polity',
    difficulty: 'Medium',
    questionType: 'multiple-choice',
    prompt: 'Which article of the Indian Constitution guarantees equality before the law?',
    options: ['Article 14', 'Article 19', 'Article 21', 'Article 32'],
    correctAnswer: 'Article 14',
    explanation: 'Article 14 of the Constitution states that the State shall not deny equality before the law.',
  },
  {
    id: 'english-01',
    category: 'English',
    difficulty: 'Easy',
    questionType: 'multiple-choice',
    prompt: 'Choose the correct antonym of “fragile.”',
    options: ['Weak', 'Delicate', 'Sturdy', 'Broken'],
    correctAnswer: 'Sturdy',
    explanation: 'Sturdy means strong and durable, which is the opposite of fragile.',
  },
  {
    id: 'math-01',
    category: 'Math',
    difficulty: 'Medium',
    questionType: 'multiple-choice',
    prompt: 'The square root of 144 is:',
    options: ['10', '11', '12', '14'],
    correctAnswer: '12',
    explanation: '12 × 12 = 144, so the square root of 144 is 12.',
  },
  {
    id: 'chem-01',
    category: 'Chemistry',
    difficulty: 'Medium',
    questionType: 'multiple-choice',
    prompt: 'Which gas is most abundant in Earth’s atmosphere?',
    options: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Hydrogen'],
    correctAnswer: 'Nitrogen',
    explanation: 'Nitrogen makes up about 78% of Earth’s atmosphere.',
  },
  {
    id: 'biology-01',
    category: 'Biology',
    difficulty: 'Medium',
    questionType: 'multiple-choice',
    prompt: 'Which organ is responsible for pumping blood throughout the body?',
    options: ['Lungs', 'Brain', 'Heart', 'Kidney'],
    correctAnswer: 'Heart',
    explanation: 'The heart circulates blood through the body via the circulatory system.',
  },
  {
    id: 'reasoning-03',
    category: 'Reasoning',
    difficulty: 'Easy',
    questionType: 'multiple-choice',
    prompt: 'If A is taller than B and B is taller than C, who is the shortest?',
    options: ['A', 'B', 'C', 'Cannot be determined'],
    correctAnswer: 'C',
    explanation: 'Since A > B > C, C is the shortest.',
  },
  {
    id: 'gk-03',
    category: 'General Awareness',
    difficulty: 'Easy',
    questionType: 'multiple-choice',
    prompt: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Mercury'],
    correctAnswer: 'Mars',
    explanation: 'Mars appears reddish due to iron oxide on its surface.',
  },
  {
    id: 'quant-03',
    category: 'Quantitative Aptitude',
    difficulty: 'Hard',
    questionType: 'multiple-choice',
    prompt: 'If 15 workers can complete a task in 12 days, how many days will 10 workers take if they work at the same rate?',
    options: ['16 days', '18 days', '20 days', '24 days'],
    correctAnswer: '18 days',
    explanation: 'Work is inversely proportional to the number of workers: 15 × 12 = 180 work-units. With 10 workers, time = 180 ÷ 10 = 18 days.',
  },
  {
    id: 'current-01',
    category: 'Current Affairs',
    difficulty: 'Medium',
    questionType: 'multiple-choice',
    prompt: 'Which organization is responsible for conducting the Indian General Elections?',
    options: ['Election Commission of India', 'Parliament of India', 'Supreme Court of India', 'Ministry of Home Affairs'],
    correctAnswer: 'Election Commission of India',
    explanation: 'The Election Commission of India is the autonomous constitutional authority responsible for conducting elections.',
  },
];

for (const user of listUsers(database)) {
  users.set(user.email, user);
}

app.use(cors({ origin: process.env.FRONTEND_URL ?? '*' }));
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

const mlServiceUrl = process.env.ML_SERVICE_URL ?? 'http://localhost:8000';

const defaultAnalyzeSnapshot = {
  readiness: 82,
  predictedScore: 86,
  successProbability: 91,
  riskLevel: 'LOW',
  weakArea: 'Quantitative Aptitude',
  strongArea: 'Logical Reasoning',
  nextBestAction: 'Practice Probability for 30 minutes',
  note: 'Demo analytics data: clearly labeled simulated output.',
};

const getToken = (user: { id: string; name: string; email: string; role: string }) =>
  jwt.sign({ sub: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET ?? 'examiq-dev-secret', {
    expiresIn: '7d',
  });

const authMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ message: 'Authentication required.' });
    return;
  }

  let payload: { sub: string; email: string; role: string };
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET ?? 'examiq-dev-secret') as {
      sub: string;
      email: string;
      role: string;
    };
  } catch {
    res.status(401).json({ message: 'Invalid or expired token.' });
    return;
  }

  if (!getUserById(database, payload.sub)) {
    res.status(401).json({ message: 'The account for this session no longer exists. Please sign in again.' });
    return;
  }

  req.user = {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
  };
  next();
};

app.get('/api/exams', (_req, res) => {
  res.json(examCatalog);
});

app.get('/api/exams/:slug', (req, res) => {
  const exam = examCatalog.find((item) => item.slug === req.params.slug);

  if (!exam) {
    res.status(404).json({ message: 'Exam not found.' });
    return;
  }

  res.json(exam);
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ExamIQ backend',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body ?? {};

  if (!name || !email || !password) {
    res.status(400).json({ message: 'Name, email, and password are required.' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (String(password).length < 6) {
    res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    return;
  }

  if (getUserByEmail(database, normalizedEmail) || users.has(normalizedEmail)) {
    res.status(409).json({ message: 'An account with that email already exists.' });
    return;
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  const user = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash,
    role: role === 'admin' ? 'admin' : 'student',
  };

  createUser(database, user);
  saveStudentProfile(database, {
    userId: user.id,
    examTarget: 'UPSC CSE 2027',
    preferredStudyHours: 18,
    dailyGoal: 'Quant + reasoning focus',
    learningStyle: 'Goal-oriented',
    reminderPreference: 'Evening',
  });
  users.set(normalizedEmail, user);
  const token = getToken(user);

  res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required.' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = users.get(normalizedEmail) ?? getUserByEmail(database, normalizedEmail);
  if (!user) {
    res.status(401).json({ message: 'Invalid email or password.' });
    return;
  }

  const isValidPassword = await bcrypt.compare(String(password), user.passwordHash);
  if (!isValidPassword) {
    res.status(401).json({ message: 'Invalid email or password.' });
    return;
  }

  const token = getToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

const getLiveAnalytics = async () => {
  const payload = {
    studyHours: 18.5,
    averageScore: 82,
    accuracy: 78,
    attemptRate: 74,
    averageTime: 58,
    revisionFrequency: 6,
    mockTestCount: 12,
    topicCoverage: 81,
    consistency: 84,
    difficultyPerformance: 76,
  };

  try {
    const [scoreResponse, successResponse, weakTopicsResponse, recommendationsResponse] = await Promise.all([
      fetch(`${mlServiceUrl}/predict-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
      fetch(`${mlServiceUrl}/predict-success`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
      fetch(`${mlServiceUrl}/detect-weak-topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
      fetch(`${mlServiceUrl}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    ]);

    if (!scoreResponse.ok || !successResponse.ok || !weakTopicsResponse.ok || !recommendationsResponse.ok) {
      throw new Error('ML service returned an error');
    }

    const scoreData = (await scoreResponse.json()) as { predictedScore: number };
    const successData = (await successResponse.json()) as { successProbability: number };
    const weakTopicsData = (await weakTopicsResponse.json()) as { weakTopics?: Array<{ topic: string; reason: string }> };
    const recommendationData = (await recommendationsResponse.json()) as {
      recommendations?: Array<{ topic: string; durationMinutes: number; priority: string }>;
    };

    const readiness = Math.min(100, Math.max(0, Math.round((scoreData.predictedScore * 0.6 + successData.successProbability * 0.4))));
    const weakArea = weakTopicsData.weakTopics?.[0]?.topic ?? defaultAnalyzeSnapshot.weakArea;
    const recommendation = recommendationData.recommendations?.[0];
    const nextBestAction = recommendation
      ? `Practice ${recommendation.topic} for ${recommendation.durationMinutes} minutes (${recommendation.priority} priority)`
      : defaultAnalyzeSnapshot.nextBestAction;

    return {
      readiness,
      predictedScore: scoreData.predictedScore,
      successProbability: successData.successProbability,
      riskLevel: successData.successProbability >= 80 ? 'LOW' : successData.successProbability >= 60 ? 'MEDIUM' : 'HIGH',
      weakArea,
      strongArea: 'Logical Reasoning',
      nextBestAction,
      note: 'Live analytics from the ExamIQ ML service.',
    };
  } catch {
    return defaultAnalyzeSnapshot;
  }
};

app.get('/api/ai/analyze', async (_req, res) => {
  const analysis = await getLiveAnalytics();
  res.json(analysis);
});

app.get('/api/student/profile', authMiddleware, (req, res) => {
  const authenticatedRequest = req as any;
  const user = getUserById(database, authenticatedRequest.user.id) ?? users.get(authenticatedRequest.user.email) ?? null;
  if (!user) {
    res.status(404).json({ message: 'Student profile not found.' });
    return;
  }

  const profile = getStudentProfileByUser(database, user.id) ?? {
    userId: user.id,
    examTarget: 'UPSC CSE 2027',
    preferredStudyHours: 18,
    dailyGoal: 'Quant + reasoning focus',
    learningStyle: 'Goal-oriented',
    reminderPreference: 'Evening',
  };

  res.json({
    userId: user.id,
    examTarget: profile.examTarget,
    preferredStudyHours: profile.preferredStudyHours,
    dailyGoal: profile.dailyGoal,
    learningStyle: profile.learningStyle,
    reminderPreference: profile.reminderPreference,
  });
});

app.post('/api/student/profile', authMiddleware, (req, res) => {
  const authenticatedRequest = req as any;
  const user = getUserById(database, authenticatedRequest.user.id) ?? users.get(authenticatedRequest.user.email) ?? null;
  if (!user) {
    res.status(404).json({ message: 'Student profile not found.' });
    return;
  }

  const { examTarget, preferredStudyHours, dailyGoal, learningStyle, reminderPreference } = req.body ?? {};
  if (!examTarget || !dailyGoal || !learningStyle || !reminderPreference) {
    res.status(400).json({ message: 'All profile fields are required.' });
    return;
  }

  const studyHours = Number(preferredStudyHours);
  if (!Number.isFinite(studyHours) || studyHours < 1 || studyHours > 80) {
    res.status(400).json({ message: 'Preferred study hours must be a number between 1 and 80.' });
    return;
  }

  const profile = {
    userId: user.id,
    examTarget: String(examTarget).trim(),
    preferredStudyHours: Math.round(studyHours),
    dailyGoal: String(dailyGoal).trim(),
    learningStyle: String(learningStyle).trim(),
    reminderPreference: String(reminderPreference).trim(),
  };

  const savedProfile = saveStudentProfile(database, profile);

  res.json({
    userId: savedProfile.userId,
    examTarget: savedProfile.examTarget,
    preferredStudyHours: savedProfile.preferredStudyHours,
    dailyGoal: savedProfile.dailyGoal,
    learningStyle: savedProfile.learningStyle,
    reminderPreference: savedProfile.reminderPreference,
  });
});

app.get('/api/student/study-plan', authMiddleware, (req, res) => {
  const userId = (req as any).user.id as string;
  res.json({ items: getStudyPlansByUser(database, userId) });
});

app.post('/api/student/study-plan', authMiddleware, (req, res) => {
  const userId = (req as any).user.id as string;
  const { day, title, detail, durationMinutes } = req.body ?? {};
  const duration = Number(durationMinutes);
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)
    || Number.isNaN(Date.parse(`${day}T00:00:00Z`))
    || typeof title !== 'string' || !title.trim() || title.trim().length > 120
    || typeof detail !== 'string' || !detail.trim() || detail.trim().length > 500
    || !Number.isInteger(duration) || duration < 1 || duration > 600) {
    res.status(400).json({ message: 'Provide a valid date, a title and topic, and a duration from 1 to 600 minutes.' });
    return;
  }
  const item = saveStudyPlan(database, {
    userId,
    day,
    title: title.trim(),
    detail: detail.trim(),
    durationMinutes: duration,
  });
  res.status(201).json({ item });
});

app.patch('/api/student/study-plan/:id', authMiddleware, (req, res) => {
  const planId = Number(req.params.id);
  const userId = (req as any).user.id as string;
  const { day, title, detail, durationMinutes, completed } = req.body ?? {};
  const duration = Number(durationMinutes);
  if (!Number.isSafeInteger(planId) || planId < 1
    || typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)
    || Number.isNaN(Date.parse(`${day}T00:00:00Z`))
    || typeof title !== 'string' || !title.trim() || title.trim().length > 120
    || typeof detail !== 'string' || !detail.trim() || detail.trim().length > 500
    || !Number.isInteger(duration) || duration < 1 || duration > 600
    || typeof completed !== 'boolean') {
    res.status(400).json({ message: 'Provide a valid task, date, duration, and completion status.' });
    return;
  }
  const updated = updateStudyPlan(database, userId, planId, {
    day,
    title: title.trim(),
    detail: detail.trim(),
    durationMinutes: duration,
    completed,
  });
  if (!updated) {
    res.status(404).json({ message: 'That study-plan task could not be found.' });
    return;
  }
  res.json({ item: getStudyPlansByUser(database, userId).find((item) => item.id === planId) });
});

app.delete('/api/student/study-plan/:id', authMiddleware, (req, res) => {
  const planId = Number(req.params.id);
  const userId = (req as any).user.id as string;
  if (!Number.isSafeInteger(planId) || planId < 1) {
    res.status(400).json({ message: 'A valid study-plan task ID is required.' });
    return;
  }
  if (!deleteStudyPlan(database, userId, planId)) {
    res.status(404).json({ message: 'That study-plan task could not be found.' });
    return;
  }
  res.status(204).end();
});

app.get('/api/student/dashboard', authMiddleware, (req, res) => {
  const authenticatedRequest = req as any;
  const user = getUserById(database, authenticatedRequest.user.id) ?? users.get(authenticatedRequest.user.email) ?? null;
  if (!user) {
    res.status(404).json({ message: 'Student profile not found.' });
    return;
  }

  const attempts = getPracticeAttemptsByUser(database, user.id);
  const topicMastery = getTopicMasteryByUser(database, user.id);
  const studentProfile = getStudentProfileByUser(database, user.id) ?? {
    userId: user.id,
    examTarget: 'UPSC CSE 2027',
    preferredStudyHours: 18,
    dailyGoal: 'Quant + reasoning focus',
    learningStyle: 'Goal-oriented',
    reminderPreference: 'Evening',
  };
  const averagePercentage = attempts.length
    ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length)
    : null;
  const weakestTopic = [...topicMastery].sort((left, right) => left.accuracy - right.accuracy)[0];
  const strongestTopic = [...topicMastery].sort((left, right) => right.accuracy - left.accuracy)[0];
  const weakArea = weakestTopic?.topic ?? attempts[0]?.weaknesses.split(', ').find(Boolean) ?? 'Not enough attempt data';
  const strongArea = strongestTopic?.topic ?? 'Not enough attempt data';
  const savedPlan = getStudyPlansByUser(database, user.id);
  const recentTrend = attempts.slice(0, 7).map((attempt) => attempt.percentage).reverse();
  const subjectProgress = topicMastery.map((item) => ({
    subject: item.topic,
    progress: item.mastery,
    trend: `${item.attempts} attempt${item.attempts === 1 ? '' : 's'}`,
  }));
  const focusAreas = [...topicMastery]
    .sort((left, right) => left.accuracy - right.accuracy)
    .slice(0, 4)
    .map((item) => item.topic);

  res.json({
    studentName: user.name,
    examTarget: studentProfile.examTarget,
    readiness: averagePercentage,
    predictedScore: null,
    successProbability: null,
    streakDays: null,
    averageAccuracy: averagePercentage,
    weeklyStudyHours: null,
    weakArea,
    strongArea,
    nextBestAction: weakestTopic
      ? `Revise ${weakestTopic.topic} using your saved mistakes, then take a focused practice set.`
      : attempts.length
        ? 'Complete more topic-tagged questions to identify a reliable weak area.'
        : 'Take your first practice or mock test to build a personalized study snapshot.',
    upcomingPlan: savedPlan.map((item) => ({
      title: item.title,
      detail: item.detail,
      time: `${item.durationMinutes} min`,
    })),
    subjectProgress,
    weeklyTrend: recentTrend,
    focusAreas,
    recentAttempts: attempts.map((attempt) => ({
      id: attempt.id,
      score: attempt.score,
      total: attempt.total,
      percentage: attempt.percentage,
      verdict: attempt.verdict,
      weaknesses: attempt.weaknesses,
      createdAt: attempt.createdAt,
    })),
    topicMastery: topicMastery.map((item) => ({
      topic: item.topic,
      mastery: item.mastery,
      attempts: item.attempts,
      accuracy: item.accuracy,
      updatedAt: item.updatedAt,
    })),
    profile: {
      examTarget: studentProfile.examTarget,
      preferredStudyHours: studentProfile.preferredStudyHours,
      dailyGoal: studentProfile.dailyGoal,
      learningStyle: studentProfile.learningStyle,
      reminderPreference: studentProfile.reminderPreference,
    },
  });
});

app.get('/api/mock-test/categories', authMiddleware, (_req, res) => {
  res.json(questionCategories);
});

app.get('/api/mock-test/history', authMiddleware, (req, res) => {
  const userId = (req as any).user.id as string;
  res.json({
    attempts: getMockTestAttemptsByUser(database, userId),
    results: getMockTestAttemptResults(database, userId),
  });
});

app.get('/api/revision/mistakes', authMiddleware, (req, res) => {
  const userId = (req as any).user.id as string;
  res.json({ mistakes: getRevisionMistakesByUser(database, userId) });
});

app.patch('/api/revision/mistakes/:attemptId/:questionId', authMiddleware, (req, res) => {
  const attemptId = Number(req.params.attemptId);
  const questionId = req.params.questionId;
  const { reviewed } = req.body ?? {};
  if (!Number.isSafeInteger(attemptId) || attemptId < 1 || !questionId || typeof reviewed !== 'boolean') {
    res.status(400).json({ message: 'A valid attempt, question, and reviewed status are required.' });
    return;
  }
  const userId = (req as any).user.id as string;
  if (!updateRevisionMistakeState(database, userId, attemptId, questionId, { reviewed })) {
    res.status(404).json({ message: 'That saved mistake could not be found.' });
    return;
  }
  res.json({ reviewed });
});

app.delete('/api/revision/mistakes/:attemptId/:questionId', authMiddleware, (req, res) => {
  const attemptId = Number(req.params.attemptId);
  const questionId = req.params.questionId;
  if (!Number.isSafeInteger(attemptId) || attemptId < 1 || !questionId) {
    res.status(400).json({ message: 'A valid attempt and question are required.' });
    return;
  }
  const userId = (req as any).user.id as string;
  if (!updateRevisionMistakeState(database, userId, attemptId, questionId, { dismissed: true })) {
    res.status(404).json({ message: 'That saved mistake could not be found.' });
    return;
  }
  res.status(204).end();
});

app.get('/api/mock-test', authMiddleware, (req, res) => {
  const category = typeof req.query.category === 'string' ? req.query.category : 'Mixed';
  const difficulty = typeof req.query.difficulty === 'string' ? req.query.difficulty : '';
  const count = Number(req.query.count ?? 10);
  const durationMinutes = Number(req.query.durationMinutes ?? Math.ceil(count * 1.5));
  const adaptive = req.query.adaptive === 'true';

  if (category !== 'Mixed' && !questionCategories.includes(category)) {
    res.status(400).json({ message: 'Choose a supported mock-test category.' });
    return;
  }
  if (difficulty && !['Beginner', 'Intermediate', 'Advanced'].includes(difficulty)) {
    res.status(400).json({ message: 'Difficulty must be Beginner, Intermediate, or Advanced.' });
    return;
  }
  if (!Number.isInteger(count) || count < 1 || count > 50) {
    res.status(400).json({ message: 'Question count must be between 1 and 50.' });
    return;
  }
  if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 180) {
    res.status(400).json({ message: 'Test duration must be between 1 and 180 minutes.' });
    return;
  }

  const pool = getMockTestQuestions(database, {
    category: category === 'Mixed' ? undefined : category,
    difficulty: difficulty || undefined,
  });
  if (pool.length === 0) {
    res.status(404).json({ message: 'No questions match these filters. Choose another category or difficulty.' });
    return;
  }

  const userId = (req as any).user.id as string;
  const weakTopics = adaptive
    ? (getMockTestAttemptResults(database, userId)[0] as { weakTopics?: string[] } | undefined)?.weakTopics ?? []
    : [];
  const shuffled = [...pool];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex]!, shuffled[index]!];
  }
  const ordered = adaptive
    ? [...shuffled.filter((question) => weakTopics.includes(question.topic)), ...shuffled.filter((question) => !weakTopics.includes(question.topic))]
    : shuffled;
  const selected = ordered.slice(0, count);
  if (req.query.mode === 'practice') {
    res.json(selected);
    return;
  }
  const questions = selected.map(({ correctAnswer: _answer, explanation: _explanation, ...question }) => question);
  res.json({
    category,
    difficulty: difficulty || 'Mixed',
    questions,
    availableCount: pool.length,
    durationSeconds: durationMinutes * 60,
    adaptive: adaptive && weakTopics.length > 0,
  });
});

app.post('/api/mock-test/submit', authMiddleware, async (req, res) => {
  const { answers, questionIds, category, difficulty, timeTakenSeconds } = req.body ?? {};
  if (!Array.isArray(questionIds) || questionIds.length < 1 || questionIds.length > 50
    || questionIds.some((id: unknown) => typeof id !== 'string')
    || new Set(questionIds).size !== questionIds.length
    || !answers || typeof answers !== 'object' || Array.isArray(answers)) {
    res.status(400).json({ message: 'Submit a valid test with its question IDs and selected answers.' });
    return;
  }

  const questions = getMockTestQuestions(database, { questionIds });
  if (questions.length !== questionIds.length) {
    res.status(400).json({ message: 'One or more submitted questions are invalid.' });
    return;
  }
  for (const [questionId, answer] of Object.entries(answers)) {
    const question = questions.find((item) => item.id === questionId);
    if (!question || typeof answer !== 'string' || !question.options.includes(answer)) {
      res.status(400).json({ message: 'An answer is invalid or does not belong to this test.' });
      return;
    }
  }

  const review = questions.map((question) => {
    const userAnswer = (answers as Record<string, string>)[question.id] ?? null;
    const isCorrect = userAnswer === question.correctAnswer;
    return { ...question, userAnswer, isCorrect, marksAwarded: isCorrect ? question.marks : 0 };
  });
  const score = review.reduce((total, question) => total + question.marksAwarded, 0);
  const total = review.reduce((sum, question) => sum + question.marks, 0);
  const correctCount = review.filter((question) => question.isCorrect).length;
  const incorrectCount = review.filter((question) => question.userAnswer !== null && !question.isCorrect).length;
  const unansweredCount = review.length - correctCount - incorrectCount;
  const percentage = Math.round((score / total) * 100);
  const verdict = percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Strong' : percentage >= 40 ? 'Developing' : 'Needs practice';
  const byTopic = new Map<string, { correct: number; total: number; category: string }>();
  for (const question of review) {
    const current = byTopic.get(question.topic) ?? { correct: 0, total: 0, category: question.category };
    current.total += 1;
    if (question.isCorrect) current.correct += 1;
    byTopic.set(question.topic, current);
  }
  const topicPerformance = [...byTopic].map(([topic, stats]) => ({
    topic,
    category: stats.category,
    correct: stats.correct,
    total: stats.total,
    percentage: Math.round((stats.correct / stats.total) * 100),
  }));
  const categoryPerformance = [...new Set(review.map((question) => question.category))].map((name) => {
    const categoryQuestions = review.filter((question) => question.category === name);
    const correct = categoryQuestions.filter((question) => question.isCorrect).length;
    return { category: name, correct, total: categoryQuestions.length, percentage: Math.round((correct / categoryQuestions.length) * 100) };
  });
  const weakTopics = topicPerformance
    .filter((topic) => topic.percentage < 60)
    .sort((a, b) => a.percentage - b.percentage)
    .map((topic) => topic.topic);
  const recommendations = weakTopics.length
    ? weakTopics.slice(0, 3).map((topic) => ({
        topic,
        action: `Review the explanations for ${topic}, then take a focused practice test on this topic.`,
        priority: 'High',
      }))
    : [{ topic: 'Mixed practice', action: 'Strong work. Try a harder mixed test to keep building accuracy.', priority: 'Medium' }];
  const elapsed = Number.isInteger(timeTakenSeconds) && timeTakenSeconds >= 0
    ? Math.min(timeTakenSeconds, 24 * 60 * 60)
    : 0;
  const userId = (req as any).user.id as string;
  const results = {
    score,
    total,
    percentage,
    verdict,
    correctCount,
    incorrectCount,
    unansweredCount,
    timeTakenSeconds: elapsed,
    weakTopics,
    topicPerformance,
    categoryPerformance,
    recommendations,
    nextBestAction: recommendations[0]?.action ?? 'Keep your daily revision streak going.',
    review,
  };
  let performanceAnalysis = {
    source: 'rule-based fallback',
    classification: verdict,
    note: 'The ML analysis service is unavailable; analysis is based on this test’s actual answers.',
  };
  try {
    const classificationResponse = await fetch(`${mlServiceUrl}/classify-performance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(1500),
      body: JSON.stringify({
        studyHours: 0,
        averageScore: percentage,
        accuracy: percentage,
        attemptRate: 100,
        averageTime: review.length ? elapsed / review.length : 0,
        revisionFrequency: 0,
        mockTestCount: 1,
        topicCoverage: Math.round((new Set(review.map((question) => question.category)).size / questionCategories.length) * 100),
        consistency: percentage,
        difficultyPerformance: percentage,
      }),
    });
    if (!classificationResponse.ok) throw new Error(`ML service returned ${classificationResponse.status}.`);
    const classification = await classificationResponse.json() as { classification?: string };
    if (!classification.classification) throw new Error('ML service returned no classification.');
    performanceAnalysis = {
      source: 'ExamIQ ML service',
      classification: classification.classification,
      note: 'Performance classification is based on this test’s actual score and topic coverage.',
    };
  } catch (error) {
    console.warn('Mock-test ML analysis unavailable; using rule-based analysis.', error);
  }
  const attemptId = saveMockTestAttempt(database, {
    userId,
    category: typeof category === 'string' ? category : 'Mixed',
    difficulty: typeof difficulty === 'string' ? difficulty : 'Mixed',
    score,
    total,
    percentage,
    correctCount,
    incorrectCount,
    unansweredCount,
    timeTakenSeconds: elapsed,
    resultJson: JSON.stringify({ ...results, performanceAnalysis }),
  });

  for (const topic of topicPerformance) {
    upsertTopicMastery(database, {
      userId,
      topic: topic.topic,
      mastery: topic.percentage,
      attempts: 1,
      accuracy: topic.percentage,
    });
  }
  savePracticeAttempt(database, {
    userId,
    score: correctCount,
    total: review.length,
    percentage,
    verdict,
    weaknesses: weakTopics.join(', '),
  });
  res.status(201).json({ ...results, performanceAnalysis, attemptId });
});

app.get('/api/dashboard', (_req, res) => {
  res.redirect('/api/student/dashboard');
});

const isDirectExecution = typeof process.argv[1] === 'string' && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  app.listen(port, () => {
    console.log(`ExamIQ backend running on http://localhost:${port}`);
  });
}
