
import React, { useState, useMemo } from 'react';
import { InventoryItem, User, AppSettings } from '../types';
import { TRANSLATIONS } from '../constants';
import { callApi } from '../utils/api';

interface InventoryViewProps {
  inventory: InventoryItem[];
  onUpdateInventory: (items: InventoryItem[]) => void;
  user: User;
  settings: AppSettings;
}

const InventoryView: React.FC<InventoryViewProps> = ({ inventory, onUpdateInventory, user, settings }) => {
  const t = TRANSLATIONS[settings.language];
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [isProcessing, setIsProcessing] = useState(false);

  const [code, setCode] = useState('');
  const [category, setCategory] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [stockIn, setStockIn] = useState<number>(0);
  const [stockOut, setStockOut] = useState<number>(0);

  const categories = useMemo(() => {
    const cats = new Set(inventory.map(i => i.category));
    return ['ALL', ...Array.from(cats)];
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    let list = inventory;
    if (user.branch !== 'ALL') {
      list = list.filter(i => i.branch === user.branch);
    }
    if (filterCategory !== 'ALL') {
      list = list.filter(i => i.category === filterCategory);
    }
    return list;
  }, [inventory, user.branch, filterCategory]);

  const totalStockIn = useMemo(() => filteredInventory.reduce((acc, item) => acc + item.stockIn, 0), [filteredInventory]);
  const totalStockOut = useMemo(() => filteredInventory.reduce((acc, item) => acc + item.stockOut, 0), [filteredInventory]);
  const totalRemaining = totalStockIn - totalStockOut;

  const handleOpenModal = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setCode(item.code);
      setCategory(item.category);
      setReferenceNumber(item.referenceNumber || '');
      setStockIn(item.stockIn);
      setStockOut(item.stockOut);
    } else {
      setEditingItem(null);
      setCode(`KPN-${Date.now().toString().slice(-6)}`);
      setCategory('');
      setReferenceNumber('');
      setStockIn(0);
      setStockOut(0);
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const payload = {
      code: code.toUpperCase(),
      category: category.toUpperCase() || 'GENERAL',
      reference_number: referenceNumber.toUpperCase(),
      stock_in: stockIn,
      stock_out: stockOut,
      branch_name: user.branch === 'ALL' ? (user.branch || 'HEADQUARTERS') : user.branch
    };

    try {
      if (editingItem) {
        const res = await callApi<InventoryItem>(`inventory/${editingItem.id}`, 'PUT', payload);
        if (res.success) {
          window.location.reload(); // Simple sync
        } else alert("Error: " + res.message);
      } else {
        const newId = `INV-${Date.now()}`;
        const res = await callApi<InventoryItem>('inventory', 'POST', { ...payload, id: newId });
        if (res.success) {
          window.location.reload(); // Simple sync
        } else alert("Error: " + res.message);
      }
    } catch (err) { alert("System error"); }
    finally { setIsProcessing(false); }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`${t.delete}?`)) {
      const res = await callApi(`inventory/${id}`, 'DELETE');
      if (res.success) onUpdateInventory(inventory.filter(i => i.id !== id));
      else alert("Error: " + res.message);
    }
  };

  return (
    <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">{t.inventory}</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-1">Audit Protocol</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm flex gap-6">
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.totalIn}</p>
              <p className="text-lg font-black text-emerald-600 tabular-nums">{totalStockIn.toLocaleString()}</p>
            </div>
            <div className="w-[1px] h-full bg-slate-100"></div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.totalOut}</p>
              <p className="text-lg font-black text-rose-600 tabular-nums">{totalStockOut.toLocaleString()}</p>
            </div>
            <div className="w-[1px] h-full bg-slate-100"></div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.finalStock}</p>
              <p className="text-lg font-black text-indigo-600 tabular-nums">{totalRemaining.toLocaleString()}</p>
            </div>
          </div>
          <button onClick={() => handleOpenModal()} className="flex-1 md:flex-none bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20">
            <i className="fas fa-plus"></i> {t.inputMutation}
          </button>
        </div>
      </header>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit overflow-x-auto no-scrollbar whitespace-nowrap">
        {categories.map(cat => (
          <button 
            key={cat} 
            onClick={() => setFilterCategory(cat)}
            className={`px-5 py-2.5 rounded-xl text-[9px] font-black tracking-widest transition-all uppercase ${filterCategory === cat ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {cat === 'ALL' ? (settings.language === 'TET' ? 'HOTU' : 'SEMUA') : cat}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[900px]">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.couponCode}</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.refNumber}</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.category}</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t.stockIn}</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t.stockOut}</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t.finalStock}</th>
              <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.action}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredInventory.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-8 py-20 text-center">
                  <i className="fas fa-file-invoice text-4xl text-slate-100 mb-4 block"></i>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No mutation recorded</p>
                </td>
              </tr>
            ) : (
              filteredInventory.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center font-black text-[9px] uppercase border border-slate-100">
                        {item.code.slice(0, 3)}
                      </div>
                      <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{item.code}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">#{item.referenceNumber || 'N/A'}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[8px] font-black uppercase tracking-widest">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <p className="text-[13px] font-black text-emerald-600 tabular-nums">{item.stockIn.toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <p className="text-[13px] font-black text-rose-600 tabular-nums">{item.stockOut.toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-5 text-center bg-slate-50/30">
                    <p className="text-[13px] font-black text-slate-900 tabular-nums">{(item.stockIn - item.stockOut).toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenModal(item)} className="w-9 h-9 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center">
                        <i className="fas fa-pen text-[9px]"></i>
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="w-9 h-9 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center">
                        <i className="fas fa-trash text-[9px]"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col">
            <header className="p-8 pb-6 flex justify-between items-center bg-slate-50 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{editingItem ? t.editMutation : t.inputMutation}</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Verification Protocol</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 bg-white text-slate-400 rounded-full flex items-center justify-center shadow-sm"><i className="fas fa-times"></i></button>
            </header>
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.couponCode}</label>
                    <input required value={code} onChange={e => setCode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 font-black text-xs uppercase" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.refNumber}</label>
                    <input required value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} placeholder="BK-001" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 font-black text-xs uppercase" />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.category}</label>
                  <input required value={category} onChange={e => setCategory(e.target.value)} list="cat-suggestions" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 font-black text-xs uppercase" />
                  <datalist id="cat-suggestions">
                    {categories.filter(c => c !== 'ALL').map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest ml-1">{t.stockIn}</label>
                    <input type="number" required value={stockIn} onChange={e => setStockIn(Number(e.target.value))} className="w-full bg-emerald-50 border border-emerald-100 rounded-xl px-5 py-3 font-black text-xs text-emerald-700" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-rose-600 uppercase tracking-widest ml-1">{t.stockOut}</label>
                    <input type="number" required value={stockOut} onChange={e => setStockOut(Number(e.target.value))} className="w-full bg-rose-50 border border-rose-100 rounded-xl px-5 py-3 font-black text-xs text-rose-700" />
                  </div>
                </div>

                <div className="p-4 bg-slate-900 rounded-2xl flex justify-between items-center">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.finalStock}</p>
                   <p className="text-xl font-black text-white tabular-nums">{(stockIn - stockOut).toLocaleString()}</p>
                </div>
              </div>
              <button disabled={isProcessing} type="submit" className="w-full py-5 rounded-2xl font-black text-[10px] uppercase text-white bg-indigo-600 shadow-xl tracking-widest active:scale-95 transition-all">
                {isProcessing ? 'Saving...' : t.save}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryView;
