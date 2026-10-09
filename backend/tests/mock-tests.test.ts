import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import jwt from 'jsonwebtoken';

import { questionBank, questionCategories } from '../src/questionBank.ts';

const testDbPath = path.join(process.cwd(), 'data', `examiq-mock-tests-${process.pid}.db`);
process.env.DATABASE_PATH = testDbPath;
const { app, closeDatabase } = await import('../src/index.ts');
const server = app.listen(0);

const getServerUrl = () => {
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Server did not bind to a port');
  return `http://127.0.0.1:${address.port}`;
};

let token = '';

test('question bank has at least 100 complete questions across the requested categories', () => {
  assert.ok(questionBank.length >= 100);
  assert.deepEqual(questionCategories, [
    'Quantitative Aptitude',
    'Logical Reasoning',
    'Verbal Ability and English',
    'Data Structures and Algorithms',
    'Programming and Coding',
    'Computer Science Fundamentals',
    'General Knowledge and Current Affairs',
    'Placement Preparation',
  ]);
  for (const category of questionCategories) {
    const questions = questionBank.filter((question) => question.category === category);
    assert.ok(questions.length >= 12, `${category} should have a well-populated bank`);
  }
  for (const question of questionBank) {
    assert.equal(question.options.length, 4, question.id);
    assert.ok(question.options.includes(question.correctAnswer), question.id);
    assert.ok(question.prompt.length > 0 && question.explanation.length > 0, question.id);
    assert.ok(['Beginner', 'Intermediate', 'Advanced'].includes(question.difficulty), question.id);
    assert.ok(question.topic.length > 0 && question.marks > 0, question.id);
  }
});

