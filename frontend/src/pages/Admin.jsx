
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getComplaints, getStats, updateComplaintStatus } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader, Filter, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

function Admin() {
    const [complaints, setComplaints] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterDate, setFilterDate] = useState('All');
    const navigate = useNavigate();

    // Check admin auth
    const admin = JSON.parse(sessionStorage.getItem('admin'));

    useEffect(() => {
        if (!admin) {
            navigate('/login/admin');
            return;
        }
        fetchData();
    }, [filterCategory, filterDate]); // Re-fetch when filters change

    const fetchData = async () => {
        setLoading(true);
        try {
            const [complaintsData, statsData] = await Promise.all([
                getComplaints({
                    role: 'admin',
                    category: filterCategory === 'All' ? null : filterCategory,
                    date: filterDate === 'All' ? null : filterDate
                }),
                getStats()
            ]);
            setComplaints(complaintsData);
            setStats(statsData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        await updateComplaintStatus(id, newStatus);
        fetchData(); // Refresh list to show updated status
    };

    const chartData = Object.keys(stats).map(key => ({
        name: key.split(' ')[0],
        full_name: key,
        count: stats[key]
    }));

    if (!admin) return null;

    return (
        <div className="admin-page">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Admin Dashboard</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span>Logged in as: <b>{admin.username}</b></span>
                    <button onClick={() => { sessionStorage.removeItem('admin'); navigate('/login/admin'); }} style={{ background: '#eee', color: '#333', padding: '0.5rem 1rem' }}>Logout</button>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="dashboard-stats">
                {Object.entries(stats).map(([category, count]) => (
                    <div className="stat-card" key={category}>
                        <div style={{ color: '#666', fontSize: '0.8rem' }}>{category}</div>
                        <div className="stat-num">{count}</div>
                    </div>
                ))}
            </div>

            <div className="grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginBottom: '2rem' }}>
                {/* Filters */}
                <div className="card">
                    <h3><Filter size={18} /> Filters</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Category</label>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem' }}
                            >
                                <option value="All">All Categories</option>
                                <option value="Delivery Issue">Delivery Issue</option>
                                <option value="Food Quality Issue">Food Quality Issue</option>
                                <option value="Wrong / Missing Item">Wrong / Missing Item</option>
                                <option value="Payment / Refund Issue">Payment / Refund Issue</option>
                                <option value="App / Technical Issue">App / Technical Issue</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Date</label>
                            <select
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem' }}
                            >
                                <option value="All">All Time</option>
                                <option value="today">Today</option>
                                <option value="yesterday">Yesterday</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className="card">
                    <h3>Complaint Distribution</h3>
                    <div style={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#ff7043" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Complaints Table */}
            <div className="card">
                <h3>Managed Complaints ({complaints.length})</h3>
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}><Loader className="animate-spin" /> Loading...</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>User</th>
                                    <th>Category</th>
                                    <th>Complaint</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {complaints.map(complaint => (
                                    <tr key={complaint.id}>
                                        <td>#{complaint.id}</td>
                                        <td>{complaint.user_name || 'Anonymous'}</td>
                                        <td><span className={`category-badge cat-${complaint.category.split(' ')[0]}`}>{complaint.category}</span></td>
                                        <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={complaint.text}>
                                            {complaint.text}
                                        </td>
                                        <td>
                                            <span style={{
                                                fontWeight: 'bold',
                                                color: complaint.status === 'Resolved' ? 'green' :
                                                    complaint.status === 'Verified' ? 'blue' :
                                                        complaint.status === 'Pending' ? 'orange' : 'red'
                                            }}>
                                                {complaint.status}
                                            </span>
                                        </td>
                                        <td>
                                            <select
                                                value={complaint.status}
                                                onChange={(e) => handleStatusUpdate(complaint.id, e.target.value)}
                                                style={{ padding: '0.25rem', fontSize: '0.85rem' }}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Verified">Verified</option>
                                                <option value="Resolved">Resolved</option>
                                                <option value="Not Responded">Not Responded</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Admin;
