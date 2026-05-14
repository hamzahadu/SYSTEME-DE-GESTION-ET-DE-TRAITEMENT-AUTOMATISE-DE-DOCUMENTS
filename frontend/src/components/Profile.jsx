import React, { useState, useEffect } from 'react';
import { User, Mail, Camera, Save, Lock, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export const Profile = () => {
    const { user, logout } = useAuth();
    const [formData, setFormData] = useState({
        name: user?.full_name || '',
        email: user?.email || '',
        role: user?.role || 'Admin',
        avatar: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.full_name,
                email: user.email,
                role: "Admin", // defaulting for now as backend returns role enum
                avatar: ''
            });
        }
    }, [user]);

    const handleLogout = () => {
        logout();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto py-12"
        >
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-red-600 font-bold hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
                    >
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>

                <div className="space-y-8">
                    {/* Avatar */}
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-lg shadow-blue-500/20">
                                {formData.name.charAt(0)}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{formData.name}</h3>
                            <p className="text-sm text-gray-400">{formData.email}</p>
                            <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
                                {user?.company_id ? 'Company Account' : 'Admin'}
                            </span>
                        </div>
                    </div>

                    {/* Forms */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">Full Name</label>
                            <div className="relative">
                                <User size={18} className="absolute left-3 top-3.5 text-black" />
                                <input
                                    value={formData.name}
                                    readOnly
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 font-bold cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-900 uppercase tracking-wider mb-1">Email Address</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-3.5 text-black" />
                                <input
                                    value={formData.email}
                                    readOnly
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 font-bold cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Lock size={16} /> Security
                        </h4>
                        <button className="text-sm text-blue-600 hover:underline font-medium">Change Password</button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
