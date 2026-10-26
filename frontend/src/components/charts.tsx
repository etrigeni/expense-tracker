import React, { useState } from 'react';
import type { TooltipProps } from 'recharts';
import { formatCurrency } from '@/utils/format';

type ChartTheme = {
  income: string;
  spent: string;
  grid: string;
  axis: string;
};

const readTheme = (): ChartTheme => {
  const styles = getComputedStyle(document.documentElement);
  const get = (name: string) => styles.getPropertyValue(name).trim();
  return {
    income: get('--chart-income'),
    spent: get('--chart-spent'),
    grid: get('--chart-grid'),
    axis: get('--chart-axis'),
  };
};

/** Chart colours from the CSS tokens. */
export const useChartTheme = (): ChartTheme => useState(readTheme)[0];

export const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} aria-hidden="true" />
    {label}
  </span>
);

export const ChartTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-control border border-line bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-ink">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey as string} className="flex items-center gap-2 text-ink-2">
          <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: entry.color }} aria-hidden="true" />
          <span className="flex-1">{entry.name}</span>
          <span className="num font-medium text-ink">{formatCurrency(Number(entry.value))}</span>
        </p>
      ))}
    </div>
  );
};
