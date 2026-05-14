import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, ArrowRight, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = ({ onLogin }) => { // onLogin prop might be deprecated if we use Context fully, but keeping for compatibility if App uses it
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(email, password);
            // Context updates user, App.jsx should react to user state change
        } catch (err) {
            setError('Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F3F5F7] flex items-center justify-center p-4 font-sans">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
            >
                <div className="p-8 md:p-10">
                    <div className="mb-8 text-center">
                        <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gray-200">
                            <LogIn className="text-white" size={24} />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Welcome Back</h1>
                        <p className="text-gray-500 text-sm font-medium">Sign in to your dashboard</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 text-gray-400" size={18} />
                            <input
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black transition-all outline-none placeholder:font-medium"
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black transition-all outline-none placeholder:font-medium"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-900 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/20"
                        >
                            {loading ? 'Signing In...' : <>Sign In <ArrowRight size={16} /></>}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-400 text-xs font-medium">
                            Don't have an account? <button onClick={() => window.location.hash = '#signup'} className="text-black font-bold hover:underline">Create Company</button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
