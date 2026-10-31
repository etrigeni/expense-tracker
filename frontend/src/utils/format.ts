const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'EUR',
});

export const formatCurrency = (amount: number): string => currencyFormatter.format(amount);

/** Splits a formatted amount into the whole part ("€1,234") and the fraction (".50"). */
export const splitCurrency = (amount: number): { whole: string; fraction: string } => {
  const parts = currencyFormatter.formatToParts(amount);
  const fractionStart = parts.findIndex((part) => part.type === 'decimal');
  if (fractionStart === -1) {
    return { whole: parts.map((part) => part.value).join(''), fraction: '' };
  }
  return {
    whole: parts.slice(0, fractionStart).map((part) => part.value).join(''),
    fraction: parts.slice(fractionStart).map((part) => part.value).join(''),
  };
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDayHeading = (date: string): string => {
  return new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

export const formatDateInput = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

export const todayInput = (): string => formatDateInput(new Date());

export const shiftMonthKey = (month: string, delta: number): string => {
  const [year, monthIndex] = month.split('-').map(Number);
  return formatDateInput(new Date(year, monthIndex - 1 + delta, 1)).slice(0, 7);
};

export const monthKeyToDate = (month: string): string => `${month}-01`;

export const formatMonthLabel = (month: string, style: 'long' | 'short' = 'long'): string => {
  const [year, monthIndex] = month.split('-').map(Number);
  return new Date(year, monthIndex - 1, 1).toLocaleString('en-GB', {
    month: style,
    year: style === 'long' ? 'numeric' : '2-digit',
  });
};

/** "30 Oct to 29 Nov" */
export const formatPeriodRange = (start: string, end: string): string => {
  const short = (value: string) => new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${short(start)} to ${short(end)}`;
};

/** The trip (if any) whose dates include `date` (YYYY-MM-DD). */
export const tripOn = <T extends { start_date: string; end_date: string }>(trips: T[], date: string): T | undefined =>
  trips.find((trip) => trip.start_date <= date && date <= trip.end_date);
