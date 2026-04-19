
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import pickle
import os
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, 'complaints.db')

# Load model and vectorizer
try:
    with open(os.path.join(BASE_DIR, 'model.pkl'), 'rb') as f:
        model = pickle.load(f)
    print("Model loaded successfully.")
except FileNotFoundError:
    print("Error: model.pkl not found. Make sure to train the model first.")
    model = None

try:
    with open(os.path.join(BASE_DIR, 'vectorizer.pkl'), 'rb') as f:
        vectorizer = pickle.load(f)
    print("Vectorizer loaded successfully.")
except FileNotFoundError:
    print("Error: vectorizer.pkl not found.")
    vectorizer = None

# Dummy Data for Restaurants
SOUTH_INDIAN_MENU = [
    {"id": 1, "name": "Idli", "price": 40, "description": "Soft steamed rice cakes (2 pcs)"},
    {"id": 2, "name": "Medu Vada", "price": 50, "description": "Crispy lentil donut"},
    {"id": 3, "name": "Masala Dosa", "price": 80, "description": "Crispy crepe with potato filling"},
    {"id": 4, "name": "Ghee Roast Dosa", "price": 100, "description": "Crispy crepe roasted in pure ghee"},
    {"id": 5, "name": "Podi Dosa", "price": 90, "description": "Spicy lentil powder dusted dosa"},
    {"id": 6, "name": "Set Dosa", "price": 110, "description": "Spongy dosa served in a set of 3"},
    {"id": 7, "name": "Poori Masala", "price": 70, "description": "Fried fluffy bread with potato curry"},
    {"id": 8, "name": "Upma", "price": 50, "description": "Savory semolina porridge"},
    {"id": 9, "name": "Rava Dosa", "price": 90, "description": "Crispy semolina crepe"},
    {"id": 10, "name": "Curd Rice", "price": 80, "description": "Tempered yogurt rice"},
    {"id": 11, "name": "Sambar Rice", "price": 90, "description": "Lentil stew mixed with rice"},
    {"id": 12, "name": "Lemon Rice", "price": 70, "description": "Tangy lemon flavored rice"},
    {"id": 13, "name": "Tomato Rice", "price": 70, "description": "Spiced tomato rice"},
    {"id": 14, "name": "Paneer Butter Masala", "price": 160, "description": "Paneer cubes in creamy tomato gravy"},
    {"id": 15, "name": "South Indian Meals", "price": 150, "description": "Traditional full course meal"},
    {"id": 16, "name": "Lassi", "price": 60, "description": "Sweet yogurt drink"},
    {"id": 17, "name": "Buttermilk", "price": 40, "description": "Spiced refreshing buttermilk"}
]

ZONES = {
    'Coimbatore': ['Annapoorna Gowrishankar', 'Sree Annapoorna Sweets', 'Haribhavanam', 'Junior Kuppanna', 'A2B Adyar Ananda Bhavan'],
    'Chennai': ['Murugan Idli Shop', 'Sangeetha Veg Restaurant', 'Saravana Bhavan', 'Hotel Junior Kuppanna'],
    'Bangalore': ['CTR', 'Vidyarthi Bhavan', 'Rameshwaram Cafe', 'MTR', 'Sagar Fast Food'],
    'Kochi': ['Dhe Puttu', 'Paragon Restaurant', 'Brindhavan Veg', 'Gokul Oottupura', 'Aryaas'],
    'Hyderabad': ['Chutneys', 'Rayalaseema Ruchulu', 'Minerva Coffee Shop', 'Kamat Hotel', 'Bikanerwala']
}

