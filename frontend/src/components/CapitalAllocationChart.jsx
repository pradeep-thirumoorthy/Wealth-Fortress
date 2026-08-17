import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ComposedChart,
  Line,
} from 'recharts';
import { Card, Radio, Row, Col, Tag, Segmented } from 'antd';
import {
  PieChartOutlined,
  BarChartOutlined,
  RiseOutlined,
  FundOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  StarFilled,
  WarningOutlined,
  LineChartOutlined,
} from '@ant-design/icons';

const COLOR_PALETTE = [
  '#e87131', '#15803d', '#b45309', '#0284c7',
  '#6b21a8', '#c05621', '#0d9488', '#b91c1c',
  '#4d7c0f', '#475569',
];

const MCAP_COLORS = {
  'Large Cap': '#0284c7',
  'Mid Cap': '#15803d',
  'Small Cap': '#e87131',
};

export const CapitalAllocationChart = ({ holdings }) => {
  const [groupBy, setGroupBy] = useState('ticker');
  const [activeTabChart, setActiveTabChart] = useState('all');

  // Compute Summed Market Cap Stats (Large Cap, Mid Cap, Small Cap)
  const mcapStats = useMemo(() => {
    if (!holdings || holdings.length === 0) {
      return {
        'Large Cap': { val: 0, count: 0, weight: 0 },
        'Mid Cap': { val: 0, count: 0, weight: 0 },
        'Small Cap': { val: 0, count: 0, weight: 0 },
        total: 0,
      };
    }

    let totalVal = 0;
    const stats = {
      'Large Cap': { val: 0, count: 0, weight: 0 },
      'Mid Cap': { val: 0, count: 0, weight: 0 },
      'Small Cap': { val: 0, count: 0, weight: 0 },
    };

    holdings.forEach((h) => {
      const val = h.current_market_value || 0;
      totalVal += val;
      const mcap = h.metrics?.market_cap_cr;

      let cat = 'Small Cap';
      if (mcap >= 20000) cat = 'Large Cap';
      else if (mcap >= 5000) cat = 'Mid Cap';

      stats[cat].val += val;
      stats[cat].count += 1;
    });

    if (totalVal > 0) {
      Object.keys(stats).forEach((k) => {
        stats[k].weight = Number(((stats[k].val / totalVal) * 100).toFixed(1));
      });
    }

    return { ...stats, total: totalVal };
  }, [holdings]);

  // 1. Pie / Donut Chart Data
  const chartData = useMemo(() => {
    if (!holdings || holdings.length === 0) return [];

    if (groupBy === 'ticker') {
      return holdings.map((h) => ({
        name: h.ticker,
        fullName: h.company_name,
        value: h.current_market_value,
        weight: h.weightage_pct,
        color: undefined,
      }));
    } else if (groupBy === 'sector') {
      const sectorMap = {};
      let totalVal = 0;
      holdings.forEach((h) => {
        const sec = h.sector || 'Uncategorized';
        sectorMap[sec] = (sectorMap[sec] || 0) + h.current_market_value;
        totalVal += h.current_market_value;
      });

      return Object.entries(sectorMap).map(([secName, val]) => ({
        name: secName,
        fullName: secName,
        value: val,
        weight: totalVal > 0 ? Number(((val / totalVal) * 100).toFixed(1)) : 0,
        color: undefined,
      }));
    } else {
      // By Market Cap Category
      return Object.entries(mcapStats)
        .filter(([key]) => key !== 'total')
        .map(([catName, stat]) => ({
          name: catName,
          fullName: `${catName} (${stat.count} Stocks)`,
          value: stat.val,
          weight: stat.weight,
          color: MCAP_COLORS[catName],
        }));
    }
  }, [holdings, groupBy, mcapStats]);

  // 2. Invested vs Market Value & P&L Chart Data
  const performanceBarData = useMemo(() => {
    if (!holdings || holdings.length === 0) return [];

    return holdings.map((h) => {
      const invested = h.total_invested || 0;
      const current = h.current_market_value || 0;
      const pnl = current - invested;
      const pnlPct = invested > 0 ? Number(((pnl / invested) * 100).toFixed(1)) : 0;

      return {
        ticker: h.ticker,
        company: h.company_name,
        invested: Math.round(invested),
        current: Math.round(current),
        pnl: Math.round(pnl),
        pnlPct,
        isGain: pnl >= 0,
      };
    });
  }, [holdings]);

  // 3. Fundamentals & Quality Matrix Data (ROCE % vs Sales Growth % vs Quality Score)
  const fundamentalsData = useMemo(() => {
    if (!holdings || holdings.length === 0) return [];

    return holdings.map((h) => {
      const m = h.metrics || {};
      const roce = m.roce_5yr || m.roce_pct || 0;
      const salesGrowth = m.sales_growth_3yr || 0;
      const profitGrowth = m.profit_growth_pct || 0;
      const pe = m.pe_ratio || 0;
      const debtEq = m.debt_to_equity || 0;

      // Score
      let score = 5.0;
      if (roce >= 30) score += 2.0;
      else if (roce >= 18) score += 1.2;
      if (salesGrowth >= 15) score += 1.5;
      if (debtEq <= 0.2) score += 1.0;
      if (m.screener_pros?.length) score += Math.min(1.5, m.screener_pros.length * 0.3);
      if (m.screener_cons?.length) score -= Math.min(1.5, m.screener_cons.length * 0.3);
      const finalScore = Math.min(10, Math.max(1, Number(score.toFixed(1))));

      return {
        ticker: h.ticker,
        company: h.company_name,
        roce: Number(roce.toFixed(1)),
        salesGrowth: Number(salesGrowth.toFixed(1)),
        profitGrowth: Number(profitGrowth.toFixed(1)),
        pe: Number(pe.toFixed(1)),
        score: finalScore,
      };
    });
  }, [holdings]);

  // Custom Tooltips
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#fffef9] border border-[#e87131] p-3 rounded-xl shadow-xl text-xs font-mono text-[#5a6359]">
          <p className="font-bold text-[#5a6359] mb-1">{data.fullName || data.name}</p>
          <p className="text-[#e87131] m-0 font-bold">
            Market Value: ₹{data.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-emerald-800 m-0 font-bold">Allocation Weight: {data.weight}%</p>
        </div>
      );
    }
    return null;
  };

  const CustomPerfTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-[#fffef9] border border-[#e87131]/60 p-3 rounded-xl shadow-xl text-xs font-mono text-[#5a6359] space-y-1">
          <p className="font-extrabold text-[#5a6359] m-0">{d.ticker} - {d.company}</p>
          <p className="text-blue-700 m-0 font-bold">Invested Capital: ₹{d.invested.toLocaleString()}</p>
          <p className="text-[#e87131] m-0 font-bold">Current Value: ₹{d.current.toLocaleString()}</p>
          <div className="pt-1 border-t border-[#fbeed6] flex items-center justify-between">
            <span className="font-bold">Unrealized P&L:</span>
            <span className={`font-black ${d.isGain ? 'text-emerald-700' : 'text-rose-700'}`}>
              {d.isGain ? '+' : ''}₹{d.pnl.toLocaleString()} ({d.isGain ? '+' : ''}{d.pnlPct}%)
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomFundTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-[#fffef9] border border-[#e87131]/60 p-3 rounded-xl shadow-xl text-xs font-mono text-[#5a6359] space-y-1">
          <p className="font-extrabold text-[#5a6359] m-0">{d.ticker} - {d.company}</p>
          <p className="text-emerald-700 m-0 font-bold">5-Yr ROCE: {d.roce}%</p>
          <p className="text-blue-700 m-0 font-bold">3-Yr Sales Growth: {d.salesGrowth}%</p>
          <p className="text-purple-700 m-0 font-bold">Valuation P/E: {d.pe}x</p>
          <div className="pt-1 border-t border-[#fbeed6] flex items-center justify-between">
            <span className="font-bold">Quality Score:</span>
            <span className="font-black text-[#e87131]">{d.score} / 10</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* 1. Summed Capital Breakdown Stat Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card size="small" className="card-pick-elevation bg-[#fffef9] rounded-2xl cursor-pointer">
            <div className="flex items-center justify-between mb-1">
              <Tag color="processing" className="font-bold text-xs rounded-md">Large Cap</Tag>
              <span className="text-xs text-[#5a6359]/70 font-mono font-bold">{mcapStats['Large Cap'].count} Stocks</span>
            </div>
            <div className="text-lg font-extrabold font-mono text-[#0284c7]">
              ₹ {mcapStats['Large Cap'].val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs font-bold text-[#5a6359] mt-1 m-0">{mcapStats['Large Cap'].weight}% Portfolio Weight</p>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card size="small" className="card-pick-elevation bg-[#fffef9] rounded-2xl cursor-pointer">
            <div className="flex items-center justify-between mb-1">
              <Tag color="success" className="font-bold text-xs rounded-md">Mid Cap</Tag>
              <span className="text-xs text-[#5a6359]/70 font-mono font-bold">{mcapStats['Mid Cap'].count} Stocks</span>
            </div>
            <div className="text-lg font-extrabold font-mono text-[#15803d]">
              ₹ {mcapStats['Mid Cap'].val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs font-bold text-[#5a6359] mt-1 m-0">{mcapStats['Mid Cap'].weight}% Portfolio Weight</p>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card size="small" className="card-pick-elevation bg-[#fffef9] rounded-2xl cursor-pointer">
            <div className="flex items-center justify-between mb-1">
              <Tag color="warning" className="font-bold text-xs rounded-md">Small Cap</Tag>
              <span className="text-xs text-[#5a6359]/70 font-mono font-bold">{mcapStats['Small Cap'].count} Stocks</span>
            </div>
            <div className="text-lg font-extrabold font-mono text-[#e87131]">
              ₹ {mcapStats['Small Cap'].val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs font-bold text-[#5a6359] mt-1 m-0">{mcapStats['Small Cap'].weight}% Portfolio Weight</p>
          </Card>
        </Col>
      </Row>

      {/* 2. Top Chart Row: Capital Allocation Donut (Small Gap) & Performance Value Bars */}
      <Row gutter={[16, 16]} className="mb-6">
        {/* Chart 1: Capital Allocation Donut / Pie Chart (Small Gap: paddingAngle=1) */}
        <Col xs={24} lg={12}>
          <Card
            size="small"
            title={
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-extrabold text-xs font-mono text-[#5a6359] flex items-center gap-1.5 uppercase">
                  <PieChartOutlined className="text-[#e87131] text-base" /> Capital Allocation Distribution
                </span>
                <Radio.Group
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  optionType="button"
                  buttonStyle="solid"
                  size="small"
                  className="font-mono text-xs"
                >
                  <Radio.Button value="ticker">By Ticker</Radio.Button>
                  <Radio.Button value="sector">By Sector</Radio.Button>
                  <Radio.Button value="mcap">By Market Cap</Radio.Button>
                </Radio.Group>
              </div>
            }
            className="card-pick-elevation bg-[#fffef9] rounded-2xl h-full p-2"
          >
            <div className="h-80 w-full">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[#5a6359]/60 text-xs font-medium">
                  No active portfolio holdings to display allocation.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="48%"
                      innerRadius={65}
                      outerRadius={102}
                      paddingAngle={1} /* Reduced from 4 to 1 for small, elegant separation gap */
                      dataKey="value"
                      animationDuration={800}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color || COLOR_PALETTE[index % COLOR_PALETTE.length]}
                          stroke="#fffef9"
                          strokeWidth={1.5}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={40}
                      formatter={(value) => (
                        <span className="text-[11px] text-[#5a6359] font-bold mx-1 font-mono">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </Col>

        {/* Chart 2: Invested Capital vs Current Market Value */}
        <Col xs={24} lg={12}>
          <Card
            size="small"
            title={
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs font-mono text-[#5a6359] flex items-center gap-1.5 uppercase">
                  <BarChartOutlined className="text-[#e87131] text-base" /> Invested Capital vs Current Value (₹)
                </span>
                <span className="text-[10px] font-mono text-[#5a6359]/70 font-bold">Unrealized Capital Growth</span>
              </div>
            }
            className="card-pick-elevation bg-[#fffef9] rounded-2xl h-full p-2"
          >
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceBarData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fbeed6" />
                  <XAxis dataKey="ticker" tick={{ fontSize: 11, fill: '#5a6359', fontWeight: 'bold' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#5a6359' }} />
                  <Tooltip content={<CustomPerfTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-[11px] text-[#5a6359] font-bold mx-1 font-mono">
                        {value === 'invested' ? 'Invested Capital (₹)' : 'Current Market Value (₹)'}
                      </span>
                    )}
                  />
                  <Bar dataKey="invested" fill="#94a3b8" radius={[4, 4, 0, 0]} name="invested" />
                  <Bar dataKey="current" fill="#e87131" radius={[4, 4, 0, 0]} name="current" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 3. Bottom Chart Row: Fundamental Quality Matrix & Valuation Multiples */}
      <Row gutter={[16, 16]}>
        {/* Chart 3: Quantitative Fundamental Matrix (ROCE % vs Sales Growth %) */}
        <Col xs={24} lg={12}>
          <Card
            size="small"
            title={
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs font-mono text-[#5a6359] flex items-center gap-1.5 uppercase">
                  <RiseOutlined className="text-emerald-600 text-base" /> Capital Compounding vs Sales Growth
                </span>
                <Tag color="success" className="font-mono text-[10px] font-bold rounded m-0">5-Yr ROCE vs 3-Yr Sales CAGR</Tag>
              </div>
            }
            className="card-pick-elevation bg-[#fffef9] rounded-2xl p-2"
          >
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={fundamentalsData} margin={{ top: 15, right: 25, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fbeed6" />
                  <XAxis dataKey="ticker" tick={{ fontSize: 11, fill: '#5a6359', fontWeight: 'bold' }} />
                  {/* Left Y-Axis for Financial Growth & Return Percentages (%) */}
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 10, fill: '#5a6359' }}
                    unit="%"
                  />
                  {/* Right Y-Axis for Quality Score (0 to 10 scale) */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 10]}
                    ticks={[0, 2, 4, 6, 8, 10]}
                    tick={{ fontSize: 10, fill: '#e87131', fontWeight: 'bold' }}
                    unit="/10"
                  />
                  <Tooltip content={<CustomFundTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-[11px] text-[#5a6359] font-bold mx-1 font-mono">
                        {value === 'roce' ? '5-Yr ROCE (%)' : value === 'salesGrowth' ? '3-Yr Sales CAGR (%)' : 'Quality Score (Right Axis: /10)'}
                      </span>
                    )}
                  />
                  <Bar yAxisId="left" dataKey="roce" fill="#15803d" radius={[4, 4, 0, 0]} name="roce" />
                  <Bar yAxisId="left" dataKey="salesGrowth" fill="#0284c7" radius={[4, 4, 0, 0]} name="salesGrowth" />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="score"
                    stroke="#e87131"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#e87131', stroke: '#fffef9', strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: '#e87131' }}
                    name="score"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Chart 4: Valuation Multiples & Reference Benchmark */}
        <Col xs={24} lg={12}>
          <Card
            size="small"
            title={
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs font-mono text-[#5a6359] flex items-center gap-1.5 uppercase">
                  <FundOutlined className="text-purple-600 text-base" /> Valuation P/E Multiples vs 35x Threshold
                </span>
                <span className="text-[10px] font-mono text-[#5a6359]/70 font-bold">Valuation Risk Benchmark</span>
              </div>
            }
            className="card-pick-elevation bg-[#fffef9] rounded-2xl p-2"
          >
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fundamentalsData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fbeed6" />
                  <XAxis dataKey="ticker" tick={{ fontSize: 11, fill: '#5a6359', fontWeight: 'bold' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#5a6359' }} />
                  <Tooltip
                    formatter={(val, name) => [`${val}x`, name === 'pe' ? 'Stock P/E Ratio' : name]}
                    labelStyle={{ fontWeight: 'bold', color: '#5a6359' }}
                    contentStyle={{ backgroundColor: '#fffef9', borderRadius: '12px', border: '1px solid #e87131' }}
                  />
                  <ReferenceLine y={35.0} stroke="#b91c1c" strokeDasharray="4 4" label={{ value: '35x Valuation Threshold', position: 'insideTopRight', fill: '#b91c1c', fontSize: 10, fontWeight: 'bold' }} />
                  <Bar
                    dataKey="pe"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                    name="Stock P/E Ratio"
                  >
                    {fundamentalsData.map((entry, index) => (
                      <Cell
                        key={`cell-pe-${index}`}
                        fill={entry.pe > 45 ? '#b91c1c' : entry.pe > 30 ? '#e87131' : '#15803d'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
