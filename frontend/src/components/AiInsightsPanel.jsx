import React, { useMemo } from 'react';
import { Card, Spin, Alert, Tag, Row, Col, Button, Popover, Collapse } from 'antd';
import {
  AuditOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  RiseOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SafetyOutlined,
  BulbOutlined,
} from '@ant-design/icons';

export const AiInsightsPanel = ({
  insights,
  isLoading,
  onRefresh,
}) => {
  const recommendations = insights?.rebalancing_recommendations || [];

  // Group recommendations cleanly into 3 distinct primary action plan lists
  const { buyList, trimList, valueList } = useMemo(() => {
    const buy = [];
    const trim = [];
    const val = [];

    const seenBuy = new Set();
    const seenTrim = new Set();
    const seenVal = new Set();

    recommendations.forEach((rec) => {
      const cat = (rec.category || '').toLowerCase();
      const ticker = (rec.ticker || '').toUpperCase();

      if (cat === 'buy' && !seenBuy.has(ticker)) {
        seenBuy.add(ticker);
        buy.push(rec);
      } else if (cat === 'trim' && !seenTrim.has(ticker)) {
        seenTrim.add(ticker);
        trim.push(rec);
      } else if (cat === 'value' && !seenVal.has(ticker)) {
        seenVal.add(ticker);
        val.push(rec);
      }
    });

    return { buyList: buy, trimList: trim, valueList: val };
  }, [recommendations]);

  if (isLoading) {
    return (
      <Card className="card-pick-elevation bg-[#fffef9] rounded-2xl p-6 text-center mb-8">
        <Spin indicator={<BulbOutlined spin className="text-3xl text-[#e87131] mb-3" />} />
        <h4 className="text-base font-bold text-[#5a6359] mb-1 font-['Plus_Jakarta_Sans',sans-serif]">Analyzing Portfolio Ratio Matrix & Financial Sheets...</h4>
        <p className="text-xs text-[#5a6359]/70 m-0 font-medium">Evaluating cost basis vs Screener 27 valuation ratios, ROCE, debt leverage, and multi-sheet statements</p>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card className="card-pick-elevation bg-[#fffef9] rounded-2xl p-6 text-center mb-8">
        <AuditOutlined className="text-3xl text-[#e87131] mb-2 opacity-80" />
        <h4 className="text-sm font-bold text-[#5a6359] font-['Plus_Jakarta_Sans',sans-serif]">AI Portfolio Critique Offline</h4>
        <p className="text-xs text-[#5a6359]/70 mb-4 font-medium">Click below to generate real-time quantitative critique & portfolio reorganization advice.</p>
        <Button
          type="primary"
          icon={<BulbOutlined />}
          onClick={onRefresh}
          className="bg-[#e87131] hover:bg-[#e87131]/90 border-0 rounded-xl font-bold text-white shadow-md font-mono"
        >
          Generate AI Portfolio Critique
        </Button>
      </Card>
    );
  }

  // Helper to render Collapse items inside scrollable plan lists
  const renderCollapsePlanList = (list) => {
    if (!list || list.length === 0) {
      return <div className="text-xs text-[#5a6359]/60 p-2 font-medium">No active recommendations in this category.</div>;
    }

    const items = list.map((rec, index) => ({
      key: String(index),
      label: (
        <div className="flex items-center justify-between w-full pr-2">
          <span className="font-extrabold text-[#5a6359] text-base font-mono tracking-tight">
            {rec.ticker}
          </span>
          <Tag className="font-mono text-xs font-bold text-[#e87131] border-0 bg-[#fffef9] m-0 shadow-xs">
            Target: {rec.target_weightage_pct}% Weight
          </Tag>
        </div>
      ),
      children: (
        <p className="text-xs text-[#5a6359] m-0 leading-relaxed font-medium bg-[#fdf9ec] p-2 rounded-lg border border-[#fbeed6]">
          {rec.rationale}
        </p>
      ),
    }));

    return (
      <Collapse
        defaultActiveKey={[]}
        ghost
        expandIconPosition="end"
        items={items}
        className="antd-custom-collapse"
      />
    );
  };

  return (
    <Card className="card-pick-elevation bg-[#fffef9] rounded-2xl mb-8 p-2">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-[#e87131] flex items-center justify-center text-white text-base shadow-sm">
            <AuditOutlined />
          </div>
          <span className="font-bold text-[#5a6359] text-sm font-mono">AI Quantitative Advisor</span>
        </div>
        <Button
          type="default"
          size="small"
          icon={<ReloadOutlined />}
          onClick={onRefresh}
          className="bg-[#fdf9ec] border-[#fbeed6] text-[#5a6359] hover:text-[#e87131] rounded-lg text-xs font-semibold"
        >
          Re-Analyze Portfolio
        </Button>
      </div>

      {/* Executive Summary */}
      <Alert
        message={<span className="font-bold text-[#e87131]">Executive Summary & Multi-Statement Diagnosis</span>}
        description={<span className="text-xs text-[#5a6359] font-medium leading-relaxed">{insights.summary}</span>}
        type="info"
        showIcon
        icon={<CheckCircleOutlined className="text-[#e87131]" />}
        className="bg-[#fdf9ec] border-[#e87131]/30 rounded-xl mb-6 shadow-sm"
      />

      {/* Diagnostics Row */}
      <Row gutter={[16, 16]} className="mb-6">
        {/* Ratio & Solvency Critique */}
        <Col xs={24} md={12}>
          <Card
            size="small"
            title={
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5 font-mono">
                  <WarningOutlined /> Ratio & Solvency Critique ({insights.anomalies?.length || 0})
                </span>
                <span className="text-[10px] text-[#5a6359]/70 font-mono font-medium">Multi-Statement Diagnostics</span>
              </div>
            }
            className="card-pick-elevation bg-[#fdf9ec] rounded-xl border-[#e87131]/20"
          >
            {(!insights.anomalies || insights.anomalies.length === 0) ? (
              <p className="text-xs text-[#5a6359]/70 m-0 font-medium p-3">No critical ratio anomalies or leverage risks detected.</p>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar p-1">
                {insights.anomalies.map((anom, i) => {
                  const isOpp = anom.severity === 'Opportunity';
                  const isHigh = anom.severity === 'High';
                  const isVal = anom.severity === 'Valuation Risk';

                  return (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border text-xs shadow-xs transition-all ${
                        isOpp
                          ? 'bg-emerald-50/80 border-emerald-200'
                          : isHigh
                          ? 'bg-rose-50/90 border-rose-300'
                          : isVal
                          ? 'bg-amber-50/80 border-amber-200'
                          : 'bg-rose-50/50 border-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold mb-1.5 flex-wrap gap-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-extrabold text-[#5a6359] text-xs bg-white px-1.5 py-0.5 rounded border border-[#e87131]/20">
                            {anom.ticker || 'PORTFOLIO'}
                          </span>
                          <span className={`${isOpp ? 'text-emerald-900' : 'text-rose-900'} text-xs font-bold`}>
                            {anom.type}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {anom.metric_badge && (
                            <Tag className="font-mono text-[9px] font-bold bg-white text-[#5a6359] border-[#5a6359]/20 rounded m-0">
                              {anom.metric_badge}
                            </Tag>
                          )}
                          <Tag
                            color={isOpp ? 'success' : isHigh ? 'error' : isVal ? 'warning' : 'default'}
                            className="text-[9px] font-extrabold uppercase rounded m-0 border-0"
                          >
                            {anom.severity}
                          </Tag>
                        </div>
                      </div>
                      <p className={`text-[11px] m-0 font-medium leading-relaxed ${isOpp ? 'text-emerald-800' : 'text-rose-900/90'}`}>
                        {anom.details}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>

        {/* Allocation & Concentration Risks */}
        <Col xs={24} md={12}>
          <Card
            size="small"
            title={
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5 font-mono">
                  <InfoCircleOutlined /> Allocation & Concentration Risks ({insights.concentration_warnings?.length || 0})
                </span>
                <span className="text-[10px] text-[#5a6359]/70 font-mono font-medium">Portfolio Structure Audit</span>
              </div>
            }
            className="card-pick-elevation bg-[#fdf9ec] rounded-xl border-[#e87131]/20"
          >
            {(!insights.concentration_warnings || insights.concentration_warnings.length === 0) ? (
              <p className="text-xs text-[#5a6359]/70 m-0 font-medium p-3">Portfolio weightages are well diversified across stocks and sectors.</p>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar p-1">
                {insights.concentration_warnings.map((warn, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-amber-50/90 border border-amber-300 text-xs shadow-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-amber-900 mb-1.5 flex-wrap gap-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-extrabold text-[#5a6359] text-xs bg-white px-1.5 py-0.5 rounded border border-[#e87131]/20">
                          {warn.target || warn.ticker || warn.sector}
                        </span>
                        <span className="text-amber-950 text-xs font-bold">
                          {warn.type || 'Concentration Risk'}
                        </span>
                      </div>
                      {warn.badge && (
                        <Tag className="font-mono text-[9px] font-extrabold bg-amber-200 text-amber-900 border-0 rounded m-0">
                          {warn.badge}
                        </Tag>
                      )}
                    </div>
                    <p className="text-amber-900 text-[11px] m-0 font-medium leading-relaxed">{warn.details}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 3 Primary Action Plan Lists */}
      <div className="p-4 rounded-2xl bg-[#fdf9ec] border border-[#fbeed6]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-4 flex items-center gap-1.5 font-mono">
          <RiseOutlined /> Portfolio Rebalancing & Reorganization Action Plans
        </h4>

        <Row gutter={[16, 16]}>
          {/* List 1: Buy & Accumulate Plan */}
          <Col xs={24} md={8}>
            <Card
              size="small"
              className="card-pick-elevation bg-[#fffef9] border-[#fbeed6] rounded-xl h-full flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#fbeed6]">
                  <Popover
                    title={<span className="font-extrabold text-[#e87131] text-xs font-mono">🟢 Buy & Accumulate Plan</span>}
                    content={
                      <div className="max-w-xs text-xs text-[#5a6359] leading-relaxed space-y-2">
                        <p className="m-0">Evaluates multi-metric quality & growth drivers: <strong>5-Yr ROCE (&gt;15%)</strong>, <strong>ROE (&gt;15%)</strong>, <strong>3-Yr Sales Growth (&gt;10%)</strong>, and <strong>YoY Profit Growth (&gt;10%)</strong>. Recommends systematically accumulating elite compounders to build long-term wealth positions.</p>
                        <div className="pt-1.5 border-t border-[#fbeed6] flex items-center justify-between font-mono font-bold">
                          <span className="text-[#5a6359]/80">Primary Directive:</span>
                          <Tag color="success" className="font-extrabold m-0 uppercase">BUY / ACCUMULATE</Tag>
                        </div>
                      </div>
                    }
                  >
                    <span className="font-bold text-xs uppercase tracking-wider text-emerald-800 flex items-center gap-1 cursor-pointer hover:underline font-mono">
                      <ArrowUpOutlined /> Buy & Accumulate Plan
                    </span>
                  </Popover>
                  <Tag color="success" className="font-mono text-[10px] font-extrabold m-0">
                    {buyList.length} Items
                  </Tag>
                </div>

                <div className="max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                  {renderCollapsePlanList(buyList)}
                </div>
              </div>
            </Card>
          </Col>

          {/* List 2: Trim & Take Profit Plan */}
          <Col xs={24} md={8}>
            <Card
              size="small"
              className="card-pick-elevation bg-[#fffef9] border-[#fbeed6] rounded-xl h-full flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#fbeed6]">
                  <Popover
                    title={<span className="font-extrabold text-rose-700 text-xs font-mono">🔴 Trim & Take Profit Plan</span>}
                    content={
                      <div className="max-w-xs text-xs text-[#5a6359] leading-relaxed space-y-2">
                        <p className="m-0">Flags stocks with stretched P/E multiples (&gt;45.0) or single-stock weightages exceeding 22%. Recommends trimming positions to lock in unrealized profits and mitigate downside risk.</p>
                        <div className="pt-1.5 border-t border-[#fbeed6] flex items-center justify-between font-mono font-bold">
                          <span className="text-[#5a6359]/80">Primary Directive:</span>
                          <Tag color="error" className="font-extrabold m-0 uppercase">SELL / TRIM</Tag>
                        </div>
                      </div>
                    }
                  >
                    <span className="font-bold text-xs uppercase tracking-wider text-rose-800 flex items-center gap-1 cursor-pointer hover:underline font-mono">
                      <ArrowDownOutlined /> Trim & Take Profit Plan
                    </span>
                  </Popover>
                  <Tag color="error" className="font-mono text-[10px] font-extrabold m-0">
                    {trimList.length} Items
                  </Tag>
                </div>

                <div className="max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                  {renderCollapsePlanList(trimList)}
                </div>
              </div>
            </Card>
          </Col>

          {/* List 3: Graham Value & Moat Plan */}
          <Col xs={24} md={8}>
            <Card
              size="small"
              className="card-pick-elevation bg-[#fffef9] border-[#fbeed6] rounded-xl h-full flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#fbeed6]">
                  <Popover
                    title={<span className="font-extrabold text-amber-700 text-xs font-mono">💎 Graham Value & Moat Plan</span>}
                    content={
                      <div className="max-w-xs text-xs text-[#5a6359] leading-relaxed space-y-2">
                        <p className="m-0">Detects companies trading below their Benjamin Graham Intrinsic Value with low PEG ratios (&lt;1.0) and high return on capital. Recommends capitalizing on deep valuation discounts.</p>
                        <div className="pt-1.5 border-t border-[#fbeed6] flex items-center justify-between font-mono font-bold">
                          <span className="text-[#5a6359]/80">Primary Directive:</span>
                          <Tag color="warning" className="font-extrabold m-0 uppercase">VALUE BUY</Tag>
                        </div>
                      </div>
                    }
                  >
                    <span className="font-bold text-xs uppercase tracking-wider text-amber-800 flex items-center gap-1 cursor-pointer hover:underline font-mono">
                      <SafetyOutlined /> Graham Value & Moat Plan
                    </span>
                  </Popover>
                  <Tag color="warning" className="font-mono text-[10px] font-extrabold m-0">
                    {valueList.length} Items
                  </Tag>
                </div>

                <div className="max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                  {renderCollapsePlanList(valueList)}
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </Card>
  );
};
