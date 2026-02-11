# Customer Complaint Classification System for Swiggy

## 1. Overall System Architecture
The system follows a standard 3-tier architecture:
1.  **Presentation Layer (Frontend)**: React.js application for user interaction (submitting complaints) and an admin dashboard (viewing complaints/analytics).
2.  **Application Layer (Backend)**: Python Flask server exposing REST APIs.
    *   Handles HTTP requests from the frontend.
    *   Loads the trained ML model for real-time inference.
    *   Processes data (cleaning/TF-IDF vectorization).
    *   Manages database operations (storage/retrieval).
3.  **Data Layer (Database)**: SQLite database storing complaint records (text, category, timestamp).
4.  **Machine Learning Component**:
    *   A pre-trained Scikit-learn model (Logistic Regression or Linear SVM).
    *   TF-IDF Vectorizer for feature extraction.
    *   Serialized as `.pkl` or `.joblib` files to be loaded by the Flask app.

## 2. ML Workflow Plan
1.  **Data Collection**:
    *   Generate a synthetic dataset of ~500 complaints across defined categories.
2.  **Preprocessing**:
    *   Text cleaning: Lowercasing, removing punctuation/special characters.
    *   Vectorization: TF-IDF (Term Frequency-Inverse Document Frequency) to convert text to numerical features.
3.  **Model Selection**:
    *   **Algorithm**: Logistic Regression (recommended for small text datasets due to simplicity and interpretability) or Linear SVM.
    *   **Hyperparameter Tuning**: Minimal tuning needed (e.g., regularization strength `C`).
4.  **Training & Evaluation**:
    *   Split data into Train (80%) and Test (20%).
    *   Evaluate using Accuracy, Precision, Recall, and F1-Score.
5.  **Serialization**:
    *   Save trained model and vectorizer using `joblib` or `pickle`.
6.  **Inference (Production)**:
    *   Load saved model/vectorizer on Flask app startup.
    *   Transform incoming complaint text using loaded vectorizer.
    *   Predict category using loaded model.

## 3. Dataset Structure (CSV)
The dataset will be a simple CSV file with columns: `text` and `category`.

**Columns:**
1.  `text`: The raw complaint text (string).
2.  `category`: The target label (string).

**Example Rows:**
| text | category |
| :--- | :--- |
| "The food was completely cold when it arrived." | Food Quality Issue |
| "Delivery guy was very rude and late." | Delivery Issue |
| "I ordered paneer butter masala but got chicken curry." | Wrong / Missing Item |
| "Money deducted from bank but order not placed." | Payment / Refund Issue |
| "App keeps crashing when I try to checkout." | App / Technical Issue |

## 4. Backend API Design (Flask)

**Base URL**: `http://localhost:5000/api`

| Endpoint | Method | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `/predict` | `POST` | Takes complaint text, predicts category, saves to DB. | `{ "text": "Food was cold" }` | `{ "category": "Food Quality Issue", "id": 1 }` |
| `/complaints` | `GET` | Fetches all stored complaints (for Admin). | None | `[ { "id": 1, "text": "...", "category": "...", "timestamp": "..." }, ... ]` |
| `/stats` | `GET` | Returns count of complaints per category. | None | `{ "Food Quality Issue": 120, "Delivery Issue": 80, ... }` |

## 5. Frontend Page Structure (React)

**Shared Components**:
*   `Navbar`: Navigation links (Home, Admin).

**User View (Home Page)**:
*   `ComplaintForm`: Text area for input, "Submit" button.
*   `PredictionResult`: Modal or card showing the predicted category after submission (e.g., "We have categorized your complaint as: **Food Quality Issue**").

**Admin View (Dashboard)**:
*   `StatsCard`: Shows total complaints.
*   `CategoryChart`: Simple bar chart or list showing distribution (e.g., "Food Quality: 40%").
*   `ComplaintTable`: Table listing all complaints with columns: ID, Complaint Text, Category, Timestamp.

## 6. Project Validity & Deployability
*   **Why TF-IDF + Classical ML?**: For small datasets (hundreds of samples), deep learning (Transformers/BERT) is overkill and prone to overfitting. TF-IDF with Logistic Regression is a strong baseline, computationally efficient (runs on any CPU), and highly interpretable.
*   **Why SQLite?**: It's serverless and requires zero configuration. Perfect for single-instance applications or student projects where database management overhead should be minimized.
*   **Why Flask?**: Ideally suited for ML deployments due to Python's dominance in data science. It's lightweight and easy to integrate with scikit-learn.
*   **Deployability**: The entire backend + ML model can be containerized in a single Docker image (or run on a cheap VPS) with minimal RAM usage (<500MB).
