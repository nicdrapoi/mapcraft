# 🗺️ MapCraft — Cartes Interactives Personnalisables

**MapCraft** est une application web complète pour créer, éditer et partager des cartes interactives (réelles ou fictives).  
Chaque utilisateur peut uploader une image de carte, détecter automatiquement des pays/régions par clic, les colorier, y associer des informations détaillées, et publier sa carte via un lien partageable.

---

## 📁 Structure du projet

```
mapcraft/
├── backend/                  ← API Node.js + Express + MongoDB
│   ├── models/
│   │   ├── User.js           ← Schéma utilisateur (auth)
│   │   ├── Map.js            ← Schéma carte + historique
│   │   └── Region.js         ← Schéma région/pays
│   ├── routes/
│   │   ├── auth.js           ← POST /register, /login, GET /me
│   │   ├── maps.js           ← CRUD cartes + publication + historique
│   │   ├── regions.js        ← CRUD régions
│   │   └── upload.js         ← Upload images et drapeaux
│   ├── middleware/
│   │   └── auth.js           ← JWT protect + optionalAuth
│   ├── uploads/              ← Dossier des fichiers uploadés (auto-créé)
│   ├── server.js             ← Point d'entrée
│   └── .env.example
│
└── frontend/                 ← React 18 + Fabric.js
    ├── public/
    │   └── index.html
    └── src/
        ├── components/
        │   ├── Canvas/
        │   │   └── MapCanvas.jsx     ← Éditeur canvas (Fabric.js + Flood Fill)
        │   ├── Sidebar/
        │   │   └── RegionSidebar.jsx ← Panneau d'édition d'une région
        │   └── Auth/
        │       └── AuthForms.jsx     ← Connexion + inscription
        ├── pages/
        │   ├── Dashboard.jsx         ← Mes cartes + création
        │   ├── MapEditor.jsx         ← Éditeur complet
        │   ├── Explore.jsx           ← Galerie publique
        │   └── SharedMap.jsx         ← Vue publique (lecture seule)
        ├── context/
        │   └── AuthContext.jsx       ← Auth globale (JWT)
        ├── utils/
        │   ├── api.js                ← Axios configuré
        │   └── floodFill.js          ← Détection de zones (Flood Fill + contour)
        └── styles/
            └── global.css            ← Design system complet
```

---

## 🛠️ Prérequis

| Outil       | Version minimale | Lien                              |
|-------------|-----------------|-----------------------------------|
| Node.js     | v18+            | https://nodejs.org                |
| npm         | v9+             | (inclus avec Node.js)             |
| MongoDB     | v6+             | https://www.mongodb.com/try/download/community |

