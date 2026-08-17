import React, { useState, useMemo } from 'react';
import { Card, Table, Tag, Select, Button, Space, Row, Col, Alert, Progress } from 'antd';
import {
  CalendarOutlined,
  SyncOutlined,
  RiseOutlined,
  FallOutlined,
  StockOutlined,
  TrophyOutlined,
  WarningOutlined,
  AlertOutlined,
  ThunderboltOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
  AimOutlined,
  BankOutlined,
  DollarOutlined,
  LineChartOutlined,
  StarFilled,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CompassOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  QuestionCircleOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
  RocketOutlined,
  FundProjectionScreenOutlined,
} from '@ant-design/icons';

const { Option } = Select;

// Helper to determine if a financial metric is a Cost/Expense/Liability burden from an investor's perspective
const isCostMetric = (metricName = '') => {
  const lower = metricName.toLowerCase();
  return (
    lower.includes('expense') ||
    lower.includes('interest') ||
    lower.includes('tax') ||
    lower.includes('depreciation') ||
    lower.includes('borrowing') ||
    lower.includes('liabilit') ||
    lower.includes('debtor days') ||
    lower.includes('inventory days') ||
    lower.includes('cash conversion') ||
    lower.includes('working capital days')
  );
};

// Helper to extract numerical difference between latest and previous period for any metric in statement data
const getLatestDelta = (statementData, metricKey, isCost = false) => {
  if (!statementData || !statementData.metrics || !statementData.quarters || statementData.quarters.length < 2) {
    return null;
  }

  const quarters = statementData.quarters;
  const prevQtr = quarters[quarters.length - 2];
  const latestQtr = quarters[quarters.length - 1];

  const metricsMap = statementData.metrics;
  const foundKey = Object.keys(metricsMap).find(
    (k) => k.toLowerCase().includes(metricKey.toLowerCase())
  );

  if (!foundKey) return null;

  const vals = metricsMap[foundKey] || [];
  if (vals.length < 2) return null;

  const prevStr = vals[vals.length - 2];
  const currStr = vals[vals.length - 1];

  const prevNum = parseFloat((prevStr || '').replace(/,/g, '').replace(/%/g, '').replace(/₹/g, ''));
  const currNum = parseFloat((currStr || '').replace(/,/g, '').replace(/%/g, '').replace(/₹/g, ''));

  if (isNaN(prevNum) || isNaN(currNum)) return null;

  const delta = currNum - prevNum;
  const pctChg = prevNum !== 0 ? (delta / Math.abs(prevNum)) * 100 : 0;

  const isFavorable = isCost ? delta < 0 : delta > 0;
  const isAdverse = isCost ? delta > 0 : delta < 0;

  return {
    metricName: foundKey,
    prevQtr,
    latestQtr,
    prevNum,
    currNum,
    delta,
    pctChg: parseFloat(pctChg.toFixed(1)),
    isFavorable,
    isAdverse,
  };
};

