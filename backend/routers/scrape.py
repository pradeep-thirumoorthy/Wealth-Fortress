from fastapi import APIRouter, BackgroundTasks
from typing import Dict, Any, List
from datetime import datetime
from backend.models.metrics import ScrapeTriggerRequest, ScrapeResultResponse
from backend.scraper.engine import ScreenerScraperEngine
from backend.database import db_manager

router = APIRouter(prefix="/scrape", tags=["Screener Ingestion Engine"])

# Global scraper engine instance preserving circuit breaker state across requests
scraper_engine = ScreenerScraperEngine()

@router.post("/trigger", response_model=ScrapeResultResponse)
async def trigger_scrape(req: ScrapeTriggerRequest, background_tasks: BackgroundTasks):
    """
    Execute rate-limited, jittered CDP scrape for user portfolio holdings.
    Reuses existing open browser tab on Screener.in without closing tabs.
    Enforces 24h delta updates, robots.txt, and 429/403 circuit breaker.
    """
    portfolio = await db_manager.get_portfolio("usr_default")
    holdings = portfolio.get("holdings", [])

    if req.ticker:
        target_tickers = [req.ticker.upper().strip()]
    else:
        target_tickers = [h["ticker"].upper().strip() for h in holdings]

    async def get_last_scraped(ticker: str):
        doc = await db_manager.get_metric(ticker)
        return doc.get("last_scraped_at") if doc else None

    scraped_metrics, skipped_tickers, errors = await scraper_engine.scrape_batch_async(
        tickers=target_tickers,
        get_last_scraped_fn=get_last_scraped,
        force=req.force
    )

    scraped_names = []
    for metric in scraped_metrics:
        metric_dict = metric.model_dump()
        await db_manager.save_metric(metric_dict)
        scraped_names.append(metric.ticker)

    return ScrapeResultResponse(
        status="Complete" if not scraper_engine.circuit_broken else "Circuit Breaker Tripped",
        scraped_tickers=scraped_names,
        skipped_tickers=skipped_tickers,
        errors=errors,
        circuit_breaker_triggered=scraper_engine.circuit_broken
    )

@router.post("/reset-circuit-breaker")
async def reset_circuit_breaker():
    """
    Reset the circuit breaker manually after rate-limit cooldown.
    """
    scraper_engine.circuit_broken = False
    return {"message": "Circuit breaker has been reset successfully."}
