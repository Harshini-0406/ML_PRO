import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  initializeDatabase,
  createUser,
  getUserByEmail,
  getPracticeAttemptsByUser,
  savePracticeAttempt,
  saveStudyPlan,
  getStudyPlansByUser,
  upsertTopicMastery,
  getTopicMasteryByUser,
  saveStudentProfile,
  getStudentProfileByUser,
} from '../src/db';

test('database layer persists users and attempt history', () => {
  const testDbPath = path.join(process.cwd(), 'data', 'examiq-test.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  const database = initializeDatabase(testDbPath);
  const user = createUser(database, {
    id: 'user-123',
    name: 'Test Student',
    email: 'student@example.com',
    passwordHash: 'hash-123',
    role: 'student',
  });

  const loadedUser = getUserByEmail(database, 'student@example.com');
  assert.ok(loadedUser);
  assert.equal(loadedUser?.name, 'Test Student');

  savePracticeAttempt(database, {
    userId: user.id,
    score: 4,
    total: 5,
    percentage: 80,
    verdict: 'Excellent',
    weaknesses: 'Quantitative Aptitude',
  });

  const attempts = database.prepare('SELECT COUNT(*) as count FROM practice_attempts WHERE user_id = ?').get(user.id) as { count: number };
  assert.equal(attempts.count, 1);

  const savedAttempts = getPracticeAttemptsByUser(database, user.id);
  assert.equal(savedAttempts.length, 1);
  assert.equal(savedAttempts[0]?.percentage, 80);

  saveStudyPlan(database, {
    userId: user.id,
    day: 'Monday',
    title: 'Quantitative Aptitude Drill',
    detail: 'Solve 12 arithmetic and probability questions',
    durationMinutes: 35,
  });

  const studyPlans = getStudyPlansByUser(database, user.id);
  assert.equal(studyPlans.length, 1);
  assert.equal(studyPlans[0]?.title, 'Quantitative Aptitude Drill');

  upsertTopicMastery(database, {
    userId: user.id,
    topic: 'Quantitative Aptitude',
    mastery: 82,
    attempts: 1,
    accuracy: 82,
  });

  const topicMastery = getTopicMasteryByUser(database, user.id);
  assert.equal(topicMastery.length, 1);
  assert.equal(topicMastery[0]?.topic, 'Quantitative Aptitude');
  assert.equal(topicMastery[0]?.mastery, 82);

  saveStudentProfile(database, {
    userId: user.id,
    examTarget: 'UPSC CSE 2027',
    preferredStudyHours: 18,
    dailyGoal: 'Quant + reasoning focus',
    learningStyle: 'Goal-oriented',
    reminderPreference: 'Evening',
  });

  const profile = getStudentProfileByUser(database, user.id);
  assert.ok(profile);
  assert.equal(profile?.examTarget, 'UPSC CSE 2027');
  assert.equal(profile?.preferredStudyHours, 18);

  database.close();
  fs.unlinkSync(testDbPath);
});
