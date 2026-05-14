import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, CheckSquare, Trash2, Tag, Edit, X, Download } from 'lucide-react';
import axios from 'axios';
import clsx from 'clsx';
import { format } from 'date-fns';
import { ExportModal } from './ExportModal';

const API_URL = 'http://127.0.0.1:8000';

export const Categories = ({ files, onEdit }) => {
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
        if (!confirm(`Move ${selectedIds.size} items to ${category}?`)) return;
        setBulkProcessing(true);
        try {
            await axios.post(`${API_URL}/documents/bulk/update`, {
                document_ids: Array.from(selectedIds),
                updates: { category }
            });
            window.location.reload(); // Simple reload to refresh data
        } catch (e) {
            console.error(e);
            alert("Bulk update failed");
        } finally {
            setBulkProcessing(false);
            setSelectedIds(new Set());
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedIds.size} items?`)) return;
        setBulkProcessing(true);
        try {
            await axios.post(`${API_URL}/documents/bulk/delete`, {
                document_ids: Array.from(selectedIds)
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
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-gray-900">Accounting Database</h2>
                    <div className="relative w-full md:w-96">
                        <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center justify-between mt-4 md:mt-0">
                    <div className="flex flex-wrap gap-2 items-center">
                        <div className="flex items-center gap-2 mr-4 text-sm font-medium text-gray-500">
                            <Filter size={16} /> Filters:
                        </div>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={clsx(
                                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border",
                                    filterCategory === cat ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setShowExport(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-black hover:text-black text-gray-600 rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                        <Download size={14} /> Export
                    </button>
                </div>
            </div>

            <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} />

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 w-10">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-black focus:ring-black"
                                        checked={selectedIds.size > 0 && selectedIds.size === filteredFiles.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-4">Invoice Details</th>
                                <th className="px-6 py-4">Vendor</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4 cursor-pointer hover:text-black flex items-center gap-1" onClick={() => setSort(s => s === 'date-desc' ? 'date-asc' : 'date-desc')}>
                                    Date <ArrowUpDown size={12} />
                                </th>
                                <th className="px-6 py-4 text-right cursor-pointer hover:text-black" onClick={() => setSort(s => s === 'amount-desc' ? 'amount-asc' : 'amount-desc')}>
                                    Amount
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredFiles.map(file => (
                                <tr
                                    key={file.id}
                                    onClick={() => onEdit(file)}
                                    className={clsx(
                                        "hover:bg-blue-50/50 transition-colors cursor-pointer group",
                                        selectedIds.has(file.id) && "bg-blue-50/30"
                                    )}
                                >
                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-black focus:ring-black"
                                            checked={selectedIds.has(file.id)}
                                            onChange={(e) => toggleSelect(file.id, e)}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{file.metadata?.invoice_number || 'N/A'}</span>
                                            <span className="text-xs text-gray-400 truncate max-w-[200px]">{file.filename}</span>
                                            {/* Tags Display */}
                                            {file.metadata?.tags && file.metadata.tags.length > 0 && (
                                                <div className="flex gap-1 mt-1">
                                                    {file.metadata.tags.map(tag => (
                                                        <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded leading-none">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700 font-medium">
                                        {file.metadata?.vendor_name || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {file.metadata?.category || 'Uncategorized'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {file.metadata?.invoice_date || format(new Date(file.upload_time), 'yyyy-MM-dd')}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900 font-mono">
                                        ${(file.metadata?.total_amount || 0).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            {filteredFiles.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                        No documents found matching filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-6">
                    <span className="font-bold text-sm whitespace-nowrap">{selectedIds.size} Selected</span>

                    <div className="h-4 w-px bg-gray-700" />

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 uppercase font-bold">Set Category:</span>
                        <select
                            onChange={(e) => handleBulkCategory(e.target.value)}
                            className="bg-gray-800 text-white text-sm rounded-lg px-2 py-1 border-none focus:ring-1 focus:ring-white outline-none cursor-pointer"
                            defaultValue=""
                        >
                            <option value="" disabled>Choose...</option>
                            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="h-4 w-px bg-gray-700" />

                    <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-bold transition-colors"
                    >
                        <Trash2 size={16} /> Delete
                    </button>

                    <button
                        onClick={() => setSelectedIds(new Set())}
                        className="ml-2 p-1 hover:bg-white/10 rounded-full"
                    >
                        <X size={16} className="text-gray-500" />
                    </button>
                </div>
            )}
        </div>
    );
};
