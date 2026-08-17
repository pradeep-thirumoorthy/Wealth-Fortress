import re
import math
from bs4 import BeautifulSoup
from datetime import datetime
from typing import Optional, Dict, Any
from backend.models.metrics import StockMetricSchema

def round_2(val: Optional[float]) -> Optional[float]:
    if val is None or math.isnan(val):
        return None
    try:
        return round(float(val), 2)
    except (ValueError, TypeError):
        return None

def parse_screener_html_content(html_content: str, ticker: str) -> StockMetricSchema:
    soup = BeautifulSoup(html_content, "html.parser")

    # Company name from h1
    h1 = soup.find("h1")
    company_name = h1.get_text(strip=True) if h1 else f"{ticker.upper()} Ltd."

    # Company Profile / About description from Screener.in
    about_elem = soup.select_one(".about p") or soup.select_one("#company-info .about") or soup.select_one(".company-profile p") or soup.select_one(".about") or soup.select_one(".commentary")
    about_text = " ".join(about_elem.get_text().split()) if about_elem else None

    # Parse Screener.in official PROS and CONS from #analysis or .pros / .cons
    screener_pros = []
    for li in soup.select("#analysis .pros li, .pros li, #analysis .pros p, .pros p"):
        txt = " ".join(li.get_text().split()).strip()
        if txt and txt.lower() not in ["pros", "pro"] and txt not in screener_pros:
            screener_pros.append(txt)

    screener_cons = []
    for li in soup.select("#analysis .cons li, .cons li, #analysis .cons p, .cons p"):
        txt = " ".join(li.get_text().split()).strip()
        if txt and txt.lower() not in ["cons", "con"] and txt not in screener_cons:
            screener_cons.append(txt)

    raw_ratios: Dict[str, Any] = {}
    high_52w: Optional[float] = None
    low_52w: Optional[float] = None

    # 1. Parse all li elements in ul#top-ratios or .company-ratios
    ratios_container = soup.find("ul", id="top-ratios") or soup.find(class_="company-ratios")
    if ratios_container:
        for li in ratios_container.find_all("li"):
            name_span = li.find(class_="name")
            num_spans = li.find_all(class_="number")
            if name_span and num_spans:
                clean_name = " ".join(name_span.get_text().split()).lower()
                
                # Special handler for "High / Low" dual numbers
                if ("high" in clean_name and "low" in clean_name) or "high / low" in clean_name:
                    if len(num_spans) >= 2:
                        try:
                            h_str = num_spans[0].get_text(strip=True).replace(",", "").replace("₹", "").strip()
                            l_str = num_spans[1].get_text(strip=True).replace(",", "").replace("₹", "").strip()
                            high_52w = float(h_str)
                            low_52w = float(l_str)
                        except ValueError:
                            pass
                else:
                    for num_span in num_spans:
                        val_str = num_span.get_text(strip=True).replace(",", "").replace("%", "").replace("₹", "").strip()
                        if val_str:
                            try:
                                raw_ratios[clean_name] = float(val_str)
                                break
                            except ValueError:
                                pass

    # Helper function to find matching ratio value by partial key match
    def get_val(*keys: str) -> Optional[float]:
        for k in keys:
            for r_key, r_val in raw_ratios.items():
                if k in r_key:
                    return r_val
        return None

    current_price = get_val("current price")
    if current_price is None:
        price_header = soup.select_one("#top .font-size-18 .flex span")
        if price_header:
            raw_p = price_header.get_text(strip=True).replace("₹", "").replace(",", "").strip()
            try:
                current_price = float(raw_p)
            except ValueError:
                pass

    market_cap = get_val("market cap")
    pe_ratio = get_val("stock p/e", "p/e")
    book_value = get_val("book value")
    div_yield = get_val("dividend yield")
    
    roce_5yr = get_val("roce 5yr", "roce 5years", "roce 5")
    roce = get_val("roce") if not roce_5yr else raw_ratios.get("roce")

    roe_5yr = get_val("roe 5yr", "roe 5years", "roe 5")
    roe = get_val("roe") if not roe_5yr else raw_ratios.get("roe")

    face_val = get_val("face value")
    cmp_fcf = get_val("cmp / fcf", "cmp/fcf", "fcf")
    eps = get_val("eps")
    promoter_holding = get_val("promoter holding")
    pledged_pct = get_val("pledged percentage", "pledged")
    peg_ratio = get_val("peg ratio", "peg")
    profit_growth = get_val("profit growth")
    sales_growth_3yr = get_val("sales growth 3years", "sales growth 3yr", "sales growth 3")
    reserves_cr = get_val("reserves")
    profit_var_3yr = get_val("profit var 3yrs", "profit var 3yr", "profit var 3")
    sales_growth_5yr = get_val("sales growth 5years", "sales growth 5yr", "sales growth 5")
    debt_eq = get_val("debt to equity", "debt/equity", "debt eq")
    qtr_profit_var = get_val("qtr profit var", "quarter profit var")
    down_from_high = get_val("down from 52w high", "down from high")
    profit_var_5yr = get_val("profit var 5yrs", "profit var 5yr", "profit var 5")
    qtr_sales_var = get_val("qtr sales var", "quarter sales var")
    intrinsic_val = get_val("intrinsic value", "intrinsic")

    # 2. Extract missing ratios from Screener page section tables (Ranges tables, P&L, Balance Sheet, Shareholding, Quarters)
    for t in soup.select('table.ranges-table'):
        txt = t.get_text(' ', strip=True)
        if 'Compounded Sales Growth' in txt:
            if sales_growth_3yr is None:
                m3 = re.search(r'3 Years:\s*(-?\d+)%', txt)
                if m3: sales_growth_3yr = float(m3.group(1))
            if sales_growth_5yr is None:
                m5 = re.search(r'5 Years:\s*(-?\d+)%', txt)
                if m5: sales_growth_5yr = float(m5.group(1))
        elif 'Compounded Profit Growth' in txt:
            if profit_growth is None:
                mt = re.search(r'TTM:\s*(-?\d+)%', txt)
                if mt: profit_growth = float(mt.group(1))
            if profit_var_3yr is None:
                m3 = re.search(r'3 Years:\s*(-?\d+)%', txt)
                if m3: profit_var_3yr = float(m3.group(1))
            if profit_var_5yr is None:
                m5 = re.search(r'5 Years:\s*(-?\d+)%', txt)
                if m5: profit_var_5yr = float(m5.group(1))
        elif 'Return on Equity' in txt:
            if roe_5yr is None:
                m5 = re.search(r'5 Years:\s*(-?\d+)%', txt)
                if m5: roe_5yr = float(m5.group(1))

    # Quarterly results parsing & last 5 quarters financial statement extraction
    quarterly_results = None
    q_section = soup.select_one('#quarters') or soup.select_one('#quarterly-results')
    if q_section:
        table = q_section.find('table')
        if table:
            q_headers = []
            thead = table.find('thead')
            if thead:
                for th in thead.find_all(['th', 'td']):
                    t_text = th.get_text(strip=True)
                    if t_text and not t_text.startswith('Stand') and not t_text.startswith('View'):
                        q_headers.append(t_text)

            # Trim header label if present
            if q_headers and ('sales' in q_headers[0].lower() or 'quarter' in q_headers[0].lower() or q_headers[0] == ''):
                q_headers = q_headers[1:]

            # Keep last 5 quarters
            last_5_qtrs = q_headers[-5:] if len(q_headers) >= 5 else q_headers

            q_metrics = {}
            tbody = table.find('tbody')
            if tbody:
                for tr in tbody.find_all('tr'):
                    tds = tr.find_all(['td', 'th'])
                    if len(tds) < 2:
                        continue
                    row_name = tds[0].get_text(' ', strip=True).replace('+', '').strip()
                    row_vals = [td.get_text(strip=True) for td in tds[1:]]

                    if len(row_vals) >= len(q_headers):
                        last_5_vals = row_vals[-len(last_5_qtrs):]
                    else:
                        last_5_vals = row_vals

                    q_metrics[row_name] = last_5_vals

            quarterly_results = {
                "quarters": last_5_qtrs,
                "metrics": q_metrics
            }

        for tr in q_section.select('tr'):
            tds = tr.select('td, th')
            if not tds:
                continue
            first_text = tds[0].get_text(' ', strip=True).lower()
            
            # Sales / Revenue row
            if ('sales' in first_text or 'revenue' in first_text) and 'growth' not in first_text:
                if qtr_sales_var is None:
                    nums = []
                    for cell in tds[1:]:
                        raw_str = cell.get_text(strip=True).replace(',', '').replace('%', '')
                        c_str = re.sub(r'[^\d\.\-]', '', raw_str)
                        if c_str and c_str != '-':
                            try:
                                nums.append(float(c_str))
                            except ValueError:
                                pass
                    if len(nums) >= 5:
                        q_curr = nums[-1]
                        q_prev = nums[-5]
                        if q_prev != 0:
                            qtr_sales_var = round(((q_curr - q_prev) / abs(q_prev)) * 100, 2)
                    elif len(nums) >= 2:
                        q_curr = nums[-1]
                        q_prev = nums[-2]
                        if q_prev != 0:
                            qtr_sales_var = round(((q_curr - q_prev) / abs(q_prev)) * 100, 2)

            # Net Profit row
            elif ('net profit' in first_text or 'profit after tax' in first_text or 'pat' in first_text) and 'growth' not in first_text:
                if qtr_profit_var is None:
                    nums = []
                    for cell in tds[1:]:
                        raw_str = cell.get_text(strip=True).replace(',', '').replace('%', '')
                        c_str = re.sub(r'[^\d\.\-]', '', raw_str)
                        if c_str and c_str != '-':
                            try:
                                nums.append(float(c_str))
                            except ValueError:
                                pass
                    if len(nums) >= 5:
                        q_curr = nums[-1]
                        q_prev = nums[-5]
                        if q_prev != 0:
                            qtr_profit_var = round(((q_curr - q_prev) / abs(q_prev)) * 100, 2)
                    elif len(nums) >= 2:
                        q_curr = nums[-1]
                        q_prev = nums[-2]
                        if q_prev != 0:
                            qtr_profit_var = round(((q_curr - q_prev) / abs(q_prev)) * 100, 2)

    # Shareholding table fallback for Promoter Holding & Pledged %
    if promoter_holding is None:
        sh = soup.select_one('#shareholding')
        if sh:
            for tr in sh.select('tr'):
                if 'Promoters' in tr.get_text():
                    tds = [td.get_text(strip=True).replace('%', '') for td in tr.select('td')]
                    nums = [float(x) for x in tds if x and x.replace('.', '').replace('-', '').isdigit()]
                    if nums:
                        promoter_holding = nums[-1]

    # Pledged percentage fallback
    if pledged_pct is None:
        pledged_pct = 0.0

    # Balance sheet table fallback for Reserves & Debt/Equity
    borrowings_cr = None
    equity_cap_cr = None
    bs = soup.select_one('#balance-sheet')
    if bs:
        for tr in bs.select('tr'):
            txt = tr.get_text()
            if 'Reserves' in txt and reserves_cr is None:
                tds = [td.get_text(strip=True).replace(',', '') for td in tr.select('td')]
                nums = [float(x) for x in tds if x and x.replace('.', '').replace('-', '').isdigit()]
                if nums: reserves_cr = nums[-1]
            elif 'Borrowings' in txt:
                tds = [td.get_text(strip=True).replace(',', '') for td in tr.select('td')]
                nums = [float(x) for x in tds if x and x.replace('.', '').replace('-', '').isdigit()]
                if nums: borrowings_cr = nums[-1]
            elif 'Equity Capital' in txt:
                tds = [td.get_text(strip=True).replace(',', '') for td in tr.select('td')]
                nums = [float(x) for x in tds if x and x.replace('.', '').replace('-', '').isdigit()]
                if nums: equity_cap_cr = nums[-1]

    if debt_eq is None and borrowings_cr is not None and reserves_cr is not None:
        total_equity = (equity_cap_cr or 0.0) + reserves_cr
        if total_equity > 0:
            debt_eq = round(borrowings_cr / total_equity, 2)

    # P&L table fallback for EPS
    if eps is None:
        pl = soup.select_one('#profit-loss')
        if pl:
            for tr in pl.select('tr'):
                if 'EPS' in tr.get_text():
                    tds = [td.get_text(strip=True).replace(',', '') for td in tr.select('td')]
                    nums = [float(x) for x in tds if x and x.replace('.', '').replace('-', '').isdigit()]
                    if nums: eps = nums[-1]

    # 3. Derived Ratios & Calculations
    pb_ratio = None
    if current_price and book_value and book_value > 0:
        pb_ratio = round(current_price / book_value, 2)

    if down_from_high is None and current_price and high_52w and high_52w > 0:
        down_from_high = round(((high_52w - current_price) / high_52w) * 100, 2)

    if peg_ratio is None and pe_ratio and profit_var_3yr and profit_var_3yr > 0:
        peg_ratio = round(pe_ratio / profit_var_3yr, 2)

    # Accurate Benjamin Graham Intrinsic Value: sqrt(22.5 * EPS * Book Value)
    if eps and book_value and eps > 0 and book_value > 0:
        try:
            intrinsic_val = round(math.sqrt(22.5 * eps * book_value), 2)
        except ValueError:
            intrinsic_val = None
    elif eps is not None and eps <= 0:
        # Loss making company has 0.00 intrinsic valuation
        intrinsic_val = 0.00

    # Market Cap Category Classification
    market_cap_cat = None
    if market_cap:
        if market_cap >= 20000:
            market_cap_cat = "Large Cap"
        elif market_cap >= 5000:
            market_cap_cat = "Mid Cap"
        else:
            market_cap_cat = "Small Cap"

    # Extract Balance Sheet, Cash Flows, and Ratios statements (Last 5 Years)
    def _parse_sec_table(sec_id: str):
        sec = soup.select_one(f'#{sec_id}')
        if not sec: return None
        tbl = sec.find('table')
        if not tbl: return None
        th_list = []
        th_head = tbl.find('thead')
        if th_head:
            for th_cell in th_head.find_all(['th', 'td']):
                txt = th_cell.get_text(strip=True)
                if txt and not txt.startswith('Stand') and not txt.startswith('View'):
                    th_list.append(txt)
        if th_list and ('sales' in th_list[0].lower() or 'year' in th_list[0].lower() or 'mar' in th_list[0].lower() or th_list[0] == ''):
            th_list = th_list[1:]
        last_5_hdrs = th_list[-5:] if len(th_list) >= 5 else th_list
        sec_metrics = {}
        tb_body = tbl.find('tbody')
        if tb_body:
            for tr_row in tb_body.find_all('tr'):
                td_cells = tr_row.find_all(['td', 'th'])
                if len(td_cells) < 2: continue
                r_name = td_cells[0].get_text(' ', strip=True).replace('+', '').strip()
                r_vals = [c.get_text(strip=True) for c in td_cells[1:]]
                if len(r_vals) >= len(th_list):
                    sec_metrics[r_name] = r_vals[-len(last_5_hdrs):]
                else:
                    sec_metrics[r_name] = r_vals
        return {"quarters": last_5_hdrs, "metrics": sec_metrics}

    balance_sheet = _parse_sec_table('balance-sheet')
    cash_flow = _parse_sec_table('cash-flow')
    annual_ratios = _parse_sec_table('ratios')

    return StockMetricSchema(
        ticker=ticker.upper(),
        company_name=company_name,
        current_price=round_2(current_price),
        market_cap_cr=round_2(market_cap),
        high_52w=round_2(high_52w),
        low_52w=round_2(low_52w),
        pe_ratio=round_2(pe_ratio),
        book_value=round_2(book_value),
        pb_ratio=round_2(pb_ratio),
        dividend_yield_pct=round_2(div_yield),
        roce_pct=round_2(roce),
        roe_pct=round_2(roe),
        face_value=round_2(face_val),
        roce_5yr=round_2(roce_5yr or roce),
        roe_5yr=round_2(roe_5yr or roe),
        cmp_fcf=round_2(cmp_fcf),
        eps=round_2(eps),
        promoter_holding_pct=round_2(promoter_holding),
        pledged_pct=round_2(pledged_pct),
        peg_ratio=round_2(peg_ratio),
        profit_growth_pct=round_2(profit_growth),
        sales_growth_3yr=round_2(sales_growth_3yr),
        reserves_cr=round_2(reserves_cr),
        profit_var_3yr=round_2(profit_var_3yr),
        sales_growth_5yr=round_2(sales_growth_5yr),
        debt_to_equity=round_2(debt_eq),
        qtr_profit_var_pct=round_2(qtr_profit_var),
        down_from_52w_high_pct=round_2(down_from_high),
        profit_var_5yr=round_2(profit_var_5yr or profit_var_3yr),
        qtr_sales_var_pct=round_2(qtr_sales_var),
        intrinsic_value=round_2(intrinsic_val),
        market_cap_category=market_cap_cat,
        quarterly_results=quarterly_results,
        balance_sheet=balance_sheet,
        cash_flow=cash_flow,
        annual_ratios=annual_ratios,
        about=about_text,
        screener_pros=screener_pros,
        screener_cons=screener_cons,
        last_scraped_at=datetime.utcnow()
    )
