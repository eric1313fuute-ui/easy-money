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
  Trash2,
  Edit3,
  X,
  Download,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  PieChart as PieChartIcon,
  FileDown
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
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-slate-100 cursor-pointer"
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

export default function App() {
  // --- State ---
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_settings');
    return saved ? JSON.parse(saved) : { language: Language.ZH, genieBillingDay: 10, monthlyBudget: 20000 };
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
  const [newRecurring, setNewRecurring] = useState({ name: '', amount: '', period: RecurringPeriod.MONTHLY, target: 'BASIC' as 'BASIC' | 'GENIE' });

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
        if (rp.lastProcessed === todayStr) return rp;

        const lastDate = rp.lastProcessed ? new Date(rp.lastProcessed) : null;
        let shouldProcess = false;

        if (!lastDate) {
          shouldProcess = true;
        } else {
          if (rp.period === RecurringPeriod.MONTHLY) {
            // Check if a month has passed
            if (today.getMonth() !== lastDate.getMonth() || today.getFullYear() !== lastDate.getFullYear()) {
              if (today.getDate() >= lastDate.getDate()) shouldProcess = true;
            }
          } else if (rp.period === RecurringPeriod.WEEKLY) {
            const diffTime = Math.abs(today.getTime() - lastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays >= 7) shouldProcess = true;
          }
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
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyBasic = basicRecords.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const income = monthlyBasic.filter(r => r.type === RecordType.INCOME).reduce((sum, r) => sum + r.amount, 0);
    const expense = monthlyBasic.filter(r => r.type === RecordType.EXPENSE).reduce((sum, r) => sum + r.amount, 0);
    
    const totalBalance = basicRecords.reduce((sum, r) => r.type === RecordType.INCOME ? sum + r.amount : sum - r.amount, 0);
    const remainingBudget = settings.monthlyBudget - expense;

    return { income, expense, totalBalance, remainingBudget };
  }, [basicRecords, settings.monthlyBudget]);

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
    return Object.entries(cycles).sort((a, b) => b[0].localeCompare(a[0]));
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

  const Header = () => (
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

  const BottomNav = () => (
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

  const NavItem = ({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-16 transition-all active:scale-95 ${active ? 'text-blue-600' : 'text-slate-400'}`}
    >
      {icon}
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </button>
  );

  const Dashboard = () => (
    <div className="p-4 space-y-6">
      {/* Total Balance Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl"
      >
        <p className="text-blue-100 text-sm font-medium">{t.totalBalance}</p>
        <h2 className="text-4xl font-bold mt-1">{formatCurrency(stats.totalBalance)}</h2>
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-blue-500/30">
          <div>
            <p className="text-blue-200 text-[10px] uppercase tracking-wider">{t.monthlyExpense}</p>
            <p className="font-semibold text-sm">{formatCurrency(stats.expense)}</p>
          </div>
          <div>
            <p className="text-blue-200 text-[10px] uppercase tracking-wider">{t.monthlyIncome}</p>
            <p className="font-semibold text-sm">{formatCurrency(stats.income)}</p>
          </div>
          <div>
            <p className="text-blue-200 text-[10px] uppercase tracking-wider">{t.remainingBudget}</p>
            <p className="font-semibold text-sm">{formatCurrency(stats.remainingBudget)}</p>
          </div>
        </div>
      </motion.div>

      {/* Recent Records */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800">{t.recentRecords}</h3>
          <button onClick={() => setActiveTab('STATS')} className="text-blue-600 text-sm font-medium flex items-center">
            {t.search} <ChevronRight size={16} />
          </button>
        </div>
        <div className="space-y-2">
          {basicRecords.slice(-5).reverse().map(record => (
            <RecordItem key={record.id} record={record} onClick={() => setSelectedRecord({ type: 'BASIC', data: record })} t={t} />
          ))}
          {basicRecords.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-dashed border-slate-200">
              {t.noRecords}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const GeniePay = () => (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">{t.geniePay}</h2>
        <div className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-xs font-bold">
          {t.billingDay}: {settings.genieBillingDay}
        </div>
      </div>

      {genieCycles.map(([cycle, records]) => {
        const total = records.reduce((sum, r) => sum + r.amount, 0);
        return (
          <motion.div 
            key={cycle}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100"
          >
            <div className="bg-purple-600 p-4 text-white flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-[10px] uppercase font-bold">{t.billingCycle}</p>
                <p className="text-lg font-bold">{cycle}</p>
              </div>
              <div className="text-right">
                <p className="text-purple-100 text-[10px] uppercase font-bold">{t.totalSum}</p>
                <p className="text-lg font-bold">{formatCurrency(total)}</p>
              </div>
            </div>
            <div className="p-2 space-y-1">
              {records.map(r => (
                <div 
                  key={r.id} 
                  onClick={() => setSelectedRecord({ type: 'GENIE', data: r })}
                  className="p-3 flex items-center justify-between hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{r.name}</p>
                    <p className="text-slate-400 text-[10px]">{r.date}</p>
                  </div>
                  <p className="font-bold text-slate-800">{formatCurrency(r.amount)}</p>
                </div>
              ))}
              <button 
                onClick={() => exportPdf(cycle, records)}
                className="w-full mt-2 py-3 flex items-center justify-center gap-2 text-purple-600 font-bold text-sm hover:bg-purple-50 rounded-xl transition-colors"
              >
                <Download size={18} /> {t.exportPdf}
              </button>
            </div>
          </motion.div>
        );
      })}

      {genieCycles.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-dashed border-slate-200">
          {t.noRecords}
        </div>
      )}
    </div>
  );

  const SplitTracker = () => (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">{t.split}</h2>
      
      <div className="space-y-4">
        {splitRecords.map(record => {
          const totalPaid = record.participants.reduce((sum, p) => sum + p.paid, 0);
          const isSettled = totalPaid >= record.totalAmount;

          return (
            <motion.div 
              key={record.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{record.name}</h3>
                  <p className="text-slate-400 text-xs">{record.date}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${isSettled ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                  {isSettled ? 'Settled' : 'Pending'}
                </div>
              </div>

              <div className="space-y-3">
                {record.participants.map(p => {
                  const remaining = p.amount - p.paid;
                  return (
                    <div key={p.name} className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl">
                      <div>
                        <p className="font-bold text-slate-700 text-sm">{p.name}</p>
                        <p className="text-slate-400 text-[10px]">{t.paidAmount}: {formatCurrency(p.paid)} / {formatCurrency(p.amount)}</p>
                      </div>
                      {remaining > 0 ? (
                        <button 
                          onClick={() => setRepaymentData({ splitId: record.id, participantName: p.name, remaining })}
                          className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all"
                        >
                          {t.repay}
                        </button>
                      ) : (
                        <CheckCircle2 size={20} className="text-emerald-500" />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <p className="text-slate-400 text-xs font-medium">{t.totalSum}: <span className="text-slate-800 font-bold">{formatCurrency(record.totalAmount)}</span></p>
                <button 
                  onClick={() => setSelectedRecord({ type: 'SPLIT', data: record })}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
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

  const AddRecord = () => {
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
      <div className="p-4 space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">{t.add}</h2>
        
        <div className="flex bg-slate-200 p-1 rounded-2xl">
          <button onClick={() => setMode('BASIC')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${mode === 'BASIC' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>{t.dashboard}</button>
          <button onClick={() => setMode('GENIE')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${mode === 'GENIE' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'}`}>{t.geniePay}</button>
          <button onClick={() => setMode('SPLIT')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${mode === 'SPLIT' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>{t.split}</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
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
        </form>
      </div>
    );
  };

  const exportFullPeriodPdf = (periodKey: string, basic: BasicRecord[], genie: GeniePayRecord[]) => {
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

  const StatsPage = () => {
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
              onClick={() => exportFullPeriodPdf(selectedPeriod, periodData.basic, periodData.genie)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
            >
              <FileDown size={16} /> {t.exportPdf}
            </button>
          </div>

          <div className="h-64 w-full">
            {periodData.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
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
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                {t.noRecords}
              </div>
            )}
          </div>
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
          {filtered.map(r => (
            <RecordItem key={r.id} record={r as any} onClick={() => setSelectedRecord({ type: r.source as any, data: r })} t={t} />
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

  const SettingsModal = () => (
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
                        <p className="text-slate-400 text-[10px]">{formatCurrency(rp.amount)} • {rp.period === RecurringPeriod.MONTHLY ? t.monthly : t.weekly}</p>
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
                                target: newRecurring.target
                              }]);
                              setIsAddingRecurring(false);
                              setNewRecurring({ name: '', amount: '', period: RecurringPeriod.MONTHLY, target: 'BASIC' });
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

  const DetailModal = () => {
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

  const RepaymentModal = () => {
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

  const ConfirmModal = () => {
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 pt-16">
      <Header />
      
      <main className="max-w-md mx-auto">
        {activeTab === 'DASHBOARD' && <Dashboard />}
        {activeTab === 'GENIE' && <GeniePay />}
        {activeTab === 'ADD' && <AddRecord />}
        {activeTab === 'SPLIT' && <SplitTracker />}
        {activeTab === 'STATS' && <StatsPage />}
      </main>

      <BottomNav />
      <SettingsModal />
      <DetailModal />
      <RepaymentModal />
      <ConfirmModal />
    </div>
  );
}
