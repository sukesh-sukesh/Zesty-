
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../api';

function UserLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const res = await loginUser(username, password, 'user');
        if (res.error) {
            setError(res.error);
        } else {
            // Save user to session storage
            sessionStorage.setItem('user', JSON.stringify(res.user));
            navigate('/user/dashboard');
        }
    };

    return (
        <div className="container" style={{ maxWidth: '400px', marginTop: '4rem' }}>
            <div className="card">
                <h2 style={{ textAlign: 'center', color: '#fc8019', marginBottom: '1.5rem' }}>User Login</h2>
                {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Username"
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
                    <button type="submit" className="btn-primary" style={{ width: '100%' }}>Login</button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1rem' }}>
                    Don't have an account? <Link to="/register">Register here</Link>
                </p>
            </div>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <Link to="/login/admin" style={{ color: '#999', fontSize: '0.8rem' }}>Admin Access</Link>
            </div>
        </div>
    );
}

export default UserLogin;
