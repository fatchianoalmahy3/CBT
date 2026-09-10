import React, { useState } from 'react';
import { ModuleSchema } from '../core/types';
import { 
  ArrowLeft, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  FileText, 
  FileUp,
  Table as TableIcon,
  HelpCircle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { ExcelService, ParsedImportRow } from '../services/excel';

interface ImportExportViewProps {
  schema: ModuleSchema;
  currentData: any[];
  onBack: () => void;
  onBulkImport: (items: any[]) => Promise<any>;
  userRole: string;
}

export function ImportExportView({
  schema,
  currentData,
  onBack,
  onBulkImport,
  userRole
}: ImportExportViewProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'guide'>('import');
  
  // Import State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importRows, setImportRows] = useState<ParsedImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ total: number; success: boolean; message: string } | null>(null);

  // Export State
  const [selectedFields, setSelectedFields] = useState<string[]>(() => schema.fields.map(f => f.key));
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');

  const canWrite = schema.allowedRoles.includes(userRole);

  const handleDownloadTemplate = () => {
    ExcelService.downloadTemplate(schema);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setParsing(true);
    setImportResult(null);

    try {
      const rows = await ExcelService.parseExcelFile(file, schema);
      setImportRows(rows);
    } catch (err: any) {
      alert('Gagal membaca berkas Excel: ' + (err.message || 'Format berkas tidak didukung.'));
      setImportRows([]);
    } finally {
      setParsing(false);
    }
  };

  const handleExecuteImport = async () => {
    const validRows = importRows.filter(r => r.isValid).map(r => r.data);
    if (validRows.length === 0) {
      alert('Tidak ada baris data valid untuk diimpor. Harap periksa kembali berkas Excel Anda.');
      return;
    }

    setImporting(true);
    try {
      const result = await onBulkImport(validRows);
      setImportResult({
        total: result.totalInserted || validRows.length,
        success: true,
        message: `Berhasil mengimpor ${result.totalInserted || validRows.length} entri data ke modul ${schema.title}!`
      });
      // Clear current file
      setSelectedFile(null);
      setImportRows([]);
    } catch (err: any) {
      setImportResult({
        total: 0,
        success: false,
        message: err.message || 'Gagal melakukan import massal.'
      });
    } finally {
      setImporting(false);
    }
  };

  const handleToggleField = (key: string) => {
    if (selectedFields.includes(key)) {
      if (selectedFields.length > 1) {
        setSelectedFields(prev => prev.filter(k => k !== key));
      }
    } else {
      setSelectedFields(prev => [...prev, key]);
    }
  };

  const handleSelectAllFields = () => {
    setSelectedFields(schema.fields.map(f => f.key));
  };

  const handleCustomExport = () => {
    if (currentData.length === 0) {
      alert('Tidak ada data dalam modul untuk diekspor.');
      return;
    }

    // Filter fields schema
    const customSchema: ModuleSchema = {
      ...schema,
      fields: schema.fields.filter(f => selectedFields.includes(f.key))
    };

    ExcelService.exportToExcel(customSchema, currentData, `${schema.id}_custom`);
  };

  const validCount = importRows.filter(r => r.isValid).length;
  const invalidCount = importRows.length - validCount;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation Header */}
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
              <span className="text-xs font-bold text-slate-500">Pusat Data</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Import & Export Hub (.xlsx)
            </h1>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('import')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'import' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Import .xlsx
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'export' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ekspor Data
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'guide' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Format Skema
          </button>
        </div>
      </div>

      {/* Success/Error Feedback Banner */}
      {importResult && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold shadow-xs ${
          importResult.success 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {importResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span>{importResult.message}</span>
          </div>
          <button
            onClick={() => setImportResult(null)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tab 1: Import Excel */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* Step 1 & 2 Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1: Download Template */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                    LANGKAH 1
                  </span>
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Unduh Template Excel Resmi</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Gunakan template `.xlsx` yang telah distandarisasi sesuai kolom field skema {schema.title} agar tidak terjadi kegagalan validasi.
                </p>
              </div>

              <button
                onClick={handleDownloadTemplate}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer min-h-[44px]"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Unduh Template .xlsx ({schema.id})</span>
              </button>
            </div>

            {/* Step 2: Upload File */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                    LANGKAH 2
                  </span>
                  <FileUp className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Unggah Berkas .xlsx</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Pilih berkas spreadsheet hasil pengisian data. Sistem akan memverifikasi integritas setiap baris secara instan.
                </p>
              </div>

              <label className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer min-h-[44px]">
                <Upload className="w-4 h-4" />
                <span>{selectedFile ? selectedFile.name : 'Pilih Berkas Excel (.xlsx)'}</span>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={!canWrite}
                />
              </label>
            </div>
          </div>

          {/* Step 3: Interactive Validation Table & Execution */}
          {parsing ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-600">Memeriksa struktur & validasi baris berkas Excel...</p>
            </div>
          ) : importRows.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <TableIcon className="w-4 h-4 text-indigo-600" />
                    Hasil Verifikasi Pra-Import ({importRows.length} Baris Terdeteksi)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hanya baris dengan status valid yang akan dimasukkan ke dalam database.
                  </p>
                </div>

                {/* Status Badges & Import Button */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
                    ✓ {validCount} Valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-xs font-bold px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
                      ✕ {invalidCount} Tidak Valid
                    </span>
                  )}
                </div>
              </div>

              {/* Rows Preview Table */}
              <div className="overflow-x-auto max-h-[360px] border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5 font-bold text-slate-500 uppercase text-[10px]">Baris</th>
                      <th className="px-4 py-2.5 font-bold text-slate-500 uppercase text-[10px]">Status</th>
                      {schema.fields.map(f => (
                        <th key={f.key} className="px-4 py-2.5 font-bold text-slate-500 uppercase text-[10px]">{f.label}</th>
                      ))}
                      <th className="px-4 py-2.5 font-bold text-slate-500 uppercase text-[10px]">Keterangan Validasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importRows.map((row) => (
                      <tr key={row.rowNumber} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/40'}>
                        <td className="px-4 py-2.5 font-mono text-slate-400 font-bold">#{row.rowNumber}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                              <Check className="w-3 h-3" /> SIAP IMPORT
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">
                              <AlertCircle className="w-3 h-3" /> GAGAL
                            </span>
                          )}
                        </td>
                        {schema.fields.map(f => {
                          const val = row.data[f.key];
                          return (
                            <td key={f.key} className="px-4 py-2.5 whitespace-nowrap max-w-[160px] truncate text-slate-700">
                              {val !== undefined && val !== null ? String(val) : <span className="text-slate-300 italic">-</span>}
                            </td>
                          );
                        })}
                        <td className="px-4 py-2.5 text-xs text-rose-600 font-medium">
                          {row.errors.join('; ') || <span className="text-emerald-600 font-normal">Semua kolom valid.</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Execution Bottom Bar */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  Total <strong>{validCount}</strong> baris siap dimasukkan ke dalam database.
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setImportRows([]);
                    }}
                    disabled={importing}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleExecuteImport}
                    disabled={importing || validCount === 0 || !canWrite}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 rounded-xl shadow-md transition-all cursor-pointer min-h-[44px]"
                  >
                    {importing && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    <span>Eksekusi Import ({validCount} Data Valid)</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Tab 2: Export Data */}
      {activeTab === 'export' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Kustomisasi Kolom Ekspor</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pilih kolom mana saja yang ingin disertakan ke dalam berkas unduhan.
              </p>
            </div>
            <button
              onClick={handleSelectAllFields}
              className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer self-start sm:self-auto"
            >
              Pilih Semua Kolom
            </button>
          </div>

          {/* Fields Checkbox Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {schema.fields.map(field => {
              const isChecked = selectedFields.includes(field.key);
              return (
                <label
                  key={field.key}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                    isChecked ? 'bg-indigo-50/50 border-indigo-200 text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleField(field.key)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold block">{field.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">key: {field.key}</span>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Action Trigger */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Total <strong>{currentData.length}</strong> rekaman data akan diekspor dengan <strong>{selectedFields.length}</strong> kolom.
            </div>

            <button
              onClick={handleCustomExport}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Berkas .xlsx Sekarang</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Format Skema Guide */}
      {activeTab === 'guide' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold text-slate-800">Spesifikasi Header & Aturan Tipe Data</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Panduan pemetaan field untuk modul {schema.title} saat mempersiapkan spreadsheet Excel mandiri.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Header Kolom Excel</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Key Internal</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Tipe Data</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Wajib (Required)</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Opsi / Format Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schema.fields.map(f => (
                  <tr key={f.key} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-bold text-slate-800">{f.label}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{f.key}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono text-[10px]">
                        {f.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {f.validation?.required ? (
                        <span className="text-rose-600 font-bold">Wajib</span>
                      ) : (
                        <span className="text-slate-400">Opsional</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {f.options ? f.options.join(', ') : f.type === 'number' ? 'Nilai Angka (contoh: 500000)' : 'Teks Bebas'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
