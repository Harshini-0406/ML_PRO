import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { questionBank } from './questionBank.js';

export type DbUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
};

export type PracticeAttempt = {
  id?: number;
  userId: string;
  score: number;
  total: number;
  percentage: number;
  verdict: string;
  weaknesses: string;
  createdAt?: string;
};

export type StudyPlanItem = {
  id?: number;
  userId: string;
  day: string;
  title: string;
  detail: string;
  durationMinutes: number;
  completed?: boolean;
  createdAt?: string;
};

export type TopicMastery = {
  id?: number;
  userId: string;
  topic: string;
  mastery: number;
  attempts: number;
  accuracy: number;
  updatedAt?: string;
};

export type StudentProfile = {
  id?: number;
  userId: string;
  examTarget: string;
  preferredStudyHours: number;
  dailyGoal: string;
  learningStyle: string;
  reminderPreference: string;
  updatedAt?: string;
};

export type MockTestAttempt = {
  userId: string;
  category: string;
  difficulty: string;
  score: number;
  total: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeTakenSeconds: number;
  resultJson: string;
};

export const initializeDatabase = (
  dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'examiq.db')
) => {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const database = new DatabaseSync(dbPath);
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student'
    );

    CREATE TABLE IF NOT EXISTS practice_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      percentage INTEGER NOT NULL,
      verdict TEXT NOT NULL,
      weaknesses TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS study_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      day TEXT NOT NULL,
      title TEXT NOT NULL,
      detail TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS topic_mastery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      topic TEXT NOT NULL,
      mastery INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 1,
      accuracy INTEGER NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, topic),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS student_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL UNIQUE,
      exam_target TEXT NOT NULL,
      preferred_study_hours INTEGER NOT NULL,
      daily_goal TEXT NOT NULL,
      learning_style TEXT NOT NULL,
      reminder_preference TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS mock_test_questions (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      topic TEXT NOT NULL,
      difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
      prompt TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      explanation TEXT NOT NULL,
      marks INTEGER NOT NULL DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_mock_test_questions_filters
      ON mock_test_questions(category, difficulty);

    CREATE TABLE IF NOT EXISTS mock_test_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      percentage INTEGER NOT NULL,
      correct_count INTEGER NOT NULL,
      incorrect_count INTEGER NOT NULL,
      unanswered_count INTEGER NOT NULL,
      time_taken_seconds INTEGER NOT NULL,
      result_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS revision_mistake_states (
      user_id TEXT NOT NULL,
      attempt_id INTEGER NOT NULL,
      question_id TEXT NOT NULL,
      reviewed INTEGER NOT NULL DEFAULT 0,
      dismissed INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, attempt_id, question_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (attempt_id) REFERENCES mock_test_attempts(id) ON DELETE CASCADE
    );
  `);
  const studyPlanColumns = database.prepare('PRAGMA table_info(study_plans)').all() as Array<{ name: string }>;
  if (!studyPlanColumns.some((column) => column.name === 'completed')) {
    database.exec('ALTER TABLE study_plans ADD COLUMN completed INTEGER NOT NULL DEFAULT 0');
  }

  const insertQuestion = database.prepare(`
    INSERT OR IGNORE INTO mock_test_questions
      (id, category, topic, difficulty, prompt, options, correct_answer, explanation, marks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const question of questionBank) {
    insertQuestion.run(
      question.id,
      question.category,
      question.topic,
      question.difficulty,
      question.prompt,
      JSON.stringify(question.options),
      question.correctAnswer,
      question.explanation,
      question.marks,
    );
  }

  return database;
};

