import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, FileText, Calendar, DollarSign, Building, AlertCircle } from 'lucide-react';
import axios from 'axios';
import clsx from 'clsx';

const API_URL = 'http://127.0.0.1:8000';

export const EditModal = ({ isOpen, onClose, file, onSave }) => {
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);

    // Reset form when file changes
    useEffect(() => {
        if (file && file.metadata) {
            setFormData({
                invoice_number: file.metadata.invoice_number || '',
                invoice_date: file.metadata.invoice_date || '',
                vendor_name: file.metadata.vendor_name || '',
                total_amount: file.metadata.total_amount || '',
                category: file.metadata.category || '',
                tags: file.metadata.tags || []
            });
        }
    }, [file]);

    if (!isOpen || !file) return null;

    const fileUrl = `${API_URL}/static/${file.id}_${file.filename}`;
    const isImage = file.filename.match(/\.(jpg|jpeg|png|gif)$/i);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Convert types if needed
            const updates = {
                metadata: {
                    ...formData,
                    total_amount: parseFloat(formData.total_amount) || 0
                }
            };

            const res = await axios.patch(`${API_URL}/documents/${file.id}`, updates);
            onSave(res.data);
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex overflow-hidden"
            >
                {/* Left: Preview Panel - Dark Theme */}
                <div className="w-7/12 bg-gray-900 border-r border-gray-800 flex flex-col relative">
                    <div className="absolute top-4 left-4 z-10 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md">
                        {file.filename}
                    </div>

                    <div className="flex-1 w-full h-full p-4 flex items-center justify-center bg-gray-900">
                        {isImage ? (
                            <img src={fileUrl} alt="Document" className="max-w-full max-h-full object-contain shadow-2xl border border-gray-700" />
                        ) : (
                            <object data={fileUrl} type="application/pdf" className="w-full h-full rounded-lg shadow-2xl border border-gray-700 bg-white">
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <p>Preview Unavailable</p>
                                    <a href={fileUrl} target="_blank" rel="noreferrer" className="text-blue-400 underline mt-2">Open File</a>
                                </div>
                            </object>
                        )}
                    </div>
                </div>

                {/* Right: Edit Form */}
                <div className="w-1/3 flex flex-col bg-white">
                    <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Edit Details</h2>
                            <p className="text-sm text-gray-500 mt-1">Verify extracted information against the document.</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X size={24} className="text-gray-400 hover:text-gray-900" />
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Invoice Number</label>
                                <div className="relative">
                                    <FileText size={18} className="absolute left-3 top-3.5 text-black" />
                                    <input
                                        type="text"
                                        value={formData.invoice_number}
                                        onChange={e => setFormData({ ...formData, invoice_number: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 font-semibold focus:border-black focus:ring-1 focus:ring-black outline-none transition-all placeholder-gray-400"
                                        placeholder="Enter Invoice #"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Date</label>
                                    <div className="relative">
                                        <Calendar size={18} className="absolute left-3 top-3.5 text-black" />
                                        <input
                                            type="date"
                                            value={formData.invoice_date}
                                            onChange={e => setFormData({ ...formData, invoice_date: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 font-semibold focus:border-black focus:ring-1 focus:ring-black outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Total Amount</label>
                                    <div className="relative">
                                        <DollarSign size={18} className="absolute left-3 top-3.5 text-black" />
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.total_amount}
                                            onChange={e => setFormData({ ...formData, total_amount: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 font-bold focus:border-black focus:ring-1 focus:ring-black outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Vendor Name</label>
                                <div className="relative">
                                    <Building size={18} className="absolute left-3 top-3.5 text-black" />
                                    <input
                                        type="text"
                                        value={formData.vendor_name}
                                        onChange={e => setFormData({ ...formData, vendor_name: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 font-semibold focus:border-black focus:ring-1 focus:ring-black outline-none"
                                        placeholder="Vendor Name"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 font-semibold focus:border-black focus:ring-1 focus:ring-black outline-none"
                                >
                                    <option value="">Select Category...</option>
                                    <option value="Meals">Meals</option>
                                    <option value="Transport">Transport</option>
                                    <option value="Office Supplies">Office Supplies</option>
                                    <option value="Software">Software</option>
                                    <option value="Services">Services</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Tags</label>
                                <div className="border border-gray-300 rounded-xl p-3 bg-white focus-within:ring-1 focus-within:ring-black focus-within:border-black transition-all">
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {(formData.tags || []).map(tag => (
                                            <span key={tag} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                                                #{tag}
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))}
                                                    className="hover:text-red-500"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Add tag (Press Enter)"
                                        className="w-full text-sm font-medium outline-none placeholder-gray-400 text-gray-900"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const val = e.target.value.trim();
                                                if (val && !formData.tags?.includes(val)) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        tags: [...(prev.tags || []), val]
                                                    }));
                                                    e.target.value = '';
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Validation Warning */}
                        {(!formData.invoice_number || !formData.total_amount) && (
                            <div className="flex items-start gap-4 p-4 bg-amber-50 text-amber-900 rounded-xl text-sm font-medium border border-amber-100">
                                <AlertCircle size={20} className="mt-0.5 shrink-0 text-amber-600" />
                                <p>Missing Invoice Number or Amount may cause this document to require further review.</p>
                            </div>
                        )}

                    </form>

                    <div className="p-8 border-t border-gray-100 bg-gray-50 flex justify-end gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={clsx(
                                "flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-xl shadow-black/10",
                                saving ? "bg-gray-800 cursor-wait" : "bg-black hover:bg-gray-800 hover:-translate-y-0.5"
                            )}
                        >
                            {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
