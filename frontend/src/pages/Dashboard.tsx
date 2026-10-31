import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, ChevronRight, Plane, Plus } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import toast from 'react-hot-toast';
import { dashboardService } from '@/services/dashboardService';
import { incomeService } from '@/services/incomeService';
import { savingsService } from '@/services/savingsService';
import { expenseService } from '@/services/expenseService';
import { tripService } from '@/services/tripService';
import type { DashboardOverview, Expense, Income, Trip } from '@/types';
import {
  formatCurrency,
  formatDate,
  formatMonthLabel,
  formatPeriodRange,
  todayInput,
  tripOn,
  monthKeyToDate,
  shiftMonthKey,
} from '@/utils/format';
import { CategoryIcon, categoryStyle, isRetiredCategory } from '@/utils/categories';
import { Button, EmptyState, Input, Money, Panel, PanelHeader, Spinner } from '@/components/ui';
import { ChartTooltip, LegendItem, useChartTheme } from '@/components/charts';
import IncomeManager from '@/components/IncomeManager';
import BillsChecklist from '@/components/BillsChecklist';
import { useExpensesChanged, useQuickAdd } from '@/components/QuickAdd';

const TREND_MONTHS = 6;
const SHORTCUT_COUNT = 5;

const Change: React.FC<{ value?: number | null; noun: string }> = ({ value, noun }) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return <span className="text-xs text-ink-3">No data for last month</span>;
  }
  const Icon = value >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-3">
      <Icon className="h-3.5 w-3.5" />
      {Math.abs(value).toFixed(0)}% {value >= 0 ? 'more' : 'less'} {noun} than last month
    </span>
  );
};

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const Dashboard: React.FC = () => {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [savedAmount, setSavedAmount] = useState<number | null>(null);
  const [savingsDraft, setSavingsDraft] = useState('');
  const [savingSavings, setSavingSavings] = useState(false);
  const [bills, setBills] = useState<Expense[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const chart = useChartTheme();
  const openQuickAdd = useQuickAdd();

  // The current pay period's label month (YYYY-MM), known once the overview has loaded
  const month = overview?.period_month.slice(0, 7) ?? '';
  const monthName = month ? formatMonthLabel(month).split(' ')[0] : '';

  const loadOverview = async () => {
    try {
      setOverview(await dashboardService.getOverview());
    } catch (error) {
      toast.error('Could not load the overview.');
    } finally {
      setLoading(false);
    }
  };

  const loadIncomes = async () => {
    try {
      setIncomes(await incomeService.getIncomes());
    } catch (error) {
      toast.error('Could not load income.');
    }
  };

  const loadSavings = async () => {
    try {
      const data = await savingsService.getSavings({ month: monthKeyToDate(month) });
      const amount = data?.amount != null ? Number(data.amount) : null;
      setSavedAmount(amount);
      setSavingsDraft(amount != null ? String(amount) : '');
    } catch (error) {
      toast.error('Could not load savings.');
    }
  };

  const loadBills = async () => {
    try {
      const expenses = await expenseService.getExpenses({ month: monthKeyToDate(month) });
      setBills(expenses.filter((expense) => expense.is_recurring));
    } catch (error) {
      toast.error('Could not load monthly bills.');
    }
  };

  const handleTogglePaid = async (bill: Expense, paid: boolean) => {
    setBills((prev) => prev.map((item) => (item.id === bill.id ? { ...item, paid } : item)));
    try {
      await expenseService.setPaid(bill.id, monthKeyToDate(month), paid);
    } catch (error) {
      setBills((prev) => prev.map((item) => (item.id === bill.id ? { ...item, paid: !paid } : item)));
      toast.error('Could not update the checklist.');
    }
  };

  const loadTrips = async () => {
    try {
      setTrips(await tripService.getTrips());
    } catch (error) {
      toast.error('Could not load trips.');
    }
  };

  useEffect(() => {
    loadOverview();
    loadIncomes();
    loadTrips();
  }, []);

  useEffect(() => {
    if (!month) return;
    loadSavings();
    loadBills();
  }, [month]);

  useExpensesChanged(() => {
    loadOverview();
    loadBills();
    loadTrips();
  });

  const handleSaveSavings = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = savingsDraft.trim();
    const parsed = value ? Number(value) : null;
    if (parsed !== null && (Number.isNaN(parsed) || parsed < 0)) {
      toast.error('Savings must be zero or more.');
      return;
    }
    if (parsed === savedAmount) return;

    try {
      setSavingSavings(true);
      await savingsService.upsertSavings({ month: monthKeyToDate(month), amount: parsed });
      setSavedAmount(parsed);
      await loadOverview();
      toast.success(parsed === null ? 'Savings cleared.' : 'Savings saved.');
    } catch (error) {
      toast.error('Could not save savings.');
    } finally {
      setSavingSavings(false);
    }
  };

  const trend = useMemo(() => {
    if (!month) return [];
    const totals = (entries: { month: string; total: number }[] = []) => {
      const byMonth = new Map<string, number>();
      entries.forEach((entry) => {
        const key = entry.month.slice(0, 7);
        byMonth.set(key, (byMonth.get(key) ?? 0) + Number(entry.total));
      });
      return byMonth;
    };
    const spent = totals(overview?.monthly_category_spend);
    const income = totals(overview?.monthly_income);
    const saved = totals(overview?.monthly_savings);

    return Array.from({ length: TREND_MONTHS }, (_, index) => {
      const key = shiftMonthKey(month, index - (TREND_MONTHS - 1));
      return {
        label: formatMonthLabel(key, 'short'),
        income: income.get(key) ?? 0,
        spent: spent.get(key) ?? 0,
        saved: saved.get(key) ?? 0,
      };
    });
  }, [overview, month]);

  // Categories used most often over the trend window, for one-tap adding.
  const shortcuts = useMemo(() => {
    const totals = new Map<string, number>();
    (overview?.monthly_category_spend ?? []).forEach((entry) => {
      totals.set(entry.category, (totals.get(entry.category) ?? 0) + Number(entry.total));
    });
    return Array.from(totals.entries())
      .filter(([category]) => !isRetiredCategory(category))
      .sort((a, b) => b[1] - a[1])
      .slice(0, SHORTCUT_COUNT)
      .map(([category]) => category);
  }, [overview]);

  if (loading) {
    return <Spinner />;
  }

  const activeTrip = tripOn(trips, todayInput());
  const spent = Number(overview?.total_expenses_month ?? 0);
  const income = Number(overview?.income_total_month ?? 0);
  const balance = Number(overview?.net_balance_month ?? income - spent);
  const spentRatio = income > 0 ? spent / income : 0;
  const categories = overview?.expenses_by_category ?? [];
  const topCategory = Number(categories[0]?.total ?? 0);
  const recent = overview?.recent_transactions ?? [];
  const hasTrend = trend.some((row) => row.income > 0 || row.spent > 0 || row.saved > 0);

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-3">
        {greeting()}. Here is {monthName} so far
        {overview ? ` (${formatPeriodRange(overview.period_start, overview.period_end)})` : ''}.
      </p>

      {activeTrip ? (
        <Link
          to={`/trips/${activeTrip.id}`}
          className="flex items-center gap-3 rounded-panel border border-line bg-panel px-4 py-3 transition-colors hover:border-accent"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-[#dde3d5] text-[#6c7563]">
            <Plane className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1 text-sm">
            <span className="block truncate font-medium text-ink">You're on your {activeTrip.name} trip</span>
            <span className="block text-ink-3">
              {formatCurrency(Number(activeTrip.total))} spent so far. New expenses go to this trip.
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-ink-3" />
        </Link>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <section className="relative overflow-hidden rounded-panel bg-hero bg-hero-gradient p-6 text-ink sm:p-8">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/50 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative">
            {income > 0 ? (
              <>
                <p className="text-sm font-medium text-ink-2">
                  {balance >= 0 ? `Left to spend in ${monthName}` : `Over your ${monthName} income by`}
                </p>
                <p className="mt-2 text-5xl font-semibold tracking-tight sm:text-7xl">
                  <Money
                    amount={Math.abs(balance)}
                    className={balance >= 0 ? '' : 'text-danger'}
                    fractionClassName="text-[0.4em] font-medium text-ink-3"
                  />
                </p>
                <div className="mt-6 max-w-md">
                  <div
                    className="h-2 overflow-hidden rounded-full bg-white/70"
                    role="meter"
                    aria-label="Share of income spent"
                    aria-valuemin={0}
                    aria-valuemax={income}
                    aria-valuenow={spent}
                  >
                    <div
                      className={`h-full rounded-full ${spentRatio > 1 ? 'bg-danger' : 'bg-accent'}`}
                      style={{ width: `${Math.min(spentRatio, 1) * 100}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-ink-2">
                    <span className="num font-medium text-ink">{formatCurrency(spent)}</span> of{' '}
                    <span className="num font-medium text-ink">{formatCurrency(income)}</span> spent (
                    {Math.round(spentRatio * 100)}%)
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-ink-2">Spent in {monthName}</p>
                <p className="mt-2 text-5xl font-semibold tracking-tight sm:text-7xl">
                  <Money amount={spent} fractionClassName="text-[0.4em] font-medium text-ink-3" />
                </p>
                <p className="mt-6 max-w-sm text-sm text-ink-2">
                  Add your income to see how much you have left this month.
                </p>
                <button
                  type="button"
                  onClick={() => setIncomeOpen(true)}
                  className="mt-3 inline-flex h-9 items-center rounded-full bg-accent px-4 text-sm font-medium text-accent-on"
                >
                  Add income
                </button>
              </>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-2">
              {shortcuts.map((category) => {
                const { icon: Icon } = categoryStyle(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => openQuickAdd(category)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/70 px-3.5 text-sm font-medium text-ink transition-colors hover:bg-white"
                  >
                    <Icon className="h-4 w-4" />
                    {category}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => openQuickAdd()}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-3.5 text-sm font-medium text-accent-on transition-colors hover:bg-accent/90"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                {shortcuts.length > 0 ? 'Other' : 'Add expense'}
              </button>
            </div>
          </div>
        </section>

        <Panel as="div" className="flex flex-col divide-y divide-line">
          <div className="flex-1 p-5 sm:px-6">
            <p className="text-sm text-ink-3">Spent</p>
            <p className="mt-1 text-2xl font-semibold">
              <Money amount={spent} fractionClassName="text-[0.6em] text-ink-3" />
            </p>
            <p className="mt-1">
              <Change value={overview?.expenses_mom_percentage} noun="spent" />
            </p>
          </div>
          <div className="flex-1 p-5 sm:px-6">
            <p className="flex items-center justify-between text-sm text-ink-3">
              Income
              <button
                type="button"
                onClick={() => setIncomeOpen(true)}
                className="-m-2 p-2 text-sm font-medium text-accent-ink hover:underline"
              >
                Manage
              </button>
            </p>
            <p className="mt-1 text-2xl font-semibold">
              <Money amount={income} fractionClassName="text-[0.6em] text-ink-3" />
            </p>
            <p className="mt-1">
              <Change value={overview?.income_mom_percentage} noun="earned" />
            </p>
          </div>
          <div className="flex-1 p-5 sm:px-6">
            <label htmlFor="savings-input" className="text-sm text-ink-3">
              Put aside in {monthName}
            </label>
            <form onSubmit={handleSaveSavings} className="mt-2 flex gap-2">
              <Input
                id="savings-input"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={savingsDraft}
                onChange={(event) => setSavingsDraft(event.target.value)}
                className="num"
              />
              <Button
                type="submit"
                variant="secondary"
                disabled={savingSavings || (savingsDraft.trim() ? Number(savingsDraft) : null) === savedAmount}
              >
                Save
              </Button>
            </form>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BillsChecklist
          month={month}
          bills={bills}
          onTogglePaid={handleTogglePaid}
          onAdd={() => openQuickAdd('', { recurring: true })}
        />
        <Panel>
          <PanelHeader
            title="Where it went"
            description={`Spending by category in ${monthName}`}
          />
          {categories.length === 0 ? (
            <EmptyState title="Nothing spent yet this month" description="Expenses you add show up here by category." />
          ) : (
            <div className="p-5">
              <ul className="space-y-4">
                {categories.map((item) => (
                  <li key={item.category} className="flex items-center gap-3">
                    <CategoryIcon name={item.category} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="truncate font-medium text-ink">{item.category}</span>
                        <span className="num shrink-0 text-ink">
                          {formatCurrency(Number(item.total))}
                          <span className="ml-2 inline-block w-9 text-right text-xs text-ink-3">
                            {Math.round(Number(item.percentage))}%
                          </span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-sunken">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${topCategory > 0 ? (Number(item.total) / topCategory) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Latest expenses"
            action={
              <Link to="/expenses" className="-m-2 p-2 text-sm font-medium text-accent-ink hover:underline">
                See all
              </Link>
            }
          />
          {recent.length === 0 ? (
            <EmptyState
              title="No expenses yet"
              description="Add your first one to start tracking."
              action={
                <Button onClick={() => openQuickAdd()}>
                  <Plus className="h-4 w-4" />
                  Add expense
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-line px-5 pb-2 pt-2">
              {recent.slice(0, 8).map((expense) => (
                <li key={expense.id} className="flex items-center gap-3 py-3">
                  <CategoryIcon name={expense.category} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{expense.description || expense.category}</p>
                    <p className="truncate text-xs text-ink-3">
                      {expense.description ? `${expense.category}, ` : ''}
                      {formatDate(expense.date)}
                    </p>
                  </div>
                  <Money amount={Number(expense.amount)} className="text-sm font-medium text-ink" />
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel>
          <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
            <h2 className="text-base font-semibold text-ink">Last 6 months</h2>
            <div className="flex flex-wrap gap-3">
              <LegendItem color={chart.income} label="Income" />
              <LegendItem color={chart.spent} label="Spent" />
            </div>
          </div>
          {hasTrend ? (
            <>
              <div className="h-72 px-2 pb-4 pt-6" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trend} barGap={2} barCategoryGap="28%">
                    <CartesianGrid vertical={false} stroke={chart.grid} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={{ stroke: chart.grid }}
                      tick={{ fill: chart.axis, fontSize: 12 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={56}
                      tick={{ fill: chart.axis, fontSize: 12 }}
                      tickFormatter={(value: number) =>
                        value >= 1000 ? `€${(value / 1000).toFixed(1).replace(/\.0$/, '')}k` : `€${value}`
                      }
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: chart.grid, opacity: 0.5 }} />
                    <Bar dataKey="income" name="Income" fill={chart.income} radius={[4, 4, 0, 0]} maxBarSize={18} />
                    <Bar dataKey="spent" name="Spent" fill={chart.spent} radius={[4, 4, 0, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="sr-only">
              <table>
                  <caption>Income, spending and savings for the last 6 months</caption>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Income</th>
                      <th>Spent</th>
                      <th>Put aside</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trend.map((row) => (
                      <tr key={row.label}>
                        <td>{row.label}</td>
                        <td>{formatCurrency(row.income)}</td>
                        <td>{formatCurrency(row.spent)}</td>
                        <td>{formatCurrency(row.saved)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
            </>
          ) : (
            <EmptyState title="No history yet" description="Your monthly totals build up here over time." />
          )}
        </Panel>
      </div>

      <IncomeManager
        open={incomeOpen}
        onClose={() => setIncomeOpen(false)}
        incomes={incomes}
        onChange={async () => {
          await Promise.all([loadIncomes(), loadOverview()]);
        }}
      />
    </div>
  );
};

export default Dashboard;
