import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    CartesianGrid
} from 'recharts';
import { TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, FileText, Share2, UploadCloud, Clock, Coins } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';

const API_URL = 'http://127.0.0.1:8000';

const CustomTooltip = ({ active, payload, label, formatCurrency }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 p-3 rounded-xl shadow-xl">
                <p className="text-gray-900 dark:text-white font-bold mb-1">{label}</p>
                <p className="text-blue-600 dark:text-blue-400 font-bold">
                    {formatCurrency ? formatCurrency(payload[0].value || 0) : `${(payload[0].value || 0).toFixed(2)}`}
                </p>
            </div>
        );
    }
    return null;
};

const Card = ({ title, value, subtext, icon: Icon, dark = false, vsText }) => (
    <div className={clsx(
        "p-6 rounded-3xl transition-transform hover:-translate-y-1 duration-300",
        dark
            ? "bg-black dark:bg-zinc-900 text-white shadow-2xl shadow-black/20 border border-zinc-800"
            : "bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm border border-gray-100 dark:border-zinc-800"
    )}>
        <div className="flex justify-between items-start mb-4">
            <div className={clsx("p-3 rounded-xl", dark ? "bg-white/20 dark:bg-zinc-800" : "bg-gray-50 dark:bg-zinc-800")}>
                <Icon size={24} className={dark ? "text-white" : "text-gray-900 dark:text-zinc-200"} />
            </div>
            {dark && (
                <div className="p-2 bg-white/10 dark:bg-zinc-800 rounded-lg cursor-pointer hover:bg-white/20">
                    <TrendingUp size={16} />
                </div>
            )}
        </div>
        <div>
            <p className={clsx("text-sm font-medium mb-1", dark ? "text-gray-400 dark:text-zinc-400" : "text-gray-500 dark:text-zinc-400")}>{title}</p>
            <h3 className="text-3xl font-bold mb-4">{value}</h3>

            {dark && (
                <div className="w-full bg-white/20 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[45%] rounded-full" />
                </div>
            )}

            {!dark && (
                <div className="flex items-center gap-2 text-sm">
                    <span className="flex items-center text-emerald-500 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                        <ArrowUpRight size={14} className="mr-1" /> {subtext}
                    </span>
                    <span className="text-gray-400 dark:text-zinc-500 text-xs">{vsText}</span>
                </div>
            )}
        </div>
        {dark && (
            <div className="flex justify-between mt-2 text-xs text-gray-400 dark:text-zinc-500">
                <span>0%</span>
                <span>45%</span>
            </div>
        )}
    </div>
);

