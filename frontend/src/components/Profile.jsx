import React, { useState, useEffect } from 'react';
import {
    User, Mail, Lock, LogOut, Phone, Shield, ShieldCheck,
    Check, Copy, CheckCircle2, AlertCircle, Building2,
    Sparkles, GraduationCap, Calculator, Eye, Moon, Sun, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export const Profile = () => {
    const { user, logout, updateProfile } = useAuth();
    const { t, lang, toggleLang } = useLanguage();
    const { theme, toggleTheme } = useTheme();

    // Split user full_name into first and last name if possible
    const parseName = (fullName = '') => {
        const parts = fullName.trim().split(/\s+/);
        if (parts.length <= 1) {
            return { firstName: parts[0] || '', lastName: '' };
        }
        return {
            firstName: parts[0],
            lastName: parts.slice(1).join(' ')
        };
    };

    const initialNames = parseName(user?.full_name || '');

    const [firstName, setFirstName] = useState(initialNames.firstName);
    const [lastName, setLastName] = useState(initialNames.lastName);
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [role, setRole] = useState(user?.role || 'admin');

    // Password fields
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Feedback state
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }
    const [copiedId, setCopiedId] = useState(false);

    useEffect(() => {
        if (user) {
            const parsed = parseName(user.full_name || '');
            setFirstName(parsed.firstName);
            setLastName(parsed.lastName);
            setEmail(user.email || '');
            setPhone(user.phone || '');
            setRole(user.role || 'admin');
        }
    }, [user]);

    const handleCopyCompanyId = () => {
        if (!user?.company_id) return;
        navigator.clipboard.writeText(user.company_id);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2500);
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setFeedback(null);

        // Validation if changing password
        if (newPassword || confirmPassword || currentPassword) {
            if (!currentPassword) {
                setFeedback({
                    type: 'error',
                    message: lang === 'fr'
                        ? 'Veuillez saisir votre mot de passe actuel pour effectuer cette modification.'
                        : 'Please enter your current password to apply changes.'
                });
                return;
            }
            if (newPassword !== confirmPassword) {
                setFeedback({
                    type: 'error',
                    message: t('msg_pw_mismatch')
                });
                return;
            }
            if (newPassword.length < 4) {
                setFeedback({
                    type: 'error',
                    message: lang === 'fr'
                        ? 'Le nouveau mot de passe doit comporter au moins 4 caractères.'
                        : 'New password must have at least 4 characters.'
                });
                return;
            }
        }

        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        const payload = {
            full_name: fullName || user?.full_name || 'Utilisateur',
            role: role,
            phone: phone.trim()
        };

        if (newPassword) {
            payload.current_password = currentPassword;
            payload.new_password = newPassword;
        }

        setIsSaving(true);
        try {
            await updateProfile(payload);
            setFeedback({
                type: 'success',
                message: t('msg_profile_saved')
            });
            // Clear passwords
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setFeedback(null), 5000);
        } catch (err) {
            console.error("Save profile error", err);
            const errMsg = err?.response?.data?.detail || (lang === 'fr' ? 'Erreur lors de la mise à jour.' : 'Error updating profile.');
            setFeedback({
                type: 'error',
                message: errMsg
            });
        } finally {
            setIsSaving(false);
        }
    };

    const rolesList = [
        {
            id: 'admin',
            title: t('role_admin'),
            description: t('role_admin_desc'),
            icon: ShieldCheck,
            badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
            activeBorder: 'border-blue-500 ring-2 ring-blue-500/20'
        },
        {
            id: 'accountant',
            title: t('role_accountant'),
            description: t('role_accountant_desc'),
            icon: Calculator,
            badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20'
        },
        {
            id: 'student',
            title: t('role_student'),
            description: t('role_student_desc'),
            icon: GraduationCap,
            badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
            activeBorder: 'border-purple-500 ring-2 ring-purple-500/20'
        },
        {
            id: 'viewer',
            title: t('role_viewer'),
            description: t('role_viewer_desc'),
            icon: Eye,
            badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            activeBorder: 'border-amber-500 ring-2 ring-amber-500/20'
        }
    ];

    const currentFullName = `${firstName} ${lastName}`.trim() || user?.full_name || 'Utilisateur';
    const userInitial = currentFullName.charAt(0).toUpperCase() || 'U';

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-6xl mx-auto space-y-6 pb-20 font-sans"
        >
            {/* Feedback Notification Banner */}
            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={clsx(
                            "p-4 rounded-2xl flex items-center justify-between border shadow-sm transition-all",
                            feedback.type === 'success'
                                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200"
                                : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-200"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            {feedback.type === 'success' ? (
                                <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : (
                                <AlertCircle size={20} className="text-red-600 dark:text-red-400 shrink-0" />
                            )}
                            <span className="text-sm font-semibold">{feedback.message}</span>
                        </div>
                        <button
                            onClick={() => setFeedback(null)}
                            className="text-xs font-bold hover:underline opacity-70 hover:opacity-100"
                        >
                            ✕
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Profile Hero Header Banner */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-zinc-800 shadow-sm transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    {/* User Identity Info */}
                    <div className="flex items-center gap-5">
                        <div className="relative shrink-0">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl sm:text-4xl font-black shadow-xl shadow-blue-600/20 ring-4 ring-white dark:ring-zinc-800">
                                {userInitial}
                            </div>
                            <span
                                className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full shadow-xs"
                                title={t('lbl_status_active')}
                            />
                        </div>

                        <div className="min-w-0 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight truncate">
                                    {currentFullName}
                                </h1>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40 uppercase tracking-wider">
                                    {role}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
                                    <Check size={12} /> {t('lbl_status_active')}
                                </span>
                            </div>

                            <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">
                                {email}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-gray-500 dark:text-zinc-400">
                                <span className="flex items-center gap-1.5 font-medium">
                                    <Building2 size={14} className="text-gray-400 dark:text-zinc-500" />
                                    {t('lbl_company_account')}:
                                </span>
                                <code className="bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md font-mono text-gray-800 dark:text-zinc-300 text-[11px] border border-gray-200 dark:border-zinc-700">
                                    {user?.company_id ? user.company_id.slice(0, 16) : 'default-workspace'}...
                                </code>
                                <button
                                    onClick={handleCopyCompanyId}
                                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                                >
                                    <Copy size={12} /> {copiedId ? t('copied_to_clipboard') : 'Copier'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
                        >
                            <CheckCircle2 size={18} />
                            <span>{isSaving ? t('btn_saving') : t('btn_save_profile')}</span>
                        </button>

                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-4 py-3 rounded-2xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-bold text-sm border border-red-200 dark:border-red-900/40 transition-colors"
                        >
                            <LogOut size={18} />
                            <span className="hidden sm:inline">{t('btn_logout')}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Profile Grid: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Columns: Personal Info & Role Selection */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Section 1: Informations Personnelles */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-zinc-800 shadow-sm transition-colors space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-zinc-800">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                                <User size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {t('profile_personal_info')}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-zinc-400">
                                    {lang === 'fr'
                                        ? 'Vos coordonnées d’identification et moyens de contact'
                                        : 'Your contact credentials and identity attributes'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {/* First Name */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider">
                                    {t('lbl_first_name')}
                                </label>
                                <div className="relative">
                                    <User size={18} className="absolute left-3.5 top-3.5 text-gray-400 dark:text-zinc-500" />
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="Ex: Hamza"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50/80 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-2xl text-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {/* Last Name */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider">
                                    {t('lbl_last_name')}
                                </label>
                                <div className="relative">
                                    <User size={18} className="absolute left-3.5 top-3.5 text-gray-400 dark:text-zinc-500" />
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Ex: Haddou"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50/80 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-2xl text-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {/* Email Address */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider">
                                        {t('lbl_email')}
                                    </label>
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                        <Check size={12} /> Vérifié
                                    </span>
                                </div>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3.5 top-3.5 text-gray-400 dark:text-zinc-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        readOnly
                                        disabled
                                        className="w-full pl-10 pr-4 py-3 bg-gray-100/70 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-700/60 rounded-2xl text-sm font-semibold text-gray-600 dark:text-zinc-400 cursor-not-allowed select-all"
                                    />
                                </div>
                            </div>

                            {/* Phone Number */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider">
                                    {t('lbl_phone')}
                                </label>
                                <div className="relative">
                                    <Phone size={18} className="absolute left-3.5 top-3.5 text-gray-400 dark:text-zinc-500" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+212 6 XX XX XX XX"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50/80 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-2xl text-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Rôles & Niveaux d'Accès */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-zinc-800 shadow-sm transition-colors space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-zinc-800">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {t('profile_roles_title')}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-zinc-400">
                                    {lang === 'fr'
                                        ? 'Sélectionnez votre profil d’utilisation au sein de Gestion Document'
                                        : 'Define your permissions and responsibilities within the application'}
                                </p>
                            </div>
                        </div>

                        {/* Interactive Role Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {rolesList.map((r) => {
                                const Icon = r.icon;
                                const isSelected = role === r.id;
                                return (
                                    <div
                                        key={r.id}
                                        onClick={() => setRole(r.id)}
                                        className={clsx(
                                            "p-5 rounded-2xl border transition-all cursor-pointer relative group",
                                            isSelected
                                                ? clsx("bg-gray-50 dark:bg-zinc-800/80", r.activeBorder)
                                                : "bg-white dark:bg-zinc-900/60 border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center border", r.badgeColor)}>
                                                    <Icon size={18} />
                                                </div>
                                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {r.title}
                                                </h3>
                                            </div>
                                            <div className={clsx(
                                                "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                                                isSelected
                                                    ? "bg-blue-600 border-blue-600 text-white"
                                                    : "border-gray-300 dark:border-zinc-700"
                                            )}>
                                                {isSelected && <Check size={12} />}
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed pl-12">
                                            {r.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Column: Security & Preferences */}
                <div className="space-y-6">
                    {/* Section 3: Sécurité & Mot de Passe */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-zinc-800 shadow-sm transition-colors space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-zinc-800">
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                                <Lock size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {t('profile_security_title')}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-zinc-400">
                                    {lang === 'fr' ? 'Changement sécurisé du mot de passe' : 'Credentials & password security'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-gray-600 dark:text-zinc-300">
                                    {t('lbl_current_password')}
                                </label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-2.5 bg-gray-50/80 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-gray-600 dark:text-zinc-300">
                                    {t('lbl_new_password')}
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-2.5 bg-gray-50/80 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-gray-600 dark:text-zinc-300">
                                    {t('lbl_confirm_password')}
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-2.5 bg-gray-50/80 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                />
                            </div>

                            <p className="text-[11px] text-gray-400 dark:text-zinc-500 leading-normal">
                                {lang === 'fr'
                                    ? 'Laissez vide pour conserver votre mot de passe actuel.'
                                    : 'Leave blank to keep your current password.'}
                            </p>
                        </div>
                    </div>

                    {/* Section 4: Organisation & Espace de Travail */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-zinc-800 shadow-sm transition-colors space-y-4">
                        <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-zinc-800">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                                <Building2 size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {t('profile_workspace_title')}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-zinc-400">
                                    {lang === 'fr' ? 'Configuration multi-tenant isolée' : 'Tenant partition & workspace parameters'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-zinc-800/60">
                                <span className="text-gray-500 dark:text-zinc-400 font-medium">{t('lbl_company_account')}</span>
                                <span className="font-bold text-gray-900 dark:text-white">
                                    {user?.company_name || 'Master PFE Maroc'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-zinc-800/60">
                                <span className="text-gray-500 dark:text-zinc-400 font-medium">Plan Système</span>
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900/40">
                                    Master Pro / Illimité
                                </span>
                            </div>

                            <div className="flex justify-between items-center py-1.5">
                                <span className="text-gray-500 dark:text-zinc-400 font-medium">Base de Données</span>
                                <span className="font-semibold text-gray-700 dark:text-zinc-300">
                                    PostgreSQL / RAG Chunks
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Section 5: Préférences Rapides (Theme & Language) */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-zinc-800 shadow-sm transition-colors space-y-4">
                        <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-zinc-800">
                            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {t('profile_preferences')}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-zinc-400">
                                    {lang === 'fr' ? 'Thème d’affichage et langue de l’interface' : 'Theme style and interface language'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Theme switcher button */}
                            <button
                                onClick={toggleTheme}
                                className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 font-bold text-xs text-gray-800 dark:text-zinc-200 transition-all"
                            >
                                {theme === 'dark' ? (
                                    <>
                                        <Sun size={16} className="text-amber-400" />
                                        <span>{t('light_mode')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Moon size={16} className="text-gray-700" />
                                        <span>{t('dark_mode')}</span>
                                    </>
                                )}
                            </button>

                            {/* Language switcher button */}
                            <button
                                onClick={toggleLang}
                                className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 font-bold text-xs text-gray-800 dark:text-zinc-200 transition-all"
                            >
                                <Globe size={16} className="text-blue-500" />
                                <span>{lang === 'fr' ? 'English (EN)' : 'Français (FR)'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Bottom Save Button */}
                    <div className="pt-2">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-600/20 transition-all disabled:opacity-50"
                        >
                            <CheckCircle2 size={18} />
                            <span>{isSaving ? t('btn_saving') : t('btn_save_profile')}</span>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
export default Profile;