export const getMockTestQuestions = (
  database: DatabaseSync,
  filters: { category?: string; difficulty?: string; questionIds?: string[]; limit?: number } = {},
) => {
  const conditions: string[] = [];
  const parameters: Array<string | number> = [];
  if (filters.category) {
    conditions.push('category = ?');
    parameters.push(filters.category);
  }
  if (filters.difficulty) {
    conditions.push('difficulty = ?');
    parameters.push(filters.difficulty);
  }
  if (filters.questionIds) {
    if (filters.questionIds.length === 0) return [];
    conditions.push(`id IN (${filters.questionIds.map(() => '?').join(', ')})`);
    parameters.push(...filters.questionIds);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limitClause = filters.limit ? 'LIMIT ?' : '';
  if (filters.limit) parameters.push(filters.limit);
  const rows = database.prepare(`
    SELECT id, category, topic, difficulty, prompt, options,
      correct_answer AS correctAnswer, explanation, marks
    FROM mock_test_questions ${where}
    ORDER BY id ${limitClause}
  `).all(...parameters) as Array<{
    id: string; category: string; topic: string; difficulty: string; prompt: string;
    options: string; correctAnswer: string; explanation: string; marks: number;
  }>;
  return rows.map((row) => ({
    ...row,
    options: JSON.parse(row.options) as [string, string, string, string],
  }));
};

export const saveMockTestAttempt = (database: DatabaseSync, attempt: MockTestAttempt) => {
  const result = database.prepare(`
    INSERT INTO mock_test_attempts
      (user_id, category, difficulty, score, total, percentage, correct_count,
       incorrect_count, unanswered_count, time_taken_seconds, result_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    attempt.userId,
    attempt.category,
    attempt.difficulty,
    attempt.score,
    attempt.total,
    attempt.percentage,
    attempt.correctCount,
    attempt.incorrectCount,
    attempt.unansweredCount,
    attempt.timeTakenSeconds,
    attempt.resultJson,
  );
  return Number(result.lastInsertRowid);
};

export const getMockTestAttemptsByUser = (database: DatabaseSync, userId: string) => {
  const rows = database.prepare(`
    SELECT id, category, difficulty, score, total, percentage, correct_count AS correctCount,
      incorrect_count AS incorrectCount, unanswered_count AS unansweredCount,
      time_taken_seconds AS timeTakenSeconds, created_at AS createdAt
    FROM mock_test_attempts
    WHERE user_id = ?
    ORDER BY created_at DESC, id DESC
    LIMIT 20
  `).all(userId) as Array<{
    id: number; category: string; difficulty: string; score: number; total: number;
    percentage: number; correctCount: number; incorrectCount: number;
    unansweredCount: number; timeTakenSeconds: number; createdAt: string;
  }>;
  return rows;
};

export const getMockTestAttemptResults = (database: DatabaseSync, userId: string) => {
  const rows = database.prepare(`
    SELECT id, result_json AS resultJson
    FROM mock_test_attempts
    WHERE user_id = ?
    ORDER BY created_at DESC, id DESC
    LIMIT 20
  `).all(userId) as Array<{ id: number; resultJson: string }>;
  return rows.map((row) => ({ id: row.id, ...JSON.parse(row.resultJson) as Record<string, unknown> }));
};

export type RevisionMistakeStateChange = {
  reviewed?: boolean;
  dismissed?: boolean;
};

export const getRevisionMistakesByUser = (database: DatabaseSync, userId: string) => {
  const attempts = database.prepare(`
    SELECT a.id AS attemptId, a.created_at AS attemptedAt, a.result_json AS resultJson
    FROM mock_test_attempts a
    WHERE a.user_id = ?
    ORDER BY a.created_at DESC, a.id DESC
    LIMIT 1000
  `).all(userId) as Array<{
    attemptId: number;
    attemptedAt: string;
    resultJson: string;
  }>;
  const states = database.prepare(`
    SELECT attempt_id AS attemptId, question_id AS questionId, reviewed, dismissed
    FROM revision_mistake_states
    WHERE user_id = ?
  `).all(userId) as Array<{ attemptId: number; questionId: string; reviewed: number; dismissed: number }>;
  const stateByMistake = new Map(states.map((state) => [`${state.attemptId}:${state.questionId}`, state]));

  return attempts.flatMap((attempt) => {
    const result = JSON.parse(attempt.resultJson) as {
      review?: Array<{
        id: string;
        category: string;
        topic: string;
        prompt: string;
        userAnswer: string | null;
        correctAnswer: string;
        explanation: string;
        isCorrect: boolean;
      }>;
    };
    return (result.review ?? [])
      .filter((question) => question.userAnswer !== null && !question.isCorrect)
      .flatMap((question) => {
        const state = stateByMistake.get(`${attempt.attemptId}:${question.id}`);
        if (state?.dismissed) return [];
        return [{
          ...question,
          mistakeKey: `${attempt.attemptId}:${question.id}`,
          attemptId: attempt.attemptId,
          attemptedAt: attempt.attemptedAt,
          reviewed: Boolean(state?.reviewed),
        }];
      });
  });
};

export const updateRevisionMistakeState = (
  database: DatabaseSync,
  userId: string,
  attemptId: number,
  questionId: string,
  change: RevisionMistakeStateChange,
) => {
  const attempt = database.prepare(`
    SELECT result_json AS resultJson
    FROM mock_test_attempts
    WHERE id = ? AND user_id = ?
  `).get(attemptId, userId) as { resultJson: string } | undefined;
  if (!attempt) return false;

  const result = JSON.parse(attempt.resultJson) as {
    review?: Array<{ id: string; userAnswer: string | null; isCorrect: boolean }>;
  };
  const isMistake = result.review?.some(
    (question) => question.id === questionId && question.userAnswer !== null && !question.isCorrect,
  );
  if (!isMistake) return false;

  database.prepare(`
    INSERT INTO revision_mistake_states (user_id, attempt_id, question_id, reviewed, dismissed)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, attempt_id, question_id) DO UPDATE SET
      reviewed = COALESCE(?, revision_mistake_states.reviewed),
      dismissed = COALESCE(?, revision_mistake_states.dismissed),
      updated_at = CURRENT_TIMESTAMP
  `).run(
    userId,
    attemptId,
    questionId,
    change.reviewed ? 1 : 0,
    change.dismissed ? 1 : 0,
    change.reviewed === undefined ? null : Number(change.reviewed),
    change.dismissed === undefined ? null : Number(change.dismissed),
  );
  return true;
};

export const createUser = (database: DatabaseSync, user: DbUser) => {
  database
    .prepare(
      `INSERT INTO users (id, name, email, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(user.id, user.name, user.email, user.passwordHash, user.role);

  return user;
};

export const getUserByEmail = (database: DatabaseSync, email: string) => {
  const row = database
    .prepare(
      `SELECT id, name, email, password_hash AS passwordHash, role
       FROM users
       WHERE LOWER(email) = LOWER(?)`,
    )
    .get(email) as
    | { id: string; name: string; email: string; passwordHash: string; role: string }
    | undefined;

  return row ?? null;
};

export const getUserById = (database: DatabaseSync, id: string) => {
  const row = database
    .prepare(
      `SELECT id, name, email, password_hash AS passwordHash, role
       FROM users
       WHERE id = ?`,
    )
    .get(id) as
    | { id: string; name: string; email: string; passwordHash: string; role: string }
    | undefined;

  return row ?? null;
};

export const listUsers = (database: DatabaseSync): DbUser[] => {
  const rows = database
    .prepare(
      `SELECT id, name, email, password_hash AS passwordHash, role
       FROM users`,
    )
    .all() as Array<{ id: string; name: string; email: string; passwordHash: string; role: string }>;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role,
  }));
};

