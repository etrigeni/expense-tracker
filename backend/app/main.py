from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, expenses, categories, wishlist, dashboard, incomes, budgets, savings

app = FastAPI(
    title="Budget Tracker API",
    description="Personal budget tracking API with FastAPI",
    version="0.1.0",
)

# CORS middleware
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",  # Vite default dev server
    "http://localhost:3000",  # Alternative frontend port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(expenses.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(wishlist.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(incomes.router, prefix="/api")
app.include_router(budgets.router, prefix="/api")
app.include_router(savings.router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Budget Tracker API",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
