from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from backend.database import db_manager
from backend.services.ai_service import ai_insight_service
from backend.services.portfolio_rag_service import portfolio_rag_service
from backend.routers.portfolio import get_portfolio_holdings

router = APIRouter(prefix="/insights", tags=["AI Quantitative Insights"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    selected_ticker: Optional[str] = Field(default=None, description="Optional stock ticker context")

@router.get("", response_model=Dict[str, Any])
async def get_portfolio_insights():
    """
    Generate AI-powered rebalancing critique, valuation anomaly warnings,
    and concentration risk reports based on user holdings and scraped financial metrics.
    """
    portfolio_data = await get_portfolio_holdings()
    insights = await ai_insight_service.analyze_portfolio(portfolio_data)
    return insights

@router.post("/chat", response_model=Dict[str, Any])
async def chat_with_portfolio_ai(req: ChatRequest):
    """
    Interactive RAG-powered Conversational AI Stock & Portfolio Copilot endpoint.
    Retrieves grounded multi-statement documents, Screener ratios, and pros/cons
    to answer quantitative queries with zero hallucination.
    """
    portfolio_data = await get_portfolio_holdings()
    messages_payload = [{"role": m.role, "content": m.content} for m in req.messages]
    response = await portfolio_rag_service.generate_rag_copilot_response(
        messages=messages_payload,
        portfolio_data=portfolio_data,
        selected_ticker=req.selected_ticker
    )
    return response

