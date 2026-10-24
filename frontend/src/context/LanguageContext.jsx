import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
    fr: {
        app_name: "Gestion Document",
        app_subtitle: "Gestion Documentaire & Comptable",
        nav_dashboard: "Tableau de Bord",
        nav_documents: "Documents",
        nav_assistant: "Copilote IA (RAG)",
        nav_categories: "Catégories",
        nav_profile: "Mon Profil",
        
        // TopBar & Actions
        search_placeholder: "Rechercher...",
        notifications_title: "Notifications",
        no_notifications: "Aucune notification pour le moment",
        clear_all_notifs: "Effacer tout",
        dark_mode: "Mode Sombre",
        light_mode: "Mode Clair",
        lang_switch: "FR / EN",

        // Dashboard
        total_spend: "Dépenses Totales",
        net_total: "Total Net",
        total_tax: "TVA & Taxes",
        pending_review: "En Attente de Vérification",
        vs_last_period: "par rapport à la période préc.",
        spending_overview: "Aperçu des Dépenses",
        monthly: "Mensuel",
        quarterly: "Trimestriel",
        yearly: "Annuel",
        vendor_breakdown: "Répartition par Fournisseur",
        recent_documents: "Factures Récentes",
        view_all: "Voir Tout",

        // Documents / FileList
        all_documents: "Tous les Documents",
        clear_history: "Effacer l'historique",
        clear_confirm: "Êtes-vous sûr de vouloir archiver et effacer l'historique de tous vos documents ?",
        clear_success: "Historique effacé avec succès.",
        no_docs_found: "Aucun document trouvé",
        no_docs_subtitle: "Déposez votre première facture ou reçu pour démarrer le traitement automatique.",
        col_type: "Type",
        col_filename: "Nom du Fichier",
        col_date: "Date",
        col_amount: "Montant",
        col_status: "Statut",
        col_action: "Action",
        show_more: "Afficher plus",
        show_less: "Réduire",

        // Status Badges
        status_completed: "Validé",
        status_review: "À Vérifier",
        status_failed: "Échoué",
        status_rejected: "Non-Facture / Rejeté",
        status_processing: "Traitement en cours...",

        // Upload Area
        drop_files_title: "Glissez vos factures et reçus ici",
        drop_files_subtitle: "Formats PDF et images acceptés (traitement rapide avec contrôle de validité).",
        click_to_browse: "Cliquez pour parcourir",

        // Edit Modal
        edit_title: "Vérifier & Modifier les Détails",
        edit_subtitle: "Vérifiez les données extraites par l'IA face au document original.",
        lbl_invoice_number: "Numéro de Facture",
        lbl_date: "Date de Facturation",
        lbl_vendor: "Fournisseur / Émetteur",
        lbl_amount: "Montant Total (TTC)",
        lbl_category: "Catégorie de Dépense",
        lbl_tags: "Mots-clés / Tags",
        btn_save: "Enregistrer les modifications",
        btn_saving: "Enregistrement...",
        btn_close: "Fermer",
        preview_unavailable: "Aperçu non disponible",
        open_file: "Ouvrir le document",

        // Categories & Bulk Actions
        search_docs: "Rechercher par nom, fournisseur ou n°...",
        filter_all: "Toutes",
        bulk_move: "Attribuer la catégorie",
        bulk_delete: "Supprimer la sélection",
        btn_export: "Exporter les Données",

        // AI Copilot (RAG)
        ai_title: "Assistant Factures IA",
        ai_badge: "Moteur RAG",
        ai_subtitle: "Recherche sémantique et synthèse sur toutes les factures de l'entreprise",
        btn_sync_kb: "Synchroniser la Base IA",
        lbl_syncing: "Indexation...",
        lbl_synced: "Documents indexés avec succès.",
        chat_placeholder: "Posez une question (ex: Quel est le total des dépenses en logiciels ?)",
        btn_send: "Envoyer",
        sources_found: "Factures Sources",

        // Profile Extended
        profile_title: "Paramètres du Profil",
        profile_subtitle: "Gérez vos informations personnelles, sécurité et rôle organisationnel",
        btn_logout: "Se Déconnecter",
        lbl_first_name: "Prénom",
        lbl_last_name: "Nom",
        lbl_full_name: "Nom Complet",
        lbl_email: "Adresse E-mail",
        lbl_phone: "Numéro de Téléphone",
        lbl_role: "Rôle & Permissions",
        lbl_current_password: "Mot de Passe Actuel",
        lbl_new_password: "Nouveau Mot de Passe",
        lbl_confirm_password: "Confirmer le Nouveau Mot de Passe",
        lbl_security: "Sécurité & Mot de Passe",
        lbl_company_account: "Compte Entreprise",
        lbl_company_name: "Nom de l'Entreprise",
        lbl_company_id: "Identifiant Société",
        lbl_account_status: "Statut du Compte",
        lbl_status_active: "Actif & Vérifié",
        btn_save_profile: "Enregistrer les Modifications",
        msg_profile_saved: "Profil mis à jour avec succès !",
        msg_pw_mismatch: "Les nouveaux mots de passe ne correspondent pas.",
        profile_personal_info: "Informations Personnelles",
        profile_roles_title: "Rôle & Niveau d'Accès",
        profile_security_title: "Sécurité du Compte",
        profile_workspace_title: "Espace de Travail & Organisation",
        profile_preferences: "Préférences d'Affichage",
        copied_to_clipboard: "Identifiant copié !",
        role_admin: "Administrateur",
        role_admin_desc: "Accès complet, configuration, validation comptable & copilote RAG",
        role_accountant: "Comptable",
        role_accountant_desc: "Gestion des factures, vérification des taxes et export de données",
        role_student: "Étudiant / Chercheur",
        role_student_desc: "Mode projet PFE, analyse documentaire et requêtes IA avancées",
        role_viewer: "Observateur",
        role_viewer_desc: "Consultation en lecture seule des documents et tableaux de bord",

        // Dashboard extra
        revenue_spend: "Dépenses (Flux Financier)",
        quick_upload: "Téléversement Rapide",
        quick_upload_desc: "Glissez vos factures ici ou parcourez vos dossiers immédiatement.",
        upload_new_file: "Ajouter un Fichier",
        share_report: "Partager le Rapport",
        top_vendors: "Principaux Fournisseurs",
        no_spending_data: "Aucune donnée de dépense pour cette période",
        no_recent_activity: "Aucune activité récente",
        est_tax: "TVA Estimée",
        action_needed: "Action Requise",
        all_good: "Tout est Validé",
        excl_tax: "Hors Taxes",

        // Auth
        login_title: "Bienvenue",
        login_subtitle: "Connectez-vous à votre espace Gestion Document",
        login_email: "Adresse E-mail",
        login_password: "Mot de passe",
        login_btn: "Se Connecter",
        login_loading: "Connexion en cours...",
        login_no_account: "Vous n'avez pas de compte ?",
        login_create_company: "Créer un Compte Entreprise",
        signup_title: "Inscription Gratuite",
        signup_subtitle: "Créez votre compte Gestion Document étudiant / PFE",
        signup_company: "Nom de l'Entreprise / Projet",
        signup_fullname: "Nom Complet",
        signup_work_email: "Email Professionnel",
        signup_btn: "Créer mon Compte",
        signup_loading: "Création du compte...",
        signup_has_account: "Vous avez déjà un compte ?",
        signup_signin: "Se Connecter"
    },
    en: {
        app_name: "Gestion Document",
        app_subtitle: "Intelligent Document Management",
        nav_dashboard: "Dashboard",
        nav_documents: "Documents",
        nav_assistant: "AI Copilot (RAG)",
        nav_categories: "Categories",
        nav_profile: "My Profile",

        // TopBar & Actions
        search_placeholder: "Search...",
        notifications_title: "Notifications",
        no_notifications: "No notifications right now",
        clear_all_notifs: "Clear all",
        dark_mode: "Dark Mode",
        light_mode: "Light Mode",
        lang_switch: "FR / EN",

        // Dashboard
        total_spend: "Total Spend",
        net_total: "Net Total",
        total_tax: "Total Taxes & VAT",
        pending_review: "Pending Review",
        vs_last_period: "vs last period",
        spending_overview: "Spending Overview",
        monthly: "Monthly",
        quarterly: "Quarterly",
        yearly: "Yearly",
        vendor_breakdown: "Vendor Breakdown",
        recent_documents: "Recent Invoices",
        view_all: "View All",
        revenue_spend: "Spend Revenue Trend",
        quick_upload: "Quick Upload",
        quick_upload_desc: "Drag and drop invoices here or browse files immediately.",
        upload_new_file: "Upload New File",
        share_report: "Share Report",
        top_vendors: "Top Vendors",
        no_spending_data: "No spending data for this period",
        no_recent_activity: "No recent activity",
        est_tax: "Est. Tax",
        action_needed: "Action Needed",
        all_good: "All Good",
        excl_tax: "Excl. Tax",

        // Documents / FileList
        all_documents: "All Documents",
        clear_history: "Clear History",
        clear_confirm: "Are you sure you want to archive and clear all documents for your company?",
        clear_success: "History cleared successfully.",
        no_docs_found: "No documents found",
        no_docs_subtitle: "Upload your first invoice or receipt to verify automated accounting.",
        col_type: "Type",
        col_filename: "File Name",
        col_date: "Date",
        col_amount: "Amount",
        col_status: "Status",
        col_action: "Action",
        show_more: "Show more",
        show_less: "Show less",

        // Status Badges
        status_completed: "Completed",
        status_review: "Review Needed",
        status_failed: "Failed",
        status_rejected: "Non-Invoice / Rejected",
        status_processing: "Processing...",

        // Upload Area
        drop_files_title: "Drop invoices and receipts here",
        drop_files_subtitle: "PDF and images accepted (fast validation and accounting extraction).",
        click_to_browse: "Click to browse",

        // Edit Modal
        edit_title: "Verify & Edit Details",
        edit_subtitle: "Inspect AI-extracted fields against the original document side-by-side.",
        lbl_invoice_number: "Invoice Number",
        lbl_date: "Invoice Date",
        lbl_vendor: "Vendor / Merchant",
        lbl_amount: "Total Amount",
        lbl_category: "Expense Category",
        lbl_tags: "Tags",
        btn_save: "Save Changes",
        btn_saving: "Saving...",
        btn_close: "Close",
        preview_unavailable: "Preview unavailable",
        open_file: "Open document",

        // Categories & Bulk Actions
        search_docs: "Search by filename, vendor, or invoice #...",
        filter_all: "All",
        bulk_move: "Assign Category",
        bulk_delete: "Delete Selected",
        btn_export: "Export Data",

        // AI Copilot (RAG)
        ai_title: "AI Invoice Copilot",
        ai_badge: "RAG Engine",
        ai_subtitle: "Semantic retrieval & synthesis over all company invoices",
        btn_sync_kb: "Sync Knowledge Base",
        lbl_syncing: "Indexing...",
        lbl_synced: "Documents indexed successfully.",
        chat_placeholder: "Ask a question (e.g. What is our total spend on software?)",
        btn_send: "Send",
        sources_found: "Source Invoices",

        // Profile Extended
        profile_title: "Profile Settings",
        profile_subtitle: "Manage your personal credentials, security, and organizational role",
        btn_logout: "Sign Out",
        lbl_first_name: "First Name",
        lbl_last_name: "Last Name",
        lbl_full_name: "Full Name",
        lbl_email: "Email Address",
        lbl_phone: "Phone Number",
        lbl_role: "Role & Permissions",
        lbl_current_password: "Current Password",
        lbl_new_password: "New Password",
        lbl_confirm_password: "Confirm New Password",
        lbl_security: "Security & Password",
        lbl_company_account: "Company Account",
        lbl_company_name: "Company Name",
        lbl_company_id: "Company ID",
        lbl_account_status: "Account Status",
        lbl_status_active: "Active & Verified",
        btn_save_profile: "Save Profile Changes",
        msg_profile_saved: "Profile updated successfully!",
        msg_pw_mismatch: "New passwords do not match.",
        profile_personal_info: "Personal Information",
        profile_roles_title: "Role & Access Level",
        profile_security_title: "Account Security",
        profile_workspace_title: "Workspace & Organization",
        profile_preferences: "Display Preferences",
        copied_to_clipboard: "Workspace ID copied!",
        role_admin: "Administrator",
        role_admin_desc: "Full access, system settings, accounting validation & RAG Copilot",
        role_accountant: "Accountant",
        role_accountant_desc: "Invoice verification, tax rate validation and batch data export",
        role_student: "Student / Researcher",
        role_student_desc: "Master thesis mode, document inspection and AI prompt testing",
        role_viewer: "Observer",
        role_viewer_desc: "Read-only access to documents, metrics and financial reports",

        // Auth
        login_title: "Welcome Back",
        login_subtitle: "Sign in to your accounting dashboard",
        login_email: "Email address",
        login_password: "Password",
        login_btn: "Sign In",
        login_loading: "Signing In...",
        login_no_account: "Don't have an account?",
        login_create_company: "Create Company Account",
        signup_title: "Start for Free",
        signup_subtitle: "Create your student / enterprise account",
        signup_company: "Company / Project Name",
        signup_fullname: "Full Name",
        signup_work_email: "Work Email",
        signup_btn: "Create Account",
        signup_loading: "Creating Account...",
        signup_has_account: "Already have an account?",
        signup_signin: "Sign In"
    }
};

const LanguageContext = createContext({
    lang: 'fr',
    setLang: () => {},
    toggleLang: () => {},
    t: (key) => key
});

export const LanguageProvider = ({ children }) => {
    const [lang, setLang] = useState(() => {
        return localStorage.getItem('app_lang') || 'fr'; // Defaults to French for Morocco Master
    });

    useEffect(() => {
        localStorage.setItem('app_lang', lang);
    }, [lang]);

    const toggleLang = () => {
        setLang(prev => (prev === 'fr' ? 'en' : 'fr'));
    };

    const t = (key) => {
        if (!translations[lang] || translations[lang][key] === undefined) {
            return translations.en[key] || key;
        }
        return translations[lang][key];
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
