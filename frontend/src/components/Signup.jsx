import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, ArrowRight, Building, Mail, User, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Signup = () => {
    const { signup } = useAuth();
    const [formData, setFormData] = useState({
        companyName: '',
        fullName: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signup(formData.companyName, formData.fullName, formData.email, formData.password);
        } catch (err) {
            setError(err.response?.data?.detail || 'Signup failed');
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
                            <UserPlus className="text-white" size={24} />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Start for Free</h1>
                        <p className="text-gray-500 text-sm font-medium">Create your company account</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <Building className="absolute left-4 top-3.5 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Company Name"
                                required
                                value={formData.companyName}
                                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black transition-all outline-none placeholder:font-medium"
                            />
                        </div>

                        <div className="relative">
                            <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Full Name"
                                required
                                value={formData.fullName}
                                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black transition-all outline-none placeholder:font-medium"
                            />
                        </div>

                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 text-gray-400" size={18} />
                            <input
                                type="email"
                                placeholder="Work Email"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black transition-all outline-none placeholder:font-medium"
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                            <input
                                type="password"
                                placeholder="Password"
                                required
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-black/5 focus:border-black transition-all outline-none placeholder:font-medium"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-900 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/20"
                        >
                            {loading ? 'Creating Account...' : <>Create Account <ArrowRight size={16} /></>}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-400 text-xs font-medium">
                            Already have an account? <button onClick={() => window.location.hash = '#login'} className="text-black font-bold hover:underline">Sign In</button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
