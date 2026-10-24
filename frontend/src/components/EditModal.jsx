import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Save, FileText, Calendar, DollarSign, Building,
    AlertCircle, CheckCircle2, Clock, ShieldCheck, History,
    Sparkles, Download, ExternalLink, Calculator, Percent,
    Coins, FileSearch, Layers, Cpu, Check, ArrowRight
} from 'lucide-react';
import axios from 'axios';
import clsx from 'clsx';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';

const API_URL = 'http://127.0.0.1:8000';

export const EditModal = ({ isOpen, onClose, file, onSave }) => {
    const { t, lang } = useLanguage();
    const { formatCurrency, currency } = useCurrency();
    const [activeTab, setActiveTab] = useState('accounting'); // 'accounting' | 'audit'

    // Form state with subtotal, tax and total
    const [formData, setFormData] = useState({
        invoice_number: '',
        invoice_date: '',
        vendor_name: '',
        subtotal: '',
        tax_rate: '20',
        tax_amount: '',
        total_amount: '',
        category: '',
        status: 'Completed',
        tags: []
    });

    const [saving, setSaving] = useState(false);
    const [calcNotice, setCalcNotice] = useState('');

    // Reset form when file changes
    useEffect(() => {
        if (file && file.metadata) {
            const meta = file.metadata;
            const total = meta.total_amount || 0;
            const tax = meta.tax_amount || (total > 0 ? (total * 0.2 / 1.2) : 0);
            const sub = meta.subtotal || (total > 0 ? (total - tax) : 0);

            setFormData({
                invoice_number: meta.invoice_number || '',
                invoice_date: meta.invoice_date || (file.upload_time ? file.upload_time.split('T')[0] : ''),
                vendor_name: meta.vendor_name || '',
                subtotal: sub ? Number(sub).toFixed(2) : '',
                tax_rate: '20',
                tax_amount: tax ? Number(tax).toFixed(2) : '',
                total_amount: total ? Number(total).toFixed(2) : '',
                category: meta.category || 'Software',
                status: file.status || 'Completed',
                tags: meta.tags || []
            });
        }
    }, [file]);

    if (!isOpen || !file) return null;

    const fileUrl = `${API_URL}/static/${file.id}_${file.filename}`;
    const isImage = file.filename.match(/\.(jpg|jpeg|png|gif)$/i);
    const meta = file.metadata || {};
    const confidencePct = Math.round((meta.confidence || 0.95) * 100);

    // Auto-calculate TVA & TTC from HT
    const handleCalculateFromHT = () => {
        const ht = parseFloat(formData.subtotal) || 0;
        const rate = parseFloat(formData.tax_rate) || 20;
        const tax = parseFloat((ht * (rate / 100)).toFixed(2));
        const ttc = parseFloat((ht + tax).toFixed(2));

        setFormData(prev => ({
            ...prev,
            tax_amount: tax.toFixed(2),
            total_amount: ttc.toFixed(2)
        }));

        setCalcNotice(lang === 'fr' ? `Calculé : TVA (${rate}%) = ${tax.toFixed(2)} | TTC = ${ttc.toFixed(2)}` : `Calculated: Tax = ${tax.toFixed(2)} | Total = ${ttc.toFixed(2)}`);
        setTimeout(() => setCalcNotice(''), 3500);
    };

    // Auto-calculate HT & TVA from TTC
    const handleCalculateFromTTC = () => {
        const ttc = parseFloat(formData.total_amount) || 0;
        const rate = parseFloat(formData.tax_rate) || 20;
        const ht = parseFloat((ttc / (1 + rate / 100)).toFixed(2));
        const tax = parseFloat((ttc - ht).toFixed(2));

        setFormData(prev => ({
            ...prev,
            subtotal: ht.toFixed(2),
            tax_amount: tax.toFixed(2)
        }));

        setCalcNotice(lang === 'fr' ? `Ventilé : HT = ${ht.toFixed(2)} | TVA (${rate}%) = ${tax.toFixed(2)}` : `Computed: Net = ${ht.toFixed(2)} | Tax = ${tax.toFixed(2)}`);
        setTimeout(() => setCalcNotice(''), 3500);
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            const updates = {
                status: formData.status,
                metadata: {
                    invoice_number: formData.invoice_number,
                    invoice_date: formData.invoice_date,
                    vendor_name: formData.vendor_name,
                    subtotal: parseFloat(formData.subtotal) || 0,
                    tax_amount: parseFloat(formData.tax_amount) || 0,
                    total_amount: parseFloat(formData.total_amount) || 0,
                    category: formData.category,
                    tags: formData.tags
                }
            };

            const res = await axios.patch(`${API_URL}/documents/${file.id}`, updates);
            if (onSave) onSave(file.id, updates);
            onClose();
        } catch (err) {
            console.error("Save document error", err);
            alert(lang === 'fr' ? "Échec de l'enregistrement des modifications" : "Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-7xl h-[92vh] flex flex-col md:flex-row overflow-hidden border border-gray-200 dark:border-zinc-800 transition-colors"
            >
                {/* Left Panel: Document Viewer */}
                <div className="w-full md:w-7/12 bg-zinc-950 border-r border-zinc-800 flex flex-col relative h-1/2 md:h-full">
                    {/* Top Document Header Bar */}
                    <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80 backdrop-blur-sm z-10">
                        <div className="flex items-center gap-2.5 min-w-0 pr-3">
                            <span className="bg-blue-600 text-white p-1.5 rounded-lg shrink-0">
                                <FileText size={16} />
                            </span>
                            <span className="text-white font-bold text-xs truncate" title={file.filename}>
                                {file.filename}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <a
                                href={fileUrl}
                                download={file.filename}
                                className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold border border-zinc-700 transition-colors"
                                title="Télécharger le fichier original"
                            >
                                <Download size={13} />
                                <span className="hidden sm:inline">Télécharger</span>
                            </a>
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition-colors"
                                title="Ouvrir dans un nouvel onglet"
                            >
                                <ExternalLink size={15} />
                            </a>
                        </div>
                    </div>

                    {/* Preview Canvas */}
                    <div className="flex-1 w-full h-full p-4 flex items-center justify-center bg-zinc-950 overflow-hidden">
                        {isImage ? (
                            <img
                                src={fileUrl}
                                alt="Document"
                                className="max-w-full max-h-full object-contain shadow-2xl rounded-xl border border-zinc-800"
                            />
                        ) : (
                            <object
                                data={fileUrl}
                                type="application/pdf"
                                className="w-full h-full rounded-2xl shadow-2xl border border-zinc-800 bg-white"
                            >
                                <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-8 text-center space-y-3">
                                    <FileSearch size={40} className="text-zinc-600" />
                                    <p className="font-semibold text-sm">{t('preview_unavailable')}</p>
                                    <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
                                    >
                                        <ExternalLink size={14} /> {t('open_file')}
                                    </a>
                                </div>
                            </object>
                        )}
                    </div>
                </div>

                {/* Right Panel: Accounting & Audit Studio */}
                <div className="w-full md:w-5/12 flex flex-col bg-white dark:bg-zinc-900 h-1/2 md:h-full">
                    {/* Header with Title & Tab Switcher */}
                    <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 transition-colors">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {t('edit_title')}
                                </h2>
                                <span className={clsx(
                                    "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                    confidencePct >= 90
                                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40"
                                        : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40"
                                )}>
                                    IA : {confidencePct}%
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-zinc-400">
                                {lang === 'fr' ? 'Supervision humaine & contrôle comptable' : 'Human supervision & accounting review'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                        >
                            <X size={18} className="text-gray-400 hover:text-gray-900 dark:hover:text-white" />
                        </button>
                    </div>

                    {/* Studio Navigation Tabs */}
                    <div className="flex px-6 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-950/40">
                        <button
                            onClick={() => setActiveTab('accounting')}
                            className={clsx(
                                "flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-all",
                                activeTab === 'accounting'
                                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                                    : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                            )}
                        >
                            <Calculator size={15} />
                            <span>{lang === 'fr' ? 'Écritures Comptables' : 'Accounting Breakdown'}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('audit')}
                            className={clsx(
                                "flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-all",
                                activeTab === 'audit'
                                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                                    : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                            )}
                        >
                            <History size={15} />
                            <span>{lang === 'fr' ? "Piste d'Audit & IA" : 'Audit Trail & AI'}</span>
                        </button>
                    </div>

                    {/* Scrollable Body Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-5">
                        {/* TAB 1: Écritures Comptables */}
                        {activeTab === 'accounting' && (
                            <form onSubmit={handleSave} className="space-y-5">
                                {/* Non-financial document warning */}
                                {file.status === 'Rejected' && (
                                    <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-300 rounded-2xl text-xs font-semibold border border-red-200 dark:border-red-900/40">
                                        <AlertCircle size={18} className="shrink-0 text-red-500 mt-0.5" />
                                        <div>
                                            <p className="font-bold">Document non comptable</p>
                                            <p className="mt-0.5 font-normal text-red-700 dark:text-red-400">
                                                Ce document a été identifié comme un CV ou texte général plutôt qu'une facture.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Fournisseur */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-xs font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider">
                                            {t('lbl_vendor')}
                                        </label>
                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                            <Sparkles size={11} /> Extraction Regex/Layout
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <Building size={17} className="absolute left-3.5 top-3.5 text-gray-400 dark:text-zinc-500" />
                                        <input
                                            type="text"
                                            value={formData.vendor_name}
                                            onChange={e => setFormData({ ...formData, vendor_name: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white font-semibold text-sm focus:border-blue-500 outline-none"
                                            placeholder="Nom du Fournisseur / Société"
                                        />
                                    </div>
                                </div>

                                {/* Invoice # & Date Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider">
                                            {t('lbl_invoice_number')}
                                        </label>
                                        <div className="relative">
                                            <FileText size={17} className="absolute left-3.5 top-3.5 text-gray-400 dark:text-zinc-500" />
                                            <input
                                                type="text"
                                                value={formData.invoice_number}
                                                onChange={e => setFormData({ ...formData, invoice_number: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white font-semibold text-sm focus:border-blue-500 outline-none"
                                                placeholder="INV-2024-001"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider">
                                            {t('lbl_date')}
                                        </label>
                                        <div className="relative">
                                            <Calendar size={17} className="absolute left-3.5 top-3.5 text-gray-400 dark:text-zinc-500" />
                                            <input
                                                type="date"
                                                value={formData.invoice_date}
                                                onChange={e => setFormData({ ...formData, invoice_date: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white font-semibold text-sm focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Amounts Studio: HT / TVA / TTC */}
                                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-200/80 dark:border-zinc-700/80 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                                            <Coins size={15} className="text-emerald-600 dark:text-emerald-400" />
                                            Ventilation Comptable ({currency})
                                        </span>
                                        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                                            Devise active : {currency}
                                        </span>
                                    </div>

                                    {/* 3 Columns: HT, TVA, TTC */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {/* Montant HT */}
                                        <div className="space-y-1">
                                            <label className="block text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase">
                                                Montant HT
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.subtotal}
                                                onChange={e => setFormData({ ...formData, subtotal: e.target.value })}
                                                placeholder="0.00"
                                                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                            />
                                        </div>

                                        {/* Taux & Montant TVA */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <label className="block text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase">
                                                    TVA
                                                </label>
                                                <select
                                                    value={formData.tax_rate}
                                                    onChange={e => setFormData({ ...formData, tax_rate: e.target.value })}
                                                    className="text-[10px] bg-transparent font-bold text-blue-600 dark:text-blue-400 outline-none cursor-pointer"
                                                >
                                                    <option value="20">20% (Std)</option>
                                                    <option value="14">14%</option>
                                                    <option value="10">10%</option>
                                                    <option value="7">7%</option>
                                                    <option value="0">0%</option>
                                                </select>
                                            </div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.tax_amount}
                                                onChange={e => setFormData({ ...formData, tax_amount: e.target.value })}
                                                placeholder="0.00"
                                                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                            />
                                        </div>

                                        {/* Montant TTC */}
                                        <div className="space-y-1">
                                            <label className="block text-[11px] font-bold text-gray-700 dark:text-zinc-200 uppercase">
                                                Total TTC
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.total_amount}
                                                onChange={e => setFormData({ ...formData, total_amount: e.target.value })}
                                                placeholder="0.00"
                                                className="w-full px-3 py-2 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-sm font-extrabold text-blue-700 dark:text-blue-300 outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Auto-Calculate Buttons */}
                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={handleCalculateFromHT}
                                            className="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-200 rounded-lg border border-gray-200 dark:border-zinc-700 transition-colors"
                                        >
                                            Calculer TTC = HT + TVA ({formData.tax_rate}%)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCalculateFromTTC}
                                            className="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-200 rounded-lg border border-gray-200 dark:border-zinc-700 transition-colors"
                                        >
                                            Déduire HT depuis TTC
                                        </button>
                                    </div>

                                    {calcNotice && (
                                        <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                                            ✓ {calcNotice}
                                        </p>
                                    )}
                                </div>

                                {/* Category & Status */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider">
                                            {t('lbl_category')}
                                        </label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-gray-50/80 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white font-semibold text-sm focus:border-blue-500 outline-none"
                                        >
                                            <option value="Software">Logiciels & Cloud</option>
                                            <option value="Office Supplies">Fournitures de Bureau</option>
                                            <option value="Transport">Transport & Déplacement</option>
                                            <option value="Meals">Repas & Réceptions</option>
                                            <option value="Services">Services & Prestations</option>
                                            <option value="Other">Autre</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wider">
                                            Statut de Validation
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-gray-50/80 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white font-semibold text-sm focus:border-blue-500 outline-none"
                                        >
                                            <option value="Completed">✓ Validé & Clôturé</option>
                                            <option value="Needs Review">⚠ À Vérifier (En attente)</option>
                                            <option value="Rejected">✕ Rejeté (Non-facture)</option>
                                        </select>
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* TAB 2: Piste d'Audit & Traçabilité (Audit Trail) */}
                        {activeTab === 'audit' && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                                    <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                                        <ShieldCheck size={16} />
                                        <span>Traçabilité et Conformité Comptable</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1 leading-relaxed">
                                        Historique horodaté des opérations d'ingestion, d'extraction OCR et de validation humaine (Human-in-the-Loop).
                                    </p>
                                </div>

                                {/* Vertical Timeline */}
                                <div className="relative border-l-2 border-blue-500/30 ml-4 space-y-6 pl-6 py-2">
                                    {/* Step 1: Upload */}
                                    <div className="relative group">
                                        <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-blue-600 border-2 border-white dark:border-zinc-900 shadow-sm" />
                                        <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <span>1. Ingestion Documentaire & Stockage</span>
                                            <span className="text-[10px] text-gray-400 font-normal">
                                                {file.upload_time ? new Date(file.upload_time).toLocaleString('fr-FR') : 'Horodaté'}
                                            </span>
                                        </h4>
                                        <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">
                                            Fichier reçu ({file.filename}) avec vérification d'intégrité et affectation de l'ID unique <code>{file.id.slice(0, 8)}...</code>.
                                        </p>
                                    </div>

                                    {/* Step 2: OCR */}
                                    <div className="relative group">
                                        <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white dark:border-zinc-900 shadow-sm" />
                                        <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <span>2. Prétraitement & Moteur OCR Tesseract</span>
                                            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-mono">
                                                ~0.75s
                                            </span>
                                        </h4>
                                        <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">
                                            Extraction optique des caractères sur toutes les pages. Détection de texte, normalisation des espaces et nettoyage numérique.
                                        </p>
                                    </div>

                                    {/* Step 3: Classification */}
                                    <div className="relative group">
                                        <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white dark:border-zinc-900 shadow-sm" />
                                        <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <span>3. Classification Sémantique du Document</span>
                                            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                                                {file.status === 'Rejected' ? 'Document Non-Facture' : 'Facture Comptable (100%)'}
                                            </span>
                                        </h4>
                                        <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">
                                            Analyse des descripteurs comptables (facture, invoice, bill, rib, ice, total, tva). Validation de recevabilité financière.
                                        </p>
                                    </div>

                                    {/* Step 4: Extraction */}
                                    <div className="relative group">
                                        <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-purple-600 border-2 border-white dark:border-zinc-900 shadow-sm" />
                                        <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <span>4. Extraction Hybride des Entités (Regex + Spatial)</span>
                                            <span className="text-[10px] bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded font-bold">
                                                Confiance : {confidencePct}%
                                            </span>
                                        </h4>
                                        <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">
                                            Repérage des ancres textuelles pour le Total TTC, le Montant HT, la TVA, le numéro de facture et la raison sociale de l'émetteur.
                                        </p>
                                    </div>

                                    {/* Step 5: RAG */}
                                    <div className="relative group">
                                        <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-900 shadow-sm" />
                                        <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <span>5. Indexation Vectorielle pour Copilote RAG</span>
                                            <span className="text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-mono">
                                                Chunks sémantiques
                                            </span>
                                        </h4>
                                        <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">
                                            Découpage du texte en segments vectoriels stockés dans la table PostgreSQL/SQLite pour interrogation en langage naturel via l'Assistant IA.
                                        </p>
                                    </div>

                                    {/* Step 6: Human in the loop */}
                                    <div className="relative group">
                                        <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-amber-500 border-2 border-white dark:border-zinc-900 shadow-sm" />
                                        <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <span>6. Supervision Humaine (Human-in-the-Loop)</span>
                                            <span className={clsx(
                                                "text-[10px] px-1.5 py-0.5 rounded font-bold",
                                                formData.status === 'Completed'
                                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                                                    : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                                            )}>
                                                {formData.status === 'Completed' ? 'Validé' : 'En Révision'}
                                            </span>
                                        </h4>
                                        <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">
                                            L'auditeur valide ou corrige les montants extraits par l'IA avant enregistrement définitif au grand livre des comptes.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="p-5 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 flex justify-between items-center transition-colors">
                        <div className="text-xs text-gray-500 dark:text-zinc-400">
                            Montant : <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(formData.total_amount || 0)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                            >
                                {t('btn_close')}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                            >
                                {saving ? t('btn_saving') : <><Save size={15} /> {t('btn_save')}</>}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
export default EditModal;
