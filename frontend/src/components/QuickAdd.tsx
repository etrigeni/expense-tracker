import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { categoryService } from '@/services/categoryService';
import { expenseService } from '@/services/expenseService';
import type { Category, ExpenseCreate } from '@/types';
import ExpenseForm from './ExpenseForm';

const EXPENSES_CHANGED = 'expenses:changed';

/** Tell every page that shows expenses to reload. */
export const notifyExpensesChanged = () => window.dispatchEvent(new Event(EXPENSES_CHANGED));

export const useExpensesChanged = (onChange: () => void) => {
  const handler = useRef(onChange);
  handler.current = onChange;
  useEffect(() => {
    const listener = () => handler.current();
    window.addEventListener(EXPENSES_CHANGED, listener);
    return () => window.removeEventListener(EXPENSES_CHANGED, listener);
  }, []);
};

type OpenQuickAdd = (defaultCategory?: string, options?: { recurring?: boolean }) => void;

const QuickAddContext = createContext<OpenQuickAdd>(() => undefined);

export const useQuickAdd = () => useContext(QuickAddContext);

/** Owns the "Add expense" dialog so any page (and the floating button) can open it. */
export const QuickAddProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState('');
  const [defaultRecurring, setDefaultRecurring] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const openQuickAdd = useCallback<OpenQuickAdd>((category = '', options) => {
    setDefaultCategory(category);
    setDefaultRecurring(options?.recurring ?? false);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open || categories.length > 0) return;
    categoryService
      .getCategories()
      .then(setCategories)
      .catch(() => toast.error('Could not load categories.'));
  }, [open, categories.length]);

  const handleSubmit = async (payload: ExpenseCreate) => {
    try {
      await expenseService.createExpense(payload);
      setOpen(false);
      notifyExpensesChanged();
      toast.success('Expense added.');
    } catch (error) {
      toast.error('Could not add the expense.');
    }
  };

  return (
    <QuickAddContext.Provider value={openQuickAdd}>
      {children}
      <ExpenseForm
        open={open}
        expense={null}
        categories={categories}
        defaultCategory={defaultCategory}
        defaultRecurring={defaultRecurring}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
      />
    </QuickAddContext.Provider>
  );
};
