import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { tripService } from '@/services/tripService';
import { expenseService } from '@/services/expenseService';
import { categoryService } from '@/services/categoryService';
import type { Category, Expense, ExpenseCreate, Trip, TripCreate } from '@/types';
import { formatCurrency, formatDayHeading, formatPeriodRange } from '@/utils/format';
import { CategoryIcon } from '@/utils/categories';
import { Button, ConfirmDialog, EmptyState, IconButton, Money, Panel, PanelHeader, Spinner } from '@/components/ui';
import ExpenseForm from '@/components/ExpenseForm';
import TripForm from '@/components/TripForm';
import { notifyExpensesChanged, useExpensesChanged, useQuickAdd } from '@/components/QuickAdd';

const TripDetail: React.FC = () => {
  const { tripId = '' } = useParams();
  const navigate = useNavigate();
  const openQuickAdd = useQuickAdd();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [editingTrip, setEditingTrip] = useState(false);
  const [deletingTrip, setDeletingTrip] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [toDelete, setToDelete] = useState<Expense | null>(null);

  const load = async () => {
    try {
      const [tripData, tripExpenses] = await Promise.all([
        tripService.getTrip(tripId),
        tripService.getTripExpenses(tripId),
      ]);
      setTrip(tripData);
      setExpenses(tripExpenses);
    } catch (error) {
      toast.error('Could not load the trip.');
      navigate('/trips');
    }
  };

  useEffect(() => {
    load();
    categoryService.getCategories().then(setCategories).catch(() => undefined);
    tripService.getTrips().then(setAllTrips).catch(() => undefined);
  }, [tripId]);

  useExpensesChanged(load);

  const byCategory = useMemo(() => {
    const totals = new Map<string, number>();
    expenses.forEach((expense) => totals.set(expense.category, (totals.get(expense.category) ?? 0) + Number(expense.amount)));
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const byDay = useMemo(() => {
    const groups: { date: string; total: number; items: Expense[] }[] = [];
    expenses.forEach((expense) => {
      const last = groups[groups.length - 1];
      if (last && last.date === expense.date) {
        last.items.push(expense);
        last.total += Number(expense.amount);
      } else {
        groups.push({ date: expense.date, total: Number(expense.amount), items: [expense] });
      }
    });
    return groups;
  }, [expenses]);

  if (!trip) {
    return <Spinner />;
  }

  const total = Number(trip.total);
  const days =
    Math.round((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / 86_400_000) + 1;

  const handleTripSave = async (data: TripCreate) => {
    try {
      setTrip(await tripService.updateTrip(trip.id, data));
      setEditingTrip(false);
      toast.success('Trip saved.');
    } catch (error) {
      toast.error('Could not save the trip.');
    }
  };

  const handleTripDelete = async () => {
    try {
      await tripService.deleteTrip(trip.id);
      toast.success('Trip deleted. Its expenses are kept.');
      navigate('/trips');
    } catch (error) {
      toast.error('Could not delete the trip.');
    }
  };

  const handleExpenseSave = async (payload: ExpenseCreate) => {
    if (!editingExpense) return;
    try {
      await expenseService.updateExpense(editingExpense.id, payload);
      setEditingExpense(null);
      notifyExpensesChanged();
      toast.success('Expense saved.');
    } catch (error) {
      toast.error('Could not save the expense.');
    }
  };

  const handleExpenseDelete = async () => {
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
      <Link to="/trips" className="-m-2 inline-flex items-center gap-1.5 p-2 text-sm text-ink-3 hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        All trips
      </Link>

      <section className="relative overflow-hidden rounded-panel bg-hero bg-hero-gradient p-6 sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-ink">{trip.name}</h1>
            <p className="mt-1 text-sm text-ink-2">
              {formatPeriodRange(trip.start_date, trip.end_date)} {trip.start_date.slice(0, 4)}, {days}{' '}
              {days === 1 ? 'day' : 'days'}
            </p>
          </div>
          <div className="-mr-2 -mt-1 flex shrink-0">
            <IconButton label="Edit trip" onClick={() => setEditingTrip(true)}>
              <Pencil className="h-4 w-4" />
            </IconButton>
            <IconButton label="Delete trip" tone="danger" onClick={() => setDeletingTrip(true)}>
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
        <p className="mt-6 text-sm font-medium text-ink-2">Spent on this trip</p>
        <p className="mt-1 text-5xl font-semibold tracking-tight text-ink">
          <Money amount={total} fractionClassName="text-[0.45em] font-medium text-ink-3" />
        </p>
        {days > 1 && total > 0 ? (
          <p className="mt-2 text-sm text-ink-2">{formatCurrency(total / days)} a day on average</p>
        ) : null}
        <Button className="mt-6" onClick={() => openQuickAdd('', { tripId: trip.id })}>
          <Plus className="h-4 w-4" />
          Add trip expense
        </Button>
      </section>

      {expenses.length === 0 ? (
        <Panel>
          <EmptyState
            title="Nothing spent on this trip yet"
            description="Expenses dated between the trip's start and end are added here automatically."
          />
        </Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel>
            <PanelHeader title="By category" />
            <ul className="space-y-4 p-5">
              {byCategory.map(([category, amount]) => (
                <li key={category} className="flex items-center gap-3">
                  <CategoryIcon name={category} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate font-medium text-ink">{category}</span>
                      <span className="num shrink-0 text-ink">{formatCurrency(amount)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-sunken">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${(amount / byCategory[0][1]) * 100}%` }} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <PanelHeader title="Expenses" />
            <div className="mt-3 divide-y divide-line">
              {byDay.map((group) => (
                <section key={group.date} aria-label={formatDayHeading(group.date)}>
                  <div className="flex items-center justify-between bg-white/40 px-5 py-2 text-xs font-medium text-ink-3">
                    <span>{formatDayHeading(group.date)}</span>
                    <span className="num">{formatCurrency(group.total)}</span>
                  </div>
                  <ul className="divide-y divide-line">
                    {group.items.map((expense) => (
                      <li key={expense.id} className="group flex items-center gap-3 px-5 py-3">
                        <CategoryIcon name={expense.category} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{expense.description || expense.category}</p>
                          {expense.description ? <p className="truncate text-xs text-ink-3">{expense.category}</p> : null}
                        </div>
                        <Money amount={Number(expense.amount)} className="text-sm font-medium text-ink" />
                        <div className="flex sm:opacity-0 sm:transition-opacity sm:focus-within:opacity-100 sm:group-hover:opacity-100">
                          <IconButton label="Edit expense" onClick={() => setEditingExpense(expense)}>
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
          </Panel>
        </div>
      )}

      <TripForm open={editingTrip} trip={trip} onClose={() => setEditingTrip(false)} onSubmit={handleTripSave} />
      <ConfirmDialog
        open={deletingTrip}
        title={`Delete ${trip.name}?`}
        description="The trip goes away, but its expenses stay in your spending."
        confirmLabel="Delete trip"
        onConfirm={handleTripDelete}
        onClose={() => setDeletingTrip(false)}
      />
      <ExpenseForm
        open={editingExpense !== null}
        expense={editingExpense}
        categories={categories}
        trips={allTrips}
        onClose={() => setEditingExpense(null)}
        onSubmit={handleExpenseSave}
      />
      <ConfirmDialog
        open={toDelete !== null}
        title="Delete this expense?"
        description={toDelete ? `${toDelete.description || toDelete.category}, ${formatCurrency(Number(toDelete.amount))}.` : ''}
        confirmLabel="Delete expense"
        onConfirm={handleExpenseDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
};

export default TripDetail;
