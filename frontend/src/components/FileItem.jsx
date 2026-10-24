import React from 'react';
import { FileText, CheckCircle2, AlertCircle, Loader2, AlertTriangle, MoreHorizontal, FileX } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';

const StatusBadge = ({ status, t }) => {
    if (status === 'Completed') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
                <CheckCircle2 size={12} /> {t('status_completed')}
            </span>
        );
    }
    if (status === 'Needs Review') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                <AlertTriangle size={12} /> {t('status_review')}
            </span>
        );
    }
    if (status === 'Rejected') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40" title="Non-financial document detected">
                <FileX size={12} /> {t('status_rejected')}
            </span>
        );
    }
    if (status === 'Failed') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                <AlertCircle size={12} /> {t('status_failed')}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
            <Loader2 size={12} className="animate-spin" /> {t('status_processing')}
        </span>
    );
};

export const FileItem = ({ file, onEdit }) => {
    const { lang, t } = useLanguage();
    const { formatCurrency } = useCurrency();
    const meta = file.metadata || {};
    const date = meta.invoice_date || file.upload_time;
    const amount = (meta.total_amount !== null && meta.total_amount !== undefined && meta.total_amount > 0)
        ? formatCurrency(meta.total_amount)
        : '-';

    const isRejected = file.status === 'Rejected' || meta.extracted_data?.is_non_financial;
    const vendorDisplay = meta.vendor_name || (
        isRejected
            ? (lang === 'fr' ? 'Non-Facture (CV / Document)' : 'Non-Invoice (Resume / Text)')
            : (lang === 'fr' ? 'En cours de détection...' : 'Detecting Vendor...')
    );

    let formattedDate = '-';
    if (date) {
        try {
            formattedDate = format(new Date(date), 'MMM dd, yyyy');
        } catch (e) {
            formattedDate = String(date);
        }
    }

    return (
        <div
            onClick={() => onEdit(file)}
            className="group grid grid-cols-12 gap-4 px-4 py-3.5 items-center border-b border-gray-50 dark:border-zinc-800/60 hover:bg-gray-50/70 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer rounded-xl"
        >
            {/* Icon */}
            <div className="col-span-1">
                <div className={clsx(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
                    isRejected
                        ? "bg-red-50 dark:bg-red-950/40 text-red-500"
                        : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 group-hover:text-blue-600"
                )}>
                    {isRejected ? <FileX size={17} /> : <FileText size={17} />}
                </div>
            </div>

            {/* Name & Vendor */}
            <div className="col-span-4 min-w-0 pr-2">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 transition-colors" title={file.filename}>
                    {file.filename}
                </p>
                <p className={clsx("text-xs truncate", isRejected ? "text-red-500/80 font-medium" : "text-gray-400 dark:text-zinc-500")}>
                    {vendorDisplay}
                </p>
            </div>

            {/* Date */}
            <div className="col-span-2">
                <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                    {formattedDate}
                </p>
            </div>

            {/* Amount */}
            <div className="col-span-2">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {amount}
                </p>
            </div>

            {/* Status */}
            <div className="col-span-2">
                <StatusBadge status={file.status} t={t} />
            </div>

            {/* Actions */}
            <div className="col-span-1 flex justify-end">
                <button className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                    <MoreHorizontal size={16} />
                </button>
            </div>
        </div>
    );
};
