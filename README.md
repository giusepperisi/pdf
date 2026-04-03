# SocialManager-AI

Post automatici su Facebook e Instagram con testo generato da Gemini AI e immagini da Pollinations.ai.

## Stack

- **Backend**: Python 3.12 · FastAPI · PostgreSQL · APScheduler
- **Frontend**: React 18 · TypeScript · Vite · Tailwind CSS
- **AI**: Google Gemini (testo) · Pollinations.ai (immagini, gratuito)
- **Social**: Meta Graph API v21 (Facebook + Instagram)

## Prerequisiti

- Docker + Docker Compose
- Account [Google AI Studio](https://aistudio.google.com) (gratuito) → `GEMINI_API_KEY`
- Account [Cloudinary](https://cloudinary.com) (gratuito) → credenziali hosting immagini
- App Meta for Developers con `pages_manage_posts` + `instagram_content_publish`

## Setup rapido

```bash
# 1. Clona il repo e vai sul branch
git clone <url-repo>
cd pdf
git checkout claude/social-media-auto-poster-M9q7e

# 2. Configura le variabili d'ambiente
cp .env.example .env
# Modifica .env con le tue credenziali

# 3. Avvia tutto
docker compose up -d

# 4. Verifica
docker compose ps
```

## Variabili d'ambiente (.env)

| Variabile | Descrizione | Dove ottenerla |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Auto-configurata con Docker |
| `GEMINI_API_KEY` | Google Gemini AI | [aistudio.google.com](https://aistudio.google.com) |
| `HUGGINGFACE_TOKEN` | Fallback image generation | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |
| `CLOUDINARY_CLOUD_NAME` | Hosting immagini | [cloudinary.com](https://cloudinary.com) |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Dashboard Cloudinary |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Dashboard Cloudinary |
| `FERNET_KEY` | Cifratura token Meta | Genera con `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` |
| `SECRET_KEY` | JWT/session key | Stringa random 32 caratteri |

## URL

| Servizio | URL |
|---|---|
| Frontend | http://localhost:3500 |
| Backend API | http://localhost:3600 |
| API Docs (Swagger) | http://localhost:3600/docs |
| PostgreSQL | localhost:5432 |

## Configurazione Meta API

### 1. Crea l'app su Meta for Developers
1. Vai su [developers.facebook.com](https://developers.facebook.com)
2. Crea App → tipo **Business**
3. Aggiungi prodotti: **Instagram Graph API** + **Facebook Login**

### 2. Permessi richiesti
```
pages_manage_posts
pages_read_engagement
instagram_basic
instagram_content_publish
```

### 3. Ottieni il Page Access Token
1. Vai su [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Seleziona la tua app e la tua Page
3. Genera token con i permessi sopra
4. Converti in **long-lived token** (60 giorni):
   ```
   GET /oauth/access_token?grant_type=fb_exchange_token&client_id={app-id}&client_secret={app-secret}&fb_exchange_token={token}
   ```

### 4. Trova l'Instagram Business ID
```
GET /me/accounts → prendi il page_id
GET /{page_id}?fields=instagram_business_account → prendi l'ig_business_id
```

## Workflow

```
Nuova campagna → inserisci topic
  → Gemini genera cluster semantici con keyword
  → Seleziona cluster → genera contenuto (testo + immagine AI)
  → Schedula post → pubblicazione automatica su FB + IG
```

## Migrazioni DB

```bash
# Applica migrazioni (prima volta)
cd backend
alembic upgrade head

# Crea nuova migrazione dopo modifiche ai modelli
alembic revision --autogenerate -m "descrizione"
```

## Comandi utili

```bash
# Log backend
docker compose logs -f backend

# Log frontend
docker compose logs -f frontend

# Restart singolo servizio
docker compose restart backend

# Stop tutto
docker compose down

# Stop e cancella volumi (reset DB)
docker compose down -v
```
