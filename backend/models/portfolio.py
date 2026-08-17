from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class HoldingCreateUpdate(BaseModel):
    ticker: str = Field(..., description="Stock ticker symbol (e.g., RELIANCE, TCS, INFY)")
    company_name: Optional[str] = Field(default="", description="Full company name")
    quantity: float = Field(..., gt=0, description="Total number of shares held")
    avg_buy_price: float = Field(..., gt=0, description="Average buy price per share in INR")
    sector: Optional[str] = Field(default="Uncategorized", description="Sector classification")
    notes: Optional[str] = Field(default="", description="User notes or investment thesis")

class HoldingItem(HoldingCreateUpdate):
    holding_id: str
    total_invested: float
    weightage_pct: Optional[float] = 0.0
    added_at: datetime = Field(default_factory=datetime.utcnow)

class PortfolioResponse(BaseModel):
    user_id: str
    portfolio_name: str
    holdings: List[HoldingItem]
    total_portfolio_value: float
    total_invested_capital: float
    unrealized_pnl: float
    unrealized_pnl_pct: float
    updated_at: datetime
