import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import agents, finance, stock, cozy
from services.database import init_db
from pathlib import Path
import os

app = FastAPI(
    title="Hermes Vision OS",
    description="Futuristic VISION UI dashboard for Hermes Agent",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase with service account
FIREBASE_CREDS_PATH = Path.home() / ".hermes" / "firebase-credentials.json"
if FIREBASE_CREDS_PATH.exists():
    try:
        cred = credentials.Certificate(str(FIREBASE_CREDS_PATH))
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        print("✅ Firebase initialized successfully")
    except Exception as e:
        print(f"⚠️ Firebase init warning: {e}")
else:
    print(f"⚠️ Firebase credentials not found at {FIREBASE_CREDS_PATH}")

# Routers
app.include_router(agents.router, prefix="/api/agents")
app.include_router(finance.router, prefix="/api/finance")
app.include_router(cozy.router, prefix="/api/cozy")
app.include_router(stock.router, prefix="/api/stock")

@app.on_event("startup")
async def startup():
    await init_db()
    print("✅ Hermes Vision OS started!")

@app.get("/health")
async def health():
    return {"status": "ok", "service": "hermes-vision-os"}

@app.get("/")
async def root():
    return {"message": "Welcome to Hermes Vision OS! Go to /docs for API docs"}
