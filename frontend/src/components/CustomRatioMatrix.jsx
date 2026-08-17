import React, { useState, useMemo } from 'react';
import { Table, Tag, Button, Input, Select, Tooltip, Space, Progress } from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  TableOutlined,
} from '@ant-design/icons';

const { Option } = Select;

export const CustomRatioMatrix = ({
  holdings,
  onEditHolding,
  onDeleteHolding,
  onViewRatios,
}) => {
  const [searchText, setSearchText] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');

  const filteredData = useMemo(() => {
    const list = (holdings || []).filter((h) => {
      const matchSector = selectedSector === 'ALL' || h.sector === selectedSector;
      const matchSearch =
        h.ticker.toLowerCase().includes(searchText.toLowerCase()) ||
        h.company_name.toLowerCase().includes(searchText.toLowerCase());
      return matchSector && matchSearch;
    });

    return list.sort((a, b) => (b.current_market_value || 0) - (a.current_market_value || 0));
  }, [holdings, selectedSector, searchText]);

  const sectors = useMemo(() => {
    const list = Array.from(new Set((holdings || []).map((h) => h.sector || 'Uncategorized')));
    return ['ALL', ...list];
  }, [holdings]);

  const columns = [
    {
      title: 'Company / Ticker',
      dataIndex: 'ticker',
      key: 'ticker',
      sorter: (a, b) => a.ticker.localeCompare(b.ticker),
      render: (text, record) => {
        const chg = record.metrics?.last_changed_ratio;
        const isInc = chg?.direction === 'INCREASED';

        return (
          <div className="flex items-center space-x-2">
            <div>
              <div className="flex items-center space-x-1.5 font-extrabold text-[#5a6359] text-sm font-mono">
                <span>{text}</span>
                {/* Subtle Marking Indicator if ratio change recorded */}
                {chg && (
                  <Tooltip title={`Recent Metric Update: ${chg.ratio_name} (${chg.old_value} ➔ ${chg.new_value})`}>
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isInc ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isInc ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                    </span>
                  </Tooltip>
                )}
              </div>
              <div className="text-xs text-[#5a6359]/70 truncate max-w-[160px] font-medium">{record.company_name}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Sector',
      dataIndex: 'sector',
      key: 'sector',
      render: (sector) => (
        <Tag className="rounded-md bg-[#fdf9ec] text-[#5a6359] border-[#fbeed6] font-semibold">
          {sector || 'Uncategorized'}
        </Tag>
      ),
    },
    {
      title: 'Cap Category',
      key: 'market_cap_category',
      render: (_, record) => {
        const mcap = record.metrics?.market_cap_cr;
        let cat = record.metrics?.market_cap_category;
        if (!cat && mcap) {
          if (mcap >= 20000) cat = 'Large Cap';
          else if (mcap >= 5000) cat = 'Mid Cap';
          else cat = 'Small Cap';
        }
        if (!cat) return <span className="text-xs text-[#5a6359]/60">-</span>;

        const colorMap = {
          'Large Cap': 'processing',
          'Mid Cap': 'success',
          'Small Cap': 'warning',
        };

        return (
          <Tag color={colorMap[cat] || 'default'} className="font-mono text-xs font-bold rounded-md px-2 py-0.5">
            {cat}
          </Tag>
        );
      },
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a, b) => a.quantity - b.quantity,
      render: (qty) => <span className="font-mono text-xs text-[#5a6359] font-bold">{qty}</span>,
    },
    {
      title: 'Avg Buy (₹)',
      dataIndex: 'avg_buy_price',
      key: 'avg_buy_price',
      sorter: (a, b) => a.avg_buy_price - b.avg_buy_price,
      render: (price) => (
        <span className="font-mono text-xs text-[#5a6359] font-medium">
          ₹{price ? price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
        </span>
      ),
    },
    {
      title: 'Market Price (₹)',
      dataIndex: 'current_price',
      key: 'current_price',
      sorter: (a, b) => (a.current_price || 0) - (b.current_price || 0),
      render: (price) => (
        <span className="font-mono text-xs font-bold text-[#5a6359]">
          ₹{price ? price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
        </span>
      ),
    },
    {
      title: 'P&L %',
      dataIndex: 'unrealized_pnl_pct',
      key: 'unrealized_pnl_pct',
      sorter: (a, b) => a.unrealized_pnl_pct - b.unrealized_pnl_pct,
      render: (pnlPct) => {
        const isPos = pnlPct >= 0;
        return (
          <Tag color={isPos ? 'success' : 'error'} className="font-mono font-bold text-xs rounded-md">
            {isPos ? '+' : ''}{pnlPct}%
          </Tag>
        );
      },
    },
    {
      title: 'Weight %',
      dataIndex: 'weightage_pct',
      key: 'weightage_pct',
      sorter: (a, b) => a.weightage_pct - b.weightage_pct,
      render: (weight) => (
        <div className="w-24">
          <span className="font-mono text-xs text-[#5a6359] block mb-1 font-bold">{weight}%</span>
          <Progress percent={weight} showInfo={false} strokeColor="#e87131" size="small" />
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View All 27 Screener Ratios & Categorized Panels">
            <Button
              type="primary"
              ghost
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onViewRatios(record)}
              className="border-[#e87131] text-[#e87131] hover:text-[#e87131]/80 hover:border-[#e87131]"
            />
          </Tooltip>
          <Tooltip title="Edit Holding">
            <Button
              type="default"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEditHolding(record)}
              className="bg-[#fdf9ec] border-[#fbeed6] text-[#5a6359] hover:text-[#e87131]"
            />
          </Tooltip>
          <Tooltip title="Delete Holding">
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => onDeleteHolding(record.ticker)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-[#fffef9] p-6 rounded-2xl border border-[#fbeed6] mb-8 shadow-sm">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-end mb-4 gap-3">
        <Space size="middle" className="w-full sm:w-auto">
          <Input
            placeholder="Search ticker..."
            prefix={<SearchOutlined className="text-[#5a6359]/50" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full sm:w-48 bg-[#fdf9ec] border-[#fbeed6] text-xs rounded-xl text-[#5a6359]"
          />

          <Select
            value={selectedSector}
            onChange={(val) => setSelectedSector(val)}
            className="w-36 text-xs"
          >
            {sectors.map((sec) => (
              <Option key={sec} value={sec}>
                {sec === 'ALL' ? 'All Sectors' : sec}
              </Option>
            ))}
          </Select>
        </Space>
      </div>

      {/* Antd Table */}
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="ticker"
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
      />
    </div>
  );
};
