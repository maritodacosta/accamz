
import React, { useState, useMemo, useRef } from 'react';
import { AppSettings, Account, AccountType } from '../types';
import { TRANSLATIONS } from '../constants';
import { callApi } from '../utils/api';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => Promise<void>;
  accounts: Account[];
  onUpdateAccounts: (accounts: Account[]) => Promise<void>;
}

type CategoryTab = 'REVENUE' | 'EXPENSE' | 'OTHERS';
type BackupFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings, accounts, onUpdateAccounts }) => {
  const t = TRANSLATIONS[settings.language];
  const [showModal, setShowModal] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Account | null>(null);
  const [activeTab, setActiveTab] = useState<CategoryTab>('REVENUE');
  const [backupFreq, setBackupFreq] = useState<BackupFrequency>('DAILY');
  const [isProcessing, setIsProcessing] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const [accCode, setAccCode] = useState('');
  const [accType, setAccType] = useState<AccountType>('EXPENSE');
  const [nameId, setNameId] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameTet, setNameTet] = useState('');

  const updateSettingField = async (field: keyof AppSettings, val: any) => {
    const newSettings = { ...settings, [field]: val };
    await onUpdateSettings(newSettings);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64Image = ev.target?.result as string;
        await updateSettingField('companyLogo', base64Image);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64Image = ev.target?.result as string;
        await updateSettingField('companyFavicon', base64Image);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackup = () => {
    alert("Database backup is managed via Supabase Dashboard.");
  };

  const handleRestore = () => {
    alert("Database restoration is managed via Supabase Dashboard.");
  };

  const handleOpenModal = (acc?: Account) => {
    if (acc) {
      setEditingAcc(acc); setAccCode(acc.code); setAccType(acc.type);
      setNameId(acc.name.ID); setNameEn(acc.name.EN); setNameTet(acc.name.TET);
    } else {
      setEditingAcc(null); setAccCode('');
      setAccType(activeTab === 'REVENUE' ? 'REVENUE' : (activeTab === 'EXPENSE' ? 'EXPENSE' : 'ASSET'));
      setNameId(''); setNameEn(''); setNameTet('');
    }
    setShowModal(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const payload = {
      code: accCode.toUpperCase(), 
      type: accType,
      balance_type: ['REVENUE', 'EQUITY', 'LIABILITY'].includes(accType) || accType === 'KASBON' ? 'CREDIT' : 'DEBIT',
      name_id: nameId,
      name_en: nameEn,
      name_tet: nameTet
    };

    try {
      if (editingAcc) {
        const res = await callApi(`accounts/${editingAcc.code}`, 'PUT', payload);
        if (res.success) window.location.reload(); 
        else alert("Error: " + res.message);
      } else {
        const res = await callApi('accounts', 'POST', payload);
        if (res.success) window.location.reload();
        else alert("Error: " + res.message);
      }
    } catch (e) { alert("System error"); }
    finally { setIsProcessing(false); }
  };

  const groupedAccounts = useMemo(() => ({
    REVENUE: accounts.filter(a => a.type === 'REVENUE'),
    EXPENSE: accounts.filter(a => a.type === 'EXPENSE'),
    OTHERS: accounts.filter(a => a.type !== 'REVENUE' && a.type !== 'EXPENSE')
  }), [accounts]);

  const renderAccountGroup = (color: string, list: Account[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-500">
      {list.length === 0 ? (
        <div className="col-span-full py-10 text-center text-slate-300 font-bold uppercase tracking-widest text-[9px] border-2 border-dashed border-slate-100 rounded-3xl">
          Empty Category
        </div>
      ) : (
        list.map(acc => (
          <div key={acc.code} className="flex items-center justify-between p-4 lg:p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-all group">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 lg:w-12 lg:h-12 bg-${color}-50 text-${color}-600 rounded-xl flex items-center justify-center font-black text-[9px] border border-${color}-100/50`}>
                {acc.code}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] lg:text-sm font-black text-slate-900 leading-tight mb-0.5 truncate uppercase">{acc.name[settings.language]}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{acc.type}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleOpenModal(acc)} 
                title="Edit Account"
                className="w-9 h-9 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
              >
                <i className="fas fa-pen text-[9px]"></i>
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="p-4 lg:p-10 max-w-full lg:max-w-5xl mx-auto space-y-8 lg:space-y-12 pb-24">
      <header className="mb-4">
        <h2 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tighter mb-2 uppercase italic leading-none">{t.settings}</h2>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">ERP Protocol & Core Management</p>
      </header>

      <div className="bg-white rounded-[2rem] lg:rounded-[3rem] border border-slate-100 shadow-sm p-6 lg:p-10 space-y-10">
        <div className="flex items-center justify-between">
           <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3">
            <i className="fas fa-fingerprint text-indigo-600"></i> Identity & Contact Details
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Legal Name</label>
                <input 
                  value={settings.companyName}
                  onChange={(e) => updateSettingField('companyName', e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black text-xs outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Phone</label>
                  <input 
                    value={settings.companyPhone || ''}
                    onChange={(e) => updateSettingField('companyPhone', e.target.value)}
                    placeholder="+670 7xxx xxxx"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black text-xs outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Corporate Email</label>
                  <input 
                    value={settings.companyEmail || ''}
                    onChange={(e) => updateSettingField('companyEmail', e.target.value)}
                    placeholder="official@company.com"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black text-xs outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-row justify-around lg:justify-end gap-6 lg:gap-10">
              <div className="space-y-3 flex-1 lg:flex-none">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center lg:text-right">Brand Logo</label>
                <div onClick={() => logoInputRef.current?.click()} className="w-24 h-24 lg:w-36 lg:h-36 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center cursor-pointer overflow-hidden shadow-inner group relative">
                  {settings.companyLogo ? (
                    <img src={settings.companyLogo} className="w-full h-full object-contain p-4" alt="Company Brand" />
                  ) : (
                    <i className="fas fa-plus text-slate-300"></i>
                  )}
                  <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors"></div>
                </div>
                <input ref={logoInputRef} type="file" hidden accept="image/*" onChange={handleLogoUpload} />
              </div>
              <div className="space-y-3 flex-1 lg:flex-none">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center lg:text-right">Tab Icon</label>
                <div onClick={() => faviconInputRef.current?.click()} className="w-24 h-24 lg:w-36 lg:h-36 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center cursor-pointer overflow-hidden shadow-inner group relative">
                  {settings.companyFavicon ? (
                    <img src={settings.companyFavicon} className="w-12 h-12 object-contain" alt="Favicon" />
                  ) : (
                    <i className="fas fa-plus text-slate-300"></i>
                  )}
                  <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors"></div>
                </div>
                <input ref={faviconInputRef} type="file" hidden accept="image/*" onChange={handleFaviconUpload} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">HQ Physical Address</label>
            <textarea 
              rows={3}
              value={settings.companyAddress || ''}
              onChange={(e) => updateSettingField('companyAddress', e.target.value)}
              placeholder="Jl. Raya Utama No. 123, Dili, Timor-Leste"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black text-xs outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-10 text-white shadow-2xl space-y-8">
        <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-3">
          <i className="fas fa-database"></i> Persistence Layer
        </h3>
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6">
          <div className="bg-white/5 border border-white/10 p-1 rounded-xl flex gap-1 overflow-x-auto no-scrollbar">
            {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as BackupFrequency[]).map(freq => (
              <button 
                key={freq} onClick={() => setBackupFreq(freq)}
                className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-[8px] font-black tracking-widest transition-all ${backupFreq === freq ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {freq.replace('LY', '')}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={handleBackup} className="flex-1 lg:flex-none bg-white text-slate-900 px-6 py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[9px] uppercase tracking-widest shadow-lg shadow-white/5 hover:bg-slate-50 transition-colors"><i className="fas fa-download"></i> Backup DB</button>
            <button onClick={handleRestore} className="flex-1 lg:flex-none bg-indigo-600 text-white px-6 py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[9px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"><i className="fas fa-upload"></i> Restore</button>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Chart Matrix</h3>
          <button onClick={() => handleOpenModal()} className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg hover:bg-indigo-700 transition-colors">
            <i className="fas fa-plus text-[10px]"></i> New Account
          </button>
        </div>

        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-full sm:w-fit overflow-x-auto no-scrollbar whitespace-nowrap">
          {(['REVENUE', 'EXPENSE', 'OTHERS'] as CategoryTab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-xl text-[9px] font-black tracking-widest transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="pt-2">
          {activeTab === 'REVENUE' && renderAccountGroup("emerald", groupedAccounts.REVENUE)}
          {activeTab === 'EXPENSE' && renderAccountGroup("rose", groupedAccounts.EXPENSE)}
          {activeTab === 'OTHERS' && renderAccountGroup("indigo", groupedAccounts.OTHERS)}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            <header className="p-8 pb-6 flex justify-between items-center bg-slate-50 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="text-lg lg:text-xl font-black text-slate-900 uppercase tracking-tighter">{editingAcc ? 'Update' : 'New'} Account</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Protocol Definition</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 bg-white text-slate-400 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-colors shadow-sm"><i className="fas fa-times"></i></button>
            </header>
            <form onSubmit={handleSaveAccount} className="p-8 space-y-6 overflow-y-auto">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Code</label>
                    <input required value={accCode} onChange={(e) => setAccCode(e.target.value)} disabled={!!editingAcc} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 font-black text-xs outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all disabled:opacity-50" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                    <select value={accType} onChange={(e) => setAccType(e.target.value as AccountType)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 font-black text-[10px] uppercase outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all">
                      {['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE', 'KASBON'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Name (ID)</label>
                  <input required value={nameId} onChange={(e) => setNameId(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 font-black text-xs uppercase" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Name (EN)</label>
                  <input required value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 font-black text-xs uppercase" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Name (TET)</label>
                  <input required value={nameTet} onChange={(e) => setNameTet(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 font-black text-xs uppercase" />
                </div>
              </div>
              <button disabled={isProcessing} type="submit" className="w-full py-4 lg:py-5 rounded-2xl font-black text-[10px] lg:text-[11px] uppercase text-white bg-indigo-600 shadow-xl tracking-widest active:scale-95 transition-all">
                {isProcessing ? 'Saving...' : 'Commit Configuration'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;