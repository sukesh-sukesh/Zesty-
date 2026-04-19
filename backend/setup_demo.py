import sqlite3
from werkzeug.security import generate_password_hash

def setup_demo():
    conn = sqlite3.connect('complaints.db')
    cursor = conn.cursor()

    # Create Coimbatore zone if not exists
    cursor.execute("SELECT zone_id FROM zones WHERE zone_name = 'Coimbatore'")
    row = cursor.fetchone()
    if row:
        zone_id = row[0]
    else:
        cursor.execute("INSERT INTO zones (zone_name, district) VALUES (?, ?)", ('Coimbatore', 'Coimbatore District'))
        zone_id = cursor.lastrowid
        conn.commit()

    print(f"Coimbatore Zone ID: {zone_id}")

    # Set up master admin for Coimbatore
    master_username = 'master'
    master_password = 'master123'
    master_pass_hash = generate_password_hash(master_password)
    
    # Check if 'master' uses this zone, else update it
    cursor.execute("SELECT id FROM company_admin_registry WHERE admin_username = ?", (master_username,))
    master_row = cursor.fetchone()
    if master_row:
        cursor.execute("UPDATE company_admin_registry SET zone_id = ?, admin_password = ? WHERE admin_username = ?", 
                       (zone_id, master_pass_hash, master_username))
    else:
        cursor.execute("INSERT INTO company_admin_registry (zone_id, admin_username, admin_password) VALUES (?, ?, ?)",
                       (zone_id, master_username, master_pass_hash))
    
    # Also create specific Coimbatore admin just in case
    coimbatore_admin = 'coimbatore_admin'
    
    cursor.execute("SELECT id FROM company_admin_registry WHERE admin_username = ?", (coimbatore_admin,))
    c_master_row = cursor.fetchone()
    if c_master_row:
        cursor.execute("UPDATE company_admin_registry SET admin_password = ? WHERE admin_username = ?", 
                       (master_pass_hash, coimbatore_admin))
    else:
        cursor.execute("INSERT INTO company_admin_registry (zone_id, admin_username, admin_password) VALUES (?, ?, ?)",
                       (zone_id, coimbatore_admin, master_pass_hash))
                       
    # Set up support staff for Coimbatore
    staff_members = [
        ('l1_support', 'support123', 'L1 Support', 1), # L1 Support doesn't strictly need a dept, often App Issue but we give 4 for App Issue
        ('l2_finance', 'support123', 'L2 Support', 1),
        ('l2_delivery', 'support123', 'L2 Support', 2),
        ('l2_restaurant', 'support123', 'L2 Support', 3),
        ('l2_app', 'support123', 'L2 Support', 4)
    ]
    
    for username, password, role, dept_id in staff_members:
        cursor.execute("SELECT id FROM support_staff WHERE username = ?", (username,))
        staff_row = cursor.fetchone()
        if staff_row:
            cursor.execute("UPDATE support_staff SET password = ?, role = ?, zone_id = ?, department_id = ? WHERE username = ?",
                           (password, role, zone_id, dept_id, username))
        else:
            cursor.execute("INSERT INTO support_staff (username, password, role, zone_id, department_id, created_by_admin) VALUES (?, ?, ?, ?, ?, ?)",
                           (username, password, role, zone_id, dept_id, 1))

    # Add a user to test
    user_pass = generate_password_hash('user123')
    cursor.execute("SELECT id FROM users WHERE username = 'testuser'")
    if not cursor.fetchone():
        cursor.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", ('testuser', user_pass, 'user'))
        
    conn.commit()
    conn.close()
    print("Demo data for Coimbatore setup successfully!")

if __name__ == '__main__':
    setup_demo()
