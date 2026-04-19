import sqlite3
import pandas as pd

def print_separator(title=""):
    print("\n" + "="*110)
    if title:
        print(f"{title.center(110)}")
        print("="*110 + "\n")

def display_users(cursor):
    print_separator("USERS TABLE (Sample - first 5 per zone)")
    query = """
    SELECT u.id, u.username, u.role, z.zone_name 
    FROM users u 
    LEFT JOIN complaints c ON u.id = c.user_id 
    LEFT JOIN zones z ON c.zone_id = z.zone_id
    GROUP BY u.username
    HAVING count(u.username) > 0
    """
    
    try:
        df = pd.read_sql_query("SELECT id, username, role FROM users LIMIT 10", cursor.connection)
        print(df.to_string(index=False))
        print("...")
        
        # count users
        df_count = pd.read_sql_query("SELECT role, COUNT(*) as count FROM users GROUP BY role", cursor.connection)
        print("\nSummary by Role:")
        print(df_count.to_string(index=False))
        
    except Exception as e:
        print(f"Error reading users: {e}")

def display_staff(cursor):
    print_separator("SUPPORT STAFF BY ZONE")
    query = """
    SELECT s.id, s.username, s.role, z.zone_name, d.department_name
    FROM support_staff s
    LEFT JOIN zones z ON s.zone_id = z.zone_id
    LEFT JOIN departments d ON s.department_id = d.department_id
    ORDER BY z.zone_name, s.role, d.department_name
    """
    try:
        df = pd.read_sql_query(query, cursor.connection)
        # Summarize to fit screen
        print("Sample Staff (Showing 2 per zone):")
        sampled_staff = df.groupby('zone_name').head(2)
        print(sampled_staff.to_string(index=False))
        
        # Count staff by zone and role
        print("\nStaff Distribution:")
        counts = df.groupby(['zone_name', 'role']).size().reset_index(name='count')
        print(counts.to_string(index=False))
    except Exception as e:
        print(f"Error reading staff: {e}")

def display_orders(cursor):
    print_separator("ORDERS TABLE (Sample limit 10)")
    query = "SELECT id, user_id, restaurant_name, total_amount, status, date(order_date) as date FROM orders LIMIT 10"
    try:
         df = pd.read_sql_query(query, cursor.connection)
         print(df.to_string(index=False))
         
         # count
         cursor.execute("SELECT count(*) FROM orders")
         print(f"\nTotal Orders in DB: {cursor.fetchone()[0]}")
    except Exception as e:
        print(f"Error reading orders: {e}")

def display_complaints_by_zone(cursor):
    print_separator("LIVE COMPLAINTS DETAILED (Grouped By Zone)")
    
    # Get all zones
    cursor.execute("SELECT zone_id, zone_name FROM zones ORDER BY zone_name")
    zones = cursor.fetchall()
    
    for z_id, z_name in zones:
        print(f"\n--- {z_name.upper()} ZONE ---")
        
        # Fetch 5 sample complaints for this zone
        query = f"""
        SELECT c.id, u.username, c.category, c.status, substr(c.timestamp, 1, 10) as date
        FROM complaints c
        JOIN users u ON c.user_id = u.id
        WHERE c.zone_id = {z_id}
        LIMIT 5
        """
        try:
            df = pd.read_sql_query(query, cursor.connection)
            if not df.empty:
                print(df.to_string(index=False))
            else:
                print("No complaints found for this zone.")
                
            # Fetch summary stats for this zone
            stat_query = f"SELECT status, count(*) as count FROM complaints WHERE zone_id = {z_id} GROUP BY status"
            df_stats = pd.read_sql_query(stat_query, cursor.connection)
            print("\n  [Status Summary]:", ", ".join([f"{row['status']}: {row['count']}" for _, row in df_stats.iterrows()]))
            
        except Exception as e:
             print(f"Error reading complaints for {z_name}: {e}")

def display_compensations(cursor):
    print_separator("COMPENSATIONS GRANTED (Sample limit 10)")
    query = """
    SELECT cc.id, c.id as complaint_id, cc.type, cc.amount, cc.coupon_code 
    FROM complaint_compensation cc
    JOIN complaints c ON cc.complaint_id = c.id
    LIMIT 10
    """
    try:
        df = pd.read_sql_query(query, cursor.connection)
        print(df.to_string(index=False))
        
        # Totals
        cursor.execute("SELECT sum(amount) FROM complaint_compensation WHERE type IN ('Refund', 'Wallet Credit')")
        total_amt = cursor.fetchone()[0] or 0
        cursor.execute("SELECT count(*) FROM complaint_compensation WHERE type = 'Coupon'")
        total_coupons = cursor.fetchone()[0] or 0
        print(f"\nTotal Financial Compensation Granted: ₹{total_amt}")
        print(f"Total Coupons Issued: {total_coupons}")

    except Exception as e:
        print(f"Error reading compensations: {e}")


def main():
    print_separator("MASTER DATABASE DEMO - FULL SYSTEM OVERVIEW")
    
    try:
        # We need pandas for pretty printing dataframes
        import pandas
    except ImportError:
        print("Installing pandas for better database formatting...")
        import subprocess
        import sys
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pandas", "tabulate"])
        print("\n\nNow running Demo...")

    conn = sqlite3.connect('complaints.db')
    cursor = conn.cursor()
    
    # 1. Summary of Tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cursor.fetchall() if t[0] != 'sqlite_sequence']
    print(f"Detected Tables: {', '.join(tables)}")
    
    # 2. Show Users
    display_users(cursor)
    
    # 3. Show Staff structure
    display_staff(cursor)
    
    # 4. Show Orders
    display_orders(cursor)
    
    # 5. Show Complaints by Zone (The main event)
    display_complaints_by_zone(cursor)
    
    # 6. Show Compensations/Resolutions
    display_compensations(cursor)
    
    conn.close()
    print_separator("END OF DATABASE DUMP")

if __name__ == '__main__':
    main()
