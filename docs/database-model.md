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