export const savePracticeAttempt = (database: DatabaseSync, attempt: PracticeAttempt) => {
  database
    .prepare(
      `INSERT INTO practice_attempts (user_id, score, total, percentage, verdict, weaknesses)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(attempt.userId, attempt.score, attempt.total, attempt.percentage, attempt.verdict, attempt.weaknesses ?? '');

  return attempt;
};

export const getPracticeAttemptsByUser = (database: DatabaseSync, userId: string): PracticeAttempt[] => {
  const rows = database
    .prepare(
      `SELECT id, user_id AS userId, score, total, percentage, verdict, weaknesses, created_at AS createdAt
       FROM practice_attempts
       WHERE user_id = ?
       ORDER BY created_at DESC`,
    )
    .all(userId) as Array<{
      id: number;
      userId: string;
      score: number;
      total: number;
      percentage: number;
      verdict: string;
      weaknesses: string;
      createdAt: string;
    }>;

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    score: row.score,
    total: row.total,
    percentage: row.percentage,
    verdict: row.verdict,
    weaknesses: row.weaknesses,
    createdAt: row.createdAt,
  }));
};

export const saveStudyPlan = (database: DatabaseSync, plan: StudyPlanItem) => {
  const result = database
    .prepare(
      `INSERT INTO study_plans (user_id, day, title, detail, duration_minutes)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(plan.userId, plan.day, plan.title, plan.detail, plan.durationMinutes);

  return { ...plan, id: Number(result.lastInsertRowid), completed: false };
};

export const getStudyPlansByUser = (database: DatabaseSync, userId: string): StudyPlanItem[] => {
  const rows = database
    .prepare(
      `SELECT id, user_id AS userId, day, title, detail, duration_minutes AS durationMinutes,
        completed, created_at AS createdAt
       FROM study_plans
       WHERE user_id = ?
       ORDER BY day ASC, id ASC`,
    )
    .all(userId) as Array<{
      id: number;
      userId: string;
      day: string;
      title: string;
      detail: string;
      durationMinutes: number;
      completed: number;
      createdAt: string;
    }>;

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    day: row.day,
    title: row.title,
    detail: row.detail,
    durationMinutes: row.durationMinutes,
    completed: Boolean(row.completed),
    createdAt: row.createdAt,
  }));
};

export const updateStudyPlan = (
  database: DatabaseSync,
  userId: string,
  planId: number,
  changes: Omit<StudyPlanItem, 'id' | 'userId' | 'createdAt'>,
) => {
  const result = database.prepare(`
    UPDATE study_plans
    SET day = ?, title = ?, detail = ?, duration_minutes = ?, completed = ?
    WHERE id = ? AND user_id = ?
  `).run(
    changes.day,
    changes.title,
    changes.detail,
    changes.durationMinutes,
    Number(changes.completed ?? false),
    planId,
    userId,
  );
  return Number(result.changes) > 0;
};

