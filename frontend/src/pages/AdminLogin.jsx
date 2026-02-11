
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../api';

function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const res = await loginUser(username, password, 'admin');
            if (res.error) {
                setError(res.error);
            } else {
                // Save user to session storage
                sessionStorage.setItem('admin', JSON.stringify(res.user));
                navigate('/admin/dashboard');
            }
        } catch (err) {
            setError(err.message || 'Login failed');
        }
    };

    return (
        <div className="container" style={{ maxWidth: '400px', marginTop: '4rem' }}>
            <div className="card" style={{ borderColor: '#666' }}>
                <h2 style={{ textAlign: 'center', color: '#666', marginBottom: '1.5rem' }}>Admin Portal</h2>
                {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Admin Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit" className="btn-primary" style={{ width: '100%', background: '#ff7043' }}>Admin Login</button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1rem' }}>
                    New Admin? <Link to="/register/admin" style={{ color: '#ff7043' }}>Register here</Link>
                </p>
            </div>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <Link to="/login/user" style={{ color: '#fc8019' }}>Back to User Login</Link>
            </div>
        </div>
    );
}

export default AdminLogin;
