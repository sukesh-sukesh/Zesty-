import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { masterLogin } from '../api';

const MasterLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        const res = await masterLogin(username, password);
        if (res.error) {
            setError(res.error);
        } else {
            localStorage.setItem('masterUser', JSON.stringify(res.user));
            navigate('/master/dashboard');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card" style={{ borderTop: '4px solid #10b981' }}>
                <h2>Company Registry Login</h2>
                <p>Authorized Zone Master Admins Only</p>
                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>Master Username</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    {error && <p className="error">{error}</p>}
                    <button type="submit" className="login-btn" style={{ background: '#10b981' }}>Secure Login</button>
                </form>
            </div>
        </div>
    );
};

export default MasterLogin;
