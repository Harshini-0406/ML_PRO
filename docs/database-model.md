# Database ER / Data Model

## Collection overview

### Users
- _id
- name
- email
- passwordHash
- role: student | admin
- createdAt
- updatedAt

### Students
- _id
- userId
- targetExam
- examDate
- dailyStudyHours
- preparationLevel
- strongSubjects
- weakSubjects
- goals
- currentReadiness
- performanceSummary

### Exams
- _id
- name
- category
- difficulty
- durationMinutes
- questionCount
- subjects
- syllabus
- examPattern
- createdAt

### Subjects
- _id
- examId
- name
- code
- weightage

### Topics
- _id
- subjectId
- name
- difficulty
- dependencyGraph
- prerequisites

### Questions
- _id
- examId
- subjectId
- topicId
- text
- options
- answer
- explanation
- difficulty
- type
- tags
- createdAt

### MockTests
- _id
- examId
- title
- subjectMix
- difficulty
- durationMinutes
- createdAt

### Attempts
- _id
- studentId
- mockTestId
- score
- accuracy
- correct
- wrong
- skipped
- timeSpent
- submittedAt
- answers

### Performance
- _id
- studentId
- examId
- window
- overallScore
- accuracy
- consistency
- speed
- topicCoverage
- attemptRate
- revisionFrequency
- subjectBreakdown
- generatedAt

### StudyPlans
- _id
- studentId
- generatedAt
- planType
- tasks
- revisionSchedule
- focusAreas

### Recommendations
- _id
- studentId
- topic
- difficulty
- durationMinutes
- priority
- revisionDate
- source
- createdAt

### Leaderboard
- _id
- studentId
- period
- rank
- score
- accuracy
- consistency
- improvement
- lastUpdated

## Relationships

- One User -> One Student profile
- Many Students -> Many Attempts
- Many Exams -> Many MockTests
- Many Subjects -> Many Topics
- Many Topics -> Many Questions
- Many Students -> Many Performance records

## Indexes

- Users: email unique
- Students: userId unique, targetExam
- Questions: examId, subjectId, topicId, difficulty
- Attempts: studentId, mockTestId
- Performance: studentId, generatedAt
- Leaderboard: period, rank

## Validation notes

- Enforce email validation and role constraints
- Validate score ranges and attempt counts
- Keep timestamps consistent
- Prefer normalized references to avoid duplication

## Implemented SQLite mock-test tables

The running Node.js backend uses SQLite. On startup it seeds the static sample bank into:

- `mock_test_questions`: question ID, category, topic, difficulty, prompt, four JSON-encoded options, correct answer, explanation, and marks. The category/difficulty index supports filtered test selection.
- `mock_test_attempts`: user ID, selected category and difficulty, score, totals, correct/incorrect/unanswered counts, time taken, serialized result review, and creation time.
- `revision_mistake_states`: per-user, per-attempt, per-question reviewed and dismissed flags. Mistake content is derived from each saved attempt's incorrect answers; dismissing a mistake does not remove the original result.

The question bank is defined in `backend/src/questionBank.ts`; `initializeDatabase` inserts any missing seed questions without overwriting existing rows. Each saved result is scoped to the authenticated user's history.