export const deleteStudyPlan = (database: DatabaseSync, userId: string, planId: number) => {
  const result = database.prepare('DELETE FROM study_plans WHERE id = ? AND user_id = ?').run(planId, userId);
  return Number(result.changes) > 0;
};

export const upsertTopicMastery = (database: DatabaseSync, mastery: TopicMastery) => {
  const existing = database
    .prepare(
      `SELECT id, user_id AS userId, topic, mastery, attempts, accuracy, updated_at AS updatedAt
       FROM topic_mastery
       WHERE user_id = ? AND topic = ?`,
    )
    .get(mastery.userId, mastery.topic) as
    | { id: number; userId: string; topic: string; mastery: number; attempts: number; accuracy: number; updatedAt: string }
    | undefined;

  if (existing) {
    const nextAttempts = existing.attempts + (mastery.attempts ?? 1);
    const combinedMastery = Math.round(((existing.mastery * existing.attempts) + (mastery.mastery * (mastery.attempts ?? 1))) / nextAttempts);
    const combinedAccuracy = Math.round(((existing.accuracy * existing.attempts) + (mastery.accuracy * (mastery.attempts ?? 1))) / nextAttempts);

    database
      .prepare(
        `UPDATE topic_mastery
         SET mastery = ?, attempts = ?, accuracy = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .run(combinedMastery, nextAttempts, combinedAccuracy, existing.id);

    return {
      ...mastery,
      id: existing.id,
      mastery: combinedMastery,
      attempts: nextAttempts,
      accuracy: combinedAccuracy,
    };
  }

  database
    .prepare(
      `INSERT INTO topic_mastery (user_id, topic, mastery, attempts, accuracy)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(mastery.userId, mastery.topic, mastery.mastery, mastery.attempts ?? 1, mastery.accuracy ?? mastery.mastery);

  return mastery;
};

export const getTopicMasteryByUser = (database: DatabaseSync, userId: string): TopicMastery[] => {
  const rows = database
    .prepare(
      `SELECT id, user_id AS userId, topic, mastery, attempts, accuracy, updated_at AS updatedAt
       FROM topic_mastery
       WHERE user_id = ?
       ORDER BY mastery DESC, topic ASC`,
    )
    .all(userId) as Array<{
      id: number;
      userId: string;
      topic: string;
      mastery: number;
      attempts: number;
      accuracy: number;
      updatedAt: string;
    }>;

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    topic: row.topic,
    mastery: row.mastery,
    attempts: row.attempts,
    accuracy: row.accuracy,
    updatedAt: row.updatedAt,
  }));
};

export const saveStudentProfile = (database: DatabaseSync, profile: StudentProfile) => {
  const existing = database
    .prepare(
      `SELECT id FROM student_profile WHERE user_id = ?`,
    )
    .get(profile.userId) as { id: number } | undefined;

  if (existing) {
    database
      .prepare(
        `UPDATE student_profile
         SET exam_target = ?, preferred_study_hours = ?, daily_goal = ?, learning_style = ?, reminder_preference = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .run(
        profile.examTarget,
        profile.preferredStudyHours,
        profile.dailyGoal,
        profile.learningStyle,
        profile.reminderPreference,
        existing.id,
      );

    return profile;
  }

  database
    .prepare(
      `INSERT INTO student_profile (user_id, exam_target, preferred_study_hours, daily_goal, learning_style, reminder_preference)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      profile.userId,
      profile.examTarget,
      profile.preferredStudyHours,
      profile.dailyGoal,
      profile.learningStyle,
      profile.reminderPreference,
    );

  return profile;
};

export const getStudentProfileByUser = (database: DatabaseSync, userId: string): StudentProfile | null => {
  const row = database
    .prepare(
      `SELECT id, user_id AS userId, exam_target AS examTarget, preferred_study_hours AS preferredStudyHours, daily_goal AS dailyGoal, learning_style AS learningStyle, reminder_preference AS reminderPreference, updated_at AS updatedAt
       FROM student_profile
       WHERE user_id = ?`,
    )
    .get(userId) as
    | { id: number; userId: string; examTarget: string; preferredStudyHours: number; dailyGoal: string; learningStyle: string; reminderPreference: string; updatedAt: string }
    | undefined;

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.userId,
    examTarget: row.examTarget,
    preferredStudyHours: row.preferredStudyHours,
    dailyGoal: row.dailyGoal,
    learningStyle: row.learningStyle,
    reminderPreference: row.reminderPreference,
    updatedAt: row.updatedAt,
  };
};
