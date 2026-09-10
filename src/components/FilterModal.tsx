import React, { useState, useEffect } from 'react';
import { ModuleSchema } from '../core/types';
import { 
  SlidersHorizontal, 
  X, 
  RotateCcw, 
  Check, 
  ArrowUpDown, 
  DollarSign, 
  Layers, 
  ChevronDown
} from 'lucide-react';

export interface FilterState {
  categories: Record<string, string[]>; // fieldKey -> selected array of values
  numberRanges: Record<string, { min?: number | ''; max?: number | '' }>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  schema: ModuleSchema;
  currentFilters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  onResetFilters: () => void;
}

export function FilterModal({
  isOpen,
  onClose,
  schema,
  currentFilters,
  onApplyFilters,
}: FilterModalProps) {
  const [draftFilters, setDraftFilters] = useState<FilterState>(currentFilters);

  useEffect(() => {
    if (isOpen) {
      setDraftFilters(JSON.parse(JSON.stringify(currentFilters)));
    }
  }, [isOpen, currentFilters]);

  if (!isOpen) return null;

  // Identify filterable fields
  const selectFields = schema.fields.filter(f => f.type === 'select' && f.options && f.options.length > 0);
  const numberFields = schema.fields.filter(f => f.type === 'number');
  const sortableFields = schema.fields.filter(f => ['text', 'number', 'select'].includes(f.type));

  const handleToggleSelectOption = (fieldKey: string, optionValue: string) => {
    setDraftFilters(prev => {
      const currentSelected = prev.categories[fieldKey] || [];
      const exists = currentSelected.includes(optionValue);
      const updated = exists 
        ? currentSelected.filter(v => v !== optionValue)
        : [...currentSelected, optionValue];

      return {
        ...prev,
        categories: {
          ...prev.categories,
          [fieldKey]: updated
        }
      };
    });
  };

  const handleNumberRangeChange = (fieldKey: string, type: 'min' | 'max', val: string) => {
    const numVal = val === '' ? '' : Number(val);
    setDraftFilters(prev => ({
      ...prev,
      numberRanges: {
        ...prev.numberRanges,
        [fieldKey]: {
          ...(prev.numberRanges[fieldKey] || {}),
          [type]: numVal
        }
      }
    }));
  };

  const handleSortFieldChange = (fieldKey: string) => {
    setDraftFilters(prev => ({
      ...prev,
      sortBy: fieldKey === prev.sortBy ? prev.sortBy : fieldKey,
      sortOrder: prev.sortOrder || 'asc'
    }));
  };

  const handleToggleSortOrder = () => {
    setDraftFilters(prev => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleClearDraft = () => {
    setDraftFilters({
      categories: {},
      numberRanges: {},
      sortBy: undefined,
      sortOrder: 'asc'
    });
  };

  const handleApply = () => {
    onApplyFilters(draftFilters);
    onClose();
  };

  // Count active draft filters
  let draftCount = 0;
  Object.keys(draftFilters.categories).forEach(key => {
    const arr = draftFilters.categories[key];
    if (Array.isArray(arr) && arr.length > 0) draftCount += arr.length;
  });
  Object.keys(draftFilters.numberRanges).forEach(key => {
    const range = draftFilters.numberRanges[key];
    if (range && range.min !== undefined && range.min !== '') draftCount++;
    if (range && range.max !== undefined && range.max !== '') draftCount++;
  });
  if (draftFilters.sortBy) draftCount++;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Dialog Card (Centered on desktop, Bottom Sheet on mobile) */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-modal-title"
        className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh] sm:max-h-[80vh] animate-in slide-in-from-bottom-6 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile Pull Handle Bar */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 id="filter-modal-title" className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                Filter Data {schema.title}
                {draftCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-600 text-white rounded-full">
                    {draftCount}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500">
                Pilih kriteria untuk menyaring dan mengurutkan data
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {draftCount > 0 && (
              <button
                type="button"
                onClick={handleClearDraft}
                className="text-[11px] font-bold text-slate-500 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
                title="Reset Isian Filter"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Tutup Dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body / Scrollable Filter Options */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 divide-y divide-slate-100">
          {/* 1. Sorting Options */}
          {sortableFields.length > 0 && (
            <div className="space-y-3 pt-0 first:pt-0">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
                Urutkan Berdasarkan
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="relative">
                  <select
                    value={draftFilters.sortBy || ''}
                    onChange={(e) => handleSortFieldChange(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 font-semibold text-slate-800 appearance-none cursor-pointer"
                  >
                    <option value="">Bawaan (Waktu / ID)</option>
                    {sortableFields.map(f => (
                      <option key={f.key} value={f.key}>
                        {f.label} ({f.type === 'number' ? 'Numerik' : 'Teks'})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                <button
                  type="button"
                  onClick={handleToggleSortOrder}
                  disabled={!draftFilters.sortBy}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                    !draftFilters.sortBy 
                      ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                      : draftFilters.sortOrder === 'desc'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>
                    {draftFilters.sortOrder === 'desc' ? 'Dari Terbesar / Z - A' : 'Dari Terkecil / A - Z'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* 2. Category / Select Enum Multi-select Chips */}
          {selectFields.map((field) => {
            const selectedList = draftFilters.categories[field.key] || [];
            return (
              <div key={field.key} className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    {field.label}
                  </label>
                  {selectedList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setDraftFilters(prev => ({
                        ...prev,
                        categories: { ...prev.categories, [field.key]: [] }
                      }))}
                      className="text-[10px] font-bold text-slate-400 hover:text-rose-600"
                    >
                      Hapus Pilihan
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {field.options?.map((opt) => {
                    const isSelected = selectedList.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleToggleSelectOption(field.key, opt)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* 3. Number Ranges Filter */}
          {numberFields.map((field) => {
            const currentRange = draftFilters.numberRanges[field.key] || {};
            return (
              <div key={field.key} className="space-y-3 pt-4">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  Rentang {field.label}
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 mb-1">Nilai Minimum</span>
                    <input
                      type="number"
                      placeholder="Contoh: 0"
                      value={currentRange.min ?? ''}
                      onChange={(e) => handleNumberRangeChange(field.key, 'min', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 font-mono"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 mb-1">Nilai Maksimum</span>
                    <input
                      type="number"
                      placeholder="Contoh: 1000000"
                      value={currentRange.max ?? ''}
                      onChange={(e) => handleNumberRangeChange(field.key, 'max', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 font-mono"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl border border-slate-200 transition-colors cursor-pointer min-h-[44px]"
          >
            Batal
          </button>

          <div className="flex items-center gap-2 w-1/2 sm:w-auto">
            <button
              type="button"
              onClick={handleApply}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 rounded-xl shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all cursor-pointer min-h-[44px]"
            >
              <Check className="w-4 h-4" />
              <span>Terapkan Filter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
