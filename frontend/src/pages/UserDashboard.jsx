
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { predictComplaint, getComplaints } from '../api';
import { Send, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

function UserDashboard() {
    const [text, setText] = useState('');
    const [result, setResult] = useState(null);
    const [myComplaints, setMyComplaints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Get user from session
    const user = JSON.parse(sessionStorage.getItem('user'));

    useEffect(() => {
        if (!user) {
            navigate('/login/user');
            return;
        }
        fetchMyComplaints();
    }, [user, navigate]);

    const fetchMyComplaints = async () => {
        if (user) {
            const data = await getComplaints({ user_id: user.id, role: 'user' });
            setMyComplaints(data);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const data = await predictComplaint(text, user.id);
            if (data.error) {
                setError(data.error);
            } else {
                setResult(data);
                setText('');
                fetchMyComplaints(); // Refresh list
            }
        } catch (err) {
            setError('Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Resolved': return <CheckCircle size={16} color="green" />;
            case 'Verified': return <CheckCircle size={16} color="blue" />;
            case 'Not Responded': return <XCircle size={16} color="red" />;
            default: return <Clock size={16} color="orange" />;
        }
    };

    if (!user) return null;

    return (
        <div className="user-dashboard">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Welcome, {user.username} 👋</h2>
                <button onClick={() => { sessionStorage.removeItem('user'); navigate('/login/user'); }} style={{ background: '#eee', color: '#333' }}>Logout</button>
            </header>

            <div className="grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                {/* Submit Complaint */}
                <div className="card">
                    <h3>Submit a New Complaint</h3>
                    <form onSubmit={handleSubmit}>
                        <textarea
                            rows="5"
                            placeholder="Describe your issue..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            disabled={loading}
                        />
                        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                            {loading ? 'Submitting...' : 'Submit Complaint'}
                        </button>
                    </form>
                    {error && <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}
                    {result && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: '#e8f5e9', borderRadius: '8px', color: 'green' }}>
                            <b>Category:</b> {result.category} <br />
                            <b>Status:</b> {result.status}
                        </div>
                    )}
                </div>

                {/* My Complaints */}
                <div className="card">
                    <h3>My Complaints</h3>
                    {myComplaints.length === 0 ? (
                        <p style={{ color: '#999' }}>No complaints submitted yet.</p>
                    ) : (
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {myComplaints.map(c => (
                                <div key={c.id} style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span className={`category-badge cat-${c.category.split(' ')[0]}`}>{c.category}</span>
                                        <span style={{ fontSize: '0.8rem', color: '#999' }}>{new Date(c.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>{c.text}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                        Status: {getStatusIcon(c.status)}
                                        <b style={{
                                            color: c.status === 'Resolved' ? 'green' :
                                                c.status === 'Verified' ? 'blue' :
                                                    c.status === 'Pending' ? 'orange' : 'red'
                                        }}>{c.status}</b>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserDashboard;
