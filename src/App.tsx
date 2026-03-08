/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  PlusCircle, 
  Users, 
  Search, 
  Settings as SettingsIcon,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Edit3,
  X,
  Download,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  PieChart as PieChartIcon,
  FileDown,
  Wallet,
  TrendingUp,
  Zap,
  Target,
  Sparkles,
  Coins,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  Legend 
} from 'recharts';
import { 
  Language, 
  Category, 
  RecordType, 
  BasicRecord, 
  GeniePayRecord, 
  SplitRecord, 
  RecurringPayment, 
  AppSettings, 
  Tab,
  RecurringPeriod
} from './types';
import { translations } from './translations';

// --- Helpers ---
const generateId = () => Math.random().toString(36).substr(2, 9);
const formatCurrency = (amount: number) => new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(amount);
const getToday = () => new Date().toISOString().split('T')[0];

const RecordItem: React.FC<{ record: any, onClick: () => void, t: any }> = ({ record, onClick, t }) => (
  <motion.div 
    whileHover={{ scale: 1.01, backgroundColor: '#f8fafc' }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-slate-100 cursor-pointer transition-colors"
  >
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${'type' in record && record.type === RecordType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
        <FileText size={20} />
      </div>
      <div>
        <p className="font-bold text-slate-800 text-sm">{record.name}</p>
        <p className="text-slate-400 text-[10px]">{record.date} • {t.categories[record.category]}</p>
      </div>
    </div>
    <p className={`font-bold ${'type' in record && record.type === RecordType.INCOME ? 'text-emerald-600' : 'text-slate-800'}`}>
      {'type' in record && record.type === RecordType.INCOME ? '+' : '-'}{formatCurrency(record.amount)}
    </p>
  </motion.div>
);

const FloatingIcon = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <motion.div
    animate={{
      y: [0, -10, 0],
      rotate: [0, 5, 0]
    }}
    transition={{
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    className={className}
  >
    {children}
  </motion.div>
);

const NavItem = ({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-16 transition-all active:scale-95 relative ${active ? 'text-blue-600' : 'text-slate-400'}`}
  >
    {active && (
      <motion.div 
        layoutId="nav-glow"
        className="absolute -top-1 w-1 h-1 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.8)]"
      />
    )}
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'scale-100'}`}>
      {icon}
    </div>
    <span className="text-[10px] mt-1 font-medium">{label}</span>
  </button>
);

const Header = ({ t, setIsSettingsOpen }: { t: any, setIsSettingsOpen: (open: boolean) => void }) => (
  <header className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 z-40">
    <h1 className="text-xl font-bold text-slate-800">{t.appName}</h1>
    <button 
      onClick={() => setIsSettingsOpen(true)}
      className="p-2 rounded-full hover:bg-slate-100 active:scale-95 transition-all"
    >
      <SettingsIcon size={24} className="text-slate-600" />
    </button>
  </header>
);

const BottomNav = ({ activeTab, setActiveTab, t }: { activeTab: Tab, setActiveTab: (tab: Tab) => void, t: any }) => (
  <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-20 flex items-center justify-around px-2 pb-safe z-40">
    <NavItem icon={<LayoutDashboard size={24} />} label={t.dashboard} active={activeTab === 'DASHBOARD'} onClick={() => setActiveTab('DASHBOARD')} />
    <NavItem icon={<CreditCard size={24} />} label={t.geniePay} active={activeTab === 'GENIE'} onClick={() => setActiveTab('GENIE')} />
    <button 
      onClick={() => setActiveTab('ADD')}
      className={`flex flex-col items-center justify-center -mt-10 w-16 h-16 rounded-full shadow-lg transition-all active:scale-90 ${activeTab === 'ADD' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-2 border-blue-600'}`}
    >
      <PlusCircle size={32} />
    </button>
    <NavItem icon={<Users size={24} />} label={t.split} active={activeTab === 'SPLIT'} onClick={() => setActiveTab('SPLIT')} />
    <NavItem icon={<PieChartIcon size={24} />} label={t.search} active={activeTab === 'STATS'} onClick={() => setActiveTab('STATS')} />
  </nav>
);

const SettingsModal = ({ 
  isSettingsOpen, 
  setIsSettingsOpen, 
  t, 
  settings, 
  setSettings, 
  recurringPayments, 
  setRecurringPayments, 
  setConfirmData, 
  isAddingRecurring, 
  setIsAddingRecurring, 
  newRecurring, 
  setNewRecurring, 
  exportData, 
  importData 
}: { 
  isSettingsOpen: boolean, 
  setIsSettingsOpen: (open: boolean) => void, 
  t: any, 
  settings: AppSettings, 
  setSettings: (s: AppSettings) => void, 
  recurringPayments: RecurringPayment[], 
  setRecurringPayments: React.Dispatch<React.SetStateAction<RecurringPayment[]>>, 
  setConfirmData: (d: any) => void, 
  isAddingRecurring: boolean, 
  setIsAddingRecurring: (a: boolean) => void, 
  newRecurring: any, 
  setNewRecurring: (r: any) => void, 
  exportData: () => void, 
  importData: (e: any) => void 
}) => (
  <AnimatePresence>
    {isSettingsOpen && (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
        onClick={() => setIsSettingsOpen(false)}
      >
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 space-y-8 shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">{t.settings}</h2>
            <button onClick={() => setIsSettingsOpen(false)} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.language}</label>
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button 
                  onClick={() => setSettings({ ...settings, language: Language.ZH })}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${settings.language === Language.ZH ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                >
                  繁體中文
                </button>
                <button 
                  onClick={() => setSettings({ ...settings, language: Language.EN })}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${settings.language === Language.EN ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                >
                  English
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.initialBalance}</label>
              <input 
                type="number" 
                value={settings.initialBalance}
                onChange={e => setSettings({ ...settings, initialBalance: Number(e.target.value) })}
                className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.dailyBudget}</label>
              <input 
                type="number" 
                value={settings.dailyBudget}
                onChange={e => setSettings({ ...settings, dailyBudget: Number(e.target.value) })}
                className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.billingDay}</label>
              <input 
                type="number" 
                min="1" max="31"
                value={settings.genieBillingDay}
                onChange={e => setSettings({ ...settings, genieBillingDay: Number(e.target.value) })}
                className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.recurring}</label>
              <div className="space-y-2">
                {recurringPayments.map(rp => (
                  <div key={rp.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl">
                    <div>
                      <p className="font-bold text-slate-700 text-sm">{rp.name}</p>
                      <p className="text-slate-400 text-[10px]">
                        {formatCurrency(rp.amount)} • {rp.period === RecurringPeriod.MONTHLY ? `${t.monthly} (${rp.billingDay}${t.daySuffix})` : t.weekly}
                      </p>
                    </div>
                    <button 
                      onClick={() => setConfirmData({
                        title: t.confirmDelete,
                        onConfirm: () => {
                          setRecurringPayments(prev => prev.filter(r => r.id !== rp.id));
                          setConfirmData(null);
                        }
                      })} 
                      className="text-red-400 p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                
                {isAddingRecurring ? (
                  <div className="bg-slate-50 p-4 rounded-2xl space-y-3 border border-blue-100">
                    <input 
                      type="text" 
                      placeholder={t.name}
                      value={newRecurring.name}
                      onChange={e => setNewRecurring({ ...newRecurring, name: e.target.value })}
                      className="w-full bg-white border-none rounded-xl px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        placeholder={t.amount}
                        value={newRecurring.amount}
                        onChange={e => setNewRecurring({ ...newRecurring, amount: e.target.value })}
                        className="flex-1 bg-white border-none rounded-xl px-3 py-2 text-sm"
                      />
                      <select 
                        value={newRecurring.period}
                        onChange={e => setNewRecurring({ ...newRecurring, period: e.target.value as RecurringPeriod })}
                        className="w-24 bg-white border-none rounded-xl px-3 py-2 text-xs"
                      >
                        <option value={RecurringPeriod.MONTHLY}>{t.monthly}</option>
                        <option value={RecurringPeriod.WEEKLY}>{t.weekly}</option>
                      </select>
                      {newRecurring.period === RecurringPeriod.MONTHLY && (
                        <input 
                          type="number" 
                          min="1" max="31"
                          placeholder={t.billingDay}
                          value={newRecurring.billingDay}
                          onChange={e => setNewRecurring({ ...newRecurring, billingDay: Number(e.target.value) })}
                          className="w-20 bg-white border-none rounded-xl px-3 py-2 text-xs"
                        />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setIsAddingRecurring(false)}
                        className="flex-1 py-2 bg-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                      >
                        {t.cancel}
                      </button>
                      <button 
                        onClick={() => {
                          if (newRecurring.name && newRecurring.amount) {
                            setRecurringPayments(prev => [...prev, {
                              id: generateId(),
                              name: newRecurring.name,
                              amount: Number(newRecurring.amount),
                              period: newRecurring.period,
                              category: Category.OTHER,
                              target: newRecurring.target,
                              billingDay: newRecurring.billingDay || 1
                            }]);
                            setIsAddingRecurring(false);
                            setNewRecurring({ name: '', amount: '', period: RecurringPeriod.MONTHLY, target: 'BASIC', billingDay: 1 });
                          }
                        }}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                      >
                        {t.save}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsAddingRecurring(true)}
                    className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-bold hover:bg-slate-50 transition-all"
                  >
                    + Add Recurring
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.backup} & {t.restore}</label>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={exportData}
                  className="flex items-center justify-center gap-2 bg-slate-800 text-white py-3 rounded-2xl text-xs font-bold shadow-md active:scale-95 transition-all"
                >
                  <Download size={16} /> {t.exportJson}
                </button>
                <label className="flex items-center justify-center gap-2 bg-white border-2 border-slate-800 text-slate-800 py-3 rounded-2xl text-xs font-bold cursor-pointer active:scale-95 transition-all">
                  <Upload size={16} /> {t.importJson}
                  <input type="file" accept=".json" onChange={importData} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const DetailModal = ({ 
  selectedRecord, 
  setSelectedRecord, 
  isEditMode, 
  setIsEditMode, 
  t, 
  formatCurrency, 
  handleUpdateRecord, 
  handleDeleteRecord 
}: { 
  selectedRecord: any, 
  setSelectedRecord: (rec: any) => void, 
  isEditMode: boolean, 
  setIsEditMode: (mode: boolean) => void, 
  t: any, 
  formatCurrency: (val: number) => string, 
  handleUpdateRecord: (type: any, id: string, data: any) => void, 
  handleDeleteRecord: (type: any, id: string) => void 
}) => {
  if (!selectedRecord) return null;
  const { type, data } = selectedRecord;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
        onClick={() => { setSelectedRecord(null); setIsEditMode(false); }}
      >
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 space-y-6 shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">{isEditMode ? t.edit : t.name}</h2>
            <button onClick={() => { setSelectedRecord(null); setIsEditMode(false); }} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button>
          </div>

          {isEditMode ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const updated = {
                name: formData.get('name') as string,
                amount: Number(formData.get('amount')),
                date: formData.get('date') as string,
                category: formData.get('category') as Category,
                type: formData.get('type') as RecordType,
              };
              handleUpdateRecord(type, data.id, updated);
            }} className="space-y-4">
              <input name="name" defaultValue={data.name} className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3" required />
              <input name="amount" type="number" defaultValue={data.amount} className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3" required />
              <input name="date" type="date" defaultValue={data.date} className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3" required />
              {type !== 'SPLIT' && (
                <select name="category" defaultValue={data.category} className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3">
                  {Object.entries(Category).map(([k, v]) => <option key={k} value={v}>{t.categories[v]}</option>)}
                </select>
              )}
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg">{t.save}</button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center py-4">
                <p className="text-slate-400 text-sm font-medium">{data.name}</p>
                <h3 className={`text-5xl font-bold mt-2 ${type === 'BASIC' && data.type === RecordType.INCOME ? 'text-emerald-600' : 'text-slate-800'}`}>
                  {formatCurrency(data.amount || data.totalAmount)}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{t.date}</p>
                  <p className="font-bold text-slate-700">{data.date}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{t.category}</p>
                  <p className="font-bold text-slate-700">{data.category ? t.categories[data.category] : 'Split'}</p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setIsEditMode(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-100 text-blue-600 py-4 rounded-2xl font-bold active:scale-95 transition-all"
                >
                  <Edit3 size={18} /> {t.edit}
                </button>
                <button 
                  onClick={() => handleDeleteRecord(type, data.id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-100 text-red-600 py-4 rounded-2xl font-bold active:scale-95 transition-all"
                >
                  <Trash2 size={18} /> {t.delete}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const RepaymentModal = ({ 
  repaymentData, 
  setRepaymentData, 
  t, 
  formatCurrency, 
  handleRepay 
}: { 
  repaymentData: any, 
  setRepaymentData: (data: any) => void, 
  t: any, 
  formatCurrency: (val: number) => string, 
  handleRepay: (id: string, name: string, amount: number, sync: boolean) => void 
}) => {
  const [amount, setAmount] = useState<string>('');
  const [sync, setSync] = useState(true);

  useEffect(() => {
    if (repaymentData) {
      setAmount(repaymentData.remaining.toString());
      setSync(true);
    }
  }, [repaymentData]);

  if (!repaymentData) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
        onClick={() => setRepaymentData(null)}
      >
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 space-y-6 shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">{t.repay}</h2>
            <button onClick={() => setRepaymentData(null)} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button>
          </div>

          <div className="space-y-4">
            <div className="text-center py-2">
              <p className="text-slate-400 text-sm font-medium">{repaymentData.participantName}</p>
              <p className="text-slate-400 text-xs">{t.remainingAmount}: {formatCurrency(repaymentData.remaining)}</p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.amount}</label>
              <input 
                type="number" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 transition-all text-lg font-bold"
                placeholder="0"
                autoFocus
              />
            </div>

            <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer active:scale-[0.99] transition-all">
              <input 
                type="checkbox" 
                checked={sync}
                onChange={e => setSync(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-bold text-slate-700">{t.syncRepayment}</span>
            </label>

            <div className="flex gap-4 pt-2">
              <button 
                onClick={() => setRepaymentData(null)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold active:scale-95 transition-all"
              >
                {t.cancel}
              </button>
              <button 
                onClick={() => {
                  const numAmount = Number(amount);
                  if (numAmount > 0) {
                    handleRepay(repaymentData.splitId, repaymentData.participantName, numAmount, sync);
                    setRepaymentData(null);
                  }
                }}
                className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all"
              >
                {t.save}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const ConfirmModal = ({ confirmData, setConfirmData, t }: { confirmData: any, setConfirmData: (data: any) => void, t: any }) => {
  if (!confirmData) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        onClick={() => setConfirmData(null)}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white w-full max-w-xs rounded-[32px] p-6 space-y-6 shadow-2xl text-center"
          onClick={e => e.stopPropagation()}
        >
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <p className="font-bold text-slate-800">{confirmData.title}</p>
          <div className="flex gap-3">
            <button 
              onClick={() => setConfirmData(null)}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold active:scale-95 transition-all"
            >
              {t.cancel}
            </button>
            <button 
              onClick={confirmData.onConfirm}
              className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold shadow-md active:scale-95 transition-all"
            >
              {t.delete}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const SplitTracker = ({ 
  t, 
  splitRecords, 
  setRepaymentData, 
  setSelectedRecord, 
  formatCurrency 
}: { 
  t: any, 
  splitRecords: SplitRecord[], 
  setRepaymentData: (data: any) => void, 
  setSelectedRecord: (rec: any) => void, 
  formatCurrency: (val: number) => string 
}) => (
  <div className="p-4 space-y-6 pb-24">
    <h2 className="text-2xl font-bold text-slate-800">{t.split}</h2>

    <div className="space-y-4">
      {splitRecords.map((record, i) => {
        const totalPaid = record.participants.reduce((sum, p) => sum + p.paid, 0);
        const isFullyPaid = totalPaid >= record.totalAmount;

        return (
          <motion.div 
            key={record.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden relative"
          >
            {/* Decorative Background Icon */}
            <FloatingIcon className="absolute -left-4 -bottom-4 opacity-[0.03] rotate-12">
              <Users size={120} />
            </FloatingIcon>

            <div className="p-6 space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div onClick={() => setSelectedRecord({ type: 'SPLIT', data: record })} className="cursor-pointer flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{record.name}</h3>
                    <p className="text-slate-400 text-[10px]">{record.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-emerald-600 font-bold">{formatCurrency(record.totalAmount)}</p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {t.remainingAmount}: {formatCurrency(record.totalAmount - totalPaid)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {record.participants.map(p => (
                  <div key={p.name} className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                      {p.paid >= p.amount ? <CheckCircle2 size={16} className="text-emerald-500" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200" />}
                      <span className="text-sm font-medium text-slate-700">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-800">{formatCurrency(p.paid)} / {formatCurrency(p.amount)}</p>
                      </div>
                      {p.paid < p.amount && (
                        <button 
                          onClick={() => setRepaymentData({ splitId: record.id, participantName: p.name, remaining: p.amount - p.paid })}
                          className="bg-emerald-100 text-emerald-600 p-2 rounded-xl active:scale-90 transition-all"
                        >
                          <PlusCircle size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {isFullyPaid && (
                <div className="flex items-center justify-center gap-2 py-2 bg-emerald-50 rounded-2xl text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                  <CheckCircle2 size={14} /> {t.settled}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
      {splitRecords.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-dashed border-slate-200">
          {t.noRecords}
        </div>
      )}
    </div>
  </div>
);

const GeniePay = ({ 
  t, 
  settings, 
  genieCycles, 
  setSelectedRecord, 
  exportPdf, 
  formatCurrency 
}: { 
  t: any, 
  settings: AppSettings, 
  genieCycles: any[], 
  setSelectedRecord: (rec: any) => void, 
  exportPdf: (cycle: any) => void, 
  formatCurrency: (val: number) => string 
}) => (
  <div className="p-4 space-y-6 pb-24">
    <div className="flex items-center justify-between px-2">
      <h2 className="text-2xl font-bold text-slate-800">{t.geniePay}</h2>
      <div className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
        {t.billingDay}: {settings.genieBillingDay}
      </div>
    </div>

    <div className="space-y-6">
      {genieCycles.map((cycle, i) => (
        <motion.div 
          key={cycle.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden relative"
        >
          {/* Decorative Background Icon */}
          <FloatingIcon className="absolute -right-6 -top-6 opacity-[0.03] -rotate-12">
            <Zap size={140} />
          </FloatingIcon>
          
          <div className="relative z-10">
            <div className="bg-slate-50 p-6 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{t.billingCycle}</p>
                  <h3 className="text-lg font-bold text-slate-800">{cycle.key}</h3>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{t.totalSum}</p>
                <p className="text-purple-600 font-bold text-xl">{formatCurrency(cycle.total)}</p>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                {cycle.records.map((r: any) => (
                  <RecordItem key={r.id} record={r} onClick={() => setSelectedRecord({ type: 'GENIE', data: r })} t={t} />
                ))}
                {cycle.records.length === 0 && (
                  <div className="text-center py-4 text-slate-400 text-sm italic">{t.noRecords}</div>
                )}
              </div>
              
              <button 
                onClick={() => exportPdf(cycle)}
                className="w-full py-3 bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <FileDown size={16} /> {t.exportPdf}
              </button>
            </div>
          </div>
        </motion.div>
      ))}
      {genieCycles.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-dashed border-slate-200">
          {t.noRecords}
        </div>
      )}
    </div>
  </div>
);

const Dashboard = ({ 
  t, 
  stats, 
  basicRecords, 
  setActiveTab, 
  setSelectedRecord, 
  formatCurrency 
}: { 
  t: any, 
  stats: any, 
  basicRecords: BasicRecord[], 
  setActiveTab: (tab: Tab) => void, 
  setSelectedRecord: (rec: any) => void, 
  formatCurrency: (val: number) => string 
}) => {
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);

  const dailyData = useMemo(() => {
    const records = basicRecords.filter(r => r.date === viewDate);
    const expense = records
      .filter(r => r.type === RecordType.EXPENSE)
      .reduce((sum, r) => sum + r.amount, 0);
    return {
      records,
      expense,
      remaining: stats.dailyBudget - expense
    };
  }, [basicRecords, viewDate, stats.dailyBudget]);

  const changeDate = (days: number) => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() + days);
    setViewDate(d.toISOString().split('T')[0]);
  };

  const isToday = viewDate === new Date().toISOString().split('T')[0];

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Summary Card */}
      <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
        {/* Decorative Patterns */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full -mr-24 -mt-24 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full -ml-16 -mb-16 blur-2xl"></div>
        
        {/* Decorative Icons */}
        <FloatingIcon className="absolute top-6 right-8 opacity-10 rotate-12">
          <Wallet size={80} />
        </FloatingIcon>
        <FloatingIcon className="absolute bottom-4 right-12 opacity-5 -rotate-12">
          <TrendingUp size={60} />
        </FloatingIcon>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-1">
            <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">{t.totalBalance}</p>
            <span className="bg-white/10 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-tighter text-white/60">
              Cycle: {stats.currentCycleKey}
            </span>
          </div>
          <h2 className="text-4xl font-bold tracking-tight">{formatCurrency(stats.balance)}</h2>
          
          <div className="grid grid-cols-2 gap-6 mt-8 pt-6 border-t border-white/10">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">{t.income}</p>
              <p className="text-emerald-400 font-bold text-lg">+{formatCurrency(stats.income)}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">{t.expense}</p>
              <p className="text-rose-400 font-bold text-lg">-{formatCurrency(stats.expense)}</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Daily Budget Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden"
      >
        {/* Decorative Background Icon */}
        <FloatingIcon className="absolute -right-4 -bottom-4 opacity-[0.03] rotate-12">
          <Target size={120} />
        </FloatingIcon>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => changeDate(-1)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                <ChevronLeft size={16} className="text-slate-400" />
              </button>
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  {isToday ? t.dailyBudget : viewDate}
                </p>
                <p className="text-slate-800 font-bold text-xl">{formatCurrency(stats.dailyBudget)}</p>
              </div>
              <button onClick={() => changeDate(1)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{t.remaining}</p>
              <p className={`font-bold text-xl ${dailyData.remaining < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                {formatCurrency(dailyData.remaining)}
              </p>
            </div>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
            <motion.div 
              key={viewDate}
              initial={{ width: 0 }}
              animate={{ 
                width: `${Math.min(100, (dailyData.expense / stats.dailyBudget) * 100)}%`,
                scaleY: dailyData.expense > stats.dailyBudget ? [1, 1.1, 1] : 1
              }}
              transition={{
                width: { duration: 0.5 },
                scaleY: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
              className={`h-full rounded-full relative ${dailyData.expense > stats.dailyBudget ? 'bg-rose-500' : 'bg-emerald-600'}`}
            >
              <motion.div
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />
            </motion.div>
          </div>
        </div>

      {/* Selected Date Records List */}
        {dailyData.records.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-50 space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              {isToday ? "Today's Details" : `${viewDate} Details`}
            </p>
            {dailyData.records.map((r: BasicRecord) => (
              <div key={r.id} className="flex items-center justify-between group cursor-pointer" onClick={() => setSelectedRecord({ type: 'BASIC', data: r })}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${r.type === RecordType.INCOME ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    <span className="text-xs font-bold">{r.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">{r.name}</p>
                    <p className="text-[10px] text-slate-400">{t.categories[r.category]}</p>
                  </div>
                </div>
                <p className={`text-xs font-bold ${r.type === RecordType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {r.type === RecordType.INCOME ? '+' : '-'}{formatCurrency(r.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
        {dailyData.records.length === 0 && !isToday && (
          <div className="mt-6 pt-6 border-t border-slate-50 text-center text-slate-400 text-xs">
            No records for this day
          </div>
        )}
      </motion.div>

      {/* Recent Records */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t.recent}</h3>
          <button onClick={() => setActiveTab('STATS')} className="text-blue-600 text-xs font-bold">{t.search}</button>
        </div>
        <div className="space-y-3">
          {basicRecords.slice(0, 10).map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <RecordItem record={r} onClick={() => setSelectedRecord({ type: 'BASIC', data: r })} t={t} />
            </motion.div>
          ))}
          {basicRecords.length === 0 && (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-dashed border-slate-200">
              {t.noRecords}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const exportFullPeriodPdf = (t: any, formatCurrency: (val: number) => string, periodKey: string, basic: BasicRecord[], genie: GeniePayRecord[]) => {
  const totalBasic = basic.reduce((sum, r) => r.type === RecordType.EXPENSE ? sum + r.amount : sum - r.amount, 0);
  const totalGenie = genie.reduce((sum, r) => sum + r.amount, 0);
  const total = totalBasic + totalGenie;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <html>
      <head>
        <title>${t.appName} - ${periodKey} Full Statement</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.5; }
          h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
          h2 { color: #475569; margin-top: 30px; border-left: 4px solid #2563eb; padding-left: 10px; }
          .meta { margin-bottom: 30px; display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { text-align: left; padding: 10px; border-bottom: 1px solid #eee; font-size: 14px; }
          th { background: #f8fafc; font-weight: 600; }
          .total-section { margin-top: 30px; padding: 20px; background: #f1f5f9; border-radius: 8px; text-align: right; }
          .total-row { font-size: 1.2rem; font-weight: bold; margin-top: 5px; }
          .expense { color: #ef4444; }
          .income { color: #10b981; }
          .footer { margin-top: 50px; font-size: 0.8rem; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <h1>${t.appName} - ${t.search}</h1>
        <div class="meta">
          <div><strong>${t.billingCycle}:</strong> ${periodKey}</div>
          <div><strong>${t.date}:</strong> ${new Date().toLocaleDateString()}</div>
        </div>

        <h2>${t.dashboard}</h2>
        <table>
          <thead>
            <tr>
              <th>${t.date}</th>
              <th>${t.name}</th>
              <th>${t.category}</th>
              <th style="text-align: right;">${t.amount}</th>
            </tr>
          </thead>
          <tbody>
            ${basic.map(r => `
              <tr>
                <td>${r.date}</td>
                <td>${r.name}</td>
                <td>${t.categories[r.category]}</td>
                <td style="text-align: right;" class="${r.type === RecordType.INCOME ? 'income' : 'expense'}">
                  ${r.type === RecordType.INCOME ? '+' : '-'}${formatCurrency(r.amount)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>${t.geniePay}</h2>
        <table>
          <thead>
            <tr>
              <th>${t.date}</th>
              <th>${t.name}</th>
              <th>${t.category}</th>
              <th style="text-align: right;">${t.amount}</th>
            </tr>
          </thead>
          <tbody>
            ${genie.map(r => `
              <tr>
                <td>${r.date}</td>
                <td>${r.name}</td>
                <td>${t.categories[r.category]}</td>
                <td style="text-align: right;">${formatCurrency(r.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          <div>${t.dashboard} ${t.totalSum}: ${formatCurrency(totalBasic)}</div>
          <div>${t.geniePay} ${t.totalSum}: ${formatCurrency(totalGenie)}</div>
          <div class="total-row">${t.totalSum}: ${formatCurrency(total)}</div>
        </div>
        <div class="footer">Generated by ${t.appName}</div>
      </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
};

const StatsPage = ({ 
  t, 
  basicRecords, 
  genieRecords, 
  settings, 
  formatCurrency, 
  setSelectedRecord, 
  onExportFullPeriodPdf 
}: { 
  t: any, 
  basicRecords: BasicRecord[], 
  genieRecords: GeniePayRecord[], 
  settings: AppSettings, 
  formatCurrency: (val: number) => string, 
  setSelectedRecord: (rec: any) => void,
  onExportFullPeriodPdf: (periodKey: string, basic: BasicRecord[], genie: GeniePayRecord[]) => void
}) => {
  const [query, setQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [categoryFilter, setCategoryFilter] = useState<Category | 'ALL'>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');

  const periods = useMemo(() => {
    const p = new Set<string>();
    basicRecords.forEach(r => p.add(r.date.substring(0, 7)));
    genieRecords.forEach(r => {
      const date = new Date(r.date);
      let month = date.getMonth();
      let year = date.getFullYear();
      if (date.getDate() > settings.genieBillingDay) {
        month += 1;
        if (month > 11) { month = 0; year += 1; }
      }
      p.add(`${year}-${(month + 1).toString().padStart(2, '0')}`);
    });
    return Array.from(p).sort((a, b) => b.localeCompare(a));
  }, [basicRecords, genieRecords, settings.genieBillingDay]);

  useEffect(() => {
    if (periods.length > 0 && !selectedPeriod) {
      setSelectedPeriod(periods[0]);
    }
  }, [periods]);

  const periodData = useMemo(() => {
    if (!selectedPeriod) return { basic: [], genie: [], chartData: [] };
    
    const basic = basicRecords.filter(r => r.date.startsWith(selectedPeriod) && r.type === RecordType.EXPENSE);
    const genie = genieRecords.filter(r => {
      const date = new Date(r.date);
      let month = date.getMonth();
      let year = date.getFullYear();
      if (date.getDate() > settings.genieBillingDay) {
        month += 1;
        if (month > 11) { month = 0; year += 1; }
      }
      const cycleKey = `${year}-${(month + 1).toString().padStart(2, '0')}`;
      return cycleKey === selectedPeriod;
    });

    const combined = [...basic, ...genie];
    const categoryMap: Record<string, number> = {};
    combined.forEach(r => {
      const catName = t.categories[r.category];
      categoryMap[catName] = (categoryMap[catName] || 0) + r.amount;
    });

    const chartData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
    return { basic, genie, chartData };
  }, [selectedPeriod, basicRecords, genieRecords, settings.genieBillingDay, t]);

  const COLORS = ['#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899'];

  const filtered = useMemo(() => {
    const all = [...basicRecords.map(r => ({ ...r, source: 'BASIC' })), ...genieRecords.map(r => ({ ...r, source: 'GENIE' }))];
    return all.filter(r => {
      const matchesQuery = r.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || r.category === categoryFilter;
      const matchesDate = (!dateRange.start || r.date >= dateRange.start) && (!dateRange.end || r.date <= dateRange.end);
      return matchesQuery && matchesCategory && matchesDate;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [query, dateRange, categoryFilter, basicRecords, genieRecords]);

  const totalSum = filtered.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="p-4 space-y-6 pb-24">
      <h2 className="text-2xl font-bold text-slate-800">{t.search}</h2>
      
      {/* Period Selector & Chart */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <select 
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            {periods.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button 
            onClick={() => onExportFullPeriodPdf(selectedPeriod, periodData.basic, periodData.genie)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
          >
            <FileDown size={16} /> {t.exportPdf}
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="h-64 w-full min-h-[256px] relative"
        >
          {periodData.chartData.length > 0 ? (
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={periodData.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {periodData.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
              {t.noRecords}
            </div>
          )}
        </motion.div>
      </div>

      {/* Search Functionality */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder={t.keyword}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <input 
            type="date" 
            value={dateRange.start}
            onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
            className="bg-slate-50 border-none rounded-xl px-3 py-2 text-xs"
          />
          <input 
            type="date" 
            value={dateRange.end}
            onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
            className="bg-slate-50 border-none rounded-xl px-3 py-2 text-xs"
          />
        </div>

        <select 
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value as any)}
          className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-xs"
        >
          <option value="ALL">All Categories</option>
          {Object.entries(Category).map(([key, val]) => (
            <option key={key} value={val}>{t.categories[val]}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between px-2">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{t.totalCount}: {filtered.length}</p>
        <p className="text-slate-800 font-bold">{t.totalSum}: {formatCurrency(totalSum)}</p>
      </div>

      <div className="space-y-2">
        {filtered.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.5) }}
          >
            <RecordItem record={r as any} onClick={() => setSelectedRecord({ type: r.source as any, data: r })} t={t} />
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-dashed border-slate-200">
            {t.noRecords}
          </div>
        )}
      </div>
    </div>
  );
};

const AddRecord = ({ t, getToday, handleAddBasic, handleAddGenie, handleAddSplit }: { 
  t: any, 
  getToday: () => string, 
  handleAddBasic: (data: any, switchTab?: boolean) => void,
  handleAddGenie: (data: any) => void,
  handleAddSplit: (data: any) => void
}) => {
  const [mode, setMode] = useState<'BASIC' | 'GENIE' | 'SPLIT'>('BASIC');
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    date: getToday(),
    category: Category.FOOD,
    type: RecordType.EXPENSE,
    participants: [{ name: '', amount: '' }],
    syncToBasic: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) return;

    if (mode === 'BASIC') {
      handleAddBasic({
        name: formData.name,
        amount: Number(formData.amount),
        date: formData.date,
        category: formData.category,
        type: formData.type
      });
    } else if (mode === 'GENIE') {
      handleAddGenie({
        name: formData.name,
        amount: Number(formData.amount),
        date: formData.date,
        category: formData.category
      });
    } else if (mode === 'SPLIT') {
      const splitData = {
        name: formData.name,
        totalAmount: Number(formData.amount),
        date: formData.date,
        participants: formData.participants.map(p => ({
          name: p.name,
          amount: Number(p.amount),
          paid: 0
        }))
      };
      handleAddSplit(splitData);

      if (formData.syncToBasic) {
        handleAddBasic({
          name: `${t.split}: ${formData.name}`,
          amount: Number(formData.amount),
          date: formData.date,
          category: Category.OTHER,
          type: RecordType.EXPENSE
        }, false);
      }
    }
  };

  return (
    <div className="p-4 space-y-6 relative min-h-[calc(100vh-160px)]">
      {/* Decorative Background Elements */}
      <div className="absolute top-20 -left-10 w-40 h-40 bg-blue-100/50 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-20 -right-10 w-60 h-60 bg-purple-100/50 rounded-full blur-3xl -z-10"></div>
      
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">{t.add}</h2>
        <div className="w-10 h-10 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-600">
          <PlusCircle size={24} />
        </div>
      </div>
      
      <div className="flex bg-slate-200 p-1 rounded-2xl">
        <button onClick={() => setMode('BASIC')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${mode === 'BASIC' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>{t.basic}</button>
        <button onClick={() => setMode('GENIE')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${mode === 'GENIE' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'}`}>{t.geniePay}</button>
        <button onClick={() => setMode('SPLIT')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${mode === 'SPLIT' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>{t.split}</button>
      </div>

      <motion.form 
        key={mode}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit} 
        className="space-y-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
      >
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.name}</label>
          <input 
            type="text" 
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="e.g. Lunch, Netflix..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.amount}</label>
            <input 
              type="number" 
              required
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
              className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.date}</label>
            <input 
              type="date" 
              required
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        {mode !== 'SPLIT' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.category}</label>
              <select 
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as Category })}
                className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all"
              >
                {Object.entries(Category).map(([key, val]) => (
                  <option key={key} value={val}>{t.categories[val]}</option>
                ))}
              </select>
            </div>
            {mode === 'BASIC' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.type}</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as RecordType })}
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value={RecordType.EXPENSE}>{t.expense}</option>
                  <option value={RecordType.INCOME}>{t.income}</option>
                </select>
              </div>
            )}
          </div>
        )}

        {mode === 'SPLIT' && (
          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.splitTarget}</label>
            {formData.participants.map((p, idx) => (
              <div key={idx} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Name"
                  value={p.name}
                  onChange={e => {
                    const newP = [...formData.participants];
                    newP[idx].name = e.target.value;
                    setFormData({ ...formData, participants: newP });
                  }}
                  className="flex-1 bg-slate-50 border-none rounded-xl px-3 py-2 text-sm"
                />
                <input 
                  type="number" 
                  placeholder="Amount"
                  value={p.amount}
                  onChange={e => {
                    const newP = [...formData.participants];
                    newP[idx].amount = e.target.value;
                    setFormData({ ...formData, participants: newP });
                  }}
                  className="w-24 bg-slate-50 border-none rounded-xl px-3 py-2 text-sm"
                />
                <button 
                  type="button"
                  onClick={() => {
                    const newP = formData.participants.filter((_, i) => i !== idx);
                    setFormData({ ...formData, participants: newP });
                  }}
                  className="text-red-400 p-2"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <button 
              type="button"
              onClick={() => setFormData({ ...formData, participants: [...formData.participants, { name: '', amount: '' }] })}
              className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-bold hover:bg-slate-50 transition-all"
            >
              + Add Participant
            </button>

            <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer active:scale-[0.99] transition-all">
              <input 
                type="checkbox" 
                checked={formData.syncToBasic}
                onChange={e => setFormData({ ...formData, syncToBasic: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-bold text-slate-700">{t.syncToBasic}</span>
            </label>
          </div>
        )}

        <button 
          type="submit"
          className={`w-full py-4 rounded-2xl text-white font-bold shadow-lg active:scale-95 transition-all mt-4 ${mode === 'BASIC' ? 'bg-blue-600' : mode === 'GENIE' ? 'bg-purple-600' : 'bg-emerald-600'}`}
        >
          {t.save}
        </button>
      </motion.form>
    </div>
  );
};

export default function App() {
  // --- State ---
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration: if monthlyBudget exists but initialBalance doesn't
      if (parsed.monthlyBudget !== undefined && parsed.initialBalance === undefined) {
        parsed.initialBalance = parsed.monthlyBudget;
        delete parsed.monthlyBudget;
      }
      return parsed;
    }
    return { language: Language.ZH, genieBillingDay: 10, initialBalance: 20000, dailyBudget: 500 };
  });

  const [basicRecords, setBasicRecords] = useState<BasicRecord[]>(() => {
    const saved = localStorage.getItem('basic_records');
    return saved ? JSON.parse(saved) : [];
  });

  const [genieRecords, setGenieRecords] = useState<GeniePayRecord[]>(() => {
    const saved = localStorage.getItem('genie_records');
    return saved ? JSON.parse(saved) : [];
  });

  const [splitRecords, setSplitRecords] = useState<SplitRecord[]>(() => {
    const saved = localStorage.getItem('split_records');
    return saved ? JSON.parse(saved) : [];
  });

  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>(() => {
    const saved = localStorage.getItem('recurring_payments');
    return saved ? JSON.parse(saved) : [];
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<{ type: 'BASIC' | 'GENIE' | 'SPLIT', data: any } | null>(null);
  const [repaymentData, setRepaymentData] = useState<{ splitId: string, participantName: string, remaining: number } | null>(null);
  const [confirmData, setConfirmData] = useState<{ title: string, onConfirm: () => void } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddingRecurring, setIsAddingRecurring] = useState(false);
  const [newRecurring, setNewRecurring] = useState({ name: '', amount: '', period: RecurringPeriod.MONTHLY, target: 'BASIC' as 'BASIC' | 'GENIE', billingDay: 1 });

  const t = translations[settings.language];

  // --- Persistence ---
  useEffect(() => localStorage.setItem('app_settings', JSON.stringify(settings)), [settings]);
  useEffect(() => localStorage.setItem('basic_records', JSON.stringify(basicRecords)), [basicRecords]);
  useEffect(() => localStorage.setItem('genie_records', JSON.stringify(genieRecords)), [genieRecords]);
  useEffect(() => localStorage.setItem('split_records', JSON.stringify(splitRecords)), [splitRecords]);
  useEffect(() => localStorage.setItem('recurring_payments', JSON.stringify(recurringPayments)), [recurringPayments]);

  // --- Recurring Payment Logic ---
  useEffect(() => {
    const checkRecurring = () => {
      const today = new Date();
      const todayStr = getToday();
      let updatedRecurring = [...recurringPayments];
      let newBasic: BasicRecord[] = [];
      let newGenie: GeniePayRecord[] = [];
      let changed = false;

      updatedRecurring = updatedRecurring.map(rp => {
        const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM
        
        if (rp.period === RecurringPeriod.MONTHLY) {
          // If already processed this month, skip
          if (rp.lastProcessed === currentMonth) return rp;

          // If today is on or after the billing day, process it
          if (today.getDate() >= (rp.billingDay || 1)) {
            changed = true;
            const record = {
              id: generateId(),
              name: `[Auto] ${rp.name}`,
              amount: rp.amount,
              date: todayStr,
              category: rp.category,
            };

            if (rp.target === 'BASIC') {
              newBasic.push({ ...record, type: RecordType.EXPENSE });
            } else {
              newGenie.push(record);
            }
            return { ...rp, lastProcessed: currentMonth };
          }
        } else if (rp.period === RecurringPeriod.WEEKLY) {
          if (rp.lastProcessed === todayStr) return rp;

          const lastDate = rp.lastProcessed ? new Date(rp.lastProcessed) : null;
          let shouldProcess = false;

          if (!lastDate) {
            shouldProcess = true;
          } else {
            const diffTime = Math.abs(today.getTime() - lastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays >= 7) shouldProcess = true;
          }

          if (shouldProcess) {
            changed = true;
            const record = {
              id: generateId(),
              name: `[Auto] ${rp.name}`,
              amount: rp.amount,
              date: todayStr,
              category: rp.category,
            };

            if (rp.target === 'BASIC') {
              newBasic.push({ ...record, type: RecordType.EXPENSE });
            } else {
              newGenie.push(record);
            }
            return { ...rp, lastProcessed: todayStr };
          }
        }
        return rp;
      });

      if (changed) {
        setRecurringPayments(updatedRecurring);
        if (newBasic.length > 0) setBasicRecords(prev => [...prev, ...newBasic]);
        if (newGenie.length > 0) setGenieRecords(prev => [...prev, ...newGenie]);
      }
    };

    checkRecurring();
  }, []);

  // --- Calculations ---
  const stats = useMemo(() => {
    const now = new Date();
    
    const getCycleKey = (dateStr: string) => {
      const d = new Date(dateStr);
      let month = d.getMonth();
      let year = d.getFullYear();
      if (d.getDate() > settings.genieBillingDay) {
        month += 1;
        if (month > 11) {
          month = 0;
          year += 1;
        }
      }
      return `${year}/${String(month + 1).padStart(2, '0')}`;
    };

    const currentCycleKey = getCycleKey(now.toISOString().split('T')[0]);

    const cycleBasic = basicRecords.filter(r => getCycleKey(r.date) === currentCycleKey);

    const income = cycleBasic.filter(r => r.type === RecordType.INCOME).reduce((sum, r) => sum + r.amount, 0);
    const expense = cycleBasic.filter(r => r.type === RecordType.EXPENSE).reduce((sum, r) => sum + r.amount, 0);
    
    const totalBalance = basicRecords.reduce((sum, r) => r.type === RecordType.INCOME ? sum + r.amount : sum - r.amount, settings.initialBalance);
    const remainingBudget = 0; // Removed monthly budget

    const todayStr = getToday();
    const dailyRecords = basicRecords.filter(r => r.date === todayStr);
    const dailyExpense = dailyRecords
      .filter(r => r.type === RecordType.EXPENSE)
      .reduce((sum, r) => sum + r.amount, 0);

    return { 
      income, 
      expense, 
      balance: totalBalance, 
      budget: 0, 
      budgetRemaining: remainingBudget,
      dailyBudget: settings.dailyBudget,
      dailyExpense,
      dailyRemaining: settings.dailyBudget - dailyExpense,
      dailyRecords,
      currentCycleKey
    };
  }, [basicRecords, settings.initialBalance, settings.dailyBudget, settings.genieBillingDay]);

  const genieCycles = useMemo(() => {
    const cycles: Record<string, GeniePayRecord[]> = {};
    genieRecords.forEach(r => {
      const date = new Date(r.date);
      let month = date.getMonth();
      let year = date.getFullYear();
      
      // If date is after billing day, it belongs to the next cycle
      if (date.getDate() > settings.genieBillingDay) {
        month += 1;
        if (month > 11) {
          month = 0;
          year += 1;
        }
      }
      
      const cycleKey = `${year}-${(month + 1).toString().padStart(2, '0')}`;
      if (!cycles[cycleKey]) cycles[cycleKey] = [];
      cycles[cycleKey].push(r);
    });
    return Object.entries(cycles)
      .map(([key, records]) => ({
        key,
        records,
        total: records.reduce((sum, r) => sum + r.amount, 0)
      }))
      .sort((a, b) => b.key.localeCompare(a.key));
  }, [genieRecords, settings.genieBillingDay]);

  // --- Actions ---
  const handleAddBasic = (data: Omit<BasicRecord, 'id'>, shouldSwitchTab = true) => {
    setBasicRecords(prev => [...prev, { ...data, id: generateId() }]);
    if (shouldSwitchTab) setActiveTab('DASHBOARD');
  };

  const handleAddGenie = (data: Omit<GeniePayRecord, 'id'>) => {
    setGenieRecords(prev => [...prev, { ...data, id: generateId() }]);
    setActiveTab('GENIE');
  };

  const handleAddSplit = (data: Omit<SplitRecord, 'id'>) => {
    setSplitRecords(prev => [...prev, { ...data, id: generateId() }]);
    setActiveTab('SPLIT');
  };

  const handleUpdateRecord = (type: 'BASIC' | 'GENIE' | 'SPLIT', id: string, data: any) => {
    if (type === 'BASIC') setBasicRecords(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    if (type === 'GENIE') setGenieRecords(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    if (type === 'SPLIT') setSplitRecords(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    setSelectedRecord(null);
    setIsEditMode(false);
  };

  const handleDeleteRecord = (type: 'BASIC' | 'GENIE' | 'SPLIT', id: string) => {
    setConfirmData({
      title: t.confirmDelete,
      onConfirm: () => {
        if (type === 'BASIC') setBasicRecords(prev => prev.filter(r => r.id !== id));
        if (type === 'GENIE') setGenieRecords(prev => prev.filter(r => r.id !== id));
        if (type === 'SPLIT') setSplitRecords(prev => prev.filter(r => r.id !== id));
        setSelectedRecord(null);
        setConfirmData(null);
      }
    });
  };

  const handleRepay = (splitId: string, participantName: string, amount: number, sync: boolean) => {
    const splitRecord = splitRecords.find(r => r.id === splitId);
    
    setSplitRecords(prev => prev.map(r => {
      if (r.id !== splitId) return r;
      return {
        ...r,
        participants: r.participants.map(p => 
          p.name === participantName ? { ...p, paid: p.paid + amount } : p
        )
      };
    }));

    if (sync && splitRecord) {
      handleAddBasic({
        name: `${t.repay}: ${participantName} (${splitRecord.name})`,
        amount,
        date: getToday(),
        category: Category.INCOME,
        type: RecordType.INCOME
      }, false);
    }
  };

  const exportData = () => {
    const data = { basicRecords, genieRecords, splitRecords, recurringPayments, settings };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `easy_accounting_backup_${getToday()}.json`;
    a.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.basicRecords) setBasicRecords(data.basicRecords);
        if (data.genieRecords) setGenieRecords(data.genieRecords);
        if (data.splitRecords) setSplitRecords(data.splitRecords);
        if (data.recurringPayments) setRecurringPayments(data.recurringPayments);
        if (data.settings) setSettings(data.settings);
        alert('Restore Successful!');
      } catch (err) {
        alert('Invalid backup file.');
      }
    };
    reader.readAsText(file);
  };

  const exportPdf = (cycleKey: string, records: GeniePayRecord[]) => {
    const total = records.reduce((sum, r) => sum + r.amount, 0);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>${t.appName} - ${cycleKey}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            h1 { color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px; }
            .meta { margin-bottom: 30px; display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; }
            th { background: #f9fafb; font-weight: 600; }
            .total { text-align: right; font-size: 1.5rem; font-weight: bold; color: #7c3aed; }
            .footer { margin-top: 50px; font-size: 0.8rem; color: #999; text-align: center; }
          </style>
        </head>
        <body>
          <h1>${t.appName} - ${t.geniePay}</h1>
          <div class="meta">
            <div><strong>${t.billingCycle}:</strong> ${cycleKey}</div>
            <div><strong>${t.date}:</strong> ${new Date().toLocaleDateString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>${t.date}</th>
                <th>${t.name}</th>
                <th>${t.category}</th>
                <th style="text-align: right;">${t.amount}</th>
              </tr>
            </thead>
            <tbody>
              ${records.map(r => `
                <tr>
                  <td>${r.date}</td>
                  <td>${r.name}</td>
                  <td>${t.categories[r.category]}</td>
                  <td style="text-align: right;">${formatCurrency(r.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">${t.totalSum}: ${formatCurrency(total)}</div>
          <div class="footer">Generated by ${t.appName}</div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  // --- Sub-Components ---















  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 pt-16">
      <Header t={t} setIsSettingsOpen={setIsSettingsOpen} />
      
      <main className="max-w-md mx-auto">
        {activeTab === 'DASHBOARD' && <Dashboard t={t} stats={stats} basicRecords={basicRecords} setActiveTab={setActiveTab} setSelectedRecord={setSelectedRecord} formatCurrency={formatCurrency} />}
        {activeTab === 'GENIE' && <GeniePay t={t} settings={settings} genieCycles={genieCycles} setSelectedRecord={setSelectedRecord} exportPdf={(cycle) => exportPdf(cycle.key, cycle.records)} formatCurrency={formatCurrency} />}
        {activeTab === 'ADD' && <AddRecord t={t} getToday={getToday} handleAddBasic={handleAddBasic} handleAddGenie={handleAddGenie} handleAddSplit={handleAddSplit} />}
        {activeTab === 'SPLIT' && <SplitTracker t={t} splitRecords={splitRecords} setRepaymentData={setRepaymentData} setSelectedRecord={setSelectedRecord} formatCurrency={formatCurrency} />}
        {activeTab === 'STATS' && (
          <StatsPage 
            t={t} 
            basicRecords={basicRecords} 
            genieRecords={genieRecords} 
            settings={settings} 
            formatCurrency={formatCurrency} 
            setSelectedRecord={setSelectedRecord} 
            onExportFullPeriodPdf={(periodKey, basic, genie) => exportFullPeriodPdf(t, formatCurrency, periodKey, basic, genie)} 
          />
        )}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} t={t} />
      <SettingsModal 
        isSettingsOpen={isSettingsOpen} 
        setIsSettingsOpen={setIsSettingsOpen} 
        t={t} 
        settings={settings} 
        setSettings={setSettings} 
        recurringPayments={recurringPayments} 
        setRecurringPayments={setRecurringPayments} 
        setConfirmData={setConfirmData} 
        isAddingRecurring={isAddingRecurring} 
        setIsAddingRecurring={setIsAddingRecurring} 
        newRecurring={newRecurring} 
        setNewRecurring={setNewRecurring} 
        exportData={exportData} 
        importData={importData} 
      />
      <DetailModal 
        selectedRecord={selectedRecord} 
        setSelectedRecord={setSelectedRecord} 
        isEditMode={isEditMode} 
        setIsEditMode={setIsEditMode} 
        t={t} 
        formatCurrency={formatCurrency} 
        handleUpdateRecord={handleUpdateRecord} 
        handleDeleteRecord={handleDeleteRecord} 
      />
      <RepaymentModal 
        repaymentData={repaymentData} 
        setRepaymentData={setRepaymentData} 
        t={t} 
        formatCurrency={formatCurrency} 
        handleRepay={handleRepay} 
      />
      <ConfirmModal confirmData={confirmData} setConfirmData={setConfirmData} t={t} />
    </div>
  );
}
