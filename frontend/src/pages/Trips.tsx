import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Plane, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { tripService } from '@/services/tripService';
import type { Trip, TripCreate } from '@/types';
import { formatPeriodRange, todayInput } from '@/utils/format';
import { Button, EmptyState, Money, PageHeader, Panel, Spinner } from '@/components/ui';
import TripForm from '@/components/TripForm';
import { useExpensesChanged } from '@/components/QuickAdd';

export const tripStatus = (trip: Trip): 'now' | 'upcoming' | 'past' => {
  const today = todayInput();
  if (trip.start_date > today) return 'upcoming';
  return trip.end_date < today ? 'past' : 'now';
};

const statusLabel = { now: 'On now', upcoming: 'Upcoming', past: '' };

const Trips: React.FC = () => {
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const load = async () => {
    try {
      setTrips(await tripService.getTrips());
    } catch (error) {
      toast.error('Could not load trips.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  useExpensesChanged(load);

  const handleCreate = async (data: TripCreate) => {
    try {
      await tripService.createTrip(data);
      setFormOpen(false);
      toast.success('Trip created.');
      await load();
    } catch (error: any) {
      toast.error(error.response?.data?.detail?.[0]?.msg || 'Could not create the trip.');
    }
  };

  if (trips === null) {
    return <Spinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Trips">
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          New trip
        </Button>
      </PageHeader>

      {trips.length === 0 ? (
        <Panel>
          <EmptyState
            title="No trips yet"
            description="Create a trip before you go. Everything you spend during it is collected in one place."
            action={
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" />
                New trip
              </Button>
            }
          />
        </Panel>
      ) : (
        <Panel as="div">
          <ul className="divide-y divide-line">
            {trips.map((trip) => {
              const status = tripStatus(trip);
              return (
                <li key={trip.id}>
                  <Link
                    to={`/trips/${trip.id}`}
                    className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-white/40 sm:px-5"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-[#dde3d5] text-[#6c7563]">
                      <Plane className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-ink">{trip.name}</span>
                        {statusLabel[status] ? (
                          <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-ink">
                            {statusLabel[status]}
                          </span>
                        ) : null}
                      </span>
                      <span className="block truncate text-xs text-ink-3">
                        {formatPeriodRange(trip.start_date, trip.end_date)} {trip.start_date.slice(0, 4)},{' '}
                        {trip.expense_count} {trip.expense_count === 1 ? 'expense' : 'expenses'}
                      </span>
                    </span>
                    <Money amount={Number(trip.total)} className="text-sm font-medium text-ink" />
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink-3" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      <TripForm open={formOpen} trip={null} onClose={() => setFormOpen(false)} onSubmit={handleCreate} />
    </div>
  );
};

export default Trips;
