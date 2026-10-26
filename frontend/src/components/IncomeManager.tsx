import React, { useState } from 'react';
import { Pencil, Plus, Repeat, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { incomeService } from '@/services/incomeService';
import type { Income, IncomeCreate } from '@/types';
import { formatDate, todayInput } from '@/utils/format';
import { Button, ConfirmDialog, EmptyState, Field, IconButton, Input, Modal, ModalActions, Money, Select } from './ui';

type IncomeForm = {
  source: string;
  amount: string;
  date: string;
  is_recurring: boolean;
  frequency: string;
  notes: string;
};

const emptyForm = (): IncomeForm => ({
  source: '',
  amount: '',
  date: todayInput(),
  is_recurring: false,
  frequency: 'monthly',
  notes: '',
});

const toForm = (income: Income): IncomeForm => ({
  source: income.source,
  amount: income.amount.toString(),
  date: income.date,
  is_recurring: income.is_recurring,
  frequency: income.frequency || 'monthly',
  notes: income.notes ?? '',
});

/** List of income records with add / edit / delete. Calls onChange after every write. */
const IncomeManager: React.FC<{
  open: boolean;
  onClose: () => void;
  incomes: Income[];
  onChange: () => Promise<void>;
}> = ({ open, onClose, incomes, onChange }) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Income | null>(null);
  const [form, setForm] = useState<IncomeForm>(emptyForm);
  const [toDelete, setToDelete] = useState<Income | null>(null);
  const [saving, setSaving] = useState(false);

  const openForm = (income: Income | null) => {
    setEditing(income);
    setForm(income ? toForm(income) : emptyForm());
    setFormOpen(true);
  };

  const update = (patch: Partial<IncomeForm>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.source.trim() || !form.amount || !form.date) {
      toast.error('Add a source, amount and date.');
      return;
    }

    const payload: IncomeCreate = {
      source: form.source.trim(),
      amount: Number(form.amount),
      date: form.date,
      is_recurring: form.is_recurring,
      frequency: form.is_recurring ? form.frequency : undefined,
      notes: form.notes || undefined,
    };

    try {
      setSaving(true);
      if (editing) {
        await incomeService.updateIncome(editing.id, payload);
      } else {
        await incomeService.createIncome(payload);
      }
      await onChange();
      setFormOpen(false);
      toast.success(editing ? 'Income saved.' : 'Income added.');
    } catch (error) {
      toast.error(editing ? 'Could not save the income.' : 'Could not add the income.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await incomeService.deleteIncome(toDelete.id);
      await onChange();
      setToDelete(null);
      toast.success('Income deleted.');
    } catch (error) {
      toast.error('Could not delete the income.');
    }
  };

  return (
    <>
      <Modal
        open={open && !formOpen && !toDelete}
        onClose={onClose}
        title="Income"
        description="Salary and any other money coming in."
        size="lg"
      >
        {incomes.length === 0 ? (
          <EmptyState
            title="No income yet"
            description="Add your salary to see how much is left each month."
            action={
              <Button onClick={() => openForm(null)}>
                <Plus className="h-4 w-4" />
                Add income
              </Button>
            }
          />
        ) : (
          <>
            <ul className="divide-y divide-line rounded-control border border-line">
              {incomes.map((income) => (
                <li key={income.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-sm font-medium text-ink">
                      {income.source}
                      {income.is_recurring ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium capitalize text-accent-ink">
                          <Repeat className="h-3 w-3" />
                          {income.frequency || 'Recurring'}
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-ink-3">
                      {formatDate(income.date)}
                      {income.notes ? `, ${income.notes}` : ''}
                    </p>
                  </div>
                  <Money amount={Number(income.amount)} className="text-sm font-medium text-ink" />
                  <div className="flex">
                    <IconButton label={`Edit ${income.source}`} onClick={() => openForm(income)}>
                      <Pencil className="h-4 w-4" />
                    </IconButton>
                    <IconButton label={`Delete ${income.source}`} tone="danger" onClick={() => setToDelete(income)}>
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </li>
              ))}
            </ul>
            <ModalActions>
              <Button onClick={() => openForm(null)}>
                <Plus className="h-4 w-4" />
                Add income
              </Button>
            </ModalActions>
          </>
        )}
      </Modal>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit income' : 'Add income'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Source">
            <Input
              placeholder="Salary"
              value={form.source}
              onChange={(event) => update({ source: event.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount (€)">
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(event) => update({ amount: event.target.value })}
              />
            </Field>
            <Field label="Date">
              <Input type="date" value={form.date} onChange={(event) => update({ date: event.target.value })} />
            </Field>
          </div>
          <label className="flex items-center gap-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.is_recurring}
              onChange={(event) => update({ is_recurring: event.target.checked })}
              className="h-4 w-4 rounded accent-[rgb(var(--accent-ink))]"
            />
            Repeats
          </label>
          {form.is_recurring ? (
            <Field label="How often">
              <Select value={form.frequency} onChange={(event) => update({ frequency: event.target.value })}>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
                <option value="other">Other</option>
              </Select>
            </Field>
          ) : null}
          <Field label="Note">
            <Input
              placeholder="Optional"
              value={form.notes}
              onChange={(event) => update({ notes: event.target.value })}
            />
          </Field>
          <ModalActions>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {editing ? 'Save income' : 'Add income'}
            </Button>
          </ModalActions>
        </form>
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete this income?"
        description={toDelete ? `${toDelete.source} will be removed from your income.` : ''}
        confirmLabel="Delete income"
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
};

export default IncomeManager;
