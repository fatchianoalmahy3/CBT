import React, { useState, useEffect } from 'react';
import { FieldSchema } from '../core/types';
import { MediaUploader } from './MediaUploader';
import { RichTextEditor } from './RichTextEditor';
import { LocationPicker } from './LocationPicker';
import { AlertTriangle } from 'lucide-react';

interface FormGeneratorProps {
  fields: FieldSchema[];
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function FormGenerator({ fields, initialValues, onSubmit, onCancel, loading }: FormGeneratorProps) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fill with default values or initial values
    const defaultVals: Record<string, any> = {};
    fields.forEach((field) => {
      defaultVals[field.key] = initialValues?.[field.key] !== undefined 
        ? initialValues[field.key] 
        : (field.defaultValue !== undefined ? field.defaultValue : '');
    });
    setValues(defaultVals);
    setErrors({});
  }, [fields, initialValues]);

  const handleChange = (key: string, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Clear error for that field
    if (errors[key]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate fields on submission
    const newErrors: Record<string, string> = {};
    fields.forEach((field) => {
      const val = values[field.key];
      if (field.validation?.required && (val === undefined || val === null || val === '')) {
        newErrors[field.key] = `${field.label} wajib diisi.`;
      }
      if (field.type === 'number' && val !== undefined && val !== null && val !== '') {
        const num = Number(val);
        if (isNaN(num)) {
          newErrors[field.key] = `${field.label} harus berupa angka.`;
        } else if (field.validation?.min !== undefined && num < field.validation.min) {
          newErrors[field.key] = `${field.label} minimal bernilai ${field.validation.min}.`;
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider">Gagal Validasi Skema</h4>
            <p className="text-xs mt-1">Harap periksa kembali isian form sebelum melakukan penyimpanan data.</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {fields.map((field) => {
          const hasError = !!errors[field.key];
          
          return (
            <div key={field.key} className="space-y-1">
              {/* Conditional Inputs */}
              {field.type === 'file' ? (
                <MediaUploader
                  label={field.label}
                  value={values[field.key] || ''}
                  onChange={(url) => handleChange(field.key, url)}
                  placeholder={field.placeholder}
                />
              ) : field.type === 'richtext' ? (
                <RichTextEditor
                  label={field.label}
                  value={values[field.key] || ''}
                  onChange={(html) => handleChange(field.key, html)}
                  placeholder={field.placeholder}
                />
              ) : field.type === 'location' ? (
                <LocationPicker
                  label={field.label}
                  value={values[field.key] || null}
                  onChange={(loc) => handleChange(field.key, loc)}
                />
              ) : field.type === 'select' ? (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {field.label} {field.validation?.required && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={values[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className={`w-full px-4 py-2 text-sm bg-white border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all ${
                      hasError ? 'border-red-400 focus:ring-red-50' : 'border-slate-200 focus:border-indigo-400'
                    }`}
                  >
                    <option value="">-- Pilih {field.label} --</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {field.label} {field.validation?.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    value={values[field.key] !== undefined ? values[field.key] : ''}
                    placeholder={field.placeholder}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className={`w-full px-4 py-2 text-sm bg-white border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all ${
                      hasError ? 'border-red-400 focus:ring-red-50' : 'border-slate-200 focus:border-indigo-400'
                    }`}
                  />
                </div>
              )}

              {/* Field Validation Error Message */}
              {hasError && (
                <p className="text-xs text-red-500 font-medium pl-1">{errors[field.key]}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg shadow-md transition-all flex items-center gap-2"
        >
          {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
          Simpan Data
        </button>
      </div>
    </form>
  );
}
