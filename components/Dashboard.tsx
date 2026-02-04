
import React, { useMemo } from 'react';
import { Transaction, User, AppSettings, Account } from '../types';
import { TRANSLATIONS } from '../constants';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

interface DashboardProps {
  transactions: Transaction[];
  globalTransactions: Transaction[];
  user: User;
  settings: AppSettings;
  accounts: Account[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions = [], globalTransactions = [], user, settings, accounts = [] }) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.ID;

  if (!user || !accounts.length) return <div className="p-10 text-slate-500 font-bold uppercase tracking-widest text-center">Inisialisasi Data...</div>;

  const stats = useMemo(() => {
    let revenue = 0; let expenses = 0; let assets = 0; 
    const APPROVED_PERIOD = (transactions || []).filter(tr => tr.status === 'APPROVED');
    const APPROVED_GLOBAL = (globalTransactions || []).filter(tr => tr.status === 'APPROVED');
    
    APPROVED_PERIOD.forEach(tr => {
      (tr.entries || []).forEach(e => {
        const acc = accounts.find(a => a.code === e.accountId);
        if (acc?.type === 'REVENUE') revenue += (e.credit || 0);
        if (acc?.type === 'EXPENSE' || acc?.type === 'KASBON') expenses += (e.debit || 0);
      });
    });

    APPROVED_GLOBAL.forEach(tr => {
      (tr.entries || []).forEach(e => {
        if (e.accountId === '1101') assets += ((e.debit || 0) - (e.credit || 0));
      });
    });

    return { 
      revenue, 
      expenses, 
      profit: revenue - expenses, 
      assets, 
      pendingCount: (globalTransactions || []).filter(tr => tr.status === 'PENDING').length 
    };
  }, [transactions, globalTransactions, accounts]);

  const trendData = useMemo(() => {
    const sorted = [...(globalTransactions || [])]
      .filter(tr => tr.status === 'APPROVED')
      .sort((a, b) => a.createdAt - b.createdAt);
    
    let runningBalance = 0;
    const history = sorted.map((tr) => {
      (tr.entries || []).forEach(e => { 
        if (e.accountId === '1101') runningBalance += ((e.debit || 0) - (e.credit || 0)); 
      });
      return { name: tr.date, balance: runningBalance };
    });
    
    if (history.length === 0) return [{ name: 'INIT', balance: 0 }];
    return history.slice(-7); 
  }, [globalTransactions]);

  const expenseData = useMemo(() => {
    const categories: Record<string, number> = {};
    (transactions || [])
      .filter(tr => tr.status === 'APPROVED')
      .forEach(tr => {
        (tr.entries || []).forEach(e => {
          const acc = accounts.find(a => a.code === e.accountId);
          if (acc?.type === 'EXPENSE' || acc?.type === 'KASBON') {
            const name = acc.name[settings.language] || acc.name.ID;
            categories[name] = (categories[name] || 0) + (e.debit || 0);
          }
        });
      });
    const result = Object.entries(categories)
      .map(([name, value]) => ({ name: name.substring(0, 10), value }))
      .sort((a,b) => b.value - a.value);
    
    return result.length > 0 ? result : [{ name: 'NONE', value: 0 }];
  }, [transactions, accounts, settings.language]);

  const cards = [
    { label: 'Available Cash', value: stats.assets, icon: 'fa-vault', color: 'indigo', desc: 'Current liquidity' },
    { label: 'Total Revenue', value: stats.revenue, icon: 'fa-arrow-up-right-dots', color: 'emerald', desc: 'Gross earnings' },
    { label: 'Operational Cost', value: stats.expenses, icon: 'fa-arrow-down-right-dots', color: 'rose', desc: 'Expenses' },
    { label: 'Net Result', value: stats.profit, icon: 'fa-chart-pie', color: stats.profit >= 0 ? 'indigo' : 'rose', desc: 'Net balance' },
  ];

  return (
    <div className="p-4 lg:p-10 max-w-full lg:max-w-7xl mx-auto space-y-6 lg:space-y-10 animate-in fade-in duration-500 overflow-x-hidden">
      <header className="flex flex-col gap-1">
        <h2 className="text-xl lg:text-3xl font-extrabold text-slate-900 tracking-tight uppercase tracking-widest leading-tight">{t.dashboard}</h2>
        <p className="text-slate-600 text-[9px] lg:text-[10px] font-bold uppercase tracking-widest italic">{user.branch} Control Matrix</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className={`w-10 h-10 lg:w-12 lg:h-12 bg-${card.color}-50 text-${card.color}-600 rounded-2xl flex items-center justify-center mb-4 relative z-10`}>
              <i className={`fas ${card.icon} text-lg`}></i>
            </div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 relative z-10">{card.label}</p>
            <h3 className="text-xl lg:text-2xl font-black tabular-nums text-slate-900 mb-1 relative z-10">
              $ {card.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[8px] font-bold text-slate-400 uppercase italic opacity-70">{card.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-6 lg:p-10 border border-slate-100 shadow-sm">
          <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-8">Liquidity Trend</h3>
          <div className="h-[250px] lg:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 700, fill: '#64748B'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 700, fill: '#64748B'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '9px', fontWeight: 'bold' }} 
                />
                <Area type="monotone" dataKey="balance" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorBal)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 lg:p-10 border border-slate-100 shadow-sm">
          <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-8">Expense Ratio</h3>
          <div className="h-[250px] lg:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseData} layout="vertical" margin={{ left: -20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 800, fill: '#64748B'}} width={80} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '9px' }} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={12}>
                  {expenseData.map((_, i) => <Cell key={i} fill={i === 0 ? '#4f46e5' : '#E2E8F0'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;