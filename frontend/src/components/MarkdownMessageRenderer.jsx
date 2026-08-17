import React from 'react';
import { Tag } from 'antd';

/**
 * Parses and renders rich Markdown text with automatic table detection and styling.
 * Converts Markdown tables (| col1 | col2 |) into responsive styled tables.
 */
export const MarkdownMessageRenderer = ({ content, isUser = false }) => {
  if (!content) return null;

  if (isUser) {
    return <span>{content}</span>;
  }

  // Split content into blocks (paragraphs, tables, lists, headers)
  const lines = content.split('\n');
  const elements = [];
  let currentTableLines = [];
  let inTable = false;

  const flushTable = (keyIndex) => {
    if (currentTableLines.length > 0) {
      const tableComponent = renderMarkdownTable(currentTableLines, `table-${keyIndex}`);
      if (tableComponent) {
        elements.push(tableComponent);
      }
      currentTableLines = [];
    }
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTableLine = /^\s*\|.*\|\s*$/.test(line);

    if (isTableLine) {
      inTable = true;
      currentTableLines.push(line);
    } else {
      if (inTable) {
        flushTable(i);
      }

      // Check for headers
      if (/^###\s+/.test(line)) {
        elements.push(
          <h4
            key={`h3-${i}`}
            className="text-xs font-bold text-[#e87131] uppercase tracking-wider mt-3 mb-1.5 font-mono flex items-center gap-1"
          >
            {renderInlineMarkdown(line.replace(/^###\s+/, ''))}
          </h4>
        );
      } else if (/^##\s+/.test(line)) {
        elements.push(
          <h3
            key={`h2-${i}`}
            className="text-sm font-extrabold text-[#5a6359] mt-3.5 mb-1.5 font-mono"
          >
            {renderInlineMarkdown(line.replace(/^##\s+/, ''))}
          </h3>
        );
      } else if (/^\s*[-*•]\s+/.test(line)) {
        // Bullet list item
        const itemText = line.replace(/^\s*[-*•]\s+/, '');
        elements.push(
          <div key={`li-${i}`} className="flex items-start space-x-1.5 my-1 text-xs">
            <span className="text-[#e87131] font-bold mt-0.5">•</span>
            <span className="text-[#5a6359] leading-relaxed font-medium">
              {renderInlineMarkdown(itemText)}
            </span>
          </div>
        );
      } else if (line.trim() === '') {
        // Empty line spacer
        elements.push(<div key={`space-${i}`} className="h-1.5" />);
      } else {
        // Regular paragraph
        elements.push(
          <p key={`p-${i}`} className="text-xs text-[#5a6359] leading-relaxed my-1 font-medium">
            {renderInlineMarkdown(line)}
          </p>
        );
      }
    }
  }

  // If ends with table
  if (inTable && currentTableLines.length > 0) {
    flushTable(lines.length);
  }

  return <div className="markdown-content space-y-0.5">{elements}</div>;
};

/**
 * Parses markdown table rows and returns a styled HTML Table component
 */
function renderMarkdownTable(tableLines, key) {
  // Need at least header + separator or data rows
  const cleanRows = tableLines.filter((l) => !/^\s*\|?\s*[-:]+[-| :]*\|\s*$/.test(l));
  if (cleanRows.length === 0) return null;

  const parseRow = (rowStr) => {
    return rowStr
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());
  };

  const headerRow = parseRow(cleanRows[0]);
  const dataRows = cleanRows.slice(1).map(parseRow);

  return (
    <div key={key} className="my-3 overflow-x-auto rounded-xl border border-[#fbeed6] shadow-xs bg-[#fffef9]">
      <table className="w-full text-xs text-left border-collapse">
        <thead className="bg-[#fbeed6]/80 text-[#5a6359] font-mono font-bold uppercase text-[10px] tracking-wider">
          <tr>
            {headerRow.map((col, idx) => (
              <th key={`th-${idx}`} className="p-2.5 border-b border-[#fbeed6] text-left">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#fbeed6]/50">
          {dataRows.map((row, rIdx) => (
            <tr
              key={`tr-${rIdx}`}
              className="hover:bg-[#fdf9ec] transition-colors"
            >
              {row.map((cell, cIdx) => {
                const isFirstCol = cIdx === 0;
                // Highlight numbers, tags or positive/negative values
                const isPositive = cell.startsWith('+') || cell.includes('BUY') || cell.includes('ACCUMULATE') || cell.includes('GOOD');
                const isNegative = cell.startsWith('-') || cell.includes('TRIM') || cell.includes('SELL') || cell.includes('BAD');

                return (
                  <td
                    key={`td-${cIdx}`}
                    className={`p-2.5 text-xs text-[#5a6359] ${
                      isFirstCol ? 'font-mono font-bold' : 'font-medium'
                    }`}
                  >
                    {isPositive ? (
                      <span className="font-bold text-emerald-700">{renderInlineMarkdown(cell)}</span>
                    ) : isNegative ? (
                      <span className="font-bold text-rose-700">{renderInlineMarkdown(cell)}</span>
                    ) : (
                      renderInlineMarkdown(cell)
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Handles inline markdown (bold, code chips, tags)
 */
function renderInlineMarkdown(text) {
  if (!text) return null;

  // Split by bold (**bold**) and inline code (`code`)
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-extrabold text-[#5a6359]">
          {part.slice(2, -2)}
        </strong>
      );
    } else if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <span
          key={index}
          className="bg-[#fbeed6] text-[#e87131] px-1.5 py-0.5 rounded font-mono text-[10px] font-bold mx-0.5"
        >
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
}
