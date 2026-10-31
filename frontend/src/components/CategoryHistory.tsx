import React, { useEffect, useState } from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { expenseService } from '@/services/expenseService';
import type { CategoryPeriodTotal } from '@/types';
import { formatCurrency, formatMonthLabel, formatPeriodRange, monthKeyToDate } from '@/utils/format';
import { CategoryIcon } from '@/utils/categories';
import { IconButton, Money, Panel } from './ui';
import { useChartTheme } from './charts';

const PeriodTooltip: React.FC<{ active?: boolean; payload?: { payload: CategoryPeriodTotal }[] }> = ({
  active,
  payload,
}) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-control border border-line bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-ink">{formatMonthLabel(row.month.slice(0, 7))}</p>
      <p className="text-ink-3">{formatPeriodRange(row.start, row.end)}</p>
      <p className="num mt-1 font-medium text-ink">{formatCurrency(Number(row.total))}</p>
    </div>
  );
};

/**
 * One category across the last 12 pay periods ending at `month`. Tapping a bar selects that period.
 * The average counts periods from the first one with spending, so a new category isn't diluted.
 */
const CategoryHistory: React.FC<{
  category: string;
  month: string;
  onSelectMonth: (month: string) => void;
  onClose: () => void;
  refreshKey: number;
}> = ({ category, month, onSelectMonth, onClose, refreshKey }) => {
  const [history, setHistory] = useState<CategoryPeriodTotal[]>([]);
  const chart = useChartTheme();

  useEffect(() => {
    expenseService
      .getCategoryHistory(category, monthKeyToDate(month))
      .then(setHistory)
      .catch(() => toast.error('Could not load the category history.'));
  }, [category, month, refreshKey]);

  const totals = history.map((row) => Number(row.total));
  const firstSpend = totals.findIndex((total) => total > 0);
  const counted = firstSpend === -1 ? [] : totals.slice(firstSpend);
  const average = counted.length ? counted.reduce((sum, total) => sum + total, 0) / counted.length : 0;
  const current = totals[totals.length - 1] ?? 0;
  const monthName = formatMonthLabel(month).split(' ')[0];

  return (
    <Panel>
      <div className="flex items-center gap-3 px-5 pt-5">
        <CategoryIcon name={category} />
        <h2 className="min-w-0 flex-1 truncate text-base font-semibold text-ink">{category}</h2>
        <IconButton label="Show all categories" onClick={onClose} className="-mr-2">
          <X className="h-4 w-4" />
        </IconButton>
      </div>
      <dl className="grid grid-cols-2 gap-3 px-5 pt-4">
        <div>
          <dt className="text-xs text-ink-3 sm:text-sm">{monthName}</dt>
          <dd className="mt-0.5 text-xl font-semibold">
            <Money amount={current} fractionClassName="text-[0.65em] text-ink-3" />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-3 sm:text-sm">Monthly average</dt>
          <dd className="mt-0.5 text-xl font-semibold">
            {counted.length ? (
              <Money amount={average} fractionClassName="text-[0.65em] text-ink-3" />
            ) : (
              <span className="text-ink-3">None yet</span>
            )}
          </dd>
        </div>
      </dl>
      <div className="h-40 px-2 pb-3 pt-4" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={history} barCategoryGap="22%">
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={{ stroke: chart.grid }}
              interval={0}
              tick={{ fill: chart.axis, fontSize: 11 }}
              tickFormatter={(value: string) => formatMonthLabel(value.slice(0, 7), 'short').split(' ')[0].slice(0, 1)}
            />
            <Tooltip content={<PeriodTooltip />} cursor={{ fill: chart.grid, opacity: 0.5 }} />
            <Bar
              dataKey={(row: CategoryPeriodTotal) => Number(row.total)}
              radius={[4, 4, 0, 0]}
              className="cursor-pointer"
              onClick={(row: CategoryPeriodTotal) => onSelectMonth(row.month.slice(0, 7))}
            >
              {history.map((row) => (
                <Cell key={row.month} fill={chart.spent} fillOpacity={row.month.slice(0, 7) === month ? 1 : 0.4} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="sr-only">
        <table>
          <caption>{category} by month</caption>
          <tbody>
            {history.map((row) => (
              <tr key={row.month}>
                <td>{formatMonthLabel(row.month.slice(0, 7))}</td>
                <td>{formatCurrency(Number(row.total))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
};

export default CategoryHistory;
