## Creating Application for Personal Weath Management

# Stack
- FoentEnd
    - Angular
- BackEnd
    - FastAPI

# Createing backend
- python -m venv venv
- source venv/bin/activate  # On Windows: venv\Scripts\activate
- pip install fastapi uvicorn
- pip freeze > requirements.txt
- uvicorn app.main:app --reload

# Development Mode (Database only in Docker)

## Start database only:
- sudo docker compose -f docker-compose.dev.yml up

## Run backend locally:
- cd backend
- python -m venv venv
- source venv/bin/activate
- pip install -r requirements.txt
- uvicorn app.main:app --reload

## Run frontend locally:
- cd frontend/wealth-frontend
- npm install
- ng serve

# Production Mode (All services in Docker)

- sudo docker compose up --build






