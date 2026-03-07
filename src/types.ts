export enum Language {
  ZH = 'ZH',
  EN = 'EN',
}

export enum Category {
  FOOD = 'FOOD',
  TRANSPORT = 'TRANSPORT',
  SHOPPING = 'SHOPPING',
  ENTERTAINMENT = 'ENTERTAINMENT',
  HEALTH = 'HEALTH',
  OTHER = 'OTHER',
  INCOME = 'INCOME',
}

export enum RecordType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME',
}

export interface BasicRecord {
  id: string;
  name: string;
  amount: number;
  date: string;
  category: Category;
  type: RecordType;
}

export interface GeniePayRecord {
  id: string;
  name: string;
  amount: number;
  date: string;
  category: Category;
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
  lastProcessed?: string; // Date string
}

export interface AppSettings {
  language: Language;
  genieBillingDay: number;
  monthlyBudget: number;
  dailyBudget: number;
}

export type Tab = 'DASHBOARD' | 'GENIE' | 'ADD' | 'SPLIT' | 'STATS';