export const Dashboard = ({ onNavigate }) => {
    const { t } = useLanguage();
    const { formatCurrency, currency } = useCurrency();
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
                const token = localStorage.getItem('token');
                const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

                const [chartRes, vRes, taxRes, statusRes] = await Promise.all([
                    axios.get(`${API_URL}/reports/${timeRange}`, config),
                    axios.get(`${API_URL}/reports/vendor`, config),
                    axios.get(`${API_URL}/reports/tax`, config),
                    axios.get(`${API_URL}/status`, config)
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
                    }).reverse();
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
                console.error("Dashboard fetch error:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [timeRange]);

    if (loading && !stats.totalSpend) {
        return (
            <div className="text-center py-20 text-gray-500 dark:text-zinc-400">
                {t('spending_overview')}...
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 p-4 md:p-8 w-full mx-auto">

            {/* Financial Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                    title={t('total_spend')}
                    value={formatCurrency(stats.totalSpend || 0)}
                    icon={Coins}
                    dark={true}
                />
                <Card
                    title={t('net_total')}
                    value={formatCurrency(stats.netTotal || 0)}
                    subtext={t('excl_tax')}
                    icon={TrendingUp}
                    vsText={t('vs_last_period')}
                />
                <Card
                    title={t('est_tax')}
                    value={formatCurrency(stats.totalTax || 0)}
                    subtext={t('total_tax')}
                    icon={FileText}
                    vsText={t('vs_last_period')}
                />
                <Card
                    title={t('pending_review')}
                    value={stats.pendingReview}
                    subtext={stats.pendingReview > 0 ? t('action_needed') : t('all_good')}
                    icon={ArrowDownRight}
                    vsText={t('vs_last_period')}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Main Line Chart (Spend Trend) */}
                <div className="xl:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 transition-colors">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {t('revenue_spend')}
                        </h3>

                        {/* Time Range Selector */}
                        <div className="flex bg-gray-50 dark:bg-zinc-800 p-1 rounded-xl gap-1 border border-gray-100 dark:border-zinc-700">
                            {['monthly', 'quarterly', 'yearly'].map(range => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={clsx(
                                        "px-3 py-1 text-xs font-semibold rounded-lg transition-all capitalize",
                                        timeRange === range
                                            ? "bg-black dark:bg-blue-600 text-white shadow"
                                            : "text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                                    )}
                                >
                                    {t(range)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-80">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} barGap={0} barCategoryGap="20%">
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
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
                                        tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val} ${currency === 'MAD' ? 'DH' : currency === 'EUR' ? '€' : '$'}`}
                                    />
                                    <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                                    <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={40}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#2563eb" : "#93c5fd"} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400 dark:text-zinc-500 text-sm">
                                {t('no_spending_data')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Side Donut/List (Top Vendors) */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 transition-colors">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                        {t('top_vendors')}
                    </h3>
                    <div className="space-y-6">
                        {vendorData.map((vendor, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-zinc-400 font-bold text-xs uppercase">
                                        {vendor.name.substring(0, 2)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{vendor.name}</p>
                                        <p className="text-xs text-gray-400 dark:text-zinc-500">#{idx + 1}</p>
                                    </div>
                                </div>
                                <span className="font-bold text-gray-900 dark:text-white">${(vendor.value || 0).toFixed(2)}</span>
                            </div>
                        ))}
                        {vendorData.length === 0 && <p className="text-gray-400 dark:text-zinc-500 text-sm">{t('no_docs_found')}</p>}
                    </div>
                </div>

            </div>

            {/* Bottom Grid: Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Recent Activity List */}
                <div className="xl:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6 transition-colors">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Clock size={20} className="text-gray-400 dark:text-zinc-500" /> {t('recent_documents')}
                        </h3>
                        <button
                            onClick={() => onNavigate('documents')}
                            className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            {t('view_all')}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {recentUploads.map((file, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-2xl transition-colors border border-transparent hover:border-gray-100 dark:hover:border-zinc-800"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                        <FileText size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{file.filename}</p>
                                        <p className="text-xs text-gray-500 dark:text-zinc-400">{new Date(file.upload_time).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-4">
                                    <span className={clsx(
                                        "px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap",
                                        file.status === 'Completed' ? "bg-green-100 dark:bg-emerald-950/40 text-green-700 dark:text-emerald-400" :
                                            file.status === 'Needs Review' ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400" :
                                                file.status === 'Rejected' ? "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400" :
                                                    "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400"
                                    )}>
                                        {file.status === 'Completed' ? t('status_completed') :
                                            file.status === 'Needs Review' ? t('status_review') :
                                                file.status === 'Rejected' ? t('status_rejected') : file.status}
                                    </span>
                                    <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                                        {formatCurrency(file.metadata?.total_amount || 0)}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {recentUploads.length === 0 && (
                            <div className="p-8 text-center text-gray-400 dark:text-zinc-500">{t('no_recent_activity')}</div>
                        )}
                    </div>
                </div>

                {/* Quick Actions / Integration Status */}
                <div className="space-y-6">
                    {/* Quick Upload CTA */}
                    <div
                        onClick={() => onNavigate('documents')}
                        className="bg-gradient-to-br from-black to-zinc-800 dark:from-zinc-900 dark:to-zinc-800 rounded-3xl p-6 text-white shadow-xl border border-zinc-800 relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <UploadCloud size={100} />
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4">
                                <UploadCloud size={24} />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">{t('quick_upload')}</h3>
                            <p className="text-gray-300 dark:text-zinc-400 text-sm mb-6">{t('quick_upload_desc')}</p>
                            <button
                                onClick={(e) => { e.stopPropagation(); onNavigate('documents'); }}
                                className="bg-white text-black dark:bg-blue-600 dark:text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-100 dark:hover:bg-blue-700 transition-colors w-full"
                            >
                                {t('upload_new_file')}
                            </button>
                        </div>
                    </div>

                    {/* Team / Share */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800 transition-colors">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('share_report')}</h3>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-xs font-bold text-white">GD</div>
                                <div className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-xs font-bold text-white">AI</div>
                                <div className="w-8 h-8 rounded-full bg-purple-500 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-xs font-bold text-white">PFE</div>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-zinc-400">Gestion Document</span>
                        </div>
                        <button
                            onClick={() => alert(t('share_report') + " (PDF / Excel)")}
                            className="w-full flex items-center justify-center gap-2 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 font-semibold py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-sm"
                        >
                            <Share2 size={16} /> {t('share_report')}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
