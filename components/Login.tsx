
import React, { useState } from 'react';
import { User, AppSettings } from '../types';
import { TRANSLATIONS } from '../constants';
import { callApi } from '../utils/api'; // Import API utility

interface LoginProps {
  onLogin: (user: User, token: string) => void; // onLogin now accepts token
  settings: AppSettings;
  // REMOVED: users: User[]; // This will be removed once users are loaded from API on App.tsx
}

const Login: React.FC<LoginProps> = ({ onLogin, settings }) => { // users prop is becoming less relevant
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const t = TRANSLATIONS[settings.language];

  const handleSubmit = async (e: React.FormEvent) => { // Make it async
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await callApi<{ user: User; token: string }>('login', 'POST', { username, password }, false); // Do not send auth token for login
      
      if (response.success && response.user && response.token) {
        onLogin(response.user, response.token); // Pass user object and token to App.tsx
      } else {
        setError(response.message || t.invalidAuth);
      }
    } catch (err: any) {
      setError(err.message || t.invalidAuth);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/30 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md sm:max-w-lg relative z-10 animate-in fade-in zoom-in duration-500">
         <div className="bg-white rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl p-8 sm:p-14 space-y-8 sm:space-y-12 border border-white/20">
            <header className="text-center space-y-4 sm:space-y-6">
               <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-[1.5rem] sm:rounded-3xl mx-auto flex items-center justify-center shadow-xl border border-slate-100 overflow-hidden">
                  {settings.companyLogo ? (
                    <img src={settings.companyLogo} className="w-full h-full object-contain p-2" alt="Company Logo" />
                  ) : (
                    <i className="fas fa-landmark-dome text-indigo-600 text-3xl"></i>
                  )}
               </div>
               <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-[0.1em] uppercase leading-tight">
                    {settings.companyName}
                  </h1>
                  <p className="text-[10px] sm:text-[11px] text-slate-700 font-extrabold uppercase tracking-[0.3em] mt-3 italic opacity-80">
                    {t.loginTitle}
                  </p>
               </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
               <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-2">{t.accessKey}</label>
                    <div className="relative group">
                       <i className="fas fa-user-shield absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"></i>
                       <input 
                          required 
                          value={username} 
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="IDENTIFICATION" 
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-14 pr-8 py-4 sm:py-5 font-black text-xs text-slate-900 uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all placeholder:text-slate-400"
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-2">{t.encryptionKey}</label>
                    <div className="relative group">
                       <i className="fas fa-fingerprint absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"></i>
                       <input 
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••" 
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-14 pr-8 py-4 sm:py-5 font-black text-xs text-slate-900 tracking-widest outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all placeholder:text-slate-300"
                       />
                    </div>
                  </div>
               </div>

               {error && <p className="text-[9px] font-black text-rose-600 text-center uppercase tracking-widest animate-bounce">{error}</p>}

               <button 
                  disabled={isLoading}
                  className="w-full py-4 sm:py-5 rounded-2xl font-black text-[10px] sm:text-[11px] uppercase text-white shadow-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all tracking-[0.3em] flex items-center justify-center gap-3"
               >
                  {isLoading ? (
                    <i className="fas fa-circle-notch animate-spin text-lg"></i>
                  ) : (
                    <>
                      <span>{t.authorizeSession}</span>
                      <i className="fas fa-arrow-right text-[10px] opacity-70"></i>
                    </>
                  )}
               </button>
            </form>

            <footer className="text-center pt-4 border-t border-slate-100">
               <p className="text-[9px] sm:text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">
                  Enterprise Node Security Level A<br/>
                  <span className="text-slate-500 font-medium opacity-80">{settings.companyName} &copy; {new Date().getFullYear()}</span>
               </p>
               <p className="mt-2 text-[9px] font-mono text-slate-400 bg-slate-50 py-1 rounded-lg">
                  Default Login: <b>admin</b> / <b>password123</b>
               </p>
            </footer>
         </div>
      </div>
    </div>
  );
};

export default Login;
