import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, X, Calendar, FileText } from 'lucide-react';
import axios from 'axios';

export const ExportModal = ({ isOpen, onClose }) => {
    const [format, setFormat] = useState('excel'); // excel, csv, json
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [downloading, setDownloading] = useState(false);

    if (!isOpen) return null;

    const handleExport = async () => {
        setDownloading(true);
        try {
            // Build URL with params
            const params = new URLSearchParams();
            if (dateRange.start) params.append('start_date', dateRange.start);
            if (dateRange.end) params.append('end_date', dateRange.end);

            // Trigger download via window.location or blob?
            // Window location is easier for file download if auth matches (here no auth req)
            // But we want to handle errors. Let's use axios blob.

            const response = await axios.get(`http://127.0.0.1:8000/export/${format}?${params.toString()}`, {
                responseType: 'blob'
            });

            // Create link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const ext = format === 'excel' ? 'xlsx' : format;
            link.setAttribute('download', `accounting_export_${new Date().toISOString().split('T')[0]}.${ext}`);
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
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
            >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Download size={20} className="text-blue-600" /> Export Data
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Format Selection */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Format</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['excel', 'csv', 'json'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFormat(f)}
                                    className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all ${format === f
                                            ? 'bg-black text-white border-black shadow-lg'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {f.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date Range */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Date Range (Optional)</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                                <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="date"
                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-black outline-none"
                                    value={dateRange.start}
                                    onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                />
                            </div>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="date"
                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-1 focus:ring-black outline-none"
                                    value={dateRange.end}
                                    onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                        onClick={handleExport}
                        disabled={downloading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                    >
                        {downloading ? 'Preparing...' : <><Download size={18} /> Download Export</>}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
