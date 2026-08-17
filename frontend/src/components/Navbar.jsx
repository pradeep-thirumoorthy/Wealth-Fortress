import React from 'react';
import { Layout, Button, Tag, Space } from 'antd';
import {
  SyncOutlined,
  PlusOutlined,
  BulbOutlined,
  WarningOutlined,
  StockOutlined,
} from '@ant-design/icons';

const { Header } = Layout;

export const Navbar = ({
  onOpenAddModal,
  onTriggerScrape,
  onGenerateInsights,
  isScraping,
  circuitBreakerActive,
}) => {
  return (
    <Header className="sticky top-0 z-40 w-full px-6 h-20 bg-[#fffef9]/90 backdrop-blur-xl border-b border-[#fbeed6] flex items-center justify-between shadow-sm">
      {/* Brand Title */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-[#e87131] flex items-center justify-center shadow-lg shadow-[#e87131]/20 text-white text-xl">
          <StockOutlined />
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-[#5a6359] m-0 font-['Plus_Jakarta_Sans',sans-serif]">
            Wealth Fortress
          </h1>
          <p className="text-xs text-[#5a6359]/70 m-0">Screener.in Data Engine & Portfolio Intelligence</p>
        </div>
      </div>

      {/* Action Controls using Antd Buttons */}
      <Space size="middle">
        {circuitBreakerActive && (
          <Tag icon={<WarningOutlined />} color="error" className="animate-pulse px-3 py-1 text-xs">
            Circuit Breaker Tripped
          </Tag>
        )}

        <Button
          type="default"
          size="large"
          icon={<SyncOutlined spin={isScraping} className="text-[#e87131]" />}
          onClick={onTriggerScrape}
          loading={isScraping}
          className="bg-[#fdf9ec] border-[#e87131]/40 text-[#5a6359] hover:text-[#e87131] hover:border-[#e87131] rounded-xl font-semibold"
        >
          {isScraping ? 'Scraping Screener...' : 'Sync Screener Ratios'}
        </Button>

        <Button
          type="primary"
          size="large"
          icon={<BulbOutlined />}
          onClick={onGenerateInsights}
          className="bg-[#e87131] hover:bg-[#e87131]/90 border-0 text-white rounded-xl shadow-md font-semibold font-mono"
        >
          AI Advisor
        </Button>

        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={onOpenAddModal}
          className="bg-emerald-700 hover:bg-emerald-600 border-0 text-white rounded-xl shadow-md font-semibold font-mono"
        >
          Add Holding
        </Button>
      </Space>
    </Header>
  );
};
