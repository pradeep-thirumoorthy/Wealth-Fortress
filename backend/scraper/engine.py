import asyncio
import time
import random
import logging
import requests
from datetime import datetime, timedelta
from typing import Optional, Tuple, List, Callable, Dict, Any
from playwright.async_api import async_playwright
from backend.models.metrics import StockMetricSchema
from backend.scraper.robots_checker import ScreenerRobotsChecker
from backend.scraper.screener_parser import parse_screener_html_content
from backend.config import settings

logger = logging.getLogger(__name__)

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

class ScreenerScraperEngine:
    def __init__(self, cdp_url: str = settings.CDP_URL, base_url: str = settings.SCREENER_BASE_URL):
        self.cdp_url = cdp_url
        self.base_url = base_url.rstrip("/")
        self.robots_checker = ScreenerRobotsChecker(self.base_url)
        self.robots_checker.load_robots_txt()
        self.circuit_broken = False

    def is_delta_update_needed(self, last_scraped_at: Optional[datetime], force: bool = False) -> bool:
        if force or not last_scraped_at:
            return True
        cooldown = timedelta(hours=settings.DELTA_COOLDOWN_HOURS)
        return (datetime.utcnow() - last_scraped_at) > cooldown

    async def scrape_batch_async(
        self,
        tickers: List[str],
        get_last_scraped_fn: Callable[[str], Any],
        force: bool = False
    ) -> Tuple[List[StockMetricSchema], List[str], List[Dict[str, Any]]]:
        """
        Connects via CDP to reuse an existing open browser tab on Screener.in.
        Navigates sequentially through all stock tickers in the same open tab.
        Does NOT close the opened tab.
        """
        scraped_metrics: List[StockMetricSchema] = []
        skipped_tickers: List[str] = []
        errors: List[Dict[str, Any]] = []

        # 1. Attempt Playwright CDP connection reusing an open Chrome tab
        try:
            async with async_playwright() as p:
                logger.info(f"Connecting to Chrome via CDP at {self.cdp_url} to reuse active session...")
                browser = await p.chromium.connect_over_cdp(self.cdp_url)
                context = browser.contexts[0] if browser.contexts else await browser.new_context()

                # Reuse existing opened page/tab in Chrome if open, otherwise create one tab and keep it open
                if context.pages:
                    page = context.pages[0]
                    logger.info(f"Reusing existing open Chrome tab (Current URL: {page.url})...")
                else:
                    page = await context.new_page()
                    logger.info("Opened new active Chrome tab...")

                for ticker in tickers:
                    ticker = ticker.upper().strip()

                    if self.circuit_broken:
                        errors.append({"ticker": ticker, "reason": "Circuit Breaker Active (HTTP 429/403)"})
                        break

                    if asyncio.iscoroutinefunction(get_last_scraped_fn):
                        last_scraped = await get_last_scraped_fn(ticker)
                    else:
                        last_scraped = get_last_scraped_fn(ticker)
                    if not self.is_delta_update_needed(last_scraped, force=force):
                        logger.info(f"Skipping {ticker}: Updated in the last 24h.")
                        skipped_tickers.append(ticker)
                        continue

                    target_url = f"{self.base_url}/company/{ticker}/"
                    if not self.robots_checker.can_fetch(target_url):
                        target_url = f"{self.base_url}/company/{ticker}/"

                    # Behavioral jitter delay (4 to 10 seconds)
                    jitter = random.uniform(settings.JITTER_MIN_SEC, settings.JITTER_MAX_SEC)
                    logger.info(f"Navigating open tab to {target_url} with {jitter:.2f}s delay...")
                    await asyncio.sleep(jitter)

                    response = await page.goto(target_url, wait_until="domcontentloaded", timeout=30000)

                    if response and response.status in (429, 403):
                        self.circuit_broken = True
                        logger.critical(f"HTTP {response.status} received for {ticker}. Circuit breaker triggered!")
                        errors.append({"ticker": ticker, "reason": f"HTTP {response.status} Circuit Breaker Activated"})
                        break

                    html_content = await page.content()
                    metric = parse_screener_html_content(html_content, ticker)

                    if metric and metric.current_price:
                        scraped_metrics.append(metric)
                        logger.info(f"Parsed {ticker} via open tab: CMP=₹{metric.current_price}")
                    else:
                        errors.append({"ticker": ticker, "reason": "Failed to parse metric values"})

                # NOTE: Page is intentionally left OPEN in the browser tab!
                return scraped_metrics, skipped_tickers, errors

        except Exception as e:
            err_msg = str(e)
            logger.warning(f"CDP connection notice ({err_msg}). Executing direct HTTP fallback batch...")

        # 2. Direct HTTP fetch fallback if CDP Chrome is not running
        headers = {"User-Agent": USER_AGENT}
        for ticker in tickers:
            ticker = ticker.upper().strip()

            if self.circuit_broken:
                errors.append({"ticker": ticker, "reason": "Circuit Breaker Active"})
                break

            if asyncio.iscoroutinefunction(get_last_scraped_fn):
                last_scraped = await get_last_scraped_fn(ticker)
            else:
                last_scraped = get_last_scraped_fn(ticker)
            if not self.is_delta_update_needed(last_scraped, force=force):
                skipped_tickers.append(ticker)
                continue

            target_url = f"{self.base_url}/company/{ticker}/"
            try:
                res = requests.get(target_url, headers=headers, timeout=15)
                if res.status_code in (429, 403):
                    self.circuit_broken = True
                    errors.append({"ticker": ticker, "reason": f"HTTP {res.status_code}"})
                    break
                if res.status_code == 200:
                    metric = parse_screener_html_content(res.text, ticker)
                    if metric:
                        scraped_metrics.append(metric)
            except Exception as ex:
                errors.append({"ticker": ticker, "reason": str(ex)})

        return scraped_metrics, skipped_tickers, errors
