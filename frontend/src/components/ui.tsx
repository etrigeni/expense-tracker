import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { splitCurrency } from '@/utils/format';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-on hover:bg-accent/90',
  secondary: 'border border-line bg-surface text-ink hover:bg-sunken',
  ghost: 'text-ink-2 hover:bg-sunken hover:text-ink',
  danger: 'bg-danger text-white hover:bg-danger/90',
};

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: 'sm' | 'md' }
> = ({ variant = 'primary', size = 'md', className = '', type = 'button', ...props }) => (
  <button
    type={type}
    className={`inline-flex items-center justify-center gap-2 rounded-control font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
      size === 'sm' ? 'h-8 px-3 text-sm' : 'h-10 px-4 text-sm'
    } ${buttonStyles[variant]} ${className}`}
    {...props}
  />
);

export const IconButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: 'default' | 'danger' }
> = ({ label, tone = 'default', className = '', children, ...props }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={`inline-flex h-10 w-10 items-center justify-center rounded-control text-ink-3 sm:h-8 sm:w-8 transition-colors hover:bg-sunken ${
      tone === 'danger' ? 'hover:text-danger' : 'hover:text-ink'
    } ${className}`}
    {...props}
  >
    {children}
  </button>
);

const controlClass =
  'h-10 w-full rounded-control border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-3 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => <input ref={ref} className={`${controlClass} ${className}`} {...props} />
);
Input.displayName = 'Input';

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', ...props }) => (
  <select className={`${controlClass} pr-8 ${className}`} {...props} />
);

/** Label + control + optional hint. The control is passed as children and gets the generated id. */
export const Field: React.FC<{
  label: string;
  hint?: string;
  children: React.ReactElement;
  className?: string;
}> = ({ label, hint, children, className = '' }) => {
  const id = useId();
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-ink-2">
        {label}
      </label>
      {React.cloneElement(children, { id })}
      {hint ? <p className="text-xs text-ink-3">{hint}</p> : null}
    </div>
  );
};

export const Panel: React.FC<React.HTMLAttributes<HTMLElement> & { as?: 'section' | 'div' }> = ({
  as: Tag = 'section',
  className = '',
  ...props
}) => <Tag className={`rounded-panel border border-line bg-panel ${className}`} {...props} />;

export const PanelHeader: React.FC<{ title: string; action?: React.ReactNode; description?: string }> = ({
  title,
  action,
  description,
}) => (
  <div className="flex items-start justify-between gap-4 px-5 pt-5">
    <div>
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {description ? <p className="mt-0.5 text-sm text-ink-3">{description}</p> : null}
    </div>
    {action}
  </div>
);

/** Currency with the cents styled apart (pass `fractionClassName`), so large amounts read whole euros first. */
export const Money: React.FC<{ amount: number; className?: string; fractionClassName?: string }> = ({
  amount,
  className = '',
  fractionClassName = '',
}) => {
  const { whole, fraction } = splitCurrency(amount);
  return (
    <span className={`num ${className}`}>
      {whole}
      <span className={fractionClassName}>{fraction}</span>
    </span>
  );
};

export const EmptyState: React.FC<{ title: string; description?: string; action?: React.ReactNode }> = ({
  title,
  description,
  action,
}) => (
  <div className="flex flex-col items-center px-6 py-12 text-center">
    <p className="text-sm font-medium text-ink">{title}</p>
    {description ? <p className="mt-1 max-w-sm text-sm text-ink-3">{description}</p> : null}
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
);

export const Spinner: React.FC = () => (
  <div className="flex h-64 items-center justify-center" role="status" aria-label="Loading">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" />
  </div>
);

export const PageHeader: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
    {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
  </div>
);

/**
 * Dialog: closes on Escape and backdrop click, locks page scroll, focuses the first field.
 * Slides up as a sheet on small screens.
 */
export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}> = ({ open, onClose, title, description, size = 'md', children }) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  // Callers pass inline handlers; a ref keeps the effect from re-running (and refocusing) every render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const previouslyFocused = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>('input, select, textarea, [data-autofocus]');
      (first ?? dialogRef.current)?.focus();
    });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  const width = size === 'sm' ? 'sm:max-w-sm' : size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-md';

  // Portal to <body> so page spacing utilities (space-y-*) never offset the fixed backdrop.
  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className={`max-h-[90vh] w-full overflow-y-auto rounded-t-panel border border-line bg-surface p-5 shadow-xl outline-none sm:rounded-panel sm:p-6 ${width}`}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="text-lg font-semibold text-ink">
                  {title}
                </h2>
                {description ? <p className="mt-1 text-sm text-ink-3">{description}</p> : null}
              </div>
              <IconButton label="Close" onClick={onClose} className="-mr-1 -mt-1">
                <X className="h-4 w-4" />
              </IconButton>
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
};

export const ModalActions: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{children}</div>
);

export const ConfirmDialog: React.FC<{
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}> = ({ open, title, description, confirmLabel, onConfirm, onClose }) => (
  <Modal open={open} onClose={onClose} title={title} description={description} size="sm">
    <ModalActions>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="danger" onClick={onConfirm} data-autofocus>
        {confirmLabel}
      </Button>
    </ModalActions>
  </Modal>
);
