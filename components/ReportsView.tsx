

import React, { useMemo, useState } from 'react';
import { Transaction, AppSettings, Account } from '../types';
import { TRANSLATIONS } from '../constants';
import { exportToPDF } from './pdfExport'; // Corrected import path to be relative within the same directory

interface ReportsViewProps {
  transactions: Transaction[];
  settings: AppSettings;
  accounts: Account[];
  branchName?: string;
}

const ReportsView: React.FC<ReportsViewProps> = ({ transactions, settings, accounts, branchName = "Default" }) => {
  const [reportType, setReportType] = useState<'PL' | 'BS' | 'HISTORY'>('PL');
  const [isExporting, setIsExporting] = useState(false);
  const t = TRANSLATIONS[settings.language];

  const APPROVED = transactions.filter(tr => tr.status === 'APPROVED' || tr.type === 'GENERAL');

  const balances = useMemo(() => {
    const b: Record<string, number> = {};
    APPROVED.forEach(tr => {
      tr.entries.forEach(e => {
        b[e.accountId] = (b[e.accountId] || 0) + (e.debit - e.credit);
      });
    });
    return b;
  }, [APPROVED]);

  const plData = useMemo(() => {
    const revenue = accounts.filter(a => a.type === 'REVENUE').map(a => ({ ...a, bal: -(balances[a.code] || 0) }));
    const expense = accounts.filter(a => a.type === 'EXPENSE').map(a => ({ ...a, bal: (balances[a.code] || 0) }));
    const totalRev = revenue.reduce((s, a) => s + a.bal, 0);
    const totalExp = expense.reduce((s, a) => s + a.bal, 0);
    return { revenue, expense, totalRev, totalExp, net: totalRev - totalExp };
  }, [balances, accounts]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    let title = "";
    let headers: string[] = [];
    let data: any[][] = [];
    let summary: { label: string; value: string }[] = [];

    if (reportType === 'PL') {
      title = "Income Statement (Profit & Loss)";
      headers = ["Code", "Description", "Classification", "Amount (USD)"];
      const revRows = plData.revenue.map(a => [a.code, a.name[settings.language], "REVENUE", `$ ${a.bal.toLocaleString(undefined, {minimumFractionDigits: 2})}`]);
      const expRows = plData.expense.map(a => [a.code, a.name[settings.language], "OPERATING EXPENSE", `($ ${a.bal.toLocaleString(undefined, {minimumFractionDigits: 2})})`]);
      data = [...revRows, ...expRows];
      summary = [
        { label: "GROSS REVENUE:", value: `$ ${plData.totalRev.toLocaleString(undefined, {minimumFractionDigits: 2})}` },
        { label: "TOTAL OPERATING COST:", value: `($ ${plData.totalExp.toLocaleString(undefined, {minimumFractionDigits: 2})})` },
        { label: "NET INCOME / LOSS:", value: `$ ${plData.net.toLocaleString(undefined, {minimumFractionDigits: 2})}` }
      ];
    } else if (reportType === 'BS') {
      title = "Statement of Financial Position (Balance Sheet)";
      headers = ["Account Code", "Account Description", "Type", "Balance (USD)"];
      data = accounts.filter(a => ['ASSET', 'LIABILITY', 'EQUITY', 'KASBON'].includes(a.type)).map(a => [
        a.code, a.name[settings.language], a.type, `$ ${(balances[a.code] || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`
      ]);
    } else {
      title = "General Ledger Detail Report";
      headers = ["Date", "Reference", "Account Ledger / Memo", "Debit", "Credit"];
      data = APPROVED.flatMap(tr => tr.entries.map((e, idx) => [
        idx === 0 ? tr.date : "",
        idx === 0 ? (tr.id.slice(-6)) : "",
        `${accounts.find(a => a.code === e.accountId)?.name[settings.language] || e.accountId}\nMemo: ${tr.description}`,
        e.debit > 0 ? `$ ${e.debit.toLocaleString(undefined, {minimumFractionDigits: 2})}` : "-",
        e.credit > 0 ? `$ ${e.credit.toLocaleString(undefined, {minimumFractionDigits: 2})}` : "-"
      ]));
    }

    try {
      await exportToPDF(title, headers, data, settings, branchName, summary);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-4 lg:p-10 max-w-full lg:max-w-6xl mx-auto space-y-6 lg:space-y-10 overflow-x-hidden">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tighter mb-1 uppercase italic leading-none">{t.reports}</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">{branchName} Operations Centre</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <button 
            onClick={handleExportPDF} 
            disabled={isExporting}
            className="h-12 px-6 bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:bg-rose-400 transition-all flex items-center justify-center gap-3 shadow-lg shadow-rose-600/20 active:scale-95"
          >
            <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-file-pdf'}`}></i>
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isExporting ? 'Processing...' : 'Generate Official PDF'}
            </span>
          </button>
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1 h-fit shadow-inner overflow-x-auto no-scrollbar whitespace-nowrap">
            {(['PL', 'BS', 'HISTORY'] as const).map(rt => (
              <button key={rt} onClick={() => setReportType(rt)} className={`px-4 py-2 rounded-lg text-[8px] lg:text-[9px] font-black tracking-widest transition-all ${reportType === rt ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                {rt === 'PL' ? 'LABA RUGI' : rt === 'BS' ? 'NERACA' : 'JURNAL'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="bg-white rounded-2xl lg:rounded-[2rem] p-6 lg:p-12 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-10 lg:mb-16">
          <div className="flex items-center gap-4">
            {settings.companyLogo ? (
              <img src={settings.companyLogo} className="h-10 lg:h-12 w-auto object-contain" alt="Logo" />
            ) : (
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><i className="fas fa-landmark"></i></div>
            )}
            <div className="space-y-0.5">
              <h1 className="text-lg lg:text-2xl font-black text-slate-900 tracking-tighter uppercase leading-tight">{settings.companyName}</h1>
              <p className="text-[8px] lg:text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">Audited Report</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
             <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Report Time</p>
             <p className="text-[10px] font-black text-slate-900 uppercase">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        {reportType === 'PL' && (
          <div className="space-y-10 lg:space-y-12 animate-in fade-in duration-500">
            <section>
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
                <span className="text-emerald-500 shrink-0">REVENUE</span>
                <div className="h-[1px] flex-1 bg-slate-100"></div>
              </h3>
              <div className="space-y-4 lg:space-y-5 px-2">
                {plData.revenue.map(a => (
                   <div key={a.code} className="flex justify-between items-center group">
                     <div className="min-w-0">
                       <span className="hidden sm:inline text-[9px] font-black text-slate-300 uppercase tracking-tighter mr-4">{a.code}</span>
                       <span className="text-[11px] lg:text-sm font-black text-slate-700 uppercase tracking-tight truncate">{a.name[settings.language]}</span>
                     </div>
                     <span className="tabular-nums font-black text-emerald-600 text-[11px] lg:text-base ml-4">$ {a.bal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                   </div>
                ))}
                <div className="pt-4 lg:pt-6 mt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest text-slate-400">Total Income</span>
                  <span className="text-lg lg:text-2xl font-black text-emerald-600 tabular-nums">$ {plData.totalRev.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              </div>
            </section>
            
            <section>
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
                <span className="text-rose-500 shrink-0">EXPENSES</span>
                <div className="h-[1px] flex-1 bg-slate-100"></div>
              </h3>
              <div className="space-y-4 lg:space-y-5 px-2">
                {plData.expense.map(a => (
                   <div key={a.code} className="flex justify-between items-center group">
                     <div className="min-w-0">
                       <span className="hidden sm:inline text-[9px] font-black text-slate-300 uppercase tracking-tighter mr-4">{a.code}</span>
                       <span className="text-[11px] lg:text-sm font-black text-slate-700 uppercase tracking-tight truncate">{a.name[settings.language]}</span>
                     </div>
                     <span className="tabular-nums font-black text-rose-600 text-[11px] lg:text-base ml-4">($ {a.bal.toLocaleString(undefined, {minimumFractionDigits: 2})})</span>
                   </div>
                ))}
                <div className="pt-4 lg:pt-6 mt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest text-slate-400">Total Expenses</span>
                  <span className="text-lg lg:text-2xl font-black text-rose-600 tabular-nums">($ {plData.totalExp.toLocaleString(undefined, {minimumFractionDigits: 2})})</span>
                </div>
              </div>
            </section>
            
            <div className={`p-8 lg:p-10 rounded-2xl lg:rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-6 shadow-xl ${plData.net >= 0 ? 'bg-indigo-600 shadow-indigo-600/20' : 'bg-rose-600 shadow-rose-600/20'} text-white`}>
               <div className="text-center sm:text-left">
                 <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-2">Net Period Performance</p>
                 <h4 className="text-2xl lg:text-5xl font-black tabular-nums tracking-tighter leading-none">$ {plData.net.toLocaleString(undefined, {minimumFractionDigits: 2})}</h4>
               </div>
               <div className="text-center sm:text-right max-w-[200px]">
                 <p className="text-[8px] lg:text-[9px] font-bold uppercase italic opacity-80 leading-relaxed">Verified by system protocol {new Date().getFullYear()}</p>
               </div>
            </div>
          </div>
        )}

        {reportType === 'BS' && (
          <div className="animate-in fade-in duration-500 space-y-10 lg:space-y-12">
            <section>
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-4">
                <span>BALANCES</span><div className="h-[1px] flex-1 bg-slate-100"></div>
              </h3>
              <div className="space-y-5 px-2">
                {accounts.filter(a => ['ASSET', 'LIABILITY', 'EQUITY', 'KASBON'].includes(a.type)).map(a => (
                   <div key={a.code} className="flex justify-between items-center group">
                     <div className="min-w-0">
                       <span className="hidden sm:inline text-[9px] font-black text-slate-300 uppercase tracking-tighter mr-6">{a.code}</span>
                       <span className="text-[11px] lg:text-sm font-black text-slate-700 uppercase tracking-tight truncate">{a.name[settings.language]}</span>
                     </div>
                     <span className={`tabular-nums font-black text-[11px] lg:text-base ml-4 ${balances[a.code] >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                       $ ${(balances[a.code] || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                     </span>
                   </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {reportType === 'HISTORY' && (
          <div className="animate-in fade-in duration-500 space-y-6">
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-4">
              <span>JOURNAL</span><div className="h-[1px] flex-1 bg-slate-100"></div>
            </h3>
            <div className="responsive-table-wrapper rounded-xl border border-slate-50 overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Account & Memo</th>
                    <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Debit</th>
                    <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[10px] lg:text-[11px] font-bold">
                  {APPROVED.length === 0 ? (
                    <tr><td colSpan={4} className="p-10 text-center text-slate-300 uppercase tracking-widest">No transaction history</td></tr>
                  ) : (
                    APPROVED.map(tr => tr.entries.map((e, idx) => (
                      <tr key={`${tr.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 text-slate-400 whitespace-nowrap">{idx === 0 ? tr.date : ""}</td>
                        <td className="px-5 py-4">
                          <span className="text-slate-900 uppercase tracking-tight">{accounts.find(a => a.code === e.accountId)?.name[settings.language] || e.accountId}</span>
                          {idx === 0 && <span className="block text-[8px] text-slate-400 uppercase font-black tracking-tight mt-1 opacity-70 italic truncate max-w-[150px] sm:max-w-[250px]">{tr.description}</span>}
                        </td>
                        <td className="px-5 py-4 text-right tabular-nums text-emerald-600">{e.debit > 0 ? `$ ${e.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}</td>
                        <td className="px-5 py-4 text-right tabular-nums text-rose-600">{e.credit > 0 ? `$ ${e.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}</td>
                      </tr>
                    )))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsView;