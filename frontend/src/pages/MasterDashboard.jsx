import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMasterStats, getMasterStaff, createStaff, getDepartments, getZones } from '../api';

const MasterDashboard = () => {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, workload: {} });
    const [staff, setStaff] = useState([]);
    const [depts, setDepts] = useState([]);
    const navigate = useNavigate();

    // new account state
    const [newUname, setNewUname] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [newRole, setNewRole] = useState('L1');
    const [newDept, setNewDept] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('masterUser');
        if (!stored) {
            navigate('/master/login');
            return;
        }
        const u = JSON.parse(stored);
        setUser(u);
        loadData(u.zone_id);
    }, [navigate]);

    const loadData = async (zId) => {
        const [st, sf, dp] = await Promise.all([
            getMasterStats(zId),
            getMasterStaff(zId),
            getDepartments()
        ]);
        setStats(st);
        setStaff(sf);
        setDepts(dp);
        if (dp.length > 0) setNewDept(dp[0].department_id);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        const res = await createStaff({
            username: newUname, password: newPwd, role: newRole,
            zone_id: user.zone_id, department_id: newRole === 'L2' ? newDept : null,
            admin_id: user.id
        });
        if (!res.error) {
            alert("Account created successfully!");
            setNewUname(''); setNewPwd('');
            loadData(user.zone_id);
        } else {
            alert(res.error);
        }
    };

    if (!user) return <p>Loading...</p>;

    return (
        <div className="dashboard admin-dash" style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px' }}>
            <div className="dash-header" style={{ borderBottom: '2px solid #cbd5e1', paddingBottom: '10px', marginBottom: '20px' }}>
                <h2 style={{ color: '#0f172a' }}>Master Admin Dashboard - Zone {user.zone_id}</h2>
                <button className="logout-btn" onClick={() => {
                    localStorage.removeItem('masterUser');
                    navigate('/master/login');
                }}>Logout</button>
            </div>

            <div className="master-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(400px, 1fr)', gap: '20px' }}>
                {/* Stats Panel */}
                <div className="panel" style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>Analytics Panel</h3>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '15px' }}>
                        <div style={{ flex: '1', minWidth: '100px', background: '#e0f2fe', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                            <h4 style={{ margin: '0', color: '#0369a1' }}>Total</h4>
                            <p style={{ margin: '5px 0 0', fontSize: '24px', fontWeight: 'bold' }}>{stats.total}</p>
                        </div>
                        <div style={{ flex: '1', minWidth: '100px', background: '#fef3c7', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                            <h4 style={{ margin: '0', color: '#b45309' }}>Pending</h4>
                            <p style={{ margin: '5px 0 0', fontSize: '24px', fontWeight: 'bold' }}>{stats.pending}</p>
                        </div>
                        <div style={{ flex: '1', minWidth: '100px', background: '#dcfce7', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                            <h4 style={{ margin: '0', color: '#15803d' }}>Resolved</h4>
                            <p style={{ margin: '5px 0 0', fontSize: '24px', fontWeight: 'bold' }}>{stats.resolved}</p>
                        </div>
                    </div>
                    <div style={{ marginTop: '20px' }}>
                        <h4>Department Workload</h4>
                        <ul>
                            {Object.entries(stats.workload || {}).map(([k, v]) => (
                                <li key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <span>{k}</span>
                                    <span style={{ fontWeight: 'bold' }}>{v}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Staff Management */}
                <div className="panel" style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>Staff Management</h3>

                    <form onSubmit={handleCreate} style={{ display: 'grid', gap: '10px', marginTop: '15px', background: '#f1f5f9', padding: '15px', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 10px' }}>Create Support Account</h4>
                        <input type="text" placeholder="Username" value={newUname} onChange={e => setNewUname(e.target.value)} required />
                        <input type="password" placeholder="Password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <select value={newRole} onChange={e => setNewRole(e.target.value)}>
                                <option value="L1">L1 Zone Support</option>
                                <option value="L2">L2 Department Support</option>
                            </select>
                            {newRole === 'L2' && (
                                <select value={newDept} onChange={e => setNewDept(e.target.value)}>
                                    {depts.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
                                </select>
                            )}
                        </div>
                        <button type="submit" style={{ background: '#3b82f6', color: 'white', padding: '8px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Create</button>
                    </form>

                    <div style={{ marginTop: '20px' }}>
                        <h4>Existing Accounts</h4>
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#e2e8f0' }}><th>Username</th><th>Role</th><th>Dept ID</th></tr>
                                </thead>
                                <tbody>
                                    {staff.map(s => (
                                        <tr key={s.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: '8px' }}>{s.username}</td>
                                            <td><span style={{ background: s.role === 'L1' ? '#cffafe' : '#fce7f3', padding: '2px 6px', borderRadius: '10px', fontSize: '0.8em' }}>{s.role}</span></td>
                                            <td>{s.department_id || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MasterDashboard;
