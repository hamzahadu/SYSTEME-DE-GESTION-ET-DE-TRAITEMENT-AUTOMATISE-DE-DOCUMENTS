import React, { useState } from 'react';
import {
    Send, FileSearch, FileText, RefreshCw, CheckCircle2,
    Coins, Building2, AlertCircle, User, ArrowUpRight, Check
} from 'lucide-react';
import axios from 'axios';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';

const API_URL = 'http://127.0.0.1:8000';

export const AIAssistant = ({ onOpenDocument }) => {
    const { formatCurrency } = useCurrency();
    const { t, lang } = useLanguage();
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [reindexing, setReindexing] = useState(false);
    const [reindexSuccess, setReindexSuccess] = useState('');
    const [messages, setMessages] = useState([
        {
            sender: 'ai',
            text: lang === 'fr'
                ? "Bonjour ! Je suis votre copilote comptable Gestion Document. Posez-moi n'importe quelle question sur vos factures, vos dépenses par fournisseur, vos taxes ou vos anomalies de facturation."
                : "Hello! I am your Gestion Document accounting copilot. Ask me anything about your invoices, vendor expenses, tax rates, or billing discrepancies.",
            sources: []
        }
    ]);

    const suggestedPrompts = [
        {
            icon: Coins,
            label: lang === 'fr' ? "Dépenses Totales" : "Total Spend",
            prompt: lang === 'fr' ? "Combien avons-nous dépensé au total ?" : "How much have we spent in total?"
        },
        {
            icon: Building2,
            label: lang === 'fr' ? "Abonnements & Logiciels" : "Software & Subs",
            prompt: lang === 'fr' ? "Show all software and subscription expenses" : "Show all software and subscription expenses"
        },
        {
            icon: AlertCircle,
            label: lang === 'fr' ? "Factures à Vérifier" : "Needs Review",
            prompt: lang === 'fr' ? "Quelles sont les factures nécessitant une vérification ?" : "Which invoices require human verification?"
        },
        {
            icon: FileText,
            label: lang === 'fr' ? "Factures par Fournisseur" : "Vendor Invoices",
            prompt: lang === 'fr' ? "List all invoices from vendor SuperStore" : "List all invoices from vendor SuperStore"
        }
    ];

    const handleSend = async (questionText) => {
        const textToSend = questionText || query;
        if (!textToSend.trim()) return;

        const userMsg = { sender: 'user', text: textToSend };
        setMessages(prev => [...prev, userMsg]);
        setQuery('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${API_URL}/rag/query`,
                { query: textToSend },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const aiMsg = {
                sender: 'ai',
                text: res.data.answer,
                sources: res.data.sources || []
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("RAG Query failed", error);
            setMessages(prev => [
                ...prev,
                {
                    sender: 'ai',
                    text: lang === 'fr'
                        ? "Désolé, une erreur est survenue lors de la recherche des documents. Veuillez vérifier que le serveur backend et la base vectorielle sont actifs."
                        : "Sorry, an error occurred while searching documents. Please check backend connection and retry.",
                    sources: []
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleReindex = async () => {
        setReindexing(true);
        setReindexSuccess('');
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${API_URL}/rag/reindex`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const count = res.data.indexed_documents ?? 0;
            setReindexSuccess(
                lang === 'fr'
                    ? `Indexé ${count} document${count > 1 ? 's' : ''} avec succès.`
                    : `Successfully indexed ${count} document${count > 1 ? 's' : ''}.`
            );
            setTimeout(() => setReindexSuccess(''), 4000);
        } catch (err) {
            console.error("Reindex error", err);
        } finally {
            setReindexing(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-130px)] w-full bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-200/80 dark:border-zinc-800 overflow-hidden transition-colors">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-zinc-900 transition-colors shrink-0">
                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-blue-600 dark:bg-zinc-800 text-white dark:text-blue-400 flex items-center justify-center shadow-lg shadow-blue-600/20 dark:shadow-none border border-blue-500/20 dark:border-zinc-700">
                        <FileSearch size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">
                                Copilote Gestion Document
                            </h2>
                            <span className="text-xs bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/50">
                                Moteur RAG & Vectoriel
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                            {lang === 'fr'
                                ? "Recherche sémantique & extraction analytique sur l'ensemble de vos factures et pièces comptables"
                                : "Semantic retrieval & analytical extraction over all company invoices and receipts"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {reindexSuccess && (
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 animate-in fade-in duration-200">
                            <CheckCircle2 size={15} /> {reindexSuccess}
                        </span>
                    )}
                    <button
                        onClick={handleReindex}
                        disabled={reindexing}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-gray-700 dark:text-zinc-200 hover:text-black dark:hover:text-white bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-xl transition-all border border-gray-200 dark:border-zinc-700 shadow-2xs disabled:opacity-50"
                        title="Recompute semantic vector embeddings for all documents"
                    >
                        <RefreshCw size={14} className={clsx(reindexing && "animate-spin")} />
                        <span>{reindexing ? (lang === 'fr' ? "Indexation..." : "Indexing...") : (lang === 'fr' ? "Synchroniser Base RAG" : "Sync RAG Base")}</span>
                    </button>
                </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-[#FAFAFA] dark:bg-zinc-950/50 transition-colors">
                {/* Expansive Suggested Prompts when single welcome message */}
                {messages.length === 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="p-6 md:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 shadow-sm space-y-4"
                    >
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                {lang === 'fr' ? "Requêtes Fréquentes & Raccourcis" : "Popular Accounting Queries"}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                                {lang === 'fr'
                                    ? "Sélectionnez une requête pour interroger directement le moteur d'extraction documentaire :"
                                    : "Click a suggested question to query the semantic accounting engine:"}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                            {suggestedPrompts.map((item, idx) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleSend(item.prompt)}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/80 dark:bg-zinc-800/60 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 border border-gray-200/80 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all text-left group shadow-2xs"
                                    >
                                        <div className="flex items-center gap-3.5 min-w-0 pr-2">
                                            <div className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                <Icon size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {item.label}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-zinc-400 truncate mt-0.5">
                                                    "{item.prompt}"
                                                </p>
                                            </div>
                                        </div>
                                        <ArrowUpRight size={16} className="text-gray-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Message stream */}
                {messages.map((msg, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={clsx(
                            "flex gap-3.5",
                            msg.sender === 'user' ? "justify-end" : "justify-start"
                        )}
                    >
                        {msg.sender === 'ai' && (
                            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-zinc-700 flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                                <FileSearch size={18} />
                            </div>
                        )}

                        <div className={clsx(
                            "rounded-2xl p-5 md:p-6 shadow-sm transition-colors",
                            msg.sender === 'user'
                                ? "max-w-xl lg:max-w-2xl bg-blue-600 dark:bg-blue-600 text-white font-medium text-sm"
                                : "w-full max-w-4xl lg:max-w-5xl bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 border border-gray-200/80 dark:border-zinc-800 text-sm leading-relaxed"
                        )}>
                            <p className="whitespace-pre-line text-[13.5px] leading-relaxed">{msg.text}</p>

                            {/* Cited Sources */}
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-zinc-800">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <FileText size={14} className="text-blue-600 dark:text-blue-400" />
                                            {lang === 'fr' ? 'Factures Sources Citées' : 'Cited Source Invoices'} ({msg.sources.length})
                                        </p>
                                        <span className="text-[11px] text-gray-400 dark:text-zinc-500">
                                            {lang === 'fr' ? 'Cliquer pour examiner la pièce' : 'Click to inspect document'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                        {msg.sources.map((src, sIdx) => (
                                            <div
                                                key={sIdx}
                                                onClick={() => onOpenDocument && onOpenDocument(src.document_id)}
                                                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/80 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 border border-gray-200/70 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group shadow-2xs"
                                            >
                                                <div className="min-w-0 pr-2.5">
                                                    <p className="text-xs font-bold text-gray-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                        {src.filename}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate mt-0.5">
                                                        {src.vendor_name || 'Fournisseur inconnu'} {src.total_amount ? `• ${formatCurrency(src.total_amount)}` : ''}
                                                    </p>
                                                </div>
                                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/60 px-2 py-0.5 rounded-md shadow-2xs shrink-0">
                                                    {Math.round((src.relevance_score || 1) * 100)}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {msg.sender === 'user' && (
                            <div className="w-9 h-9 rounded-xl bg-blue-600 dark:bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                                <User size={16} />
                            </div>
                        )}
                    </motion.div>
                ))}

                {loading && (
                    <div className="flex gap-3.5 justify-start">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-zinc-700 flex items-center justify-center shrink-0 animate-pulse shadow-2xs">
                            <FileSearch size={18} />
                        </div>
                        <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-2xl px-5 py-4 text-xs font-semibold text-gray-500 dark:text-zinc-400 flex items-center gap-2.5 shadow-sm">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                            <span>
                                {lang === 'fr'
                                    ? "Recherche vectorielle des passages pertinents & synthèse documentaire..."
                                    : "Vector retrieval of relevant passages & document synthesis..."}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Prompts Bar (when conversation is active) */}
            {messages.length > 1 && (
                <div className="px-6 py-2.5 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 flex items-center gap-2 overflow-x-auto transition-colors shrink-0">
                    <span className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 shrink-0 uppercase tracking-wider">
                        {lang === 'fr' ? "Suggestions :" : "Suggestions:"}
                    </span>
                    {suggestedPrompts.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSend(item.prompt)}
                            className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-xs text-gray-700 dark:text-zinc-300 font-medium border border-gray-200/70 dark:border-zinc-700 transition-colors shrink-0"
                        >
                            {item.prompt}
                        </button>
                    ))}
                </div>
            )}

            {/* Expansive Input Bar */}
            <div className="p-4 md:p-5 bg-white dark:bg-zinc-900 border-t border-gray-200/80 dark:border-zinc-800 transition-colors shrink-0">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                    className="flex items-center gap-3"
                >
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={
                                lang === 'fr'
                                    ? "Posez une question sur vos factures (ex : total des dépenses en fournitures, factures récentes de SuperStore...)"
                                    : "Ask anything about your invoices (e.g. software spend this quarter, recent vendor bills...)"
                            }
                            className="w-full bg-gray-50/90 dark:bg-zinc-800/90 border border-gray-200 dark:border-zinc-700 rounded-2xl pl-5 pr-12 py-3.5 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                        />
                        <span className="hidden sm:inline-block absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-gray-200 dark:border-zinc-700">
                            ↵ Entrée
                        </span>
                    </div>

                    <button
                        type="submit"
                        disabled={!query.trim() || loading}
                        className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-40 transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
                    >
                        <span>{lang === 'fr' ? "Envoyer" : "Send"}</span>
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
};
export default AIAssistant;
