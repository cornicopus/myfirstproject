# Трамплин - Карьерная платформа

## О проекте
Платформа для централизованного взаимодействия студентов, выпускников, работодателей и карьерных центров вузов в сфере IT и смежных областях.

## Технологии

### Frontend
- React 18
- TypeScript
- Material UI (MUI)
- Redux Toolkit
- React Router v6
- Axios
- Leaflet / OpenStreetMap

### Backend
- FastAPI
- PostgreSQL
- SQLAlchemy (async)
- JWT аутентификация
- Pydantic

## Установка и запуск

### Требования
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+

### Бэкенд
```bash
cd tramplin-backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000```

### Фронтенд
```bash
cd tramplin-frontend
npm install
npm run dev```

### База данных
```bash
psql -U postgres -c "CREATE DATABASE tramplin;"

cd tramplin-backend
python -m app.utils.seed_full_data```
