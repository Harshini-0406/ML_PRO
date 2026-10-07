import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pathToFileURL } from 'node:url';

import {
  createUser,
  getPracticeAttemptsByUser,
  getStudyPlansByUser,
  getUserByEmail,
  getUserById,
  initializeDatabase,
  listUsers,
  savePracticeAttempt,
  saveStudyPlan,
  upsertTopicMastery,
  getTopicMasteryByUser,
  saveStudentProfile,
  getStudentProfileByUser,
} from './db.js';

dotenv.config();

export const app = express();
const port = Number(process.env.PORT ?? 4000);
const database = initializeDatabase();
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
const mockQuestionSet = [
  {
    id: 'q1',
    category: 'Quantitative Aptitude',
    difficulty: 'Easy',
    prompt: 'If a train travels 180 km in 3 hours, what is its average speed?',
    options: ['45 km/h', '50 km/h', '60 km/h', '75 km/h'],
    correctAnswer: '60 km/h',
    explanation: 'Average speed is total distance divided by total time: 180 ÷ 3 = 60 km/h.',
  },
  {
    id: 'q2',
    category: 'Reasoning',
    difficulty: 'Medium',
    prompt: 'Which number comes next in the sequence: 2, 6, 12, 20, 30, ?',
    options: ['36', '40', '42', '48'],
    correctAnswer: '42',
    explanation: 'The sequence follows n(n + 1): 1×2, 2×3, 3×4, 4×5, 5×6, so the next is 6×7 = 42.',
  },
  {
    id: 'q3',
    category: 'Data Interpretation',
    difficulty: 'Medium',
    prompt: 'A student scored 80, 75, 90, and 85 in four tests. What is the average score?',
    options: ['80', '83', '85', '87'],
    correctAnswer: '83',
    explanation: 'Total = 330; 330 ÷ 4 = 82.5, which rounds to 83 in this quiz context.',
  },
  {
    id: 'q4',
    category: 'Verbal Ability',
    difficulty: 'Easy',
    prompt: 'Choose the best synonym for the word “meticulous.”',
    options: ['Careless', 'Precise', 'Quick', 'Loud'],
    correctAnswer: 'Precise',
    explanation: 'Meticulous means showing great attention to detail, which aligns closely with precise.',
  },
  {
    id: 'q5',
    category: 'General Awareness',
    difficulty: 'Medium',
    prompt: 'Which of the following is the capital of Karnataka?',
    options: ['Hyderabad', 'Chennai', 'Bengaluru', 'Pune'],
    correctAnswer: 'Bengaluru',
    explanation: 'Bengaluru is the capital city of Karnataka.',
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

const buildWeeklyStudyPlan = (weakArea: string, strongArea: string) => [
  {
    day: 'Monday',
    title: `${weakArea} Foundation`,
    detail: `Solve 12 focused ${weakArea.toLowerCase()} questions and review every mistaken step.`,
    durationMinutes: 35,
  },
  {
    day: 'Tuesday',
    title: 'Mistake Review Sprint',
    detail: `Revisit the mistakes from your last mock test and build a quick error log for ${weakArea.toLowerCase()}.`,
    durationMinutes: 30,
  },
  {
    day: 'Wednesday',
    title: `${strongArea} Confidence Block`,
    detail: `Keep your strongest area active with a high-confidence practice set to maintain momentum.`,
    durationMinutes: 25,
  },
  {
    day: 'Thursday',
    title: `${weakArea} Timed Drill`,
    detail: `Attempt a timed set of mixed questions and track speed, accuracy, and hesitation.`,
    durationMinutes: 40,
  },
  {
    day: 'Friday',
    title: 'Concept Recap',
    detail: `Create a short revision sheet of formulas, patterns, and rules for ${weakArea.toLowerCase()}.`,
    durationMinutes: 20,
  },
  {
    day: 'Saturday',
    title: 'Mock Test Simulation',
    detail: `Take a mini mock test with a focus on sustained accuracy and question prioritization.`,
    durationMinutes: 45,
  },
  {
    day: 'Sunday',
    title: 'Recovery + Reflection',
    detail: `Review your week, pick one improvement goal, and set the next cycle for ${weakArea.toLowerCase()}.`,
    durationMinutes: 20,
  },
];

const authMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ message: 'Authentication required.' });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? 'examiq-dev-secret') as {
      sub: string;
      email: string;
      role: string;
    };

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
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
    : 82;
  const latestAttempt = attempts[0];
  const readiness = latestAttempt ? Math.min(100, Math.max(0, Math.round((latestAttempt.percentage + averagePercentage) / 2))) : 82;
  const successProbability = latestAttempt ? Math.min(99, Math.max(0, Math.round((latestAttempt.percentage + averagePercentage) / 2 + 4))) : 91;
  const weakArea = latestAttempt && latestAttempt.weaknesses
    ? latestAttempt.weaknesses.split(', ').find(Boolean) ?? 'Quantitative Aptitude'
    : 'Quantitative Aptitude';
  const strongArea = 'Logical Reasoning';
  const recentTrend = attempts.length
    ? attempts.slice(0, 7).map((attempt) => attempt.percentage).reverse()
    : [62, 68, 71, 75, 78, 84, 86];
  const normalizedTrend = recentTrend.length < 7
    ? [...Array(7 - recentTrend.length).fill(68), ...recentTrend]
    : recentTrend;
  const weeklyStudyHours = Number((attempts.length * 4.5 + 12).toFixed(1));
  const averageAccuracy = attempts.length
    ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length)
    : 78;

  const upcomingPlan = [
    { title: 'Targeted revision', detail: `${weakArea} deep drill`, time: '30 min' },
    { title: 'Mock test', detail: 'Full reasoning review', time: '45 min' },
    { title: 'Concept recap', detail: `${strongArea} summaries`, time: '25 min' },
  ];

  const subjectProgress = [
    { subject: 'Quant', progress: Math.max(55, Math.min(96, averagePercentage + 6)), trend: `${attempts.length ? '+8%' : '+12%'}` },
    { subject: 'Reasoning', progress: Math.max(60, Math.min(99, averagePercentage + 10)), trend: `${attempts.length ? '+10%' : '+16%'}` },
    { subject: 'English', progress: Math.max(50, Math.min(95, averagePercentage - 3)), trend: `${attempts.length ? '+6%' : '+8%'}` },
    { subject: 'Polity', progress: Math.max(52, Math.min(97, averagePercentage + 4)), trend: `${attempts.length ? '+8%' : '+10%'}` },
  ];

  const focusAreas = topicMastery.length > 0
    ? topicMastery.slice(0, 4).map((item) => item.topic)
    : [weakArea, 'Arithmetic', 'Data Interpretation', 'Current Affairs'];
  const generatedPlan = buildWeeklyStudyPlan(weakArea, strongArea);
  const savedPlan = getStudyPlansByUser(database, user.id);

  if (savedPlan.length === 0) {
    for (const item of generatedPlan) {
      saveStudyPlan(database, {
        userId: user.id,
        day: item.day,
        title: item.title,
        detail: item.detail,
        durationMinutes: item.durationMinutes,
      });
    }
  }

  const finalPlan = savedPlan.length > 0
    ? savedPlan.map((item) => ({
        title: item.title,
        detail: item.detail,
        time: `${item.durationMinutes} min`,
      }))
    : generatedPlan.map((item) => ({
        title: item.title,
        detail: item.detail,
        time: `${item.durationMinutes} min`,
      }));

  res.json({
    studentName: user.name,
    examTarget: studentProfile.examTarget,
    readiness,
    predictedScore: Math.min(100, Math.max(0, Math.round((averagePercentage + readiness) / 2))),
    successProbability,
    streakDays: Math.max(5, attempts.length * 3 + 7),
    averageAccuracy,
    weeklyStudyHours: Number(studentProfile.preferredStudyHours ?? weeklyStudyHours),
    weakArea,
    strongArea,
    nextBestAction: `Revise ${weakArea} with a 30-minute focused drill and two quick recap sets.`,
    upcomingPlan: finalPlan,
    subjectProgress,
    weeklyTrend: normalizedTrend,
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

app.get('/api/mock-test', authMiddleware, (_req, res) => {
  res.json(mockQuestionSet);
});

app.post('/api/mock-test/submit', authMiddleware, (req, res) => {
  const submittedAnswers = req.body?.answers ?? {};
  const totalQuestions = mockQuestionSet.length;
  let correctCount = 0;

  for (const question of mockQuestionSet) {
    if (String(submittedAnswers[question.id] ?? '') === question.correctAnswer) {
      correctCount += 1;
    }
  }

  const percentage = Math.round((correctCount / totalQuestions) * 100);
  const verdict = percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Strong' : percentage >= 40 ? 'Developing' : 'Weak';

  const weakTopics = mockQuestionSet
    .filter((question) => String(submittedAnswers[question.id] ?? '') !== question.correctAnswer)
    .map((question) => question.category)
    .slice(0, 3);

  const recommendations = weakTopics.length
    ? weakTopics.map((topic) => ({
        topic,
        action: `Revise ${topic} with a focused 25-minute practice block and a quick recap of the key formulas.`,
        priority: 'High',
      }))
    : [
        {
          topic: 'General Revision',
          action: 'Maintain momentum by revising your strongest area and targeting a consistent daily practice routine.',
          priority: 'Medium',
        },
      ];

  const userId = (req as any).user?.id as string | undefined;
  const topicPerformance = new Map<string, { correct: number; total: number }>();

  for (const question of mockQuestionSet) {
    const current = topicPerformance.get(question.category) ?? { correct: 0, total: 0 };
    current.total += 1;
    if (String(submittedAnswers[question.id] ?? '') === question.correctAnswer) {
      current.correct += 1;
    }
    topicPerformance.set(question.category, current);
  }

  for (const [topic, stats] of topicPerformance.entries()) {
    const mastery = Math.round((stats.correct / stats.total) * 100);
    upsertTopicMastery(database, {
      userId: userId ?? 'anonymous',
      topic,
      mastery,
      attempts: 1,
      accuracy: mastery,
    });
  }

  savePracticeAttempt(database, {
    userId: userId ?? 'anonymous',
    score: correctCount,
    total: totalQuestions,
    percentage,
    verdict,
    weaknesses: weakTopics.join(', '),
  });

  res.json({
    score: correctCount,
    total: totalQuestions,
    percentage,
    verdict,
    weakTopics,
    recommendations,
    nextBestAction: recommendations[0]?.action ?? 'Keep your daily revision streak going.',
  });
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
