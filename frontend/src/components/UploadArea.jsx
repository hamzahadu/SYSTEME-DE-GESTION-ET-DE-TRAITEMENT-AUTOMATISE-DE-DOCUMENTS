import React, { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '../context/LanguageContext';

export const UploadArea = ({ onUpload }) => {
    const { t } = useLanguage();
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onUpload(e.dataTransfer.files);
        }
    };

    const handleClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            onUpload(e.target.files);
            e.target.value = null;
        }
    };

    return (
        <div
            className={clsx(
                "relative group cursor-pointer border-2 border-dashed rounded-3xl p-10 transition-all duration-200 ease-in-out",
                "flex flex-col items-center justify-center text-center",
                isDragging
                    ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/20"
                    : "border-gray-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50/50 dark:hover:bg-zinc-800/40 bg-white dark:bg-zinc-900"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            <input
                type="file"
                multiple
                accept=".pdf,image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />

            <div className={clsx(
                "p-4 rounded-2xl mb-4 transition-colors",
                isDragging
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                    : "bg-gray-50 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 group-hover:text-blue-500"
            )}>
                <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('drop_files_title')}
            </h3>
            <p className="text-gray-500 dark:text-zinc-400 mt-2 text-sm max-w-sm">
                {t('drop_files_subtitle')}
                <br />
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {t('click_to_browse')}
                </span>
            </p>
        </div>
    );
};
