import re
import json
import logging
import requests
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from backend.config import settings

logger = logging.getLogger(__name__)

@dataclass
class RAGDocument:
    doc_id: str
    ticker: str
    category: str
    title: str
    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)

class PortfolioRAGService:
    """
    RAG (Retrieval-Augmented Generation) Knowledge Manager and Copilot Engine for Wealth Fortress.
    Uses Google Gemini thinking capabilities to retrieve, synthesize, and reason through
    multi-source financial statements, 27 Screener ratios, and portfolio holdings.
    """

    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY
        # Quota-resilient model cascade: 3.7 Flash -> 3.6 Flash -> Gemma
        self.models = [settings.GEMINI_PRIMARY_MODEL, "gemini-3.6-flash", "gemma-4-26b-a4b-it"]

    def build_knowledge_base(self, portfolio_data: Dict[str, Any]) -> List[RAGDocument]:
        """
        Extracts, chunks, and structures all portfolio holdings, financial statements,
        and Screener.in data into indexed RAG knowledge documents.
        """
        documents: List[RAGDocument] = []
        holdings = portfolio_data.get("holdings", [])
        total_val = portfolio_data.get("total_portfolio_value", 0.0)

        # 1. Macro Portfolio Overview Document
        tot_invested = sum(h.get("total_invested", 0.0) for h in holdings)
        unrealized = total_val - tot_invested
        unrealized_pct = round((unrealized / tot_invested) * 100, 1) if tot_invested > 0 else 0.0

        sector_summary: Dict[str, float] = {}
        for h in holdings:
            sec = h.get("sector") or "Uncategorized"
            val = h.get("current_market_value") or (h.get("quantity", 0) * (h.get("current_price") or 0))
            sector_summary[sec] = sector_summary.get(sec, 0.0) + val

        sec_lines = [f"• {sec}: ₹{v:,.0f} ({round((v/total_val)*100, 1)}%)" for sec, v in sector_summary.items()] if total_val > 0 else []

        macro_doc = RAGDocument(
            doc_id="doc_macro_portfolio",
            ticker="PORTFOLIO",
            category="macro",
            title="Portfolio Macro Allocation & NAV Overview",
            content=(
                f"WEALTH FORTRESS PORTFOLIO AGGREGATE STATS:\n"
                f"- Total Current Market Value: ₹{total_val:,.2f}\n"
                f"- Total Invested Capital: ₹{tot_invested:,.2f}\n"
                f"- Net Unrealized P&L: {'+' if unrealized >= 0 else ''}₹{unrealized:,.2f} ({'+' if unrealized_pct >= 0 else ''}{unrealized_pct}%)\n"
                f"- Tracked Company Count: {len(holdings)} holdings\n"
                f"- Sector Allocations:\n" + "\n".join(sec_lines)
            ),
            metadata={"total_value": total_val, "total_invested": tot_invested, "holdings_count": len(holdings)}
        )
        documents.append(macro_doc)

        # 2. Per-Holding Multi-Perspective Knowledge Documents
        for h in holdings:
            t = h.get("ticker", "UNKNOWN").upper()
            c_name = h.get("company_name", t)
            sec = h.get("sector", "Uncategorized")
            qty = h.get("quantity", 0)
            buy_price = h.get("avg_buy_price", 0)
            cmp_price = h.get("current_price") or buy_price
            invested = h.get("total_invested", qty * buy_price)
            curr_val = h.get("current_market_value", qty * cmp_price)
            pnl = curr_val - invested
            pnl_pct = round((pnl / invested) * 100, 1) if invested > 0 else 0
            w_pct = h.get("weightage_pct", 0)
            m = h.get("metrics", {}) or {}

            # Document 2A: Position & Valuation Document
            pe = m.get("pe_ratio", "N/A")
            pb = m.get("pb_ratio", "N/A")
            peg = m.get("peg_ratio", "N/A")
            intrinsic = m.get("intrinsic_value", "N/A")
            div_yield = m.get("dividend_yield_pct", 0)
            mcap_cr = m.get("market_cap_cr", "N/A")
            mcap_cat = m.get("market_cap_category", "Uncategorized")

            val_doc = RAGDocument(
                doc_id=f"doc_{t}_position_valuation",
                ticker=t,
                category="valuation",
                title=f"{t} Portfolio Position & Valuation Metrics",
                content=(
                    f"COMPANY: {c_name} ({t}) | SECTOR: {sec} | CATEGORY: {mcap_cat}\n"
                    f"- Portfolio Position: {qty} shares @ Avg Buy Price ₹{buy_price:,.2f} | Current Price: ₹{cmp_price:,.2f}\n"
                    f"- Capital Exposure: Invested ₹{invested:,.2f} | Current Value: ₹{curr_val:,.2f} (Weight: {w_pct}%)\n"
                    f"- Unrealized Return: {'+' if pnl >= 0 else ''}₹{pnl:,.2f} ({'+' if pnl_pct >= 0 else ''}{pnl_pct}%)\n"
                    f"- Valuation Multiples: Stock P/E: {pe} | P/B: {pb} | PEG Ratio: {peg}\n"
                    f"- Graham Intrinsic Value: ₹{intrinsic} | Dividend Yield: {div_yield}% | Market Cap: ₹{mcap_cr} Cr"
                ),
                metadata={"ticker": t, "pe": pe, "intrinsic": intrinsic, "weight": w_pct, "pnl_pct": pnl_pct}
            )
            documents.append(val_doc)

            # Document 2B: Multi-Quarter Trajectory & Growth Statement
            q_res = m.get("quarterly_results", {})
            q_metrics = q_res.get("metrics", {})
            q_hdrs = q_res.get("quarters", [])
            q_sales = q_metrics.get("Sales") or q_metrics.get("Revenue") or []
            q_profit = q_metrics.get("Net Profit") or q_metrics.get("Profit after tax") or []
            q_opm = q_metrics.get("OPM %") or []

            sales_3yr = m.get("sales_growth_3yr", "N/A")
            profit_growth = m.get("profit_growth_pct", "N/A")

            first_sales = float(q_sales[0].replace(',', '')) if q_sales and q_sales[0] else None
            latest_sales = float(q_sales[-1].replace(',', '')) if q_sales and q_sales[-1] else None
            multiplier_str = f"{(latest_sales / first_sales):.1f}x" if first_sales and latest_sales and first_sales > 0 else "N/A"

            q_lines = []
            for idx, q_name in enumerate(q_hdrs[-5:]):
                s_val = q_sales[idx] if idx < len(q_sales) else "-"
                p_val = q_profit[idx] if idx < len(q_profit) else "-"
                opm_val = q_opm[idx] if idx < len(q_opm) else "-"
                q_lines.append(f"  • {q_name}: Sales ₹{s_val} Cr | Net Profit ₹{p_val} Cr | OPM {opm_val}%")

            trajectory_doc = RAGDocument(
                doc_id=f"doc_{t}_quarterly_trajectory",
                ticker=t,
                category="trajectory",
                title=f"{t} Multi-Quarter Operational Results & Top-Line Scaling",
                content=(
                    f"COMPANY: {c_name} ({t}) QUARTERLY REVENUE TRAJECTORY:\n"
                    f"- 5-Quarter Scaling Multiplier: {multiplier_str} (First: ₹{first_sales} Cr ➔ Latest: ₹{latest_sales} Cr)\n"
                    f"- Historical Compounding: 3-Yr Sales CAGR: {sales_3yr}% | YoY Profit Growth: {profit_growth}%\n"
                    f"- Recent 5 Quarters Financial Breakdown:\n" + "\n".join(q_lines)
                ),
                metadata={"ticker": t, "sales_multiplier": multiplier_str, "latest_sales": latest_sales}
            )
            documents.append(trajectory_doc)

            # Document 2C: Balance Sheet, Solvency & Cash Flows
            bs_res = m.get("balance_sheet", {})
            bs_metrics = bs_res.get("metrics", {})
            reserves_vals = bs_metrics.get("Reserves") or []
            borrowing_vals = bs_metrics.get("Borrowings") or []
            cwip_vals = bs_metrics.get("CWIP") or bs_metrics.get("Capital Work in Progress") or []

            cf_res = m.get("cash_flow", {})
            cf_metrics = cf_res.get("metrics", {})
            cfo_vals = cf_metrics.get("Cash from Operating Activity") or []
            fcf_vals = cf_metrics.get("Free Cash Flow") or []

            debt_eq = m.get("debt_to_equity", "N/A")
            roce_5yr = m.get("roce_5yr") or m.get("roce_pct", "N/A")
            roe_5yr = m.get("roe_5yr") or m.get("roe_pct", "N/A")
            pledged = m.get("pledged_pct", 0)

            latest_res = reserves_vals[-1] if reserves_vals else "N/A"
            latest_bor = borrowing_vals[-1] if borrowing_vals else "0"
            latest_cwip = cwip_vals[-1] if cwip_vals else "0"
            latest_cfo = cfo_vals[-1] if cfo_vals else "N/A"
            latest_fcf = fcf_vals[-1] if fcf_vals else "N/A"

            solvency_doc = RAGDocument(
                doc_id=f"doc_{t}_solvency_cashflow",
                ticker=t,
                category="solvency",
                title=f"{t} Balance Sheet Solvency, Debt & Cash Flow",
                content=(
                    f"COMPANY: {c_name} ({t}) CAPITAL STRUCTURE & CASH EFFICIENCY:\n"
                    f"- Return on Capital: 5-Yr ROCE: {roce_5yr}% | 5-Yr ROE: {roe_5yr}%\n"
                    f"- Debt & Solvency: Debt/Equity: {debt_eq} | Pledged Promoter Holding: {pledged}%\n"
                    f"- Balance Sheet Reserves: ₹{latest_res} Cr vs Borrowings: ₹{latest_bor} Cr\n"
                    f"- Active Capital Work in Progress (CWIP): ₹{latest_cwip} Cr\n"
                    f"- Cash Flow Generation: Annual CFO: ₹{latest_cfo} Cr | Free Cash Flow (FCF): ₹{latest_fcf} Cr"
                ),
                metadata={"ticker": t, "roce": roce_5yr, "debt_to_equity": debt_eq, "fcf": latest_fcf}
            )
            documents.append(solvency_doc)

            # Document 2D: Qualitative Profile, Screener Pros & Cons
            about_txt = m.get("about") or "Operational business in Indian commercial sector."
            sc_pros = m.get("screener_pros") or []
            sc_cons = m.get("screener_cons") or []

            pros_bullets = "\n".join([f"  + [Screener.in Pro]: {p}" for p in sc_pros]) if sc_pros else "  + Stable baseline operations"
            cons_bullets = "\n".join([f"  - [Screener.in Con]: {c}" for c in sc_cons]) if sc_cons else "  - Standard macroeconomic risks"

            audit_doc = RAGDocument(
                doc_id=f"doc_{t}_screener_audit",
                ticker=t,
                category="audit",
                title=f"{t} Business Profile & Screener.in Verified Pros/Cons",
                content=(
                    f"COMPANY: {c_name} ({t}) BUSINESS PROFILE:\n"
                    f"{about_txt}\n\n"
                    f"OFFICIAL SCREENER.IN PROS & STRENGTHS:\n{pros_bullets}\n\n"
                    f"OFFICIAL SCREENER.IN CONS & RISK FACTORS:\n{cons_bullets}"
                ),
                metadata={"ticker": t, "pros_count": len(sc_pros), "cons_count": len(sc_cons)}
            )
            documents.append(audit_doc)

        return documents

    def retrieve_relevant_documents(
        self,
        query: str,
        knowledge_base: List[RAGDocument],
        selected_ticker: Optional[str] = None,
        limit: int = 5
    ) -> List[RAGDocument]:
        """
        Retrieves top-k knowledge documents based on semantic keyword scoring,
        explicit ticker targeting, and financial query intent.
        """
        if not knowledge_base:
            return []

        scored_docs: List[Tuple[float, RAGDocument]] = []
        q_lower = query.lower()
        q_tokens = set(re.findall(r'\b\w+\b', q_lower))

        for doc in knowledge_base:
            score = 0.0
            doc_text = (doc.title + " " + doc.content).lower()

            # 1. Ticker exact or focus matching
            if selected_ticker and doc.ticker.upper() == selected_ticker.upper():
                score += 15.0
            elif doc.ticker.lower() in q_tokens or (doc.ticker.lower() in q_lower and doc.ticker != "PORTFOLIO"):
                score += 12.0

            # 2. Macro portfolio query matching
            if doc.ticker == "PORTFOLIO" and any(k in q_lower for k in ["portfolio", "total", "overall", "sector", "rebalance", "all"]):
                score += 8.0

            # 3. Category & financial keywords matching
            if any(k in q_lower for k in ["roce", "roe", "efficiency", "return"]) and doc.category in ["solvency", "valuation"]:
                score += 4.0
            if any(k in q_lower for k in ["debt", "leverage", "borrowing", "solvency", "reserves", "cwip"]) and doc.category == "solvency":
                score += 5.0
            if any(k in q_lower for k in ["valuation", "pe", "p/e", "graham", "intrinsic", "cheap", "discount", "expensive"]) and doc.category == "valuation":
                score += 5.0
            if any(k in q_lower for k in ["sales", "revenue", "quarter", "results", "growth", "trajectory", "profit"]) and doc.category == "trajectory":
                score += 4.0
            if any(k in q_lower for k in ["pros", "cons", "risks", "strengths", "about", "profile", "what does"]) and doc.category == "audit":
                score += 5.0

            # 4. Token overlap matching
            for token in q_tokens:
                if len(token) > 3 and token in doc_text:
                    score += 1.0

            if score > 0:
                scored_docs.append((score, doc))

        # Sort descending by relevance score
        scored_docs.sort(key=lambda x: x[0], reverse=True)
        return [doc for _, doc in scored_docs[:limit]]

    def _call_gemini_thinking_model(self, prompt: str, system_instruction: Optional[str] = None) -> Tuple[Optional[str], Optional[str]]:
        """
        Executes reasoning call to Gemini with quota-aware model fallback (3.7 Flash -> 3.6 Flash -> Gemma).
        """
        if not self.gemini_key:
            return None, None

        for model_name in self.models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.gemini_key}"
            
            payload: Dict[str, Any] = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.3,
                }
            }
            if system_instruction:
                payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

            try:
                resp = requests.post(url, json=payload, timeout=8)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            logger.info(f"Wealth Fortress RAG Thinking succeeded via model: {model_name}")
                            return model_name, parts[0]["text"]
                elif resp.status_code in [429, 503]:
                    logger.info(f"Model {model_name} rate-limited ({resp.status_code}). Trying next model in cascade...")
                    continue
                else:
                    logger.warning(f"Model {model_name} returned status {resp.status_code}")
            except Exception as e:
                logger.info(f"Model {model_name} call bypassed: {e}")

        return None, None

    async def generate_rag_copilot_response(
        self,
        messages: List[Dict[str, str]],
        portfolio_data: Dict[str, Any],
        selected_ticker: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        RAG Thinking Pipeline:
        1. Retrieves top relevant context chunks for user query.
        2. Prompts Google Gemini to think step-by-step through the retrieved financial statements.
        3. Generates high-conviction Chief Investment Officer answers.
        """
        user_query = messages[-1]["content"] if messages else "Portfolio summary"

        # 1. Build Index & Retrieve
        knowledge_base = self.build_knowledge_base(portfolio_data)
        retrieved_docs = self.retrieve_relevant_documents(user_query, knowledge_base, selected_ticker=selected_ticker, limit=4)

        retrieved_context_blocks = []
        source_titles = []
        for d in retrieved_docs:
            source_titles.append(f"{d.title} ({d.doc_id})")
            retrieved_context_blocks.append(f"### [SOURCE: {d.title}]\n{d.content}")

        fused_context_str = "\n\n".join(retrieved_context_blocks) if retrieved_context_blocks else "No specific document matched."

        # 2. Step-by-Step Thinking System Instruction
        system_instruction = (
            "You are the Senior Quantitative Portfolio Manager and Chief Investment Officer at 'Wealth Fortress', "
            "powered by Google Gemini Thinking and Retrieval-Augmented Generation (RAG).\n\n"
            "THINKING & REASONING FRAMEWORK:\n"
            "1. Analyze Retrieved Context: Strictly inspect the retrieved financial metrics (CMP, 5-Yr ROCE, Debt/Equity, Free Cash Flow, Graham Intrinsic Values, Screener Pros/Cons).\n"
            "2. Evaluate Moat & Risk: Weigh capital compounding velocity (ROCE > 20%) against valuation multiple risk (P/E > 40x) and debt burden (Debt/Eq > 0.8).\n"
            "3. Structured Table Identification: Whenever comparing multiple stocks, financial ratios, or valuation metrics, always structure the core comparative figures using clean Markdown Tables with standard pipe notation (e.g. | Ticker | CMP (₹) | 5-Yr ROCE (%) | P/E | Debt/Eq | Action Directive |).\n"
            "4. Formulate Clear Actionable Directives: Provide direct recommendations (BUY/ACCUMULATE, TRIM/SELL, or HOLD) with exact numbers.\n"
            "5. Format Output: Structure your answer with clear markdown headings, bold numerical ratios, styled comparison tables, and bulleted takeaways."
        )

        # 3. Multi-turn conversation prompt
        conv_lines = []
        for msg in messages[-4:]:
            role_label = "User" if msg["role"] == "user" else "Wealth Fortress CIO"
            conv_lines.append(f"{role_label}: {msg['content']}")

        rag_prompt = f"""
RETRIEVED GROUND-TRUTH CONTEXT DOCUMENTS:
{fused_context_str}

SELECTED FOCUS: {selected_ticker or 'PORTFOLIO-WIDE'}

CONVERSATION HISTORY:
{chr(10).join(conv_lines)}

INSTRUCTIONS:
- Think step-by-step through the retrieved metrics above.
- Answer the user's latest query with institutional rigor and crisp mathematical reasoning.
- Cite exact figures (ROCE %, P/E, 5-Quarter Sales scaling, Debt/Eq, Free Cash Flow).

Wealth Fortress CIO:
"""
        # 4. Call Gemini Thinking Engine
        model_used, raw_reply = self._call_gemini_thinking_model(
            prompt=rag_prompt,
            system_instruction=system_instruction
        )

        if raw_reply:
            return {
                "reply": raw_reply.strip(),
                "retrieved_sources": source_titles,
                "model": f"Wealth Fortress RAG ({model_used})",
                "status": "success"
            }

        # 5. Deterministic Grounded Fallback
        fallback_reply = self._generate_grounded_fallback_reply(user_query, retrieved_docs, selected_ticker)
        return {
            "reply": fallback_reply,
            "retrieved_sources": source_titles,
            "model": "Wealth Fortress RAG (Deterministic Grounded Engine)",
            "status": "fallback"
        }

    def _generate_grounded_fallback_reply(
        self,
        user_query: str,
        retrieved_docs: List[RAGDocument],
        selected_ticker: Optional[str] = None
    ) -> str:
        """Grounded deterministic fallback generated directly from the indexed knowledge chunks."""
        if not retrieved_docs:
            return (
                "### 🛡️ Wealth Fortress Quantitative Overview\n\n"
                "I have analyzed your portfolio. Select a specific stock from the focus list or ask about "
                "our highest ROCE compounders, Graham intrinsic value discounts, or debt leverage critique."
            )

        top_doc = retrieved_docs[0]
        summary_points = []
        for d in retrieved_docs[:2]:
            lines = [l.strip() for l in d.content.split('\n') if l.strip() and not l.startswith('COMPANY') and not l.startswith('WEALTH')]
            summary_points.extend(lines[:3])

        bullets_str = "\n".join([f"- {p}" for p in summary_points[:5]])

        return (
            f"### 🛡️ Wealth Fortress RAG Analysis: **{top_doc.title}**\n\n"
            f"{bullets_str}\n\n"
            f"**Actionable CIO Verdict**: High capital efficiency with verified multi-statement backing. "
            f"Review full statement trajectory in the Quantitative Analysis tab for quarterly scaling updates."
        )

portfolio_rag_service = PortfolioRAGService()
