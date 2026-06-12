# SafeRent — Anonymous Housing Quality Map

Anonymous, map-based platform for Hamilton, ON tenants to report housing issues
(mold, pests, heat, repairs, safety) without retaliation risk. No accounts, no
names — just aggregated complaint data by address.

## Stack
- **Backend:** Django 5 + DRF + GeoDjango (PostGIS)
- **Frontend:** React (Vite) + Tailwind + Mapbox GL JS
- **Hosting:** Render (API + Postgres) / Vercel (frontend)

## Local development

```bash
# 1. Database (PostGIS via Docker)
docker compose up -d

# 2. Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver   # http://localhost:8000/api/health/

# 3. Frontend (added Day 8 milestone, deployed earlier as skeleton)
cd ../frontend
npm install && npm run dev   # http://localhost:5173
```

## Deployment
- Backend: Render Blueprint at `backend/render.yaml`
- Frontend: Vercel, root dir `frontend/`

## Project docs
See `/docs` for the project charter, scope decisions, and risk register.