// Generic reusable Financial Statement Card Component
const FinancialStatementCard = ({
  title,
  subtitle,
  icon,
  statementData,
  periodLabel = 'YoY',
}) => {
  const rowStats = useMemo(() => {
    if (!statementData || !statementData.metrics || !statementData.quarters) return {};
    const stats = {};

    Object.entries(statementData.metrics).forEach(([metricName, rawVals]) => {
      const parsedNums = (rawVals || []).map((v) => {
        const cleaned = (v || '').replace(/,/g, '').replace(/%/g, '').replace(/₹/g, '').trim();
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
      });

      const validNums = parsedNums.filter((n) => n !== null);
      if (validNums.length > 0) {
        const maxVal = Math.max(...validNums);
        const minVal = Math.min(...validNums);
        const latestVal = parsedNums[parsedNums.length - 1];

        stats[metricName] = {
          maxVal,
          minVal,
          latestVal,
          rawLatest: rawVals[rawVals.length - 1],
          isLatestMax: latestVal !== null && latestVal === maxVal && maxVal !== minVal,
          isLatestMin: latestVal !== null && latestVal === minVal && maxVal !== minVal,
        };
      }
    });

    return stats;
  }, [statementData]);

  const { columns, dataSource } = useMemo(() => {
    if (!statementData || !statementData.quarters || statementData.quarters.length === 0) {
      return { columns: [], dataSource: [] };
    }

    const quarters = statementData.quarters;
    const lastQtrIndex = quarters.length - 1;

    const baseCols = [
      {
        title: <span className="font-extrabold text-[#5a6359] text-xs">Metric / Line Item</span>,
        dataIndex: 'metric_name',
        key: 'metric_name',
        fixed: 'left',
        width: 220,
        render: (text) => {
          const isBold = [
            'Sales', 'Operating Profit', 'Profit before tax', 'Net Profit', 'EPS in Rs',
            'Total Liabilities', 'Total Assets', 'Net Cash Flow', 'Free Cash Flow', 'ROCE %'
          ].includes(text);
          const isCost = isCostMetric(text);
          return (
            <div className="flex items-center space-x-1.5">
              <span className={`text-xs font-mono ${isBold ? 'font-extrabold text-[#5a6359]' : 'font-medium text-[#5a6359]/80'}`}>
                {text}
              </span>
              {isCost && (
                <Tag className="font-mono text-[9px] border-0 bg-amber-100 text-amber-800 px-1 py-0 rounded">
                  Cost/Liability
                </Tag>
              )}
            </div>
          );
        },
      },
    ];

    const qtrCols = [];
    quarters.forEach((qtr, qIdx) => {
      const isLatestQ = qIdx === lastQtrIndex;

      // Insert 2 SEPARATE dedicated columns right before the latest period column!
      if (isLatestQ && quarters.length >= 2) {
        const prevQtrName = quarters[qIdx - 1];

        // 1. Column 1: Delta Amount & %
        qtrCols.push({
          title: (
            <div className="flex flex-col items-center justify-center text-center py-0.5">
              <span className="font-extrabold text-xs font-mono text-[#e87131] uppercase tracking-tight flex items-center gap-1">
                <ThunderboltOutlined /> {periodLabel} Delta
              </span>
              <span className="text-[9px] font-mono text-[#5a6359]/80 font-bold">
                ({prevQtrName} ➔ {qtr})
              </span>
            </div>
          ),
          key: 'delta_col',
          align: 'center',
          width: 165,
          className: 'bg-[#fdf9ec] border-l border-r border-[#e87131]/30 shadow-xs',
          render: (_, record) => {
            const metricName = record.metric_name;
            const isCost = isCostMetric(metricName);

            const prevStr = record[`q_${qIdx - 1}`];
            const currStr = record[`q_${qIdx}`];

            const prevNum = parseFloat((prevStr || '').replace(/,/g, '').replace(/%/g, '').replace(/₹/g, ''));
            const currNum = parseFloat((currStr || '').replace(/,/g, '').replace(/%/g, '').replace(/₹/g, ''));

            if (isNaN(prevNum) || isNaN(currNum)) {
              return <span className="text-xs text-[#5a6359]/50">-</span>;
            }

            const delta = currNum - prevNum;
            const pctChg = prevNum !== 0 ? ((delta / Math.abs(prevNum)) * 100).toFixed(1) : null;
            
            const isFavorable = isCost ? delta < 0 : delta > 0;
            const isAdverse = isCost ? delta > 0 : delta < 0;

            const formattedDelta = `${delta > 0 ? '+' : ''}${delta.toFixed(2)}`;
            const formattedPct = pctChg !== null ? `${pctChg > 0 ? '+' : ''}${pctChg}%` : '';

            return (
              <Tag
                className={`font-mono text-xs font-bold rounded-md m-0 px-2 py-0.5 flex items-center justify-center gap-1 border-0 ${
                  isFavorable
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : isAdverse
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-gray-100 text-[#5a6359]'
                }`}
              >
                {delta > 0 ? (
                  <CaretUpOutlined className={isAdverse ? 'text-rose-600' : 'text-emerald-600'} />
                ) : delta < 0 ? (
                  <CaretDownOutlined className={isAdverse ? 'text-rose-600' : 'text-emerald-600'} />
                ) : null}
                <span>{formattedDelta}</span>
                {formattedPct && <span className="opacity-80 text-[10px]">({formattedPct})</span>}
              </Tag>
            );
          },
        });

        // 2. Column 2: Investor Impact Status Tag
        qtrCols.push({
          title: (
            <div className="flex flex-col items-center justify-center text-center py-0.5">
              <span className="font-extrabold text-xs font-mono text-[#e87131] uppercase tracking-tight flex items-center gap-1">
                <AimOutlined /> Impact Status
              </span>
              <span className="text-[9px] font-mono text-[#5a6359]/80 font-bold">
                (Investor View)
              </span>
            </div>
          ),
          key: 'status_col',
          align: 'center',
          width: 140,
          className: 'bg-[#fdf9ec] border-r border-[#e87131]/30 shadow-xs',
          render: (_, record) => {
            const metricName = record.metric_name;
            const stat = rowStats[metricName];
            const isCost = isCostMetric(metricName);

            const prevStr = record[`q_${qIdx - 1}`];
            const currStr = record[`q_${qIdx}`];

            const prevNum = parseFloat((prevStr || '').replace(/,/g, '').replace(/%/g, '').replace(/₹/g, ''));
            const currNum = parseFloat((currStr || '').replace(/,/g, '').replace(/%/g, '').replace(/₹/g, ''));

            if (isNaN(prevNum) || isNaN(currNum)) {
              return <span className="text-xs text-[#5a6359]/50">-</span>;
            }

            const delta = currNum - prevNum;
            const isFavorable = isCost ? delta < 0 : delta > 0;
            const isAdverse = isCost ? delta > 0 : delta < 0;

            const isPeakFavorable = isCost ? stat?.isLatestMin : stat?.isLatestMax;
            const isPeakAdverse = isCost ? stat?.isLatestMax : stat?.isLatestMin;

            if (isPeakFavorable) {
              return (
                <Tag color="success" className="font-mono text-[10px] font-extrabold m-0 px-2 py-0.5 border-0 rounded-md">
                  {isCost ? '🟢 Low Burden' : '🏆 Peak'}
                </Tag>
              );
            }

            if (isPeakAdverse) {
              return (
                <Tag color="error" className="font-mono text-[10px] font-extrabold m-0 px-2 py-0.5 border-0 rounded-md">
                  {isCost ? '⚠️ Peak Cost' : '🚨 Low'}
                </Tag>
              );
            }

            if (isFavorable) {
              return (
                <Tag color="success" className="font-mono text-[10px] font-bold m-0 px-2 py-0.5 border-0 rounded-md bg-emerald-50 text-emerald-700">
                  🟢 Favorable
                </Tag>
              );
            }

            if (isAdverse) {
              return (
                <Tag color="error" className="font-mono text-[10px] font-bold m-0 px-2 py-0.5 border-0 rounded-md bg-rose-50 text-rose-700">
                  🔴 Adverse
                </Tag>
              );
            }

            return (
              <Tag className="font-mono text-[10px] font-medium m-0 px-2 py-0.5 border-0 bg-gray-100 text-[#5a6359]">
                ➖ Flat
              </Tag>
            );
          },
        });
      }

      // Period Columns (Q1-Q5 / FY1-FY5)
      qtrCols.push({
        title: (
          <div className="flex flex-col items-end">
            <span className="font-extrabold text-xs font-mono text-[#5a6359]">
              {qtr}
            </span>
          </div>
        ),
        dataIndex: `q_${qIdx}`,
        key: `q_${qIdx}`,
        align: 'right',
        render: (val, record) => {
          const metricName = record.metric_name;
          const numVal = parseFloat((val || '').replace(/,/g, ''));
          const isNeg = !isNaN(numVal) && numVal < 0;
          const isPos = !isNaN(numVal) && numVal > 0;

          if (['Operating Profit', 'Net Profit', 'OPM %', 'Net Cash Flow', 'Free Cash Flow', 'ROCE %'].includes(metricName)) {
            return (
              <span className={`font-mono text-xs font-bold ${isPos ? 'text-emerald-700' : isNeg ? 'text-rose-600' : 'text-[#5a6359]'}`}>
                {val}
              </span>
            );
          }

          return (
            <span className="font-mono text-xs font-bold text-[#5a6359]">
              {val || '-'}
            </span>
          );
        },
      });
    });

    const metricsMap = statementData.metrics || {};
    const rows = Object.entries(metricsMap).map(([rowTitle, vals], rIdx) => {
      const rowObj = {
        key: String(rIdx),
        metric_name: rowTitle,
      };
      quarters.forEach((_, qIdx) => {
        rowObj[`q_${qIdx}`] = vals[qIdx] || '-';
      });
      return rowObj;
    });

    return { columns: [...baseCols, ...qtrCols], dataSource: rows };
  }, [statementData, periodLabel, rowStats]);

  if (!statementData || !dataSource || dataSource.length === 0) {
    return (
      <Card className="card-pick-elevation bg-[#fffef9] rounded-2xl mb-8 p-6 text-center">
        <div className="flex items-center justify-center space-x-2 text-[#5a6359] mb-2">
          {icon}
          <h4 className="text-sm font-bold m-0">{title}</h4>
        </div>
        <p className="text-xs text-[#5a6359]/70 font-medium">Statement data not scraped yet. Click 'Sync Screener' above to load.</p>
      </Card>
    );
  }

  return (
    <Card className="card-pick-elevation bg-[#fffef9] rounded-2xl mb-8 p-2">
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-[#e87131]/15 text-[#e87131] flex items-center justify-center text-lg">
            {icon}
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-[#5a6359] m-0">{title}</h4>
            <span className="text-[11px] text-[#5a6359]/70 font-medium">{subtitle}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Tag color="orange" className="font-mono text-[10px] font-bold rounded-md">
            ⚡ {periodLabel} Impact Columns
          </Tag>
          <Tag color="success" className="font-mono text-[10px] font-bold rounded-md">
            🟢 Favorable
          </Tag>
          <Tag color="error" className="font-mono text-[10px] font-bold rounded-md">
            🔴 Adverse
          </Tag>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        size="small"
        bordered
        scroll={{ x: 'max-content' }}
        className="antd-custom-table"
      />
    </Card>
  );
};

export const QuarterlyResultsTab = ({
  holdings,
  onTriggerScrape,
  isScraping,
}) => {
  const [selectedTicker, setSelectedTicker] = useState(() => {
    return holdings && holdings.length > 0 ? holdings[0].ticker : '';
  });

  const selectedHolding = useMemo(() => {
    if (!holdings || holdings.length === 0) return null;
    return holdings.find((h) => h.ticker === selectedTicker) || holdings[0];
  }, [holdings, selectedTicker]);

  const metrics = useMemo(() => {
    return selectedHolding?.metrics || {};
  }, [selectedHolding]);

  const quarterlyData = useMemo(() => metrics.quarterly_results || null, [metrics]);
  const balanceSheetData = useMemo(() => metrics.balance_sheet || null, [metrics]);
  const cashFlowData = useMemo(() => metrics.cash_flow || null, [metrics]);
  const annualRatiosData = useMemo(() => metrics.annual_ratios || null, [metrics]);

  // Compute Multi-Statement Stock Performance Rating strictly based on Latest vs Previous Period Delta Comparison!
  const stockRating = useMemo(() => {
    if (!selectedHolding) return null;

    const deltas = [
      getLatestDelta(quarterlyData, 'sales', false),
      getLatestDelta(quarterlyData, 'net profit', false),
      getLatestDelta(quarterlyData, 'opm', false),
      getLatestDelta(balanceSheetData, 'reserves', false),
      getLatestDelta(balanceSheetData, 'borrowings', true),
      getLatestDelta(balanceSheetData, 'total assets', false),
      getLatestDelta(cashFlowData, 'operating activity', false),
      getLatestDelta(cashFlowData, 'free cash flow', false),
      getLatestDelta(annualRatiosData, 'roce', false),
      getLatestDelta(annualRatiosData, 'cash conversion', true),
    ].filter(Boolean);

    if (deltas.length === 0) return null;

    const favorableItems = deltas.filter((d) => d.isFavorable);
    const favorableCount = favorableItems.length;
    const totalCount = deltas.length;

    const rawScore = (favorableCount / totalCount) * 10.0;
    const finalScore = Math.min(10.0, Math.max(1.0, Math.round(rawScore * 10) / 10));

    let grade = 'STABLE COMPOUNDER';
    let badgeColor = 'processing';
    if (finalScore >= 7.5) {
      grade = 'OUTPERFORMER 🏆';
      badgeColor = 'success';
    } else if (finalScore >= 5.0) {
      grade = 'STRONG COMPOUNDER 🟢';
      badgeColor = 'processing';
    } else {
      grade = 'UNDERPERFORMER ⚠️';
      badgeColor = 'error';
    }

    const highlights = deltas.map((d) => {
      const metricLabel = d.metricName.split(' ')[0];
      const signStr = d.delta > 0 ? '+' : '';
      return {
        text: `${metricLabel}: ${signStr}${d.delta.toFixed(1)} (${d.pctChg > 0 ? '+' : ''}${d.pctChg}%)`,
        isFavorable: d.isFavorable,
        latestPeriod: `${d.prevQtr} ➔ ${d.latestQtr}`,
      };
    });

    const compPeriodStr = deltas[0] ? `${deltas[0].prevQtr} ➔ ${deltas[0].latestQtr}` : 'Latest vs Prev';

    return {
      score: finalScore,
      grade,
      badgeColor,
      favorableCount,
      totalCount,
      compPeriodStr,
      highlights,
    };
  }, [selectedHolding, quarterlyData, balanceSheetData, cashFlowData, annualRatiosData]);

  // 100% Dynamic Multi-Statement & Screener.in Pros/Cons Quantitative Quality Model
  const selectedStockVerdict = useMemo(() => {
    if (!selectedHolding) return null;
    const t = selectedHolding.ticker || 'UNKNOWN';
    const c_name = selectedHolding.company_name || t;
    const sector = selectedHolding.sector || 'Uncategorized';
    const m = selectedHolding.metrics || {};

    const pe_v = m.pe_ratio;
    const peg_v = m.peg_ratio;
    const roce_v = m.roce_5yr || m.roce_pct || 0.0;
    const roe_v = m.roe_pct || 0.0;
    const debt_v = m.debt_to_equity || 0.0;
    const s_growth_v = m.sales_growth_3yr || 0.0;
    const p_growth_v = m.profit_growth_pct || 0.0;
    const intrinsic_v = m.intrinsic_value;
    const cmp_v = m.current_price || selectedHolding.current_price;
    const about_text = m.about;

    // Screener.in Scraped Official Pros & Cons
    const screener_pros_v = m.screener_pros || [];
    const screener_cons_v = m.screener_cons || [];

    // 1. Dynamic 5-Quarter Trajectory Extraction
    const q_data_v = m.quarterly_results?.metrics || {};
    const quarters_list = m.quarterly_results?.quarters || [];
    const sales_vals_v = q_data_v['Sales'] || q_data_v['Revenue'] || [];
    const p_vals_v = q_data_v['Net Profit'] || q_data_v['Profit after tax'] || [];

    const latest_sales_v = sales_vals_v.length > 0 ? parseFloat((sales_vals_v[sales_vals_v.length - 1] || '').replace(/,/g, '')) : null;
    const first_sales_v = sales_vals_v.length > 0 ? parseFloat((sales_vals_v[0] || '').replace(/,/g, '')) : null;
    const sales_5q_multiplier = (first_sales_v && latest_sales_v && first_sales_v > 0) ? (latest_sales_v / first_sales_v).toFixed(1) : null;

    const latest_p_v = p_vals_v.length > 0 ? parseFloat((p_vals_v[p_vals_v.length - 1] || '').replace(/,/g, '').replace(/%/g, '')) : null;

    // 2. Dynamic Balance Sheet Multi-Year Financial Metrics
    const bs_data_v = m.balance_sheet?.metrics || {};
    const res_vals_v = bs_data_v['Reserves'] || [];
    const latest_res_v = res_vals_v.length > 0 ? parseFloat((res_vals_v[res_vals_v.length - 1] || '').replace(/,/g, '')) : null;
    const bor_vals_v = bs_data_v['Borrowings'] || [];
    const latest_bor_v = bor_vals_v.length > 0 ? parseFloat((bor_vals_v[bor_vals_v.length - 1] || '').replace(/,/g, '')) : null;
    const cwip_vals_v = bs_data_v['CWIP'] || bs_data_v['Capital Work in Progress'] || [];
    const latest_cwip_v = cwip_vals_v.length > 0 ? parseFloat((cwip_vals_v[cwip_vals_v.length - 1] || '').replace(/,/g, '')) : null;

    // 3. Dynamic Cash Flows Multi-Year Metrics
    const cf_data_v = m.cash_flow?.metrics || {};
    const fcf_vals_v = cf_data_v['Free Cash Flow'] || [];
    const latest_fcf_v = fcf_vals_v.length > 0 ? parseFloat((fcf_vals_v[fcf_vals_v.length - 1] || '').replace(/,/g, '')) : null;
    const cfo_vals_v = cf_data_v['Cash from Operating Activity'] || [];
    const latest_cfo_v = cfo_vals_v.length > 0 ? parseFloat((cfo_vals_v[cfo_vals_v.length - 1] || '').replace(/,/g, '')) : null;

    // 4. Dynamic Annual Ratios
    const r_data_v = m.annual_ratios?.metrics || {};
    const ccc_vals_v = r_data_v['Cash Conversion Cycle'] || [];
    const latest_ccc_v = ccc_vals_v.length > 0 ? parseFloat((ccc_vals_v[ccc_vals_v.length - 1] || '').replace(/,/g, '')) : null;

    // DYNAMIC PERFORMANCE TRAJECTORY TEXT GENERATOR
    let trajectorySummary = '';
    if (sales_5q_multiplier && parseFloat(sales_5q_multiplier) >= 1.2) {
      trajectorySummary = `Revenue scaled ${sales_5q_multiplier}x across recent quarters (from ₹${Math.round(first_sales_v).toLocaleString()} Cr to ₹${Math.round(latest_sales_v).toLocaleString()} Cr), indicating strong customer adoption and operational expansion.`;
    } else if (latest_sales_v) {
      trajectorySummary = `Quarterly revenue operates stably at ₹${Math.round(latest_sales_v).toLocaleString()} Cr with consistent execution across reporting quarters.`;
    } else {
      trajectorySummary = `Operational revenue tracking historical baseline across reporting cycles.`;
    }

    // DYNAMIC MARKET & SECULAR RUNWAY (TAM) GENERATOR
    let marketRunway = '';
    if (about_text && about_text.length > 20) {
      marketRunway = `${about_text.slice(0, 190)}... Positioning the business to capture expanding market demand in ${sector}.`;
    } else {
      marketRunway = `Positioned in the ${sector} industry with secular demand drivers, domestic consumption growth, and expanding addressable customer base across India and export markets.`;
    }

    // DYNAMIC FUTURE GROWTH CATALYSTS & LEVERAGE GENERATOR
    const catalystPoints = [];
    if (latest_cwip_v && latest_cwip_v > 0) {
      catalystPoints.push(`Active Capital Work in Progress (CWIP ₹${Math.round(latest_cwip_v).toLocaleString()} Cr) expanding production capacity`);
    }
    if (s_growth_v > 12) {
      catalystPoints.push(`Strong multi-year top-line momentum (+${s_growth_v}% 3-Yr Sales CAGR)`);
    }
    if (roce_v >= 20) {
      catalystPoints.push(`Superior reinvestment compounding efficiency (ROCE: ${roce_v}%)`);
    }
    if (debt_v <= 0.2) {
      catalystPoints.push(`Solvent balance sheet (Reserves ₹${latest_res_v ? Math.round(latest_res_v).toLocaleString() : 0} Cr) allowing self-funded expansions`);
    }
    if (latest_p_v !== null && latest_p_v < 0) {
      catalystPoints.push(`Operating leverage inflection as fixed capex overheads are absorbed over expanding sales scale`);
    }
    if (catalystPoints.length === 0) {
      catalystPoints.push(`Capacity utilization ramp-up, operational efficiencies, and market share consolidation in ${sector}`);
    }
    const futureCatalysts = catalystPoints.join(' • ') + '.';

    // DYNAMIC GROWTH THESIS GENERATOR
    let growthThesis = '';
    if (latest_p_v !== null && latest_p_v < 0 && latest_sales_v && latest_sales_v > 400) {
      growthThesis = `High-growth market disruptor in capex scale phase. While currently loss-making (-₹${Math.round(Math.abs(latest_p_v)).toLocaleString()} Cr) due to infrastructure & capacity build-out, top-line is expanding rapidly (₹${Math.round(latest_sales_v).toLocaleString()} Cr). Operating leverage inflection expected upon scale absorption.`;
    } else if (roce_v >= 25 && debt_v <= 0.3) {
      growthThesis = `High-probability multi-year compounder backed by superior capital efficiency (ROCE: ${roce_v}%), fortress balance sheet (Reserves ₹${latest_res_v ? Math.round(latest_res_v).toLocaleString() : 'N/A'} Cr vs Debt ₹${latest_bor_v ? Math.round(latest_bor_v).toLocaleString() : 0} Cr), and strong cash generation.`;
    } else {
      growthThesis = `Business model positioned to benefit from broader economic expansion in ${sector}, with steady margin and capacity optimization.`;
    }

    // HOLISTIC QUANTITATIVE QUALITY SCORE MODELING (Cross-Statement + Screener Pros/Cons)
    let s_score = 5.0;

    // 1. ROCE & Capital Efficiency (0 to +2.0 / -0.8)
    if (roce_v >= 30.0) s_score += 1.8;
    else if (roce_v >= 18.0) s_score += 1.2;
    else if (roce_v < 10.0) s_score -= 0.8;

    // 2. Profitability & Revenue Growth Phase
    if (latest_p_v !== null && !isNaN(latest_p_v)) {
      if (latest_p_v > 0) s_score += 1.0;
      else if (latest_p_v < 0 && latest_sales_v && latest_sales_v > 400) s_score -= 0.8; // Capex scale phase
      else if (latest_p_v < 0) s_score -= 2.0;
    }

    // 3. Top-Line Scaling & Compounding
    if (s_growth_v >= 15.0 || (sales_5q_multiplier && parseFloat(sales_5q_multiplier) >= 2.0)) s_score += 1.2;
    if (p_growth_v >= 15.0) s_score += 0.8;

    // 4. Cash Generation & Free Cash Flow
    if (latest_fcf_v !== null && !isNaN(latest_fcf_v)) {
      if (latest_fcf_v > 0) s_score += 1.0;
      else if (latest_fcf_v < -50) s_score -= 0.8;
    }

    // 5. Debt Leverage & Balance Sheet Fortress
    if (debt_v <= 0.2) s_score += 1.0;
    else if (debt_v > 0.8) s_score -= 1.2;

    // 6. Direct Screener.in Verified Pros & Cons Impact
    if (screener_pros_v.length > 0) {
      s_score += Math.min(1.5, screener_pros_v.length * 0.3);
    }
    if (screener_cons_v.length > 0) {
      s_score -= Math.min(1.5, screener_cons_v.length * 0.3);
    }

    const final_s = Math.min(10.0, Math.max(1.0, Math.round(s_score * 10) / 10));

    // Dynamic Statement Pros & Cons
    const statement_pros = [];
    const statement_cons = [];

    if (sales_5q_multiplier && parseFloat(sales_5q_multiplier) > 1.2) {
      statement_pros.push(`Rapid Revenue Scaling: Sales scaled ${sales_5q_multiplier}x across recent quarters (Latest: ₹${Math.round(latest_sales_v).toLocaleString()} Cr).`);
    } else if (latest_sales_v) {
      statement_pros.push(`Established Top-Line Scale: Generated ₹${Math.round(latest_sales_v).toLocaleString()} Cr in quarterly revenue.`);
    }

    if (roce_v >= 20.0) {
      statement_pros.push(`Superior Capital Allocation: 5-Yr ROCE is exceptional at ${roce_v}%, compounding capital at high hurdle rates.`);
    } else if (roce_v >= 15.0) {
      statement_pros.push(`Healthy Capital Returns: 5-Yr ROCE of ${roce_v}% comfortably exceeds typical cost of capital.`);
    }

    if (latest_fcf_v && latest_fcf_v > 0) {
      statement_pros.push(`Self-Sustaining Cash Generation: Delivered +₹${Math.round(latest_fcf_v).toLocaleString()} Cr in positive Free Cash Flow.`);
    }

    if (debt_v <= 0.2) {
      statement_pros.push(`Solvent Fortress Balance Sheet: Debt/Equity is low at ${debt_v} with ₹${latest_res_v ? Math.round(latest_res_v).toLocaleString() : 0} Cr in reserves.`);
    }

    if (intrinsic_v && cmp_v && cmp_v < intrinsic_v) {
      const disc = Math.round(((intrinsic_v - cmp_v) / intrinsic_v) * 100);
      statement_pros.push(`Valuation Discount: Trades at a ${disc}% discount below Benjamin Graham Intrinsic Value.`);
    }

    // Evaluate Statement Cons
    if (latest_p_v !== null && latest_p_v < 0) {
      statement_cons.push(`Capex/R&D Phase Operating Loss: Net Loss of -₹${Math.round(Math.abs(latest_p_v)).toLocaleString()} Cr in latest quarter; requires scale absorption to reach breakeven.`);
    }

    if (latest_fcf_v !== null && latest_fcf_v < 0) {
      statement_cons.push(`Negative Free Cash Flow (-₹${Math.round(Math.abs(latest_fcf_v)).toLocaleString()} Cr): Reinvestment in capacity capex exceeds current cash generation.`);
    }

    if (pe_v && pe_v > 45.0) {
      statement_cons.push(`Premium Valuation (P/E: ${pe_v}x): Requires sustained high growth momentum to justify valuation multiples.`);
    }

    if (latest_ccc_v && latest_ccc_v > 150) {
      statement_cons.push(`Working Capital Absorption: Elongated Cash Conversion Cycle of ${Math.round(latest_ccc_v)} days.`);
    }

    if (debt_v > 0.8) {
      statement_cons.push(`Elevated Leverage: Debt-to-Equity is ${debt_v} (Borrowings: ₹${latest_bor_v ? Math.round(latest_bor_v).toLocaleString() : 0} Cr).`);
    }

    // Holistic Multi-Dimensional Verdict Classification
    let s_tier = 'GOOD';
    let s_label = 'Elite Quality Compounder 🌟';
    let s_color = 'success';
    let c_verdict = 'High-Conviction Compounder Choice ✅';
    let f_outlook = 'High Future Compounding Potential 🚀';
    let v_summary = `${t} is an outstanding compounder backed by superior ROCE (${roce_v}%), fortress balance sheet (Reserves ₹${latest_res_v ? Math.round(latest_res_v).toLocaleString() : 'N/A'} Cr vs Debt ₹${latest_bor_v ? Math.round(latest_bor_v).toLocaleString() : 0} Cr), and strong cash generation (+₹${latest_fcf_v ? Math.round(latest_fcf_v).toLocaleString() : 'N/A'} Cr FCF).`;
    let a_advice = 'Hold with high conviction and accumulate on market dips.';

    if (latest_p_v !== null && !isNaN(latest_p_v) && latest_p_v < 0 && (latest_sales_v && latest_sales_v > 400)) {
      s_tier = 'GROWTH_DISRUPTOR';
      s_label = 'High-Growth Market Disruptor ⚡';
      s_color = 'processing';
      c_verdict = 'High-Growth Secular Disruption Choice ⚡';
      f_outlook = 'Exponential Market Runway (Inflection on Breakeven) 🚀';
      v_summary = `${t} is scaling rapidly in the ${sector} market (Quarterly Sales ₹${Math.round(latest_sales_v).toLocaleString()} Cr). While currently loss-making (-₹${Math.round(Math.abs(latest_p_v)).toLocaleString()} Cr) due to capacity & operational build-out, top-line expansion indicates strong customer adoption.`;
      a_advice = 'Hold as a high-growth thematic allocation; monitor quarterly operating breakeven trajectory.';
    } else if (latest_p_v !== null && !isNaN(latest_p_v) && latest_p_v < 0) {
      s_tier = 'VERY_BAD';
      s_label = 'High Capital Burn 🚨';
      s_color = 'error';
      c_verdict = 'High Risk / Speculative Choice ⚠️';
      f_outlook = 'Operating Losses / Capital Burn 📉';
      v_summary = `${t} operates with ongoing quarterly net losses (-₹${Math.round(Math.abs(latest_p_v)).toLocaleString()} Cr) without sufficient top-line scale. Capital is burning until operating breakeven is proven.`;
      a_advice = 'Limit allocation to speculative boundaries (< 5%) or rebalance into cash-generative compounders.';
    } else if (final_s < 7.5 && final_s >= 5.5) {
      s_tier = 'GOOD';
      s_label = 'Steady Compounder 🟢';
      s_color = 'processing';
      c_verdict = 'Correct Growth Choice ✅';
      f_outlook = 'Consistent Long-Term Growth Potential 📈';
      v_summary = `${t} demonstrates steady profitability (Net Profit ₹${latest_p_v ? Math.round(latest_p_v).toLocaleString() : 'N/A'} Cr, ROCE ${roce_v}%) with low debt leverage. Poised to grow steadily with broader economic and sector tailwinds.`;
      a_advice = 'Maintain standard portfolio weightage.';
    } else if (final_s < 5.5) {
      s_tier = 'MODERATE';
      s_label = 'Watchlist / Moderate ⚠️';
      s_color = 'warning';
      c_verdict = 'Mixed / Watchlist Choice ⚖️';
      f_outlook = 'Moderate Growth / Valuation Dependent ⏳';
      v_summary = `${t} exhibits mixed quantitative signals (P/E: ${pe_v || 'N/A'}, Debt/Eq: ${debt_v}, ROCE: ${roce_v}%). Growth may face cyclical or multiple compression headwinds.`;
      a_advice = 'Track quarterly earnings closely and avoid over-allocating capital.';
    }

    return {
      ticker: t,
      company_name: c_name,
      sector: sector,
      tier: s_tier,
      tier_label: s_label,
      tier_color: s_color,
      score: final_s,
      choice_verdict: c_verdict,
      future_outlook: f_outlook,
      verdict_summary: v_summary,
      action_advice: a_advice,
      market_runway: marketRunway,
      future_catalysts: futureCatalysts,
      growth_thesis: growthThesis,
      trajectory_summary: trajectorySummary,
      sales_5q_multiplier,
      quarters_list,
      screener_pros: screener_pros_v,
      screener_cons: screener_cons_v,
      statement_pros,
      statement_cons,
      metrics: {
        roce: roce_v,
        pe: pe_v,
        debt_eq: debt_v,
        qtr_profit: latest_p_v,
        latest_sales: latest_sales_v,
        fcf: latest_fcf_v,
        reserves: latest_res_v,
        borrowings: latest_bor_v,
        cwip: latest_cwip_v,
      },
    };
  }, [selectedHolding]);

  if (!holdings || holdings.length === 0) {
    return (
      <Card className="card-pick-elevation bg-[#fffef9] rounded-2xl p-8 text-center mb-8">
        <StockOutlined className="text-4xl text-[#e87131] mb-3 opacity-80" />
        <h4 className="text-base font-bold text-[#5a6359]">No Portfolio Holdings Available</h4>
        <p className="text-xs text-[#5a6359]/70 mb-4 font-medium">Add holdings to view scraped financial statements.</p>
      </Card>
    );
  }

  return (
    <div>
      {/* UNIFIED QUANTITATIVE ANALYSIS MASTER CARD (WITH DYNAMIC SCREENER PROS & CONS MODELING) */}
      <Card
        size="small"
        className="card-pick-elevation bg-[#fffef9] rounded-2xl mb-8 p-4 border border-[#e87131]/30 shadow-md"
      >
        {/* 1. Top Bar: Select Holding Controls (Shifted Upwards) & Quality Score */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 mb-4 border-b border-[#fbeed6] gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-extrabold uppercase font-mono text-[#5a6359] flex items-center gap-1.5">
              <CompassOutlined className="text-[#e87131] text-base" /> Select Holding:
            </span>
            <Select
              value={selectedTicker}
              onChange={(val) => setSelectedTicker(val)}
              className="w-56 text-xs font-mono font-bold"
            >
              {holdings.map((h) => (
                <Option key={h.ticker} value={h.ticker}>
                  {h.ticker} - {h.company_name}
                </Option>
              ))}
            </Select>

            <Button
              type="default"
              icon={<SyncOutlined spin={isScraping} className="text-[#e87131]" />}
              onClick={onTriggerScrape}
              loading={isScraping}
              className="bg-[#fdf9ec] border-[#e87131]/40 text-[#5a6359] hover:text-[#e87131] rounded-xl text-xs font-semibold font-mono"
            >
              Sync Screener
            </Button>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <span className="text-[10px] font-bold text-[#5a6359]/70 uppercase block font-mono">
                Holistic Quality Score
              </span>
              <span className="text-lg font-black font-mono text-[#e87131]">
                {selectedStockVerdict?.score || 5.0} / 10
              </span>
            </div>
          </div>
        </div>

        {/* 2. Stock Identity & Prominent Classification Badge */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-[#e87131] flex items-center justify-center text-white text-2xl shadow-md">
              <CalendarOutlined />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-[#5a6359] text-lg font-mono">
                  {selectedHolding?.ticker}
                </span>
                <Tag className="font-semibold rounded-full border-0 bg-[#e87131]/15 text-[#e87131] text-xs">
                  {selectedHolding?.sector || 'Uncategorized'}
                </Tag>
              </div>
              <p className="text-xs text-[#5a6359]/80 font-medium m-0">{selectedHolding?.company_name}</p>
            </div>
          </div>

          {selectedStockVerdict && (
            <Tag color={selectedStockVerdict.tier_color} className="text-xs font-extrabold uppercase rounded-lg px-3 py-1 m-0 shadow-xs border-0 font-mono">
              {selectedStockVerdict.tier_label}
            </Tag>
          )}
        </div>

        {/* 3. Row 1: Left (Latest vs Prev Performance Model) | Right (Choice & Future Growth Verdict) */}
        <Row gutter={[16, 16]} className="mb-4">
          {/* Left Column: Latest vs Prev Period Performance Model */}
          <Col xs={24} lg={12}>
            {stockRating ? (
              <div className="bg-[#fdf9ec] rounded-xl p-3.5 border border-[#e87131]/20 shadow-xs h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <StarFilled className="text-amber-500 text-base" />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#5a6359] font-mono">
                        Latest vs Prev Period Performance Model
                      </span>
                    </div>
                    <Tag color={stockRating.badgeColor} className="font-mono text-[11px] font-extrabold rounded-md m-0">
                      {stockRating.grade}
                    </Tag>
                  </div>

                  <div className="flex items-center space-x-4 mb-2.5">
                    <div className="text-center">
                      <span className="text-2xl font-black font-mono text-[#e87131]">
                        {stockRating.score}
                      </span>
                      <span className="text-xs font-bold text-[#5a6359]/60 font-mono"> / 10</span>
                    </div>

                    <div className="flex-1">
                      <Progress
                        percent={stockRating.score * 10}
                        showInfo={false}
                        strokeColor={{ '0%': '#e87131', '100%': '#15803d' }}
                        trailColor="#fbeed6"
                        size="small"
                      />
                      <div className="flex justify-between text-[10px] text-[#5a6359]/70 font-semibold mt-0.5 font-mono">
                        <span>Favorable Comparisons: {stockRating.favorableCount} / {stockRating.totalCount}</span>
                        <span>Period: {stockRating.compPeriodStr}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analytical Delta Highlight Tags */}
                <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto custom-scrollbar pt-1">
                  {stockRating.highlights.map((hObj, idx) => (
                    <Tag
                      key={idx}
                      icon={hObj.isFavorable ? <CheckCircleOutlined className="text-emerald-600" /> : <CloseCircleOutlined className="text-rose-600" />}
                      className={`font-mono text-[10px] font-bold rounded-md m-0 border-0 ${
                        hObj.isFavorable ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                      }`}
                    >
                      {hObj.text}
                    </Tag>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-[#fdf9ec] rounded-xl p-4 border border-[#e87131]/20 text-center h-full flex items-center justify-center">
                <span className="text-xs text-[#5a6359] font-semibold">
                  Statement comparison metrics loading... Click 'Sync Screener' to update.
                </span>
              </div>
            )}
          </Col>

          {/* Right Column: Choice & Future Growth Verdict */}
          <Col xs={24} lg={12}>
            {selectedStockVerdict && (
              <div className="p-3.5 rounded-xl bg-[#fdf9ec] border border-[#e87131]/20 h-full flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#5a6359] flex items-center gap-1.5 font-mono">
                      <AimOutlined className="text-[#e87131]" /> Investment Choice & Growth Verdict
                    </span>
                    <Tag color={selectedStockVerdict.tier_color} className="font-mono text-[11px] font-extrabold rounded-md m-0">
                      {selectedStockVerdict.choice_verdict}
                    </Tag>
                  </div>

                  <div className="space-y-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <RiseOutlined className="text-[#e87131] text-base" />
                      <span className="text-xs font-bold font-mono text-[#e87131]">
                        {selectedStockVerdict.future_outlook}
                      </span>
                    </div>
                    <p className="text-xs text-[#5a6359] m-0 font-medium leading-relaxed">
                      {selectedStockVerdict.verdict_summary}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#fbeed6] flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#5a6359] font-mono">
                    ⚡ Strategic Action:
                  </span>
                  <Tag color="orange" className="font-mono text-[10px] font-extrabold rounded-md m-0">
                    {selectedStockVerdict.action_advice}
                  </Tag>
                </div>
              </div>
            )}
          </Col>
        </Row>

        {/* 4. Row 2: Forward Growth Runway & Market Catalysts (100% Dynamically Generated) */}
        {selectedStockVerdict && (
          <div className="mb-4">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 h-full">
                  <div className="flex items-center space-x-1.5 mb-1.5">
                    <FundProjectionScreenOutlined className="text-blue-600 text-sm" />
                    <span className="font-extrabold text-[11px] font-mono text-blue-900 uppercase">
                      5-Quarter Trajectory & Scale Momentum
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-950 m-0 font-medium leading-relaxed">
                    {selectedStockVerdict.trajectory_summary}
                  </p>
                </div>
              </Col>

              <Col xs={24} md={8}>
                <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 h-full">
                  <div className="flex items-center space-x-1.5 mb-1.5">
                    <GlobalOutlined className="text-purple-600 text-sm" />
                    <span className="font-extrabold text-[11px] font-mono text-purple-900 uppercase">
                      Market & Secular Runway (TAM)
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-950 m-0 font-medium leading-relaxed">
                    {selectedStockVerdict.market_runway}
                  </p>
                </div>
              </Col>

              <Col xs={24} md={8}>
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 h-full">
                  <div className="flex items-center space-x-1.5 mb-1.5">
                    <RocketOutlined className="text-amber-600 text-sm" />
                    <span className="font-extrabold text-[11px] font-mono text-amber-900 uppercase">
                      Dynamic Future Growth Catalysts
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-950 m-0 font-medium leading-relaxed">
                    {selectedStockVerdict.future_catalysts}
                  </p>
                </div>
              </Col>
            </Row>
          </div>
        )}

        {/* 5. Row 3: Key Multi-Statement Financial Badges */}
        {selectedStockVerdict && (
          <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-[#fdf9ec]/60 border border-[#fbeed6] mb-4">
            <span className="text-[11px] font-bold text-[#5a6359] mr-1 font-mono">Financial Snapshot:</span>
            {selectedStockVerdict.metrics?.roce > 0 && (
              <Tag className="font-mono text-[10px] font-bold bg-white text-[#5a6359] border-[#e87131]/20 rounded-md m-0">
                5-Yr ROCE: {selectedStockVerdict.metrics.roce}%
              </Tag>
            )}
            {selectedStockVerdict.metrics?.qtr_profit !== null && selectedStockVerdict.metrics?.qtr_profit !== undefined && !isNaN(selectedStockVerdict.metrics.qtr_profit) && (
              <Tag className={`font-mono text-[10px] font-bold rounded-md m-0 border-0 ${selectedStockVerdict.metrics.qtr_profit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                Latest Qtr Profit: {selectedStockVerdict.metrics.qtr_profit >= 0 ? '+' : ''}₹{Math.round(selectedStockVerdict.metrics.qtr_profit).toLocaleString()} Cr
              </Tag>
            )}
            {selectedStockVerdict.metrics?.fcf !== null && selectedStockVerdict.metrics?.fcf !== undefined && !isNaN(selectedStockVerdict.metrics.fcf) && (
              <Tag className={`font-mono text-[10px] font-bold rounded-md m-0 border-0 ${selectedStockVerdict.metrics.fcf >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                Free Cash Flow: {selectedStockVerdict.metrics.fcf >= 0 ? '+' : ''}₹{Math.round(selectedStockVerdict.metrics.fcf).toLocaleString()} Cr
              </Tag>
            )}
            {selectedStockVerdict.metrics?.debt_eq !== null && selectedStockVerdict.metrics?.debt_eq !== undefined && (
              <Tag className="font-mono text-[10px] font-bold bg-white text-[#5a6359] border-[#e87131]/20 rounded-md m-0">
                Debt/Equity: {selectedStockVerdict.metrics.debt_eq}
              </Tag>
            )}
            {selectedStockVerdict.metrics?.reserves !== null && selectedStockVerdict.metrics?.reserves !== undefined && (
              <Tag className="font-mono text-[10px] font-bold bg-white text-[#5a6359] border-[#e87131]/20 rounded-md m-0">
                Reserves: ₹{Math.round(selectedStockVerdict.metrics.reserves).toLocaleString()} Cr
              </Tag>
            )}
            {selectedStockVerdict.metrics?.cwip !== null && selectedStockVerdict.metrics?.cwip !== undefined && selectedStockVerdict.metrics.cwip > 0 && (
              <Tag className="font-mono text-[10px] font-bold bg-white text-[#5a6359] border-[#e87131]/20 rounded-md m-0">
                Active CWIP: ₹{Math.round(selectedStockVerdict.metrics.cwip).toLocaleString()} Cr
              </Tag>
            )}
          </div>
        )}

        {/* 6. Row 4: Pros & Cons Side-by-Side Audit (Screener.in Official + Financial Model) */}
        {selectedStockVerdict && (
          <div className="pt-1">
            <h5 className="text-xs font-black uppercase tracking-wider text-[#5a6359] mb-3 flex items-center gap-1.5 font-mono">
              <SafetyCertificateOutlined className="text-[#e87131]" /> Pros & Cons Audit — Screener.in Official & Financial Model for {selectedStockVerdict.ticker}
            </h5>

            <Row gutter={[16, 16]}>
              {/* PROS COLUMN */}
              <Col xs={24} md={12}>
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-300/80 shadow-xs h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-emerald-200/80">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs shadow-2xs">
                          <CheckCircleFilled />
                        </div>
                        <span className="font-extrabold text-xs font-mono text-emerald-950 uppercase tracking-wider">
                          PROS
                        </span>
                      </div>
                      <Tag color="success" className="text-[10px] font-extrabold font-mono rounded-md m-0 px-2 py-0.5 border border-emerald-300 shadow-2xs">
                        {selectedStockVerdict.screener_pros.length + selectedStockVerdict.statement_pros.length} Strengths
                      </Tag>
                    </div>

                    <div className="space-y-2">
                      {/* 1. Official Screener.in Pros */}
                      {selectedStockVerdict.screener_pros.map((pText, pIdx) => (
                        <div
                          key={`sc-p-${pIdx}`}
                          className="flex items-center justify-between gap-3 text-xs bg-white/95 hover:bg-white p-2.5 rounded-xl border border-emerald-200/70 shadow-2xs transition-all"
                        >
                          <div className="flex items-start space-x-2 flex-1">
                            <span className="text-emerald-600 font-black text-sm leading-none mt-0.5">•</span>
                            <span className="text-emerald-950 font-semibold leading-relaxed">{pText}</span>
                          </div>
                          <Tag className="font-mono text-[9px] font-extrabold text-emerald-800 bg-emerald-100/90 border border-emerald-300/80 rounded-md m-0 px-2 py-0.5 shrink-0 shadow-2xs self-start mt-0.5">
                            Screener.in
                          </Tag>
                        </div>
                      ))}

                      {/* 2. Multi-Statement Financial Model Pros */}
                      {selectedStockVerdict.statement_pros.map((pText, pIdx) => (
                        <div
                          key={`st-p-${pIdx}`}
                          className="flex items-center justify-between gap-3 text-xs bg-white/80 hover:bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs transition-all"
                        >
                          <div className="flex items-start space-x-2 flex-1">
                            <span className="text-emerald-500 font-black text-sm leading-none mt-0.5">•</span>
                            <span className="text-[#5a6359] font-medium leading-relaxed">{pText}</span>
                          </div>
                          <Tag className="font-mono text-[9px] font-bold text-[#5a6359] bg-[#fffef9] border border-[#fbeed6] rounded-md m-0 px-2 py-0.5 shrink-0 shadow-2xs self-start mt-0.5">
                            Statement Model
                          </Tag>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Col>

              {/* CONS COLUMN */}
              <Col xs={24} md={12}>
                <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-300/80 shadow-xs h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-rose-200/80">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center text-xs shadow-2xs">
                          <CloseCircleFilled />
                        </div>
                        <span className="font-extrabold text-xs font-mono text-rose-950 uppercase tracking-wider">
                          CONS
                        </span>
                      </div>
                      <Tag color="error" className="text-[10px] font-extrabold font-mono rounded-md m-0 px-2 py-0.5 border border-rose-300 shadow-2xs">
                        {selectedStockVerdict.screener_cons.length + selectedStockVerdict.statement_cons.length} Risks
                      </Tag>
                    </div>

                    <div className="space-y-2">
                      {/* 1. Official Screener.in Cons */}
                      {selectedStockVerdict.screener_cons.map((cText, cIdx) => (
                        <div
                          key={`sc-c-${cIdx}`}
                          className="flex items-center justify-between gap-3 text-xs bg-white/95 hover:bg-white p-2.5 rounded-xl border border-rose-200/70 shadow-2xs transition-all"
                        >
                          <div className="flex items-start space-x-2 flex-1">
                            <span className="text-rose-600 font-black text-sm leading-none mt-0.5">•</span>
                            <span className="text-rose-950 font-semibold leading-relaxed">{cText}</span>
                          </div>
                          <Tag className="font-mono text-[9px] font-extrabold text-rose-800 bg-rose-100/90 border border-rose-300/80 rounded-md m-0 px-2 py-0.5 shrink-0 shadow-2xs self-start mt-0.5">
                            Screener.in
                          </Tag>
                        </div>
                      ))}

                      {/* 2. Multi-Statement Financial Model Cons */}
                      {selectedStockVerdict.statement_cons.map((cText, cIdx) => (
                        <div
                          key={`st-c-${cIdx}`}
                          className="flex items-center justify-between gap-3 text-xs bg-white/80 hover:bg-white p-2.5 rounded-xl border border-rose-100 shadow-2xs transition-all"
                        >
                          <div className="flex items-start space-x-2 flex-1">
                            <span className="text-rose-500 font-black text-sm leading-none mt-0.5">•</span>
                            <span className="text-[#5a6359] font-medium leading-relaxed">{cText}</span>
                          </div>
                          <Tag className="font-mono text-[9px] font-bold text-[#5a6359] bg-[#fffef9] border border-[#fbeed6] rounded-md m-0 px-2 py-0.5 shrink-0 shadow-2xs self-start mt-0.5">
                            Statement Model
                          </Tag>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Card>

      {/* 4 FINANCIAL STATEMENT TABLES STACKED SEQUENTIALLY ONE AFTER ANOTHER */}
      {/* 1. Quarterly Results Statement Card */}
      <FinancialStatementCard
        title="Quarterly Results Statement"
        subtitle="Standalone Figures in ₹ Crores • Last 5 Quarters"
        icon={<CalendarOutlined />}
        statementData={quarterlyData}
        periodLabel="QoQ"
      />

      {/* 2. Balance Sheet Statement Card */}
      <FinancialStatementCard
        title="Balance Sheet Statement"
        subtitle="Standalone Figures in ₹ Crores • Last 5 Years Historical Capital Structure"
        icon={<BankOutlined />}
        statementData={balanceSheetData}
        periodLabel="YoY"
      />

      {/* 3. Cash Flows Statement Card */}
      <FinancialStatementCard
        title="Cash Flows Statement"
        subtitle="Standalone Figures in ₹ Crores • Last 5 Years Operating, Investing & Financing Cash"
        icon={<DollarOutlined />}
        statementData={cashFlowData}
        periodLabel="YoY"
      />

      {/* 4. Key Historical Ratios Statement Card */}
      <FinancialStatementCard
        title="Key Historical Financial Ratios"
        subtitle="Working Capital Days, Cash Conversion Cycle & ROCE % • Last 5 Years"
        icon={<LineChartOutlined />}
        statementData={annualRatiosData}
        periodLabel="YoY"
      />
    </div>
  );
};
