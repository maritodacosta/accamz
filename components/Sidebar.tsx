import React from 'react';
import { ViewState, User, AppSettings, Transaction } from '../types';
import { TRANSLATIONS } from '../constants';

interface SidebarProps {
  activeView: ViewState;
  onViewChange: (v: ViewState) => void;
  user: User;
  settings: AppSettings;
  transactions?: Transaction[];
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, user, settings, transactions = [] }) => {
  const t = TRANSLATIONS[settings.language];
  const pendingCount = transactions.filter(tr => tr.status === 'PENDING').length;

  const navItems: { id: ViewState; label: string; icon: string; adminOnly?: boolean }[] = [
    { id: 'DASHBOARD', label: t.dashboard, icon: 'fa-grid-2' },
    { id: 'TRANSACTIONS', label: t.transactions, icon: 'fa-receipt' },
    { id: 'INVENTORY', label: t.inventory || 'Inventaris', icon: 'fa-boxes-stacked' },
    { id: 'APPROVALS', label: t.approvals, icon: 'fa-shield-check', adminOnly: true },
    { id: 'REPORTS', label: t.reports, icon: 'fa-chart-simple' },
    { id: 'BRANCHES', label: t.branches, icon: 'fa-sitemap', adminOnly: true },
    { id: 'USERS', label: t.operators, icon: 'fa-users-gear', adminOnly: true },
    { id: 'SETTINGS', label: t.settings, icon: 'fa-gears', adminOnly: true },
    { id: 'MANUAL', label: 'Buku Petunjuk', icon: 'fa-book-open' },
  ];

  return (
    <aside className="w-full lg:w-80 bg-slate-900 h-full flex flex-col p-6 lg:p-8 text-white shrink-0 shadow-2xl z-20 overflow-hidden">
      <div className="flex items-center gap-4 mb-8 lg:mb-12 px-2">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden border border-white/5">
          {settings.companyLogo ? (
            <img src={settings.companyLogo} className="w-full h-full object-contain p-1.5" alt="Logo" />
          ) : (
            <i className="fas fa-landmark-dome text-indigo-400 text-lg"></i>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-black tracking-[0.2em] leading-none uppercase truncate">{settings.companyName}</h1>
          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1.5 opacity-80">Corporate ERP System</p>
        </div>
      </div>

      <nav className="space-y-1.5 flex-1 overflow-y-auto no-scrollbar">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 px-4 hidden lg:block">Navigation</p>
        {navItems.map((item) => {
          if (item.adminOnly && user.role !== 'ADMIN') return null;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-[10px] font-black transition-all duration-300 group ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-4">
                <i className={`fas ${item.icon} text-sm ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'} transition-colors`}></i>
                <span className="uppercase tracking-[0.15em]">{item.label}</span>
              </div>
              {item.id === 'APPROVALS' && pendingCount > 0 && (
                <span className="bg-rose-500 text-white text-[8px] font-black px-2 py-0.5 rounded-lg">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <span className="text-indigo-400 font-black text-xs uppercase">{user.name.charAt(0)}</span>
           </div>
           <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest truncate">{user.name}</p>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{user.role}</p>
           </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;