import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from backend.config import settings

logger = logging.getLogger(__name__)

def sanitize_mongo_doc(doc: Any) -> Any:
    """
    Recursively strips MongoDB `_id` ObjectId fields and converts non-JSON serializable types.
    """
    if isinstance(doc, dict):
        res = {}
        for k, v in doc.items():
            if k == "_id":
                continue
            res[k] = sanitize_mongo_doc(v)
        return res
    elif isinstance(doc, list):
        return [sanitize_mongo_doc(i) for i in doc]
    elif hasattr(doc, "__class__") and doc.__class__.__name__ == "ObjectId":
        return str(doc)
    return doc

# User-specific active portfolio holdings in MongoDB
IN_MEMORY_PORTFOLIOS: Dict[str, Any] = {
    "usr_default": {
        "user_id": "usr_default",
        "portfolio_name": "Core Growth Portfolio",
        "holdings": [
            {
                "holding_id": "h_001",
                "ticker": "TIPSMUSIC",
                "company_name": "Tips Music Ltd.",
                "quantity": 3.0,
                "avg_buy_price": 650.65,
                "total_invested": 1951.95,
                "sector": "Media & Entertainment",
                "notes": "Music rights growth",
                "added_at": datetime.utcnow()
            },
            {
                "holding_id": "h_002",
                "ticker": "ATHERENERG",
                "company_name": "Ather Energy Ltd.",
                "quantity": 2.0,
                "avg_buy_price": 987.00,
                "total_invested": 1974.00,
                "sector": "Automobile",
                "notes": "Electric 2W pioneer",
                "added_at": datetime.utcnow()
            },
            {
                "holding_id": "h_003",
                "ticker": "TINNARUBR",
                "company_name": "Tinna Rubber & Infrastructure Ltd.",
                "quantity": 5.0,
                "avg_buy_price": 750.00,
                "total_invested": 3750.00,
                "sector": "Infrastructure",
                "notes": "Recycled rubber pioneer",
                "added_at": datetime.utcnow()
            },
            {
                "holding_id": "h_004",
                "ticker": "WAAREERTL",
                "company_name": "Waaree Renewable Technologies Ltd.",
                "quantity": 10.0,
                "avg_buy_price": 1200.00,
                "total_invested": 12000.00,
                "sector": "Energy",
                "notes": "Solar EPC player",
                "added_at": datetime.utcnow()
            },
            {
                "holding_id": "h_005",
                "ticker": "CEMPRO",
                "company_name": "Cera Sanitaryware Ltd.",
                "quantity": 1.0,
                "avg_buy_price": 6800.00,
                "total_invested": 6800.00,
                "sector": "Consumer Goods",
                "notes": "Building materials leader",
                "added_at": datetime.utcnow()
            },
            {
                "holding_id": "h_006",
                "ticker": "NAM-INDIA",
                "company_name": "Nippon Life India Asset Management Ltd.",
                "quantity": 15.0,
                "avg_buy_price": 550.00,
                "total_invested": 8250.00,
                "sector": "Financials",
                "notes": "AMC SIP tailwinds",
                "added_at": datetime.utcnow()
            },
            {
                "holding_id": "h_007",
                "ticker": "BEL",
                "company_name": "Bharat Electronics Ltd.",
                "quantity": 25.0,
                "avg_buy_price": 240.00,
                "total_invested": 6000.00,
                "sector": "Defense",
                "notes": "Defense electronics moat",
                "added_at": datetime.utcnow()
            }
        ],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
}

IN_MEMORY_METRICS: Dict[str, Dict[str, Any]] = {
    "TIPSMUSIC": {
        "ticker": "TIPSMUSIC",
        "company_name": "Tips Music Ltd",
        "current_price": 671.00,
        "pe_ratio": 40.0,
        "pb_ratio": 33.05,
        "roce_pct": 118.0,
        "roe_pct": 87.6,
        "debt_to_equity": 0.05,
        "market_cap_cr": 8576.0,
        "dividend_yield_pct": 1.94,
        "last_scraped_at": datetime.utcnow()
    },
    "ATHERENERG": {
        "ticker": "ATHERENERG",
        "company_name": "Ather Energy Ltd",
        "current_price": 1512.00,
        "pe_ratio": None,
        "pb_ratio": 22.50,
        "roce_pct": -19.8,
        "roe_pct": -33.4,
        "debt_to_equity": 0.26,
        "market_cap_cr": 59628.0,
        "dividend_yield_pct": 0.00,
        "last_scraped_at": datetime.utcnow()
    },
    "TINNARUBR": {
        "ticker": "TINNARUBR",
        "company_name": "Tinna Rubber & Infrastructure Ltd",
        "current_price": 1090.00,
        "pe_ratio": 31.5,
        "pb_ratio": 6.69,
        "roce_pct": 28.4,
        "roe_pct": 24.1,
        "debt_to_equity": 0.45,
        "market_cap_cr": 1870.0,
        "dividend_yield_pct": 0.45,
        "last_scraped_at": datetime.utcnow()
    }
}

class DatabaseManager:
    def __init__(self):
        self.use_mongo = False
        self.client = None
        self.db = None
        self._init_connection()

    def _init_connection(self):
        try:
            from motor.motor_asyncio import AsyncIOMotorClient
            self.client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000)
            self.db = self.client[settings.DATABASE_NAME]
            self.use_mongo = True
            logger.info("Configured Motor async MongoDB driver.")
        except Exception as e:
            logger.warning(f"MongoDB connection setup notice: {e}. Defaulting to resilient in-memory datastore.")
            self.use_mongo = False

    async def get_portfolio(self, user_id: str = "usr_default") -> Dict[str, Any]:
        if self.use_mongo:
            try:
                doc = await self.db.portfolios.find_one({"user_id": user_id})
                if doc:
                    return sanitize_mongo_doc(doc)
            except Exception as e:
                logger.warning(f"MongoDB query failed ({e}), using in-memory store.")
        res = IN_MEMORY_PORTFOLIOS.get(user_id, IN_MEMORY_PORTFOLIOS["usr_default"])
        return sanitize_mongo_doc(res)

    async def save_holding(self, user_id: str, holding: Dict[str, Any]):
        ticker = holding["ticker"].upper().strip()
        holding["ticker"] = ticker
        if self.use_mongo:
            try:
                await self.db.portfolios.update_one(
                    {"user_id": user_id},
                    {"$pull": {"holdings": {"ticker": {"$regex": f"^{ticker}$", "$options": "i"}}}}
                )
                await self.db.portfolios.update_one(
                    {"user_id": user_id},
                    {"$push": {"holdings": holding}, "$set": {"updated_at": datetime.utcnow()}},
                    upsert=True
                )
                return
            except Exception as e:
                logger.warning(f"MongoDB update failed: {e}")
        
        portfolio = IN_MEMORY_PORTFOLIOS.setdefault(user_id, {
            "user_id": user_id,
            "portfolio_name": "Core Wealth Portfolio",
            "holdings": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        existing_idx = next((i for i, h in enumerate(portfolio["holdings"]) if h["ticker"].upper() == ticker), None)
        if existing_idx is not None:
            portfolio["holdings"][existing_idx] = holding
        else:
            portfolio["holdings"].append(holding)
        portfolio["updated_at"] = datetime.utcnow()

    async def delete_holding(self, user_id: str, ticker: str) -> bool:
        ticker = ticker.upper().strip()

        if self.use_mongo:
            try:
                await self.db.portfolios.update_many(
                    {},
                    {"$pull": {"holdings": {"ticker": {"$regex": f"^{ticker}$", "$options": "i"}}}, "$set": {"updated_at": datetime.utcnow()}}
                )
            except Exception as e:
                logger.warning(f"MongoDB delete failed: {e}")

        for p_key, p_val in IN_MEMORY_PORTFOLIOS.items():
            holdings_list = p_val.get("holdings", [])
            p_val["holdings"] = [h for h in holdings_list if h["ticker"].upper().strip() != ticker]
            p_val["updated_at"] = datetime.utcnow()

        return True

    async def get_metric(self, ticker: str) -> Optional[Dict[str, Any]]:
        ticker = ticker.upper()
        if self.use_mongo:
            try:
                doc = await self.db.financial_metrics.find_one({"ticker": ticker})
                if doc:
                    return sanitize_mongo_doc(doc)
            except Exception as e:
                logger.warning(f"MongoDB metric query failed: {e}")
        res = IN_MEMORY_METRICS.get(ticker)
        if res:
            return sanitize_mongo_doc(res)
        return None

    async def save_metric(self, metric_data: Dict[str, Any]):
        ticker = metric_data["ticker"].upper()
        
        # 1. Fetch existing metric to compare ratio change delta
        existing_metric = await self.get_metric(ticker)
        
        ratio_fields_labels = {
            "current_price": "Current Price",
            "pe_ratio": "Stock P/E",
            "pb_ratio": "Book Value Ratio",
            "roce_pct": "ROCE %",
            "roe_pct": "ROE %",
            "debt_to_equity": "Debt to Equity",
            "market_cap_cr": "Market Cap",
            "dividend_yield_pct": "Dividend Yield",
            "eps": "EPS",
            "peg_ratio": "PEG Ratio",
            "promoter_holding_pct": "Promoter Holding",
            "sales_growth_3yr": "Sales Growth (3Yr)",
            "profit_growth_pct": "Profit Growth",
            "reserves_cr": "Reserves",
            "intrinsic_value": "Intrinsic Value",
            "down_from_52w_high_pct": "Down from High",
        }
        
        new_changed_ratio = None
        if existing_metric:
            for field, label in ratio_fields_labels.items():
                old_v = existing_metric.get(field)
                new_v = metric_data.get(field)
                if old_v is not None and new_v is not None:
                    try:
                        old_f = float(old_v)
                        new_f = float(new_v)
                        if abs(old_f - new_f) > 0.001:
                            direction = "INCREASED" if new_f > old_f else "DECREASED"
                            delta = round(new_f - old_f, 2)
                            pct = round(((new_f - old_f) / abs(old_f)) * 100, 2) if old_f != 0 else 0.0
                            new_changed_ratio = {
                                "ratio_name": label,
                                "field": field,
                                "old_value": round(old_f, 2),
                                "new_value": round(new_f, 2),
                                "direction": direction,
                                "change_delta": delta,
                                "change_pct": pct,
                                "changed_at": datetime.utcnow().isoformat()
                            }
                            break
                    except (ValueError, TypeError):
                        pass

        # If values remain identical to before, preserve the previous changed variable!
        if new_changed_ratio:
            metric_data["last_changed_ratio"] = new_changed_ratio
        elif existing_metric and existing_metric.get("last_changed_ratio"):
            metric_data["last_changed_ratio"] = existing_metric["last_changed_ratio"]

        # 2. Persist metric object to MongoDB
        if self.use_mongo:
            try:
                await self.db.financial_metrics.update_one(
                    {"ticker": ticker},
                    {"$set": metric_data},
                    upsert=True
                )
                if metric_data.get("current_price"):
                    await self.db.portfolios.update_many(
                        {"holdings.ticker": {"$regex": f"^{ticker}$", "$options": "i"}},
                        {"$set": {"holdings.$.current_price": metric_data["current_price"], "updated_at": datetime.utcnow()}}
                    )
                return
            except Exception as e:
                logger.warning(f"MongoDB metric save failed: {e}")
        IN_MEMORY_METRICS[ticker] = metric_data

db_manager = DatabaseManager()
