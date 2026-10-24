import React, { useState } from 'react';
import { FileItem } from './FileItem';
import { Trash2, ChevronDown, FolderOpen, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useLanguage } from '../context/LanguageContext';
import { ExportModal } from './ExportModal';

export const FileList = ({ files, onClear, onEdit }) => {
    const { t, lang } = useLanguage();
    const [shouldShowAll, setShouldShowAll] = useState(false);
    const [showExport, setShowExport] = useState(false);

    const handleClearClick = () => {
        if (window.confirm(t('clear_confirm'))) {
            if (onClear) onClear();
        }
    };

    if (!files || files.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm mt-4 min-h-[350px] transition-colors">
                <div className="w-16 h-16 bg-gray-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
                    <FolderOpen size={32} className="text-gray-300 dark:text-zinc-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {t('no_docs_found')}
                </h3>
                <p className="text-gray-400 dark:text-zinc-500 text-sm max-w-sm mx-auto">
                    {t('no_docs_subtitle')}
                </p>
            </div>
        );
    }

    return (
        <div className="mt-4 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6 transition-colors">
            {/* Header Actions */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        {t('all_documents')}
                    </h2>
                    <span className="text-xs bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 font-bold px-2.5 py-0.5 rounded-full">
                        {files.length}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {files.length > 0 && (
                        <button
                            onClick={() => setShowExport(true)}
                            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-all border border-blue-200 dark:border-blue-900/40"
                        >
                            <Download size={14} />
                            <span>{lang === 'fr' ? 'Exporter (Excel / CSV)' : 'Export (Excel / CSV)'}</span>
                        </button>
                    )}

                    {files.length > 0 && (
                        <button
                            onClick={handleClearClick}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all border border-transparent hover:border-red-200 dark:hover:border-red-900/40"
                        >
                            <Trash2 size={14} />
                            <span>{t('clear_history')}</span>
                        </button>
                    )}
                </div>
            </div>

            <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} />

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50/70 dark:bg-zinc-950/60 rounded-xl mb-2 text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider border border-gray-100 dark:border-zinc-800/60">
                <div className="col-span-1">{t('col_type')}</div>
                <div className="col-span-4">{t('col_filename')}</div>
                <div className="col-span-2">{t('col_date')}</div>
                <div className="col-span-2">{t('col_amount')}</div>
                <div className="col-span-2">{t('col_status')}</div>
                <div className="col-span-1 text-right">{t('col_action')}</div>
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
                            transition={{ duration: 0.2, delay: index * 0.03 }}
                        >
                            <FileItem file={file} onEdit={() => onEdit(file)} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {files.length > 10 && (
                <div className="text-center pt-4 border-t border-gray-100 dark:border-zinc-800 mt-4">
                    <button
                        onClick={() => setShouldShowAll(!shouldShowAll)}
                        className="text-xs font-bold text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white flex items-center justify-center gap-1.5 mx-auto transition-colors px-4 py-2 bg-gray-50 dark:bg-zinc-800/60 rounded-xl"
                    >
                        <span>{shouldShowAll ? t('show_less') : `${t('show_more')} (${files.length - 10})`}</span>
                        <ChevronDown size={14} className={clsx("transition-transform duration-200", shouldShowAll && "rotate-180")} />
                    </button>
                </div>
            )}
        </div>
    );
};
