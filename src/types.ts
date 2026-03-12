export enum Language {
  ZH = 'ZH',
  EN = 'EN',
}

export enum Category {
  // Expense
  FOOD = 'FOOD',
  TRANSPORT = 'TRANSPORT',
  SHOPPING = 'SHOPPING',
  ENTERTAINMENT = 'ENTERTAINMENT',
  HEALTH = 'HEALTH',
  HOUSING = 'HOUSING',
  EDUCATION = 'EDUCATION',
  OTHER_EXPENSE = 'OTHER_EXPENSE',
  
  // Income
  SALARY = 'SALARY',
  BONUS = 'BONUS',
  INVESTMENT = 'INVESTMENT',
  GIFT = 'GIFT',
  OTHER_INCOME = 'OTHER_INCOME',
  
  // Legacy
  OTHER = 'OTHER',
  INCOME = 'INCOME',
}

export enum RecordType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  DIGITAL_PAYMENT = 'DIGITAL_PAYMENT',
}

export interface BasicRecord {
  id: string;
  name: string;
  amount: number;
  date: string;
  category: Category;
  type: RecordType;
  paymentMethod: PaymentMethod;
  isPaid?: boolean;
}

export interface GeniePayRecord {
  id: string;
  name: string;
  amount: number;
  date: string;
  category: Category;
  paymentMethod: PaymentMethod;
  isPaid?: boolean;
}

export interface SplitParticipant {
  name: string;
  amount: number;
  paid: number;
}

export interface SplitRecord {
  id: string;
  name: string;
  totalAmount: number;
  date: string;
  participants: SplitParticipant[];
}

export enum RecurringPeriod {
  MONTHLY = 'MONTHLY',
  WEEKLY = 'WEEKLY',
}

export interface RecurringPayment {
  id: string;
  name: string;
  amount: number;
  period: RecurringPeriod;
  category: Category;
  target: 'BASIC' | 'GENIE';
  billingDay: number; // 1-31
  lastProcessed?: string; // Date string (YYYY-MM)
}

export interface AppSettings {
  language: Language;
  genieBillingDay: number;
  initialBalance: number;
  dailyBudget: number;
}

export type Tab = 'DASHBOARD' | 'GENIE' | 'ADD' | 'SPLIT' | 'STATS';
