import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supportLogin } from '../api';

const SupportLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        const res = await supportLogin(username, password);
        if (res.error) {
            setError(res.error);
        } else {
            localStorage.setItem('supportUser', JSON.stringify(res.user));
            navigate('/support/dashboard');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>Support Portal Login</h2>
                <p>Login for L1 and L2 Support Agents</p>
                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>Username</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    {error && <p className="error">{error}</p>}
                    <button type="submit" className="login-btn">Login</button>
                </form>
            </div>
        </div>
    );
};

export default SupportLogin;
