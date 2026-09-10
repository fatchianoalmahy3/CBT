import React from 'react';
import { ModuleSchema } from '../core/types';
import { FieldRenderer, getVisibleFields } from '../core/formatters';
import { 
  ArrowLeft, 
  Printer, 
  Edit3, 
  Trash2, 
  FileSpreadsheet, 
  ShieldCheck,
  Calendar,
  Clock,
  Layers,
  Copy,
  Check
} from 'lucide-react';
import { ExcelService } from '../services/excel';

interface DetailViewProps {
  schema: ModuleSchema;
  item: any;
  onBack: () => void;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  onPrint: () => void;
  userRole: string;
}

export function DetailView({
  schema,
  item,
  onBack,
  onEdit,
  onDelete,
  onPrint,
  userRole
}: DetailViewProps) {
  const [copied, setCopied] = React.useState(false);

  const canWrite = schema.allowedRoles.includes(userRole);

  const handleCopyId = () => {
    navigator.clipboard.writeText(item.id || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportSingle = () => {
    ExcelService.exportToExcel(schema, [item], `${schema.id}_detail_${item.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Kembali ke Daftar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-600">{schema.title}</span>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-bold text-slate-500">Detail Dokumen</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              {item.name || item.customer_name || item.action || `ID: ${item.id}`}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportSingle}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer min-h-[40px]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Ekspor .xlsx</span>
          </button>

          <button
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer min-h-[40px]"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-600" />
            <span>Cetak / PDF</span>
          </button>

          {canWrite && (
            <>
              <button
                onClick={() => onEdit(item)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer min-h-[40px]"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Data</span>
              </button>

              <button
                onClick={() => onDelete(item.id)}
                className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                title="Hapus Entri Ini"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Formal Document Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Document Header Letterhead */}
        <div className="p-6 sm:p-8 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                REST REPO DOKUMEN SISTEM
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                <ShieldCheck className="w-3 h-3" /> VERIFIED
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              {item.name || item.customer_name || item.action || 'Dokumen Entri'}
            </h2>
            <p className="text-xs text-slate-400">
              Modul: {schema.title} • Skema: {schema.id}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 font-mono text-slate-300">
              <span className="text-[10px] text-slate-400">ID SISTEM:</span>
              <span className="font-bold text-white">{item.id}</span>
              <button 
                onClick={handleCopyId}
                className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-white"
                title="Salin ID"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Waktu Akses: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
            </div>
          </div>
        </div>

        {/* Structured Field Details */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {getVisibleFields(schema).map((field) => {
              const val = item[field.key];
              const isFullWidth = ['richtext', 'location', 'file'].includes(field.type);

              return (
                <div 
                  key={field.key} 
                  className={`space-y-1.5 pb-4 border-b border-slate-100 last:border-0 ${
                    isFullWidth ? 'md:col-span-2' : ''
                  }`}
                >
                  <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    {field.label}
                  </span>

                  <FieldRenderer field={field} value={val} mode="detail" />
                </div>
              );
            })}
          </div>

          {/* Audit & Lifecycle Note */}
          <div className="mt-8 pt-6 border-t border-slate-100 bg-slate-50/50 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-800">Status Validasi Dokumen: Aktif</span>
                <p className="text-slate-400">Data tersimpan aman pada Dynamic REST Controller Storage.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onPrint}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Cetak Lembar Resmi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
