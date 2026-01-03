export interface User {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
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
  date: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export interface ExpenseCreate {
  amount: number;
  category: string;
  date: string;
  description?: string;
}

export interface ExpenseUpdate {
  amount?: number;
  category?: string;
  date?: string;
  description?: string;
}

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
  budget_monthly?: number | null;
  is_custom: boolean;
  created_at: string;
}

export interface CategoryCreate {
  name: string;
  icon: string;
  color: string;
  budget_monthly?: number | null;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  item_name: string;
  price: number;
  url?: string;
  image_url?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface WishlistCreate {
  item_name: string;
  price: number;
  url?: string;
  image_url?: string;
  notes?: string;
}

export interface WishlistUpdate {
  item_name?: string;
  price?: number;
  url?: string;
  image_url?: string;
  notes?: string;
}

export interface WishlistTotal {
  total: number;
  count: number;
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
  wishlist_total: number;
  wishlist_count: number;
}

export interface CategoryBudget {
  id: string;
  user_id: string;
  category_id: string;
  month: string;
  amount: number | null;
  created_at: string;
  updated_at?: string;
}

export interface CategoryBudgetUpsert {
  category_id: string;
  month: string;
  amount: number | null;
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
