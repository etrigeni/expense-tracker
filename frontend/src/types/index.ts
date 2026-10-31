export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  /** In a month listing, the date this expense falls on in that month. */
  date: string;
  description?: string;
  is_recurring: boolean;
  /** Last day a recurring expense applies; null while it keeps repeating. */
  recurring_until?: string | null;
  /** First occurrence of a recurring expense (set in month listings). */
  start_date?: string | null;
  /** Recurring expenses in a month listing: ticked as paid for that month. */
  paid?: boolean | null;
  trip_id?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ExpenseCreate {
  amount: number;
  category: string;
  date: string;
  description?: string;
  is_recurring?: boolean;
  recurring_until?: string | null;
  trip_id?: string | null;
}

export type ExpenseUpdate = Partial<ExpenseCreate>;

export interface ExpenseStats {
  total: number;
  by_category: Record<string, number>;
  count: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_custom: boolean;
  created_at: string;
}

export interface CategoryCreate {
  name: string;
  icon: string;
  color: string;
}

export interface CategorySummary {
  category: string;
  total: number;
  percentage: number;
}

export interface MonthlyCategorySpend {
  month: string;
  category: string;
  total: number;
}

export interface MonthlyAmount {
  month: string;
  total: number;
}

export interface Income {
  id: string;
  user_id: string;
  source: string;
  amount: number;
  date: string;
  is_recurring: boolean;
  frequency?: string | null;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface IncomeCreate {
  source: string;
  amount: number;
  date: string;
  is_recurring: boolean;
  frequency?: string | null;
  notes?: string;
}

export interface IncomeUpdate {
  source?: string;
  amount?: number;
  date?: string;
  is_recurring?: boolean;
  frequency?: string | null;
  notes?: string;
}

export interface IncomeTotal {
  total: number;
  count: number;
}

export interface DashboardOverview {
  /** Current pay period: label month (first day) and its first and last day */
  period_month: string;
  period_start: string;
  period_end: string;
  total_expenses_month: number;
  income_total_month: number;
  net_balance_month: number;
  expenses_mom_percentage?: number | null;
  income_mom_percentage?: number | null;
  expenses_by_category: CategorySummary[];
  monthly_category_spend: MonthlyCategorySpend[];
  monthly_income: MonthlyAmount[];
  monthly_savings: MonthlyAmount[];
  recent_transactions: Expense[];
}

export interface Savings {
  id: string;
  user_id: string;
  month: string;
  amount: number | null;
  created_at: string;
  updated_at?: string;
}

export interface SavingsUpsert {
  month: string;
  amount: number | null;
}

/** A pay period: from the last working day of one month to the day before the next payday,
 * named after the month that follows the payday. */
export interface PayPeriod {
  month: string;
  start: string;
  end: string;
}

export interface Trip {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  total: number;
  expense_count: number;
  created_at: string;
}

export interface TripCreate {
  name: string;
  start_date: string;
  end_date: string;
}
