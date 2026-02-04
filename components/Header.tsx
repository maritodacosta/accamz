

import React, { useState, useRef, useEffect } from 'react';
import { User, AppSettings, Language, BranchData } from '../types';
import { TRANSLATIONS } from '../constants';

interface HeaderProps {
  user: User;
  settings: AppSettings;
  branches: BranchData[];
  onLogout: () => void;
  onBranchSwitch: (branchName: string) => void;
  onUpdateSettings: (s: AppSettings) => void;
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, settings, branches, onLogout, onBranchSwitch, onUpdateSettings, onMenuClick }) => {
  const t = TRANSLATIONS[settings.language];
  const languages: Language[] = ['ID', 'EN', 'TET'];
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBranchMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-20 lg:h-24 bg-white/95 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 lg:px-12 shrink-0 z-[60]">
      <div className="flex items-center gap-3 lg:gap-8 min-w-0 flex-1">
        <button onClick={onMenuClick} className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-600 bg-slate-50 rounded-xl shrink-0">
           <i className="fas fa-bars"></i>
        </button>

        <div className="hidden lg:flex items-center gap-3 shrink-0">
           <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 overflow-hidden">
              {settings.companyLogo ? (
                <img src={settings.companyLogo} className="w-full h-full object-contain p-1.5" alt="Logo" />
              ) : (
                <i className="fas fa-landmark text-indigo-600"></i>
              )}
           </div>
           <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>
        </div>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => user.role === 'ADMIN' && setIsBranchMenuOpen(!isBranchMenuOpen)}
            className={`flex items-center gap-3 bg-slate-50 hover:bg-slate-100 transition-all px-4 py-2 rounded-2xl border border-slate-100 shadow-sm overflow-hidden group ${user.role !== 'ADMIN' ? 'cursor-default' : 'cursor-pointer'}`}
          >
             <div className="w-6 h-6 bg-indigo-600/10 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
               <i className="fas fa-building text-[10px]"></i>
             </div>
             <div className="text-left">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t.branch}</p>
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none truncate block max-w-[120px]">
                  {user.branch === 'ALL' ? t.allBranches : user.branch}
                </span>
             </div>
             {user.role === 'ADMIN' && (
               <i className={`fas fa-chevron-down text-[8px] text-slate-400 transition-transform duration-300 ${isBranchMenuOpen ? 'rotate-180' : ''}`}></i>
             )}
          </button>

          {/* Elegant Dropdown Menu */}
          {isBranchMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[70]">
               <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t.switchBranch}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">Live Access</span>
                  </div>
               </div>
               <div className="max-h-64 overflow-y-auto no-scrollbar p-1">
                  <button 
                    onClick={() => { onBranchSwitch('ALL'); setIsBranchMenuOpen(false); }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between ${user.branch === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
                  >
                    <span>{t.allBranches}</span>
                    {user.branch === 'ALL' && <i className="fas fa-check text-[8px]"></i>}
                  </button>
                  {branches.map(b => (
                    <button 
                      key={b.id}
                      onClick={() => { onBranchSwitch(b.name); setIsBranchMenuOpen(false); }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between ${user.branch === b.name ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
                    >
                      <div className="flex flex-col">
                        <span>{b.name}</span> {/* Reverted to actual branch name */}
                        <span className={`text-[7px] font-bold ${user.branch === b.name ? 'text-white/70' : 'text-slate-400'}`}>NODE: {b.code}</span>
                      </div>
                      {user.branch === b.name && <i className="fas fa-check text-[8px]"></i>}
                    </button>
                  ))}
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-10 shrink-0 ml-4">
        {/* Security Indicator */}
        <div className="hidden lg:flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
           <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
           <div className="text-left leading-none">
              <p className="text-[7px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">{t.secureSession}</p>
              <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-tighter">Level A Encryption</p>
           </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl">
           {languages.map(l => (
             <button
               key={l}
               onClick={() => onUpdateSettings({...settings, language: l})}
               className={`px-2 lg:px-3 py-1.5 rounded-lg text-[8px] lg:text-[9px] font-black transition-all ${settings.language === l ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
             >
               {l}
             </button>
           ))}
        </div>

        <div className="h-8 w-[1px] bg-slate-200 hidden sm:block"></div>

        <div className="flex items-center gap-2 lg:gap-6">
           <div className="text-right hidden lg:block">
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">{user.name}</p>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">{user.role}</p>
           </div>
           <button 
             onClick={onLogout}
             className="w-10 h-10 lg:w-12 lg:h-12 bg-rose-50 text-rose-500 rounded-xl lg:rounded-2xl border border-rose-100 hover:bg-rose-600 hover:text-white transition-all group flex items-center justify-center shadow-sm"
           >
             <i className="fas fa-power-off text-sm group-hover:scale-110 transition-transform"></i>
           </button>
        </div>
      </div>
    </header>
  );
};

export default Header;