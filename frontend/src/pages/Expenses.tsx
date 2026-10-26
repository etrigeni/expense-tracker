import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Plus, Repeat, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { expenseService } from '@/services/expenseService';
import { categoryService } from '@/services/categoryService';
import type { Category, Expense, ExpenseCreate } from '@/types';
import {
  currentMonthKey,
  formatCurrency,
  formatDateInput,
  formatDayHeading,
  formatMonthLabel,
  monthKeyToDate,
  shiftMonthKey,
} from '@/utils/format';
import { CategoryIcon } from '@/utils/categories';
import { Button, ConfirmDialog, EmptyState, IconButton, Input, Money, PageHeader, Panel, Select } from '@/components/ui';
import ExpenseForm from '@/components/ExpenseForm';
import BillsChecklist from '@/components/BillsChecklist';
import { notifyExpensesChanged, useExpensesChanged, useQuickAdd } from '@/components/QuickAdd';

const lastDayOfMonth = (month: string) => {
  const [year, monthIndex] = month.split('-').map(Number);
  return formatDateInput(new Date(year, monthIndex, 0));
};

const MonthSwitcher: React.FC<{ month: string; onChange: (month: string) => void }> = ({ month, onChange }) => {
  const isCurrent = month === currentMonthKey();
  return (
    <div className="flex items-center gap-1 rounded-control border border-line bg-surface p-0.5">
      <IconButton label="Previous month" onClick={() => onChange(shiftMonthKey(month, -1))}>
        <ChevronLeft className="h-4 w-4" />
      </IconButton>
      <span className="min-w-[8.5rem] text-center text-sm font-medium text-ink">{formatMonthLabel(month)}</span>
      <IconButton
        label="Next month"
        onClick={() => onChange(shiftMonthKey(month, 1))}
        disabled={isCurrent}
        className="disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronRight className="h-4 w-4" />
      </IconButton>
    </div>
  );
};

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [month, setMonth] = useState(currentMonthKey());
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Expense | null>(null);
  const [toDelete, setToDelete] = useState<Expense | null>(null);
  const [toStop, setToStop] = useState<Expense | null>(null);
  const openQuickAdd = useQuickAdd();
  const monthName = formatMonthLabel(month).split(' ')[0];

  const loadExpenses = async (forMonth = month) => {
    try {
      setExpenses(await expenseService.getExpenses({ month: monthKeyToDate(forMonth) }));
    } catch (error) {
      toast.error('Could not load expenses.');
    }
  };

  useEffect(() => {
    categoryService
      .getCategories()
      .then(setCategories)
      .catch(() => toast.error('Could not load categories.'));
  }, []);

  useEffect(() => {
    loadExpenses(month);
  }, [month]);

  useExpensesChanged(() => loadExpenses());

  const bills = useMemo(() => expenses.filter((expense) => expense.is_recurring), [expenses]);
  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const billsTotal = bills.reduce((sum, bill) => sum + Number(bill.amount), 0);

  const visibleExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return expenses
      .filter((expense) => !categoryFilter || expense.category === categoryFilter)
      .filter(
        (expense) =>
          !query ||
          expense.description?.toLowerCase().includes(query) ||
          expense.category.toLowerCase().includes(query)
      );
  }, [expenses, categoryFilter, search]);

  const expensesByDay = useMemo(() => {
    const groups: { date: string; total: number; items: Expense[] }[] = [];
    visibleExpenses.forEach((expense) => {
      const last = groups[groups.length - 1];
      if (last && last.date === expense.date) {
        last.items.push(expense);
        last.total += Number(expense.amount);
      } else {
        groups.push({ date: expense.date, total: Number(expense.amount), items: [expense] });
      }
    });
    return groups;
  }, [visibleExpenses]);

  const handleTogglePaid = async (bill: Expense, paid: boolean) => {
    setExpenses((prev) => prev.map((item) => (item.id === bill.id ? { ...item, paid } : item)));
    try {
      await expenseService.setPaid(bill.id, monthKeyToDate(month), paid);
    } catch (error) {
      setExpenses((prev) => prev.map((item) => (item.id === bill.id ? { ...item, paid: !paid } : item)));
      toast.error('Could not update the checklist.');
    }
  };

  const handleSave = async (payload: ExpenseCreate) => {
    if (!editing) return;
    try {
      await expenseService.updateExpense(editing.id, payload);
      setEditing(null);
      notifyExpensesChanged();
      toast.success('Expense saved.');
    } catch (error) {
      toast.error('Could not save the expense.');
    }
  };

  const handleStop = async () => {
    if (!toStop) return;
    try {
      await expenseService.updateExpense(toStop.id, { recurring_until: lastDayOfMonth(month) });
      setToStop(null);
      notifyExpensesChanged();
      toast.success(`${toStop.description || toStop.category} stops after ${monthName}.`);
    } catch (error) {
      toast.error('Could not stop the bill.');
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await expenseService.deleteExpense(toDelete.id);
      setToDelete(null);
      notifyExpensesChanged();
      toast.success('Expense deleted.');
    } catch (error) {
      toast.error('Could not delete the expense.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Expenses">
        <MonthSwitcher month={month} onChange={setMonth} />
      </PageHeader>

      <Panel as="div" className="grid grid-cols-3 divide-x divide-line">
        <div className="p-4 sm:p-5">
          <p className="text-sm text-ink-3">Spent</p>
          <p className="mt-1 text-xl font-semibold sm:text-2xl">
            <Money amount={totalSpent} />
          </p>
        </div>
        <div className="p-4 sm:p-5">
          <p className="text-sm text-ink-3">Monthly bills</p>
          <p className="mt-1 text-xl font-semibold sm:text-2xl">
            <Money amount={billsTotal} />
          </p>
        </div>
        <div className="p-4 sm:p-5">
          <p className="text-sm text-ink-3">Everything else</p>
          <p className="mt-1 text-xl font-semibold sm:text-2xl">
            <Money amount={totalSpent - billsTotal} />
          </p>
        </div>
      </Panel>

      <BillsChecklist
        month={month}
        bills={bills}
        onTogglePaid={handleTogglePaid}
        onAdd={() => openQuickAdd('', { recurring: true })}
        onEdit={setEditing}
        onStop={setToStop}
      />

      <section className="space-y-4" aria-label="Transactions">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <h2 className="mr-auto text-base font-semibold text-ink">
            Transactions <span className="font-normal text-ink-3">({expenses.length})</span>
          </h2>
          <Input
            type="search"
            placeholder="Search descriptions"
            aria-label="Search expenses"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="sm:max-w-xs"
          />
          <Select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="sm:w-52"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </Select>
          {categoryFilter || search ? (
            <Button
              variant="ghost"
              onClick={() => {
                setCategoryFilter('');
                setSearch('');
              }}
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          ) : null}
        </div>

        <Panel>
          {expensesByDay.length === 0 ? (
            expenses.length === 0 ? (
              <EmptyState
                title={`No expenses in ${formatMonthLabel(month)}`}
                description="Add what you spend to see where your money goes."
                action={
                  <Button onClick={() => openQuickAdd(categoryFilter)}>
                    <Plus className="h-4 w-4" />
                    Add expense
                  </Button>
                }
              />
            ) : (
              <EmptyState title="No matching expenses" description="Try another search or category." />
            )
          ) : (
            <div className="divide-y divide-line">
              {expensesByDay.map((group) => (
                <section key={group.date} aria-label={formatDayHeading(group.date)}>
                  <div className="flex items-center justify-between bg-white/40 px-5 py-2 text-xs font-medium text-ink-3">
                    <span>{formatDayHeading(group.date)}</span>
                    <span className="num">{formatCurrency(group.total)}</span>
                  </div>
                  <ul className="divide-y divide-line">
                    {group.items.map((expense) => (
                      <li key={expense.id} className="group flex items-center gap-3 px-5 py-3">
                        <CategoryIcon name={expense.category} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">
                            {expense.description || expense.category}
                          </p>
                          <p className="flex items-center gap-1.5 truncate text-xs text-ink-3">
                            {expense.description ? expense.category : null}
                            {expense.is_recurring ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent-ink">
                                <Repeat className="h-3 w-3" />
                                Monthly
                              </span>
                            ) : null}
                          </p>
                        </div>
                        <Money amount={Number(expense.amount)} className="text-sm font-medium text-ink" />
                        <div className="flex sm:opacity-0 sm:transition-opacity sm:focus-within:opacity-100 sm:group-hover:opacity-100">
                          <IconButton label="Edit expense" onClick={() => setEditing(expense)}>
                            <Pencil className="h-4 w-4" />
                          </IconButton>
                          <IconButton label="Delete expense" tone="danger" onClick={() => setToDelete(expense)}>
                            <Trash2 className="h-4 w-4" />
                          </IconButton>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </Panel>
      </section>

      <ExpenseForm
        open={editing !== null}
        expense={editing}
        categories={categories}
        onClose={() => setEditing(null)}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={toStop !== null}
        title={toStop ? `Stop ${toStop.description || toStop.category}?` : 'Stop this bill?'}
        description={`It still counts in ${formatMonthLabel(month)} and earlier months, but not after.`}
        confirmLabel={`Stop after ${monthName}`}
        onConfirm={handleStop}
        onClose={() => setToStop(null)}
      />

      <ConfirmDialog
        open={toDelete !== null}
        title={toDelete?.is_recurring ? 'Delete this monthly bill?' : 'Delete this expense?'}
        description={
          toDelete
            ? toDelete.is_recurring
              ? `${toDelete.description || toDelete.category} is removed from every month, past ones included. To keep past months, stop it instead.`
              : `${toDelete.description || toDelete.category}, ${formatCurrency(Number(toDelete.amount))}. This can't be undone.`
            : ''
        }
        confirmLabel={toDelete?.is_recurring ? 'Delete from every month' : 'Delete expense'}
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
};

export default Expenses;
