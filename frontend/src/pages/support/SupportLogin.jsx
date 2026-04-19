import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supportLogin } from '../../api';
import { User, Headset, ShieldEllipsis, Shield, ArrowRight } from 'lucide-react';

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
            if (res.user.role === 'L1') {
                navigate('/support/l1-dashboard');
            } else {
                navigate('/support/l2-dashboard');
            }
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-50">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-emerald/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[40rem] h-[20rem] bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="z-10 w-full max-w-lg bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.05)] overflow-hidden"
            >
                <div className="bg-secondary p-8 text-center relative overflow-hidden">
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-400/20 rounded-full blur-2xl" />
                    <Headset size={48} className="mx-auto text-white mb-4 drop-shadow-md relative z-10" />
                    <h1 className="text-2xl font-bold text-white relative z-10">Agent Support Portal</h1>
                    <p className="text-blue-100 font-medium text-sm mt-1 relative z-10">Secure L1 & L2 Department Access</p>
                </div>

                <div className="p-8 pb-10">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Agent ID</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <User size={18} className="text-slate-400 group-focus-within:text-secondary transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 pb-3 pl-11 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all placeholder:text-slate-400 shadow-sm"
                                    placeholder="agent.name"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Passcode</label>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <ShieldEllipsis size={18} className="text-slate-400 group-focus-within:text-secondary transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 pb-3 pl-11 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all placeholder:text-slate-400 shadow-sm"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
                                <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 font-medium flex items-center gap-2">
                                    <Shield size={16} className="text-red-400" />
                                    {error}
                                </p>
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            className="w-full relative group overflow-hidden bg-secondary text-white font-bold py-3.5 rounded-xl transition-all hover:bg-blue-600 shadow-[0_8px_20px_rgba(59,130,246,0.2)] hover:shadow-[0_12px_25px_rgba(59,130,246,0.3)] hover:-translate-y-0.5 flex justify-center items-center gap-2 mt-6"
                        >
                            <span className="relative z-10 text-sm tracking-wide">Authenticate Session</span>
                            <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 flex-shrink-0 transition-transform" />
                            <div className="absolute inset-0 h-full w-full bg-white/10 translate-y-full transition-transform duration-300 group-hover:translate-y-0"></div>
                        </button>
                    </form>
                </div>
            </motion.div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-slate-400 text-sm font-medium">
                ZestyCare Enterprise Security
            </div>
        </div>
    );
};

export default SupportLogin;
