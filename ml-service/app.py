from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title='ExamIQ ML Service', version='1.0.0')


class PredictionInput(BaseModel):
    studyHours: float
    averageScore: float
    accuracy: float
    attemptRate: float
    averageTime: float
    revisionFrequency: float
    mockTestCount: float
    topicCoverage: float
    consistency: float
    difficultyPerformance: float


@app.get('/health')
def health():
    return {'status': 'ok', 'service': 'ExamIQ ML service'}


@app.post('/predict-score')
def predict_score(payload: PredictionInput):
    score = min(100, max(0, round(payload.averageScore * 0.7 + payload.accuracy * 0.2 + payload.topicCoverage * 0.1, 2)))
    return {'predictedScore': score, 'source': 'demo-model'}


@app.post('/predict-success')
def predict_success(payload: PredictionInput):
    probability = min(100, max(0, round(payload.accuracy * 0.4 + payload.consistency * 0.3 + payload.topicCoverage * 0.3, 2)))
    return {'successProbability': probability, 'source': 'demo-model'}


@app.post('/classify-performance')
def classify_performance(payload: PredictionInput):
    score = (payload.accuracy + payload.consistency + payload.topicCoverage) / 3
    if score >= 85:
        label = 'Excellent'
    elif score >= 70:
        label = 'Strong'
    elif score >= 55:
        label = 'Developing'
    else:
        label = 'Weak'
    return {'classification': label, 'score': round(score, 2)}


@app.post('/detect-weak-topics')
def detect_weak_topics():
    return {
        'weakTopics': [
            {'topic': 'Quantitative Aptitude', 'reason': 'Low accuracy and high time spent'},
            {'topic': 'Probability', 'reason': 'Repeated errors in timed practice'},
        ],
        'source': 'demo-analysis',
    }


@app.post('/recommend')
def recommend():
    return {
        'recommendations': [
            {'topic': 'Probability', 'difficulty': 'Medium', 'durationMinutes': 30, 'priority': 'High', 'revisionDate': 'Tomorrow'},
            {'topic': 'Arithmetic', 'difficulty': 'Easy', 'durationMinutes': 20, 'priority': 'Medium', 'revisionDate': 'Day 2'},
        ]
    }
