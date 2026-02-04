
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, User, AppSettings, LedgerEntry, TransactionStatus, Account, BranchData } from '../types';
import { TRANSLATIONS } from '../constants';

interface TransactionManagerProps {
  transactions: Transaction[]; 
  periodTransactions: Transaction[]; 
  onAdd: (t: Transaction) => void;
  user: User;
  settings: AppSettings;
  accounts: Account[];
  branches?: BranchData[]; 
}

const TransactionManager: React.FC<TransactionManagerProps> = ({ transactions, periodTransactions, onAdd, user, settings, accounts, branches = [] }) => {
  const t = TRANSLATIONS[settings.language];
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState<'INCOME' | 'EXPENSE' | 'KASBON' | 'TUTUP_KAS'>('INCOME');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [categoryCode, setCategoryCode] = useState('');
  const [targetBranch, setTargetBranch] = useState(user.branch === 'ALL' ? (branches[0]?.name || '') : user.branch);

  const isAdmin = user.role === 'ADMIN';

  useEffect(() => {
    if (user.branch !== 'ALL') {
      setTargetBranch(user.branch);
    }
  }, [user.branch]);

  const filteredAccounts = useMemo(() => {
    switch (type) {
      case 'INCOME': return accounts.filter(a => a.type === 'REVENUE');
      case 'EXPENSE': return accounts.filter(a => a.type === 'EXPENSE');
      case 'KASBON': return accounts.filter(a => a.type === 'KASBON');
      case 'TUTUP_KAS': return accounts.filter(a => a.code === '2201');
      default: return accounts;
    }
  }, [accounts, type]);

  useEffect(() => {
    if (type === 'TUTUP_KAS') {
      setCategoryCode('2201');
      setDesc(t.close_kas.toUpperCase());
    } else {
      setCategoryCode('');
      setDesc('');
    }
  }, [type, t]);

  const currentBalance = useMemo(() => {
    return transactions.filter(tr => tr.status === 'APPROVED').reduce((bal, tr) => {
      tr.entries.forEach(e => { if (e.accountId === '1101') bal += (e.debit - e.credit); });
      return bal;
    }, 0);
  }, [transactions]);

  const handleCategoryChange = (code: string) => {
    setCategoryCode(code);
    const acc = accounts.find(a => a.code === code);
    if (acc) {
      setDesc(acc.name[settings.language].toUpperCase());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !desc || !categoryCode) return;
    
    const status: TransactionStatus = (isAdmin || !settings.isApprovalRequired) ? 'APPROVED' : 'PENDING';
    const entries: LedgerEntry[] = [];
    const cashAccount = '1101'; 
    
    if (type === 'INCOME') {
      entries.push({ accountId: cashAccount, debit: amount, credit: 0 }, { accountId: categoryCode, debit: 0, credit: amount });
    } else {
      entries.push({ accountId: categoryCode, debit: amount, credit: 0 }, { accountId: cashAccount, debit: 0, credit: amount });
    }

    // FIX: Gunakan format ISO YYYY-MM-DD agar diterima oleh database PostgreSQL
    const today = new Date();
    const isoDate = today.toISOString().split('T')[0];

    onAdd({
      id: `TRX-${Date.now()}`, 
      date: isoDate, 
      description: desc.toUpperCase(),
      branch: targetBranch, 
      userId: user.id, 
      status, 
      approvedBy: isAdmin ? user.id : undefined,
      isHqEntry: isAdmin,
      type: type === 'TUTUP_KAS' ? 'CLOSE_KAS' : (type === 'KASBON' ? 'KASBON' : (type === 'INCOME' ? 'GENERAL' : 'EXPENSE')),
      entries, 
      createdAt: Date.now(), 
      logs: []
    });

    setDesc(''); 
    setAmount(0); 
    setCategoryCode(''); 
    setShowModal(false);
  };

  return (
    <div className="p-4 lg:p-10 max-w-full lg:max-w-7xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in duration-500 overflow-x-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight uppercase tracking-widest leading-none">{t.transactions}</h2>
          <p className="text-slate-600 text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.2em] italic">Protocol Ledger</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="flex-1 md:flex-none bg-white border border-slate-200 rounded-2xl px-5 lg:px-8 py-3 lg:py-4 shadow-sm text-right">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{t.cashBalance}</p>
              <p className={`text-base lg:text-xl font-black tabular-nums ${currentBalance < 0 ? 'text-rose-600' : 'text-indigo-600'}`}>$ {currentBalance.toLocaleString()}</p>
           </div>
           <button onClick={() => { setType('INCOME'); setShowModal(true); }} className="bg-indigo-600 text-white w-12 h-12 md:w-auto md:px-8 md:py-4 rounded-2xl md:rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center">
              <i className="fas fa-plus md:mr-3"></i> <span className="hidden md:inline">{t.addTransaction}</span>
           </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
         <div className="responsive-table-wrapper">
           <table className="w-full text-left min-w-[700px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                 <tr>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-600 uppercase tracking-widest">{t.date}</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-600 uppercase tracking-widest">{t.description}</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">{t.status}</th>
                    <th className="px-6 py-5 text-right text-[10px] font-black text-slate-600 uppercase tracking-widest">{t.valueUsd}</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {periodTransactions.length === 0 ? (
                    <tr><td colSpan={4} className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No data recorded</td></tr>
                 ) : (
                    periodTransactions.map(tr => {
                        const isIncome = tr.entries.find(e => e.accountId === '1101')?.debit > 0;
                        const total = tr.entries.reduce((s, e) => s + (e.debit || 0), 0);
                        return (
                          <tr key={tr.id} className="hover:bg-slate-50 transition-colors">
                             <td className="px-6 py-5 text-[11px] font-bold text-slate-500 tabular-nums uppercase">{tr.date}</td>
                             <td className="px-6 py-5">
                                <div className="flex items-center gap-2">
                                  <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight leading-tight">{tr.description}</p>
                                  {tr.isHqEntry && (
                                    <span className="bg-indigo-100 text-indigo-700 text-[7px] font-black px-1.5 py-0.5 rounded border border-indigo-200 uppercase tracking-tighter">HQ Entry</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Ref: {tr.id.slice(-6)}</p>
                                  <span className="text-[8px] text-slate-300">•</span>
                                  <p className="text-[8px] text-indigo-400 font-black uppercase tracking-widest">{tr.branch}</p>
                                </div>
                             </td>
                             <td className="px-6 py-5">
                                <div className="flex items-center justify-center gap-2">
                                   <div className={`w-1.5 h-1.5 rounded-full ${tr.status === 'APPROVED' ? 'bg-emerald-500' : tr.status === 'REJECTED' ? 'bg-rose-500' : 'bg-amber-400 animate-pulse'}`}></div>
                                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">{tr.status}</span>
                                </div>
                             </td>
                             <td className="px-6 py-5 text-right">
                                <span className={`text-[12px] font-black tabular-nums ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                                   {isIncome ? '+' : '-'} $ {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                             </td>
                          </tr>
                        )
                    })
                 )}
              </tbody>
           </table>
         </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
              <header className="px-8 pt-8 pb-6 flex justify-between items-center bg-slate-50 border-b border-slate-200">
                 <div className="space-y-1">
                    <h3 className="text-lg lg:text-xl font-black text-slate-900 uppercase tracking-tight">{t.addTransaction}</h3>
                    <p className="text-[9px] lg:text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-none">Protocol Verification</p>
                 </div>
                 <button onClick={() => setShowModal(false)} className="w-10 h-10 bg-white text-slate-500 rounded-full flex items-center justify-center border border-slate-200 hover:text-rose-600 transition-colors shadow-sm">
                    <i className="fas fa-times"></i>
                 </button>
              </header>
              <form onSubmit={handleSubmit} className="p-6 lg:p-8 space-y-6 overflow-y-auto">
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 p-1 bg-slate-100 rounded-2xl">
                    {(['INCOME', 'EXPENSE', 'KASBON', 'TUTUP_KAS'] as const).map(tOpt => (
                      <button 
                         key={tOpt} type="button" onClick={() => setType(tOpt)}
                         className={`py-3 px-1 rounded-xl text-[8px] lg:text-[9px] font-black tracking-widest transition-all uppercase ${type === tOpt ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                         {tOpt === 'INCOME' ? t.income : tOpt === 'EXPENSE' ? t.expense_type : tOpt === 'KASBON' ? t.kasbon : t.close_kas}
                      </button>
                    ))}
                 </div>

                 <div className="space-y-4">
                    {isAdmin && (
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">{t.targetBranch}</label>
                         <select 
                          required 
                          value={targetBranch} 
                          onChange={(e) => setTargetBranch(e.target.value)}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-black text-[11px] uppercase outline-none focus:border-indigo-600 transition-all text-indigo-700"
                         >
                            {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                         </select>
                      </div>
                    )}

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">{t.ledgerCategory}</label>
                       <select 
                        required 
                        value={categoryCode} 
                        onChange={(e) => handleCategoryChange(e.target.value)} 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-black text-[11px] uppercase outline-none focus:border-indigo-600 transition-all text-slate-800"
                        disabled={type === 'TUTUP_KAS'}
                       >
                          <option value="">-- {t.category.toUpperCase()} --</option>
                          {filteredAccounts.map(acc => <option key={acc.code} value={acc.code}>{acc.code} - {acc.name[settings.language]}</option>)}
                       </select>
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">{t.memo}</label>
                       <input 
                        required 
                        value={desc} 
                        onChange={(e) => setDesc(e.target.value)} 
                        placeholder="..." 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-black text-[11px] uppercase outline-none focus:border-indigo-600 transition-all text-slate-800 placeholder:text-slate-400" 
                       />
                    </div>

                    <div className="space-y-1.5 pt-2">
                       <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1 text-center block">{t.valueUsd}</label>
                       <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-indigo-600 text-2xl">$</span>
                          <input type="number" step="0.01" required value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 text-slate-900 rounded-[2rem] pl-12 pr-6 py-4 lg:py-5 font-black text-2xl lg:text-3xl tabular-nums outline-none transition-all shadow-inner text-center" />
                       </div>
                    </div>
                 </div>

                 <button type="submit" className="w-full py-4 lg:py-5 rounded-3xl font-black text-[10px] lg:text-[11px] uppercase text-white shadow-xl bg-indigo-600 hover:bg-indigo-700 tracking-[0.2em] transition-all active:scale-[0.98]">
                    {t.commitEntry}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManager;
