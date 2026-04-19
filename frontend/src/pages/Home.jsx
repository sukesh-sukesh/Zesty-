
import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
    return (
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
            <h1 style={{ fontSize: '3rem', color: '#fc8019', marginBottom: '1rem' }}>Zesty</h1>
            <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '3rem' }}>
                Intelligent Customer Complaint Resolution System
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
                <Link to="/login/user" style={{ padding: '1.5rem 2.5rem', border: '2px solid #fc8019', borderRadius: '12px', textDecoration: 'none', color: '#fc8019', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    User Login
                </Link>

                <Link to="/login/admin" style={{ padding: '1.5rem 2.5rem', background: '#fc8019', borderRadius: '12px', textDecoration: 'none', color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    Admin Login
                </Link>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem' }}>
                <Link to="/support/login" style={{ padding: '1rem 2rem', background: '#3b82f6', borderRadius: '12px', textDecoration: 'none', color: 'white', fontSize: '1.1rem', fontWeight: 'bold' }}>
                    Support Portal (L1/L2)
                </Link>

                <Link to="/master/login" style={{ padding: '1rem 2rem', background: '#10b981', borderRadius: '12px', textDecoration: 'none', color: 'white', fontSize: '1.1rem', fontWeight: 'bold' }}>
                    Master Admin
                </Link>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <Link to="/register" style={{ color: '#999', textDecoration: 'underline' }}>New User? Create an account</Link>
            </div>
        </div>
    );
}

export default Home;
