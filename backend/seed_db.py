import sqlite3
import random
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
import sys
import os

# Removed faker import

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, 'complaints.db')

ZONES = {
    'Coimbatore': 'Coimbatore District',
    'Chennai': 'Chennai District',
    'Bangalore': 'Urban',
    'Hyderabad': 'Hyderabad District',
    'Kochi': 'Kochi District'
}
DEPARTMENTS = ['Finance', 'Delivery', 'Restaurant', 'App Issue']

COMPLAINT_CATEGORIES = ['Delivery Delay', 'Food Quality', 'Payment Issue', 'Restaurant Issue', 'App Issue']
COMPLAINT_WEIGHTS = [0.30, 0.25, 0.20, 0.15, 0.10]

STATUSES = ['Pending', 'Verified by L1', 'Forwarded to Department', 'Under Investigation', 'Resolved', 'Rejected']

# Text samples for realistic testing
TEXT_SAMPLES = {
    'Delivery Delay': [
        "My order is 45 minutes late.", "The delivery guy is lost and not answering.",
        "It said 20 mins but a hour has passed.", "Delivery is taking forever.",
        "Food arrived an hour late and cold."
    ],
    'Food Quality': [
        "The food tastes stale.", "The dosa was burnt.", "Found a hair in my biryani.",
        "The curry is completely tasteless.", "The items smell spoiled."
    ],
    'Payment Issue': [
        "Money deducted but order failed.", "Charged twice for the same order.",
        "Refund not received after 5 days.", "Promo code did not apply at checkout.",
        "Payment gateway crashed during transaction."
    ],
    'Restaurant Issue': [
        "Missing the extra chutney I asked for.", "Sent non-veg instead of veg.",
        "Restaurant cancelled after 40 minutes.", "Packaging was completely torn.",
        "Wrong item delivered entirely."
    ],
    'App Issue': [
        "App keeps crashing on checkout.", "Location is showing wrong on the map.",
        "Cannot add items to cart, throws error.", "The app froze during payment.",
        "Login is not working properly."
    ]
}

RESTAURANTS_MAP = {
    'Coimbatore': ['Annapoorna Gowrishankar', 'Haribhavanam', 'Junior Kuppanna', 'A2B Adyar Ananda Bhavan'],
    'Chennai': ['Murugan Idli Shop', 'Sangeetha Veg Restaurant', 'Saravana Bhavan'],
    'Bangalore': ['CTR', 'Vidyarthi Bhavan', 'Rameshwaram Cafe', 'MTR'],
    'Kochi': ['Dhe Puttu', 'Paragon Restaurant', 'Brindhavan Veg'],
    'Hyderabad': ['Chutneys', 'Rayalaseema Ruchulu', 'Minerva Coffee Shop']
}

MENU = ["Idli", "Medu Vada", "Masala Dosa", "Filter Coffee", "Paneer Butter Masala", "Curd Rice", "South Indian Meals", "Upma"]

def generate_random_date(start, end):
    delta = end - start
    random_days = random.randrange(delta.days + 1)
    random_seconds = random.randrange(24*60*60)
    return start + timedelta(days=random_days, seconds=random_seconds)

