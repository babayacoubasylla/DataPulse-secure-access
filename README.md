# DataPulse — Market Command Center

Plateforme SaaS B2B d'intelligence tarifaire pour :

- E-commerce général
- High-Tech
- Immobilier
- Billetterie / Transport

Le projet est organisé en deux parties :

```txt
datapulse/
  backend/     API FastAPI + SQLAlchemy
  frontend/    Interface React/Vite dynamique
  docs/        Documentation SQL et architecture
```

---

## 1. Lancer le backend sur Windows PowerShell

Depuis `C:\datapulse` :

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API :

```txt
http://127.0.0.1:8000
```

Documentation automatique :

```txt
http://127.0.0.1:8000/docs
```

Le backend utilise SQLite en développement par défaut :

```txt
backend/datapulse.db
```

Tu pourras passer à PostgreSQL plus tard avec la variable `DATABASE_URL`.

---

## 2. Lancer le frontend sur Windows PowerShell

Ouvre un deuxième terminal depuis `C:\datapulse` :

```powershell
cd frontend
npm install
npm run dev
```

Interface :

```txt
http://localhost:5173
```

---

## 3. Variables d'environnement

Copier le fichier :

```powershell
cd backend
copy .env.example .env
```

---

## 4. Philosophie design

DataPulse ne doit pas ressembler à un dashboard SaaS classique.

Direction retenue : **Market Command Center**.

L'utilisateur doit avoir l'impression de piloter une salle de contrôle marché :

- radar concurrentiel animé ;
- score de compétitivité vivant ;
- alertes temps réel ;
- cartes sectorielles ;
- interface sombre, premium et mémorable.

---

## 5. Routes API principales

```txt
GET  /health
GET  /api/dashboard/summary
GET  /api/tracked-items
POST /api/tracked-items
GET  /api/alerts
POST /api/alerts/rules
GET  /api/observations
POST /api/observations
```

---

## 6. Prochaine étape technique

Après lancement :

1. brancher une vraie authentification ;
2. ajouter Alembic pour les migrations ;
3. créer les premiers workers de scraping ;
4. ajouter WhatsApp / Email ;
5. passer de SQLite à PostgreSQL en production.
