import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

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

export const initializeDatabase = (dbPath = path.join(process.cwd(), 'data', 'examiq.db')) => {
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
  `);

  return database;
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
  database
    .prepare(
      `INSERT INTO study_plans (user_id, day, title, detail, duration_minutes)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(plan.userId, plan.day, plan.title, plan.detail, plan.durationMinutes);

  return plan;
};

export const getStudyPlansByUser = (database: DatabaseSync, userId: string): StudyPlanItem[] => {
  const rows = database
    .prepare(
      `SELECT id, user_id AS userId, day, title, detail, duration_minutes AS durationMinutes, created_at AS createdAt
       FROM study_plans
       WHERE user_id = ?
       ORDER BY created_at ASC`,
    )
    .all(userId) as Array<{
      id: number;
      userId: string;
      day: string;
      title: string;
      detail: string;
      durationMinutes: number;
      createdAt: string;
    }>;

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    day: row.day,
    title: row.title,
    detail: row.detail,
    durationMinutes: row.durationMinutes,
    createdAt: row.createdAt,
  }));
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
