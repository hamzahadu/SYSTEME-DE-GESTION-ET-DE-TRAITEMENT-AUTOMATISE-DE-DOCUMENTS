import React, { useState } from 'react';
import { Send, Bot, Sparkles, FileText, ArrowRight, RefreshCw, CheckCircle2, MessageSquare } from 'lucide-react';
import axios from 'axios';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = 'http://127.0.0.1:8000';

export const AIAssistant = ({ onOpenDocument }) => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [reindexing, setReindexing] = useState(false);
    const [reindexSuccess, setReindexSuccess] = useState('');
    const [messages, setMessages] = useState([
        {
            sender: 'ai',
            text: "Bonjour ! Je suis votre assistant comptable Gestion Document. Posez-moi n'importe quelle question sur vos factures, vos dépenses par fournisseur ou vos taxes (en français ou en anglais).",
            sources: []
        }
    ]);

    const suggestedPrompts = [
        "Combien avons-nous dépensé au total ?",
        "Show all software and subscription expenses",
        "Quelles sont les factures nécessitant une vérification ?",
        "List all invoices from vendor SuperStore"
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
                    text: "Désolé, une erreur est survenue lors de la recherche des documents. Veuillez réessayer.",
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
            setReindexSuccess(`Indexé ${res.data.indexed_documents} documents avec succès.`);
            setTimeout(() => setReindexSuccess(''), 4000);
        } catch (err) {
            console.error("Reindex error", err);
        } finally {
            setReindexing(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden transition-colors">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600 dark:bg-white text-white dark:text-black flex items-center justify-center shadow-lg shadow-blue-600/20 dark:shadow-white/10">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            Copilote Gestion Document <span className="text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/40">RAG Engine</span>
                        </h2>
                        <p className="text-xs text-gray-400 dark:text-zinc-400">Recherche sémantique sur l'ensemble des documents financiers et données OCR</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {reindexSuccess && (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/40">
                            <CheckCircle2 size={14} /> {reindexSuccess}
                        </span>
                    )}
                    <button
                        onClick={handleReindex}
                        disabled={reindexing}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-300 hover:text-black dark:hover:text-white bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-xl transition-all border border-gray-200 dark:border-zinc-700"
                        title="Recompute semantic vector embeddings for all documents"
                    >
                        <RefreshCw size={14} className={clsx(reindexing && "animate-spin")} />
                        {reindexing ? "Indexation..." : "Synchroniser Base RAG"}
                    </button>
                </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FAFAFA] dark:bg-zinc-950/60 transition-colors">
                {messages.map((msg, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={clsx("flex gap-3", msg.sender === 'user' ? "justify-end" : "justify-start")}
                    >
                        {msg.sender === 'ai' && (
                            <div className="w-8 h-8 rounded-xl bg-blue-600 dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0 mt-1 shadow-sm">
                                <Bot size={16} />
                            </div>
                        )}

                        <div className={clsx(
                            "max-w-2xl rounded-2xl p-5 shadow-sm transition-colors",
                            msg.sender === 'user'
                                ? "bg-blue-600 dark:bg-white text-white dark:text-black font-medium text-sm"
                                : "bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 border border-gray-100 dark:border-zinc-800 text-sm leading-relaxed"
                        )}>
                            <p className="whitespace-pre-line">{msg.text}</p>

                            {/* Cited Sources */}
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                        Source Invoices ({msg.sources.length})
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {msg.sources.map((src, sIdx) => (
                                            <div
                                                key={sIdx}
                                                onClick={() => onOpenDocument && onOpenDocument(src.document_id)}
                                                className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 border border-gray-100 dark:border-zinc-700 hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer group"
                                            >
                                                <div className="min-w-0 pr-2">
                                                    <p className="text-xs font-bold text-gray-800 dark:text-zinc-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                        {src.filename}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 dark:text-zinc-400 truncate">
                                                        {src.vendor_name} {src.total_amount ? `• $${src.total_amount.toFixed(2)}` : ''}
                                                    </p>
                                                </div>
                                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 px-2 py-0.5 rounded shadow-xs shrink-0">
                                                    {Math.round((src.relevance_score || 1) * 100)}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}

                {loading && (
                    <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0 animate-pulse">
                            <Bot size={16} />
                        </div>
                        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl px-5 py-4 text-xs font-semibold text-gray-400 dark:text-zinc-400 flex items-center gap-2 shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                            Recherche des passages sémantiques & synthèse IA...
                        </div>
                    </div>
                )}
            </div>

            {/* Suggested Prompts */}
            {messages.length <= 2 && (
                <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-t border-gray-50 dark:border-zinc-800 flex gap-2 overflow-x-auto transition-colors">
                    {suggestedPrompts.map((prompt, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSend(prompt)}
                            className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-xs text-gray-600 dark:text-zinc-300 font-medium border border-gray-100 dark:border-zinc-700 transition-colors"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Bar */}
            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 transition-colors">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                    className="flex gap-2"
                >
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Posez une question sur vos factures (ex: total des dépenses en logiciels, factures récentes...)"
                        className="flex-1 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl px-5 py-3.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!query.trim() || loading}
                        className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-40 transition-all"
                    >
                        <span>Envoyer</span>
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
};
