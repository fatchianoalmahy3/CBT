import React, { useState, useEffect } from 'react';
import { ModuleSchema } from '../core/types';
import { getVisibleFields } from '../core/formatters';
import { ArrowLeft, Save, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { MediaUploader } from '../components/MediaUploader';
import { RichTextEditor } from '../components/RichTextEditor';
import { LocationPicker } from '../components/LocationPicker';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface FormViewProps {
  schema: ModuleSchema;
  initialData?: any | null;
  onSubmit: (values: Record<string, any>) => Promise<void>;
  onBack: () => void;
  loading?: boolean;
}

export function FormView({
  schema,
  initialData,
  onSubmit,
  onBack,
  loading = false
}: FormViewProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const [isDirty, setIsDirty] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const isEditMode = !!initialData;

  // Filter technical ID field from input fields via centralized helper
  const visibleFields = getVisibleFields(schema);

  useEffect(() => {
    const initial: Record<string, any> = {};
    schema.fields.forEach((field) => {
      if (initialData && initialData[field.key] !== undefined) {
        initial[field.key] = initialData[field.key];
      } else if (field.defaultValue !== undefined) {
        initial[field.key] = field.defaultValue;
      } else {
        initial[field.key] = '';
      }
    });
    setFormData(initial);
    setErrors({});
    setSubmitError(null);
    setIsDirty(false);
  }, [schema, initialData]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleCancelClick = () => {
    if (isDirty) {
      setShowCancelConfirm(true);
    } else {
      onBack();
    }
  };

  const executeReset = () => {
    const initial: Record<string, any> = {};
    schema.fields.forEach((field) => {
      initial[field.key] = initialData?.[field.key] ?? field.defaultValue ?? '';
    });
    setFormData(initial);
    setErrors({});
    setIsDirty(false);
    setShowResetConfirm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate fields according to Schema
    const newErrors: Record<string, string> = {};
    schema.fields.forEach((field) => {
      const val = formData[field.key];
      if (field.validation?.required && (val === undefined || val === null || val === '')) {
        newErrors[field.key] = `${field.label} wajib diisi.`;
      }
      if (field.type === 'number' && val !== undefined && val !== null && val !== '') {
        const num = Number(val);
        if (isNaN(num)) {
          newErrors[field.key] = `${field.label} harus berupa angka numerik valid.`;
        } else if (field.validation?.min !== undefined && num < field.validation.min) {
          newErrors[field.key] = `${field.label} minimal ${field.validation.min}.`;
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setSubmitError(err.message || 'Gagal menyimpan data ke REST Gateway.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={handleCancelClick}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Kembali ke Daftar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-600">{schema.title}</span>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-bold text-slate-700">
                {isEditMode ? 'Form Edit Data' : 'Form Entri Baru'}
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {isEditMode ? `Edit Data: ${initialData?.name || initialData?.id || 'Entri'}` : `Tambah ${schema.title.split(' ')[1] || 'Entri'} Baru`}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer min-h-[40px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Form</span>
          </button>
          <button
            type="button"
            onClick={handleCancelClick}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer min-h-[40px]"
          >
            Batal
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {(Object.keys(errors).length > 0 || submitError) && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold">Gagal Menyimpan Data</h4>
            <p>{submitError || 'Harap lengkapi semua kolom bertanda bintang (*) dengan nilai yang valid.'}</p>
          </div>
        </div>
      )}

      {/* Main Form Body */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-sm font-bold text-slate-800">Spesifikasi Isian Data</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Semua parameter divalidasi sesuai dengan metadata skema terintegrasi.
          </p>
        </div>

        <div className="space-y-6">
          {visibleFields.map((field) => {
            const hasError = !!errors[field.key];
            const isRequired = field.validation?.required;

            return (
              <div key={field.key} className="space-y-1.5">
                {/* Field Header */}
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 tracking-wide">
                    {field.label} {isRequired && <span className="text-rose-500 font-black">*</span>}
                  </label>
                  <span className="text-[10px] uppercase font-mono text-slate-400">
                    Tipe: {field.type}
                  </span>
                </div>

                {/* Conditional Field Inputs */}
                {field.type === 'file' ? (
                  <MediaUploader
                    label={field.label}
                    value={formData[field.key] || ''}
                    onChange={(url) => handleChange(field.key, url)}
                    placeholder={field.placeholder}
                  />
                ) : field.type === 'richtext' ? (
                  <RichTextEditor
                    label={field.label}
                    value={formData[field.key] || ''}
                    onChange={(html) => handleChange(field.key, html)}
                    placeholder={field.placeholder}
                  />
                ) : field.type === 'location' ? (
                  <LocationPicker
                    label={field.label}
                    value={formData[field.key] || null}
                    onChange={(loc) => handleChange(field.key, loc)}
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={formData[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className={`w-full px-4 py-2.5 text-xs bg-white border rounded-xl shadow-2xs focus:outline-none focus:ring-3 transition-all font-medium min-h-[44px] ${
                      hasError 
                        ? 'border-rose-400 focus:ring-rose-100 text-rose-900' 
                        : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100 text-slate-800'
                    }`}
                  >
                    <option value="">-- Pilih {field.label} --</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    value={formData[field.key] !== undefined ? formData[field.key] : ''}
                    placeholder={field.placeholder || `Masukkan ${field.label.toLowerCase()}...`}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className={`w-full px-4 py-2.5 text-xs bg-white border rounded-xl shadow-2xs focus:outline-none focus:ring-3 transition-all font-medium min-h-[44px] ${
                      hasError 
                        ? 'border-rose-400 focus:ring-rose-100 text-rose-900' 
                        : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100 text-slate-800'
                    }`}
                  />
                )}

                {/* Validation Error Text */}
                {hasError && (
                  <p className="text-xs text-rose-600 font-semibold pl-1">
                    {errors[field.key]}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Form Action Footer */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Kolom bertanda <span className="text-rose-500 font-bold">*</span> wajib diisi untuk integritas skema.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCancelClick}
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer min-h-[44px]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all cursor-pointer min-h-[44px]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isEditMode ? 'Simpan Perubahan' : 'Simpan Entri Baru'}</span>
            </button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        isOpen={showCancelConfirm}
        title="Batal Edit?"
        message="Anda memiliki perubahan yang belum disimpan. Yakin ingin membatalkan dan membuang semua perubahan?"
        confirmLabel="Ya, Buang Perubahan"
        cancelLabel="Kembali ke Form"
        variant="warning"
        onConfirm={onBack}
        onCancel={() => setShowCancelConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset Form?"
        message="Ini akan menghapus seluruh data yang telah Anda ketik dan mengembalikannya ke nilai awal. Anda tidak dapat mengurungkan aksi ini."
        confirmLabel="Ya, Reset"
        cancelLabel="Batal"
        variant="warning"
        onConfirm={executeReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}
