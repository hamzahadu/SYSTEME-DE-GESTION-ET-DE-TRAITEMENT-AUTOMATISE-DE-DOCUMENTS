import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, Trash2, Download, X } from 'lucide-react';
import axios from 'axios';
import clsx from 'clsx';
import { format } from 'date-fns';
import { ExportModal } from './ExportModal';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';

const API_URL = 'http://127.0.0.1:8000';

export const Categories = ({ files, onEdit }) => {
    const { t, lang } = useLanguage();
    const { formatCurrency } = useCurrency();
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [sort, setSort] = useState('date-desc');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [bulkProcessing, setBulkProcessing] = useState(false);
    const [showExport, setShowExport] = useState(false);

    // Derived filters
    const filteredFiles = useMemo(() => {
        if (!files) return [];
        let filtered = [...files];

        if (search) {
            const lowSearch = search.toLowerCase();
            filtered = filtered.filter(f =>
                f.filename.toLowerCase().includes(lowSearch) ||
                (f.metadata?.vendor_name || '').toLowerCase().includes(lowSearch) ||
                (f.metadata?.invoice_number || '').toLowerCase().includes(lowSearch)
            );
        }

        if (filterCategory !== 'All') {
            filtered = filtered.filter(f => (f.metadata?.category || 'Uncategorized') === filterCategory);
        }

        filtered.sort((a, b) => {
            const dateA = new Date(a.metadata?.invoice_date || a.upload_time).getTime();
            const dateB = new Date(b.metadata?.invoice_date || b.upload_time).getTime();
            const amountA = a.metadata?.total_amount || 0;
            const amountB = b.metadata?.total_amount || 0;

            switch (sort) {
                case 'date-asc': return dateA - dateB;
                case 'date-desc': return dateB - dateA;
                case 'amount-asc': return amountA - amountB;
                case 'amount-desc': return amountB - amountA;
                default: return 0;
            }
        });

        return filtered;
    }, [files, search, filterCategory, sort]);

    const categories = ['All', 'Meals', 'Transport', 'Office Supplies', 'Software', 'Services', 'Other'];
    const allCategories = ['Meals', 'Transport', 'Office Supplies', 'Software', 'Services', 'Other'];

    const getCategoryLabel = (cat) => {
        if (cat === 'All') return lang === 'fr' ? 'Toutes' : 'All';
        if (cat === 'Meals') return lang === 'fr' ? 'Restauration' : 'Meals';
        if (cat === 'Transport') return lang === 'fr' ? 'Transport' : 'Transport';
        if (cat === 'Office Supplies') return lang === 'fr' ? 'Fournitures' : 'Office Supplies';
        if (cat === 'Software') return lang === 'fr' ? 'Logiciels' : 'Software';
        if (cat === 'Services') return lang === 'fr' ? 'Services' : 'Services';
        if (cat === 'Other') return lang === 'fr' ? 'Autre' : 'Other';
        return cat;
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredFiles.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredFiles.map(f => f.id)));
        }
    };

    const toggleSelect = (id, e) => {
        e.stopPropagation();
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleBulkCategory = async (category) => {
        const confirmMsg = lang === 'fr'
            ? `Attribuer la catégorie "${getCategoryLabel(category)}" à ${selectedIds.size} documents ?`
            : `Move ${selectedIds.size} items to ${category}?`;
        if (!confirm(confirmMsg)) return;

        setBulkProcessing(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/documents/bulk/update`, {
                document_ids: Array.from(selectedIds),
                updates: { category }
            }, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert("Bulk update failed");
        } finally {
            setBulkProcessing(false);
            setSelectedIds(new Set());
        }
    };

    const handleBulkDelete = async () => {
        const confirmMsg = lang === 'fr'
            ? `Supprimer définitivement ces ${selectedIds.size} documents ?`
            : `Delete ${selectedIds.size} items?`;
        if (!confirm(confirmMsg)) return;

        setBulkProcessing(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/documents/bulk/delete`, {
                document_ids: Array.from(selectedIds)
            }, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert("Bulk delete failed");
        } finally {
            setBulkProcessing(false);
            setSelectedIds(new Set());
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 space-y-4 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {lang === 'fr' ? 'Base Comptable & Catégories' : 'Accounting Database'}
                    </h2>
                    <div className="relative w-full md:w-96">
                        <Search size={18} className="absolute left-3 top-3.5 text-gray-400 dark:text-zinc-500" />
                        <input
                            type="text"
                            placeholder={t('search_docs')}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center justify-between mt-4 md:mt-0">
                    <div className="flex flex-wrap gap-2 items-center">
                        <div className="flex items-center gap-2 mr-2 text-sm font-medium text-gray-500 dark:text-zinc-400">
                            <Filter size={16} /> Filters:
                        </div>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={clsx(
                                    "px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border",
                                    filterCategory === cat
                                        ? "bg-black dark:bg-blue-600 text-white border-black dark:border-blue-600 shadow"
                                        : "bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"
                                )}
                            >
                                {getCategoryLabel(cat)}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setShowExport(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:border-black dark:hover:border-zinc-500 text-gray-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                        <Download size={14} /> {t('btn_export')}
                    </button>
                </div>
            </div>

            <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} />

            {/* Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-zinc-950 text-xs uppercase font-bold text-gray-500 dark:text-zinc-400 border-b border-gray-100 dark:border-zinc-800">
                            <tr>
                                <th className="px-6 py-4 w-10">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-zinc-800"
                                        checked={selectedIds.size > 0 && selectedIds.size === filteredFiles.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-4">{lang === 'fr' ? 'Détails Facture' : 'Invoice Details'}</th>
                                <th className="px-6 py-4">{t('lbl_vendor')}</th>
                                <th className="px-6 py-4">{t('lbl_category')}</th>
                                <th
                                    className="px-6 py-4 cursor-pointer hover:text-black dark:hover:text-white flex items-center gap-1"
                                    onClick={() => setSort(s => s === 'date-desc' ? 'date-asc' : 'date-desc')}
                                >
                                    {t('col_date')} <ArrowUpDown size={12} />
                                </th>
                                <th
                                    className="px-6 py-4 text-right cursor-pointer hover:text-black dark:hover:text-white"
                                    onClick={() => setSort(s => s === 'amount-desc' ? 'amount-asc' : 'amount-desc')}
                                >
                                    {t('col_amount')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                            {filteredFiles.map(file => (
                                <tr
                                    key={file.id}
                                    onClick={() => onEdit(file)}
                                    className={clsx(
                                        "hover:bg-blue-50/50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group",
                                        selectedIds.has(file.id) && "bg-blue-50/30 dark:bg-zinc-800/60"
                                    )}
                                >
                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-zinc-800"
                                            checked={selectedIds.has(file.id)}
                                            onChange={(e) => toggleSelect(file.id, e)}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {file.metadata?.invoice_number || 'N/A'}
                                            </span>
                                            <span className="text-xs text-gray-400 dark:text-zinc-500 truncate max-w-[200px]">
                                                {file.filename}
                                            </span>
                                            {file.metadata?.tags && file.metadata.tags.length > 0 && (
                                                <div className="flex gap-1 mt-1">
                                                    {file.metadata.tags.map(tag => (
                                                        <span key={tag} className="px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 text-[10px] rounded leading-none">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700 dark:text-zinc-300 font-medium">
                                        {file.metadata?.vendor_name || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200">
                                            {getCategoryLabel(file.metadata?.category || 'Other')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-zinc-400">
                                        {file.metadata?.invoice_date || format(new Date(file.upload_time), 'yyyy-MM-dd')}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white font-mono">
                                        {formatCurrency(file.metadata?.total_amount || 0)}
                                    </td>
                                </tr>
                            ))}
                            {filteredFiles.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400 dark:text-zinc-500">
                                        {t('no_docs_found')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-zinc-800 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-6 border border-zinc-700">
                    <span className="font-bold text-sm whitespace-nowrap">
                        {selectedIds.size} {lang === 'fr' ? 'Sélectionnés' : 'Selected'}
                    </span>

                    <div className="h-4 w-px bg-gray-700 dark:bg-zinc-600" />

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 dark:text-zinc-400 uppercase font-bold">
                            {t('bulk_move')}:
                        </span>
                        <select
                            onChange={(e) => handleBulkCategory(e.target.value)}
                            className="bg-gray-800 dark:bg-zinc-700 text-white text-sm rounded-lg px-2 py-1 border-none focus:ring-1 focus:ring-white outline-none cursor-pointer"
                            defaultValue=""
                        >
                            <option value="" disabled>{lang === 'fr' ? 'Choisir...' : 'Choose...'}</option>
                            {allCategories.map(c => <option key={c} value={c}>{getCategoryLabel(c)}</option>)}
                        </select>
                    </div>

                    <div className="h-4 w-px bg-gray-700 dark:bg-zinc-600" />

                    <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-bold transition-colors"
                    >
                        <Trash2 size={16} /> {t('bulk_delete')}
                    </button>

                    <button
                        onClick={() => setSelectedIds(new Set())}
                        className="ml-2 p-1 hover:bg-white/10 rounded-full"
                    >
                        <X size={16} className="text-gray-400" />
                    </button>
                </div>
            )}
        </div>
    );
};