RESTAURANT_IMAGES = {
    'Annapoorna Gowrishankar': 'https://images.unsplash.com/photo-1610190217036-7c919d80d285?w=600&auto=format&fit=crop&q=80',
    'Haribhavanam': 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=600&auto=format&fit=crop&q=80',
    'A2B Adyar Ananda Bhavan': 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=600&auto=format&fit=crop&q=80',
    'Junior Kuppanna': 'https://images.unsplash.com/photo-1627308595229-7830b5c91f9f?w=600&auto=format&fit=crop&q=80',
    'Murugan Idli Shop': 'https://images.unsplash.com/photo-1589301773822-6b9dfaa3b5c6?w=600&auto=format&fit=crop&q=80',
    'Saravana Bhavan': 'https://images.unsplash.com/photo-1610190217036-7c919d80d285?w=600&auto=format&fit=crop&q=80',
    'Sangeetha Veg Restaurant': 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=600&auto=format&fit=crop&q=80',
    'CTR': 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=600&auto=format&fit=crop&q=80',
    'Vidyarthi Bhavan': 'https://images.unsplash.com/photo-1589301773822-6b9dfaa3b5c6?w=600&auto=format&fit=crop&q=80',
    'Rameshwaram Cafe': 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=600&auto=format&fit=crop&q=80',
    'Dhe Puttu': 'https://images.unsplash.com/photo-1627308595229-7830b5c91f9f?w=600&auto=format&fit=crop&q=80',
    'Paragon Restaurant': 'https://images.unsplash.com/photo-1610190217036-7c919d80d285?w=600&auto=format&fit=crop&q=80',
    'Brindhavan Veg': 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=600&auto=format&fit=crop&q=80',
    'Chutneys': 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=600&auto=format&fit=crop&q=80',
    'Minerva Coffee Shop': 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=600&auto=format&fit=crop&q=80',
    'Rayalaseema Ruchulu': 'https://images.unsplash.com/photo-1627308595229-7830b5c91f9f?w=600&auto=format&fit=crop&q=80',
}

DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'

