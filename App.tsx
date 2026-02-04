
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
import ManualView from './components/ManualView';
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

  const IDLE_TIMEOUT = 15 * 60 * 1000;
  
  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    sessionStorage.clear();
    setActiveView('DASHBOARD');
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
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

        if (!usersRes.success) {
           if (usersRes.message?.includes("fetch")) {
              throw new Error("Network Error: Could not reach Supabase.");
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
          setUsers(usersRes.data.map(u => ({ ...u, branch: u.branch_name })));
        }
        if (accountsRes.success && accountsRes.data) {
          setAccounts(accountsRes.data.map(acc => ({
            ...acc,
            name: { ID: acc.name_id, EN: acc.name_en, TET: acc.name_tet } 
          })));
        }
        if (transactionsRes.success && transactionsRes.data) {
          setTransactions(transactionsRes.data.map(tr => ({
            id: tr.id, date: tr.date, description: tr.description, referenceNumber: tr.reference_number,
            branch: tr.branch_name, userId: tr.user_id, status: tr.status, type: tr.type,
            approvedBy: tr.approved_by_user_id, isHqEntry: tr.is_hq_entry,
            createdAt: new Date(tr.created_at).getTime(),
            entries: tr.ledger_entries ? tr.ledger_entries.map((entry: any) => ({
              accountId: entry.account_code, debit: parseFloat(entry.debit), credit: parseFloat(entry.credit)
            })) : [],
            logs: []
          })));
        }
        if (inventoryRes.success && inventoryRes.data) {
          setInventory(inventoryRes.data.map(item => ({
            ...item, referenceNumber: item.reference_number, stockIn: item.stock_in,
            stockOut: item.stock_out, branch: item.branch_name, updatedAt: new Date(item.updated_at).getTime(),
          })));
        }

      } catch (error: any) {
        setConnectionError(error.message || "Failed to connect to Supabase.");
      } finally {
        setIsLoadingApp(false);
      }
    };
    loadInitialData();
  }, [isAuthenticated]); 

  useEffect(() => {
    if (!isAuthenticated) return;
    let timeoutId: number;
    const resetTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
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
  }, [isAuthenticated, handleLogout, IDLE_TIMEOUT]);

  const handleLogin = (user: User, token: string) => { 
    const loginUser = { ...user };
    if (loginUser.role === 'ADMIN') loginUser.branch = 'ALL';
    else loginUser.branch = user.branch || (user as any).branch_name;
    
    setCurrentUser(loginUser);
    setIsAuthenticated(true);
    sessionStorage.setItem('amizade_session', 'active');
    sessionStorage.setItem('amizade_user', JSON.stringify(loginUser));
  };

  const branchTransactions = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'ADMIN' && currentUser.branch === 'ALL') return transactions;
    return transactions.filter(t => t.branch === currentUser.branch);
  }, [transactions, currentUser]);

  const periodTransactions = useMemo(() => {
    const lastCloseIdx = branchTransactions.findIndex(t => t.type === 'CLOSE_KAS' && t.status === 'APPROVED');
    return lastCloseIdx !== -1 ? branchTransactions.slice(0, lastCloseIdx + 1) : branchTransactions;
  }, [branchTransactions]);

  const addTransaction = async (t: Transaction) => {
    const payload = {
      id: t.id, date: t.date, description: t.description, branch_name: t.branch,
      user_id: t.userId, status: t.status, type: t.type, approved_by_user_id: t.approvedBy,
      is_hq_entry: t.isHqEntry,
      entries: t.entries.map(e => ({ account_code: e.accountId, debit: e.debit, credit: e.credit })),
    };
    const response = await callApi<any>('transactions', 'POST', payload);
    if (response.success) window.location.reload();
  };

  const updateTransaction = async (id: string, updatedData: Partial<Transaction>) => {
    const response = await callApi<any>(`transactions/${id}`, 'PUT', updatedData);
    if (response.success) window.location.reload();
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

  const renderContent = () => {
    const isAdmin = currentUser?.role === 'ADMIN';
    switch (activeView) {
      case 'DASHBOARD': return <Dashboard transactions={periodTransactions} globalTransactions={branchTransactions} user={currentUser!} settings={settings} accounts={accounts} />;
      case 'TRANSACTIONS': return <TransactionManager transactions={branchTransactions} periodTransactions={periodTransactions} onAdd={addTransaction} user={currentUser!} settings={settings} accounts={accounts} branches={branches} />;
      case 'INVENTORY': return <InventoryView inventory={inventory} onUpdateInventory={() => {}} user={currentUser!} settings={settings} />;
      case 'APPROVALS': return isAdmin ? <ApprovalQueue transactions={transactions} onUpdateTransaction={updateTransaction} settings={settings} accounts={accounts} /> : null;
      case 'REPORTS': return <ReportsView transactions={periodTransactions} settings={settings} accounts={accounts} branchName={currentUser?.branch} />;
      case 'SETTINGS': return isAdmin ? <SettingsView settings={settings} onUpdateSettings={updateSettingsInApp} accounts={accounts} onUpdateAccounts={async () => {}} /> : null;
      case 'USERS': return isAdmin ? <UserManagement users={users} onUpdateUsers={() => {}} branches={branches} /> : null;
      case 'BRANCHES': return isAdmin ? <BranchManagement branches={branches} onUpdateBranches={() => {}} /> : null;
      case 'MANUAL': return <ManualView settings={settings} />;
      default: return null;
    }
  };

  if (!isAuthenticated || !currentUser) {
    return <Login onLogin={handleLogin} settings={settings} />;
  }

  if (connectionError) {
    return <div className="p-20 text-center font-black uppercase text-rose-600">{connectionError}</div>;
  }

  if (isLoadingApp) {
    return <div className="h-screen flex items-center justify-center font-black uppercase tracking-widest animate-pulse">Synchronizing Node...</div>;
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden print:block">
      <div className={`fixed inset-0 z-40 lg:relative lg:z-0 lg:flex ${isSidebarOpen ? 'block' : 'hidden lg:block'} print:hidden`}>
        <Sidebar activeView={activeView} onViewChange={(v) => { setActiveView(v); setIsSidebarOpen(false); }} user={currentUser} settings={settings} transactions={transactions} />
      </div>
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden print:block">
        <Header user={currentUser} settings={settings} branches={branches} onLogout={handleLogout} onBranchSwitch={(b) => setCurrentUser({...currentUser, branch: b})} onUpdateSettings={updateSettingsInApp} onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-y-auto bg-slate-50/50 pb-20 lg:pb-0 print:overflow-visible print:bg-white">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;