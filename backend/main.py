import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.db import create_tables
from database.seed import seed_database
from routers import auth, aptitude, coding, communication, dashboard, assistant, profile, company

app = FastAPI(title="PlacementPro API", version="1.0.0")

# Your Netlify frontend URL
FRONTEND_URL = "https://charming-centaur-2aa657.netlify.app"

# CORS FIX
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(aptitude.router)
app.include_router(coding.router)
app.include_router(communication.router)
app.include_router(dashboard.router)
app.include_router(assistant.router)
app.include_router(profile.router)
app.include_router(company.router)

# Startup event
@app.on_event("startup")
async def startup():
    print("Starting PlacementPro...")
    create_tables()
    seed_database()
    print("Ready!")

# Test routes
@app.get("/")
async def root():
    return {
        "message": "PlacementPro API running",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
