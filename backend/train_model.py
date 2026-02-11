
import pandas as pd
import pickle
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score
import os

# Ensure backend directory exists
if not os.path.exists('backend'):
    os.makedirs('backend')

# Load dataset
try:
    df = pd.read_csv('backend/complaints_dataset.csv')
except FileNotFoundError:
    print("Error: Dataset not found. Please run generate_data.py first.")
    exit()

# Basic interaction with the data
print(f"Loaded dataset with {len(df)} records.")

# Split data
X = df['text']
y = df['category']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Vectorization
vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf = vectorizer.transform(X_test)

# Model Training
# Logistic Regression is simple, fast, and effective for text classification
model = LogisticRegression(max_iter=1000)
model.fit(X_train_tfidf, y_train)

# Evaluation
y_pred = model.predict(X_test_tfidf)
accuracy = accuracy_score(y_test, y_pred)
print(f"Model Accuracy: {accuracy:.4f}")
print("\nClassification Report:\n")
print(classification_report(y_test, y_pred))

# Save artifacts
with open('backend/model.pkl', 'wb') as f:
    pickle.dump(model, f)

with open('backend/vectorizer.pkl', 'wb') as f:
    pickle.dump(vectorizer, f)

print("Model and vectorizer saved to 'backend/model.pkl' and 'backend/vectorizer.pkl'")
