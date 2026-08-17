import React, { useMemo } from 'react';
import { Row, Col, Card, Statistic, Tag } from 'antd';
import {
  DollarOutlined,
  BankOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';

export const MetricsHeader = ({ portfolio }) => {
  if (!portfolio || !portfolio.holdings) return null;

  const isProfit = portfolio.unrealized_pnl >= 0;

  // Sort holdings descending by Current Market Value (largest position first)
  const holdings = useMemo(() => {
    return [...portfolio.holdings].sort((a, b) => {
      const valA = a.current_market_value || a.quantity * (a.current_price || 0);
      const valB = b.current_market_value || b.quantity * (b.current_price || 0);
      return valB - valA;
    });
  }, [portfolio.holdings]);

  return (
    <div className="mb-6">
      {/* 4 Summary Cards with Always-Visible Per-Stock Lists Sorted by Market Value */}
      <Row gutter={[16, 16]}>
        {/* Card 1: Total Market Value */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            className="card-pick-elevation bg-[#fffef9] rounded-2xl h-full flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <Statistic
                  title={<span className="text-xs font-bold uppercase tracking-wider text-[#5a6359]/70">Total Market Value</span>}
                  value={portfolio.total_portfolio_value}
                  precision={2}
                  prefix="₹"
                  valueStyle={{ color: '#5a6359', fontWeight: 800, fontSize: '1.4rem', fontFamily: 'monospace' }}
                />
                <div className="w-9 h-9 rounded-xl bg-[#e87131]/10 flex items-center justify-center text-[#e87131]">
                  <DollarOutlined className="text-lg" />
                </div>
              </div>
              <p className="text-[11px] text-[#5a6359]/70 mt-1 m-0 font-medium pb-2 border-b border-[#fbeed6]">
                Live aggregated holding worth (Sorted by Market Value)
              </p>

              {/* Per-Stock Market Value List (Sorted Descending, Colored by Profit/Loss) */}
              <div className="mt-3 space-y-1.5 font-mono text-xs">
                {holdings.map((h) => {
                  const mktVal = h.current_market_value || h.quantity * (h.current_price || 0);
                  const invCost = h.invested_value || h.quantity * (h.avg_buy_price || 0);
                  const isStockPos = mktVal >= invCost;

                  return (
                    <div key={h.ticker} className="flex items-center justify-between bg-[#fdf9ec] p-2 rounded-xl text-[11px]">
                      <div>
                        <span className="font-bold text-[#5a6359] block">{h.ticker}</span>
                        <span className="text-[10px] text-[#5a6359]/60">
                          {h.quantity} × ₹{h.current_price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <span className={`font-extrabold ${isStockPos ? 'text-emerald-700' : 'text-rose-700'}`}>
                        ₹{mktVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </Col>

        {/* Card 2: Invested Capital */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            className="card-pick-elevation bg-[#fffef9] rounded-2xl h-full flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <Statistic
                  title={<span className="text-xs font-bold uppercase tracking-wider text-[#5a6359]/70">Invested Capital</span>}
                  value={portfolio.total_invested_capital}
                  precision={2}
                  prefix="₹"
                  valueStyle={{ color: '#5a6359', fontWeight: 800, fontSize: '1.4rem', fontFamily: 'monospace' }}
                />
                <div className="w-9 h-9 rounded-xl bg-[#e87131]/10 flex items-center justify-center text-[#e87131]">
                  <BankOutlined className="text-lg" />
                </div>
              </div>
              <p className="text-[11px] text-[#5a6359]/70 mt-1 m-0 font-medium pb-2 border-b border-[#fbeed6]">
                User input cost basis (Sorted by Market Value)
              </p>

              {/* Per-Stock Invested Cost List */}
              <div className="mt-3 space-y-1.5 font-mono text-xs">
                {holdings.map((h) => {
                  const invCost = h.invested_value || h.quantity * (h.avg_buy_price || 0);

                  return (
                    <div key={h.ticker} className="flex items-center justify-between bg-[#fdf9ec] p-2 rounded-xl text-[11px]">
                      <div>
                        <span className="font-bold text-[#5a6359] block">{h.ticker}</span>
                        <span className="text-[10px] text-[#5a6359]/60">
                          {h.quantity} × ₹{h.avg_buy_price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <span className="font-bold text-[#5a6359]">
                        ₹{invCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </Col>

        {/* Card 3: Unrealized P&L */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            className="card-pick-elevation bg-[#fffef9] rounded-2xl h-full flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <Statistic
                  title={<span className="text-xs font-bold uppercase tracking-wider text-[#5a6359]/70">Unrealized P&L</span>}
                  value={portfolio.unrealized_pnl}
                  precision={2}
                  prefix={isProfit ? "+₹" : "-₹"}
                  valueStyle={{ color: isProfit ? '#15803d' : '#b91c1c', fontWeight: 800, fontSize: '1.4rem', fontFamily: 'monospace' }}
                />
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isProfit ? 'bg-emerald-500/10 text-emerald-700' : 'bg-rose-500/10 text-rose-700'}`}>
                  {isProfit ? <ArrowUpOutlined className="text-lg" /> : <ArrowDownOutlined className="text-lg" />}
                </div>
              </div>
              <p className={`text-[11px] font-bold mt-1 m-0 pb-2 border-b border-[#fbeed6] ${isProfit ? 'text-emerald-700' : 'text-rose-700'}`}>
                {isProfit ? '+' : ''}{portfolio.unrealized_pnl_pct}% Total Return
              </p>

              {/* Per-Stock P&L List (Colored Green/Red) */}
              <div className="mt-3 space-y-1.5 font-mono text-xs">
                {holdings.map((h) => {
                  const mktVal = h.current_market_value || h.quantity * (h.current_price || 0);
                  const invCost = h.invested_value || h.quantity * (h.avg_buy_price || 0);
                  const pnl = h.unrealized_pnl || mktVal - invCost;
                  const pnlPct = h.unrealized_pnl_pct || (invCost > 0 ? ((pnl / invCost) * 100).toFixed(2) : 0);
                  const isStockPos = pnl >= 0;

                  return (
                    <div key={h.ticker} className="flex items-center justify-between bg-[#fdf9ec] p-2 rounded-xl text-[11px]">
                      <div>
                        <span className="font-bold text-[#5a6359] block">{h.ticker}</span>
                        <span className="text-[10px] text-[#5a6359]/60">{h.quantity} shares</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-extrabold block ${isStockPos ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isStockPos ? '+' : ''}₹{pnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className={`text-[10px] font-bold ${isStockPos ? 'text-emerald-700' : 'text-rose-700'}`}>
                          ({isStockPos ? '+' : ''}{pnlPct}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </Col>

        {/* Card 4: Tracked Companies */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            className="card-pick-elevation bg-[#fffef9] rounded-2xl h-full flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <Statistic
                  title={<span className="text-xs font-bold uppercase tracking-wider text-[#5a6359]/70">Tracked Companies</span>}
                  value={holdings.length}
                  suffix="Holdings"
                  valueStyle={{ color: '#5a6359', fontWeight: 800, fontSize: '1.4rem', fontFamily: 'monospace' }}
                />
                <div className="w-9 h-9 rounded-xl bg-[#e87131]/10 flex items-center justify-center text-[#e87131]">
                  <UnorderedListOutlined className="text-lg" />
                </div>
              </div>
              <p className="text-[11px] text-[#5a6359]/70 mt-1 m-0 font-medium pb-2 border-b border-[#fbeed6]">
                Screener delta-synced
              </p>

              {/* Per-Stock Quantity & Weightage List */}
              <div className="mt-3 space-y-1.5 font-mono text-xs">
                {holdings.map((h) => (
                  <div key={h.ticker} className="flex items-center justify-between bg-[#fdf9ec] p-2 rounded-xl text-[11px]">
                    <div>
                      <span className="font-bold text-[#5a6359] block">{h.ticker}</span>
                      <span className="text-[10px] text-[#5a6359]/60">{h.sector || 'Uncategorized'}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#e87131] block">{h.quantity} shares</span>
                      <span className="text-[10px] text-[#5a6359]/70 font-semibold">{h.weightage_pct}% weight</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
