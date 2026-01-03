import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, Landmark, Plus, Repeat, Edit2, Trash2 } from 'lucide-react';
import { BarChart, Bar, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { dashboardService } from '@/services/dashboardService';
import { incomeService } from '@/services/incomeService';
import { savingsService } from '@/services/savingsService';
import { DashboardOverview, Income, IncomeCreate, IncomeUpdate } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';
import toast from 'react-hot-toast';

const COLORS = ['#4da49a', '#93cec4', '#be8f84', '#dcc0b8', '#b8e1d9'];

const Dashboard: React.FC = () => {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [incomeItems, setIncomeItems] = useState<Income[]>([]);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [incomeFormOpen, setIncomeFormOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [incomeToDelete, setIncomeToDelete] = useState<Income | null>(null);
  const [savingsDraft, setSavingsDraft] = useState('');
  const [savingSavings, setSavingSavings] = useState(false);
  const [newIncome, setNewIncome] = useState({
    source: '',
    amount: '',
    date: '',
    is_recurring: false,
    frequency: 'monthly',
    notes: '',
  });
  const [editIncome, setEditIncome] = useState({
    source: '',
    amount: '',
    date: '',
    is_recurring: false,
    frequency: 'monthly',
    notes: '',
  });

  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const getCurrentMonth = () => new Date().toISOString().slice(0, 7);
  const toMonthDate = (month: string) => (month.length === 7 ? `${month}-01` : month);
  const currentMonthLabel = new Date(`${getCurrentMonth()}-01`).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  useEffect(() => {
    loadOverview();
    loadIncomes();
    loadSavings();
  }, []);

  const loadOverview = async () => {
    try {
      const data = await dashboardService.getOverview();
      setOverview(data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadIncomes = async () => {
    try {
      const data = await incomeService.getIncomes();
      setIncomeItems(data);
    } catch (error) {
      toast.error('Failed to load income.');
    }
  };

  const loadSavings = async () => {
    try {
      const data = await savingsService.getSavings({ month: toMonthDate(getCurrentMonth()) });
      setSavingsDraft(data?.amount != null ? String(data.amount) : '');
    } catch (error) {
      toast.error('Failed to load savings.');
    }
  };

  const handleAddIncome = () => {
    setEditingIncome(null);
    setNewIncome({
      source: '',
      amount: '',
      date: getTodayDate(),
      is_recurring: false,
      frequency: 'monthly',
      notes: '',
    });
    setIncomeFormOpen(true);
  };

  const handleEditIncome = (income: Income) => {
    setEditingIncome(income);
    setEditIncome({
      source: income.source,
      amount: income.amount.toString(),
      date: income.date,
      is_recurring: income.is_recurring,
      frequency: income.frequency || 'monthly',
      notes: income.notes ?? '',
    });
    setIncomeFormOpen(true);
  };

  const handleCreateIncome = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newIncome.source.trim() || !newIncome.amount || !newIncome.date) {
      toast.error('Source, amount, and date are required.');
      return;
    }

    const payload: IncomeCreate = {
      source: newIncome.source.trim(),
      amount: Number(newIncome.amount),
      date: newIncome.date,
      is_recurring: newIncome.is_recurring,
      frequency: newIncome.is_recurring ? newIncome.frequency : undefined,
      notes: newIncome.notes || undefined,
    };

    try {
      await incomeService.createIncome(payload);
      await loadIncomes();
      await loadOverview();
      setIncomeFormOpen(false);
      toast.success('Income added.');
    } catch (error) {
      toast.error('Failed to add income.');
    }
  };

  const handleUpdateIncome = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingIncome) {
      return;
    }

    if (!editIncome.source.trim() || !editIncome.amount || !editIncome.date) {
      toast.error('Source, amount, and date are required.');
      return;
    }

    const payload: IncomeUpdate = {
      source: editIncome.source.trim(),
      amount: Number(editIncome.amount),
      date: editIncome.date,
      is_recurring: editIncome.is_recurring,
      frequency: editIncome.is_recurring ? editIncome.frequency : undefined,
      notes: editIncome.notes || undefined,
    };

    try {
      await incomeService.updateIncome(editingIncome.id, payload);
      await loadIncomes();
      await loadOverview();
      setIncomeFormOpen(false);
      setEditingIncome(null);
      toast.success('Income updated.');
    } catch (error) {
      toast.error('Failed to update income.');
    }
  };

  const handleDeleteIncome = async () => {
    if (!incomeToDelete) {
      return;
    }

    try {
      await incomeService.deleteIncome(incomeToDelete.id);
      await loadIncomes();
      await loadOverview();
      setIncomeToDelete(null);
      toast.success('Income deleted.');
    } catch (error) {
      toast.error('Failed to delete income.');
    }
  };

  const handleSaveSavings = async () => {
    const value = savingsDraft.trim();
    if (!value) {
      try {
        setSavingSavings(true);
        await savingsService.upsertSavings({ month: toMonthDate(getCurrentMonth()), amount: null });
        toast.success('Savings cleared.');
      } catch (error) {
        toast.error('Failed to update savings.');
      } finally {
        setSavingSavings(false);
      }
      return;
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed < 0) {
      toast.error('Enter a valid non-negative savings amount.');
      return;
    }

    try {
      setSavingSavings(true);
      await savingsService.upsertSavings({ month: toMonthDate(getCurrentMonth()), amount: parsed });
      toast.success('Savings updated.');
    } catch (error) {
      toast.error('Failed to update savings.');
    } finally {
      setSavingSavings(false);
    }
  };

  const { stackedChartData, stackedCategories } = useMemo(() => {
    const entries = overview?.monthly_category_spend ?? [];
    if (entries.length === 0) {
      return { stackedChartData: [], stackedCategories: [] as string[] };
    }

    const categories = Array.from(new Set(entries.map((item) => item.category))).sort();
    const byMonth = new Map<string, Record<string, number>>();

    entries.forEach((item) => {
      const monthKey = item.month.slice(0, 7);
      if (!byMonth.has(monthKey)) {
        byMonth.set(monthKey, { month: monthKey });
      }
      byMonth.get(monthKey)![item.category] = Number(item.total);
    });

    const stacked = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        ...data,
        label: new Date(`${month}-01`).toLocaleString('en-US', { month: 'short', year: '2-digit' }),
      }));

    return { stackedChartData: stacked, stackedCategories: categories };
  }, [overview]);

  const monthSeries = useMemo(() => {
    const now = new Date();
    const series = [];
    for (let i = 5; i >= 0; i -= 1) {
      const dateValue = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = dateValue.toISOString().slice(0, 7);
      series.push({
        key,
        label: dateValue.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
      });
    }
    return series;
  }, []);

  const monthlyIncomeData = useMemo(() => {
    const entries = overview?.monthly_income ?? [];
    const byMonth = new Map(entries.map((item) => [item.month.slice(0, 7), Number(item.total)]));
    return monthSeries.map((month) => ({
      label: month.label,
      total: byMonth.get(month.key) ?? 0,
    }));
  }, [overview, monthSeries]);

  const monthlySavingsData = useMemo(() => {
    const entries = overview?.monthly_savings ?? [];
    const byMonth = new Map(entries.map((item) => [item.month.slice(0, 7), Number(item.total)]));
    return monthSeries.map((month) => ({
      label: month.label,
      total: byMonth.get(month.key) ?? 0,
    }));
  }, [overview, monthSeries]);

  const formatMom = (value?: number | null) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return 'MoM: —';
    }
    const sign = value > 0 ? '+' : '';
    return `MoM: ${sign}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-surface p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expenses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(Number(overview?.total_expenses_month || 0))}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                {overview?.expenses_mom_percentage !== null && overview?.expenses_mom_percentage !== undefined ? (
                  overview.expenses_mom_percentage >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )
                ) : null}
                <span>{formatMom(overview?.expenses_mom_percentage)}</span>
              </div>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
              <Wallet className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-surface p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Income</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(Number(overview?.income_total_month || 0))}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                {overview?.income_mom_percentage !== null && overview?.income_mom_percentage !== undefined ? (
                  overview.income_mom_percentage >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )
                ) : null}
                <span>{formatMom(overview?.income_mom_percentage)}</span>
              </div>
              <button
                type="button"
                onClick={() => setIncomeModalOpen(true)}
                className="mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-500"
              >
                Manage income
              </button>
            </div>
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full">
              <Landmark className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-surface p-6"
        >
          <div className="flex items-center justify-between">
            <div className="w-full">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Savings for {currentMonthLabel}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={savingsDraft}
                  onChange={(event) => setSavingsDraft(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleSaveSavings}
                  disabled={savingSavings}
                  className="rounded-xl bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  {savingSavings ? 'Saving' : 'Save'}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                {savingsDraft ? formatCurrency(Number(savingsDraft)) : 'Not set'}
              </p>
            </div>
            <div className="ml-4 bg-teal-100 dark:bg-teal-900/30 p-3 rounded-full">
              <Landmark className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {incomeModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setIncomeModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Income</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Add or edit recurring and one-off income.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddIncome}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white"
                  >
                    <Plus className="h-4 w-4" />
                    Add income
                  </button>
                  <button
                    type="button"
                    onClick={() => setIncomeModalOpen(false)}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {incomeItems.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-white/60 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
                    No income records yet. Add your salary or other income sources.
                  </div>
                ) : (
                  incomeItems.map((income) => (
                    <div
                      key={income.id}
                      className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{income.source}</h3>
                          {income.is_recurring ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                              <Repeat className="h-3 w-3" />
                              {income.frequency || 'recurring'}
                            </span>
                          ) : null}
                        </div>
                        {income.notes ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{income.notes}</p>
                        ) : null}
                        <p className="mt-1 text-xs text-gray-400">{formatDate(income.date)}</p>
                      </div>
                      <div className="flex items-center justify-between gap-6 md:justify-end">
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(Number(income.amount))}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditIncome(income)}
                            className="rounded-full border border-gray-200 p-2 text-gray-500 transition hover:border-emerald-500 hover:text-emerald-600 dark:border-gray-700 dark:text-gray-300"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setIncomeToDelete(income)}
                            className="rounded-full border border-gray-200 p-2 text-gray-500 transition hover:border-red-500 hover:text-red-500 dark:border-gray-700 dark:text-gray-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {incomeFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setIncomeFormOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingIncome ? 'Edit Income' : 'Add Income'}
                </h2>
                <button
                  type="button"
                  onClick={() => setIncomeFormOpen(false)}
                  className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300"
                >
                  Close
                </button>
              </div>
              <form className="mt-4 space-y-4" onSubmit={editingIncome ? handleUpdateIncome : handleCreateIncome}>
                <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  Source
                  <input
                    type="text"
                    placeholder="e.g. Salary"
                    value={editingIncome ? editIncome.source : newIncome.source}
                    onChange={(event) =>
                      editingIncome
                        ? setEditIncome((prev) => ({ ...prev, source: event.target.value }))
                        : setNewIncome((prev) => ({ ...prev, source: event.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    Amount
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={editingIncome ? editIncome.amount : newIncome.amount}
                      onChange={(event) =>
                        editingIncome
                          ? setEditIncome((prev) => ({ ...prev, amount: event.target.value }))
                          : setNewIncome((prev) => ({ ...prev, amount: event.target.value }))
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    Date
                    <input
                      type="date"
                      value={editingIncome ? editIncome.date : newIncome.date}
                      onChange={(event) =>
                        editingIncome
                          ? setEditIncome((prev) => ({ ...prev, date: event.target.value }))
                          : setNewIncome((prev) => ({ ...prev, date: event.target.value }))
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </label>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  <span>Recurring income</span>
                  <input
                    type="checkbox"
                    checked={editingIncome ? editIncome.is_recurring : newIncome.is_recurring}
                    onChange={(event) =>
                      editingIncome
                        ? setEditIncome((prev) => ({ ...prev, is_recurring: event.target.checked }))
                        : setNewIncome((prev) => ({ ...prev, is_recurring: event.target.checked }))
                    }
                    className="h-4 w-4"
                  />
                </div>
                {(editingIncome ? editIncome.is_recurring : newIncome.is_recurring) ? (
                  <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    Frequency
                    <select
                      value={editingIncome ? editIncome.frequency : newIncome.frequency}
                      onChange={(event) =>
                        editingIncome
                          ? setEditIncome((prev) => ({ ...prev, frequency: event.target.value }))
                          : setNewIncome((prev) => ({ ...prev, frequency: event.target.value }))
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                      <option value="yearly">Yearly</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                ) : null}
                <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  Notes
                  <input
                    type="text"
                    placeholder="Optional notes"
                    value={editingIncome ? editIncome.notes : newIncome.notes}
                    onChange={(event) =>
                      editingIncome
                        ? setEditIncome((prev) => ({ ...prev, notes: event.target.value }))
                        : setNewIncome((prev) => ({ ...prev, notes: event.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </label>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIncomeFormOpen(false)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white"
                  >
                    {editingIncome ? 'Save Changes' : 'Save Income'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {incomeToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setIncomeToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900"
              onClick={(event) => event.stopPropagation()}
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Delete income?</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                This removes {incomeToDelete.source} from your income list.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIncomeToDelete(null)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteIncome}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Charts and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card-surface p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Spending by Category
          </h2>
          {stackedChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stackedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                {stackedCategories.map((category, index) => (
                  <Bar key={category} dataKey={category} stackId="spend" fill={COLORS[index % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No expense data available
            </div>
          )}
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card-surface p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recent Transactions
          </h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {overview?.recent_transactions && overview.recent_transactions.length > 0 ? (
              overview.recent_transactions.slice(0, 10).map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {transaction.category}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(Number(transaction.amount))}
                  </p>
                </motion.div>
              ))
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No recent transactions
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Income & Savings Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card-surface p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Income by Month</h2>
          {monthlyIncomeData.some((item) => item.total > 0) ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyIncomeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="total" fill="#4da49a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-56 text-gray-500">
              No income data available
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="card-surface p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Savings by Month</h2>
          {monthlySavingsData.some((item) => item.total > 0) ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlySavingsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="total" fill="#be8f84" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-56 text-gray-500">
              No savings data available
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