DUMMY_RESTAURANTS = []
r_id = 1
import random
rng = random.Random(42)  # Use consistent seed so it doesn't shuffle on reload
for zone, names in ZONES.items():
    for i, name in enumerate(names):
        DUMMY_RESTAURANTS.append({
            "id": r_id,
            "name": name,
            "zone": zone,
            "image": RESTAURANT_IMAGES.get(name, DEFAULT_FOOD_IMAGE),
            "rating": round(rng.uniform(4.0, 4.9), 1),
            "delivery_time": f"{rng.randint(20, 45)} mins",
            "tags": ["South Indian", "Breakfast", "Meals"],
            "menu": SOUTH_INDIAN_MENU
        })
        r_id += 1

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

    # Additional Tables for Multi-tier System
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS zones (
            zone_id INTEGER PRIMARY KEY AUTOINCREMENT,
            zone_name TEXT UNIQUE NOT NULL,
            district TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS departments (
            department_id INTEGER PRIMARY KEY AUTOINCREMENT,
            department_name TEXT UNIQUE NOT NULL
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS support_staff (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            zone_id INTEGER,
            department_id INTEGER,
            created_by_admin INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (zone_id) REFERENCES zones (zone_id),
            FOREIGN KEY (department_id) REFERENCES departments (department_id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS company_admin_registry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            zone_id INTEGER NOT NULL,
            admin_username TEXT UNIQUE NOT NULL,
            admin_password TEXT NOT NULL,
            created_by_company TEXT DEFAULT 'System',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (zone_id) REFERENCES zones (zone_id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS complaint_compensation (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            complaint_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            amount REAL,
            coupon_code TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (complaint_id) REFERENCES complaints (id)
        )
    ''')

    try:
        cursor.execute('ALTER TABLE complaints ADD COLUMN zone_id INTEGER REFERENCES zones(zone_id)')
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute('ALTER TABLE complaints ADD COLUMN department_id INTEGER REFERENCES departments(department_id)')
    except sqlite3.OperationalError:
        pass

    # Ensure default zones and departments exist
    default_zones = [('Chennai', 'Chennai District'), ('Bangalore', 'Urban'), ('Hyderabad', 'Hyderabad District')]
    for name, dist in default_zones:
        try:
            cursor.execute('INSERT INTO zones (zone_name, district) VALUES (?, ?)', (name, dist))
        except sqlite3.IntegrityError:
            pass

    default_depts = ['Finance', 'Delivery', 'Restaurant', 'App Issue']
    for dept in default_depts:
        try:
            cursor.execute('INSERT INTO departments (department_name) VALUES (?)', (dept,))
        except sqlite3.IntegrityError:
            pass

    conn.commit()
    
    # Ensure Zone Admins exist
    cursor.execute('SELECT zone_id, zone_name FROM zones')
    zones = cursor.fetchall()
    for row in zones:
        z_id, z_name = row['zone_id'], row['zone_name']
        admin_uname = f'{z_name.lower()}_admin'
        admin_pass = generate_password_hash('admin123')
        try:
            cursor.execute('INSERT INTO company_admin_registry (zone_id, admin_username, admin_password) VALUES (?, ?, ?)',
                           (z_id, admin_uname, admin_pass))
        except sqlite3.IntegrityError:
            pass
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
    zone = request.args.get('zone')
    if zone:
        filtered = [r for r in DUMMY_RESTAURANTS if r.get('zone', '').lower() == zone.lower()]
        return jsonify(filtered)
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
    zone_id = data.get('zone_id', 1) # Support zone assignment
    
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
    cursor.execute("INSERT INTO complaints (user_id, order_id, text, category, status, zone_id) VALUES (?, ?, ?, ?, ?, ?)", 
                  (user_id, order_id, text, predicted_category, 'Pending', zone_id))
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

# --- SYSTEM & REGISTRY DATA ---

@app.route('/api/zones', methods=['GET'])
def get_zones():
    conn = get_db_connection()
    zones = conn.execute("SELECT * FROM zones").fetchall()
    conn.close()
    return jsonify([dict(z) for z in zones])

@app.route('/api/departments', methods=['GET'])
def get_departments():
    conn = get_db_connection()
    depts = conn.execute("SELECT * FROM departments").fetchall()
    conn.close()
    return jsonify([dict(d) for d in depts])

# --- NEW SUPPORT & MASTER LOGIN ---

@app.route('/api/support/login', methods=['POST'])
def support_login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'support') # could be L1 or L2 or just generic support
    
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM support_staff WHERE username = ?", (username,)).fetchone()
    conn.close()
    
    if user and user['password'] == password: # using plain text or basic comparison as per dummy data if not hashed. Real systems use hashing. Let's assume plain or hash check depending on insertion. We'll use pass in our implementation for simplicity, or check_password_hash if needed. For now plain since we might insert plain in dashboard.
        if role and role not in ['support', user['role']]:
            return jsonify({'error': 'Role mismatch'}), 403
            
        return jsonify({
            'message': 'Login successful',
            'user': dict(user)
        }), 200
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/master/login', methods=['POST'])
def master_login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM company_admin_registry WHERE admin_username = ?", (username,)).fetchone()
    conn.close()
    
    if user and check_password_hash(user['admin_password'], password):
        return jsonify({
            'message': 'Master Login successful',
            'user': {
                'id': user['id'],
                'username': user['admin_username'],
                'role': 'master',
                'zone_id': user['zone_id']
            }
        }), 200
    return jsonify({'error': 'Invalid credentials'}), 401

# --- MULTI-TIER COMPLAINT HANDLING ---

@app.route('/api/support/complaints', methods=['GET'])
def get_support_complaints():
    zone_id = request.args.get('zone_id')
    department_id = request.args.get('department_id')
    
    conn = get_db_connection()
    query = "SELECT c.*, u.username as user_name, o.restaurant_name, o.items, o.total_amount FROM complaints c JOIN users u ON c.user_id = u.id LEFT JOIN orders o ON c.order_id = o.id WHERE c.zone_id = ?"
    params = [zone_id]
    
    if department_id:
        query += " AND c.department_id = ? AND c.status IN ('Forwarded to Department', 'Under Investigation', 'Resolved')"
        params.append(department_id)
        
    query += " ORDER BY c.timestamp DESC"
    rows = conn.execute(query, params).fetchall()
    
    # Also fetch compensation for each complaint
    complaints = [dict(row) for row in rows]
    for c in complaints:
        comp = conn.execute("SELECT * FROM complaint_compensation WHERE complaint_id = ?", (c['id'],)).fetchall()
        c['compensations'] = [dict(x) for x in comp]
        
    conn.close()
    return jsonify(complaints)

@app.route('/api/support/action', methods=['POST'])
def support_action():
    data = request.json
    complaint_id = data.get('complaint_id')
    action = data.get('action') # 'Verify', 'Reject', 'Resolve', 'Forward'
    admin_text = data.get('admin_response_text', '')
    department_id = data.get('department_id')
    
    conn = get_db_connection()
    
    if action == 'Forward':
        new_status = 'Forwarded to Department'
        conn.execute("UPDATE complaints SET status = ?, admin_response_text = ?, department_id = ? WHERE id = ?",
                    (new_status, admin_text, department_id, complaint_id))
    elif action == 'Resolve':
        new_status = 'Resolved'
        conn.execute("UPDATE complaints SET status = ?, admin_response_text = ? WHERE id = ?",
                    (new_status, admin_text, complaint_id))
        
        # Handle compensation
        comp_type = data.get('compensation_type', None)
        comp_amt = data.get('compensation_amount')
        comp_code = data.get('coupon_code')
        if comp_type:
             conn.execute("INSERT INTO complaint_compensation (complaint_id, type, amount, coupon_code) VALUES (?, ?, ?, ?)",
                         (complaint_id, comp_type, comp_amt, comp_code))
    else:
        # e.g. Reject, Verify (as 'Verified by L1')
        status_map = {'Verify': 'Verified by L1', 'Reject': 'Rejected'}
        new_status = status_map.get(action, 'Pending')
        conn.execute("UPDATE complaints SET status = ?, admin_response_text = ? WHERE id = ?",
                    (new_status, admin_text, complaint_id))
                    
    conn.commit()
    conn.close()
    return jsonify({'message': 'Action applied successfully'})

# --- MASTER ADMIN FEATURES ---

@app.route('/api/master/staff', methods=['POST', 'GET'])
def master_staff():
    conn = get_db_connection()
    
    if request.method == 'POST':
        data = request.json
        uname = data.get('username')
        pwd = data.get('password') # Plain string for simplified dashboards, or hashed if preferred. Sticking to plain as handled in login.
        role = data.get('role')
        z_id = data.get('zone_id')
        dep_id = data.get('department_id')
        admin_id = data.get('admin_id')
        
        try:
            conn.execute("INSERT INTO support_staff (username, password, role, zone_id, department_id, created_by_admin) VALUES (?, ?, ?, ?, ?, ?)",
                        (uname, pwd, role, z_id, dep_id, admin_id))
            conn.commit()
            res = jsonify({'message': 'Account created'})
            res.status_code = 201
        except sqlite3.IntegrityError:
            res = jsonify({'error': 'Username exists'})
            res.status_code = 409
        conn.close()
        return res
        
    elif request.method == 'GET':
        z_id = request.args.get('zone_id')
        rows = conn.execute("SELECT * FROM support_staff WHERE zone_id = ?", (z_id,)).fetchall()
        conn.close()
        return jsonify([dict(r) for r in rows])

@app.route('/api/master/stats', methods=['GET'])
def master_stats():
    z_id = request.args.get('zone_id')
    conn = get_db_connection()
    
    total = conn.execute("SELECT COUNT(*) as c FROM complaints WHERE zone_id = ?", (z_id,)).fetchone()['c']
    pending = conn.execute("SELECT COUNT(*) as c FROM complaints WHERE zone_id = ? AND status != 'Resolved' AND status != 'Rejected'", (z_id,)).fetchone()['c']
    resolved = conn.execute("SELECT COUNT(*) as c FROM complaints WHERE zone_id = ? AND status = 'Resolved'", (z_id,)).fetchone()['c']
    
    dept_stats = conn.execute("SELECT d.department_name, COUNT(c.id) as count FROM departments d LEFT JOIN complaints c ON d.department_id = c.department_id AND c.zone_id = ? GROUP BY d.department_id", (z_id,)).fetchall()
    
    conn.close()
    
    return jsonify({
        'total': total,
        'pending': pending,
        'resolved': resolved,
        'workload': {r['department_name']: r['count'] for r in dept_stats}
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
