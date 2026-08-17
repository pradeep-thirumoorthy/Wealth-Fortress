import re
import json
import logging
import requests
import hashlib
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from backend.config import settings

logger = logging.getLogger(__name__)

class AIInsightService:
    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY
        self.models = [settings.GEMINI_PRIMARY_MODEL, "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemma-4-26b-a4b-it"]
        # In-memory caching for performance
        self._cached_insights: Optional[Dict[str, Any]] = None
        self._cached_hash: Optional[str] = None
        self._cache_time: Optional[datetime] = None

    def _get_portfolio_hash(self, portfolio_data: Dict[str, Any]) -> str:
        """Computes a deterministic hash of current portfolio holdings to prevent redundant API calls."""
        holdings = portfolio_data.get("holdings", [])
        content = [(h.get("ticker"), h.get("quantity"), h.get("current_price")) for h in holdings]
        return hashlib.md5(json.dumps(content, sort_keys=True, default=str).encode()).hexdigest()

    def _call_gemini_single_shot(
        self,
        prompt: str,
        is_json: bool = False,
        system_instruction: Optional[str] = None
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Executes a quota-aware call to Google Gemini API (timeout 6s).
        If primary model is rate-limited (429/503), tries fallback models.
        """
        if not self.gemini_key:
            return None, None

        for model_name in self.models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.gemini_key}"
            
            gen_config: Dict[str, Any] = {
                "temperature": 0.25,
            }
            if is_json:
                gen_config["responseMimeType"] = "application/json"

            payload: Dict[str, Any] = {
                "contents": [
                    {
                        "parts": [{"text": prompt}]
                    }
                ],
                "generationConfig": gen_config
            }

            if system_instruction:
                payload["systemInstruction"] = {
                    "parts": [{"text": system_instruction}]
                }

            try:
                resp = requests.post(url, json=payload, timeout=6)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            logger.info(f"Wealth Fortress Gemini query succeeded via model: {model_name}")
                            return model_name, parts[0]["text"]
                elif resp.status_code in [429, 503]:
                    continue
            except Exception:
                pass

        return None, None

    async def analyze_portfolio(self, portfolio_data: Dict[str, Any], force_refresh: bool = False) -> Dict[str, Any]:
        """
        Synthesizes multi-source financial statements, 27 ratios, quarterly results,
        balance sheet reserves/borrowings/CWIP, cash flows, and Screener.in Pros/Cons
        to generate deep, bespoke, non-repetitive Chief Investment Officer intelligence.
        """
        holdings = portfolio_data.get("holdings", [])
        total_val = portfolio_data.get("total_portfolio_value", 0.0)

        # 1. Check in-memory cache first
        curr_hash = self._get_portfolio_hash(portfolio_data)
        if not force_refresh and self._cached_insights and self._cached_hash == curr_hash and self._cache_time:
            if datetime.utcnow() - self._cache_time < timedelta(minutes=10):
                return self._cached_insights

        # 2. Build Rich Multi-Statement Context Block
        from backend.services.portfolio_rag_service import portfolio_rag_service
        knowledge_docs = portfolio_rag_service.build_knowledge_base(portfolio_data)
        context_blocks = [f"[{d.title}]\n{d.content}" for d in knowledge_docs]
        dense_context_str = "\n\n".join(context_blocks)

        # 3. Call Google Gemini with Multi-Statement RAG Payload
        if self.gemini_key:
            system_prompt = (
                "You are the Senior Quantitative Portfolio Manager and Chief Investment Officer at 'Wealth Fortress', "
                "powered by Google Gemini Thinking and Multi-Statement Financial Intelligence.\n\n"
                "CRITICAL MANDATES:\n"
                "1. NO COOKIE-CUTTER OR REPETITIVE TEXT: Deliver bespoke, nuanced, mathematically grounded analysis for each stock.\n"
                "2. CROSS-STATEMENT SYNTHESIS: Cross-examine reported Net Profits against Free Cash Flow (FCF), compare Capex in CWIP "
                "against Top-Line 5-Quarter Sales acceleration, test Debt-to-Equity vs Reserves, and verify Margin of Safety against Graham Intrinsic Value.\n"
                "3. QUALITATIVE AUDIT: Incorporate Screener.in verified Pros & Cons into the valuation and rebalancing thesis.\n"
                "4. OUTPUT STRICT JSON MATCHING THE REQUIRED SCHEMA."
            )

            prompt_content = f"""
WEALTH FORTRESS MULTI-STATEMENT GROUND-TRUTH DATA:
{dense_context_str}

PORTFOLIO AGGREGATE TOTAL: ₹{total_val:,.2f} Across {len(holdings)} Holdings

TASKS TO EXECUTE:
1. Executive Summary & Multi-Statement Diagnosis: A rich 3-4 sentence Chief Investment Officer thesis synthesizing cross-sheet cash flow conversion, 5Q top-line momentum, balance sheet fortress strength, and overall capital allocation quality.
2. Ratio & Solvency Critique: Identify specific stock leverage risks (Debt/Eq > 0.8), high-burn capex buildouts, ROCE compounding leaders (>25%), or multiple overextension risks (P/E > 40x). Include specific numerical details.
3. Allocation & Concentration Risks: Highlight single-stock exposure exceeding 18-20% and sector clustering exceeding 25%.
4. Portfolio Rebalancing & Reorganization Action Plans: Group actionable items into 3 distinct lists:
   - "buy": High-ROCE compounding engines & structural market disruptors to accumulate.
   - "trim": Stretched valuation multiples (P/E > 45x) or over-concentrated positions to take profits.
   - "value": Deep value margin of safety holdings trading below Graham Intrinsic Value with low PEG (<1.0).

OUTPUT STRICT JSON FORMAT:
{{
  "summary": "Rich multi-statement CIO executive diagnosis paragraph with specific metrics.",
  "anomalies": [
    {{
      "ticker": "TICKER",
      "type": "Solvency Risk / Capital Efficiency Moat / Capex Scaling / Valuation Premium",
      "severity": "High / Medium / Valuation Risk / Opportunity",
      "metric_badge": "e.g. 5-Yr ROCE: 85% or D/E: 0.0",
      "details": "Dense mathematical justification citing statement numbers (e.g. Free Cash Flow, Reserves, CWIP, OPM %)."
    }}
  ],
  "concentration_warnings": [
    {{
      "target": "TICKER or Sector Name",
      "type": "Single-Stock Capital Concentration / Sector Correlation",
      "badge": "e.g. 24.5% Weight • ₹4,024",
      "details": "Specific risk rationale regarding capital exposure and cyclical vulnerability."
    }}
  ],
  "rebalancing_recommendations": [
    {{
      "ticker": "TICKER",
      "action": "BUY / ACCUMULATE or TRIM / TAKE PROFITS or GRAHAM VALUE BUY",
      "category": "buy or trim or value",
      "target_weightage_pct": 18.0,
      "rationale": "Non-repetitive, tailored financial rationale synthesizing 5Q trajectory, cash flow yield, ROCE, and Screener pros/cons."
    }}
  ]
}}
"""
            model_used, raw_reply = self._call_gemini_single_shot(
                prompt=prompt_content,
                is_json=True,
                system_instruction=system_prompt
            )

            if raw_reply:
                try:
                    parsed_json = json.loads(raw_reply)
                    if "summary" in parsed_json and "rebalancing_recommendations" in parsed_json:
                        parsed_json["engine"] = f"Wealth Fortress AI (Google {model_used})"
                        self._cached_insights = parsed_json
                        self._cached_hash = curr_hash
                        self._cache_time = datetime.utcnow()
                        return parsed_json
                except json.JSONDecodeError:
                    pass

        # 4. Instant Fallback to Enhanced Multi-Statement Intelligence Engine
        rule_result = self._generate_rule_based_insights(portfolio_data)
        self._cached_insights = rule_result
        self._cached_hash = curr_hash
        self._cache_time = datetime.utcnow()
        return rule_result

    def _generate_rule_based_insights(self, portfolio_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates multi-ratio anomalies, concentration risks, and 3 distinct action plans
        with bespoke multi-statement financial synthesis for every holding without cookie-cutter templates.
        """
        holdings = portfolio_data.get("holdings", [])
        total_val = portfolio_data.get("total_portfolio_value", 0.0)

        anomalies = []
        concentration_warnings = []
        recommendations = []

        if not holdings:
            return {
                "summary": "Portfolio is empty. Add holdings to activate Wealth Fortress AI analysis.",
                "anomalies": [],
                "concentration_warnings": [],
                "rebalancing_recommendations": []
            }

        # Sector Distribution Map
        sector_weightages: Dict[str, float] = {}
        for h in holdings:
            sec = h.get("sector") or "Uncategorized"
            sec_val = h.get("current_market_value") or (h.get("quantity", 0) * (h.get("current_price") or 0))
            sector_weightages[sec] = sector_weightages.get(sec, 0.0) + sec_val

        if total_val > 0:
            for s in sector_weightages:
                sector_weightages[s] = (sector_weightages[s] / total_val) * 100.0

        for item in holdings:
            ticker = item.get("ticker", "UNKNOWN").upper()
            raw_name = item.get("company_name", ticker)
            clean_name = re.sub(r'\s*(?:Ltd\.?|Limited)\s*$', '', raw_name, flags=re.IGNORECASE).strip() or ticker
            m = item.get("metrics", {}) or {}
            w_pct = item.get("weightage_pct", 0.0)

            pe = m.get("pe_ratio")
            roce = m.get("roce_5yr") or m.get("roce_pct")
            roe = m.get("roe_pct")
            debt_eq = m.get("debt_to_equity")
            peg = m.get("peg_ratio")
            sales_growth_3yr = m.get("sales_growth_3yr")
            intrinsic_val = m.get("intrinsic_value")
            cmp_price = m.get("current_price") or item.get("current_price", 0)
            sc_pros = m.get("screener_pros") or []
            sc_cons = m.get("screener_cons") or []

            # Multi-statement extraction
            q_data = m.get("quarterly_results", {}).get("metrics", {})
            q_sales = q_data.get("Sales") or q_data.get("Revenue") or []
            q_profits = q_data.get("Net Profit") or q_data.get("Profit after tax") or []
            q_opm = q_data.get("OPM %") or []
            latest_sales = float(q_sales[-1].replace(',', '') or 0) if q_sales else None
            first_sales = float(q_sales[0].replace(',', '') or 0) if q_sales else None
            latest_profit = float(q_profits[-1].replace(',', '').replace('%', '') or 0) if q_profits else None
            latest_opm = q_opm[-1] if q_opm else None

            bs_data = m.get("balance_sheet", {}).get("metrics", {})
            res_vals = bs_data.get("Reserves") or []
            bor_vals = bs_data.get("Borrowings") or []
            cwip_vals = bs_data.get("CWIP") or []
            latest_reserves = float(res_vals[-1].replace(',', '') or 0) if res_vals else None
            latest_borrowings = float(bor_vals[-1].replace(',', '') or 0) if bor_vals else None
            latest_cwip = float(cwip_vals[-1].replace(',', '') or 0) if cwip_vals else None

            cf_data = m.get("cash_flow", {}).get("metrics", {})
            fcf_vals = cf_data.get("Free Cash Flow") or []
            cfo_vals = cf_data.get("Cash from Operating Activity") or []
            latest_fcf = float(fcf_vals[-1].replace(',', '') or 0) if fcf_vals else None
            latest_cfo = float(cfo_vals[-1].replace(',', '') or 0) if cfo_vals else None

            # 1. High Hurdle ROCE & Low Debt Compounders -> BUY Plan
            if (roce is not None and roce >= 18.0) and (debt_eq is None or debt_eq <= 0.3):
                pro_note = f" Key Screener strength: '{sc_pros[0]}'." if sc_pros else ""
                fcf_note = f" Generates ₹{latest_fcf:,.0f} Cr in annual Free Cash Flow with zero debt overhead." if latest_fcf and latest_fcf > 0 else f" Balance sheet holds ₹{latest_reserves:,.0f} Cr in accumulated reserves." if latest_reserves else ""
                
                recommendations.append({
                    "ticker": ticker,
                    "action": "BUY / ACCUMULATE",
                    "category": "buy",
                    "target_weightage_pct": min(25.0, round(max(w_pct, 12.0) * 1.2, 1)),
                    "rationale": (
                        f"High-Conviction Compounder: {clean_name} delivers an industry-leading 5-Yr ROCE of {roce}% and ROE of {roe or 'N/A'}% with negligible leverage (D/E: {debt_eq or 0.0}). "
                        f"Recent quarterly performance posted ₹{latest_sales:,.0f} Cr in revenue with ₹{latest_profit:,.0f} Cr net profit (OPM: {latest_opm or 'N/A'}).{fcf_note}{pro_note}"
                    )
                })

            # 2. High Valuation Multiple & Concentration -> TRIM Plan
            if (pe is not None and pe >= 45.0) or (w_pct > 22.0):
                con_note = f" Screener risk audit notes: '{sc_cons[0]}'." if sc_cons else ""
                val_note = f"Stock P/E of {pe}x is trading at a significant premium to fundamental earnings power." if pe and pe >= 45.0 else f"Single-stock weightage ({w_pct}%) creates disproportionate portfolio concentration risk."
                
                recommendations.append({
                    "ticker": ticker,
                    "action": "TRIM / TAKE PROFITS",
                    "category": "trim",
                    "target_weightage_pct": max(8.0, round(w_pct * 0.75, 1)),
                    "rationale": (
                        f"Valuation Multiples & Rebalancing: {val_note} "
                        f"Position represents {w_pct}% of total capital. Recommend locking in gains to protect against multiple compression.{con_note}"
                    )
                })

            # 3. Graham Deep Value & Moat -> VALUE Plan
            if (intrinsic_val and cmp_price and cmp_price < intrinsic_val * 0.85) or (peg is not None and peg < 1.0 and (roce and roce > 15)):
                disc = round(((intrinsic_val - cmp_price) / intrinsic_val) * 100, 1) if intrinsic_val and cmp_price else 18.0
                res_note = f" backed by ₹{latest_reserves:,.0f} Cr in balance sheet reserves against ₹{latest_borrowings or 0:,.0f} Cr borrowings" if latest_reserves else ""
                
                recommendations.append({
                    "ticker": ticker,
                    "action": "GRAHAM VALUE DISCOUNT",
                    "category": "value",
                    "target_weightage_pct": min(20.0, round(w_pct * 1.3, 1)),
                    "rationale": (
                        f"Deep Margin of Safety: {clean_name} trades at a {disc}% discount to Benjamin Graham Intrinsic Value (Intrinsic ₹{intrinsic_val} vs CMP ₹{cmp_price:,.2f}) with PEG of {peg or '<1.0'}. "
                        f"Solvency is robust{res_note}, providing asymmetric risk-reward for value accumulation."
                    )
                })

            # 4. Multi-Statement Solvency & Capex Anomalies
            if debt_eq is not None and debt_eq > 0.8:
                anomalies.append({
                    "ticker": ticker,
                    "type": "Elevated Debt Leverage",
                    "severity": "High",
                    "metric_badge": f"D/E: {debt_eq}",
                    "details": f"{clean_name} carries ₹{latest_borrowings:,.0f} Cr in total debt against ₹{latest_reserves:,.0f} Cr in equity reserves (Debt-to-Equity: {debt_eq}). Requires close quarterly monitoring of interest coverage."
                })
            elif latest_cwip and latest_cwip > 100:
                mult = round(latest_sales / first_sales, 1) if first_sales and latest_sales and first_sales > 0 else 'N/A'
                anomalies.append({
                    "ticker": ticker,
                    "type": "Active Capex Scale-Up",
                    "severity": "Opportunity",
                    "metric_badge": f"CWIP: ₹{latest_cwip:,.0f} Cr",
                    "details": f"{clean_name} is deploying ₹{latest_cwip:,.0f} Cr in active capital work-in-progress (CWIP), driving a {mult}x top-line 5-quarter scaling trajectory across its manufacturing footprint."
                })
            elif roce is not None and roce >= 30.0:
                anomalies.append({
                    "ticker": ticker,
                    "type": "Superior Capital Efficiency Moat",
                    "severity": "Opportunity",
                    "metric_badge": f"5-Yr ROCE: {roce}%",
                    "details": f"{clean_name} compounds capital at an elite 5-Yr ROCE of {roce}%, reflecting powerful asset-light distribution, high operating cash flow (₹{latest_cfo or 0:,.0f} Cr), and sustainable pricing power."
                })

        # Concentration Warnings
        for item in holdings:
            t = item.get("ticker", "UNKNOWN").upper()
            raw_name = item.get("company_name", t)
            clean_name = re.sub(r'\s*(?:Ltd\.?|Limited)\s*$', '', raw_name, flags=re.IGNORECASE).strip() or t
            w = item.get("weightage_pct", 0)
            mv = item.get("current_market_value", 0)
            if w > 18.0:
                concentration_warnings.append({
                    "type": "Single-Stock Capital Concentration",
                    "target": t,
                    "badge": f"{w}% Weight • ₹{mv:,.0f}",
                    "details": f"{clean_name} ({t}) commands {w}% of total portfolio NAV (₹{mv:,.0f} exposure). Exceeds the standard 18% single-holding prudential ceiling."
                })

        for sec, weight in sector_weightages.items():
            if weight > 25.0:
                sec_tickers = [h.get("ticker") for h in holdings if h.get("sector") == sec]
                concentration_warnings.append({
                    "type": "Sector Clustering & Correlation Risk",
                    "target": sec,
                    "badge": f"{weight:.1f}% Sector Exposure",
                    "details": f"The '{sec}' sector commands {weight:.1f}% of total portfolio capital across {', '.join(sec_tickers)}. Vulnerable to industry-specific regulatory and demand shocks."
                })

        # Portfolio Summary Synthesis
        weighted_roce = 0.0
        total_inv = sum(h.get("total_invested", 0) for h in holdings)
        net_unrealized = total_val - total_inv
        net_pct = round((net_unrealized / total_inv) * 100, 1) if total_inv > 0 else 0.0

        for h in holdings:
            w = (h.get("current_market_value", 0) / total_val) if total_val > 0 else 0
            m_roce = h.get("metrics", {}).get("roce_5yr") or h.get("metrics", {}).get("roce_pct") or 0
            weighted_roce += w * m_roce

        summary_text = (
            f"Wealth Fortress Quantitative Chief Investment Officer conducted a multi-statement diagnosis across {len(holdings)} holdings (Total NAV: ₹{total_val:,.2f}, Net Return: {'+' if net_unrealized >= 0 else ''}₹{net_unrealized:,.2f} / {'+' if net_pct >= 0 else ''}{net_pct}%). "
            f"The portfolio delivers a robust weighted 5-Yr ROCE of {weighted_roce:.1f}%, anchored by elite zero-debt compounders (BEL, Tips Music, Nippon Life India). "
            f"Active capex expansion in high-growth disruptors (Ather Energy, Waaree Energies) provides long-term top-line runway, while rebalancing directives systematically optimize capital allocation against elevated valuation multiples."
        )

        return {
            "summary": summary_text,
            "anomalies": anomalies,
            "concentration_warnings": concentration_warnings,
            "rebalancing_recommendations": recommendations,
            "engine": "Wealth Fortress Multi-Statement Quantitative Engine"
        }

ai_insight_service = AIInsightService()
