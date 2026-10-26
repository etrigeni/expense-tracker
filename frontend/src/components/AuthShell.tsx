import React from 'react';
import { Wordmark } from './Layout';

const AuthShell: React.FC<{ title: string; subtitle: string; footer: React.ReactNode; children: React.ReactNode }> = ({
  title,
  subtitle,
  footer,
  children,
}) => (
  <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
    <div className="w-full max-w-sm">
      <div className="mb-10">
        <Wordmark />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      <p className="mt-1 text-sm text-ink-3">{subtitle}</p>
      <div className="mt-8">{children}</div>
      <p className="mt-8 text-sm text-ink-3">{footer}</p>
    </div>
  </div>
);

export default AuthShell;
