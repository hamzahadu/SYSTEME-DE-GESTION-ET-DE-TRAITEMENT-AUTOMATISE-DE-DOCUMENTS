import React, { useState, useRef, useEffect } from 'react';
import { Bell, Moon, Sun, Globe, CheckCircle2, AlertTriangle, AlertCircle, X, ChevronRight, Coins } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import clsx from 'clsx';

export const TopBar = ({ title, files = [], onSelectDocument }) => {
    const { theme, toggleTheme } = useTheme();
    const { lang, toggleLang, t } = useLanguage();
    const { currency, setCurrency, formatCurrency, availableCurrencies } = useCurrency();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
    const [dismissedNotifs, setDismissedNotifs] = useState(new Set());
    const notifRef = useRef(null);
    const currRef = useRef(null);

    // Compute live notifications from files
    const liveNotifications = [];
    files.forEach(f => {
        if (dismissedNotifs.has(f.id)) return;
        if (f.status === 'Rejected') {
            liveNotifications.push({
                id: f.id,
                type: 'rejected',
                title: lang === 'fr' ? 'Document Rejeté (Non-Facture)' : 'Document Rejected (Non-Invoice)',
                message: `${f.filename} : ${f.error_message || (lang === 'fr' ? 'Format non comptable détecté' : 'Non-financial file detected')}`,
                time: f.upload_time,
                file: f
            });
        } else if (f.status === 'Needs Review') {
            liveNotifications.push({
                id: f.id,
                type: 'review',
                title: lang === 'fr' ? 'Vérification Requise' : 'Review Required',
                message: `${f.filename} (${f.metadata?.vendor_name || 'Inconnu'}) - ${lang === 'fr' ? 'Veuillez vérifier les taxes ou le total' : 'Please check taxes or total'}`,
                time: f.upload_time,
                file: f
            });
        } else if (f.status === 'Completed' && liveNotifications.length < 5) {
            liveNotifications.push({
                id: f.id,
                type: 'completed',
                title: lang === 'fr' ? 'Facture Validée' : 'Invoice Completed',
                message: `${f.filename} - ${formatCurrency(f.metadata?.total_amount || 0)}`,
                time: f.upload_time,
                file: f
            });
        }
    });

    const unreadCount = liveNotifications.filter(n => n.type === 'rejected' || n.type === 'review').length;

    // Close popovers on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
            if (currRef.current && !currRef.current.contains(e.target)) {
                setShowCurrencyMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const dismissAll = () => {
        const allIds = new Set(liveNotifications.map(n => n.id));
        setDismissedNotifs(allIds);
        setShowNotifications(false);
    };

    return (
        <header className="h-20 bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between px-8 sticky top-0 z-40 transition-colors">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                {title}
            </h2>

            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                {/* Multi-Currency Switcher (MAD / EUR / USD) */}
                <div className="relative" ref={currRef}>
                    <button
                        onClick={() => setShowCurrencyMenu(prev => !prev)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-200 rounded-xl text-xs font-bold border border-gray-200 dark:border-zinc-800 transition-all shadow-xs"
                        title={lang === 'fr' ? "Changer de devise comptable" : "Change currency"}
                    >
                        <Coins size={14} className="text-emerald-600 dark:text-emerald-400" />
                        <span>{currency}</span>
                        <span className="text-[10px] text-gray-400 font-normal">
                            ({currency === 'MAD' ? 'DH' : currency === 'EUR' ? '€' : '$'})
                        </span>
                    </button>

                    {showCurrencyMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800 p-1.5 z-50 animate-in fade-in duration-150">
                            <div className="px-3 py-2 border-b border-gray-100 dark:border-zinc-800 text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-500 tracking-wider">
                                {lang === 'fr' ? 'Devise Comptable' : 'Accounting Currency'}
                            </div>
                            {availableCurrencies.map(c => (
                                <button
                                    key={c.code}
                                    onClick={() => {
                                        setCurrency(c.code);
                                        setShowCurrencyMenu(false);
                                    }}
                                    className={clsx(
                                        "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors",
                                        currency === c.code
                                            ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 font-bold"
                                            : "text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
                                    )}
                                >
                                    <span>{c.name}</span>
                                    <span className="font-bold text-gray-400 dark:text-zinc-500">{c.code} ({c.symbol})</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Language Switcher */}
                <button
                    onClick={toggleLang}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold border border-gray-200 dark:border-zinc-800 transition-all shadow-xs"
                    title={lang === 'fr' ? "Passer en Anglais" : "Switch to French"}
                >
                    <Globe size={14} className="text-blue-600" />
                    <span>{lang.toUpperCase()}</span>
                    <span className="text-[10px] text-gray-400 font-normal">| {lang === 'fr' ? 'EN' : 'FR'}</span>
                </button>

                {/* Dark Mode Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2.5 bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-200"
                    title={theme === 'dark' ? t('light_mode') : t('dark_mode')}
                >
                    {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-gray-700" />}
                </button>

                {/* Notifications Popover */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setShowNotifications(prev => !prev)}
                        className="p-2.5 bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all border border-gray-200 dark:border-zinc-800 relative text-gray-700 dark:text-gray-200"
                        title={t('notifications_title')}
                    >
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-950 animate-pulse">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Popover Card */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50 dark:bg-zinc-950">
                                <div className="flex items-center gap-2">
                                    <Bell size={16} className="text-blue-600" />
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                        {t('notifications_title')}
                                    </h4>
                                    {liveNotifications.length > 0 && (
                                        <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full">
                                            {liveNotifications.length}
                                        </span>
                                    )}
                                </div>
                                {liveNotifications.length > 0 && (
                                    <button
                                        onClick={dismissAll}
                                        className="text-[11px] font-medium text-gray-400 hover:text-black dark:hover:text-white"
                                    >
                                        {t('clear_all_notifs')}
                                    </button>
                                )}
                            </div>

                            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-zinc-800/60 p-1">
                                {liveNotifications.length === 0 ? (
                                    <div className="p-8 text-center text-xs text-gray-400">
                                        {t('no_notifications')}
                                    </div>
                                ) : (
                                    liveNotifications.slice(0, 10).map((n) => (
                                        <div
                                            key={n.id}
                                            onClick={() => {
                                                setShowNotifications(false);
                                                if (onSelectDocument && n.file) onSelectDocument(n.file);
                                            }}
                                            className="p-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-xl transition-colors cursor-pointer flex items-start gap-3"
                                        >
                                            <div className="mt-0.5 shrink-0">
                                                {n.type === 'rejected' && <AlertCircle size={16} className="text-red-500" />}
                                                {n.type === 'review' && <AlertTriangle size={16} className="text-amber-500" />}
                                                {n.type === 'completed' && <CheckCircle2 size={16} className="text-emerald-500" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                                                    {n.title}
                                                </p>
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                                                    {n.message}
                                                </p>
                                            </div>
                                            <ChevronRight size={14} className="text-gray-300 dark:text-zinc-600 self-center" />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
