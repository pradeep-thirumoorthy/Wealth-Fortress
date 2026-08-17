import React from 'react';
import { Modal, Tag, Button, Card, Popover, Collapse } from 'antd';
import {
  BarChartOutlined,
  ExportOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined,
  RiseOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';

const RATIO_POPOVERS = {
  market_cap_cr: {
    title: 'Market Capitalization',
    formula: 'Current Price × Total Outstanding Shares',
    description: 'Total market value of a company’s outstanding equity shares in ₹ Crores.',
    green: 'Large Cap (> ₹20,000 Cr) - Stable & High Liquidity',
    yellow: 'Mid Cap (₹5,000 - ₹20,000 Cr) - Balanced Growth',
    red: 'Small Cap (< ₹5,000 Cr) - High Volatility Risk',
  },
  pe_ratio: {
    title: 'Stock P/E Ratio',
    formula: 'Current Market Price / Earnings Per Share (EPS)',
    description: 'Measures how much investors pay per rupee of current annual net profit.',
    green: '< 25.0 (Attractive / Undervalued)',
    yellow: '25.0 - 45.0 (Fair / Moderate Valuation)',
    red: '> 45.0 (Expensive / Growth Priced In)',
  },
  roce_pct: {
    title: 'ROCE % (Return on Capital Employed)',
    formula: 'EBIT / Capital Employed × 100',
    description: 'Measures overall profit efficiency on all operating capital invested.',
    green: '> 20.0% (Strong Business Moat)',
    yellow: '12.0% - 20.0% (Average Efficiency)',
    red: '< 12.0% (Poor Capital Efficiency)',
  },
  roce_5yr: {
    title: 'ROCE 5Yr %',
    formula: '5-Year Average Return on Capital Employed',
    description: 'Long-term multi-year capital compounding power across economic cycles.',
    green: '> 18.0% (Consistent Compounder)',
    yellow: '10.0% - 18.0% (Moderate Return)',
    red: '< 10.0% (Weak Long-term Efficiency)',
  },
  eps: {
    title: 'EPS (Earnings Per Share)',
    formula: 'Net Profit / Shares Outstanding',
    description: 'Portion of company’s profit allocated to each individual share of stock.',
    green: 'Consistently Growing YoY (Healthy Expansion)',
    yellow: 'Stable / Flat EPS (Stagnant Growth)',
    red: 'Negative EPS (Operating Losses)',
  },
  peg_ratio: {
    title: 'PEG Ratio (Price/Earnings to Growth)',
    formula: 'Stock P/E Ratio / Annual EPS Growth Rate %',
    description: 'P/E valuation adjusted for growth rate. Key Growth At Reasonable Price (GARP) metric.',
    green: '< 1.0 (Undervalued relative to Growth)',
    yellow: '1.0 - 2.0 (Fair Growth Value)',
    red: '> 2.0 (Overvalued relative to Growth)',
  },
  reserves_cr: {
    title: 'Reserves (₹ Cr)',
    formula: 'Retained Earnings + Premium Reserves',
    description: 'Accumulated profits retained to reinvest in expansion or buffer downturns.',
    green: '> 2× Total Borrowings (Fortress Balance Sheet)',
    yellow: '1-2× Total Borrowings (Adequate Cushion)',
    red: '< 1× Total Borrowings (Strained Capital Cushion)',
  },
  debt_to_equity: {
    title: 'Debt to Equity Ratio',
    formula: 'Total Borrowings / (Equity + Reserves)',
    description: 'Measures financial leverage and balance sheet solvency risk.',
    green: '< 0.50 (Low Debt / Highly Solvent)',
    yellow: '0.50 - 1.00 (Moderate Debt Risk)',
    red: '> 1.00 (High Leverage / Solvency Risk)',
  },
  profit_var_5yr: {
    title: 'Profit Var 5Yrs %',
    formula: '5-Year CAGR of Net Profit',
    description: '5-year compounded annual growth rate of company bottom-line profits.',
    green: '> 15.0% (Robust Profit Compounder)',
    yellow: '5.0% - 15.0% (Moderate Profit CAGR)',
    red: '< 5.0% (Poor Long-term Profit Growth)',
  },
  current_price: {
    title: 'Current Market Price (CMP)',
    formula: 'Real-time Stock Trading Price on NSE/BSE',
    description: 'Latest transaction price for one share of stock scraped from Screener.in.',
    green: 'CMP < Cost Basis (Accumulation Window)',
    yellow: 'CMP ≈ Cost Basis (Neutral Level)',
    red: 'CMP >> Intrinsic Valuation (Consider Rebalancing)',
  },
  book_value: {
    title: 'Book Value (Per Share)',
    formula: '(Total Assets - Total Liabilities) / Shares',
    description: 'Net asset value per share if the company were liquidated at book costs.',
    green: 'Price/Book < 3.0 (Attractive Asset Backing)',
    yellow: 'Price/Book 3.0 - 6.0 (Fair Asset Multiple)',
    red: 'Price/Book > 6.0 (Rich Asset Multiple)',
  },
  roe_pct: {
    title: 'ROE % (Return on Equity)',
    formula: 'Net Income / Shareholders’ Equity × 100',
    description: 'Measures management efficiency at generating profits from shareholder equity.',
    green: '> 18.0% (High Equity Return)',
    yellow: '10.0% - 18.0% (Moderate Equity Return)',
    red: '< 10.0% (Subpar Equity Return)',
  },
  roe_5yr: {
    title: 'ROE 5Yr %',
    formula: '5-Year Average Return on Equity',
    description: '5-year historical average return delivered to equity shareholders.',
    green: '> 16.0% (Long-term Shareholder Wealth Creation)',
    yellow: '10.0% - 16.0% (Average Equity Return)',
    red: '< 10.0% (Low Long-term Wealth Return)',
  },
  promoter_holding_pct: {
    title: 'Promoter Holding %',
    formula: '(Promoter Shares / Total Shares) × 100',
    description: 'Percentage of company ownership held by founding promoters and key insiders.',
    green: '> 50.0% (High Insider Skin in the Game)',
    yellow: '30.0% - 50.0% (Moderate Insider Ownership)',
    red: '< 30.0% (Low Insider Commitment Risk)',
  },
  profit_growth_pct: {
    title: 'Profit Growth % (TTM)',
    formula: 'Trailing 12-Month Net Profit Growth %',
    description: 'Recent 12-month net profit expansion rate.',
    green: '> 15.0% (Strong Near-term Profit Growth)',
    yellow: '0.0% - 15.0% (Slow Profit Growth)',
    red: '< 0.0% (Profit Contraction / Negative)',
  },
  profit_var_3yr: {
    title: 'Profit Var 3Yrs %',
    formula: '3-Year CAGR of Net Profit',
    description: '3-year annual compounded profit growth rate.',
    green: '> 15.0% (Strong Medium-term Expansion)',
    yellow: '5.0% - 15.0% (Steady Profit Growth)',
    red: '< 5.0% (Stagnant Bottom Line)',
  },
  qtr_profit_var_pct: {
    title: 'Qtr Profit Var %',
    formula: '(Latest Qtr Profit - YoY Qtr Profit) / YoY Qtr Profit × 100',
    description: 'Year-over-year quarterly profit variance rate.',
    green: '> 10.0% (Strong Quarterly Momentum)',
    yellow: '0.0% - 10.0% (Flat Quarter)',
    red: '< 0.0% (Quarterly Profit Decline)',
  },
  qtr_sales_var_pct: {
    title: 'Qtr Sales Var %',
    formula: '(Latest Qtr Revenue - YoY Qtr Revenue) / YoY Qtr Revenue × 100',
    description: 'Year-over-year quarterly top-line revenue variance.',
    green: '> 10.0% (Robust Demand Expansion)',
    yellow: '0.0% - 10.0% (Slow Quarterly Revenue)',
    red: '< 0.0% (Quarterly Revenue Contraction)',
  },
  high_52w: {
    title: '52-Week High / Low',
    formula: 'Peak and Trough Stock Prices over Past 52 Weeks',
    description: 'Trading range boundary over the last 1-year period.',
    green: 'Trading within 15% of 52w High (Strong Bullish Trend)',
    yellow: 'Mid-range Trading (Consolidation Phase)',
    red: 'Near 52w Low (> 30% Breakdown)',
  },
  dividend_yield_pct: {
    title: 'Dividend Yield %',
    formula: '(Annual Dividends / Current Price) × 100',
    description: 'Annual dividend return expressed as a percentage of share price.',
    green: '> 2.0% (Generous Income Yield)',
    yellow: '0.5% - 2.0% (Moderate Yield)',
    red: '< 0.5% (Low / Zero Yield)',
  },
  face_value: {
    title: 'Face Value (Par Value)',
    formula: 'Nominal Value per Share in Corporate Charter',
    description: 'Base value per share used for dividend payouts and stock split calculations.',
    green: 'Standard Par Value (₹10, ₹5, ₹2, ₹1)',
    yellow: 'Split Consideration',
    red: 'Non-standard Capital Structure',
  },
  cmp_fcf: {
    title: 'CMP / FCF Ratio',
    formula: 'Current Market Price / Free Cash Flow per Share',
    description: 'Valuation ratio comparing price to real cash generated after capital expenditure.',
    green: '< 20.0 (Strong Cash Generation relative to Valuation)',
    yellow: '20.0 - 35.0 (Moderate Cash Generation)',
    red: '> 35.0 or Negative (Poor Free Cash Conversion)',
  },
  pledged_pct: {
    title: 'Pledged Percentage %',
    formula: '(Pledged Shares / Total Promoter Shares) × 100',
    description: 'Percentage of promoter holdings mortgaged as loan collateral.',
    green: '0.0% (Zero Debt Pledge Risk)',
    yellow: '0.1% - 10.0% (Minor Pledge Cushion)',
    red: '> 10.0% (High Promoter Debt Distress Risk)',
  },
  sales_growth_3yr: {
    title: 'Sales Growth 3Years %',
    formula: '3-Year CAGR of Revenue',
    description: '3-year top-line revenue compounding growth rate.',
    green: '> 15.0% (Strong Revenue Expansion)',
    yellow: '5.0% - 15.0% (Moderate Top-line Growth)',
    red: '< 5.0% (Stagnant Revenue)',
  },
  sales_growth_5yr: {
    title: 'Sales Growth 5Years %',
    formula: '5-Year CAGR of Revenue',
    description: 'Long-term 5-year top-line revenue compounding rate.',
    green: '> 12.0% (Consistent Revenue Compounder)',
    yellow: '5.0% - 12.0% (Moderate 5Yr Growth)',
    red: '< 5.0% (Weak Top-line Growth)',
  },
  down_from_52w_high_pct: {
    title: 'Down from 52w High %',
    formula: '((52w High - Current Price) / 52w High) × 100',
    description: 'Percentage drawdown from the 1-year peak trading price.',
    green: '15.0% - 30.0% (Attractive Dip / Margin of Safety)',
    yellow: '< 15.0% (Trading Near Highs)',
    red: '> 40.0% (Severe Downtrend / Distressed)',
  },
  intrinsic_value: {
    title: 'Intrinsic Value (Graham Estimate)',
    formula: '√(22.5 × EPS × Book Value)',
    description: 'Benjamin Graham fundamental intrinsic value calculation.',
    green: 'Current Price < Intrinsic Value (Margin of Safety)',
    yellow: 'Current Price ± 15% Intrinsic Value (Fairly Valued)',
    red: 'Current Price > Intrinsic Value × 1.3 (Overvalued)',
  },
};

const getRatioColor = (ratioKey, val, metrics, holding) => {
  if (val === undefined || val === null || isNaN(val)) return '#5a6359';

  const num = Number(val);

  switch (ratioKey) {
    case 'pe_ratio':
      if (num < 25.0) return '#15803d';
      if (num <= 45.0) return '#b45309';
      return '#b91c1c';

    case 'roce_pct':
    case 'roce_5yr':
      if (num > 20.0) return '#15803d';
      if (num >= 12.0) return '#b45309';
      return '#b91c1c';

    case 'roe_pct':
    case 'roe_5yr':
      if (num > 18.0) return '#15803d';
      if (num >= 10.0) return '#b45309';
      return '#b91c1c';

    case 'debt_to_equity':
      if (num < 0.50) return '#15803d';
      if (num <= 1.00) return '#b45309';
      return '#b91c1c';

    case 'peg_ratio':
      if (num < 1.0) return '#15803d';
      if (num <= 2.0) return '#b45309';
      return '#b91c1c';

    case 'promoter_holding_pct':
      if (num > 50.0) return '#15803d';
      if (num >= 30.0) return '#b45309';
      return '#b91c1c';

    case 'pledged_pct':
      if (num === 0) return '#15803d';
      if (num <= 10.0) return '#b45309';
      return '#b91c1c';

    case 'profit_growth_pct':
    case 'profit_var_3yr':
    case 'profit_var_5yr':
    case 'sales_growth_3yr':
    case 'sales_growth_5yr':
      if (num > 15.0) return '#15803d';
      if (num >= 0.0) return '#b45309';
      return '#b91c1c';

    case 'qtr_profit_var_pct':
    case 'qtr_sales_var_pct':
      if (num > 10.0) return '#15803d';
      if (num >= 0.0) return '#b45309';
      return '#b91c1c';

    case 'dividend_yield_pct':
      if (num > 2.0) return '#15803d';
      if (num >= 0.5) return '#b45309';
      return '#b91c1c';

    case 'cmp_fcf':
      if (num > 0 && num < 20.0) return '#15803d';
      if (num >= 20.0 && num <= 35.0) return '#b45309';
      return '#b91c1c';

    case 'down_from_52w_high_pct':
      if (num >= 15.0 && num <= 35.0) return '#15803d';
      if (num < 15.0) return '#b45309';
      return '#b91c1c';

    case 'intrinsic_value': {
      const cmp = metrics.current_price || holding.current_price;
      if (!cmp) return '#15803d';
      if (cmp < num) return '#15803d';
      if (cmp <= num * 1.2) return '#b45309';
      return '#b91c1c';
    }

    default:
      return '#e87131';
  }
};

export const ViewRatiosModal = ({
  isOpen,
  onClose,
  holding,
}) => {
  if (!holding) return null;

  const m = holding.metrics || {};
  const ticker = holding.ticker;
  const screenerUrl = `https://www.screener.in/company/${ticker}/`;
  const lastChanged = m.last_changed_ratio;

  const roundTwo = (num) => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  };

  const fmtVal = (val, prefix = '', suffix = '') => {
    if (val === undefined || val === null || isNaN(val)) return 'N/A';
    return `${prefix}${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;
  };

  const fmtCurrency = (val) => {
    if (val === undefined || val === null || isNaN(val)) return 'N/A';
    return `₹ ${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const fmtPct = (val) => {
    if (val === undefined || val === null || isNaN(val)) return 'N/A';
    return `${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
  };

  const renderRatioCard = (ratioKey, label, rawVal, formattedStr) => {
    const dynamicColor = getRatioColor(ratioKey, rawVal, m, holding);

    // Check if this specific ratio card has the tracked change
    const isThisRatioChanged = lastChanged && (
      lastChanged.ratio_name.toLowerCase() === label.toLowerCase() ||
      label.toLowerCase().includes(lastChanged.ratio_name.toLowerCase()) ||
      lastChanged.ratio_name.toLowerCase().includes(label.toLowerCase())
    );

    const isInc = lastChanged?.direction === 'INCREASED';

    const pop = RATIO_POPOVERS[ratioKey] || {
      title: label,
      formula: 'Derived / Scraped Metric',
      description: `Screener.in ratio analysis metric for ${label}.`,
      green: 'Attractive Range',
      yellow: 'Moderate Range',
      red: 'High Risk Range',
    };

    const popoverContent = (
      <div className="max-w-xs p-2 font-['Plus_Jakarta_Sans',sans-serif] text-xs text-[#5a6359] flex flex-col gap-2">
        <div className="font-bold text-[#e87131] text-sm border-b border-[#fbeed6] pb-1 flex items-center justify-between">
          <span>{pop.title}</span>
        </div>

        <div>
          <span className="font-bold text-[#5a6359] block text-[10px] uppercase tracking-wider mb-0.5">Formula</span>
          <span className="font-mono bg-[#fdf9ec] px-2 py-1 rounded block text-[#e87131] border border-[#fbeed6] text-[11px] font-semibold">
            {pop.formula}
          </span>
        </div>

        <div>
          <span className="font-bold text-[#5a6359] block text-[10px] uppercase tracking-wider mb-0.5">Description</span>
          <p className="m-0 text-[#5a6359] text-[11px] leading-relaxed font-medium">{pop.description}</p>
        </div>

        {/* Color-Coded Benchmark Ranges */}
        <div>
          <span className="font-bold text-[#5a6359] block text-[10px] uppercase tracking-wider mb-1">Benchmark Analysis Ranges</span>
          <div className="flex flex-col gap-1 text-[11px]">
            <div className="flex items-center gap-1.5 bg-[#fdf9ec] border border-emerald-200 p-1.5 rounded-lg text-emerald-800">
              <Tag color="success" className="m-0 text-[10px] font-bold">GREEN</Tag>
              <span className="font-semibold">{pop.green}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#fdf9ec] border border-amber-200 p-1.5 rounded-lg text-amber-800">
              <Tag color="warning" className="m-0 text-[10px] font-bold">YELLOW</Tag>
              <span className="font-semibold">{pop.yellow}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#fdf9ec] border border-rose-200 p-1.5 rounded-lg text-rose-800">
              <Tag color="error" className="m-0 text-[10px] font-bold">RED</Tag>
              <span className="font-semibold">{pop.red}</span>
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <Popover content={popoverContent} placement="top" trigger="click" key={ratioKey}>
        <Card
          size="small"
          className={`card-pick-elevation bg-[#fdf9ec] cursor-pointer rounded-xl transition-all h-full flex flex-col justify-between ${
            isThisRatioChanged ? 'border-2 border-[#e87131] ring-2 ring-[#e87131]/30 bg-[#fffef9]' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5a6359] flex items-center gap-1">
              {label}
              <InfoCircleOutlined className="text-[#e87131] text-[10px]" />
            </span>
          </div>

          <div className="mt-1 flex items-baseline justify-between">
            <div className="text-sm font-extrabold font-mono" style={{ color: dynamicColor }}>
              {formattedStr}
            </div>

            {/* Display exact Delta Change Badge inside this specific ratio card (Arrow, Increased Amount, % Change) */}
            {isThisRatioChanged && (() => {
              const oldValNum = Number(lastChanged.old_value);
              const newValNum = Number(lastChanged.new_value);
              let diffStr = '';
              if (!isNaN(oldValNum) && !isNaN(newValNum)) {
                const diff = roundTwo(newValNum - oldValNum);
                diffStr = (diff >= 0 ? '+' : '') + diff;
              }
              return (
                <Tag
                  color={isInc ? 'success' : 'error'}
                  icon={isInc ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  className="m-0 text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md shadow-xs animate-pulse"
                >
                  {diffStr ? `${diffStr} ` : ''}({isInc ? '+' : ''}{lastChanged.change_pct}%)
                </Tag>
              );
            })()}
          </div>
        </Card>
      </Popover>
    );
  };

  // Helper to render Category Panel Header with hover Popover if a ratio in this category changed
  const renderCategoryHeader = (title, icon, count, labels, colorClass, bgClass) => {
    const matchedChange = lastChanged && labels.some((lbl) =>
      lastChanged.ratio_name.toLowerCase() === lbl.toLowerCase() ||
      lbl.toLowerCase().includes(lastChanged.ratio_name.toLowerCase()) ||
      lastChanged.ratio_name.toLowerCase().includes(lbl.toLowerCase())
    ) ? lastChanged : null;

    const isInc = matchedChange?.direction === 'INCREASED';

    const popoverContent = matchedChange ? (
      <div className="p-2.5 font-mono text-xs max-w-xs space-y-1.5 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="font-bold text-[#e87131] text-xs border-b border-[#fbeed6] pb-1 flex items-center justify-between">
          <span>Category Ratio Change</span>
          <Tag color={isInc ? 'success' : 'error'} className="m-0 text-[10px] font-bold">
            {matchedChange.direction}
          </Tag>
        </div>
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="font-bold text-[#5a6359]">{matchedChange.ratio_name}:</span>
          <span className="font-bold text-[#e87131]">
            {matchedChange.old_value} ➔ {matchedChange.new_value}
          </span>
        </div>
        <div className="text-[11px] text-[#5a6359]/80 font-medium">
          Net Change: <strong className={isInc ? 'text-emerald-700' : 'text-rose-700'}>({isInc ? '+' : ''}{matchedChange.change_pct}%)</strong>
        </div>
      </div>
    ) : null;

    return (
      <span className="font-bold text-[#5a6359] flex items-center justify-between w-full pr-4 text-sm">
        <span className="flex items-center gap-2">
          {icon}
          {title}
          <Tag className={`ml-2 rounded-full border-0 ${bgClass} ${colorClass} font-mono font-bold text-xs`}>
            {count} Ratios
          </Tag>
        </span>

        {/* Hover Popover Badge on Category Header when a ratio in this category changed */}
        {matchedChange && (
          <Popover content={popoverContent} placement="top" trigger="hover">
            <Tag
              color={isInc ? 'success' : 'error'}
              icon={isInc ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              className="m-0 text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-lg shadow-sm animate-pulse cursor-pointer"
            >
              {matchedChange.ratio_name}: {matchedChange.direction} ({isInc ? '+' : ''}{matchedChange.change_pct}%)
            </Tag>
          </Popover>
        )}
      </span>
    );
  };

  // Antd Collapse Panel Items Grouped into Exactly 4 Categories
  const collapseItems = [
    {
      key: 'valuation',
      label: renderCategoryHeader(
        'Valuation & Per Share Metrics',
        <DollarOutlined className="text-[#e87131]" />,
        10,
        ['Current Price', 'Market Cap', 'Stock P/E', 'PEG Ratio', 'Book Value', 'EPS', 'Intrinsic Value', 'Dividend Yield', 'Face Value', 'CMP / FCF'],
        'text-[#e87131]',
        'bg-[#e87131]/10'
      ),
      children: (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {renderRatioCard('current_price', 'Current Price', m.current_price || holding.current_price, fmtCurrency(m.current_price || holding.current_price))}
          {renderRatioCard('market_cap_cr', 'Market Cap', m.market_cap_cr, fmtVal(m.market_cap_cr, '₹ ', ' Cr.'))}
          {renderRatioCard('pe_ratio', 'Stock P/E', m.pe_ratio, fmtVal(m.pe_ratio))}
          {renderRatioCard('peg_ratio', 'PEG Ratio', m.peg_ratio, fmtVal(m.peg_ratio))}
          {renderRatioCard('book_value', 'Book Value', m.book_value, fmtCurrency(m.book_value))}
          {renderRatioCard('eps', 'EPS', m.eps, fmtCurrency(m.eps))}
          {renderRatioCard('intrinsic_value', 'Intrinsic Value', m.intrinsic_value, fmtCurrency(m.intrinsic_value))}
          {renderRatioCard('dividend_yield_pct', 'Dividend Yield', m.dividend_yield_pct, fmtPct(m.dividend_yield_pct))}
          {renderRatioCard('face_value', 'Face Value', m.face_value, fmtCurrency(m.face_value))}
          {renderRatioCard('cmp_fcf', 'CMP / FCF', m.cmp_fcf, fmtVal(m.cmp_fcf))}
        </div>
      ),
    },
    {
      key: 'profitability',
      label: renderCategoryHeader(
        'Profitability & Returns',
        <RiseOutlined className="text-[#e87131]" />,
        4,
        ['ROCE', 'ROCE 5Yr', 'ROE', 'ROE 5Yr'],
        'text-emerald-700',
        'bg-emerald-500/10'
      ),
      children: (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {renderRatioCard('roce_pct', 'ROCE', m.roce_pct, fmtPct(m.roce_pct))}
          {renderRatioCard('roce_5yr', 'ROCE 5Yr', m.roce_5yr, fmtPct(m.roce_5yr))}
          {renderRatioCard('roe_pct', 'ROE', m.roe_pct, fmtPct(m.roe_pct))}
          {renderRatioCard('roe_5yr', 'ROE 5Yr', m.roe_5yr, fmtPct(m.roe_5yr))}
        </div>
      ),
    },
    {
      key: 'growth',
      label: renderCategoryHeader(
        'Growth & Quarterly Dynamics',
        <ThunderboltOutlined className="text-[#e87131]" />,
        7,
        ['Profit growth', 'Profit Var 3Yrs', 'Profit Var 5Yrs', 'Sales growth 3Years', 'Sales growth 5Years', 'Qtr Profit Var', 'Qtr Sales Var'],
        'text-blue-700',
        'bg-blue-500/10'
      ),
      children: (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {renderRatioCard('profit_growth_pct', 'Profit growth', m.profit_growth_pct, fmtPct(m.profit_growth_pct))}
          {renderRatioCard('profit_var_3yr', 'Profit Var 3Yrs', m.profit_var_3yr, fmtPct(m.profit_var_3yr))}
          {renderRatioCard('profit_var_5yr', 'Profit Var 5Yrs', m.profit_var_5yr, fmtPct(m.profit_var_5yr))}
          {renderRatioCard('sales_growth_3yr', 'Sales growth 3Years', m.sales_growth_3yr, fmtPct(m.sales_growth_3yr))}
          {renderRatioCard('sales_growth_5yr', 'Sales growth 5Years', m.sales_growth_5yr, fmtPct(m.sales_growth_5yr))}
          {renderRatioCard('qtr_profit_var_pct', 'Qtr Profit Var', m.qtr_profit_var_pct, fmtPct(m.qtr_profit_var_pct))}
          {renderRatioCard('qtr_sales_var_pct', 'Qtr Sales Var', m.qtr_sales_var_pct, fmtPct(m.qtr_sales_var_pct))}
        </div>
      ),
    },
    {
      key: 'solvency',
      label: renderCategoryHeader(
        'Solvency, Ownership & Technicals',
        <SafetyCertificateOutlined className="text-[#e87131]" />,
        6,
        ['Debt to equity', 'Reserves', 'Promoter holding', 'Pledged percentage', 'High / Low', 'Down from 52w high'],
        'text-purple-700',
        'bg-purple-500/10'
      ),
      children: (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {renderRatioCard('debt_to_equity', 'Debt to equity', m.debt_to_equity, fmtVal(m.debt_to_equity))}
          {renderRatioCard('reserves_cr', 'Reserves', m.reserves_cr, fmtVal(m.reserves_cr, '₹ ', ' Cr.'))}
          {renderRatioCard('promoter_holding_pct', 'Promoter holding', m.promoter_holding_pct, fmtPct(m.promoter_holding_pct))}
          {renderRatioCard('pledged_pct', 'Pledged percentage', m.pledged_pct, fmtPct(m.pledged_pct))}
          {renderRatioCard('high_52w', 'High / Low', m.high_52w, m.high_52w && m.low_52w ? `₹ ${m.high_52w} / ${m.low_52w}` : 'N/A')}
          {renderRatioCard('down_from_52w_high_pct', 'Down from 52w high', m.down_from_52w_high_pct, fmtPct(m.down_from_52w_high_pct))}
        </div>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div className="flex items-center justify-between pr-8">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#e87131]/15 border border-[#e87131]/30 flex items-center justify-center text-[#e87131]">
              <BarChartOutlined />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-extrabold text-[#5a6359] font-mono">{holding.ticker}</span>
                <Tag className="font-semibold rounded-full border-0 bg-[#e87131]/15 text-[#e87131]">
                  {holding.sector || 'Uncategorized'}
                </Tag>
                {(() => {
                  const mcap = m.market_cap_cr;
                  let cat = m.market_cap_category;
                  if (!cat && mcap) {
                    if (mcap >= 20000) cat = 'Large Cap';
                    else if (mcap >= 5000) cat = 'Mid Cap';
                    else cat = 'Small Cap';
                  }
                  if (!cat) return null;
                  return (
                    <Tag color={cat === 'Large Cap' ? 'processing' : cat === 'Mid Cap' ? 'success' : 'warning'} className="font-bold font-mono rounded-full text-xs">
                      {cat}
                    </Tag>
                  );
                })()}
              </div>
              <p className="text-xs text-[#5a6359]/80 m-0">{holding.company_name} • Click ratio card to view benchmark popover</p>
            </div>
          </div>

          <Button
            type="link"
            icon={<ExportOutlined />}
            href={screenerUrl}
            target="_blank"
            className="text-[#e87131] font-semibold text-xs hover:text-[#e87131]/80"
          >
            Screener.in Page
          </Button>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose} className="bg-[#e87131] hover:bg-[#e87131]/90 border-0 rounded-xl font-semibold">
          Close Ratios Modal
        </Button>,
      ]}
      width={1050}
      centered
      className="antd-custom-modal"
    >
      <div className="py-2 bg-[rgb(255_254_249)]">
        {/* Ant Design Collapse (Closed/Collapsed by default at first) */}
        <Collapse
          defaultActiveKey={[]}
          expandIconPosition="end"
          className="bg-transparent border-0 space-y-3"
          items={collapseItems}
        />

        {/* Footer timestamp */}
        <div className="mt-4 p-3 rounded-xl bg-[#fdf9ec] border border-[#fbeed6] text-xs text-[#5a6359] flex items-center justify-between font-mono">
          <span className="flex items-center gap-1.5">
            <ClockCircleOutlined className="text-[#e87131]" />
            MongoDB Last Scraped:
          </span>
          <span className="font-semibold text-[#5a6359]">
            {m.last_scraped_at ? new Date(m.last_scraped_at).toLocaleString() : 'Just now'}
          </span>
        </div>

      </div>
    </Modal>
  );
};
