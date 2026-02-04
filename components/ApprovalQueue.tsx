

import React, { useState, useEffect } from 'react';
import { Transaction, TransactionStatus, AppSettings, Account, LedgerEntry, AuditLog } from '../types';
import { TRANSLATIONS } from '../constants';

interface ApprovalQueueProps {
  transactions: Transaction[];
  onUpdateTransaction: (id: string, updatedData: Partial<Transaction>, action?: AuditLog['action'], details?: string) => void;
  settings: AppSettings;
  accounts: Account[];
}

const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ transactions, onUpdateTransaction, settings, accounts }) => {
  const t = TRANSLATIONS[settings.language];
  const pending = transactions.filter(tr => tr.status === 'PENDING');
  const [notification, setNotification] = useState<{message: string; type: 'SUCCESS' | 'ERROR'} | null>(null);
  const [editingTr, setEditingTr] = useState<Transaction | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editAcc, setEditAcc] = useState('');

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleAction = (id: string, status: TransactionStatus, desc: string) => {
    onUpdateTransaction(id, { status }, status === 'APPROVED' ? 'APPROVED' : 'REJECTED', status === 'APPROVED' ? 'Pusat menyetujui.' : 'Pusat menolak.');
    setNotification({ message: status === 'APPROVED' ? `Approved: ${desc}` : `Rejected: ${desc}`, type: status === 'APPROVED' ? 'SUCCESS' : 'ERROR' });
  };

  const handleUpdateAndApprove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTr) return;
    const isIncome = editingTr.entries.find(e => e.accountId === '1101')?.debit > 0;
    const cashAccount = '1101';
    const entries = isIncome 
      ? [{ accountId: cashAccount, debit: editAmount, credit: 0 }, { accountId: editAcc, debit: 0, credit: editAmount }]
      : [{ accountId: editAcc, debit: editAmount, credit: 0 }, { accountId: cashAccount, debit: 0, credit: editAmount }];

    onUpdateTransaction(editingTr.id, { description: editDesc.toUpperCase(), status: 'APPROVED', entries }, 'UPDATED', 'Koreksi pusat.');
    setNotification({ message: `Corrected & Approved: ${editDesc}`, type: 'SUCCESS' });
    setEditingTr(null);
  };

  return (
    <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-6 lg:space-y-10 relative">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight uppercase italic leading-none">{t.approvals}</h2>
            <span className="bg-indigo-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-md">Authorization HQ</span>
          </div>
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest italic leading-none">Pending central validation</p>
        </div>
      </header>

      {pending.length === 0 ? (
        <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-100 py-20 flex flex-col items-center justify-center text-slate-400">
          <i className="fas fa-check-double text-5xl mb-4 opacity-20"></i>
          <p className="text-[9px] font-black uppercase tracking-widest">Everything is up to date</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pending.map((tr) => {
             const amount = tr.entries.reduce((s, e) => s + (e.debit > 0 ? e.debit : 0), 0);
             const isIncome = tr.entries.find(e => e.accountId === '1101')?.debit > 0;
             return (
              <div key={tr.id} className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-l-4 lg:border-l-8 border-l-amber-400 group">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[8px] font-black bg-slate-800 text-white px-2 py-0.5 rounded uppercase tracking-tighter">{tr.type}</span>
                    <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">{tr.branch}</span>
                  </div>
                  <h3 className="text-base lg:text-lg font-black text-slate-900 uppercase truncate leading-tight tracking-tight">{tr.description}</h3>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{tr.date}</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 lg:gap-10">
                  <div className="text-left sm:text-right min-w-[100px]">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total</p>
                    <p className={`text-xl font-black tabular-nums ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>$ {amount.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => { setEditingTr(tr); setEditDesc(tr.description); setEditAmount(amount); setEditAcc(tr.entries.find(e => e.accountId !== '1101')?.accountId || ''); }} className="flex-1 sm:flex-none w-10 lg:w-12 h-10 lg:h-12 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center border border-slate-100"><i className="fas fa-edit"></i></button>
                    <button onClick={() => handleAction(tr.id, 'REJECTED', tr.description)} className="flex-1 sm:flex-none w-10 lg:w-12 h-10 lg:h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center"><i className="fas fa-times"></i></button>
                    <button onClick={() => handleAction(tr.id, 'APPROVED', tr.description)} className="flex-[2] sm:flex-none bg-emerald-600 text-white px-6 lg:px-8 py-3 lg:py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md">Approve</button>
                  </div>
                </div>
              </div>
             );
          })}
        </div>
      )}

      {editingTr && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl lg:rounded-[3rem] shadow-2xl overflow-hidden">
            <header className="p-8 lg:p-10 pb-6 bg-indigo-600 text-white flex justify-between items-center">
              <div><h3 className="text-xl font-black uppercase tracking-tight leading-none mb-1">Review Pusat</h3><p className="text-[9px] font-bold opacity-80 uppercase tracking-widest italic">Cabang: {editingTr.branch}</p></div>
              <button onClick={() => setEditingTr(null)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"><i className="fas fa-times"></i></button>
            </header>
            <form onSubmit={handleUpdateAndApprove} className="p-8 lg:p-10 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Kategori Akun</label>
                  <select required value={editAcc} onChange={(e) => setEditAcc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-xs uppercase outline-none focus:ring-4 focus:ring-indigo-500/10 text-slate-800">
                    {accounts.map(cat => <option key={cat.code} value={cat.code}>{cat.name[settings.language]}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Deskripsi</label>
                  <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-xs uppercase outline-none text-slate-800" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                </div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nominal (USD)</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-indigo-600">$</span>
                    <input type="number" required step="0.01" className="w-full bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 text-slate-900 rounded-2xl pl-10 pr-5 py-5 font-black text-3xl tabular-nums outline-none transition-all shadow-inner" value={editAmount} onChange={(e) => setEditAmount(Number(e.target.value))} />
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full py-5 rounded-2xl font-black text-[10px] uppercase text-white shadow-xl bg-indigo-600 hover:bg-indigo-700 transition-all tracking-widest">Update & Approve</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalQueue;