# API Architecture

## Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

## Exams
- GET /api/exams
- GET /api/exams/:id

## Questions
- GET /api/questions
- GET /api/questions/search

## Mock Tests
- `GET /api/mock-test/categories` — authenticated list of supported categories.
- `GET /api/mock-test?category=Mixed&difficulty=Beginner&count=10&durationMinutes=15&adaptive=false` — authenticated question set. `category` may be `Mixed` or one of the eight supported categories; difficulty may be omitted for mixed difficulty. Returns question options without answer keys.
- `POST /api/mock-test/submit` — authenticated submission with `questionIds`, an `answers` map keyed by question ID, category, difficulty, and elapsed time. Returns score, question review and explanations, category/topic analysis, recommendations, and the attempt ID; saves the attempt.
- `GET /api/mock-test/history` — the authenticated user's 20 most recent attempt summaries and result details.

The question bank contains 100+ seeded SQLite questions across Quantitative Aptitude, Logical Reasoning, Verbal Ability and English, Data Structures and Algorithms, Programming and Coding, Computer Science Fundamentals, General Knowledge and Current Affairs, and Placement Preparation. Test duration is configurable from 1 to 180 minutes and question count from 1 to 50.

## Revision Center
- `GET /api/revision/mistakes` — authenticated incorrect answers from saved mock-test submissions, including the selected and correct answers, explanations, attempt date, and review status.
- `PATCH /api/revision/mistakes/:attemptId/:questionId` — set `{ "reviewed": true | false }` for an incorrect answer belonging to the authenticated user.
- `DELETE /api/revision/mistakes/:attemptId/:questionId` — dismiss an incorrect answer from that user's Mistake Book without deleting the original attempt.

Formula Book, Flashcards, and Shortcuts & Tricks use authored frontend learning datasets. Favorites and flashcard Known/Need Revision progress are stored in browser local storage and namespaced to the signed-in user.

The submit endpoint sends actual attempt metrics to the existing ML performance classifier. If that service is unavailable or returns an invalid response, the result explicitly identifies the rule-based analysis fallback.

## Analytics
- GET /api/analytics/performance
- GET /api/analytics/topics
- GET /api/analytics/subjects

## AI
- POST /api/ai/predict-score
- POST /api/ai/predict-success
- POST /api/ai/recommend
- POST /api/ai/analyze

## Study Plan
- GET /api/student/study-plan — authenticated user's saved tasks.
- POST /api/student/study-plan — create a task with a date, title, topic detail, and duration.
- PATCH /api/student/study-plan/:id — update a task or its completion state; ownership is enforced.
- DELETE /api/student/study-plan/:id — delete only the authenticated user's task.

## Analytics
Analytics is computed in the frontend from the authenticated `GET /api/mock-test/history` attempt summaries and result details. Study hours and leaderboard ranks are not inferred when the database does not track them.

The Vite development server proxies `/api` to `http://localhost:4000` by default. Set `EXAMIQ_API_PROXY_TARGET` to override the proxy target; `VITE_API_URL` may be used for a separately hosted backend, with a same-origin proxy retry if that URL is unreachable.

## Leaderboard
No shared leaderboard API is currently enabled. The UI must not display fabricated peer names or ranks.

## Security design
- JWT-based auth
- role-based access control
- rate limiting and request validation
- sanitized inputs
- secure headers and CORS config

## Error handling
- Central error middleware
- standard error envelope
- validation errors mapped to 400
- auth errors mapped to 401/403
- internal errors mapped to 500
