import React from 'react';
import { Wordmark } from './Layout';

const AuthShell: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
    <div className="w-full max-w-sm">
      <div className="mb-10">
        <Wordmark />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      <p className="mt-1 text-sm text-ink-3">{subtitle}</p>
      <div className="mt-8">{children}</div>
    </div>
  </div>
);

export default AuthShell;
