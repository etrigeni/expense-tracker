import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { authService } from '@/services/authService';
import { Button, Field, Input, Modal, ModalActions } from './ui';

const ChangePasswordDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCurrent('');
      setNext('');
      setRepeat('');
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (next.length < 8) {
      toast.error('The new password needs at least 8 characters.');
      return;
    }
    if (next !== repeat) {
      toast.error('The new passwords do not match.');
      return;
    }
    try {
      setSaving(true);
      await authService.changePassword(current, next);
      toast.success('Password changed.');
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Could not change the password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Change password" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Current password">
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
          />
        </Field>
        <Field label="New password" hint="At least 8 characters">
          <Input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={next}
            onChange={(event) => setNext(event.target.value)}
          />
        </Field>
        <Field label="Repeat new password">
          <Input
            type="password"
            autoComplete="new-password"
            required
            value={repeat}
            onChange={(event) => setRepeat(event.target.value)}
          />
        </Field>
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            Change password
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
};

export default ChangePasswordDialog;
