import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  Plus,
  Edit2,
  Trash2,
  Coffee,
  Truck,
  Home,
  Car,
  ShoppingBag,
  Receipt,
  HeartPulse,
  Sparkles,
  Brush,
  Dumbbell,
  CreditCard,
  ShoppingBasket,
  PiggyBank,
  Plane,
  type LucideIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/utils/format';
import { expenseService } from '@/services/expenseService';
import { categoryService } from '@/services/categoryService';
import { incomeService } from '@/services/incomeService';
import { budgetService } from '@/services/budgetService';
import type { Category, CategoryBudget, Expense, ExpenseCreate, ExpenseUpdate } from '@/types';


const categoryIconMap: Record<string, LucideIcon> = {
  Bills: Receipt,
  'Food/Coffee': Coffee,
  Food: Coffee,
  Delivery: Truck,
  Transport: Truck,
  'House rent': Home,
  Car,
  Health: HeartPulse,
  Shopping: ShoppingBag,
  Aesthetics: Brush,
  Gym: Dumbbell,
  Subscriptions: CreditCard,
  Supermarket: ShoppingBasket,
  Entertainment: Sparkles,
  Savings: PiggyBank,
  Travel: Plane,
};

const colorBackgroundMap: Record<string, string> = {
  'text-orange-500': 'bg-orange-500/10',
  'text-blue-500': 'bg-blue-500/10',
  'text-pink-500': 'bg-pink-500/10',
  'text-yellow-500': 'bg-yellow-500/10',
  'text-purple-500': 'bg-purple-500/10',
  'text-red-500': 'bg-red-500/10',
  'text-green-500': 'bg-green-500/10',
  'text-gray-500': 'bg-gray-500/10',
  'text-amber-500': 'bg-amber-500/10',
  'text-emerald-500': 'bg-emerald-500/10',
  'text-emerald-600': 'bg-emerald-500/10',
  'text-sky-500': 'bg-sky-500/10',
  'text-indigo-500': 'bg-indigo-500/10',
};

const iconPalette = [
  'text-orange-500',
  'text-blue-500',
  'text-pink-500',
  'text-yellow-500',
  'text-purple-500',
  'text-red-500',
  'text-green-500',
  'text-amber-500',
  'text-emerald-500',
  'text-sky-500',
  'text-indigo-500',
];

type ExpenseFormState = {
  amount: string;
  category: string;
  date: string;
  description: string;
};

const defaultExpenseForm: ExpenseFormState = {
  amount: '',
  category: '',
  date: '',
  description: '',
};

