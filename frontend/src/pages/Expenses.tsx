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

// Specific color assignments for each category
const categoryColorMap: Record<string, string> = {
  'Bills': 'text-red-500',
  'Food/Coffee': 'text-amber-500',
  'Food': 'text-amber-500',
  'Delivery': 'text-orange-500',
  'Transport': 'text-blue-500',
  'House rent': 'text-purple-500',
  'Car': 'text-slate-600',
  'Health': 'text-pink-500',
  'Shopping': 'text-rose-500',
  'Aesthetics': 'text-fuchsia-500',
  'Gym': 'text-emerald-500',
  'Subscriptions': 'text-indigo-500',
  'Supermarket': 'text-green-500',
  'Entertainment': 'text-violet-500',
  'Savings': 'text-teal-500',
  'Travel': 'text-sky-500',
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
  'text-rose-500': 'bg-rose-500/10',
  'text-fuchsia-500': 'bg-fuchsia-500/10',
  'text-violet-500': 'bg-violet-500/10',
  'text-teal-500': 'bg-teal-500/10',
  'text-slate-600': 'bg-slate-600/10',
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
  'text-rose-500',
  'text-fuchsia-500',
  'text-violet-500',
  'text-teal-500',
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

type BudgetSortOption = 'name' | 'spent' | 'budget' | 'remaining';

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
  const [budgetSortBy, setBudgetSortBy] = useState<BudgetSortOption>('name');
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

  const sortedBudgetCategories = useMemo(() => {
    const sorted = [...budgetCategories];

    sorted.sort((a, b) => {
      const spentA = budgetCategoryTotals[a.name] ?? 0;
      const spentB = budgetCategoryTotals[b.name] ?? 0;
      const budgetA = budgetsByCategoryId[a.id] ?? null;
      const budgetB = budgetsByCategoryId[b.id] ?? null;
      const remainingA = budgetA ? budgetA - spentA : 0;
      const remainingB = budgetB ? budgetB - spentB : 0;

      switch (budgetSortBy) {
        case 'spent':
          return spentB - spentA; // Highest spent first
        case 'budget':
          if (budgetA === null && budgetB === null) return 0;
          if (budgetA === null) return 1;
          if (budgetB === null) return -1;
          return budgetB - budgetA; // Highest budget first
        case 'remaining':
          if (budgetA === null && budgetB === null) return 0;
          if (budgetA === null) return 1;
          if (budgetB === null) return -1;
          return remainingB - remainingA; // Highest remaining first
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return sorted;
  }, [budgetCategories, budgetCategoryTotals, budgetsByCategoryId, budgetSortBy]);

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
    // Check if category has a specific assigned color
    if (categoryColorMap[name]) {
      return categoryColorMap[name];
    }
    // Fall back to hash-based color assignment for custom categories
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
        <div className="card-surface p-6 lg:p-8">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Category Budgets</h2>
                <p className="mt-1 text-base text-gray-600 dark:text-gray-400">Set monthly limits and track spending</p>
                {showBudgetMonthHint ? (
                  <p className="mt-1.5 text-sm text-purple-600 dark:text-purple-400">💡 Budgets use the current month unless you pick one above.</p>
                ) : null}
              </div>
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-2 text-sm font-bold text-purple-700 dark:from-purple-900/30 dark:to-blue-900/30 dark:text-purple-300">
                📅 {budgetMonthLabel}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Sort by:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'name' as BudgetSortOption, label: 'Name', icon: '🔤' },
                  { value: 'spent' as BudgetSortOption, label: 'Spent', icon: '💰' },
                  { value: 'budget' as BudgetSortOption, label: 'Budget', icon: '🎯' },
                  { value: 'remaining' as BudgetSortOption, label: 'Remaining', icon: '📊' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setBudgetSortBy(option.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      budgetSortBy === option.value
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {option.icon} {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4">
            {budgetCategories.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Add categories to start budgeting.
              </div>
            ) : (
              <>
                <div className="space-y-4 lg:hidden">
                  {sortedBudgetCategories.map((category) => {
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
                      const percentage = budget && budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
                      const draftValue = budgetDrafts[category.id] ?? '';
                      const isDirty = draftValue !== (budget != null ? budget.toString() : '');
                      const isExpanded = expandedBudgetCategories.has(category.name);
                      const categoryExpenses = filteredExpenses.filter((expense) => expense.category === category.name);

                      return (
                        <div key={category.id} className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50/50 p-5 shadow-lg dark:border-gray-700 dark:from-gray-900/60 dark:to-gray-900/40">
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
                              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bgClass} ${colorClass} shadow-md`} style={style}>
                                <Icon className="h-6 w-6" />
                              </div>
                              <div>
                                <p className="text-base font-bold text-gray-900 dark:text-white">{category.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {budget ? `${formatCurrency(budget)} budget` : 'No budget set'}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{isExpanded ? '▲ Hide' : '▼ Show'}</span>
                          </button>

                          {budget ? (
                            <div className="mt-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progress</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{Math.round(percentage)}%</span>
                              </div>
                              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isOverBudget
                                      ? 'bg-gradient-to-r from-red-500 to-red-600'
                                      : percentage > 80
                                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                                      : 'bg-gradient-to-r from-emerald-400 to-green-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          ) : null}

                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-900/20">
                              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Spent</p>
                              <p className="mt-1 text-lg font-bold text-blue-900 dark:text-blue-300">{formatCurrency(spent)}</p>
                            </div>
                            <div className={`rounded-xl p-3 ${isOverBudget ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
                              <p className={`text-xs font-medium ${isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {isOverBudget ? 'Over by' : 'Remaining'}
                              </p>
                              <p className={`mt-1 text-lg font-bold ${isOverBudget ? 'text-red-900 dark:text-red-300' : 'text-emerald-900 dark:text-emerald-300'}`}>
                                {budget ? formatCurrency(Math.abs(remaining ?? 0)) : '—'}
                              </p>
                            </div>
                          </div>

                          <form
                            className="mt-4 flex items-center gap-2"
                            onSubmit={(event) => {
                              event.preventDefault();
                              handleSaveBudget(category);
                            }}
                          >
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Set budget..."
                              value={draftValue}
                              onChange={(event) =>
                                setBudgetDrafts((prev) => ({ ...prev, [category.id]: event.target.value }))
                              }
                              className="flex-1 rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-purple-900/30"
                            />
                            <button
                              type="submit"
                              disabled={!isDirty || savingBudgetId === category.id}
                              className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {savingBudgetId === category.id ? '⏳' : '💾 Save'}
                            </button>
                          </form>

                          {isExpanded ? (
                            <div className="mt-4 rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-800/60">
                              {categoryExpenses.length === 0 ? (
                                <div className="text-center py-6">
                                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    No expenses for {category.name} in {activeMonthLabel}
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
                                    <span className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                      {categoryExpenses.length} {categoryExpenses.length === 1 ? 'Transaction' : 'Transactions'}
                                    </span>
                                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                                      Total: {formatCurrency(spent)}
                                    </span>
                                  </div>
                                  {categoryExpenses.map((expense) => {
                                    const expenseMonth = expense.date.slice(0, 7);
                                    const isOverBudgetRow =
                                      expenseMonth === budgetMonth && budget !== null && budget > 0 && spent > budget;
                                    return (
                                      <div
                                        key={expense.id}
                                        className={`flex items-center justify-between rounded-xl p-3 transition ${
                                          isOverBudgetRow
                                            ? 'bg-red-50/80 dark:bg-red-900/20'
                                            : 'bg-gray-50/80 dark:bg-gray-700/40'
                                        }`}
                                      >
                                        <div className="flex-1">
                                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                                            {expense.description || 'No description'}
                                          </p>
                                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            {formatDate(expense.date)}
                                          </p>
                                        </div>
                                        <span
                                          className={`text-base font-bold ${
                                            isOverBudgetRow ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                                          }`}
                                        >
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
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        <th className="pb-4">Category</th>
                        <th className="pb-4">Budget</th>
                        <th className="pb-4">Spent</th>
                        <th className="pb-4">Progress</th>
                        <th className="pb-4">Remaining</th>
                        <th className="pb-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-base text-gray-700 dark:text-gray-200">
                      {sortedBudgetCategories.map((category) => {
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
                          const percentage = budget && budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
                          const draftValue = budgetDrafts[category.id] ?? '';
                          const isDirty = draftValue !== (budget != null ? budget.toString() : '');
                          const isExpanded = expandedBudgetCategories.has(category.name);
                          const categoryExpenses = filteredExpenses.filter((expense) => expense.category === category.name);

                          return (
                            <React.Fragment key={category.id}>
                              <tr
                                className={`border-t-2 border-gray-200/80 transition hover:bg-gradient-to-r hover:from-purple-50/30 hover:to-blue-50/30 dark:border-gray-700/80 dark:hover:from-purple-900/10 dark:hover:to-blue-900/10 ${
                                  isExpanded ? 'bg-purple-50/20 dark:bg-purple-900/10' : ''
                                }`}
                              >
                                <td className="py-5">
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
                                    className="flex items-center gap-3 text-left"
                                  >
                                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${bgClass} ${colorClass} shadow-md`} style={style}>
                                      <Icon className="h-5 w-5" />
                                    </div>
                                    <span className="text-base font-bold">{category.name}</span>
                                  </button>
                                </td>
                                <td className="py-5">
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
                                      placeholder="Set budget..."
                                      value={draftValue}
                                      onChange={(event) =>
                                        setBudgetDrafts((prev) => ({ ...prev, [category.id]: event.target.value }))
                                      }
                                      className="w-32 rounded-xl border-2 border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-purple-900/30"
                                    />
                                    <button
                                      type="submit"
                                      disabled={!isDirty || savingBudgetId === category.id}
                                      className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-2 text-xs font-bold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {savingBudgetId === category.id ? '⏳' : '💾'}
                                    </button>
                                  </form>
                                </td>
                                <td className="py-5">
                                  <span className="text-base font-bold text-blue-600 dark:text-blue-400">{formatCurrency(spent)}</span>
                                </td>
                                <td className="py-5">
                                  {budget ? (
                                    <div className="flex items-center gap-2">
                                      <div className="h-2.5 w-24 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                        <div
                                          className={`h-full rounded-full transition-all duration-500 ${
                                            isOverBudget
                                              ? 'bg-gradient-to-r from-red-500 to-red-600'
                                              : percentage > 80
                                              ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                                              : 'bg-gradient-to-r from-emerald-400 to-green-500'
                                          }`}
                                          style={{ width: `${percentage}%` }}
                                        />
                                      </div>
                                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{Math.round(percentage)}%</span>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-400">—</span>
                                  )}
                                </td>
                                <td className={`py-5 text-base font-bold ${isOverBudget ? 'text-red-500' : 'text-emerald-600'}`}>
                                  {budget ? formatCurrency(Math.abs(remaining ?? 0)) : '—'}
                                </td>
                                <td className="py-5">
                                  {budget ? (
                                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                                      isOverBudget
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                    }`}>
                                      {isOverBudget ? '⚠️ Over' : '✓ On track'}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                      Not set
                                    </span>
                                  )}
                                </td>
                              </tr>
                              {isExpanded ? (
                                <tr className="bg-gradient-to-br from-purple-50/30 to-blue-50/30 dark:from-purple-900/10 dark:to-blue-900/10">
                                  <td colSpan={6} className="pb-5 pt-3 px-5">
                                    {categoryExpenses.length === 0 ? (
                                      <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white/80 p-8 text-center dark:border-gray-600 dark:bg-gray-800/60">
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                          No expenses for {category.name} in {activeMonthLabel}
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="rounded-2xl border-2 border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900/60">
                                        <div className="border-b-2 border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 px-5 py-3 dark:border-gray-700 dark:from-purple-900/20 dark:to-blue-900/20">
                                          <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                                              📋 {categoryExpenses.length} {categoryExpenses.length === 1 ? 'Transaction' : 'Transactions'}
                                            </span>
                                            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                                              Total: {formatCurrency(spent)}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="p-3">
                                          <div className="space-y-2">
                                            {categoryExpenses.map((expense) => {
                                              const expenseMonth = expense.date.slice(0, 7);
                                              const isOverBudgetRow =
                                                expenseMonth === budgetMonth && budget !== null && budget > 0 && spent > budget;

                                              return (
                                                <div
                                                  key={expense.id}
                                                  className={`flex items-center justify-between gap-4 rounded-xl p-3 transition ${
                                                    isOverBudgetRow
                                                      ? 'bg-red-50 dark:bg-red-900/20'
                                                      : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/60 dark:hover:bg-gray-800'
                                                  }`}
                                                >
                                                  <div className="flex items-center gap-3 flex-1">
                                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bgClass} ${colorClass} shadow-sm`} style={style}>
                                                      <Icon className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                      <div className="flex items-center gap-2">
                                                        <p className="text-base font-bold text-gray-900 dark:text-white">
                                                          {expense.description || 'No description'}
                                                        </p>
                                                        {isOverBudgetRow ? (
                                                          <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                                                            ⚠️ Over budget
                                                          </span>
                                                        ) : null}
                                                      </div>
                                                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                        {formatDate(expense.date)}
                                                      </p>
                                                    </div>
                                                  </div>
                                                  <div className="flex items-center gap-4">
                                                    <span
                                                      className={`text-lg font-bold ${
                                                        isOverBudgetRow ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                                                      }`}
                                                    >
                                                      {formatCurrency(expense.amount)}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                      <button
                                                        type="button"
                                                        onClick={() => handleEditExpense(expense)}
                                                        className="rounded-lg border-2 border-gray-200 p-2 text-gray-600 transition hover:border-purple-500 hover:bg-purple-50 hover:text-purple-600 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-purple-900/20"
                                                      >
                                                        <Edit2 className="h-4 w-4" />
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() => setExpenseToDelete(expense)}
                                                        className="rounded-lg border-2 border-gray-200 p-2 text-gray-600 transition hover:border-red-500 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-red-900/20"
                                                      >
                                                        <Trash2 className="h-4 w-4" />
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
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
