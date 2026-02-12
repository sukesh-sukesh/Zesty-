import sqlite3
from werkzeug.security import generate_password_hash

DATABASE = 'backend/complaints.db'

def reset_users():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    print("--- Current Users ---")
    users = cursor.execute("SELECT id, username, role FROM users").fetchall()
    for u in users:
        print(u)
        
    print("\n--- Resetting Admin ---")
    admin_pass = generate_password_hash("admin123")
    
    # Check if admin exists
    cursor.execute("SELECT * FROM users WHERE username = 'admin'")
    if cursor.fetchone():
        cursor.execute("UPDATE users SET password = ? WHERE username = 'admin'", (admin_pass,))
        print("Admin password updated to 'admin123'")
    else:
        cursor.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", 
                      ("admin", admin_pass, "admin"))
        print("Admin user created with password 'admin123'")

    print("\n--- Ensuring Test User ---")
    user_pass = generate_password_hash("password123")
    cursor.execute("SELECT * FROM users WHERE username = 'user1'")
    if not cursor.fetchone():
        cursor.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", 
                      ("user1", user_pass, "user"))
        print("User 'user1' created with password 'password123'")
    else:
        cursor.execute("UPDATE users SET password = ? WHERE username = 'user1'", (user_pass,))
        print("User 'user1' password updated to 'password123'")
        
    conn.commit()
    conn.close()
    print("\nDone.")

if __name__ == "__main__":
    reset_users()
