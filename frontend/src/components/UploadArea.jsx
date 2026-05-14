import React, { useRef, useState } from 'react';
import { UploadCloud, File as FileIcon } from 'lucide-react';
import clsx from 'clsx';

export const UploadArea = ({ onUpload }) => {
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
            // Reset value to allow selecting the same file again if needed
            e.target.value = null;
        }
    };

    return (
        <div
            className={clsx(
                "relative group cursor-pointer border-2 border-dashed rounded-3xl p-10 transition-all duration-200 ease-in-out",
                "flex flex-col items-center justify-center text-center",
                isDragging
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-400 hover:bg-gray-50 bg-white"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            <input
                type="file"
                multiple
                accept=".pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />

            <div className={clsx("p-4 rounded-2xl mb-4 transition-colors",
                isDragging ? "bg-blue-100 text-blue-600" : "bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500"
            )}>
                <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-gray-900">
                Drop files here to process
            </h3>
            <p className="text-gray-500 mt-2 text-sm max-w-sm">
                Upload multiple PDFs (50+) to start the document pipeline.
                <br />
                <span className="text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Click to browse</span>
            </p>
        </div>
    );
};
