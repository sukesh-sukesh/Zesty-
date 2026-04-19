import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { masterLogin } from '../../api'; // Admin uses the master login endpoint to hit company registry
import { BriefcaseBusiness, UserCog, LockKeyhole, ArrowRight, ShieldCheck } from 'lucide-react';

const AdminLogin = () => {
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
            // Re-assign role locally if needed, or backend can handle it
            const userWithRole = { ...res.user, role: 'admin' };
            localStorage.setItem('adminUser', JSON.stringify(userWithRole));
            navigate('/admin/dashboard');
        }
    };

    return (
        <div className="min-h-screen relative flex items-stretch md:items-center justify-center bg-white p-4 sm:p-8">
            <div className="absolute inset-0 bg-slate-50/50 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="z-10 w-full max-w-5xl flex flex-col md:flex-row bg-white border border-slate-100 rounded-[2rem] shadow-2xl overflow-hidden"
            >
                {/* Left Side Branding */}
                <div className="w-full md:w-1/2 bg-slate-900 p-12 text-white relative overflow-hidden hidden md:flex flex-col justify-between">
                    <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[80px]" />
                    <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-[80px]" />

                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 flex items-center justify-center mb-6">
                            <BriefcaseBusiness className="text-orange-400" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight mb-4">Zone Administration</h2>
                        <p className="text-slate-400 leading-relaxed font-medium">Control overarching regional operations, manage agent allocations, and view synthesized reports from multiple unified departments.</p>
                    </div>

                    <div className="relative z-10 border-t border-white/10 pt-6 mt-12">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-indigo-500/20 rounded-lg">
                                <ShieldCheck size={24} className="text-indigo-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">Enterprise Security Active</h4>
                                <p className="text-xs text-slate-400 font-medium">Role-based restricted enclave</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side Form */}
                <div className="w-full md:w-1/2 p-8 md:p-14 lg:p-16 flex flex-col justify-center">
                    <div className="mb-10 text-center md:text-left">
                        <h1 className="text-2xl font-extrabold text-slate-900">Administrator Sign In</h1>
                        <p className="text-slate-500 mt-2 font-medium">Enter your credentials to manage your zone.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="group">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2 transition-colors group-focus-within:text-slate-800">Admin Identifier</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <UserCog size={18} className="text-slate-400 group-focus-within:text-slate-700 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3.5 pl-12 focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-500 transition-all shadow-sm placeholder:text-slate-400 font-medium"
                                    placeholder="admin.id"
                                    required
                                />
                            </div>
                        </div>

                        <div className="group">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2 transition-colors group-focus-within:text-slate-800">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <LockKeyhole size={18} className="text-slate-400 group-focus-within:text-slate-700 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3.5 pl-12 focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-500 transition-all shadow-sm placeholder:text-slate-400 font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 font-bold text-center">
                                {error}
                            </motion.p>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl transition-all hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 active:scale-[0.98] flex justify-center items-center gap-2 mt-4 group"
                        >
                            <span>Access Dashboard</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
