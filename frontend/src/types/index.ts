export interface FinancialMetrics {
  ticker?: string;
  company_name?: string;
  current_price?: number;
  market_cap_cr?: number;
  high_52w?: number;
  low_52w?: number;
  pe_ratio?: number;
  book_value?: number;
  pb_ratio?: number;
  dividend_yield_pct?: number;
  roce_pct?: number;
  roe_pct?: number;
  face_value?: number;
  roce_5yr?: number;
  roe_5yr?: number;
  cmp_fcf?: number;
  eps?: number;
  promoter_holding_pct?: number;
  pledged_pct?: number;
  peg_ratio?: number;
  profit_growth_pct?: number;
  sales_growth_3yr?: number;
  reserves_cr?: number;
  profit_var_3yr?: number;
  sales_growth_5yr?: number;
  debt_to_equity?: number;
  qtr_profit_var_pct?: number;
  down_from_52w_high_pct?: number;
  profit_var_5yr?: number;
  qtr_sales_var_pct?: number;
  intrinsic_value?: number;
  last_scraped_at?: string;
}

export interface PortfolioHolding {
  holding_id: string;
  ticker: string;
  company_name: string;
  quantity: number;
  avg_buy_price: number;
  total_invested: number;
  current_price: number;
  current_market_value: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  weightage_pct: number;
  sector: string;
  notes?: string;
  metrics?: FinancialMetrics;
}

export interface PortfolioSummaryResponse {
  user_id: string;
  portfolio_name: string;
  holdings: PortfolioHolding[];
  total_portfolio_value: number;
  total_invested_capital: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  updated_at: string;
}

export interface ValuationAnomaly {
  ticker?: string;
  type: string;
  severity: 'High' | 'Medium' | 'Low';
  details: string;
}

export interface ConcentrationWarning {
  ticker?: string;
  sector?: string;
  weightage_pct: number;
  details: string;
}

export interface RebalancingRecommendation {
  ticker: string;
  action: 'BUY' | 'ACCUMULATE / AVERAGE DOWN' | 'HOLD' | 'TRIM / TAKE PROFIT' | 'SELL';
  target_weightage_pct: number;
  rationale: string;
}

export interface AIInsightsResponse {
  summary: string;
  anomalies: ValuationAnomaly[];
  concentration_warnings: ConcentrationWarning[];
  rebalancing_recommendations: RebalancingRecommendation[];
  generated_at?: string;
}

export interface ScrapeTriggerResponse {
  status: string;
  scraped_tickers: string[];
  skipped_tickers: string[];
  errors: { ticker: string; reason: string }[];
  circuit_breaker_triggered: boolean;
}