> 💡 **Alternative à MongoDB local :** Utilisez [MongoDB Atlas](https://www.mongodb.com/atlas) (gratuit, cloud). Copiez l'URI de connexion dans votre `.env`.

---

## 🚀 Installation locale

### 1. Cloner le projet

```bash
git clone <votre-repo>
cd mapcraft
```

### 2. Backend

```bash
cd backend
npm install

# Créer le fichier de configuration
cp .env.example .env
# Éditez .env avec votre éditeur : nano .env ou code .env
```

**Contenu du fichier `.env` :**
```env
PORT=5000
FRONTEND_URL=http://localhost:3000
MONGO_URI=mongodb://localhost:27017/mapcraft
JWT_SECRET=mon_super_secret_a_changer
JWT_EXPIRES_IN=7d
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=10
```

Démarrer le backend :
```bash
npm run dev      # développement (avec nodemon, rechargement auto)
# ou
npm start        # production
```

Le serveur démarre sur **http://localhost:5000**

### 3. Frontend

```bash
cd ../frontend
npm install

# Créer le fichier de configuration
cp .env.example .env
```

**Contenu du fichier `.env` :**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_UPLOADS_URL=http://localhost:5000
```

Démarrer le frontend :
```bash
npm start
```

L'application s'ouvre sur **http://localhost:3000**

---

## 🌐 Déploiement en production (lien partageable)

### Option recommandée : Render (backend) + Vercel (frontend)

#### Backend sur Render (gratuit)

1. Créez un compte sur [render.com](https://render.com)
2. Cliquez **New → Web Service**
3. Connectez votre repo GitHub
4. Sélectionnez le dossier `backend/`
5. Configurez :
   - **Build command :** `npm install`
   - **Start command :** `npm start`
6. Dans **Environment Variables**, ajoutez :
   ```
   MONGO_URI=<votre URI MongoDB Atlas>
   JWT_SECRET=<secret très long et aléatoire>
   FRONTEND_URL=https://votre-app.vercel.app
   NODE_ENV=production
   ```
7. Déployez → vous obtenez une URL comme `https://mapcraft-api.onrender.com`

#### Frontend sur Vercel (gratuit)

1. Créez un compte sur [vercel.com](https://vercel.com)
2. Cliquez **New Project** → importez votre repo
3. Sélectionnez le dossier `frontend/`
4. Dans **Environment Variables**, ajoutez :
   ```
   REACT_APP_API_URL=https://mapcraft-api.onrender.com/api
   REACT_APP_UPLOADS_URL=https://mapcraft-api.onrender.com
   ```
5. Déployez → vous obtenez une URL comme `https://mapcraft.vercel.app`

---

## 🗺️ Utilisation

### Créer un compte
1. Ouvrez l'application → cliquez **Créer un compte**
2. Renseignez un nom d'utilisateur, email, mot de passe

### Créer une carte
1. Dans le **Dashboard**, cliquez **+ Nouvelle carte**
2. Donnez un titre et uploadez votre image de carte (PNG, JPG, SVG)
3. Cliquez **Créer la carte** → vous entrez dans l'éditeur

### Détecter et créer des régions
1. Dans l'éditeur, cliquez le bouton **🪄 Détecter un pays**
2. Cliquez sur une zone de la carte → le système effectue un **Flood Fill** pour détecter les contours
3. Un polygone est créé automatiquement autour de la zone
4. Le panneau latéral s'ouvre pour renseigner les infos

### Renseigner les informations d'une région
- Nom, capitale, population, description
- Statut : Allié / Ennemi / Neutre / Vassal / Contesté / Inconnu
- Couleur politique / régime
- Drapeau (upload d'image)
- Couleur et opacité de remplissage
- Activer/désactiver la bordure noire

### Exporter
- **PNG** : export haute résolution du canvas complet
- **SVG** : export vectoriel éditable

### Publier et partager
1. Cliquez **🔒 Privé** → devient **🌍 Publié**
2. Cliquez **🔗 Copier le lien** → copiez l'URL
3. Envoyez le lien à qui vous voulez → ils voient la carte en lecture seule
4. En cliquant sur une région colorée, ils voient toutes les informations

### Historique
- Cliquez **📜** dans la barre d'outils pour voir toutes les modifications

---

## 🔌 Routes API

### Auth
| Méthode | Route              | Accès  | Description           |
|---------|-------------------|--------|-----------------------|
| POST    | /api/auth/register | Public | Créer un compte       |
| POST    | /api/auth/login    | Public | Se connecter          |
| GET     | /api/auth/me       | Privé  | Profil connecté       |

### Cartes
| Méthode | Route                  | Accès  | Description                      |
|---------|------------------------|--------|----------------------------------|
| GET     | /api/maps/public       | Public | Liste des cartes publiques        |
| GET     | /api/maps/my           | Privé  | Mes cartes                        |
| GET     | /api/maps/share/:id    | Public | Carte par lien partageable        |
| GET     | /api/maps/:id          | Mixte  | Détail d'une carte                |
| POST    | /api/maps              | Privé  | Créer une carte                   |
| PUT     | /api/maps/:id          | Privé  | Modifier / publier une carte      |
| DELETE  | /api/maps/:id          | Privé  | Supprimer une carte               |
| GET     | /api/maps/:id/history  | Privé  | Historique des modifications      |

### Régions
| Méthode | Route                        | Accès | Description         |
|---------|------------------------------|-------|---------------------|
| POST    | /api/regions/:mapId          | Privé | Créer une région    |
| PUT     | /api/regions/:mapId/:id      | Privé | Modifier une région |
| DELETE  | /api/regions/:mapId/:id      | Privé | Supprimer une région|

### Upload
| Méthode | Route              | Accès | Description                     |
|---------|-------------------|-------|---------------------------------|
| POST    | /api/upload        | Privé | Upload image (?type=flag pour drapeau) |

---

## 🐛 Dépannage fréquent

| Problème                        | Solution                                                                  |
|---------------------------------|---------------------------------------------------------------------------|
| `CORS error`                    | Vérifiez que `FRONTEND_URL` dans le `.env` backend correspond exactement à l'URL du frontend |
| `MongoDB connection failed`     | Vérifiez que MongoDB est démarré (`mongod`) ou que l'URI Atlas est correct |
| `Cannot read properties of null (canvas)` | Rechargez la page, l'image de fond n'est peut-être pas encore chargée |
| Upload d'image échoue           | Vérifiez la taille (max 10 Mo par défaut) et le format (PNG/JPG/SVG/WebP) |
| Flood fill ne détecte rien      | L'image doit être servie depuis le même domaine (CORS). En local, le proxy React gère ça automatiquement |

---

## 📦 Technologies utilisées

| Couche      | Technologie         | Rôle                                |
|-------------|--------------------|------------------------------------|
| Frontend    | React 18            | Interface utilisateur               |
| Canvas      | Fabric.js 5         | Édition interactive des polygones   |
| Détection   | Flood Fill maison   | Détection automatique des zones     |
| Style       | CSS Variables       | Design system (pas de framework CSS)|
| Routage     | React Router v6     | Navigation SPA                      |
| HTTP client | Axios               | Requêtes API                        |
| Backend     | Node.js + Express   | API REST                            |
| Base de données | MongoDB + Mongoose | Persistance des données         |
| Auth        | JWT + bcryptjs      | Authentification sécurisée          |
| Upload      | Multer              | Gestion des fichiers                |

---

*MapCraft — Cartographiez vos mondes, réels ou imaginaires.*
