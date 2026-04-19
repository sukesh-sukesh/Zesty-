import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupportComplaints, supportAction, getDepartments } from '../api';

const SupportDashboard = () => {
    const [user, setUser] = useState(null);
    const [complaints, setComplaints] = useState([]);
    const [departments, setDepartments] = useState([]);

    // Filters and Stats State
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterCategory, setFilterCategory] = useState('All');

    const navigate = useNavigate();

    useEffect(() => {
        const stored = localStorage.getItem('supportUser');
        if (!stored) {
            navigate('/support/login');
            return;
        }
        const u = JSON.parse(stored);
        setUser(u);
        loadData(u);
        fetchDepartments();
    }, [navigate]);

    const fetchDepartments = async () => {
        const res = await getDepartments();
        setDepartments(res);
    };

    const loadData = async (u) => {
        // If L2, they only see complaints forwarded to their department_id
        const deps = u.role === 'L2' ? u.department_id : '';
        const res = await getSupportComplaints(u.zone_id, deps);
        setComplaints(res);
    };

    const handleAction = async (id, action, deptId = null) => {
        let admin_response_text = prompt("Enter optional response message to user:");
        let payload = { complaint_id: id, action, admin_response_text };
        if (action === 'Forward') {
            payload.department_id = deptId;
        }

        // Compensation if Resolve by L2
        if (action === 'Resolve' && user.role === 'L2') {
            const withComp = window.confirm("Add compensation?");
            if (withComp) {
                payload.compensation_type = prompt("Type (refund, coupon, wallet, free_delivery):", "coupon");
                payload.compensation_amount = parseFloat(prompt("Amount in \u20B9 (if applicable):", "0"));
                if (payload.compensation_type === 'coupon' || payload.compensation_type === 'free_delivery') {
                    payload.coupon_code = prompt("Enter code:", "SUPPORT_COMP_100");
                }
            }
        }

        const res = await supportAction(payload);
        if (!res.error) {
            alert("Action successful!");
            loadData(user);
        } else {
            alert("Failed action.");
        }
    };

    if (!user) return <p>Loading...</p>;

    // Filter complaints
    const filteredComplaints = complaints.filter(c => {
        if (filterStatus !== 'All' && c.status !== filterStatus) return false;
        if (filterCategory !== 'All' && c.category !== filterCategory) return false;
        return true;
    });

    // Basic Stats Calculation
    const pendingCount = complaints.filter(c => c.status === 'Pending').length;
    const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;
    const verifiedCount = complaints.filter(c => c.status === 'Verified by L1').length;
    const fwdCount = complaints.filter(c => c.status === 'Forwarded to Department').length;
    const uniqueCategories = [...new Set(complaints.map(c => c.category))];

    return (
        <div className="dashboard">
            <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#fff', borderBottom: '2px solid #e2e8f0' }}>
                <h2>{user.role} Support Dashboard - Zone {user.zone_id}</h2>
                <button className="logout-btn" onClick={() => {
                    localStorage.removeItem('supportUser');
                    navigate('/support/login');
                }}>Logout</button>
            </div>

            <div style={{ padding: '20px' }}>
                {user.role === 'L1' && (
                    <div className="stats-monitoring" style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                        <div style={{ flex: 1, padding: '15px', background: '#fef3c7', borderRadius: '8px' }}><b>Pending:</b> {pendingCount}</div>
                        <div style={{ flex: 1, padding: '15px', background: '#dcfce7', borderRadius: '8px' }}><b>Resolved:</b> {resolvedCount}</div>
                        <div style={{ flex: 1, padding: '15px', background: '#e0f2fe', borderRadius: '8px' }}><b>Verified:</b> {verifiedCount}</div>
                        <div style={{ flex: 1, padding: '15px', background: '#f3e8ff', borderRadius: '8px' }}><b>Forwarded:</b> {fwdCount}</div>
                    </div>
                )}

                <div className="filters" style={{ display: 'flex', gap: '15px', marginBottom: '20px', background: '#fff', padding: '15px', borderRadius: '8px' }}>
                    <div>
                        <label style={{ marginRight: '10px' }}>Status Filter:</label>
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                            <option value="All">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Verified by L1">Verified by L1</option>
                            <option value="Forwarded to Department">Forwarded</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ marginRight: '10px' }}>Category Filter:</label>
                        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                            <option value="All">All Categories</option>
                            {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>

                <div className="dash-content auto-grid">
                    <div className="complaint-list">
                        <h3>Complaints Queue</h3>
                        {filteredComplaints.length === 0 ? <p>No matching complaints.</p> : filteredComplaints.map(c => (
                            <div key={c.id} className={`complaint-card status-${c.status.replace(/\s+/g, '-').toLowerCase()}`}>
                                <div className="c-header">
                                    <strong>#{c.id} - {c.category}</strong>
                                    <span className="status-badge">{c.status}</span>
                                </div>
                                <p>User: {c.user_name} | Order: {c.restaurant_name}</p>
                                <p className="c-text">"{c.text}"</p>
                                {c.compensations && c.compensations.length > 0 && (
                                    <div className="compensation-badge">
                                        Compensation: {c.compensations.map((cmp, i) => (
                                            <span key={i}>{cmp.type} - \u20B9{cmp.amount} {cmp.coupon_code && `(${cmp.coupon_code})`}</span>
                                        ))}
                                    </div>
                                )}

                                <div className="action-buttons" style={{ marginTop: '10px' }}>
                                    {user.role === 'L1' && c.status === 'Pending' && (
                                        <>
                                            <button onClick={() => handleAction(c.id, 'Verify')} className="btn-verify">Verify</button>
                                            <button onClick={() => handleAction(c.id, 'Reject')} className="btn-reject" style={{ marginLeft: '5px' }} >Reject</button>
                                            <button onClick={() => handleAction(c.id, 'Resolve')} className="btn-resolve" style={{ marginLeft: '5px' }}>Resolve Simple</button>
                                            <div style={{ marginTop: '10px' }}>
                                                <select id={`fwd-${c.id}`}>
                                                    {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
                                                </select>
                                                <button onClick={() => handleAction(c.id, 'Forward', document.getElementById(`fwd-${c.id}`).value)} className="btn-forward" style={{ marginLeft: '5px' }}>Forward to L2</button>
                                            </div>
                                        </>
                                    )}
                                    {user.role === 'L2' && c.status !== 'Resolved' && (
                                        <button onClick={() => handleAction(c.id, 'Resolve')} className="btn-resolve">Investigate & Resolve</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                .auto-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
                .c-header { display: flex; justify-content: space-between; }
                .compensation-badge { background: #dcfce7; color: #166534; padding: 4px; border-radius: 4px; font-size: 0.9em; display: inline-block; margin-top: 5px; }
            `}</style>
        </div>
    );
};

export default SupportDashboard;
