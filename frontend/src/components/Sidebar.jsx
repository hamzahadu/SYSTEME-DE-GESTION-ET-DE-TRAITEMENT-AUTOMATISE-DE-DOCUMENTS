import React from 'react';
import { Layout, User, Settings, PieChart, FileText } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ activeTab, onTabChange }) => {
    const { user } = useAuth();

    // Fallback if user is somehow null (though MainApp guards this)
    const name = user?.full_name || 'User';
    const email = user?.email || '';

    const menus = [
        { id: 'dashboard', label: 'Dashboard', icon: PieChart },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'categories', label: 'Categories', icon: Layout },
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="w-64 h-screen bg-black text-white flex flex-col fixed left-0 top-0 z-50">
            {/* Logo Area */}
            <div className="h-20 flex items-center px-8 border-b border-gray-900">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3">
                    <div className="w-4 h-4 bg-black rounded-full" />
                </div>
                <h1 className="text-lg font-bold tracking-wide">DocuFlow</h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-8 px-4 space-y-2">
                {menus.map((menu) => {
                    const Icon = menu.icon;
                    const isActive = activeTab === menu.id;
                    return (
                        <button
                            key={menu.id}
                            onClick={() => onTabChange(menu.id)}
                            className={clsx(
                                "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-white text-black font-semibold shadow-lg shadow-white/5"
                                    : "text-gray-400 hover:text-white hover:bg-gray-900"
                            )}
                        >
                            <Icon size={20} className={clsx(isActive ? "text-black" : "text-gray-400 group-hover:text-white")} />
                            <span>{menu.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Footer / User - Clickable to Profile */}
            <button
                onClick={() => onTabChange('profile')}
                className="p-6 border-t border-gray-900 hover:bg-gray-900 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden shadow-lg shadow-blue-500/20">
                        {name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{name}</p>
                        <p className="text-xs text-list text-gray-400 truncate">{email}</p>
                    </div>
                </div>
            </button>
        </div>
    );
};
