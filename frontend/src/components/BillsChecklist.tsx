import React from 'react';
import { Check, StopCircle, Pencil, Plus } from 'lucide-react';
import type { Expense } from '@/types';
import { formatCurrency, formatMonthLabel } from '@/utils/format';
import { CategoryIcon } from '@/utils/categories';
import { Button, EmptyState, IconButton, Money, Panel } from './ui';

const ordinal = (day: number) => {
  const suffix = day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
  return `${day}${suffix}`;
};

/** This month's recurring bills as a checklist. Ticking marks a bill paid for `month` only. */
const BillsChecklist: React.FC<{
  month: string;
  bills: Expense[];
  onTogglePaid: (bill: Expense, paid: boolean) => void;
  onAdd: () => void;
  onEdit?: (bill: Expense) => void;
  onStop?: (bill: Expense) => void;
}> = ({ month, bills, onTogglePaid, onAdd, onEdit, onStop }) => {
  const sorted = [...bills].sort((a, b) => a.date.localeCompare(b.date));
  const paidCount = sorted.filter((bill) => bill.paid).length;
  const leftToPay = sorted.filter((bill) => !bill.paid).reduce((sum, bill) => sum + Number(bill.amount), 0);
  const monthName = formatMonthLabel(month).split(' ')[0];

  return (
    <Panel>
      <div className="flex items-start justify-between gap-4 px-5 pt-5">
        <div>
          <h2 className="text-base font-semibold text-ink">Monthly bills</h2>
          <p className="mt-0.5 text-sm text-ink-3">
            {sorted.length === 0
              ? `Nothing repeats in ${monthName} yet`
              : paidCount === sorted.length
                ? `All ${sorted.length} paid for ${monthName}`
                : `${paidCount} of ${sorted.length} paid, ${formatCurrency(leftToPay)} still to pay`}
          </p>
        </div>
        <IconButton label="Add a monthly bill" onClick={onAdd}>
          <Plus className="h-4 w-4" />
        </IconButton>
      </div>

      {sorted.length > 0 ? (
        <div className="mx-5 mt-4 h-1.5 overflow-hidden rounded-full bg-white/70" aria-hidden="true">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300"
            style={{ width: `${(paidCount / sorted.length) * 100}%` }}
          />
        </div>
      ) : null}

      {sorted.length === 0 ? (
        <EmptyState
          title="Track bills that repeat"
          description="Add rent, subscriptions or the gym once and tick them off each month."
          action={
            <Button variant="secondary" onClick={onAdd}>
              <Plus className="h-4 w-4" />
              Add monthly bill
            </Button>
          }
        />
      ) : (
        <ul className="mt-2 divide-y divide-line px-2 pb-2">
          {sorted.map((bill) => {
            const name = bill.description || bill.category;
            const day = Number(bill.date.slice(8, 10));
            return (
              <li key={bill.id} className="group flex items-center gap-3 rounded-control px-3 py-2.5">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={Boolean(bill.paid)}
                  aria-label={`${name} paid for ${monthName}`}
                  onClick={() => onTogglePaid(bill, !bill.paid)}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    bill.paid ? 'border-accent bg-accent text-accent-on' : 'border-ink-3/40 bg-white hover:border-accent'
                  }`}
                >
                  {bill.paid ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                </button>
                <CategoryIcon name={bill.category} size="sm" />
                <div className={`min-w-0 flex-1 ${bill.paid ? 'opacity-60' : ''}`}>
                  <p className={`truncate text-sm font-medium text-ink ${bill.paid ? 'line-through decoration-ink-3/60' : ''}`}>
                    {name}
                  </p>
                  <p className="truncate text-xs text-ink-3">
                    {bill.paid ? 'Paid' : `Due on the ${ordinal(day)}`}
                  </p>
                </div>
                <Money amount={Number(bill.amount)} className={`text-sm font-medium text-ink ${bill.paid ? 'opacity-60' : ''}`} />
                {onEdit || onStop ? (
                  <div className="flex sm:opacity-0 sm:transition-opacity sm:focus-within:opacity-100 sm:group-hover:opacity-100">
                    {onEdit ? (
                      <IconButton label={`Edit ${name}`} onClick={() => onEdit(bill)}>
                        <Pencil className="h-4 w-4" />
                      </IconButton>
                    ) : null}
                    {onStop ? (
                      <IconButton label={`Stop ${name} after ${monthName}`} tone="danger" onClick={() => onStop(bill)}>
                        <StopCircle className="h-4 w-4" />
                      </IconButton>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
};

export default BillsChecklist;
