import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, ArrowRight, Building, Mail, User, Lock, Globe, Moon, Sun, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export const Signup = () => {
    const { signup } = useAuth();
    const { t, lang, toggleLang } = useLanguage();
    const { theme, toggleTheme } = useTheme();
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
            setError(err.response?.data?.detail || (lang === 'fr' ? 'Échec de la création de compte' : 'Signup failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F3F5F7] dark:bg-zinc-950 flex flex-col items-center justify-center p-4 font-sans transition-colors relative">
            {/* Top controls: Lang & Dark Mode */}
            <div className="absolute top-6 right-6 flex items-center gap-3">
                <button
                    onClick={toggleLang}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 border border-gray-200 dark:border-zinc-800 shadow-sm hover:border-blue-500 transition-all"
                >
                    <Globe size={14} className="text-blue-500" />
                    <span>{lang.toUpperCase()}</span>
                </button>
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-xl bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-800 shadow-sm hover:border-blue-500 transition-all"
                >
                    {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-gray-100 dark:border-zinc-800 w-full max-w-md overflow-hidden transition-colors"
            >
                <div className="p-8 md:p-10">
                    <div className="mb-8 text-center">
                        <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                            <FileSpreadsheet className="text-white" size={28} />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                            {t('app_name')}
                        </h1>
                        <p className="text-gray-500 dark:text-zinc-400 text-sm font-medium">
                            {t('signup_subtitle')}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <Building className="absolute left-4 top-3.5 text-gray-400 dark:text-zinc-500" size={18} />
                            <input
                                type="text"
                                placeholder={t('signup_company')}
                                required
                                value={formData.companyName}
                                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                            />
                        </div>

                        <div className="relative">
                            <User className="absolute left-4 top-3.5 text-gray-400 dark:text-zinc-500" size={18} />
                            <input
                                type="text"
                                placeholder={t('signup_fullname')}
                                required
                                value={formData.fullName}
                                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                            />
                        </div>

                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 text-gray-400 dark:text-zinc-500" size={18} />
                            <input
                                type="email"
                                placeholder={t('signup_work_email')}
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-gray-400 dark:text-zinc-500" size={18} />
                            <input
                                type="password"
                                placeholder={t('login_password')}
                                required
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer disabled:opacity-50"
                        >
                            {loading ? t('signup_loading') : <><span>{t('signup_btn')}</span> <ArrowRight size={16} /></>}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-400 dark:text-zinc-500 text-xs font-medium">
                            {t('signup_has_account')}{' '}
                            <button
                                onClick={() => window.location.hash = '#login'}
                                className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                            >
                                {t('signup_signin')}
                            </button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
