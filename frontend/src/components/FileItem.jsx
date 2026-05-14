import React from 'react';
import { FileText, CheckCircle2, AlertCircle, Loader2, AlertTriangle, Edit2, MoreHorizontal } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

const StatusBadge = ({ status }) => {
    if (status === 'Completed') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100"><CheckCircle2 size={12} /> Completed</span>;
    if (status === 'Needs Review') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100"><AlertTriangle size={12} /> Review</span>;
    if (status === 'Failed') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100"><AlertCircle size={12} /> Failed</span>;
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100"><Loader2 size={12} className="animate-spin" /> Processing</span>;
};

export const FileItem = ({ file, onEdit }) => {
    const meta = file.metadata || {};
    const date = meta.invoice_date || file.upload_time;
    const amount = meta.total_amount ? `$${meta.total_amount.toFixed(2)}` : '-';

    return (
        <div className="group grid grid-cols-12 gap-4 px-4 py-4 items-center border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => onEdit(file)}>

            {/* Icon */}
            <div className="col-span-1">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                    <FileText size={16} />
                </div>
            </div>

            {/* Name & Vendor */}
            <div className="col-span-4">
                <p className="text-sm font-semibold text-gray-900 truncate" title={file.filename}>{file.filename}</p>
                <p className="text-xs text-gray-400 truncate">{meta.vendor_name || 'Detecting Vendor...'}</p>
            </div>

            {/* Date */}
            <div className="col-span-2">
                <p className="text-sm text-gray-600">
                    {date ? format(new Date(date), 'MMM dd, yyyy') : '-'}
                </p>
            </div>

            {/* Amount */}
            <div className="col-span-2">
                <p className="text-sm font-bold text-gray-900">{amount}</p>
            </div>

            {/* Status */}
            <div className="col-span-2">
                <StatusBadge status={file.status} />
            </div>

            {/* Actions */}
            <div className="col-span-1 flex justify-end">
                <button className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors">
                    <MoreHorizontal size={16} />
                </button>
            </div>
        </div>
    );
};
