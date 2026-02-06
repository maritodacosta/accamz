import React from 'react';
import { AppSettings } from '../types';

interface ManualViewProps {
  settings: AppSettings;
  isDarkMode?: boolean;
}

const ManualSection: React.FC<{ icon: string; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <section className="space-y-4 pt-8 border-t border-slate-100 dark:border-slate-800 transition-colors">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm transition-colors">
        <i className={`fas ${icon} text-lg lg:text-xl`}></i>
      </div>
      <div>
        <h3 className="text-lg lg:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase leading-tight transition-colors">{title}</h3>
      </div>
    </div>
    <div className="pl-4 lg:pl-16 text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-3 transition-colors">{children}</div>
  </section>
);

const ManualView: React.FC<ManualViewProps> = ({ settings }) => {
  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-12 space-y-8 lg:space-y-12 bg-white dark:bg-slate-800 min-h-screen lg:shadow-lg lg:my-10 lg:rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700 print:shadow-none print:my-0 print:rounded-none print:max-w-full transition-all">
      
      <header className="text-center border-b-4 border-indigo-600 dark:border-indigo-500 pb-8 lg:pb-12 space-y-4 lg:space-y-6">
        <div className="w-20 h-20 lg:w-24 lg:h-24 bg-indigo-600 dark:bg-indigo-500 text-white rounded-2xl lg:rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl transition-colors">
           <i className="fas fa-landmark-dome text-3xl lg:text-4xl"></i>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl lg:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tighter uppercase leading-tight transition-colors">Dokumentasi Sistem ERP</h1>
          <h2 className="text-lg lg:text-xl font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] transition-colors">{settings.companyName}</h2>
        </div>
        <p className="text-slate-400 dark:text-slate-500 font-mono text-[8px] lg:text-xs uppercase tracking-widest transition-colors">Versi 2.3 • Arsitektur Cloud • Audit-Ready</p>
      </header>

      <ManualSection icon="fa-rocket" title="Ringkasan Eksekutif">
        <p>
          Sistem ERP (Enterprise Resource Planning) ini adalah platform komando keuangan terpusat yang dirancang untuk memberikan <strong>visibilitas dan kontrol penuh</strong> atas seluruh aktivitas operasional perusahaan. Tujuannya adalah untuk menggantikan proses manual, mengurangi risiko <em>human error</em>, dan menyediakan data akurat secara <em>real-time</em> untuk pengambilan keputusan strategis.
        </p>
      </ManualSection>

      <ManualSection icon="fa-shield-halved" title="Arsitektur & Keamanan Sistem">
        <p>
          Platform ini dibangun di atas infrastruktur cloud modern (Vercel & Supabase) yang menjamin ketersediaan tinggi dan skalabilitas. Keamanan data adalah prioritas utama, diimplementasikan melalui beberapa lapisan:
        </p>
        <ul className="list-disc ml-5 space-y-2 text-xs">
          <li><strong>Otentikasi Aman:</strong> Setiap pengguna memiliki kredensial unik (username/password) yang divalidasi oleh server.</li>
          <li><strong>Kontrol Akses Berbasis Peran (RBAC):</strong> Sistem membedakan dua level akses: <strong>ADMIN</strong> dan <strong>USER</strong>.</li>
          <li><strong>Segregasi Data Cabang:</strong> Data setiap cabang terisolasi dan tidak dapat diakses oleh cabang lain.</li>
          <li><strong>Jejak Audit (Audit Trail):</strong> Setiap tindakan krusial dicatat secara otomatis dalam log sistem.</li>
        </ul>
      </ManualSection>

      <ManualSection icon="fa-person-chalkboard" title="Panduan Penggunaan Harian">
          <p className="font-bold text-slate-800 dark:text-slate-200 transition-colors">Berikut adalah alur kerja standar:</p>
          <ol className="list-decimal ml-5 space-y-4 text-xs">
              <li><strong>Login ke Sistem:</strong> Masukkan Username dan Password Anda.</li>
              <li><strong>Mencatat Transaksi:</strong> Masuk ke menu "Transaksi", klik "+ Tambah", isi detail dan nominal, lalu simpan.</li>
              <li><strong>Menyetujui Transaksi (Admin):</strong> Masuk ke menu "Persetujuan" untuk memvalidasi entri dari cabang.</li>
              <li><strong>Laporan:</strong> Lihat performa melalui menu "Laporan" dan ekspor ke PDF jika diperlukan.</li>
          </ol>
      </ManualSection>

      <footer className="pt-8 lg:pt-12 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors">
        <div className="flex items-center gap-3">
           {settings.companyLogo && <img src={settings.companyLogo} className="h-6 lg:h-8 opacity-50 grayscale dark:invert transition-all" alt="Logo" />}
           <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">© {new Date().getFullYear()} {settings.companyName} Systems</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="w-full sm:w-auto bg-indigo-600 dark:bg-indigo-500 text-white px-8 py-3 lg:py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all print:hidden flex items-center justify-center gap-2"
        >
          <i className="fas fa-file-pdf"></i> Ekspor ke PDF
        </button>
      </footer>
    </div>
  );
};

export default ManualView;