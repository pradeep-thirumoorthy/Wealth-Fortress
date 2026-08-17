from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.routers import portfolio, scrape, insights

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade API for AI-Powered Portfolio Intelligence Platform extracting financial data from Screener.in",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(portfolio.router)
app.include_router(scrape.router)
app.include_router(insights.router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "cdp_target": settings.CDP_URL,
        "screener_domain": settings.SCREENER_BASE_URL,
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
