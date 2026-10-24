# Gestion Document — Frontend Client

Application web monopage (SPA) construite avec React 19 et Vite 7 pour la plateforme **Gestion Document**.

## 🚀 Technologies Utilisées
- **Framework & Rendu** : React 19
- **Bundler & Build Tool** : Vite 7
- **Système de Design & CSS** : Tailwind CSS v4
- **Composants d'Icônes** : Lucide React
- **Animations & Transitions** : Framer Motion
- **Visualisation Financière** : Recharts
- **Gestion des Dates & Formats** : date-fns

## 📦 Structure des Composants
- `components/Dashboard.jsx` : Métriques clés, graphiques de dépenses et ventilation par catégorie.
- `components/FileList.jsx` & `FileItem.jsx` : Gestion des factures, états de traitement et actions.
- `components/EditModal.jsx` : Fiche comptable complète (HT, TVA, TTC) et piste d'audit en 6 étapes.
- `components/ExportModal.jsx` : Exportation comptable vers Excel (.xlsx), CSV et JSON.
- `components/AIAssistant.jsx` : Interface de requête en langage naturel connectée au moteur RAG.
- `components/Profile.jsx` : Tableau de bord utilisateur, gestion du rôle RBAC et sécurité.

## 🛠️ Démarrage Local
```bash
npm install
npm run dev
```
L'application est accessible par défaut sur `http://localhost:5173`.
