import React, { useState } from 'react';
import { FileItem } from './FileItem';
import { Trash2, CheckCircle2, ChevronDown, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export const FileList = ({ files, onClear, onEdit }) => {
    if (!files || files.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-white border border-gray-100 shadow-sm mt-4 min-h-[400px]">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                    <Trash2 size={32} className="text-gray-300 transform rotate-180" />
                </div>
                {/* Generic icon, using Trash2 purely as placeholder if FileText not imported, but better to import FileText or Upload if possible. Let's assume FileText is available or just use text. Actually FileItem imports trash, check imports. Trash2 is imported. Let's add FileText to import top of file */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">No documents found</h3>
                <p className="text-gray-500 max-w-xs mx-auto">Upload your first invoice or receipt to verify the accounting automation.</p>
            </div>
        );
    }

    const completedCount = files.filter(f => f.status === 'Completed' || f.status === 'Needs Review').length;
    const [shouldShowAll, setShouldShowAll] = useState(false);

    return (
        <div className="mt-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            {/* Header Actions */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">All Documents</h2>
                {files.length > 0 && (
                    <button
                        onClick={onClear}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Trash2 size={14} /> Clear History
                    </button>
                )}
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50/50 rounded-xl mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider border border-gray-100">
                <div className="col-span-1">Type</div>
                <div className="col-span-4">File Name</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1 text-right">Action</div>
            </div>

            {/* List */}
            <div className="space-y-1">
                <AnimatePresence>
                    {(shouldShowAll ? files : files.slice(0, 10)).map((file, index) => (
                        <motion.div
                            key={file.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                            <FileItem file={file} onEdit={() => onEdit(file)} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {files.length > 10 && (
                <div className="text-center pt-4 border-t border-gray-100 mt-4">
                    <button
                        onClick={() => setShouldShowAll(!shouldShowAll)}
                        className="text-sm font-medium text-gray-500 hover:text-black flex items-center justify-center gap-1 mx-auto transition-colors"
                    >
                        {shouldShowAll ? 'Show Less' : `Show ${files.length - 10} More`}
                        <div className={clsx("transition-transform duration-200", shouldShowAll ? "rotate-180" : "")}>
                            <ChevronDown size={16} />
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
};
