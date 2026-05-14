import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Download, Table as TableIcon, Calendar, Users, Folder } from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000';

const SummaryTable = ({ title, icon: Icon, data, columns }) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="mb-8 border border-slate-700 rounded-xl overflow-hidden bg-slate-800/20">
            <div className="px-5 py-4 bg-slate-800/50 border-b border-slate-700 flex items-center gap-2">
                <Icon size={18} className="text-blue-400" />
                <h3 className="font-semibold text-slate-200">{title}</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-800/30">
                        <tr>
                            {columns.map(col => (
                                <th key={col.key} className="px-5 py-3 font-medium">{col.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {data.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                {columns.map(col => (
                                    <td key={col.key} className="px-5 py-3 text-slate-300">
                                        {col.format ? col.format(row[col.key]) : row[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const Reports = () => {
    const [monthly, setMonthly] = useState([]);
    const [vendor, setVendor] = useState([]);
    const [category, setCategory] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [mRes, vRes, cRes] = await Promise.all([
                axios.get(`${API_URL}/reports/monthly`),
                axios.get(`${API_URL}/reports/vendor`),
                axios.get(`${API_URL}/reports/category`)
            ]);
            setMonthly(mRes.data);
            setVendor(vRes.data);
            setCategory(cRes.data);
        } catch (e) {
            console.error("Failed to load reports", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">Financial Reports</h2>
                    <p className="text-slate-400 text-sm mt-1">Summary declarations and breakdown</p>
                </div>

                <div className="flex gap-2">
                    <a href={`${API_URL}/export/csv`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium transition-colors text-slate-200">
                        <Download size={16} />
                        Export CSV
                    </a>
                    <a href={`${API_URL}/export/excel`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors text-white shadow-lg shadow-emerald-900/20">
                        <TableIcon size={16} />
                        Export Excel
                    </a>
                </div>
            </div>

            {loading && <div className="text-slate-400 text-center py-10">Loading reports...</div>}

            {!loading && (
                <div className="space-y-6">
                    <SummaryTable
                        title="Monthly Breakdown"
                        icon={Calendar}
                        data={monthly}
                        columns={[
                            { label: "Year", key: "year" },
                            { label: "Month", key: "month" },
                            { label: "Total Spend", key: "total_amount", format: formatCurrency },
                            { label: "Tax Total", key: "tax_amount", format: formatCurrency },
                        ]}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <SummaryTable
                            title="Vendor Spend"
                            icon={Users}
                            data={vendor}
                            columns={[
                                { label: "Vendor", key: "vendor_name" },
                                { label: "Total", key: "total_amount", format: formatCurrency },
                            ]}
                        />

                        <SummaryTable
                            title="Category Spend"
                            icon={Folder}
                            data={category}
                            columns={[
                                { label: "Category", key: "category" },
                                { label: "Total", key: "total_amount", format: formatCurrency },
                            ]}
                        />
                    </div>

                    {monthly.length === 0 && !loading && (
                        <div className="text-center py-12 border border-dashed border-slate-700 rounded-xl">
                            <p className="text-slate-500">No accounting data available yet.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