const getTodayDate = () => new Date().toISOString().split('T')[0];
const getCurrentMonth = () => new Date().toISOString().slice(0, 7);
const toMonthDate = (month: string) => (month.length === 7 ? `${month}-01` : month);

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [budgetDrafts, setBudgetDrafts] = useState<Record<string, string>>({});
  const [savingBudgetId, setSavingBudgetId] = useState<string | null>(null);
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [newExpense, setNewExpense] = useState<ExpenseFormState>(defaultExpenseForm);
  const [editExpense, setEditExpense] = useState<ExpenseFormState>(defaultExpenseForm);
  const [monthFilter, setMonthFilter] = useState(getCurrentMonth());
  const [expandedBudgetCategories, setExpandedBudgetCategories] = useState<Set<string>>(new Set());
  const budgetMonth = monthFilter || getCurrentMonth();
  const showBudgetMonthHint = !monthFilter;

  const filteredExpenses = useMemo(
    () =>
      expenses.filter((expense) => {
        if (monthFilter && expense.date.slice(0, 7) !== monthFilter) {
          return false;
        }
        return true;
      }),
    [expenses, monthFilter]
  );

  const total = filteredExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const budgetMonthExpenses = useMemo(() => {
    return expenses.filter((expense) => expense.date.slice(0, 7) === budgetMonth);
  }, [expenses, budgetMonth]);
  const budgetCategoryTotals = useMemo(() => {
    return budgetMonthExpenses.reduce<Record<string, number>>((accumulator, expense) => {
      accumulator[expense.category] = (accumulator[expense.category] ?? 0) + Number(expense.amount);
      return accumulator;
    }, {});
  }, [budgetMonthExpenses]);
  const budgetsByCategoryId = useMemo(() => {
    return budgets.reduce<Record<string, number | null>>((accumulator, budget) => {
      accumulator[budget.category_id] = budget.amount === null ? null : Number(budget.amount);
      return accumulator;
    }, {});
  }, [budgets]);
  const budgetCategories = useMemo(
    () => categories.filter((category) => category.name !== 'Savings'),
    [categories]
  );

  const loadExpenses = async () => {
    try {
      const data = await expenseService.getExpenses();
      setExpenses(data);
    } catch (error) {
      toast.error('Failed to load expenses.');
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      toast.error('Failed to load categories.');
    }
  };

  const loadBudgets = async (month: string) => {
    try {
      const data = await budgetService.getBudgets({ month: toMonthDate(month) });
      setBudgets(data);
      setBudgetDrafts((prev) => {
        const next = { ...prev };
        data.forEach((budget) => {
          next[budget.category_id] = budget.amount != null ? String(budget.amount) : '';
        });
        categories.forEach((category) => {
          if (!(category.id in next)) {
            next[category.id] = '';
          }
        });
        return next;
      });
    } catch (error) {
      toast.error('Failed to load budgets.');
    }
  };

  const loadIncomeTotal = async () => {
    try {
      const data = await incomeService.getTotal();
      setIncomeTotal(Number(data.total));
    } catch (error) {
      toast.error('Failed to load income total.');
    }
  };

  useEffect(() => {
    loadExpenses();
    loadCategories();
    loadIncomeTotal();
  }, []);

  useEffect(() => {
    loadBudgets(budgetMonth);
  }, [budgetMonth, categories]);

  const handleAddExpense = () => {
    setNewExpense({ ...defaultExpenseForm, date: getTodayDate() });
    setIsModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setEditExpense({
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date,
      description: expense.description ?? '',
    });
  };

  const parseBudgetDraft = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed) || parsed < 0) {
      return undefined;
    }
    if (parsed === 0) {
      return null;
    }
    return parsed;
  };

  const handleSaveBudget = async (category: Category) => {
    const draft = budgetDrafts[category.id] ?? '';
    const parsed = parseBudgetDraft(draft);
    if (parsed === undefined) {
      toast.error('Enter a valid non-negative budget.');
      return;
    }

    try {
      setSavingBudgetId(category.id);
      const updated = await budgetService.upsertBudget({
        category_id: category.id,
        month: toMonthDate(budgetMonth),
        amount: parsed,
      });
      setBudgets((prev) => {
        const hasExisting = prev.some(
          (budget) => budget.category_id === updated.category_id && budget.month === updated.month
        );
        if (hasExisting) {
          return prev.map((budget) =>
            budget.category_id === updated.category_id && budget.month === updated.month ? updated : budget
          );
        }
        return [...prev, updated];
      });
      setBudgetDrafts((prev) => ({
        ...prev,
        [category.id]: updated.amount != null ? String(updated.amount) : '',
      }));
      toast.success('Budget saved.');
    } catch (error) {
      toast.error('Failed to update budget.');
    } finally {
      setSavingBudgetId(null);
    }
  };


  const formatMonthLabel = (month: string) => {
    if (!month) {
      return 'All time';
    }
    const [year, monthIndex] = month.split('-').map(Number);
    if (!year || !monthIndex) {
      return month;
    }
    return new Date(year, monthIndex - 1).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const activeMonthLabel = formatMonthLabel(monthFilter);
  const budgetMonthLabel = formatMonthLabel(budgetMonth);

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();

    if (!newExpense.amount || !newExpense.category || !newExpense.date) {
      toast.error('Please complete amount, category, and date.');
      return;
    }

    if (Number(newExpense.amount) <= 0) {
      toast.error('Amount must be greater than zero.');
      return;
    }

    const payload: ExpenseCreate = {
      amount: Number(newExpense.amount),
      category: newExpense.category,
      date: newExpense.date,
      description: newExpense.description || undefined,
    };

    try {
      const created = await expenseService.createExpense(payload);
      setExpenses((prev) => [created, ...prev]);
      setIsModalOpen(false);
      toast.success('Expense added.');
    } catch (error) {
      toast.error('Failed to add expense.');
    }
  };

  const handleUpdateExpense = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    if (!editingExpense) {
      return;
    }

    if (!editExpense.amount || !editExpense.category || !editExpense.date) {
      toast.error('Please complete amount, category, and date.');
      return;
    }

    if (Number(editExpense.amount) <= 0) {
      toast.error('Amount must be greater than zero.');
      return;
    }

    const payload: ExpenseUpdate = {
      amount: Number(editExpense.amount),
      category: editExpense.category,
      date: editExpense.date,
      description: editExpense.description || undefined,
    };

    try {
      const updated = await expenseService.updateExpense(editingExpense.id, payload);
      setExpenses((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditingExpense(null);
      toast.success('Expense updated.');
    } catch (error) {
      toast.error('Failed to update expense.');
    }
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) {
      return;
    }

    try {
      await expenseService.deleteExpense(expenseToDelete.id);
      setExpenses((prev) => prev.filter((item) => item.id !== expenseToDelete.id));
      setExpenseToDelete(null);
      toast.success('Expense deleted.');
    } catch (error) {
      toast.error('Failed to delete expense.');
    }
  };

  const getCategoryIcon = (name: string) => categoryIconMap[name] ?? Receipt;
  const getIconTone = (name: string) => {
    const total = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return iconPalette[total % iconPalette.length];
  };
  const getColorClass = (color: string) => (color.startsWith('text-') ? color : '');
  const getBackgroundClass = (color: string) => colorBackgroundMap[color] ?? 'bg-gray-100 dark:bg-gray-900/40';
  const getColorStyle = (color: string) => (color.startsWith('#') ? { color } : undefined);
  const getBackgroundStyle = (color: string) =>
    color.startsWith('#') ? { backgroundColor: `${color}1A` } : undefined;

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Expenses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monthly view with totals, budgets, and category breakdown
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative z-10 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900/30 dark:text-gray-200">
            <CalendarDays className="h-4 w-4 text-gray-500" />
            <input
              type="month"
              value={monthFilter}
              onChange={(event) => setMonthFilter(event.target.value)}
              className="w-36 bg-transparent text-sm text-gray-700 outline-none pointer-events-auto dark:text-gray-200"
            />
            {monthFilter ? (
              <button
                type="button"
                onClick={() => setMonthFilter('')}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 pointer-events-auto dark:text-gray-400 dark:hover:text-gray-200"
              >
                Reset
              </button>
            ) : null}
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAddExpense}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </motion.button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-surface p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total for {activeMonthLabel}</p>
          <h2 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{formatCurrency(total)}</h2>
        </div>
        <div className="card-surface p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Income this month</p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(incomeTotal)}</h2>
        </div>
        <div className="card-surface p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Net balance</p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            {formatCurrency(incomeTotal - total)}
          </h2>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="card-surface p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Category budgets</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Set monthly limits and track spending</p>
              {showBudgetMonthHint ? (
                <p className="mt-1 text-xs text-gray-400">Budgets use the current month unless you pick one above.</p>
              ) : null}
            </div>
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {budgetMonthLabel}
            </span>
          </div>
          <div className="mt-4">
            {budgetCategories.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Add categories to start budgeting.
              </div>
            ) : (
              <>
                <div className="space-y-3 lg:hidden">
                  {[...budgetCategories]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((category) => {
                      const iconColor = getIconTone(category.name);
                      const Icon = getCategoryIcon(category.name);
                      const colorClass = getColorClass(iconColor);
                      const bgClass = getBackgroundClass(iconColor);
                      const style = {
                        ...getBackgroundStyle(iconColor),
                        ...getColorStyle(iconColor),
                      };
                      const spent = budgetCategoryTotals[category.name] ?? 0;
                      const budget = budgetsByCategoryId[category.id] ?? null;
                      const isOverBudget = budget !== null && budget > 0 && spent > budget;
                      const remaining = budget ? budget - spent : null;
                      const draftValue = budgetDrafts[category.id] ?? '';
                      const isDirty = draftValue !== (budget != null ? budget.toString() : '');
                      const isExpanded = expandedBudgetCategories.has(category.name);
                      const categoryExpenses = filteredExpenses.filter((expense) => expense.category === category.name);

                      return (
                        <div key={category.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/40">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedBudgetCategories((prev) => {
                                const next = new Set(prev);
                                if (next.has(category.name)) {
                                  next.delete(category.name);
                                } else {
                                  next.add(category.name);
                                }
                                return next;
                              })
                            }
                            className="flex w-full items-center justify-between text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bgClass} ${colorClass}`} style={style}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{category.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Spent {formatCurrency(spent)} ? {budget ? `Budget ${formatCurrency(budget)}` : 'No budget'}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-gray-400">{isExpanded ? 'Hide' : 'Show'}</span>
                          </button>

                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>Remaining</span>
                              <span className={isOverBudget ? 'text-red-500' : 'text-emerald-600'}>
                                {budget ? formatCurrency(remaining ?? 0) : '?'}
                              </span>
                            </div>
                            <form
                              className="mt-3 flex items-center gap-2"
                              onSubmit={(event) => {
                                event.preventDefault();
                                handleSaveBudget(category);
                              }}
                            >
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={draftValue}
                                onChange={(event) =>
                                  setBudgetDrafts((prev) => ({ ...prev, [category.id]: event.target.value }))
                                }
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-xs text-gray-900 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                              />
                              <button
                                type="submit"
                                disabled={!isDirty || savingBudgetId === category.id}
                                className="rounded-lg bg-gray-900 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
                              >
                                {savingBudgetId === category.id ? 'Saving' : 'Save'}
                              </button>
                            </form>
                          </div>

                          {isExpanded ? (
                            <div className="mt-3 rounded-xl border border-gray-200 bg-white/60 p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
                              {categoryExpenses.length === 0 ? (
                                <span>No expenses for {category.name} in {activeMonthLabel}.</span>
                              ) : (
                                <div className="space-y-2">
                                  {categoryExpenses.map((expense) => {
                                    const expenseMonth = expense.date.slice(0, 7);
                                    const isOverBudgetRow =
                                      expenseMonth === budgetMonth && budget !== null && budget > 0 && spent > budget;
                                    return (
                                      <div key={expense.id} className="flex items-center justify-between">
                                        <div>
                                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {expense.description || 'No description'}
                                          </p>
                                          <p className="text-xs text-gray-400">{formatDate(expense.date)}</p>
                                        </div>
                                        <span className={isOverBudgetRow ? 'text-red-500' : 'text-gray-900 dark:text-white'}>
                                          {formatCurrency(expense.amount)}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                </div>

                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                        <th className="pb-3">Category</th>
                        <th className="pb-3">Budget</th>
                        <th className="pb-3">Spent</th>
                        <th className="pb-3">Remaining</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700 dark:text-gray-200">
                      {[...budgetCategories]
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((category) => {
                          const iconColor = getIconTone(category.name);
                          const Icon = getCategoryIcon(category.name);
                          const colorClass = getColorClass(iconColor);
                          const bgClass = getBackgroundClass(iconColor);
                          const style = {
                            ...getBackgroundStyle(iconColor),
                            ...getColorStyle(iconColor),
                          };
                          const spent = budgetCategoryTotals[category.name] ?? 0;
                          const budget = budgetsByCategoryId[category.id] ?? null;
                          const isOverBudget = budget !== null && budget > 0 && spent > budget;
                          const remaining = budget ? budget - spent : null;
                          const draftValue = budgetDrafts[category.id] ?? '';
                          const isDirty = draftValue !== (budget != null ? budget.toString() : '');
                          const isExpanded = expandedBudgetCategories.has(category.name);
                          const categoryExpenses = filteredExpenses.filter((expense) => expense.category === category.name);

                          return (
                            <React.Fragment key={category.id}>
                              <tr
                                className={`border-t border-gray-200/60 transition hover:bg-gray-50/60 dark:border-gray-700/60 dark:hover:bg-gray-900/40 ${
                                  isExpanded ? 'bg-gray-50/80 dark:bg-gray-900/60' : ''
                                }`}
                              >
                                <td className="py-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedBudgetCategories((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(category.name)) {
                                          next.delete(category.name);
                                        } else {
                                          next.add(category.name);
                                        }
                                        return next;
                                      })
                                    }
                                    className="flex items-center gap-2 text-left"
                                  >
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${bgClass} ${colorClass}`} style={style}>
                                      <Icon className="h-4 w-4" />
                                    </div>
                                    <span className="font-medium">{category.name}</span>
                                  </button>
                                </td>
                                <td className="py-3">
                                  <form
                                    className="flex items-center gap-2"
                                    onSubmit={(event) => {
                                      event.preventDefault();
                                      handleSaveBudget(category);
                                    }}
                                  >
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder="0.00"
                                      value={draftValue}
                                      onChange={(event) =>
                                        setBudgetDrafts((prev) => ({ ...prev, [category.id]: event.target.value }))
                                      }
                                      className="w-28 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-900 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    <button
                                      type="submit"
                                      disabled={!isDirty || savingBudgetId === category.id}
                                      className="rounded-lg bg-gray-900 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
                                    >
                                      {savingBudgetId === category.id ? 'Saving' : 'Save'}
                                    </button>
                                  </form>
                                </td>
                                <td className="py-3">{formatCurrency(spent)}</td>
                                <td className={`py-3 ${isOverBudget ? 'text-red-500' : 'text-emerald-600'}`}>
                                  {budget ? formatCurrency(remaining ?? 0) : '?'}
                                </td>
                                <td className="py-3 text-xs text-gray-500 dark:text-gray-400">
                                  {budget
                                    ? isOverBudget
                                      ? 'Over'
                                      : 'On track'
                                    : 'No budget'}
                                </td>
                              </tr>
                              {isExpanded ? (
                                <tr className="bg-white dark:bg-gray-800">
                                  <td colSpan={5} className="pb-4 pt-2">
                                    {categoryExpenses.length === 0 ? (
                                      <div className="rounded-xl border border-dashed border-gray-200 bg-white/60 p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
                                        No expenses for {category.name} in {activeMonthLabel}.
                                      </div>
                                    ) : (
                                      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900/40">
                                        {categoryExpenses.map((expense, index) => {
                                          const expenseMonth = expense.date.slice(0, 7);
                                          const isOverBudgetRow =
                                            expenseMonth === budgetMonth && budget !== null && budget > 0 && spent > budget;

                                          return (
                                            <div
                                              key={expense.id}
                                              className={`flex items-center justify-between gap-4 px-4 py-2 ${
                                                index !== categoryExpenses.length - 1
                                                  ? 'border-b border-gray-200/70 dark:border-gray-700/70'
                                                  : ''
                                              }`}
                                            >
                                              <div className="flex items-center gap-3">
                                                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${bgClass} ${colorClass}`} style={style}>
                                                  <Icon className="h-4 w-4" />
                                                </div>
                                                <div className="space-y-0.5">
                                                  <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                      {expense.description || 'No description'}
                                                    </p>
                                                    {isOverBudgetRow ? (
                                                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-300">
                                                        Over budget
                                                      </span>
                                                    ) : null}
                                                  </div>
                                                  <p className="text-xs text-gray-400">{formatDate(expense.date)}</p>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-3">
                                                <span
                                                  className={`text-base font-semibold ${
                                                    isOverBudgetRow ? 'text-red-500 dark:text-red-300' : 'text-gray-900 dark:text-white'
                                                  }`}
                                                >
                                                  {formatCurrency(expense.amount)}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                  <button
                                                    type="button"
                                                    onClick={() => handleEditExpense(expense)}
                                                    className="rounded-full border border-gray-200 p-1.5 text-gray-500 transition hover:border-purple-500 hover:text-purple-600 dark:border-gray-700 dark:text-gray-300"
                                                  >
                                                    <Edit2 className="h-4 w-4" />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => setExpenseToDelete(expense)}
                                                    className="rounded-full border border-gray-200 p-1.5 text-gray-500 transition hover:border-red-500 hover:text-red-500 dark:border-gray-700 dark:text-gray-300"
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ) : null}
                            </React.Fragment>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>


      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleAddExpense}
        className="fixed bottom-20 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-2xl shadow-purple-500/30 lg:hidden"
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setIsModalOpen(false)}
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
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Expense</h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300"
                >
                  Close
                </button>
              </div>
              <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    Amount
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      value={newExpense.amount}
                      onChange={(event) => setNewExpense((prev) => ({ ...prev, amount: event.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    Date
                    <input
                      type="date"
                      value={newExpense.date}
                      onChange={(event) => setNewExpense((prev) => ({ ...prev, date: event.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </label>
                </div>
                <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  Category
                  <select
                    value={newExpense.category}
                    onChange={(event) => setNewExpense((prev) => ({ ...prev, category: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  Description
                  <input
                    type="text"
                    placeholder="e.g. Dinner with friends"
                    value={newExpense.description}
                    onChange={(event) => setNewExpense((prev) => ({ ...prev, description: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </label>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleSubmit(event);
                    }}
                    className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Save Expense
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingExpense && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setEditingExpense(null)}
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
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Expense</h2>
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300"
                >
                  Close
                </button>
              </div>
              <form className="mt-4 space-y-4" onSubmit={handleUpdateExpense}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    Amount
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={editExpense.amount}
                      onChange={(event) => setEditExpense((prev) => ({ ...prev, amount: event.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    Date
                    <input
                      type="date"
                      value={editExpense.date}
                      onChange={(event) => setEditExpense((prev) => ({ ...prev, date: event.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </label>
                </div>
                <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  Category
                  <select
                    value={editExpense.category}
                    onChange={(event) => setEditExpense((prev) => ({ ...prev, category: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  Description
                  <input
                    type="text"
                    value={editExpense.description}
                    onChange={(event) => setEditExpense((prev) => ({ ...prev, description: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none focus:border-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </label>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingExpense(null)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleUpdateExpense(event);
                    }}
                    className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expenseToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setExpenseToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900"
              onClick={(event) => event.stopPropagation()}
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Delete expense?</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                This removes {expenseToDelete.category} from your expenses list.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setExpenseToDelete(null)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteExpense}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Expenses;
