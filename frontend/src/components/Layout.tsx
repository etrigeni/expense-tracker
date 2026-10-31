import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { KeyRound, LayoutDashboard, LogOut, Plus, Receipt } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { QuickAddProvider, useQuickAdd } from './QuickAdd';
import ChangePasswordDialog from './ChangePasswordDialog';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { path: '/expenses', icon: Receipt, label: 'Expenses' },
];

export const Wordmark: React.FC = () => (
  <span className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-ink">
    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-xs font-bold text-accent-on" aria-hidden="true">
      €
    </span>
    Budget Tracker
  </span>
);

const HeaderAddButton: React.FC = () => {
  const openQuickAdd = useQuickAdd();
  return (
    <button
      type="button"
      onClick={() => openQuickAdd()}
      className="hidden h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-medium text-accent-on shadow-sm transition-colors hover:bg-accent/90 md:inline-flex"
    >
      <Plus className="h-4 w-4" strokeWidth={2.5} />
      Add expense
    </button>
  );
};

// Must sit outside the header: its backdrop-filter would become the containing block for `fixed`.
const FloatingAddButton: React.FC = () => {
  const openQuickAdd = useQuickAdd();
  return (
    <button
      type="button"
      onClick={() => openQuickAdd()}
      aria-label="Add expense"
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-on shadow-lg shadow-accent/40 transition-transform active:scale-95 md:hidden"
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} />
    </button>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [passwordOpen, setPasswordOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <QuickAddProvider>
      <div className="min-h-screen">
        <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-8 px-4 sm:px-6">
            <Wordmark />
            <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      isActive ? 'bg-accent-soft text-ink' : 'text-ink-3 hover:bg-sunken hover:text-ink'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <HeaderAddButton />
              <button
                type="button"
                onClick={() => setPasswordOpen(true)}
                aria-label="Change password"
                title="Change password"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
              >
                <KeyRound className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Log out"
                title="Log out"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <ChangePasswordDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} />

        <FloatingAddButton />

        <main className="mx-auto max-w-6xl px-4 pb-32 pt-6 sm:px-6 md:pb-12 md:pt-8">{children}</main>

        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
          aria-label="Main"
        >
          <div className="flex">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium ${
                    isActive ? 'text-accent-ink' : 'text-ink-3'
                  }`
                }
              >
                <item.icon className="h-5 w-5" strokeWidth={1.75} />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </QuickAddProvider>
  );
};

export default Layout;
