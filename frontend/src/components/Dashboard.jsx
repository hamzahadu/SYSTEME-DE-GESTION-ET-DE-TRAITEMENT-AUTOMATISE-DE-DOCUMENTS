import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    CartesianGrid
} from 'recharts';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, FileText, Share2, UploadCloud, Clock } from 'lucide-react';
import clsx from 'clsx';

const API_URL = 'http://127.0.0.1:8000';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-gray-100 p-3 rounded-lg shadow-xl">
                <p className="text-gray-900 font-bold mb-1">{label}</p>
                <p className="text-blue-600 font-bold">
                    ${(payload[0].value || 0).toFixed(2)}
                </p>
            </div>
        );
    }
    return null;
};

const Card = ({ title, value, subtext, icon: Icon, dark = false }) => (
    <div className={clsx(
        "p-6 rounded-3xl transition-transform hover:-translate-y-1 duration-300",
        dark ? "bg-black text-white shadow-2xl shadow-black/20" : "bg-white text-gray-900 shadow-sm border border-gray-100"
    )}>
        <div className="flex justify-between items-start mb-4">
            <div className={clsx("p-3 rounded-xl", dark ? "bg-white/20" : "bg-gray-50")}>
                <Icon size={24} className={dark ? "text-white" : "text-gray-900"} />
            </div>
            {dark && <div className="p-2 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20"><TrendingUp size={16} /></div>}
        </div>
        <div>
            <p className={clsx("text-sm font-medium mb-1", dark ? "text-gray-400" : "text-gray-500")}>{title}</p>
            <h3 className="text-3xl font-bold mb-4">{value}</h3>

            {/* Progress Bar for Black Card */}
            {dark && (
                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-[45%] rounded-full" />
                </div>
            )}

            {/* Subtext for White Cards */}
            {!dark && (
                <div className="flex items-center gap-2 text-sm">
                    <span className="flex items-center text-emerald-500 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                        <ArrowUpRight size={14} className="mr-1" /> {subtext}
                    </span>
                    <span className="text-gray-400">vs last period</span>
                </div>
            )}
        </div>
        {dark && (
            <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>0%</span>
                <span>45%</span>
            </div>
        )}
    </div>
);

