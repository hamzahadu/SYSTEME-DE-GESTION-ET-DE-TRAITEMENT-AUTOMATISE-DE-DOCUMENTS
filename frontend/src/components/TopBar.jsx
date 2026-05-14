import React from 'react';
import { Search, Bell, Moon, Sun } from 'lucide-react';

export const TopBar = ({ title }) => {
    return (
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40">
            <h2 className="text-2xl font-bold text-gray-800 capitalize">{title}</h2>

            <div className="flex items-center gap-6">
                {/* Search - Removed as per request */}
                <div className="hidden md:block"></div>

                {/* Actions */}
                <div className="flex items-center gap-4 text-gray-500">
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <Moon size={20} />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                    </button>
                </div>
            </div>
        </header>
    );
};
