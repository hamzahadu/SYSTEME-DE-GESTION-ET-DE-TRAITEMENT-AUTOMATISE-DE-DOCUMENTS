# GESTION DOCUMENT — Architecture Système & Spécifications Techniques

> **Documentation Technique & Conception Système**  
> *Dernière mise à jour : Octobre 2026*  
> *Projet : Gestion Document (Master PFE Maroc — Automatisation Comptable & Gestion Documentaire Intelligente)*  
> *Auteur & Concepteur : Hamza Haddou (`haddouhamza2000@gmail.com`)*

---

## 1. Vue d'Ensemble & Vision du Projet
- **Nom Officiel** : **Gestion Document**
- **Sous-titres** :
  - Français : *"Gestion Documentaire & Comptable"*
  - Anglais : *"Intelligent Document Management"*
- **Contexte & Objectif** :
  - Projet de Fin d'Études (Master PFE) à finalité professionnelle.
  - Plateforme SaaS d'automatisation des écritures comptables pour PME et cabinets d'expertise comptable (marché marocain et international).
  - Paradigme central : **Human-in-the-Loop** (l'algorithme pré-extrait les métadonnées avec un indice d'incertitude, l'expert-comptable valide ou ajuste avant enregistrement définitif).

---

## 2. Pile Technologique & Environnement

### Backend & Ingestion
- **Framework REST API** : FastAPI (Python 3.12+).
- **File de Traitement Asynchrone** : Huey Task Queue (`tasks.huey`) avec workers concurrents pour l'exécution non-bloquante de l'OCR.
- **Persistance & Base de Données** :
  - SQLAlchemy ORM avec auto-migration des modèles (`database.py`, `db_models.py`, `models.py`).
  - PostgreSQL 16 en environnement de production (Docker).
  - SQLite (`docuprocess.db`) pour le développement local rapide.
- **Moteur d'Extraction OCR** : Tesseract OCR 5 (`pytesseract`, `pdf2image`, `PyPDF2`).
- **Pipeline d'Extraction Hybride** : Heuristique spatiale de mise en page (*Spatial Layout*) combinée à un ensemble d'expressions régulières contextuelles à tolérance d'erreur OCR.
- **Moteur de Recherche Sémantique (RAG)** :
  - Découpage des textes OCR en segments sémantiques (*chunking*).
  - Indexation vectorielle TF-IDF et calcul de similarité cosinus (`rag_service.py`).
  - Filtrage multi-critères par métadonnées (fournisseurs, montants, dates, statut fiscal).
- **Sécurité & Authentification** : Authentification stateless par jetons JWT Bearer, hachage robuste des mots de passe par PBKDF2 (`auth.py`).

### Frontend & Expérience Utilisateur
- **Framework Client** : React 19 + Vite 7 (Single Page Application ultra-réactive).
- **Système de Design & CSS** : Tailwind CSS v4 avec sélecteur de mode sombre adaptatif (`@custom-variant dark (&:where(.dark, .dark *));`).
- **Composants & Animations** : Lucide React (icônes professionnelles) et Framer Motion (micro-transitions fluides).
- **Visualisation de Données** : Recharts pour les graphiques financiers et ventilations analytiques.
- **Gestion des États Globaux (Contexts)** :
  - `AuthContext` : Gestion de session, stockage sécurisé du token JWT et profil utilisateur.
  - `LanguageContext` : Bilinguisme natif Français (`fr` par défaut) et Anglais (`en`).
  - `ThemeContext` : Bascule dynamique Thème Clair / Thème Sombre.
  - `CurrencyContext` : Moteur multi-devises avec prise en charge du Dirham marocain (**MAD / DH** par défaut), de l'Euro (**EUR €**) et du Dollar (**USD $**).

---

## 3. Architecture des Composants Clés

### A. Pipeline d'Extraction Documentaire & Anti-Faux Positifs
1. **Classification Lexicale Préventive** : Analyse des occurrences textuelles avec frontières lexicales strictes (`\b`) dans `classify_document`. Rejet immédiat des documents non comptables (CVs, notes textuelles) avec un statut `Rejected` et 95% de confiance.
2. **Extraction Hybride Haute Performance** : Traitement d'une facture en moins d'une seconde sur CPU sans dépendance externe bloquante.
3. **Piste d'Audit en 6 Étapes** :
   - Étape 1 : Ingestion horodatée (SHA256, date, métadonnées).
   - Étape 2 : Numérisation OCR (Tesseract 5).
   - Étape 3 : Classification automatique du type de document.
   - Étape 4 : Extraction hybride des montants (TTC, HT, TVA).
   - Étape 5 : Indexation vectorielle RAG pour la recherche plein texte.
   - Étape 6 : Validation humaine (Comptable / Administrateur).

### B. Moteur Multi-Devises & Spécificités Marocaines
- Formatage monétaire adapté à la réglementation marocaine (`1 450,00 DH`).
- Prise en charge des taux de TVA légaux marocains : 20% (taux normal), 14%, 10%, 7%, 0% (exonéré).
- Calculs bidirectionnels automatiques intégrés dans la modale d'édition (`Calculer TTC = HT + TVA` et `Déduire HT depuis TTC`).

### C. Exportation Comptable
- Génération automatisée de fichiers Excel multi-feuilles (`.xlsx`) via openpyxl.
- Formats CSV standardisés et JSON structuré pour l'interfaçage ERP.

---

## 4. Procédures d'Exécution & Déploiement

### Déploiement Conteneurisé (Docker Compose)
Orchestration complète des 4 conteneurs applicatifs :
```bash
docker-compose up -d
```
- Frontend UI : `http://localhost:5173`
- Backend API : `http://127.0.0.1:8000/docs`
- PostgreSQL : Port `5432`

Scripts d'automatisation Windows disponibles à la racine :
- `start_docker.bat` : Lancement en 1 clic.
- `stop_docker.bat` : Arrêt propre des conteneurs.

### Déploiement Local (Mode Développement)
```cmd
start_project.bat
```
Active l'environnement virtuel `.venv` et démarre simultanément l'API FastAPI, le worker asynchrone Huey et le serveur de développement Vite.

---

## 5. Normes & Bonnes Pratiques de Développement
- **Cohérence de Marque** : Maintenir rigoureusement l'identité **Gestion Document**.
- **Gestion Monétaire** : Utiliser impérativement le hook `useCurrency()` pour le rendu des montants financiers.
- **Internationalisation** : Déclarer chaque nouvelle chaîne bilingue dans `frontend/src/context/LanguageContext.jsx`.
- **Compatibilité d'Affichage** : Vérifier la conformité de chaque composant avec les variantes `dark:` de Tailwind CSS v4.
