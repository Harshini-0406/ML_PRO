<div align="center">

# 🚀 ExamIQ
### AI-Powered Competitive Exam Preparation & Performance Analytics Platform

**Learn Smarter • Practice Better • Track Progress**

A full-stack web application designed to enhance competitive examination preparation through interactive assessments, personalized study planning, and data-driven performance analytics.

[![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Language-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?logo=node.js)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-ML_Service-3776AB?logo=python)](https://www.python.org/)

### 🌐 [Live Demo](https://ml-pro-seven.vercel.app)

</div>

---

## 📌 Project Overview

**ExamIQ** is a full-stack competitive examination preparation platform that helps students improve their learning efficiency through structured practice, mock assessments, and performance tracking.

The platform combines modern web technologies with data analytics and a Python-based machine learning service to support personalized learning experiences.

ExamIQ aims to simplify exam preparation by providing a centralized environment for practicing questions, evaluating performance, identifying weak areas, and planning future learning activities.

---

## ✨ Key Features

### 🔐 User Authentication
- User registration and login
- Password hashing using bcrypt
- JWT-based authentication
- Protected API endpoints
- Personalized student accounts

### 📊 Interactive Dashboard
- Student performance overview
- Average scores and accuracy
- Learning progress tracking
- Topic mastery visualization
- Recent test performance

### 📝 Competitive Exam Preparation
- Multiple competitive examination categories
- Topic-based practice
- Multiple-choice questions
- Difficulty-based assessments
- Question explanations

### ⏱️ Mock Test System
- Timed mock examinations
- Configurable question count
- Category and difficulty selection
- Automatic answer evaluation
- Instant score calculation
- Detailed test results

### 📈 Performance Analytics
- Topic-wise performance analysis
- Strength and weakness identification
- Accuracy calculation
- Test history tracking
- Personalized improvement suggestions

### 🤖 Machine Learning Integration
- Python-based ML service
- Performance classification integration
- Score prediction endpoints
- Learning recommendations
- Rule-based fallback when the ML service is unavailable

### 📅 Personalized Study Planner
- Create study plans
- Update study tasks
- Track completed activities
- Organize learning schedules

### 📱 Responsive Design
- Modern user interface
- Mobile-friendly layouts
- Responsive dashboard components
- Interactive navigation

---

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React.js, TypeScript, Vite |
| Styling | Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | SQLite |
| Authentication | JWT, bcrypt |
| Machine Learning | Python-based ML Service |
| API | REST APIs |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |
| Version Control | Git, GitHub |

---

## 🏗️ System Architecture

```text
                  ┌─────────────────────┐
                  │       Student       │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │   React Frontend    │
                  │  TypeScript + Vite  │
                  └──────────┬──────────┘
                             │
                         REST APIs
                             │
                             ▼
                  ┌─────────────────────┐
                  │  Express.js Backend │
                  │      Node.js        │
                  └──────────┬──────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
                 ▼                       ▼
       ┌──────────────────┐    ┌──────────────────┐
       │ SQLite Database  │    │ Python ML Service│
       │ Users, Attempts  │    │ Prediction and   │
       │ Plans, Progress  │    │ Classification   │
       └──────────────────┘    └──────────────────┘
```

---

## 📂 Project Structure

```text
ML_PRO/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── index.ts
│   │   ├── db.ts
│   │   └── questionBank.ts
│   └── package.json
│
├── ml-service/
│
├── package.json
└── README.md
```

---

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Harshini-0406/ML_PRO.git
cd ML_PRO
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 3. Configure Frontend Environment

Create a `.env` file inside the `frontend` directory.

```env
VITE_API_URL=http://localhost:4000
```

### 4. Start Frontend

```bash
npm run dev
```

### 5. Install Backend Dependencies

Open another terminal:

```bash
cd backend
npm install
```

### 6. Configure Backend Environment

Create a `.env` file inside the `backend` directory.

```env
PORT=4000
JWT_SECRET=replace_with_a_strong_random_secret
DATABASE_PATH=./data/examiq.db
```

### 7. Start Backend

```bash
npm run dev
```

The frontend and backend should now be available locally.

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Authenticate a user |

### Student Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/student/dashboard` | Retrieve dashboard metrics |
| GET | `/api/student/profile` | Retrieve student profile |
| POST | `/api/student/profile` | Update student profile |

### Mock Tests

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mock-test/categories` | Retrieve test categories |
| GET | `/api/mock-test` | Retrieve test questions |
| POST | `/api/mock-test/submit` | Submit answers and calculate results |
| GET | `/api/mock-test/history` | Retrieve previous test attempts |

### Study Planner

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/student/study-plan` | Retrieve study plans |
| POST | `/api/student/study-plan` | Create a study task |
| PATCH | `/api/student/study-plan/:id` | Update a study task |
| DELETE | `/api/student/study-plan/:id` | Delete a study task |

---

## 🧠 Performance Evaluation Workflow

```text
Student Login
      ↓
Select Exam Category
      ↓
Choose Difficulty Level
      ↓
Attempt Mock Test
      ↓
Submit Answers
      ↓
Automatic Evaluation
      ↓
Score and Accuracy Calculation
      ↓
Topic-Wise Performance Analysis
      ↓
Identify Weak Areas
      ↓
Generate Recommendations
      ↓
Track Learning Progress
```

---

## ☁️ Deployment

ExamIQ is deployed using cloud hosting platforms.

**Frontend:** Vercel

**Backend:** Render

**Database:** SQLite

### Live Application

🔗 https://ml-pro-seven.vercel.app

### Deployment Note

The current backend configuration uses temporary SQLite storage on Render.

Database persistence across service restarts is not guaranteed in this configuration. Migrating to persistent database storage is a planned improvement.

---

## 🚧 Future Enhancements

- Persistent cloud database integration
- Expanded competitive examination question bank
- Improved ML-based performance predictions
- Adaptive question recommendations
- Advanced learning analytics
- Personalized revision schedules
- Enhanced accessibility and mobile experience

---

## 💡 Key Learning Outcomes

Developing ExamIQ provided practical experience in:

- Full-stack application development
- REST API design and integration
- Authentication and authorization
- Database operations
- Frontend state management
- Machine learning service integration
- Production debugging
- CORS configuration
- Cloud deployment
- Git and GitHub version control

---

## 👩‍💻 Developer

**Harshini T.**

Computer Science and Engineering

Interested in Full-Stack Development, Machine Learning, and Software Engineering.

### Connect With Me

[LinkedIn](https://www.linkedin.com/in/harshinit-04m05/)

[GitHub](https://github.com/Harshini-0406)

---

<div align="center">

### ⭐ If you find this project interesting, consider giving it a star!

**Built with dedication, curiosity, and a passion for learning.**

</div>
