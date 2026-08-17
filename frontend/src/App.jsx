import React, { useState, useEffect } from 'react';
import { ConfigProvider, theme, Layout, Spin, Alert, Tabs, FloatButton } from 'antd';
import {
  TableOutlined,
  PieChartOutlined,
  LoadingOutlined,
  InfoCircleOutlined,
  DashboardOutlined,
  CalendarOutlined,
  CompassOutlined,
  MessageOutlined,
  AuditOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { Navbar } from './components/Navbar';
import { MetricsHeader } from './components/MetricsHeader';
import { HoldingModal } from './components/HoldingModal';
import { ViewRatiosModal } from './components/ViewRatiosModal';
import { CapitalAllocationChart } from './components/CapitalAllocationChart';
import { CustomRatioMatrix } from './components/CustomRatioMatrix';
import { AiInsightsPanel } from './components/AiInsightsPanel';
import { QuarterlyResultsTab } from './components/QuarterlyResultsTab';
import { AiChatDrawer } from './components/AiChatDrawer';
import { fetchPortfolio, addHolding, updateHolding, deleteHolding, triggerScrape, fetchAIInsights } from './services/api';

const { Content } = Layout;

export const App = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [circuitBreakerActive, setCircuitBreakerActive] = useState(false);
  const [notification, setNotification] = useState(null);

  // Add/Edit Holding Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState(null);

  // View Ratios Modal State
  const [isRatiosModalOpen, setIsRatiosModalOpen] = useState(false);
  const [selectedRatiosHolding, setSelectedRatiosHolding] = useState(null);

  // Interactive AI Chat Copilot Drawer State
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);

  const loadPortfolioData = async () => {
    try {
      setIsLoadingPortfolio(true);
      const data = await fetchPortfolio();
      setPortfolio(data);
    } catch (err) {
      console.error(err);
      showNotification(`Failed to load portfolio: ${err.message}`);
    } finally {
      setIsLoadingPortfolio(false);
    }
  };

  useEffect(() => {
    loadPortfolioData();
    handleGenerateInsights(true);
  }, []);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 6000);
  };

  const handleSaveHolding = async (holdingData) => {
    try {
      if (selectedHolding) {
        await updateHolding(selectedHolding.ticker, holdingData);
        showNotification(`Holding ${selectedHolding.ticker} updated successfully`);
      } else {
        await addHolding(holdingData);
        showNotification(`Holding ${holdingData.ticker} added successfully`);
      }
      setIsModalOpen(false);
      setSelectedHolding(null);
      await loadPortfolioData();
      handleGenerateInsights(true);
    } catch (err) {
      showNotification(`Error: ${err.message}`);
    }
  };

  const handleDeleteHolding = async (ticker) => {
    try {
      await deleteHolding(ticker);
      showNotification(`Holding ${ticker} removed`);
      await loadPortfolioData();
      handleGenerateInsights(true);
    } catch (err) {
      showNotification(`Failed to delete holding: ${err.message}`);
    }
  };

  const handleEditHolding = (holding) => {
    setSelectedHolding(holding);
    setIsModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setSelectedHolding(null);
    setIsModalOpen(true);
  };

  const handleViewRatios = (holding) => {
    setSelectedRatiosHolding(holding);
    setIsRatiosModalOpen(true);
  };

  const handleTriggerScrape = async () => {
    try {
      setIsScraping(true);
      const res = await triggerScrape();
      showNotification(`Scrape completed: ${res.synced_count} ratios updated successfully.`);
      await loadPortfolioData();
      handleGenerateInsights(true);
    } catch (err) {
      showNotification(`Scrape failed: ${err.message}`);
    } finally {
      setIsScraping(false);
    }
  };

  const handleGenerateInsights = async (silent = false) => {
    try {
      setIsLoadingInsights(true);
      const data = await fetchAIInsights();
      const resolved = (data && data.insights) ? data.insights : data;
      setAiInsights(resolved);
      if (!silent) {
        showNotification('AI Quantitative Insights & Portfolio Rebalancing Plan generated.');
      }
    } catch (err) {
      if (!silent) {
        showNotification(`AI Analysis failed: ${err.message}`);
      }
    } finally {
      setIsLoadingInsights(false);
    }
  };

  // 5 Main Tabs (Tab 1: Overview, Tab 2: Ratio Matrix, Tab 3: Capital Allocation, Tab 4: Quantitative Analysis, Tab 5: AI Portfolio Critique)
  const tabItems = [
    {
      key: 'overview',
      label: (
        <span className="font-semibold px-2 py-1 flex items-center gap-2 text-sm text-[#5a6359]">
          <DashboardOutlined className="text-[#e87131]" />
          Portfolio Overview
        </span>
      ),
      children: <MetricsHeader portfolio={portfolio} />,
    },
    {
      key: 'allocation',
      label: (
        <span className="font-semibold px-2 py-1 flex items-center gap-2 text-sm text-[#5a6359]">
          <PieChartOutlined className="text-[#e87131]" />
          Capital Allocation & Visual Analytics
        </span>
      ),
      children: portfolio ? <CapitalAllocationChart holdings={portfolio.holdings} /> : null,
    },
    {
      key: 'matrix',
      label: (
        <span className="font-semibold px-2 py-1 flex items-center gap-2 text-sm text-[#5a6359]">
          <TableOutlined className="text-[#e87131]" />
          Holding & Ratio Matrix
        </span>
      ),
      children: portfolio ? (
        <CustomRatioMatrix
          holdings={portfolio.holdings}
          onEditHolding={handleEditHolding}
          onDeleteHolding={handleDeleteHolding}
          onViewRatios={handleViewRatios}
        />
      ) : null,
    },
    {
      key: 'quarterly',
      label: (
        <span className="font-semibold px-2 py-1 flex items-center gap-2 text-sm text-[#5a6359]">
          <CompassOutlined className="text-[#e87131]" />
          Quantitative Analysis
        </span>
      ),
      children: portfolio ? (
        <QuarterlyResultsTab
          holdings={portfolio.holdings}
          onTriggerScrape={handleTriggerScrape}
          isScraping={isScraping}
        />
      ) : null,
    },
    {
      key: 'ai-insights',
      label: (
        <span className="font-semibold px-2 py-1 flex items-center gap-2 text-sm text-[#5a6359]">
          <AuditOutlined className="text-[#e87131]" />
          AI Portfolio Critique
        </span>
      ),
      children: (
        <AiInsightsPanel
          insights={aiInsights}
          isLoading={isLoadingInsights}
          onRefresh={handleGenerateInsights}
        />
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#e87131',
          colorBgBase: '#fbeed6',
          colorBgContainer: '#fffef9',
          colorBgElevated: 'rgb(255 254 249)',
          colorText: '#5a6359',
          colorTextHeading: '#5a6359',
          colorBorder: '#fbeed6',
          borderRadius: 14,
          fontFamily: "'Plus Jakarta Sans', 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
        components: {
          Modal: {
            contentBg: 'rgb(255 254 249)',
            headerBg: 'rgb(255 254 249)',
            footerBg: 'rgb(255 254 249)',
            titleColor: '#5a6359',
          },
          Popover: {
            colorBgElevated: 'rgb(255 254 249)',
            colorText: '#5a6359',
            colorTextHeading: '#e87131',
          },
          Card: {
            colorBgContainer: '#fdf9ec',
            colorTextDescription: '#5a6359',
          },
          Table: {
            colorBgContainer: '#fffef9',
            colorText: '#5a6359',
            colorTextHeading: '#5a6359',
          },
          Collapse: {
            contentBg: '#fdf9ec',
            headerBg: '#fffef9',
          },
        },
      }}
    >
      <Layout className="min-h-screen bg-[#fdf9ec] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Sticky Header Navigation */}
        <Navbar
          onOpenAddModal={handleOpenAddModal}
          onTriggerScrape={handleTriggerScrape}
          onGenerateInsights={handleGenerateInsights}
          isScraping={isScraping}
          circuitBreakerActive={circuitBreakerActive}
        />

        {/* Notification Banner */}
        {notification && (
          <Alert
            message={notification}
            type="info"
            showIcon
            icon={<InfoCircleOutlined className="text-[#e87131]" />}
            className="bg-[#e87131] border-0 text-white rounded-none text-xs font-semibold py-2 justify-center shadow-md"
          />
        )}

        {/* Extended Width Main Content Area (max-w-[1450px]) */}
        <Content className="flex-1 max-w-[1450px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoadingPortfolio ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Spin indicator={<LoadingOutlined className="text-4xl text-[#e87131] mb-4" spin />} />
              <p className="text-sm font-semibold text-[#5a6359]">Loading Portfolio & Screener Data...</p>
            </div>
          ) : (
            <Tabs
              defaultActiveKey="overview"
              items={tabItems}
              size="large"
              className="antd-custom-tabs"
            />
          )}
        </Content>

        {/* Ant Design FloatButton for Interactive AI Chat Copilot with Chat Message Icon */}
        <FloatButton
          icon={<MessageOutlined className="text-white text-xl" />}
          type="primary"
          badge={{ dot: true, color: '#15803d' }}
          tooltip={<span className="font-bold text-xs font-mono">Chat with AI Stock Copilot</span>}
          onClick={() => setIsChatDrawerOpen(true)}
          style={{
            right: 32,
            bottom: 32,
            width: 56,
            height: 56,
            backgroundColor: '#e87131',
            boxShadow: '0 10px 25px -4px rgba(232, 113, 49, 0.45)',
          }}
        />

        {/* Holding Add / Edit Modal */}
        <HoldingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveHolding}
          initialData={selectedHolding}
        />

        {/* View Company Screener Ratios Modal */}
        <ViewRatiosModal
          isOpen={isRatiosModalOpen}
          onClose={() => setIsRatiosModalOpen(false)}
          holding={selectedRatiosHolding}
        />

        {/* Interactive Conversational AI Chat Copilot Drawer */}
        <AiChatDrawer
          isOpen={isChatDrawerOpen}
          onClose={() => setIsChatDrawerOpen(false)}
          holdings={portfolio ? portfolio.holdings : []}
        />
      </Layout>
    </ConfigProvider>
  );
};
