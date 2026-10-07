import test from 'node:test';
import assert from 'node:assert/strict';

import { app } from '../src/index.ts';

const server = app.listen(0);

const getServerUrl = () => {
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Server did not bind to a port');
  }
  return `http://127.0.0.1:${address.port}`;
};

test('GET /api/exams returns a catalog of supported exams', async () => {
  const response = await fetch(`${getServerUrl()}/api/exams`);
  assert.equal(response.status, 200);

  const payload = await response.json() as Array<{ name: string; category: string }>;
  assert.ok(Array.isArray(payload));
  assert.ok(payload.length >= 4);
  assert.equal(payload[0]?.category, 'Government');
});

test('GET /api/exams/:id returns an individual exam by slug', async () => {
  const response = await fetch(`${getServerUrl()}/api/exams/upsc-cse`);
  assert.equal(response.status, 200);

  const exam = await response.json() as { name: string; slug: string };
  assert.equal(exam.name, 'UPSC CSE');
  assert.equal(exam.slug, 'upsc-cse');
});

test.after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
});
