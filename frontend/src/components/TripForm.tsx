import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { Trip, TripCreate } from '@/types';
import { todayInput } from '@/utils/format';
import { Button, Field, Input, Modal, ModalActions } from './ui';

/** Create or edit a trip. `trip` null means a new one. */
const TripForm: React.FC<{
  open: boolean;
  trip: Trip | null;
  onClose: () => void;
  onSubmit: (data: TripCreate) => Promise<void>;
}> = ({ open, trip, onClose, onSubmit }) => {
  const [form, setForm] = useState<TripCreate>({ name: '', start_date: '', end_date: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      trip
        ? { name: trip.name, start_date: trip.start_date, end_date: trip.end_date }
        : { name: '', start_date: todayInput(), end_date: todayInput() }
    );
  }, [open, trip]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error('Give the trip a name.');
      return;
    }
    if (form.end_date < form.start_date) {
      toast.error("The trip can't end before it starts.");
      return;
    }
    try {
      setSaving(true);
      await onSubmit({ ...form, name: form.name.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={trip ? 'Edit trip' : 'New trip'}
      description="Expenses dated during the trip are added to it automatically."
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Where to?">
          <Input
            placeholder="Rome"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From">
            <Input
              type="date"
              value={form.start_date}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  start_date: event.target.value,
                  end_date: prev.end_date < event.target.value ? event.target.value : prev.end_date,
                }))
              }
            />
          </Field>
          <Field label="To">
            <Input
              type="date"
              min={form.start_date}
              value={form.end_date}
              onChange={(event) => setForm((prev) => ({ ...prev, end_date: event.target.value }))}
            />
          </Field>
        </div>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {trip ? 'Save trip' : 'Create trip'}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
};

export default TripForm;
