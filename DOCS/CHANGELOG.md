# Journal des Versions & Décisions Techniques (Changelog)
**Projet** : Gestion Document (Master PFE Maroc)  
**Auteur & Concepteur** : Hamza Haddou (`haddouhamza2000@gmail.com`)  
**Date** : Octobre 2026  

---

## 1. Objectif Global du Projet
L'objectif du projet est de concevoir et développer une plateforme d'automatisation documentaire et comptable (**Gestion Document**) capable :
- D'ingérer des factures PDF personnalisées pour différentes entreprises.
- D'extraire automatiquement les informations clés (Total TTC, HT, TVA, Date, N° Facture, Fournisseur) via un pipeline hybride (OCR Tesseract + Regex sémantiques + analyse spatiale Layout).
- D'interroger l'ensemble des documents en langage naturel grâce à un moteur **RAG (Retrieval-Augmented Generation)**.
- D'impliquer l'humain dans la boucle (**Human-in-the-Loop**) pour valider les incertitudes de l'extraction avant clôture comptable.
- D'offrir une démonstration complète et rigoureuse pour la soutenance de Master PFE.

---

## 2. Synthèse Chronologique des Problèmes Rencontrés & Résolus

### A. Problème d'opérateur manquant dans Torchvision
- **Symptôme** : Erreur `operator torchvision::nms does not exist` lors de l'analyse de PDF.
- **Cause** : Binaire torchvision compilé sans les opérateurs CPU nécessaires à la détection de boîtes englobantes.
- **Résolution** : Mise à niveau de torchvision vers `0.29.1+cpu` pour Windows.

### B. Optimisation du pipeline d'extraction (Désactivation Donut au profit de l'Hybride)
- **Symptôme** : Les factures restaient bloquées en `Uploading` ou `Processing` pendant plusieurs minutes.
- **Cause** : Le modèle Transformer `naver-clova-ix/donut-base-finetuned-cord-v2` (1.2 Go) tentait de se télécharger sans authentification Hugging Face à chaque fichier.
- **Résolution** : Désactivation par défaut de Donut (`ENABLE_DONUT=false`) au profit du pipeline hybride ultra-rapide (< 1 seconde) Regex + Layout.

### C. Mauvaise classification des documents non comptables (CVs / Textes)
- **Symptôme** : `Fake-Resume.pdf` était reconnu par erreur comme une facture.
- **Cause** : Recherche de sous-chaînes partielles sans limites de mots (`"ht"` dans `growth`, `"ice"` dans `service`).
- **Résolution** : Refonte de la fonction `classify_document` dans `backend/tasks.py` avec des expressions régulières à frontières de mots strictes `\b`. Les CVs sont immédiatement rejetés avec un statut `Rejected` et 95% de certitude.

### D. Mode Sombre bloqué / Ne basculant pas en Mode Clair
- **Symptôme** : Cliquer sur l'icône soleil/lune laissait l'écran sombre.
- **Cause** : Tailwind CSS v4 utilise par défaut la directive média système `prefers-color-scheme` plutôt que la classe `.dark`. De plus, des styles sombres étaient codés en dur (`bg-slate-900`, `bg-black`).
- **Résolution** :
  - Ajout de `@custom-variant dark (&:where(.dark, .dark *));` dans `frontend/src/index.css`.
  - Nettoyage des composants (`Sidebar.jsx`, `TopBar.jsx`, `Profile.jsx`, `AIAssistant.jsx`) avec des classes adaptatives `bg-white dark:bg-zinc-900`.
  - Synchronisation de la classe `dark` sur `<html>` et `<body>` via `ThemeContext.jsx`.

### E. Rebranding de la Plateforme en "Gestion Document"
- Remplacement des anciens noms (*DocuProcess-AI*, *GestionDoc AI*) par **Gestion Document** sur l'ensemble de l'application (`index.html`, `Sidebar.jsx`, `LanguageContext.jsx`, `AIAssistant.jsx`, `start_project.bat`).
- Sous-titre officiel : *"Gestion Documentaire & Comptable"* (FR) / *"Intelligent Document Management"* (EN).

### F. Refonte Complète de la Vue Profil (`Profile.jsx`)
- **Problème initial** : La carte profil était étroite et isolée.
- **Nouvelle architecture** :
  - Mise en page large (`max-w-6xl`) structurée en tableau de bord complet.
  - Formulaire complet : Prénom, Nom, Adresse e-mail (vérifiée), Numéro de téléphone.
  - Sélecteur de rôle interactif (Administrateur, Comptable, Étudiant, Observateur).
  - Gestion sécurisée des mots de passe avec contrôle de l'ancien mot de passe.
  - Informations de l'espace de travail.
  - Sélecteurs intégrés pour changer de thème et de langue en un clic.
  - Persistance backend via `UserModel.phone` et `PATCH /auth/me`.

### G. Ajout du Système Multi-Devises (MAD, EUR, USD)
- Création de `CurrencyContext.jsx` avec le Dirham marocain (**MAD / DH**) configuré par défaut.
- Formatage automatique des montants sur le tableau de bord, la liste des documents, les catégories et la modale d'édition.
- Sélecteur de devise rapide dans la barre supérieure (`TopBar.jsx`).

### H. Fiche Comptable Complète (HT, TVA, TTC) & Piste d'Audit
- Dans `EditModal.jsx`, découpage en 2 onglets :
  - **Écritures Comptables** : Ventilation financière HT, TVA (20%, 14%, 10%, 7%, 0%), TTC avec calculs automatiques en un clic, et score de confiance de l'extraction.
  - **Piste d'Audit** : Historique visuel en 6 étapes (Ingestion -> OCR -> Classification -> Extraction -> Indexation RAG -> Validation Humaine) pour la traçabilité comptable et la soutenance de PFE.

### I. Exportation Comptable Professionnelle
- Prise en charge des formats Excel multi-feuilles (`.xlsx`), CSV (`.csv`) et JSON (`.json`) dans `ExportModal.jsx`.
- Boutons d'export direct dans `FileList.jsx` et `Categories.jsx`.

### J. Conteneurisation Docker & Scripts de Lancement 1-Clic
- Configuration complète de `docker-compose.yml` orchestrant 4 services : `docuprocess_postgres`, `docuprocess_api`, `docuprocess_worker`, `docuprocess_frontend`.
- Pilote de base de données PostgreSQL unifié via `psycopg2`.
- Création des scripts d'automatisation Windows `start_docker.bat` et `stop_docker.bat`.

---

## 3. Guide de Démarrage Rapide

### Mode Docker (Production) :
```cmd
start_docker.bat
```
Ou manuellement :
```bash
docker-compose up -d
```

### Mode Développement Local :
```cmd
start_project.bat
```
Lance automatiquement :
1. **API Backend FastAPI** : `http://127.0.0.1:8000` (documentation Swagger à `/docs`).
2. **Worker Asynchrone Huey** : Pour le traitement OCR en tâche de fond.
3. **Frontend Vite + React** : `http://localhost:5173`.
