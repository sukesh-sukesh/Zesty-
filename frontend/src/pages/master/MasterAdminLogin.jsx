import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { masterLogin } from '../../api';
import { Building2, Command, Lock, KeyRound, Globe } from 'lucide-react';

const MasterAdminLogin = () => {
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
            navigate('/master-admin/dashboard');
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-950 font-sans">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute w-full h-[1px] top-1/2 -translate-y-1/2 bg-emerald-500/10 blur-sm" />
                <div className="absolute h-full w-[1px] left-1/2 -translate-x-1/2 bg-emerald-500/10 blur-sm" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-emerald-600/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="z-10 w-full max-w-md p-10 bg-slate-900/80 backdrop-blur-2xl border border-slate-800 rounded-[2rem] shadow-[0_0_50px_rgba(16,185,129,0.05)] relative"
            >
                <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center relative shadow-[0_0_20px_rgba(16,185,129,0.15)] shadow-emerald-500/20">
                        <Command className="text-emerald-400" size={32} />
                        <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 translate-x-1/3 -translate-y-1/3"></div>
                    </div>
                </div>

                <div className="text-center mb-10">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-100">Global Command Center</h1>
                    <p className="text-sm font-medium text-slate-500 mt-2 uppercase tracking-widest flex items-center justify-center gap-2">
                        <Globe size={14} className="text-emerald-500" />
                        Master Registry Node
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Building2 size={18} className="text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-4 pl-12 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-mono text-sm placeholder:text-slate-600 focus:bg-slate-900 shadow-inner"
                                placeholder="[COMPANY_ID]"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <KeyRound size={18} className="text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-4 pl-12 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-mono text-sm placeholder:text-slate-600 focus:bg-slate-900 shadow-inner"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm bg-red-950/30 p-3 rounded-lg border border-red-900/50 text-center font-mono">
                            ERR: {error}
                        </motion.p>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-emerald-600/90 hover:bg-emerald-500 text-emerald-50 font-bold py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] active:scale-[0.98] flex justify-center items-center gap-3 group border border-emerald-500/50"
                    >
                        <Lock size={16} className="group-hover:hidden" />
                        <span className="tracking-wide text-sm uppercase">Initialize Session</span>
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
                    <p className="text-slate-600 text-[10px] uppercase font-mono tracking-widest">
                        Unauthorized access is strictly prohibited
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default MasterAdminLogin;
