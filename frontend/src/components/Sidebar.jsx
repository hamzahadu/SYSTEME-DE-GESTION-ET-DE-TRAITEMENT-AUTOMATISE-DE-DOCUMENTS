import React from 'react';
import { Layout, User, PieChart, FileText, Sparkles, FolderArchive } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const Sidebar = ({ activeTab, onTabChange }) => {
    const { user } = useAuth();
    const { t } = useLanguage();

    const name = user?.full_name || 'Utilisateur';
    const email = user?.email || '';

    const menus = [
        { id: 'dashboard', label: t('nav_dashboard'), icon: PieChart },
        { id: 'documents', label: t('nav_documents'), icon: FileText },
        { id: 'assistant', label: t('nav_assistant'), icon: Sparkles },
        { id: 'categories', label: t('nav_categories'), icon: Layout },
        { id: 'profile', label: t('nav_profile'), icon: User },
    ];

    return (
        <div className="w-64 h-screen bg-white dark:bg-black text-gray-900 dark:text-white flex flex-col fixed left-0 top-0 z-50 border-r border-gray-200 dark:border-zinc-900 transition-colors">
            {/* Logo Area */}
            <div className="h-20 flex items-center px-6 border-b border-gray-200 dark:border-zinc-900">
                <div className="w-9 h-9 bg-blue-600 dark:bg-white rounded-xl flex items-center justify-center mr-3 shadow-md shadow-blue-600/20 dark:shadow-white/10 shrink-0">
                    <FolderArchive className="text-white dark:text-black w-5 h-5" />
                </div>
                <div className="min-w-0">
                    <h1 className="text-base font-extrabold tracking-tight truncate">
                        {t('app_name')}
                    </h1>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-400 font-medium tracking-wide truncate">
                        {t('app_subtitle')}
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-4 space-y-1.5">
                {menus.map((menu) => {
                    const Icon = menu.icon;
                    const isActive = activeTab === menu.id;
                    return (
                        <button
                            key={menu.id}
                            onClick={() => onTabChange(menu.id)}
                            className={clsx(
                                "w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-200 group text-sm font-semibold",
                                isActive
                                    ? "bg-blue-600 text-white shadow-md dark:bg-white dark:text-black"
                                    : "text-gray-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-900"
                            )}
                        >
                            <Icon
                                size={18}
                                className={clsx(
                                    isActive
                                        ? "text-white dark:text-black"
                                        : "text-gray-400 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white"
                                )}
                            />
                            <span>{menu.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* User Profile Card */}
            <button
                onClick={() => onTabChange('profile')}
                className="p-5 border-t border-gray-200 dark:border-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold overflow-hidden shadow-md shrink-0">
                        {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{name}</p>
                        <p className="text-xs text-gray-400 dark:text-zinc-400 truncate">{email}</p>
                    </div>
                </div>
            </button>
        </div>
    );
};
