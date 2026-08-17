from fastapi import APIRouter, HTTPException, Path
from typing import List, Dict, Any
from datetime import datetime
import uuid
from backend.models.portfolio import HoldingCreateUpdate, HoldingItem, PortfolioResponse
from backend.database import db_manager

router = APIRouter(prefix="/portfolio", tags=["Portfolio Holdings"])

@router.get("", response_model=Dict[str, Any])
async def get_portfolio_holdings():
    """
    Retrieve user portfolio holdings merged with cost basis, total value,
    unrealized profit/loss, and latest scraped financial metrics.
    """
    raw_portfolio = await db_manager.get_portfolio(user_id="usr_default")
    holdings_raw = raw_portfolio.get("holdings", [])

    merged_holdings = []
    total_portfolio_value = 0.0
    total_invested_capital = 0.0

    for item in holdings_raw:
        ticker = item["ticker"].upper()
        qty = float(item.get("quantity", 0))
        avg_price = float(item.get("avg_buy_price", 0))
        total_invested = round(qty * avg_price, 2)
        total_invested_capital += total_invested

        # Fetch latest scraped metrics for ticker
        scraped_metrics = await db_manager.get_metric(ticker)
        current_price = scraped_metrics.get("current_price") if scraped_metrics else None
        
        # If current price scraped, calculate market value; else fallback to cost basis
        if current_price:
            current_val = round(qty * current_price, 2)
        else:
            current_val = total_invested
            current_price = avg_price

        total_portfolio_value += current_val

        unrealized_gain = round(current_val - total_invested, 2)
        unrealized_gain_pct = round((unrealized_gain / total_invested * 100), 2) if total_invested > 0 else 0.0

        merged_item = {
            "holding_id": item.get("holding_id", str(uuid.uuid4())[:8]),
            "ticker": ticker,
            "company_name": item.get("company_name", ticker),
            "quantity": qty,
            "avg_buy_price": avg_price,
            "total_invested": total_invested,
            "current_price": current_price,
            "current_market_value": current_val,
            "unrealized_pnl": unrealized_gain,
            "unrealized_pnl_pct": unrealized_gain_pct,
            "sector": item.get("sector", "Uncategorized"),
            "notes": item.get("notes", ""),
            "metrics": scraped_metrics or {}
        }
        merged_holdings.append(merged_item)

    # Compute weightage percentages
    for h in merged_holdings:
        h["weightage_pct"] = round((h["current_market_value"] / total_portfolio_value * 100), 2) if total_portfolio_value > 0 else 0.0

    # Sort holdings descending by Current Market Value
    merged_holdings.sort(key=lambda h: h["current_market_value"], reverse=True)

    total_unrealized_pnl = round(total_portfolio_value - total_invested_capital, 2)
    total_unrealized_pnl_pct = round((total_unrealized_pnl / total_invested_capital * 100), 2) if total_invested_capital > 0 else 0.0

    return {
        "user_id": raw_portfolio.get("user_id", "usr_default"),
        "portfolio_name": raw_portfolio.get("portfolio_name", "Core Portfolio"),
        "holdings": merged_holdings,
        "total_portfolio_value": round(total_portfolio_value, 2),
        "total_invested_capital": round(total_invested_capital, 2),
        "unrealized_pnl": total_unrealized_pnl,
        "unrealized_pnl_pct": total_unrealized_pnl_pct,
        "updated_at": datetime.utcnow().isoformat()
    }

@router.post("/holdings", status_code=201)
async def add_holding(holding: HoldingCreateUpdate):
    """
    Add a new invested company or update an existing holding's cost basis in MongoDB.
    """
    ticker = holding.ticker.upper().strip()
    holding_id = f"h_{uuid.uuid4().hex[:6]}"
    total_invested = round(holding.quantity * holding.avg_buy_price, 2)

    holding_dict = {
        "holding_id": holding_id,
        "ticker": ticker,
        "company_name": holding.company_name or f"{ticker} Ltd.",
        "quantity": holding.quantity,
        "avg_buy_price": holding.avg_buy_price,
        "total_invested": total_invested,
        "sector": holding.sector or "Uncategorized",
        "notes": holding.notes or "",
        "added_at": datetime.utcnow()
    }

    await db_manager.save_holding("usr_default", holding_dict)
    return {"message": f"Successfully saved holding for {ticker}", "holding": holding_dict}

@router.put("/holdings/{ticker}")
async def update_holding(holding: HoldingCreateUpdate, ticker: str = Path(..., description="Ticker to update")):
    """
    Modify quantity, average bought price, sector, or notes for an invested company.
    """
    ticker = ticker.upper().strip()
    total_invested = round(holding.quantity * holding.avg_buy_price, 2)
    
    holding_dict = {
        "holding_id": f"h_{uuid.uuid4().hex[:6]}",
        "ticker": ticker,
        "company_name": holding.company_name or f"{ticker} Ltd.",
        "quantity": holding.quantity,
        "avg_buy_price": holding.avg_buy_price,
        "total_invested": total_invested,
        "sector": holding.sector or "Uncategorized",
        "notes": holding.notes or "",
        "updated_at": datetime.utcnow()
    }

    await db_manager.save_holding("usr_default", holding_dict)
    return {"message": f"Successfully updated holding for {ticker}", "holding": holding_dict}

@router.delete("/holdings/{ticker}")
async def delete_holding(ticker: str = Path(..., description="Ticker to delete")):
    """
    Delete an invested company from user portfolio.
    """
    ticker = ticker.upper().strip()
    success = await db_manager.delete_holding("usr_default", ticker)
    if not success:
        raise HTTPException(status_code=404, detail=f"Holding for {ticker} not found.")
    return {"message": f"Successfully removed {ticker} from portfolio holdings."}
