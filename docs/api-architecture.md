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
- POST /api/mock-tests
- POST /api/mock-tests/:id/submit
- GET /api/mock-tests/history

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
- GET /api/study-plan
- POST /api/study-plan

## Leaderboard
- GET /api/leaderboard

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
