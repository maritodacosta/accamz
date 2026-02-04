
import React from 'react';
import { AppSettings } from '../types';

interface ManualViewProps {
  settings: AppSettings;
}

const ManualSection: React.FC<{ icon: string; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <section className="space-y-4 pt-8 border-t border-slate-100">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
        <i className={`fas ${icon} text-xl`}></i>
      </div>
      <div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-tight">{title}</h3>
      </div>
    </div>
    <div className="pl-16 text-sm text-slate-600 leading-relaxed space-y-3">{children}</div>
  </section>
);

const ManualView: React.FC<ManualViewProps> = ({ settings }) => {
  return (
    <div className="max-w-4xl mx-auto p-8 lg:p-12 space-y-12 bg-white min-h-screen shadow-lg my-10 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700 print:shadow-none print:my-0 print:rounded-none print:max-w-full">
      
      <header className="text-center border-b-4 border-indigo-600 pb-12 space-y-6">
        <div className="w-24 h-24 bg-indigo-600 text-white rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl">
           <i className="fas fa-landmark-dome text-4xl"></i>
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-tight">Dokumentasi Sistem ERP</h1>
          <h2 className="text-xl font-bold text-indigo-600 uppercase tracking-[0.2em]">{settings.companyName}</h2>
        </div>
        <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">Versi 2.3 • Arsitektur Cloud • Audit-Ready</p>
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
          <li><strong>Otentikasi Aman:</strong> Setiap pengguna memiliki kredensial unik (username/password) yang divalidasi oleh server. Sesi pengguna akan otomatis berakhir setelah 15 menit tidak aktif untuk mencegah akses tidak sah.</li>
          <li><strong>Kontrol Akses Berbasis Peran (RBAC):</strong> Sistem membedakan dua level akses: <strong>ADMIN</strong> (kontrol penuh atas semua data dan pengaturan) dan <strong>USER</strong> (akses terbatas hanya untuk input dan melihat data cabang sendiri).</li>
          <li><strong>Segregasi Data Cabang:</strong> Data setiap cabang terisolasi. Operator cabang hanya dapat mengakses dan mengelola transaksi yang relevan dengan lokasi mereka, mencegah kebocoran informasi antar-cabang.</li>
          <li><strong>Jejak Audit (Audit Trail):</strong> Setiap tindakan krusial—mulai dari pembuatan transaksi, persetujuan, hingga perubahan pengaturan—dicatat secara otomatis. Ini menciptakan jejak yang tidak dapat diubah untuk keperluan audit dan investigasi internal.</li>
        </ul>
      </ManualSection>

      <ManualSection icon="fa-person-chalkboard" title="Panduan Penggunaan Harian">
          <p className="font-bold text-slate-800">Berikut adalah alur kerja standar untuk operasional harian menggunakan sistem ERP:</p>
          <ol className="list-decimal ml-5 space-y-4 text-xs">
              <li>
                  <strong>Login ke Sistem:</strong>
                  <ul className="list-disc ml-5 mt-2">
                      <li>Buka aplikasi, masukkan <strong>Username</strong> dan <strong>Password</strong> Anda.</li>
                      <li>Klik tombol "Otorisasi Sesi" untuk masuk ke dashboard utama.</li>
                  </ul>
              </li>
              <li>
                  <strong>Mencatat Transaksi Baru (Untuk Operator Cabang):</strong>
                  <ul className="list-disc ml-5 mt-2">
                      <li>Masuk ke menu <strong>"Transaksi"</strong> dari sidebar.</li>
                      <li>Klik tombol "+ Tambah Transaksi".</li>
                      <li>Pilih jenisnya (Pendapatan, Beban, atau Kasbon), lalu pilih kategori akun yang sesuai.</li>
                      <li>Isi kolom deskripsi dan masukkan nominal (nilai) transaksi.</li>
                      <li>Klik "Kirim Entri". Transaksi Anda akan otomatis masuk ke antrian persetujuan pusat.</li>
                  </ul>
              </li>
              <li>
                  <strong>Menyetujui Transaksi (Untuk Admin):</strong>
                  <ul className="list-disc ml-5 mt-2">
                      <li>Masuk ke menu <strong>"Persetujuan"</strong>. Menu ini hanya terlihat oleh Admin.</li>
                      <li>Anda akan melihat daftar transaksi yang berstatus "PENDING".</li>
                      <li>Tinjau setiap transaksi, lalu gunakan tombol <strong>"Approve"</strong> untuk mengesahkan atau <strong>"Reject"</strong> untuk menolak. Admin juga dapat mengedit detail sebelum menyetujui.</li>
                  </ul>
              </li>
              <li>
                  <strong>Melihat dan Mencetak Laporan:</strong>
                   <ul className="list-disc ml-5 mt-2">
                      <li>Masuk ke menu <strong>"Laporan"</strong>.</li>
                      <li>Pilih jenis laporan yang ingin dilihat (Laba Rugi, Neraca, atau Jurnal).</li>
                      <li>Data yang ditampilkan adalah data yang sudah disetujui (APPROVED).</li>
                      <li>Klik tombol "Generate Official PDF" untuk mengunduh laporan dalam format PDF yang rapi.</li>
                  </ul>
              </li>
          </ol>
      </ManualSection>

      <ManualSection icon="fa-chart-pie" title="Dashboard & Analitik Bisnis">
        <p>
          Dashboard adalah pusat komando visual yang menyajikan metrik keuangan utama secara <em>real-time</em>. Ini memungkinkan manajemen untuk memantau kesehatan finansial perusahaan dalam sekejap.
        </p>
        <ul className="list-disc ml-5 space-y-2 text-xs">
          <li><strong>Available Cash:</strong> Menunjukkan total likuiditas (kas yang tersedia) di seluruh cabang yang telah disetujui.</li>
          <li><strong>Total Revenue & Operational Cost:</strong> Agregasi dari semua transaksi Pendapatan dan Beban yang telah disahkan.</li>
          <li><strong>Net Result:</strong> Kalkulasi otomatis dari (Pendapatan - Beban) untuk menunjukkan laba atau rugi bersih.</li>
        </ul>
      </ManualSection>

      <ManualSection icon="fa-right-left" title="Protokol Transaksi & Validasi Jurnal">
        <p>
          Setiap entri data mengikuti prinsip akuntansi fundamental <strong>Double-Entry Bookkeeping</strong>. Sistem secara cerdas mengotomatisasi proses penjurnalan untuk memastikan integritas data.
        </p>
        <div className="p-4 bg-indigo-50 border-l-4 border-indigo-600 rounded-r-xl text-xs">
          <p className="font-black text-indigo-800 uppercase mb-1">Contoh Logika Jurnal Otomatis:</p>
          <ul className="list-disc ml-5 space-y-1">
              <li><strong>Input PENDAPATAN:</strong> Sistem akan (DEBIT) 'Kas Utama' dan (KREDIT) akun 'Pendapatan'.</li>
              <li><strong>Input BEBAN:</strong> Sistem akan (DEBIT) akun 'Beban' dan (KREDIT) 'Kas Utama'.</li>
          </ul>
        </div>
      </ManualSection>
      
      <ManualSection icon="fa-stamp" title="Sistem Otorisasi & Kontrol Internal">
        <p>
          Fitur ini adalah jantung dari mekanisme kontrol internal sistem, dirancang untuk menegakkan prinsip <strong>pemisahan tugas</strong>. Semua transaksi yang diinput oleh operator cabang tidak langsung masuk ke buku besar.
        </p>
        <ul className="list-disc ml-5 space-y-2 text-xs">
            <li><strong>Status 'PENDING':</strong> Setiap transaksi baru akan masuk ke antrian persetujuan dengan status "PENDING" dan belum mempengaruhi laporan keuangan.</li>
            <li><strong>Validasi Pusat (HQ):</strong> Hanya pengguna dengan peran ADMIN yang dapat mengakses menu "Persetujuan" untuk me-review setiap transaksi.</li>
            <li><strong>Tindakan Admin:</strong> Admin bisa <strong>Approve</strong> (mengesahkan), <strong>Reject</strong> (menolak), atau <strong>Edit & Approve</strong> (memperbaiki detail sebelum disahkan).</li>
        </ul>
      </ManualSection>

      <ManualSection icon="fa-file-pdf" title="Pelaporan Keuangan Terstandardisasi">
        <p>
          Sistem mampu menghasilkan tiga laporan keuangan fundamental secara instan (Laba Rugi, Neraca, dan Jurnal Umum) berdasarkan data transaksi yang sudah berstatus "APPROVED". Semua laporan dapat diunduh sebagai file PDF profesional yang dilengkapi dengan kop surat perusahaan.
        </p>
      </ManualSection>

      <ManualSection icon="fa-infinity" title="Visi & Skalabilitas Sistem">
        <p>
          Sistem ERP ini bukan sekadar alat, melainkan sebuah <strong>fondasi digital</strong> untuk pertumbuhan perusahaan. Arsitektur modularnya memungkinkan penambahan fitur baru seiring dengan berkembangnya kebutuhan bisnis.
        </p>
        <p className="font-bold text-slate-800">
          Dengan mengadopsi platform ini, {settings.companyName} berinvestasi dalam infrastruktur data yang kuat untuk mendukung pengambilan keputusan yang lebih cerdas dan ekspansi bisnis yang berkelanjutan.
        </p>
      </ManualSection>

      <footer className="pt-12 border-t border-slate-100 flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
           {settings.companyLogo && <img src={settings.companyLogo} className="h-8 opacity-50 grayscale" alt="Logo" />}
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">© {new Date().getFullYear()} {settings.companyName} Systems</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all print:hidden flex items-center gap-2"
        >
          <i className="fas fa-print"></i> Cetak ke PDF
        </button>
      </footer>
    </div>
  );
};

export default ManualView;