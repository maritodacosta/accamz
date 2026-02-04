
import React, { useState } from 'react';
import { User, BranchData, UserRole } from '../types';
import { callApi } from '../utils/api'; 

interface UserManagementProps {
  users: User[];
  onUpdateUsers: (users: User[]) => void;
  branches: BranchData[];
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onUpdateUsers, branches }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); 
  const [role, setRole] = useState<UserRole>('USER');
  const [branch, setBranch] = useState('');

  const handleOpenModal = (u?: User) => {
    if (u) {
      setEditingUser(u);
      setName(u.name);
      setUsername(u.username);
      setPassword(''); 
      setRole(u.role);
      setBranch(u.branch);
    } else {
      setEditingUser(null);
      setName('');
      setUsername('');
      setPassword('');
      setRole('USER');
      setBranch(branches[0]?.name || ''); 
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const payload: any = {
      username,
      name,
      role,
      branch_name: branch,
      password_hash: password || (editingUser ? undefined : 'password123') // Default for new, or update if provided
    };

    if (!password) delete payload.password_hash; // Don't update if empty

    try {
      if (editingUser) {
        const res = await callApi<User>(`users/${editingUser.id}`, 'PUT', payload);
        if (res.success) {
          const updatedList = users.map(u => u.id === editingUser.id ? { ...u, ...payload, branch: branch } : u);
          onUpdateUsers(updatedList);
          setShowModal(false);
        } else {
          alert("Error updating user: " + res.message);
        }
      } else {
        const newId = `USR-${Date.now()}`;
        const res = await callApi<User>('users', 'POST', { ...payload, id: newId });
        if (res.success) {
          onUpdateUsers([...users, { ...payload, id: newId, branch: branch }]);
          setShowModal(false);
        } else {
          alert("Error creating user: " + res.message);
        }
      }
    } catch (e) {
      alert("System error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this operator?')) {
      const res = await callApi(`users/${id}`, 'DELETE');
      if (res.success) {
        onUpdateUsers(users.filter(u => u.id !== id));
      } else {
        alert("Failed to delete: " + res.message);
      }
    }
  };

  return (
    <div className="p-4 lg:p-10 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Operators</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-1">User Authorization Matrix</p>
        </div>
        <button onClick={() => handleOpenModal()} className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20">
          <i className="fas fa-user-plus"></i> New Operator
        </button>
      </header>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Level</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch Node</th>
              <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs uppercase">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{u.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">@{u.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{u.branch}</span>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleOpenModal(u)} className="w-10 h-10 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm">
                      <i className="fas fa-pen text-[10px]"></i>
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="w-10 h-10 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center shadow-sm">
                      <i className="fas fa-trash text-[10px]"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <header className="p-8 pb-6 flex justify-between items-center bg-slate-50 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{editingUser ? 'Edit' : 'New'} Operator</h3>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 bg-white text-slate-400 rounded-full flex items-center justify-center shadow-sm"><i className="fas fa-times"></i></button>
            </header>
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                  <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 font-black text-xs uppercase outline-none focus:border-indigo-600 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Username</label>
                    <input required value={username} onChange={e => setUsername(e.target.value.toLowerCase())} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 font-black text-xs lowercase outline-none focus:border-indigo-600 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Password {editingUser ? '(Empty to keep)' : ''}</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 font-black text-xs outline-none focus:border-indigo-600 transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Role</label>
                    <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 font-black text-[10px] uppercase outline-none focus:border-indigo-600 transition-all">
                      <option value="USER">Operator</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Default Branch</label>
                    <select value={branch} onChange={e => setBranch(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 font-black text-[10px] uppercase outline-none focus:border-indigo-600 transition-all">
                      {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <button disabled={isProcessing} type="submit" className="w-full py-5 rounded-2xl font-black text-[10px] uppercase text-white bg-indigo-600 shadow-xl tracking-widest active:scale-95 transition-all">
                {isProcessing ? 'Saving...' : 'Commit Profile'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
