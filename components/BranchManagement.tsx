
import React, { useState } from 'react';
import { BranchData } from '../types';
import { callApi } from '../utils/api';

interface BranchManagementProps {
  branches: BranchData[];
  onUpdateBranches: (branches: BranchData[]) => void;
}

const BranchManagement: React.FC<BranchManagementProps> = ({ branches, onUpdateBranches }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');

  const handleOpenModal = (b?: BranchData) => {
    if (b) {
      setEditingBranch(b);
      setName(b.name);
      setCode(b.code);
      setLocation(b.location);
    } else {
      setEditingBranch(null);
      setName('');
      setCode('');
      setLocation('');
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const payload = { name, code: code.toUpperCase(), location };

    try {
      if (editingBranch) {
        const res = await callApi<BranchData>(`branches/${editingBranch.id}`, 'PUT', payload);
        if (res.success) {
          onUpdateBranches(branches.map(b => b.id === editingBranch.id ? { ...b, ...payload } : b));
          setShowModal(false);
        } else alert("Error: " + res.message);
      } else {
        const newId = `BR-${Date.now()}`;
        const res = await callApi<BranchData>('branches', 'POST', { ...payload, id: newId });
        if (res.success) {
          onUpdateBranches([...branches, { ...payload, id: newId }]);
          setShowModal(false);
        } else alert("Error: " + res.message);
      }
    } catch (err) { alert("System error"); }
    finally { setIsProcessing(false); }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this branch?')) {
      const res = await callApi(`branches/${id}`, 'DELETE');
      if (res.success) onUpdateBranches(branches.filter(b => b.id !== id));
      else alert("Failed to delete: " + res.message);
    }
  };

  return (
    <div className="p-4 lg:p-10 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Branch Nodes</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-1">Operational Network Management</p>
        </div>
        <button onClick={() => handleOpenModal()} className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20">
          <i className="fas fa-plus"></i> New Branch
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map(b => (
          <div key={b.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 -mr-12 -mt-12 rounded-full group-hover:bg-indigo-50 transition-colors"></div>
            <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-600/20 uppercase">
                  {b.code}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenModal(b)} className="w-10 h-10 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm"><i className="fas fa-pen text-[10px]"></i></button>
                  <button onClick={() => handleDelete(b.id)} className="w-10 h-10 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center shadow-sm"><i className="fas fa-trash text-[10px]"></i></button>
                </div>
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">{b.name}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <i className="fas fa-location-dot text-slate-300 text-[10px]"></i>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{b.location}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <header className="p-8 pb-6 flex justify-between items-center bg-slate-50 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{editingBranch ? 'Edit' : 'New'} Branch</h3>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 bg-white text-slate-400 rounded-full flex items-center justify-center shadow-sm"><i className="fas fa-times"></i></button>
            </header>
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Branch Code</label>
                    <input required value={code} onChange={e => setCode(e.target.value.substring(0, 3))} placeholder="MNF" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 font-black text-xs uppercase outline-none focus:border-indigo-600 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Name</label>
                    <input required value={name} onChange={e => setName(e.target.value)} placeholder="MANUFAHI" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 font-black text-xs uppercase outline-none focus:border-indigo-600 transition-all" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Physical Location</label>
                  <input required value={location} onChange={e => setLocation(e.target.value)} placeholder="SAME, MANUFAHI" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 font-black text-xs uppercase outline-none focus:border-indigo-600 transition-all" />
                </div>
              </div>
              <button disabled={isProcessing} type="submit" className="w-full py-5 rounded-2xl font-black text-[10px] uppercase text-white bg-indigo-600 shadow-xl tracking-widest active:scale-95 transition-all">
                {isProcessing ? 'Saving...' : 'Register Node'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchManagement;
