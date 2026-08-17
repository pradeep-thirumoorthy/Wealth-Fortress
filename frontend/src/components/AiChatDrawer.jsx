import React, { useState, useRef, useEffect } from 'react';
import { Drawer, Input, Button, Tag, Spin, Dropdown } from 'antd';
import {
  MessageOutlined,
  SendOutlined,
  UserOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  ClearOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { sendAiChatMessage } from '../services/api';
import { MarkdownMessageRenderer } from './MarkdownMessageRenderer';

const QUICK_PROMPTS = [
  '📊 Compare BEL vs TIPSMUSIC valuation & ROCE in a table',
  '🏆 Show 5-Yr ROCE, Debt/Eq & Graham Value of all holdings in a table',
  '📈 Compare 5-Quarter Sales & Net Profit scaling in a table',
  '💎 Which stocks trade at a discount below Graham Intrinsic Value?',
  '🎯 Give me a 3-step portfolio rebalancing plan',
  '⚖️ Analyze my Debt-to-Equity & leverage risk',
];

export const AiChatDrawer = ({
  isOpen,
  onClose,
  holdings = [],
}) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        '👋 Welcome to **AI Portfolio & Stock Copilot**!\n\nI have analyzed your real-time holdings, cost basis, and 27 Screener.in financial ratios. Ask me anything about your stock valuations, ROCE, debt risk, or rebalancing strategy!',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState(null);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const queryText = textToSend || inputValue;
    if (!queryText.trim() || isLoading) return;

    const newMessages = [
      ...messages,
      { role: 'user', content: queryText },
    ];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await sendAiChatMessage(newMessages, selectedTicker);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: res.reply || 'Analysis complete.',
          sources: res.retrieved_sources || [],
          model: res.model,
        },
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: `⚠️ Failed to get AI response: ${err.message}. Please try again.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          'Chat history cleared. How can I assist with your portfolio analysis?',
      },
    ]);
  };

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#e87131] flex items-center justify-center text-white text-lg shadow-sm">
              <MessageOutlined />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#5a6359] m-0 font-['Plus_Jakarta_Sans',sans-serif]">
                AI Stock & Portfolio Copilot
              </h3>
              <p className="text-[11px] text-[#e87131] m-0 font-mono font-bold">
                RAG Grounded Intelligence • Gemini 3.7 Flash
              </p>
            </div>
          </div>
          <Button
            type="text"
            size="small"
            icon={<ClearOutlined />}
            onClick={handleClearChat}
            className="text-[#5a6359]/70 hover:text-[#e87131] text-xs font-semibold"
          >
            Clear
          </Button>
        </div>
      }
      placement="right"
      width={480}
      onClose={onClose}
      open={isOpen}
      bodyStyle={{ backgroundColor: '#fffef9', padding: '16px' }}
      headerStyle={{ backgroundColor: '#fbeed6', borderBottom: '1px solid #fbeed6' }}
    >
      <div className="flex flex-col h-full justify-between">
        {/* Ticker Filter Selector */}
        <div className="mb-3 flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
          <span className="text-xs font-bold text-[#5a6359] whitespace-nowrap font-mono">Focus:</span>
          <Tag
            color={selectedTicker === null ? 'orange' : 'default'}
            className="cursor-pointer font-bold rounded-lg text-xs"
            onClick={() => setSelectedTicker(null)}
          >
            All Portfolio
          </Tag>
          {holdings.map((h) => (
            <Tag
              key={h.ticker}
              color={selectedTicker === h.ticker ? 'orange' : 'default'}
              className="cursor-pointer font-mono font-bold rounded-lg text-xs"
              onClick={() => setSelectedTicker(selectedTicker === h.ticker ? null : h.ticker)}
            >
              {h.ticker}
            </Tag>
          ))}
        </div>

        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 custom-scrollbar">
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={i}
                className={`flex items-start space-x-2 ${
                  isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 font-bold ${
                    isUser ? 'bg-[#e87131] text-white' : 'bg-[#fbeed6] text-[#e87131]'
                  }`}
                >
                  {isUser ? <UserOutlined /> : <MessageOutlined />}
                </div>

                <div
                  className={`max-w-[92%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-[#e87131] text-white font-medium shadow-sm rounded-tr-none whitespace-pre-wrap'
                      : 'card-pick-elevation bg-[#fdf9ec] text-[#5a6359] border-[#fbeed6] rounded-tl-none font-medium'
                  }`}
                >
                  <MarkdownMessageRenderer content={msg.content} isUser={isUser} />
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-[#e87131]/20">
                      <span className="text-[10px] font-mono text-[#5a6359]/70 font-bold block mb-1">
                        📚 Grounded RAG Documents:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {msg.sources.map((src, sIdx) => (
                          <Tag key={sIdx} className="text-[9px] font-mono font-bold bg-white text-[#e87131] border border-[#e87131]/30 rounded m-0">
                            {src.split('(')[0].trim()}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-[#fbeed6] flex items-center justify-center text-[#e87131] text-xs">
                <MessageOutlined spin />
              </div>
              <div className="bg-[#fdf9ec] border border-[#fbeed6] p-3 rounded-2xl text-xs text-[#5a6359] flex items-center space-x-2">
                <Spin indicator={<ThunderboltOutlined className="text-[#e87131]" spin />} />
                <span className="font-semibold font-mono">Retrieving RAG context & reasoning with Gemini...</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Compact Recommended Prompts Dropdown */}
        <div className="mb-2.5 flex items-center justify-between">
          <Dropdown
            menu={{
              items: QUICK_PROMPTS.map((promptText, idx) => ({
                key: String(idx),
                label: (
                  <span className="text-xs font-mono font-medium text-[#5a6359] py-1 block hover:text-[#e87131]">
                    {promptText}
                  </span>
                ),
                onClick: () => handleSend(promptText),
              })),
            }}
            trigger={['click']}
            placement="topLeft"
          >
            <Button
              size="small"
              icon={<BulbOutlined className="text-[#e87131]" />}
              className="bg-[#fdf9ec] border-[#fbeed6] text-[#5a6359] hover:text-[#e87131] hover:border-[#e87131] rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 px-3 py-1 shadow-2xs"
            >
              <span>Recommended Prompts</span>
              <DownOutlined className="text-[10px] text-[#5a6359]/70" />
            </Button>
          </Dropdown>
          <span className="text-[10px] font-mono text-[#5a6359]/60 font-semibold">Gemini 3.7 Flash RAG</span>
        </div>

        {/* Input Bar */}
        <div className="pt-2 border-t border-[#fbeed6]">
          <Input.Search
            placeholder={
              selectedTicker
                ? `Ask AI Copilot about ${selectedTicker}...`
                : 'Ask AI Copilot about portfolio ratios, ROCE, debt, rebalancing...'
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onSearch={(val) => handleSend(val)}
            enterButton={
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={isLoading}
                className="bg-[#e87131] hover:bg-[#e87131]/90 border-0 rounded-r-xl font-bold"
              />
            }
            size="large"
            className="antd-custom-search text-xs rounded-xl"
          />
        </div>
      </div>
    </Drawer>
  );
};
