
from flask import Flask, request, jsonify, send_from_directory
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

# Dummy Data for Restaurants
DUMMY_RESTAURANTS = [
    {
        "id": 1,
        "name": "Pizza Paradise",
        "image": "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=60",
        "rating": 4.5,
        "menu": [
            {"id": 101, "name": "Margherita Pizza", "price": 250, "description": "Classic cheese pizza"},
            {"id": 102, "name": "Pepperoni Feast", "price": 350, "description": "Spicy pepperoni slices"},
            {"id": 103, "name": "Garlic Bread", "price": 120, "description": "Buttery garlic sticks"},
            {"id": 104, "name": "Coke", "price": 60, "description": "Chilled cola"}
        ]
    },
    {
        "id": 2,
        "name": "Burger Barn",
        "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60",
        "rating": 4.2,
        "menu": [
            {"id": 201, "name": "Classic Cheeseburger", "price": 180, "description": "Juicy beef patty with cheese"},
            {"id": 202, "name": "Veggie Delight", "price": 150, "description": "Crispy veg patty"},
            {"id": 203, "name": "French Fries", "price": 90, "description": "Crispy salted fries"},
            {"id": 204, "name": "Milkshake", "price": 120, "description": "Chocolate thick shake"}
        ]
    },
    {
        "id": 3,
        "name": "Sushi Spot",
        "image": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop&q=60",
        "rating": 4.8,
        "menu": [
            {"id": 301, "name": "Salmon Nigiri", "price": 400, "description": "Fresh salmon on rice"},
            {"id": 302, "name": "California Roll", "price": 350, "description": "Crab and avocado roll"},
            {"id": 303, "name": "Miso Soup", "price": 100, "description": "Traditional soybean soup"},
            {"id": 304, "name": "Green Tea", "price": 50, "description": "Hot matcha tea"}
        ]
    },
     {
        "id": 4,
        "name": "Taco Town",
        "image": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=60",
        "rating": 4.3,
        "menu": [
            {"id": 401, "name": "Chicken Tacos", "price": 200, "description": "Grilled chicken with salsa"},
            {"id": 402, "name": "Beef Burrito", "price": 250, "description": "Loaded with beans and rice"},
            {"id": 403, "name": "Nachos Supreme", "price": 180, "description": "Cheese, jalapenos, and cream"},
            {"id": 404, "name": "Lemonade", "price": 70, "description": "Freshly squeezed"}
        ]
    }
]

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
    
    # Orders Table (New)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            restaurant_name TEXT NOT NULL,
            items TEXT NOT NULL,
            total_amount REAL NOT NULL,
            order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'Delivered',
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    # Complaints Table (Updated with user_id and status)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            order_id INTEGER,
            text TEXT NOT NULL,
            category TEXT NOT NULL,
            status TEXT DEFAULT 'Pending',
            admin_response_text TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (order_id) REFERENCES orders (id)
        )
    ''')
    
    # Attempt to add columns to existing table if they don't exist (Migration)
    try:
        cursor.execute("ALTER TABLE complaints ADD COLUMN order_id INTEGER REFERENCES orders(id)")
    except sqlite3.OperationalError:
        pass # Column likely exists
        
    try:
        cursor.execute("ALTER TABLE complaints ADD COLUMN admin_response_text TEXT")
    except sqlite3.OperationalError:
        pass # Column likely exists

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

# --- RESTAURANTS & ORDERS (New) ---

@app.route('/api/restaurants', methods=['GET'])
def get_restaurants():
    return jsonify(DUMMY_RESTAURANTS)

@app.route('/api/orders', methods=['POST'])
def place_order():
    data = request.json
    user_id = data.get('user_id')
    restaurant_name = data.get('restaurant_name')
    items = data.get('items') # Should be a JSON string or descriptive string
    total_amount = data.get('total_amount')
    
    if not user_id or not restaurant_name or not items:
        return jsonify({'error': 'Missing order details'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO orders (user_id, restaurant_name, items, total_amount) VALUES (?, ?, ?, ?)",
                   (user_id, restaurant_name, str(items), total_amount))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Order placed successfully'}), 201

@app.route('/api/orders', methods=['GET'])
def get_orders():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
        
    conn = get_db_connection()
    # Get orders and try to attach any complaints raised for them
    query = '''
        SELECT o.*, c.status as complaint_status, c.admin_response_text 
        FROM orders o 
        LEFT JOIN complaints c ON o.id = c.order_id 
        WHERE o.user_id = ? 
        ORDER BY o.order_date DESC
    '''
    rows = conn.execute(query, (user_id,)).fetchall()
    conn.close()
    
    return jsonify([dict(row) for row in rows])

# --- COMPLAINTS ---

@app.route('/api/predict', methods=['POST'])
def predict_complaint():
    if not model or not vectorizer:
        return jsonify({'error': 'Model not loaded'}), 500

    data = request.json
    text = data.get('text', '')
    user_id = data.get('user_id') 
    order_id = data.get('order_id') # New field
    
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
    cursor.execute("INSERT INTO complaints (user_id, order_id, text, category, status) VALUES (?, ?, ?, ?, ?)", 
                  (user_id, order_id, text, predicted_category, 'Pending'))
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
    date_filter = request.args.get('date') 
    status_filter = request.args.get('status')
    
    conn = get_db_connection()
    query = "SELECT c.*, u.username as user_name, o.restaurant_name, o.items, o.total_amount FROM complaints c JOIN users u ON c.user_id = u.id LEFT JOIN orders o ON c.order_id = o.id WHERE 1=1"
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
            
        if status_filter and status_filter != 'All':
            query += " AND c.status = ?"
            params.append(status_filter)
            
        if date_filter:
            today = datetime.now().date()
            if date_filter == 'today':
                query += " AND date(c.timestamp) = ?"
                params.append(str(today))
            elif date_filter == 'yesterday':
                yesterday = today - timedelta(days=1)
                query += " AND date(c.timestamp) = ?"
                params.append(str(yesterday))
    
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
    admin_response = data.get('admin_response_text')
    
    if new_status not in ['Pending', 'Verified', 'Resolved', 'Not Responded']:
        return jsonify({'error': 'Invalid status'}), 400
        
    conn = get_db_connection()
    if admin_response:
        conn.execute("UPDATE complaints SET status = ?, admin_response_text = ? WHERE id = ?", (new_status, admin_response, id))
    else:
        conn.execute("UPDATE complaints SET status = ? WHERE id = ?", (new_status, id))
        
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Status and response updated successfully'})

@app.route('/api/stats', methods=['GET'])
def get_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT category, COUNT(*) FROM complaints GROUP BY category")
    stats = cursor.fetchall()
    conn.close()
    
    stats_dict = {category: count for category, count in stats}
    return jsonify(stats_dict)
    from flask import send_from_directory

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    frontend_dist = os.path.join(os.getcwd(), "frontend", "dist")

    if path != "" and os.path.exists(os.path.join(frontend_dist, path)):
        return send_from_directory(frontend_dist, path)

    return send_from_directory(frontend_dist, "index.html") 

if __name__ == '__main__':
    app.run(debug=True, port=5000)
