
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import pickle
import os
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

DATABASE = 'backend/complaints.db'

# Load model and vectorizer
try:
    with open('backend/model.pkl', 'rb') as f:
        model = pickle.load(f)
    print("Model loaded successfully.")
except FileNotFoundError:
    print("Error: model.pkl not found. Make sure to train the model first.")
    model = None

try:
    with open('backend/vectorizer.pkl', 'rb') as f:
        vectorizer = pickle.load(f)
    print("Vectorizer loaded successfully.")
except FileNotFoundError:
    print("Error: vectorizer.pkl not found.")
    vectorizer = None

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # User Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user'
        )
    ''')
    
    # Complaints Table (Updated with user_id and status)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            text TEXT NOT NULL,
            category TEXT NOT NULL,
            status TEXT DEFAULT 'Pending',
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    
    # Check if admin exists, if not create one
    cursor.execute("SELECT * FROM users WHERE role = 'admin'")
    if not cursor.fetchone():
        admin_pass = generate_password_hash("admin123")
        cursor.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", 
                      ("admin", admin_pass, "admin"))
        print("Admin user created: admin / admin123")
        conn.commit()
        
    conn.close()

init_db()

# --- AUTHENTICATION ---

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'user') # Default to user if not specified
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    if role not in ['user', 'admin']:
         return jsonify({'error': 'Invalid role'}), 400
        
    hashed_password = generate_password_hash(password)
    
    conn = get_db_connection()
    try:
        conn.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                    (username, hashed_password, role))
        conn.commit()
        return jsonify({'message': 'User registered successfully'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username already exists'}), 409
    finally:
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    role = data.get('role') # 'user' or 'admin' login attempt
    
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()
    
    if user and check_password_hash(user['password'], password):
        if role and user['role'] != role:
             return jsonify({'error': 'Invalid role for this user'}), 403
             
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user['id'],
                'username': user['username'],
                'role': user['role']
            }
        }), 200
    
    return jsonify({'error': 'Invalid credentials'}), 401

# --- COMPLAINTS ---

@app.route('/api/predict', methods=['POST'])
def predict_complaint():
    if not model or not vectorizer:
        return jsonify({'error': 'Model not loaded'}), 500

    data = request.json
    text = data.get('text', '')
    user_id = data.get('user_id') # Now required
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    if not user_id:
        return jsonify({'error': 'User ID required'}), 401
    
    # Vectorize and Predict
    text_vectorized = vectorizer.transform([text])
    predicted_category = model.predict(text_vectorized)[0]
    
    # Save to DB
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO complaints (user_id, text, category, status) VALUES (?, ?, ?, ?)", 
                  (user_id, text, predicted_category, 'Pending'))
    complaint_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({
        'id': complaint_id,
        'category': predicted_category,
        'status': 'Pending',
        'original_text': text
    })

@app.route('/api/complaints', methods=['GET'])
def get_complaints():
    user_id = request.args.get('user_id')
    role = request.args.get('role')
    
    category_filter = request.args.get('category')
    date_filter = request.args.get('date') # 'today', 'yesterday', or specific date YYYY-MM-DD
    
    conn = get_db_connection()
    query = "SELECT c.*, u.username as user_name FROM complaints c JOIN users u ON c.user_id = u.id WHERE 1=1"
    params = []
    
    if role == 'user':
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        query += " AND c.user_id = ?"
        params.append(user_id)
    elif role == 'admin':
        # Admin filters
        if category_filter and category_filter != 'All':
            query += " AND c.category = ?"
            params.append(category_filter)
            
        if date_filter:
            today = datetime.now().date()
            if date_filter == 'today':
                query += " AND date(c.timestamp) = ?"
                params.append(str(today))
            elif date_filter == 'yesterday':
                yesterday = today - timedelta(days=1)
                query += " AND date(c.timestamp) = ?"
                params.append(str(yesterday))
            # Add range handling if needed, but simple date match is good for now
    
    query += " ORDER BY c.timestamp DESC"
    
    cursor = conn.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    complaints = [dict(row) for row in rows]
    return jsonify(complaints)

@app.route('/api/complaints/<int:id>/status', methods=['PUT'])
def update_status(id):
    data = request.json
    new_status = data.get('status')
    
    if new_status not in ['Pending', 'Verified', 'Resolved', 'Not Responded']:
        return jsonify({'error': 'Invalid status'}), 400
        
    conn = get_db_connection()
    conn.execute("UPDATE complaints SET status = ? WHERE id = ?", (new_status, id))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Status updated successfully'})

@app.route('/api/stats', methods=['GET'])
def get_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT category, COUNT(*) FROM complaints GROUP BY category")
    stats = cursor.fetchall()
    conn.close()
    
    stats_dict = {category: count for category, count in stats}
    return jsonify(stats_dict)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
