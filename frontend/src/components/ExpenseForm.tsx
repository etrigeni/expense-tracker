import React, { useEffect, useState } from 'react';
import { Repeat } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Category, Expense, ExpenseCreate } from '@/types';
import { formatDateInput, todayInput } from '@/utils/format';
import { categoryStyle, groupCategories } from '@/utils/categories';
import { Button, Field, Input, Modal, ModalActions } from './ui';

type ExpenseFormState = {
  amount: string;
  category: string;
  date: string;
  description: string;
  is_recurring: boolean;
};

const yesterdayInput = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return formatDateInput(date);
};

/** Add or edit an expense. `expense` null means a new one. */
const ExpenseForm: React.FC<{
  open: boolean;
  expense: Expense | null;
  categories: Category[];
  defaultCategory?: string;
  defaultRecurring?: boolean;
  onClose: () => void;
  onSubmit: (payload: ExpenseCreate) => Promise<void>;
}> = ({ open, expense, categories, defaultCategory = '', defaultRecurring = false, onClose, onSubmit }) => {
  const [form, setForm] = useState<ExpenseFormState>({
    amount: '',
    category: '',
    date: '',
    description: '',
    is_recurring: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      expense
        ? {
            amount: expense.amount.toString(),
            category: expense.category,
            // A recurring expense is edited as a series, from its first month
            date: expense.start_date ?? expense.date,
            description: expense.description ?? '',
            is_recurring: expense.is_recurring,
          }
        : { amount: '', category: defaultCategory, date: todayInput(), description: '', is_recurring: defaultRecurring }
    );
  }, [open, expense, defaultCategory, defaultRecurring]);

  const update = (patch: Partial<ExpenseFormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Enter an amount more than zero.');
      return;
    }
    if (!form.category) {
      toast.error('Pick a category.');
      return;
    }
    try {
      setSaving(true);
      await onSubmit({
        amount: Number(form.amount),
        category: form.category,
        date: form.date || todayInput(),
        description: form.description.trim() || undefined,
        is_recurring: form.is_recurring,
      });
    } finally {
      setSaving(false);
    }
  };

  const today = todayInput();
  const yesterday = yesterdayInput();
  const dayChips: [string, string][] = [
    [today, 'Today'],
    [yesterday, 'Yesterday'],
  ];

  return (
    <Modal open={open} onClose={onClose} title={expense ? 'Edit expense' : 'Add expense'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-baseline gap-2 border-b border-line pb-3 focus-within:border-accent">
          <span className="text-3xl font-semibold text-ink-3">€</span>
          <input
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            aria-label="Amount in euros"
            value={form.amount}
            onChange={(event) => update({ amount: event.target.value })}
            className="num w-full bg-transparent text-4xl font-semibold tracking-tight text-ink placeholder:text-ink-3/50 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink-2">Category</legend>
          <div className="space-y-3">
            {groupCategories(categories, expense?.category).map((group) => (
              <div key={group.title}>
                <p className="mb-1.5 text-xs text-ink-3">{group.title}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.categories.map((category) => {
                    const { icon: Icon, chip } = categoryStyle(category.name);
                    const selected = form.category === category.name;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => update({ category: category.name })}
                        className={`inline-flex h-10 items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 text-sm transition-colors ${
                          selected
                            ? 'border-accent bg-accent-soft font-medium text-ink ring-1 ring-accent'
                            : 'border-line text-ink-2 hover:border-ink-3/40 hover:bg-sunken'
                        }`}
                      >
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full ${chip}`} aria-hidden="true">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Description">
            <Input
              placeholder="Optional, e.g. Dinner with friends"
              value={form.description}
              onChange={(event) => update({ description: event.target.value })}
            />
          </Field>
          <div className="space-y-1.5">
            <span className="block text-sm font-medium text-ink-2">{form.is_recurring ? 'First month' : 'Date'}</span>
            <div className="flex flex-wrap gap-2">
              {dayChips.map(([value, label]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => update({ date: value })}
                  className={`h-10 shrink-0 rounded-control border px-3 text-sm font-medium transition-colors ${
                    form.date === value ? 'border-accent bg-accent-soft text-ink' : 'border-line text-ink-2 hover:bg-sunken'
                  }`}
                >
                  {label}
                </button>
              ))}
              <Input
                type="date"
                aria-label="Date"
                value={form.date}
                max={today}
                onChange={(event) => update({ date: event.target.value })}
                className="min-w-[9rem] flex-1"
              />
            </div>
          </div>
        </div>

        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-control border border-line bg-sunken/60 px-4 py-3">
          <span>
            <span className="flex items-center gap-2 text-sm font-medium text-ink">
              <Repeat className="h-4 w-4 text-ink-2" />
              Repeats every month
            </span>
            <span className="mt-0.5 block text-xs text-ink-3">
              For rent, subscriptions and bills. Counts in every month until you stop it.
            </span>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={form.is_recurring}
            onChange={(event) => update({ is_recurring: event.target.checked })}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className="relative h-6 w-11 shrink-0 rounded-full bg-line transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-accent peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-accent-ink"
          />
        </label>

        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {expense ? 'Save expense' : 'Add expense'}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
};

export default ExpenseForm;
