import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, X, Calendar } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

export const ExportModal = ({ isOpen, onClose }) => {
    const { lang } = useLanguage();
    const [format, setFormat] = useState('excel'); // excel, csv, json
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [downloading, setDownloading] = useState(false);

    if (!isOpen) return null;

    const handleExport = async () => {
        setDownloading(true);
        try {
            const params = new URLSearchParams();
            if (dateRange.start) params.append('start_date', dateRange.start);
            if (dateRange.end) params.append('end_date', dateRange.end);

            const token = localStorage.getItem('token');
            const response = await axios.get(`http://127.0.0.1:8000/export/${format}?${params.toString()}`, {
                responseType: 'blob',
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const ext = format === 'excel' ? 'xlsx' : format;
            link.setAttribute('download', `gestion_document_export_${new Date().toISOString().split('T')[0]}.${ext}`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            onClose();
        } catch (e) {
            console.error(e);
            alert("Export failed");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 w-full max-w-md overflow-hidden relative transition-colors"
            >
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/70 dark:bg-zinc-950">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Download size={20} className="text-blue-600 dark:text-blue-400" />
                        {lang === 'fr' ? 'Exporter les Données' : 'Export Data'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-gray-500 dark:text-zinc-400"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Format Selection */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                            {lang === 'fr' ? 'Format du Journal Comptable' : 'Export File Format'}
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'excel', label: 'EXCEL (.xlsx)', desc: lang === 'fr' ? 'Multi-feuilles' : 'Multi-sheets' },
                                { id: 'csv', label: 'CSV (.csv)', desc: lang === 'fr' ? 'Standard ERP' : 'Standard ERP' },
                                { id: 'json', label: 'JSON (.json)', desc: lang === 'fr' ? 'Données brutes' : 'Raw payload' }
                            ].map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setFormat(f.id)}
                                    className={`py-3 px-3 rounded-2xl text-center border transition-all ${
                                        format === f.id
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                                            : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
                                    }`}
                                >
                                    <p className="text-xs font-bold">{f.label}</p>
                                    <p className={clsx("text-[10px] mt-0.5", format === f.id ? "text-blue-100" : "text-gray-400 dark:text-zinc-500")}>
                                        {f.desc}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date Range */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                            {lang === 'fr' ? 'Plage de Dates (Optionnel)' : 'Date Range (Optional)'}
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                                <Calendar size={16} className="absolute left-3 top-3 text-gray-400 dark:text-zinc-500" />
                                <input
                                    type="date"
                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    value={dateRange.start}
                                    onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                />
                            </div>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-3 top-3 text-gray-400 dark:text-zinc-500" />
                                <input
                                    type="date"
                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    value={dateRange.end}
                                    onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-950 flex justify-end">
                    <button
                        onClick={handleExport}
                        disabled={downloading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {downloading
                            ? (lang === 'fr' ? 'Préparation...' : 'Preparing...')
                            : <><Download size={18} /> {lang === 'fr' ? 'Télécharger l\'Export' : 'Download Export'}</>}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
