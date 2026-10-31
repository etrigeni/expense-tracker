import React, { useEffect, useState } from 'react';
import { Banknote } from 'lucide-react';
import toast from 'react-hot-toast';
import { incomeService } from '@/services/incomeService';
import type { Income } from '@/types';
import { todayInput } from '@/utils/format';
import { Button, Input } from './ui';

const dismissKey = (periodStart: string) => `payday-dismissed-${periodStart}`;

/** Whether "Not now" was chosen for the period starting on `periodStart`. */
export const isPaydayDismissed = (periodStart: string) => {
  try {
    return localStorage.getItem(dismissKey(periodStart)) === '1';
  } catch {
    return false;
  }
};

/** The salary to suggest: the latest one-off income, which is normally last payday's salary. */
export const lastSalary = (incomes: Income[]): Income | undefined =>
  incomes.filter((income) => !income.is_recurring).sort((a, b) => b.date.localeCompare(a.date))[0];

/** Whether to ask for this period's salary: none entered yet, and no repeating income covers it. */
export const needsSalary = (incomes: Income[], periodStart: string, periodEnd: string) =>
  !incomes.some((income) => income.is_recurring) &&
  !incomes.some((income) => periodStart <= income.date && income.date <= periodEnd);

/**
 * Asks for this pay period's salary, prefilled with the last one. Adding it dates it on payday
 * (the period start) so it counts in this period. "Not now" hides it until the next period.
 */
const PaydayPrompt: React.FC<{
  monthName: string;
  periodStart: string;
  periodEnd: string;
  incomes: Income[];
  onAdded: () => Promise<void>;
}> = ({ monthName, periodStart, periodEnd, incomes, onAdded }) => {
  const previous = lastSalary(incomes);
  const [amount, setAmount] = useState('');
  const [hidden, setHidden] = useState(() => isPaydayDismissed(periodStart));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAmount(previous ? String(Number(previous.amount)) : '');
  }, [previous?.id]);

  useEffect(() => {
    setHidden(isPaydayDismissed(periodStart));
  }, [periodStart]);

  if (hidden || !needsSalary(incomes, periodStart, periodEnd)) {
    return null;
  }

  const source = previous?.source ?? 'Salary';
  const isPayday = todayInput() === periodStart;

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error('Enter the amount you were paid.');
      return;
    }
    try {
      setSaving(true);
      await incomeService.createIncome({ source, amount: value, date: periodStart, is_recurring: false });
      toast.success(`${source} added for ${monthName}.`);
      await onAdded();
    } catch (error) {
      toast.error('Could not add the salary.');
    } finally {
      setSaving(false);
    }
  };

  const dismiss = () => {
    try {
      localStorage.setItem(dismissKey(periodStart), '1');
    } catch {
      // Storage can be unavailable (private mode); hiding for this visit is enough
    }
    setHidden(true);
  };

  return (
    <section className="rounded-panel border border-accent/40 bg-accent-soft p-4 sm:p-5" aria-label="Add salary">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-white/70 text-accent-ink">
          <Banknote className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-ink">
            {isPayday ? `Payday! Add your ${monthName} salary` : `Add your ${monthName} salary`}
          </h2>
          <p className="mt-0.5 text-sm text-ink-2">
            {previous ? 'Same as last time? Change it if it was different.' : 'Enter what you were paid.'}
          </p>
        </div>
      </div>
      <form onSubmit={handleAdd} className="mt-3 flex flex-wrap items-center gap-2 sm:pl-[3.25rem]">
        <div className="relative min-w-[8rem] flex-1 sm:max-w-[12rem]">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-3">€</span>
          <Input
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            aria-label={`${source} amount`}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="num pl-7"
          />
        </div>
        <Button type="submit" disabled={saving}>
          Add {source.toLowerCase() === 'salary' ? 'salary' : source}
        </Button>
        <Button variant="ghost" onClick={dismiss}>
          Not now
        </Button>
      </form>
    </section>
  );
};

export default PaydayPrompt;
