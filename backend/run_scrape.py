import asyncio
import logging
from backend.database import db_manager
from backend.scraper.engine import ScreenerScraperEngine

logging.basicConfig(level=logging.INFO)

async def get_last_scraped_fn(ticker: str):
    metric = await db_manager.get_metric(ticker)
    return metric.get("last_scraped_at") if metric else None

async def run():
    engine = ScreenerScraperEngine()
    portfolio = await db_manager.get_portfolio(user_id="usr_default")
    tickers = [h["ticker"] for h in portfolio.get("holdings", [])]
    print(f"Scraping {len(tickers)} tickers: {tickers}")

    scraped, skipped, errors = await engine.scrape_batch_async(
        tickers=tickers,
        get_last_scraped_fn=get_last_scraped_fn,
        force=True
    )

    print(f"Successfully scraped {len(scraped)} tickers. Errors: {errors}")

    for metric in scraped:
        doc = metric.model_dump()
        await db_manager.save_metric(doc)
        print(f"Saved metric & quarterly results for {metric.ticker} to MongoDB.")

if __name__ == "__main__":
    asyncio.run(run())
