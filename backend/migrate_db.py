import sqlite3
import pandas as pd

conn = sqlite3.connect('complaints.db')
cursor = conn.cursor()

# Enable foreign keys
cursor.execute("PRAGMA foreign_keys = OFF;")

# 1. users table
cursor.execute("""
CREATE TABLE users_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    zone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
""")
cursor.execute("""
INSERT INTO users_new (id, username, password, role) 
SELECT id, username, password, role FROM users;
""")
# Attempt to backfill user zone from orders if they have any, or random distribution
cursor.execute("""
UPDATE users_new 
SET zone = (
    SELECT z.zone_name 
    FROM orders o 
    JOIN complaints c ON o.id = c.order_id 
    JOIN zones z ON c.zone_id = z.zone_id 
    WHERE o.user_id = users_new.id 
    LIMIT 1
) WHERE role = 'user';
""")
# Any remaining users set a default zone just in case
cursor.execute("UPDATE users_new SET zone = 'Coimbatore' WHERE zone IS NULL AND role = 'user';")

# 2. orders table (ensure relationships)
cursor.execute("""
CREATE TABLE orders_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    restaurant_name TEXT NOT NULL,
    items TEXT NOT NULL,
    total_amount REAL NOT NULL,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'Delivered',
    FOREIGN KEY (user_id) REFERENCES users (id)
);
""")
cursor.execute("""
INSERT INTO orders_new (id, user_id, restaurant_name, items, total_amount, order_date, status)
SELECT id, user_id, restaurant_name, items, total_amount, order_date, status FROM orders;
""")

# 3. complaints table
cursor.execute("""
CREATE TABLE complaints_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    order_id INTEGER,
    text TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    zone TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    assigned_l1 INTEGER,
    assigned_l2 INTEGER,
    admin_response_text TEXT,
    zone_id INTEGER,
    department_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (order_id) REFERENCES orders (id),
    FOREIGN KEY (assigned_l1) REFERENCES support_staff (id),
    FOREIGN KEY (assigned_l2) REFERENCES support_staff (id),
    FOREIGN KEY (zone_id) REFERENCES zones (zone_id),
    FOREIGN KEY (department_id) REFERENCES departments (department_id)
);
""")

cursor.execute("""
INSERT INTO complaints_new (id, user_id, order_id, text, category, status, timestamp, admin_response_text, zone_id, department_id)
SELECT id, user_id, order_id, text, category, status, timestamp, admin_response_text, zone_id, department_id FROM complaints;
""")

# Populating 'zone', 'assigned_l1', 'assigned_l2' based on existing data
cursor.execute("""
UPDATE complaints_new 
SET zone = (SELECT zone_name FROM zones WHERE zones.zone_id = complaints_new.zone_id);
""")

cursor.execute("""
UPDATE complaints_new
SET assigned_l1 = (
    SELECT id FROM support_staff 
    WHERE role = 'L1' AND zone_id = complaints_new.zone_id 
    ORDER BY RANDOM() LIMIT 1
)
WHERE status != 'Pending';
""")

cursor.execute("""
UPDATE complaints_new
SET assigned_l2 = (
    SELECT id FROM support_staff 
    WHERE role = 'L2' AND zone_id = complaints_new.zone_id AND department_id = complaints_new.department_id
    ORDER BY RANDOM() LIMIT 1
)
WHERE status IN ('Under Investigation', 'Resolved', 'Rejected');
""")


# Replace old tables
cursor.execute("DROP TABLE users;")
cursor.execute("ALTER TABLE users_new RENAME TO users;")

cursor.execute("DROP TABLE orders;")
cursor.execute("ALTER TABLE orders_new RENAME TO orders;")

cursor.execute("DROP TABLE complaints;")
cursor.execute("ALTER TABLE complaints_new RENAME TO complaints;")

conn.commit()
cursor.execute("PRAGMA foreign_keys = ON;")
conn.close()

print("Schema migration complete.")
