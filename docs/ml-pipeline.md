# ML Pipeline

## Goals

- Predict exam score from preparation signals
- Estimate success probability
- Detect weak topics and risk signals
- Generate study recommendations
- Classify performance level

## Feature set

- studyHours
- averageScore
- accuracy
- attemptRate
- averageTime
- revisionFrequency
- mockTestCount
- topicCoverage
- consistency
- difficultyPerformance

## Model set

- Random Forest
- Logistic Regression
- Decision Tree
- XGBoost
- K-Means clustering

## Tasks

1. Score prediction
2. Success prediction
3. Performance classification
4. Student clustering
5. Weak topic detection

## Pipeline stages

1. Data ingestion
2. Cleaning and validation
3. Missing value handling
4. Deduplication and outlier detection
5. Feature engineering and scaling
6. Model training and evaluation
7. Validation and deployment
8. Prediction service exposure over HTTP

## Evaluation metrics

- Accuracy
- Precision
- Recall
- F1
- ROC-AUC
- Confusion matrix

## Demo policy

All model metrics must be clearly labeled as simulated or demo values unless trained with real data.
