export type TransactionType = 'expense' | 'income';

export interface User {
  id: string;
  nickname: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  streakDays: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  category?: Category;
  occurredAt: string;
  remark?: string;
  tags: string[];
  voucherUrl?: string;
}

export interface DashboardSummary {
  todayExpense: number;
  monthExpense: number;
  monthIncome: number;
  monthlyBudget: number;
  streakDays: number;
  recentTransactions: Transaction[];
}

export interface StatSummary {
  month: string;
  totalExpense: number;
  totalIncome: number;
  categoryRatio: Array<{ category: string; amount: number; percent: number; color: string }>;
  trend: Array<{ date: string; expense: number; income: number }>;
  expenseRank: Array<{ category: string; amount: number }>;
}

export interface AiParsedTransaction {
  type: TransactionType;
  amount: number;
  category: string;
  categoryId: string;
  remark: string;
  occurredAt: string;
  tags: string[];
}

export interface AiReport {
  id: string;
  type: 'daily' | 'monthly';
  period: string;
  content: DailyReportContent | MonthlyReportContent;
  summary: string;
  createdAt: string;
}

export interface DailyReportContent {
  totalExpense: number;
  totalIncome: number;
  categoryRank: Array<{ category: string; amount: number; percent: number }>;
  anomalies: string[];
  suggestions: string[];
  summary: string;
}

export interface MonthlyReportContent {
  totalExpense: number;
  totalIncome: number;
  savingRate: number;
  categoryRank: Array<{ category: string; amount: number; percent: number }>;
  trends: string[];
  highFrequency: Array<{ item: string; count: number; total: number }>;
  anomalies: string[];
  savingAnalysis: string;
  persona: string;
  summary: string;
}

export interface AiInsight {
  text: string;
  type: 'tip' | 'warning' | 'praise' | 'info';
}

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatResponse {
  reply: string;
  suggestions: string[];
}

export interface UserProfile {
  persona: string;
  traits: any;
  lastAnalyzedAt: string | null;
}

export interface BudgetItem {
  id: string;
  categoryId: string | null;
  category: Category | null;
  period: 'weekly' | 'monthly';
  month: string;
  amount: number;
  spent: number;
  remaining: number;
  percent: number;
  isOverspent: boolean;
}

export interface BudgetOverview {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  totalPercent: number;
  categoryBudgets: BudgetItem[];
  overspentCategories: BudgetItem[];
  isOverspent: boolean;
}

export interface SavingGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  remaining: number;
  percent: number;
  deadline: string | null;
  daysLeft: number | null;
  icon: string;
  color: string;
  completed: boolean;
  completedAt: string | null;
}

export interface WealthTrendItem {
  month: string;
  income: number;
  expense: number;
  surplus: number;
  surplusRate: number;
  wealthScore: number;
}

export interface WealthGoal {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetAmount: number;
  currentAmount: number;
  remaining: number;
  percent: number;
  allocPercent: number;
  priority: number;
  deadline: string | null;
  daysLeft: number | null;
  predictDate: string | null;
  monthsLeft: number | null;
  completed: boolean;
  completedAt: string | null;
  monthlyContributions: Array<{ month: string; allocated: number; cumulative: number; percent: number }>;
}

export interface WealthOverview {
  month: string;
  monthIncome: number;
  monthExpense: number;
  monthSurplus: number;
  surplusRate: number;
  wealthScore: number;
  scoreChange: number;
  statusText: string;
  trend: WealthTrendItem[];
  goals: WealthGoal[];
}

export interface WealthAdvice {
  summary: string;
  suggestions: string[];
  encouragement: string;
}

// ===== 会员系统 =====

export type MemberLevel = 'free' | 'pro' | 'premium';

export interface MembershipStatus {
  level: MemberLevel;
  expireAt: string | null;
  autoRenew: boolean;
  isExpired: boolean;
  isPro: boolean;
  isPremium: boolean;
}

export interface Order {
  id: string;
  type: 'subscription' | 'one_time';
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  wxPayOrderId?: string;
  description?: string;
  paidAt?: string;
  createdAt: string;
}

// ===== 共享账本 =====

export type BookType = 'daily' | 'love' | 'family' | 'work' | 'travel' | 'campus' | 'couple';
export type BookRole = 'owner' | 'admin' | 'member';

export interface LifeSpace {
  id: string;
  userId: string;
  type: BookType;
  name: string;
  icon: string;
  cover?: string;
  color: string;
  description: string;
  aiIntro: string;
  sort: number;
  isVisible: boolean;
  createdAt: string;
}

export interface SharedBook {
  id: string;
  name: string;
  type: BookType;
  inviteCode: string;
  createdBy: string;
  myRole: BookRole;
  memberCount: number;
  members?: BookMember[];
}

export interface BookMember {
  id: string;
  userId: string;
  role: BookRole;
  joinedAt: string;
  user: { id: string; nickname: string; avatarUrl?: string };
}

export interface AAStats {
  members: Array<{
    userId: string;
    nickname: string;
    totalExpense: number;
    fairShare: number;
    diff: number;
  }>;
  grandTotal: number;
  perPerson: number;
}

// ===== 成长体系 =====

export interface Badge {
  id: string;
  key: string;
  name: string;
  icon: string;
  description: string;
  earned: boolean;
  earnedAt: string | null;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'streak' | 'saving' | 'budget';
  targetValue: number;
  duration: number;
  icon: string;
  joined: boolean;
  progress: number;
  completed: boolean;
  completedAt: string | null;
  startedAt: string | null;
}

// ===== 发现页 =====

export interface Article {
  id: string;
  title: string;
  summary: string;
  content?: string;
  coverUrl?: string;
  category: 'tip' | 'knowledge' | 'challenge';
  createdAt: string;
}