export const Dashboard = ({ onNavigate }) => {
    const [chartData, setChartData] = useState([]);
    const [vendorData, setVendorData] = useState([]);
    const [stats, setStats] = useState({
        totalSpend: 0,
        netTotal: 0,
        totalTax: 0,
        pendingReview: 0
    });
    const [recentUploads, setRecentUploads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('monthly'); // monthly, quarterly, yearly

    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true);
                // Fetch reports based on time range
                const [chartRes, vRes, taxRes, statusRes] = await Promise.all([
                    axios.get(`${API_URL}/reports/${timeRange}`),
                    axios.get(`${API_URL}/reports/vendor`),
                    axios.get(`${API_URL}/reports/tax`),
                    axios.get(`${API_URL}/status`)
                ]);

                // 1. Process Chart Data
                let processedChart = [];
                if (chartRes.data) {
                    processedChart = chartRes.data.map(item => {
                        let name = '';
                        if (timeRange === 'monthly') name = `${item.year}-${item.month}`;
                        else if (timeRange === 'quarterly') name = `${item.year} Q${item.quarter}`;
                        else name = `${item.year}`;

                        return { name, value: item.total_amount || 0 };
                    }).reverse(); // API returns desc, we want asc for chart
                    setChartData(processedChart.reverse());
                }

                // 2. Vendor Data
                if (vRes.data) {
                    setVendorData(vRes.data.slice(0, 5).map(item => ({
                        name: item.vendor_name || 'Unknown',
                        value: item.total_amount || 0
                    })));
                }

                // 3. Status & Recent
                const allFiles = statusRes.data || [];
                const sortedFiles = [...allFiles].reverse().slice(0, 5);
                setRecentUploads(sortedFiles);
                const pendingReview = allFiles.filter(f => f.status === 'Needs Review' || f.status === 'Processing').length;

                // 4. Financial Stats
                const taxInfo = taxRes.data || { total_spend: 0, net_total: 0, total_tax: 0 };

                setStats({
                    totalSpend: taxInfo.total_spend || 0,
                    netTotal: taxInfo.net_total || 0,
                    totalTax: taxInfo.total_tax || 0,
                    pendingReview
                });

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [timeRange]);

    if (loading && !stats.totalSpend) return <div className="text-center py-20 text-gray-500">Loading Financial Data...</div>;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 p-8 w-full mx-auto">

            {/* Financial Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                    title="Total Spend"
                    value={`$${(stats.totalSpend || 0).toFixed(0)}`}
                    icon={DollarSign}
                    dark={true}
                />
                <Card
                    title="Net Expense"
                    value={`$${(stats.netTotal || 0).toFixed(0)}`}
                    subtext="Excl. Tax"
                    icon={TrendingUp}
                />
                <Card
                    title="Est. Tax"
                    value={`$${(stats.totalTax || 0).toFixed(0)}`}
                    subtext="Deductible"
                    icon={FileText}
                />
                <Card
                    title="Needs Review"
                    value={stats.pendingReview}
                    subtext={stats.pendingReview > 0 ? "Action Needed" : "All Good"}
                    icon={ArrowDownRight}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Main Line Chart (Spend Trend) */}
                <div className="xl:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-bold text-gray-900">Revenue (Spend)</h3>

                        {/* Time Range Selector */}
                        <div className="flex bg-gray-50 p-1 rounded-lg gap-1">
                            {['monthly', 'quarterly', 'yearly'].map(range => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={clsx(
                                        "px-3 py-1 text-xs font-semibold rounded-md transition-all capitalize",
                                        timeRange === range ? "bg-black text-white shadow" : "text-gray-500 hover:text-black"
                                    )}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-80">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} barGap={0} barCategoryGap="20%">
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#9ca3af"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#9ca3af"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => `$${val / 1000}k`}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                                    <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={40}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "black" : "#e0e7ff"} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                No spending data for this period
                            </div>
                        )}
                    </div>
                </div>

                {/* Side Donut/List (Top Vendors) */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Top Vendors</h3>
                    <div className="space-y-6">
                        {vendorData.map((vendor, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 font-bold text-xs uppercase">
                                        {vendor.name.substring(0, 2)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{vendor.name}</p>
                                        <p className="text-xs text-gray-400">Vendor #{idx + 1}</p>
                                    </div>
                                </div>
                                <span className="font-bold text-gray-900">${(vendor.value || 0).toFixed(2)}</span>
                            </div>
                        ))}
                        {vendorData.length === 0 && <p className="text-gray-400 text-sm">No data available</p>}
                    </div>
                </div>

            </div>

            {/* Bottom Grid: Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Recent Activity List */}
                <div className="xl:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Clock size={20} className="text-gray-400" /> Recent Activity
                        </h3>
                        <button onClick={() => onNavigate('documents')} className="text-sm font-semibold text-blue-600 hover:text-blue-700">View All</button>
                    </div>

                    <div className="space-y-4">
                        {recentUploads.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                        <FileText size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{file.filename}</p>
                                        <p className="text-xs text-gray-500">{new Date(file.upload_time).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-4">
                                    <span className={clsx(
                                        "px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap",
                                        file.status === 'Completed' ? "bg-green-100 text-green-700" :
                                            file.status === 'Needs Review' ? "bg-amber-100 text-amber-700" :
                                                "bg-gray-100 text-gray-600"
                                    )}>
                                        {file.status}
                                    </span>
                                    <span className="font-mono text-sm font-semibold text-gray-900">
                                        ${(file.metadata?.total_amount || 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {recentUploads.length === 0 && (
                            <div className="p-8 text-center text-gray-400">No recent activity</div>
                        )}
                    </div>
                </div>

                {/* Quick Actions / Integration Status */}
                <div className="space-y-6">
                    {/* Quick Upload CTA */}
                    <div onClick={() => onNavigate('documents')} className="bg-gradient-to-br from-black to-gray-800 rounded-3xl p-6 text-white shadow-xl shadow-gray-900/10 relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <UploadCloud size={100} />
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4">
                                <UploadCloud size={24} />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Quick Upload</h3>
                            <p className="text-gray-300 text-sm mb-6">Drag and drop invoices here or click to browse files immediately.</p>
                            <button onClick={(e) => { e.stopPropagation(); onNavigate('documents'); }} className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors w-full">
                                Upload New File
                            </button>
                        </div>
                    </div>

                    {/* Team / Share */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Share</h3>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold">JD</div>
                                <div className="w-8 h-8 rounded-full bg-blue-200 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-700">AM</div>
                                <div className="w-8 h-8 rounded-full bg-purple-200 border-2 border-white flex items-center justify-center text-xs font-bold text-purple-700">RK</div>
                            </div>
                            <span className="text-xs text-gray-500">+ 3 others</span>
                        </div>
                        <button className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                            <Share2 size={16} /> Share Report
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
