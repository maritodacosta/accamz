
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  User, Transaction, AppSettings, ViewState, 
  BranchData, Account, InventoryItem, SettingEntry, AuditLog
} from './types';
import { TRANSLATIONS } from './constants';
import { callApi } from './utils/api';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TransactionManager from './components/TransactionManager';
import ApprovalQueue from './components/ApprovalQueue';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import UserManagement from './components/UserManagement';
import BranchManagement from './components/BranchManagement';
import InventoryView from './components/InventoryView';
import Login from './components/Login';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => sessionStorage.getItem('amizade_session') === 'active');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('amizade_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeView, setActiveView] = useState<ViewState>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings>({
    language: 'ID', currency: 'USD', dateFormat: 'DD/MM/YYYY',
    isKasbonEnabled: true, isApprovalRequired: true, companyName: 'AMIZADE FINANCE',
    companyAddress: '', companyPhone: '', companyEmail: '', companyLogo: '', companyFavicon: ''
  });

  const [branches, setBranches] = useState<BranchData[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const [isLoadingApp, setIsLoadingApp] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Security: Auto-lock after 15 minutes of inactivity
  const IDLE_TIMEOUT = 15 * 60 * 1000;
  
  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    sessionStorage.clear();
    setActiveView('DASHBOARD');
  }, []);

  // Initial Data Load
  useEffect(() => {
    const loadInitialData = async () => {
      // Always try to fetch settings first even if not authenticated to get company name/logo
      // but for now we follow the auth logic
      if (!isAuthenticated) {
        setIsLoadingApp(false);
        return;
      }

      setIsLoadingApp(true);
      setConnectionError(null);
      
      try {
        const [settingsRes, branchesRes, usersRes, accountsRes, transactionsRes, inventoryRes] = await Promise.all([
          callApi<SettingEntry[]>('settings', 'GET'),
          callApi<BranchData[]>('branches', 'GET'),
          callApi<any[]>('users', 'GET'),
          callApi<any[]>('accounts', 'GET'),
          callApi<any[]>('transactions', 'GET'),
          callApi<any[]>('inventory', 'GET'),
        ]);

        // Check for critical failures (e.g. database connection)
        if (!usersRes.success) {
           if (usersRes.message?.includes("fetch")) {
              throw new Error("Network Error: Could not reach Supabase. Check your internet connection.");
           }
           if (usersRes.message?.includes("relation") || usersRes.message?.includes("does not exist")) {
              throw new Error("Database Missing: Tables do not exist. Please run the Setup SQL.");
           }
           if (usersRes.message?.includes("auth") || usersRes.message?.includes("key")) {
             // If user says key is correct, maybe RLS is blocking? But usually key error is clear.
             throw new Error("Authentication Error: " + usersRes.message);
           }
        }

        if (settingsRes.success && settingsRes.data) {
          const fetchedSettings: any = {};
          settingsRes.data.forEach((setting) => {
              let val: any = setting.value;
              if (val === 'true') val = true;
              else if (val === 'false') val = false;
              fetchedSettings[setting.key_name] = val;
          });
          setSettings(prev => ({...prev, ...fetchedSettings}));
        }

        if (branchesRes.success && branchesRes.data) setBranches(branchesRes.data);

        if (usersRes.success && usersRes.data) {
          setUsers(usersRes.data.map(u => ({
            ...u,
            branch: u.branch_name, 
          })));
        }

        if (accountsRes.success && accountsRes.data) {
          setAccounts(accountsRes.data.map(acc => ({
            ...acc,
            name: { ID: acc.name_id, EN: acc.name_en, TET: acc.name_tet } 
          })));
        }

        if (transactionsRes.success && transactionsRes.data) {
          setTransactions(transactionsRes.data.map(tr => ({
            id: tr.id,
            date: tr.date,
            description: tr.description,
            referenceNumber: tr.reference_number,
            branch: tr.branch_name,
            userId: tr.user_id,
            status: tr.status,
            type: tr.type,
            approvedBy: tr.approved_by_user_id,
            isHqEntry: tr.is_hq_entry,
            createdAt: new Date(tr.created_at).getTime(),
            entries: tr.ledger_entries ? tr.ledger_entries.map((entry: any) => ({
              accountId: entry.account_code,
              debit: parseFloat(entry.debit),
              credit: parseFloat(entry.credit)
            })) : [],
            logs: []
          })));
        }

        if (inventoryRes.success && inventoryRes.data) {
          setInventory(inventoryRes.data.map(item => ({
            ...item,
            referenceNumber: item.reference_number,
            stockIn: item.stock_in,
            stockOut: item.stock_out,
            branch: item.branch_name,
            updatedAt: new Date(item.updated_at).getTime(),
          })));
        }

      } catch (error: any) {
        console.error("Failed to load initial data:", error);
        setConnectionError(error.message || "Failed to connect to Supabase.");
      } finally {
        setIsLoadingApp(false);
      }
    };
    loadInitialData();
  }, [isAuthenticated]); 

  // Idle Timer
  useEffect(() => {
    if (!isAuthenticated) return;
    let timeoutId: number;
    const resetTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        alert(TRANSLATIONS[settings.language].sessionLocked);
        handleLogout();
      }, IDLE_TIMEOUT);
    };
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(e => document.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      window.clearTimeout(timeoutId);
      events.forEach(e => document.removeEventListener(e, resetTimer));
    };
  }, [isAuthenticated, handleLogout, settings.language, IDLE_TIMEOUT]);

  // Update Title/Favicon
  useEffect(() => {
    document.title = `${settings.companyName} - ERP`;
    if (settings.companyFavicon) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = settings.companyFavicon;
    }
  }, [settings]);

  const handleLogin = (user: User, token: string) => { 
    const loginUser = { ...user };
    // Normalize role branch access
    if (loginUser.role === 'ADMIN') {
      loginUser.branch = 'ALL';
    } else {
      loginUser.branch = user.branch || (user as any).branch_name;
    }
    
    setCurrentUser(loginUser);
    setIsAuthenticated(true);
    sessionStorage.setItem('amizade_session', 'active');
    sessionStorage.setItem('amizade_user', JSON.stringify(loginUser));
  };

  const branchTransactions = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'ADMIN' && currentUser.branch === 'ALL') {
      return transactions;
    }
    return transactions.filter(t => t.branch === currentUser.branch);
  }, [transactions, currentUser]);

  const periodTransactions = useMemo(() => {
    const lastCloseIdx = branchTransactions.findIndex(t => t.type === 'CLOSE_KAS' && t.status === 'APPROVED');
    return lastCloseIdx !== -1 ? branchTransactions.slice(0, lastCloseIdx + 1) : branchTransactions;
  }, [branchTransactions]);

  // --- CRUD OPERATIONS WRAPPERS (Mapping Frontend to Backend Fields) ---

  const addTransaction = async (t: Transaction) => {
    const payload = {
      id: t.id,
      date: t.date,
      description: t.description,
      branch_name: t.branch,
      user_id: t.userId,
      status: t.status,
      type: t.type,
      approved_by_user_id: t.approvedBy,
      is_hq_entry: t.isHqEntry,
      entries: t.entries.map(e => ({
        account_code: e.accountId,
        debit: e.debit,
        credit: e.credit,
      })),
    };

    const response = await callApi<any>('transactions', 'POST', payload);
    if (response.success) {
      window.location.reload(); // Simple reload to sync ID and timestamps from DB
    } else {
      alert("Failed to add transaction: " + response.message);
    }
  };

  const updateTransaction = async (id: string, updatedData: Partial<Transaction>, auditAction?: AuditLog['action'], auditDetails?: string) => {
    const payload: any = { ...updatedData };
    if (updatedData.entries) {
      payload.entries = updatedData.entries.map(e => ({
        account_code: e.accountId,
        debit: e.debit,
        credit: e.credit,
      }));
    }
    
    const response = await callApi<any>(`transactions/${id}`, 'PUT', payload);
    
    if (response.success) {
      const updatedTr = {
        ...transactions.find(t => t.id === id)!,
        ...updatedData
      };
      setTransactions(prev => prev.map(t => t.id === id ? updatedTr : t));
    } else {
      alert("Failed to update transaction: " + response.message);
    }
  };

  const updateSettingsInApp = useCallback(async (newSettings: AppSettings) => {
    for (const key in newSettings) {
      const val = (newSettings as any)[key];
      if (val !== (settings as any)[key]) {
        await callApi(`settings/${key}`, 'PUT', { key_name: key, value: String(val) });
      }
    }
    setSettings(newSettings);
  }, [settings]);

  const updateAccountsInApp = useCallback(async (updatedAccounts: Account[]) => {
    window.location.reload(); 
  }, []);

  const updateUsersInApp = useCallback(async (updatedUsers: User[]) => {
    setUsers(updatedUsers);
  }, []);

  const updateBranchesInApp = useCallback(async (updatedBranches: BranchData[]) => {
    setBranches(updatedBranches);
  }, []);

  const updateInventoryInApp = useCallback(async (updatedInventory: InventoryItem[]) => {
    setInventory(updatedInventory);
  }, []);


  if (!isAuthenticated || !currentUser) {
    return <Login onLogin={handleLogin} settings={settings} />;
  }

  // --- ERROR STATE UI ---
  if (connectionError) {
    const SETUP_SQL = `-- Run this in Supabase SQL Editor to fix 'Database Missing' error
CREATE TABLE IF NOT EXISTS branches (id TEXT PRIMARY KEY, name TEXT UNIQUE, location TEXT, code TEXT UNIQUE);
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, password_hash TEXT, name TEXT, role TEXT, branch_name TEXT, avatar TEXT);
CREATE TABLE IF NOT EXISTS accounts (code TEXT PRIMARY KEY, name_id TEXT, name_en TEXT, name_tet TEXT, type TEXT, balance_type TEXT);
CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, date DATE, description TEXT, reference_number TEXT, branch_name TEXT, user_id TEXT, status TEXT, type TEXT, approved_by_user_id TEXT, is_hq_entry BOOLEAN, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ);
CREATE TABLE IF NOT EXISTS ledger_entries (id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, transaction_id TEXT REFERENCES transactions(id), account_code TEXT, debit NUMERIC, credit NUMERIC);
CREATE TABLE IF NOT EXISTS inventory_items (id TEXT PRIMARY KEY, code TEXT UNIQUE, category TEXT, reference_number TEXT, stock_in INTEGER, stock_out INTEGER, branch_name TEXT, updated_at TIMESTAMPTZ);
CREATE TABLE IF NOT EXISTS settings (key_name TEXT PRIMARY KEY, value TEXT);
-- Seed
INSERT INTO branches VALUES ('BR-HQ', 'HEADQUARTERS', 'Pusat', 'HQ') ON CONFLICT DO NOTHING;
INSERT INTO users VALUES ('USR-ADMIN', 'admin', 'password123', 'Administrator', 'ADMIN', 'HEADQUARTERS', NULL) ON CONFLICT DO NOTHING;
INSERT INTO settings VALUES ('language', 'ID'), ('currency', 'USD'), ('companyName', 'AMIZADE ERP') ON CONFLICT DO NOTHING;
INSERT INTO accounts VALUES ('1101', 'Kas Utama', 'Main Cash', 'Osan', 'ASSET', 'DEBIT') ON CONFLICT DO NOTHING;
`;
    
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-slate-950 text-white p-6 text-center animate-in fade-in duration-500 overflow-y-auto">
         <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mb-6 border border-rose-500/20 shrink-0">
            <i className="fas fa-database text-3xl text-rose-500"></i>
         </div>
         <h2 className="text-2xl font-black uppercase tracking-widest mb-3">System Connection Error</h2>
         <p className="text-slate-400 font-medium mb-6 max-w-lg leading-relaxed text-sm bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono">
           {connectionError}
         </p>
         
         {connectionError.includes("Missing") && (
           <div className="w-full max-w-2xl bg-slate-900 rounded-xl border border-slate-800 p-4 mb-6 text-left">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quick Setup Script</span>
                 <button 
                   onClick={() => navigator.clipboard.writeText(SETUP_SQL)}
                   className="text-[10px] text-indigo-400 font-bold hover:text-white transition-colors"
                 >
                   COPY SQL
                 </button>
              </div>
              <pre className="text-[10px] text-slate-400 font-mono overflow-x-auto p-2 bg-black/30 rounded-lg h-32 whitespace-pre-wrap">
                {SETUP_SQL}
              </pre>
              <p className="text-[9px] text-slate-500 mt-2 italic">Copy code above, go to Supabase Dashboard &gt; SQL Editor &gt; New Query &gt; Paste &gt; Run.</p>
           </div>
         )}
         
         <div className="space-y-4">
            <button 
              onClick={() => window.location.reload()} 
              className="px-8 py-4 bg-indigo-600 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
            >
              Retry Connection
            </button>
         </div>
      </div>
    );
  }

  if (isLoadingApp) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white flex-col gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Synchronizing Data...</div>
      </div>
    );
  }

  const renderContent = () => {
    const isAdmin = currentUser.role === 'ADMIN';
    switch (activeView) {
      case 'DASHBOARD': return <Dashboard transactions={periodTransactions} globalTransactions={branchTransactions} user={currentUser} settings={settings} accounts={accounts} />;
      case 'TRANSACTIONS': return <TransactionManager transactions={branchTransactions} periodTransactions={periodTransactions} onAdd={addTransaction} user={currentUser} settings={settings} accounts={accounts} branches={branches} />;
      case 'INVENTORY': return <InventoryView inventory={inventory} onUpdateInventory={updateInventoryInApp} user={currentUser} settings={settings} />;
      case 'APPROVALS': return isAdmin ? <ApprovalQueue transactions={transactions} onUpdateTransaction={updateTransaction} settings={settings} accounts={accounts} /> : null;
      case 'REPORTS': return <ReportsView transactions={periodTransactions} settings={settings} accounts={accounts} branchName={currentUser.branch} />;
      case 'SETTINGS': return isAdmin ? <SettingsView settings={settings} onUpdateSettings={updateSettingsInApp} accounts={accounts} onUpdateAccounts={updateAccountsInApp} /> : null;
      case 'USERS': return isAdmin ? <UserManagement users={users} onUpdateUsers={updateUsersInApp} branches={branches} /> : null;
      case 'BRANCHES': return isAdmin ? <BranchManagement branches={branches} onUpdateBranches={updateBranchesInApp} /> : null;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden">
      <div className={`fixed inset-0 z-40 lg:relative lg:z-0 lg:flex ${isSidebarOpen ? 'block' : 'hidden lg:block'}`}>
        <div className="absolute inset-0 bg-slate-900/60 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        <Sidebar activeView={activeView} onViewChange={(v) => { setActiveView(v); setIsSidebarOpen(false); }} user={currentUser} settings={settings} transactions={transactions} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header 
          user={currentUser} 
          onLogout={handleLogout} 
          settings={settings} 
          branches={branches}
          onBranchSwitch={(bName) => currentUser.role === 'ADMIN' && setCurrentUser({...currentUser, branch: bName})}
          onUpdateSettings={updateSettingsInApp}
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/50 pb-20 lg:pb-0">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
