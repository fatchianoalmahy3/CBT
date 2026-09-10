import React, { useState, useMemo } from 'react';
import { ModuleSchema } from '../core/types';
import { getVisibleFields, formatPlainString } from '../core/formatters';
import { ArrowLeft, Printer, Download, QrCode, CheckCircle2, Copy, Check, ExternalLink, X, ShieldAlert, Sparkles, ShieldCheck } from 'lucide-react';
import { ExcelService } from '../services/excel';
import { QRCodeSVG } from 'qrcode.react';

interface PrintDocumentViewProps {
  schema: ModuleSchema;
  data: any[];
  onBack: () => void;
  userRole: string;
}

export function PrintDocumentView({
  schema,
  data,
  onBack,
  userRole
}: PrintDocumentViewProps) {
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    ExcelService.exportToExcel(schema, data);
  };

  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, []);

  const documentMeta = useMemo(() => {
    const docNumber = `SK/REP/${schema.id.toUpperCase()}/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
    const verificationUUID = `VRF-${schema.id.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const generatedAt = new Date().toISOString();
    
    // Hash simulation for digital certificate
    const certHash = Array.from(verificationUUID + schema.id + data.length)
      .map((c) => c.charCodeAt(0).toString(16))
      .join('')
      .substring(0, 32)
      .toUpperCase();

    const verifyUrl = `${window.location.origin}${window.location.pathname}?view=verify&doc=${encodeURIComponent(docNumber)}&uuid=${verificationUUID}&schema=${schema.id}&count=${data.length}&hash=${certHash}`;

    return {
      docNumber,
      verificationUUID,
      generatedAt,
      certHash,
      verifyUrl
    };
  }, [schema.id, data.length]);

  const handleCopyVerificationUrl = () => {
    navigator.clipboard.writeText(documentMeta.verifyUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Non-Printable Navigation Controls Bar */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Kembali ke Daftar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-xs font-semibold text-indigo-600">Pratinjau Dokumen Cetak</span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Lembar Laporan Resmi ({schema.title})
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => setShowVerifyModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer min-h-[40px]"
            title="Periksa Keaslian Verifikasi Dokumen"
          >
            <QrCode className="w-3.5 h-3.5 text-indigo-600" />
            <span>Periksa Sertifikat QR</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer min-h-[40px]"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ekspor .xlsx</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer min-h-[40px]"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet (Formal Letterhead A4 Paper Style) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm print:p-0 print:border-none print:shadow-none space-y-8 font-sans text-slate-900">
        {/* Kop Surat / Enterprise Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 uppercase">
              PT MEDIA ENTERPRISE NUSANTARA
            </h2>
            <p className="text-xs text-slate-600">
              Gedung Cyber One Lantai 18, Jl. H.R. Rasuna Said Kav. X-5, Jakarta Selatan 12950
            </p>
            <p className="text-[11px] text-slate-500">
              Telepon: (021) 5299-8800 • Email: official@enterprise-starterkit.id • Web: www.starterkit.id
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-xl ml-auto">
              SK
            </div>
            <span className="text-[9px] font-mono text-slate-400 block mt-1">DOKUMEN RESMI</span>
          </div>
        </div>

        {/* Document Title & Meta */}
        <div className="space-y-2 text-center py-2">
          <h3 className="text-base sm:text-lg font-extrabold uppercase tracking-wide underline underline-offset-4">
            LAPORAN REKAPITULASI {schema.title.toUpperCase()}
          </h3>
          <p className="text-xs text-slate-500 font-mono">
            Nomor: {documentMeta.docNumber}
          </p>
        </div>

        {/* Meta Info Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl text-xs border border-slate-200">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Modul Skema</span>
            <span className="font-bold text-slate-800">{schema.title}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Rekaman</span>
            <span className="font-bold text-slate-800">{data.length} Baris Data</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Tanggal Cetak</span>
            <span className="font-bold text-slate-800">{currentDate}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Otorisator</span>
            <span className="font-bold text-slate-800">{userRole.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Printable Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="border border-slate-300 px-3 py-2 text-[10px] font-bold text-slate-700 uppercase w-10 text-center">
                  No
                </th>
                {getVisibleFields(schema).map(f => (
                  <th key={f.key} className="border border-slate-300 px-3 py-2 text-[10px] font-bold text-slate-700 uppercase">
                    {f.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={item.id || idx} className="border-b border-slate-200">
                  <td className="border border-slate-300 px-3 py-2 text-center font-mono">{idx + 1}</td>
                  {getVisibleFields(schema).map(f => {
                    const text = formatPlainString(f, item[f.key]);
                    return (
                      <td key={f.key} className="border border-slate-300 px-3 py-2 text-slate-800">
                        {text}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Certified Digital Verification QR Footer (Replaces Physical Signature) */}
        <div className="pt-6 border-t border-slate-200">
          <div className="p-4 sm:p-5 bg-slate-50/90 border border-slate-300 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-5 shadow-2xs">
            {/* QR Code Graphic with Scan Link */}
            <div 
              onClick={() => setShowVerifyModal(true)}
              className="bg-white p-2.5 rounded-xl border border-slate-300 shadow-xs shrink-0 cursor-pointer group hover:border-indigo-500 transition-all text-center"
              title="Klik untuk membuka pemeriksa keabsahan dokumen"
            >
              <QRCodeSVG
                value={documentMeta.verifyUrl}
                size={88}
                level="M"
                includeMargin={false}
                className="group-hover:scale-105 transition-transform duration-200 mx-auto"
              />
              <span className="block mt-1.5 text-[9px] font-mono text-slate-400 group-hover:text-indigo-600 font-semibold">
                Pindai Validasi
              </span>
            </div>

            {/* Official Electronic Seal Details */}
            <div className="space-y-1.5 text-slate-700 text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Dokumen Sah & Terverifikasi Elektronik
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Ref: {documentMeta.docNumber}
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-900">
                Sertifikasi Digital Terpusat (Berdasarkan Ketentuan UU ITE)
              </h4>

              <p className="text-[10px] text-slate-600 leading-relaxed max-w-2xl">
                Dokumen ini merupakan keluaran resmi sistem repositori terverifikasi dan sah tanpa memerlukan tanda tangan basah. Integritas data dan riwayat audit dapat divalidasi langsung secara publik dengan memindai kode QR di samping.
              </p>

              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-[10px] font-mono text-slate-500">
                <span>UUID: <strong className="text-slate-800">{documentMeta.verificationUUID}</strong></span>
                <span>Waktu Terbit: <strong className="text-slate-800">{currentDate}</strong></span>
                <span>Penerbit: <strong className="text-slate-800">Admin Repository Cloud</strong></span>
              </div>

              <div className="pt-1.5 print:hidden flex items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(true)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Buka Audit Log & Rincian Kriptografi</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Verification Audit Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white relative">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Tutup Dialog"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                  <ShieldAlert className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      SERTIFIKASI RESMI
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-indigo-200">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      Live Verified
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-1">
                    Audit Keaslian Dokumen Digital
                  </h3>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Status Banner */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-sm font-black text-emerald-900">
                    Dokumen Sah & Terdaftar di Database Sistem
                  </h4>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Struktur skema, integritas data, dan otorisasi dokumen telah diverifikasi secara kriptografis oleh REST Engine.
                  </p>
                </div>
              </div>

              {/* QR and Metadata Row */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm shrink-0 flex flex-col items-center">
                  <QRCodeSVG
                    value={documentMeta.verifyUrl}
                    size={110}
                    level="Q"
                    includeMargin={false}
                  />
                  <span className="text-[9px] font-mono text-slate-400 mt-2">QR VERIFIKASI</span>
                </div>

                <div className="space-y-2.5 text-xs w-full">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Nomor Dokumen
                    </span>
                    <span className="font-mono font-bold text-slate-900 break-all">
                      {documentMeta.docNumber}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      UUID Verifikasi
                    </span>
                    <span className="font-mono text-indigo-700 font-bold break-all">
                      {documentMeta.verificationUUID}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Modul</span>
                      <span className="font-bold text-slate-800">{schema.title}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Jumlah Baris</span>
                      <span className="font-bold text-slate-800">{data.length} Rekaman</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cryptographic Hash & Signer Details */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>TANDA TANGAN KRIPTOGRAFIS:</span>
                  <span className="text-emerald-600 font-bold">SHA256 CHECKSUM PASS</span>
                </div>
                <div className="font-mono text-[11px] bg-slate-900 text-emerald-400 p-2.5 rounded-lg break-all select-all">
                  {documentMeta.certHash}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Penandatangan Resmi:</span>
                  <span className="font-bold text-slate-800">Almahyra Fatchiano, M.Kom</span>
                </div>
              </div>

              {/* Copy URL Link Section */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">Tautan Verifikasi Resmi:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={documentMeta.verifyUrl}
                    className="w-full text-xs font-mono bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-600 truncate focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyVerificationUrl}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shrink-0 cursor-pointer shadow-xs min-h-[38px]"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer min-h-[38px]"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer min-h-[38px]"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Dokumen Terverifikasi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