test('mock-test endpoints load questions, grade the selected test, and persist history', async () => {
  const register = await fetch(`${getServerUrl()}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Mock Test Student',
      email: `mock-test-${process.pid}@example.com`,
      password: 'sample-password-123',
    }),
  });
  assert.equal(register.status, 201);
  token = (await register.json() as { token: string }).token;
  const authorization = { Authorization: `Bearer ${token}` };

  const staleToken = jwt.sign(
    { sub: 'deleted-user', email: 'deleted@example.com', role: 'student' },
    process.env.JWT_SECRET ?? 'examiq-dev-secret',
  );
  const staleHeaders = new Headers();
  staleHeaders.set('Authorization', ['Bearer', staleToken].join(' '));
  const staleSessionResponse = await fetch(`${getServerUrl()}/api/mock-test/categories`, {
    headers: staleHeaders,
  });
  assert.equal(staleSessionResponse.status, 401);
  assert.match((await staleSessionResponse.json() as { message: string }).message, /account.*no longer exists/i);

  const categoriesResponse = await fetch(`${getServerUrl()}/api/mock-test/categories`, { headers: authorization });
  assert.equal(categoriesResponse.status, 200);
  assert.deepEqual(await categoriesResponse.json(), questionCategories);

  const loadResponse = await fetch(
    `${getServerUrl()}/api/mock-test?category=Quantitative%20Aptitude&difficulty=Beginner&count=3&durationMinutes=1`,
    { headers: authorization },
  );
  assert.equal(loadResponse.status, 200);
  const loaded = await loadResponse.json() as {
    questions: Array<{ id: string; options: string[]; correctAnswer?: string; explanation?: string }>;
    durationSeconds: number;
  };
  assert.equal(loaded.questions.length, 3);
  assert.equal(loaded.durationSeconds, 60);
  assert.ok(loaded.questions.every((question) => question.options.length === 4));
  assert.ok(loaded.questions.every((question) => question.correctAnswer === undefined && question.explanation === undefined));

  const invalidDuration = await fetch(
    `${getServerUrl()}/api/mock-test?count=3&durationMinutes=0`,
    { headers: authorization },
  );
  assert.equal(invalidDuration.status, 400);

  const first = questionBank[0]!;
  const second = questionBank[1]!;
  const submission = await fetch(`${getServerUrl()}/api/mock-test/submit`, {
    method: 'POST',
    headers: { ...authorization, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      questionIds: [first.id, second.id],
      answers: {
        [first.id]: first.correctAnswer,
        [second.id]: second.options.find((option) => option !== second.correctAnswer),
      },
      category: 'Quantitative Aptitude',
      difficulty: 'Beginner',
      timeTakenSeconds: 42,
    }),
  });
  assert.equal(submission.status, 201);
  const result = await submission.json() as {
    attemptId: number; score: number; total: number; percentage: number;
    correctCount: number; incorrectCount: number; unansweredCount: number;
    review: Array<{ correctAnswer: string; explanation: string; isCorrect: boolean }>;
  };
  assert.equal(result.score, 1);
  assert.equal(result.total, 2);
  assert.equal(result.percentage, 50);
  assert.equal(result.correctCount, 1);
  assert.equal(result.incorrectCount, 1);
  assert.equal(result.unansweredCount, 0);
  assert.equal(result.review.length, 2);
  assert.ok(result.review.every((question) => question.correctAnswer && question.explanation));

  const mistakesResponse = await fetch(`${getServerUrl()}/api/revision/mistakes`, { headers: authorization });
  assert.equal(mistakesResponse.status, 200);
  const mistakes = await mistakesResponse.json() as {
    mistakes: Array<{ id: string; mistakeKey: string; attemptId: number; userAnswer: string; correctAnswer: string; explanation: string; reviewed: boolean }>;
  };
  assert.equal(mistakes.mistakes.length, 1);
  assert.equal(mistakes.mistakes[0]?.attemptId, result.attemptId);
  assert.equal(mistakes.mistakes[0]?.id, second.id);
  assert.equal(mistakes.mistakes[0]?.userAnswer, second.options.find((option) => option !== second.correctAnswer));
  assert.equal(mistakes.mistakes[0]?.correctAnswer, second.correctAnswer);
  assert.ok(mistakes.mistakes[0]?.explanation);

  const mistakePath = `${getServerUrl()}/api/revision/mistakes/${result.attemptId}/${encodeURIComponent(second.id)}`;
  const reviewedResponse = await fetch(mistakePath, {
    method: 'PATCH',
    headers: { ...authorization, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewed: true }),
  });
  assert.equal(reviewedResponse.status, 200);
  const reviewedMistakes = await fetch(`${getServerUrl()}/api/revision/mistakes`, { headers: authorization });
  assert.equal((await reviewedMistakes.json() as typeof mistakes).mistakes[0]?.reviewed, true);

  const deleteMistakeResponse = await fetch(mistakePath, { method: 'DELETE', headers: authorization });
  assert.equal(deleteMistakeResponse.status, 204);
  const emptyMistakes = await fetch(`${getServerUrl()}/api/revision/mistakes`, { headers: authorization });
  assert.equal((await emptyMistakes.json() as typeof mistakes).mistakes.length, 0);

  const adaptiveResponse = await fetch(`${getServerUrl()}/api/mock-test?adaptive=true&count=10`, { headers: authorization });
  assert.equal(adaptiveResponse.status, 200);
  const adaptive = await adaptiveResponse.json() as { adaptive: boolean; questions: Array<{ topic: string }> };
  assert.equal(adaptive.adaptive, true);
  assert.equal(adaptive.questions[0]?.topic, second.topic);

  const historyResponse = await fetch(`${getServerUrl()}/api/mock-test/history`, { headers: authorization });
  assert.equal(historyResponse.status, 200);
  const history = await historyResponse.json() as { attempts: Array<{ id: number; score: number }> };
  assert.equal(history.attempts[0]?.id, result.attemptId);
  assert.equal(history.attempts[0]?.score, 1);

  const unansweredResponse = await fetch(`${getServerUrl()}/api/mock-test/submit`, {
    method: 'POST',
    headers: { ...authorization, 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionIds: [first.id], answers: {}, category: 'Quantitative Aptitude' }),
  });
  assert.equal(unansweredResponse.status, 201);
  const unanswered = await unansweredResponse.json() as { unansweredCount: number; correctCount: number };
  assert.equal(unanswered.unansweredCount, 1);
  assert.equal(unanswered.correctCount, 0);
});

test('study plan tasks are validated, user-scoped, editable, and persisted', async () => {
  const authorization = { Authorization: `Bearer ${token}` };
  const invalid = await fetch(`${getServerUrl()}/api/student/study-plan`, {
    method: 'POST',
    headers: { ...authorization, 'Content-Type': 'application/json' },
    body: JSON.stringify({ day: 'today', title: '', detail: '', durationMinutes: 0 }),
  });
  assert.equal(invalid.status, 400);

  const created = await fetch(`${getServerUrl()}/api/student/study-plan`, {
    method: 'POST',
    headers: { ...authorization, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      day: '2026-10-09',
      title: 'Review arithmetic',
      detail: 'Quantitative Aptitude · Percentages',
      durationMinutes: 30,
    }),
  });
  assert.equal(created.status, 201);
  const createdData = await created.json() as { item: { id: number; completed: boolean } };
  assert.ok(createdData.item.id > 0);
  assert.equal(createdData.item.completed, false);

  const updated = await fetch(`${getServerUrl()}/api/student/study-plan/${createdData.item.id}`, {
    method: 'PATCH',
    headers: { ...authorization, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      day: '2026-10-10',
      title: 'Review arithmetic',
      detail: 'Quantitative Aptitude · Profit and loss',
      durationMinutes: 45,
      completed: true,
    }),
  });
  assert.equal(updated.status, 200);
  const saved = await updated.json() as { item: { day: string; durationMinutes: number; completed: boolean } };
  assert.equal(saved.item.day, '2026-10-10');
  assert.equal(saved.item.durationMinutes, 45);
  assert.equal(saved.item.completed, true);

  const listed = await fetch(`${getServerUrl()}/api/student/study-plan`, { headers: authorization });
  const listData = await listed.json() as { items: Array<{ id: number; completed: boolean }> };
  assert.ok(listData.items.some((item) => item.id === createdData.item.id && item.completed));

  const removed = await fetch(`${getServerUrl()}/api/student/study-plan/${createdData.item.id}`, {
    method: 'DELETE',
    headers: authorization,
  });
  assert.equal(removed.status, 204);
  const afterDelete = await fetch(`${getServerUrl()}/api/student/study-plan`, { headers: authorization });
  const afterDeleteData = await afterDelete.json() as { items: Array<{ id: number }> };
  assert.ok(!afterDeleteData.items.some((item) => item.id === createdData.item.id));
});

test.after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
  closeDatabase();
  for (const file of [testDbPath, `${testDbPath}-shm`, `${testDbPath}-wal`]) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
});
