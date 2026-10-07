continue complete th website# ExamIQ System Architecture

## 1. Product vision

ExamIQ is an AI-powered competitive exam intelligence platform designed to help students turn preparation behavior into actionable guidance.

It integrates four intelligence layers:

- Data science analysis over mock tests, study routines, and prediction signals
- Machine learning models for performance scoring and success prediction
- DSA-backed indexing and dependency logic for search, ranking, and recommendations
- Product analytics that convert raw student activity into exam readiness insights

## 2. Architectural style

The system is built as a modular monorepo with three executable services:

- Frontend: React + TypeScript + Vite + Tailwind + shadcn-inspired design system
- Backend: Node.js + Express + TypeScript + MongoDB + JWT + validation middleware
- ML Service: Python + FastAPI + scikit-learn + joblib + pandas + numpy

## 3. Core flow

Student activity
  -> Data collection
  -> Cleaning and validation
  -> Feature engineering
  -> Analytics + ML models
  -> DSA indexing and recommendation
  -> Exam Intelligence Engine
  -> Personalized action

## 4. Key modules

### Frontend modules
- Landing page and marketing experience
- Auth and onboarding flows
- Student dashboard
- Exam explorer and mock test engine
- analytics and ML insights pages
- admin portal and reporting workspace

### Backend modules
- auth routes and role-based access
- exam, question, mock-test, and performance APIs
- recommendation and study-plan endpoints
- MongoDB models and validation
- centralized error handling and middleware

### ML service modules
- preprocessing pipeline
- feature generation
- score prediction
- success probability model
- weak topic detection
- recommendation generation

## 5. Data model overview

Major entities:

- Users
- Students
- Exams
- Subjects
- Topics
- Questions
- MockTests
- Attempts
- Performance
- StudyPlans
- Recommendations
- Achievements
- Notifications
- Leaderboard

## 6. Design principles

- Use real analytics, not static dashboards
- Keep every feature tied to a user decision or learning outcome
- Prefer service abstractions for model integrations
- Keep demo data clearly labeled as simulated
- Build with production-ready validation, security, and accessibility

## 7. Deployment targets

- Frontend: Vercel
- Backend: Render or Railway
- MongoDB: MongoDB Atlas
- ML service: Render or Railway