def main():
    print("Connecting to DB...")
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    print("Cleaning database...")
    # Clean tables (except admin users if we want, but let's wipe everything for a clean slate and recreate admin)
    cursor.execute("DELETE FROM complaint_compensation")
    cursor.execute("DELETE FROM complaints")
    cursor.execute("DELETE FROM orders")
    cursor.execute("DELETE FROM company_admin_registry")
    cursor.execute("DELETE FROM support_staff")
    cursor.execute("DELETE FROM users WHERE role != 'admin'")
    conn.commit()

    # 1. Setup Zones & Departments
    cursor.execute("SELECT zone_id, zone_name FROM zones")
    existing_zones = {row[1]: row[0] for row in cursor.fetchall()}
    
    for z_name, dist in ZONES.items():
        if z_name not in existing_zones:
            cursor.execute("INSERT INTO zones (zone_name, district) VALUES (?, ?)", (z_name, dist))
            existing_zones[z_name] = cursor.lastrowid
            
    cursor.execute("SELECT department_id, department_name FROM departments")
    existing_depts = {row[1]: row[0] for row in cursor.fetchall()}
    
    for d_name in DEPARTMENTS:
        if d_name not in existing_depts:
            cursor.execute("INSERT INTO departments (department_name) VALUES (?)", (d_name,))
            existing_depts[d_name] = cursor.lastrowid

    # Master Admin Creation (Zone admins)
    ADMIN_PWD = generate_password_hash("admin123")
    try:
        cursor.execute("INSERT INTO company_admin_registry (zone_id, admin_username, admin_password) VALUES (?, ?, ?)",
                      (1, "master", generate_password_hash("master123")))
    except sqlite3.IntegrityError:
        pass # exists

    for z_name, z_id in existing_zones.items():
        try:
            cursor.execute("INSERT INTO company_admin_registry (zone_id, admin_username, admin_password) VALUES (?, ?, ?)",
                          (z_id, f"{z_name.lower()}_admin", ADMIN_PWD))
        except sqlite3.IntegrityError:
            pass # exists

    print("Seeding L1 and L2 Support Staff...")
    DEFAULT_PWD = "password123"
    # Create Staff
    for z_name, z_id in existing_zones.items():
        # 5 L1 agents
        for i in range(5):
            uname = f"{z_name.lower()}_l1_{i+1}"
            cursor.execute("INSERT INTO support_staff (username, password, role, zone_id, created_by_admin) VALUES (?, ?, ?, ?, ?)",
                          (uname, DEFAULT_PWD, "L1", z_id, 1))
        
        # 2 L2 agents per dept
        for d_name, d_id in existing_depts.items():
            for i in range(2):
                uname = f"{z_name.lower()}_{d_name.lower().replace(' ', '')}_l2_{i+1}"
                cursor.execute("INSERT INTO support_staff (username, password, role, zone_id, department_id, created_by_admin) VALUES (?, ?, ?, ?, ?, ?)",
                              (uname, DEFAULT_PWD, "L2", z_id, d_id, 1))

    conn.commit()

    print("Generating 1200 Users (240 per zone)...")
    USER_PWD = generate_password_hash("password123")
    user_ids = []
    
    for z_name, z_id in existing_zones.items():
        for _ in range(240):
            # Try unique names
            while True:
                uname = f"user_{random.randint(100000, 999999)}_{random.randint(10, 99)}"
                try:
                    cursor.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", (uname, USER_PWD, 'user'))
                    uid = cursor.lastrowid
                    user_ids.append({'id': uid, 'zone': z_name, 'zone_id': z_id})
                    break
                except sqlite3.IntegrityError:
                    continue

    conn.commit()

    print("Generating Orders (3-5 per user) & 2400 Complaints...")
    # Need exactly 2400 complaints. 1200 users * 2 = 2400.
    
    # Dates setup (2026 dates)
    jan_start = datetime(2026, 1, 1)
    jan_end = datetime(2026, 1, 31)
    feb_start = datetime(2026, 2, 1)
    feb_end = datetime(2026, 2, 28)
    mar_start = datetime(2026, 3, 1)
    mar_end = datetime(2026, 3, 7)
    
    complaint_dates = []
    # 800 in Jan
    complaint_dates.extend([generate_random_date(jan_start, jan_end) for _ in range(800)])
    # 1000 in Feb
    complaint_dates.extend([generate_random_date(feb_start, feb_end) for _ in range(1000)])
    # 600 in Mar
    complaint_dates.extend([generate_random_date(mar_start, mar_end) for _ in range(600)])
    
    # Shuffle dates to assign randomly
    random.shuffle(complaint_dates)
    
    date_index = 0
    
    for user in user_ids:
        # Generate 3-5 orders
        num_orders = random.randint(3, 5)
        user_orders = []
        for _ in range(num_orders):
            rest_name = random.choice(RESTAURANTS_MAP[user['zone']])
            items = ", ".join([f"{random.choice(MENU)} (x{random.randint(1,3)})" for _ in range(random.randint(1, 4))])
            amount = random.randint(150, 800)
            
            # Sub 1-20 days from a reference date for order date
            order_date = datetime(2026, 1, 1) + timedelta(days=random.randint(0, 60))
            
            cursor.execute("INSERT INTO orders (user_id, restaurant_name, items, total_amount, order_date, status) VALUES (?, ?, ?, ?, ?, ?)",
                          (user['id'], rest_name, items, amount, order_date.strftime("%Y-%m-%d %H:%M:%S"), 'Delivered'))
            user_orders.append(cursor.lastrowid)

        # Generating 2 Complaints per user
        for _ in range(2):
             cat = random.choices(COMPLAINT_CATEGORIES, weights=COMPLAINT_WEIGHTS)[0]
             text = random.choice(TEXT_SAMPLES[cat])
             c_date = complaint_dates[date_index]
             date_index += 1
             
             o_id = random.choice(user_orders)
             
             # Status logic rules for lifecycle simulation
             # If it's old (Jan), mostly resolved. If it's march, more pending.
             months_old = (datetime.now() - c_date).days / 30.0 # Just relative
             days_ago = (datetime(2026, 3, 8) - c_date).days
             
             if days_ago < 2:
                 status = random.choices(['Pending', 'Verified by L1'], weights=[0.8, 0.2])[0]
             elif days_ago < 5:
                 status = random.choices(['Verified by L1', 'Forwarded to Department', 'Under Investigation', 'Resolved'], weights=[0.2, 0.4, 0.2, 0.2])[0]
             else:
                 status = random.choices(['Resolved', 'Rejected'], weights=[0.8, 0.2])[0]
                 
             # Map Department
             dept_id = None
             if status in ['Forwarded to Department', 'Under Investigation', 'Resolved', 'Rejected']:
                 if cat in ['Delivery Delay']: dept_id = existing_depts['Delivery']
                 elif cat in ['Food Quality', 'Restaurant Issue']: dept_id = existing_depts['Restaurant']
                 elif cat in ['Payment Issue']: dept_id = existing_depts['Finance']
                 else: dept_id = existing_depts['App Issue']
                     
             # Admin text
             admin_res = None
             if status == 'Resolved':
                 admin_res = "We have investigated your issue and provided a resolution."
             elif status == 'Rejected':
                 admin_res = "As per policy, we cannot proceed with compensation for this claim."
             elif status in ['Forwarded to Department', 'Under Investigation']:
                 admin_res = "Case escalated to the specialized department."
                 
             cursor.execute('''
                 INSERT INTO complaints (user_id, order_id, text, category, status, admin_response_text, timestamp, zone_id, department_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ''', (user['id'], o_id, text, cat, status, admin_res, c_date.strftime("%Y-%m-%d %H:%M:%S"), user['zone_id'], dept_id))
             
             c_id = cursor.lastrowid
             
             # Add compensation if Resolved
             if status == 'Resolved':
                 comp_type = random.choice(['Refund', 'Coupon', 'Free Delivery', 'Wallet Credit'])
                 amt = random.randint(50, 500) if comp_type in ['Refund', 'Wallet Credit'] else 0
                 code = f"ZSTY{random.randint(1000, 9999)}" if comp_type == 'Coupon' else None
                 
                 cursor.execute("INSERT INTO complaint_compensation (complaint_id, type, amount, coupon_code, created_at) VALUES (?, ?, ?, ?, ?)",
                               (c_id, comp_type, amt, code, c_date.strftime("%Y-%m-%d %H:%M:%S")))

    conn.commit()
    conn.close()
    
    print("Database seeding completed successfully!")
    print(f"Added:")
    print(f"- 1200 Users")
    print(f"- ~4000+ Orders")
    print(f"- 2400 Complaints")
    print(f"- 25 L1 Agents, 40 L2 Agents")

if __name__ == '__main__':
    main()
