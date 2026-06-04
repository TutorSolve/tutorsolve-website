# TutorSolve

## Architecture
- `backend/` — Flask JSON API (deploys to AWS Elastic Beanstalk)
- `frontend/` — Static HTML/CSS/JS (deploys to AWS S3 + CloudFront)

## Local Development

### Backend
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate      # Windows
source .venv/bin/activate    # Mac/Linux
pip install -r requirements.txt
python run.py
```
API runs at: http://localhost:5000

### Frontend
```bash
cd frontend
python -m http.server 3000
```
Frontend runs at: http://localhost:3000

## Railway Deployment (Monorepo, Non-SPA Frontend)

This repository deploys as **4 Railway services** from one repo:
- `backend-web` (Flask + Gunicorn, `APP_ROLE=web`)
- `celery-worker` (`APP_ROLE=worker`)
- `celery-beat` (`APP_ROLE=beat`)
- `frontend` (static multi-page HTML, **not** SPA fallback)

### Service roots
- Backend services root: `backend/`
- Frontend service root: `frontend/`

### Required frontend variable
Set this on the `frontend` service:
- `FRONTEND_BACKEND_URL=https://${{backend-web.RAILWAY_PUBLIC_DOMAIN}}`

This injects the backend URL into `frontend/js/runtime-env.js` at startup.

### Deploy from Railway CLI (already linked project)
```bash
# backend web
railway up backend --path-as-root --service backend-web

# celery worker
railway up backend --path-as-root --service celery-worker

# celery beat
railway up backend --path-as-root --service celery-beat

# frontend (multi-page static)
railway up frontend --path-as-root --service frontend
```

### Why this frontend setup
- Frontend uses multiple real HTML pages (`/auth/login.html`, `/student/dashboard.html`, etc.).
- Startup now uses `serve` **without** SPA mode (`-s`) so unknown routes are not rewritten to `/index.html`.
- This prevents non-SPA pages from being masked by SPA fallback behavior.

## Seeded Administrative Accounts
| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@tutorsolve.com` | `Admin@123` |
| **Employee** | `staff@tutorsolve.com` | `Staff@123` |

## Environment
Copy `backend/.env.example` to `backend/.env` and fill in your values. Ensure `MONGO_URI` is present.
