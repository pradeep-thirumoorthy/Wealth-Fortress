from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class StockMetricSchema(BaseModel):
    ticker: str
    company_name: Optional[str] = None
    current_price: Optional[float] = Field(default=None, description="Current Market Price in INR")
    market_cap_cr: Optional[float] = Field(default=None, description="Market Cap in Crores")
    high_52w: Optional[float] = Field(default=None, description="52-Week High Price")
    low_52w: Optional[float] = Field(default=None, description="52-Week Low Price")
    pe_ratio: Optional[float] = Field(default=None, description="Stock P/E Ratio")
    book_value: Optional[float] = Field(default=None, description="Book Value in INR")
    pb_ratio: Optional[float] = Field(default=None, description="Price to Book Ratio")
    dividend_yield_pct: Optional[float] = Field(default=None, description="Dividend Yield %")
    roce_pct: Optional[float] = Field(default=None, description="ROCE %")
    roe_pct: Optional[float] = Field(default=None, description="ROE %")
    face_value: Optional[float] = Field(default=None, description="Face Value in INR")
    roce_5yr: Optional[float] = Field(default=None, description="ROCE 5Yr %")
    roe_5yr: Optional[float] = Field(default=None, description="ROE 5Yr %")
    cmp_fcf: Optional[float] = Field(default=None, description="CMP / FCF Ratio")
    eps: Optional[float] = Field(default=None, description="Earnings Per Share (EPS)")
    promoter_holding_pct: Optional[float] = Field(default=None, description="Promoter Holding %")
    pledged_pct: Optional[float] = Field(default=None, description="Pledged Percentage %")
    peg_ratio: Optional[float] = Field(default=None, description="PEG Ratio")
    profit_growth_pct: Optional[float] = Field(default=None, description="Profit Growth %")
    sales_growth_3yr: Optional[float] = Field(default=None, description="Sales Growth 3Years %")
    reserves_cr: Optional[float] = Field(default=None, description="Reserves in Crores")
    profit_var_3yr: Optional[float] = Field(default=None, description="Profit Var 3Yrs %")
    sales_growth_5yr: Optional[float] = Field(default=None, description="Sales Growth 5Years %")
    debt_to_equity: Optional[float] = Field(default=None, description="Debt to Equity Ratio")
    qtr_profit_var_pct: Optional[float] = Field(default=None, description="Qtr Profit Var %")
    down_from_52w_high_pct: Optional[float] = Field(default=None, description="Down from 52w high %")
    profit_var_5yr: Optional[float] = Field(default=None, description="Profit Var 5Yrs %")
    qtr_sales_var_pct: Optional[float] = Field(default=None, description="Qtr Sales Var %")
    intrinsic_value: Optional[float] = Field(default=None, description="Intrinsic Value in INR")
    market_cap_category: Optional[str] = Field(default=None, description="Large Cap, Mid Cap, or Small Cap classification")
    quarterly_results: Optional[Dict[str, Any]] = Field(default=None, description="Last 5 Quarters Financial Results statement scraped from Screener.in")
    balance_sheet: Optional[Dict[str, Any]] = Field(default=None, description="Last 5 Years Balance Sheet statement scraped from Screener.in")
    cash_flow: Optional[Dict[str, Any]] = Field(default=None, description="Last 5 Years Cash Flows statement scraped from Screener.in")
    annual_ratios: Optional[Dict[str, Any]] = Field(default=None, description="Last 5 Years Key Financial Ratios scraped from Screener.in")
    about: Optional[str] = Field(default=None, description="Company business description and operational profile from Screener.in")
    screener_pros: Optional[List[str]] = Field(default_factory=list, description="Official Pros scraped directly from Screener.in analysis section")
    screener_cons: Optional[List[str]] = Field(default_factory=list, description="Official Cons scraped directly from Screener.in analysis section")
    last_changed_ratio: Optional[Dict[str, Any]] = Field(default=None, description="Single previous ratio that changed (remains unchanged if no new changes occur)")
    last_scraped_at: datetime = Field(default_factory=datetime.utcnow)

class ScrapeTriggerRequest(BaseModel):
    ticker: Optional[str] = Field(default=None, description="Specific ticker to scrape, or None for all portfolio holdings")
    force: bool = Field(default=False, description="Override 24h delta update restriction if True")

class ScrapeResultResponse(BaseModel):
    status: str
    scraped_tickers: List[str]
    skipped_tickers: List[str]
    errors: List[Dict]
    circuit_breaker_triggered: bool
