import React, { useState, useMemo } from 'react';
import { ModuleSchema } from '../core/types';
import { FieldRenderer, getVisibleFields } from '../core/formatters';
import { 
  Search, 
  Plus, 
  RefreshCw, 
  FileSpreadsheet, 
  Printer, 
  Eye, 
  Edit3, 
  Trash2, 
  SlidersHorizontal,
  Table as TableIcon,
  LayoutGrid,
  FileText,
  MapPin,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  ChevronDown,
  Database
} from 'lucide-react';
import { ExcelService } from '../services/excel';
import { FilterModal, FilterState } from '../components/FilterModal';

interface ListViewProps {
  schema: ModuleSchema;
  data: any[];
  totalServerCount?: number | null;
  loading: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  onAddClick: () => void;
  onEditClick: (item: any) => void;
  onDetailClick: (item: any) => void;
  onDeleteClick: (id: string) => void;
  onImportExportClick: () => void;
  onPrintClick: () => void;
  userRole: string;
}

const INITIAL_FILTER_STATE: FilterState = {
  categories: {},
  numberRanges: {},
  sortBy: undefined,
  sortOrder: 'asc'
};

export function ListView({
  schema,
  data,
  totalServerCount,
  loading,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  searchQuery,
  onSearchChange,
  onRefresh,
  onAddClick,
  onEditClick,
  onDetailClick,
  onDeleteClick,
  onImportExportClick,
  onPrintClick,
  userRole
}: ListViewProps) {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>(INITIAL_FILTER_STATE);

  const canWrite = schema.allowedRoles.includes(userRole);

  // Compute active filter criteria count safely
  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.keys(activeFilters.categories).forEach((key) => {
      const arr = activeFilters.categories[key];
      if (Array.isArray(arr) && arr.length > 0) count += arr.length;
    });
    Object.keys(activeFilters.numberRanges).forEach((key) => {
      const range = activeFilters.numberRanges[key];
      if (range && range.min !== undefined && range.min !== '') count++;
      if (range && range.max !== undefined && range.max !== '') count++;
    });
    if (activeFilters.sortBy) count++;
    return count;
  }, [activeFilters]);

  // Apply search query, filters, and sorting to data
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // 1. Text Search across schema fields
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item => {
        return schema.fields.some(field => {
          const val = item[field.key];
          if (val === undefined || val === null) return false;
          if (typeof val === 'object') {
            return JSON.stringify(val).toLowerCase().includes(q);
          }
          return String(val).toLowerCase().includes(q);
        }) || (item.id && String(item.id).toLowerCase().includes(q));
      });
    }

    // 2. Multi-Select / Category Filters
    Object.keys(activeFilters.categories).forEach((fieldKey) => {
      const selectedVals = activeFilters.categories[fieldKey];
      if (Array.isArray(selectedVals) && selectedVals.length > 0) {
        result = result.filter(item => selectedVals.includes(String(item[fieldKey])));
      }
    });

    // 3. Number Ranges Filters
    Object.keys(activeFilters.numberRanges).forEach((fieldKey) => {
      const range = activeFilters.numberRanges[fieldKey];
      if (range) {
        if (range.min !== undefined && range.min !== '') {
          result = result.filter(item => {
            const num = Number(item[fieldKey]);
            return !isNaN(num) && num >= Number(range.min);
          });
        }
        if (range.max !== undefined && range.max !== '') {
          result = result.filter(item => {
            const num = Number(item[fieldKey]);
            return !isNaN(num) && num <= Number(range.max);
          });
        }
      }
    });

    // 4. Sorting
    if (activeFilters.sortBy) {
      const sortKey = activeFilters.sortBy;
      const isDesc = activeFilters.sortOrder === 'desc';
      result.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];

        if (valA === undefined || valA === null) return isDesc ? -1 : 1;
        if (valB === undefined || valB === null) return isDesc ? 1 : -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return isDesc ? valB - valA : valA - valB;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        if (strA < strB) return isDesc ? 1 : -1;
        if (strA > strB) return isDesc ? -1 : 1;
        return 0;
      });
    }

    return result;
  }, [data, searchQuery, activeFilters, schema.fields]);

  const handleQuickExport = () => {
    if (filteredAndSortedData.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }
    ExcelService.exportToExcel(schema, filteredAndSortedData);
  };

  const handleRemoveCategoryChip = (fieldKey: string, valueToRemove: string) => {
    setActiveFilters(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [fieldKey]: (prev.categories[fieldKey] || []).filter(v => v !== valueToRemove)
      }
    }));
  };

  const handleRemoveNumberRangeChip = (fieldKey: string, type: 'min' | 'max') => {
    setActiveFilters(prev => ({
      ...prev,
      numberRanges: {
        ...prev.numberRanges,
        [fieldKey]: {
          ...(prev.numberRanges[fieldKey] || {}),
          [type]: ''
        }
      }
    }));
  };

  const handleRemoveSortChip = () => {
    setActiveFilters(prev => ({
      ...prev,
      sortBy: undefined,
      sortOrder: 'asc'
    }));
  };

  const handleResetAllFilters = () => {
    setActiveFilters(INITIAL_FILTER_STATE);
    onSearchChange('');
  };

  const handleHeaderSortClick = (fieldKey: string) => {
    setActiveFilters(prev => {
      if (prev.sortBy === fieldKey) {
        if (prev.sortOrder === 'asc') {
          return { ...prev, sortOrder: 'desc' };
        } else {
          return { ...prev, sortBy: undefined, sortOrder: 'asc' };
        }
      } else {
        return { ...prev, sortBy: fieldKey, sortOrder: 'asc' };
      }
    });
  };

  const visibleFields = useMemo(() => getVisibleFields(schema), [schema]);

  const renderCellContent = (field: any, val: any) => {
    return <FieldRenderer field={field} value={val} mode="table" />;
  };

  return (
    <div className="space-y-5">
      {/* 1. Module Header Bar */}
      <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{schema.title}</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1.5">
              <span>{filteredAndSortedData.length} Entri Ditampilkan</span>
              {totalServerCount !== null && totalServerCount !== undefined && (
                <span className="text-indigo-400 font-normal">
                  (Total Server: {totalServerCount.toLocaleString('id-ID')})
                </span>
              )}
            </span>
            {hasMore && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                Arsip Tersedia ({totalServerCount ? totalServerCount - data.length : 0} data lagi)
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 sm:line-clamp-1">
            {schema.description || 'Kelola dan perbarui seluruh basis data operasional secara tersentralisasi.'}
          </p>
        </div>

        {/* Action Button Group: Mobile (3 cols), Tablet (2x2 grid), Desktop (1 horizontal row) */}
        <div className="w-full xl:w-auto">
          {/* Mobile Layout (<sm): 3 utility buttons in 3 equal columns */}
          <div className="grid grid-cols-3 gap-2 sm:hidden w-full">
            <button
              type="button"
              onClick={handleQuickExport}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer min-h-[40px]"
              title="Ekspor Cepat Data ke Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">Ekspor</span>
            </button>

            <button
              type="button"
              onClick={onPrintClick}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer min-h-[40px]"
              title="Cetak Laporan / Simpan PDF"
            >
              <Printer className="w-4 h-4 text-slate-600 shrink-0" />
              <span className="truncate">Cetak</span>
            </button>

            <button
              type="button"
              onClick={onImportExportClick}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 border border-indigo-200 rounded-xl transition-colors cursor-pointer min-h-[40px]"
              title="Pusat Impor & Ekspor Lengkap"
            >
              <SlidersHorizontal className="w-4 h-4 shrink-0" />
              <span className="truncate">Hub</span>
            </button>
          </div>

          {/* Tablet & Desktop Layout (sm and up): Tablet 2x2 grid, Desktop 1 horizontal flex row */}
          <div className={`hidden sm:grid ${canWrite ? 'grid-cols-2' : 'grid-cols-3'} xl:flex xl:flex-row xl:items-center gap-2 w-full xl:w-auto`}>
            {/* Export Button */}
            <button
              type="button"
              onClick={handleQuickExport}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer min-h-[40px] whitespace-nowrap"
              title="Ekspor Cepat Data ke Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Ekspor .xlsx</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={onPrintClick}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer min-h-[40px] whitespace-nowrap"
              title="Cetak Laporan / Simpan PDF"
            >
              <Printer className="w-4 h-4 text-slate-600 shrink-0" />
              <span>Cetak / PDF</span>
            </button>

            {/* Import & Export Hub */}
            <button
              type="button"
              onClick={onImportExportClick}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 border border-indigo-200 rounded-xl transition-colors cursor-pointer min-h-[40px] whitespace-nowrap"
              title="Pusat Impor & Ekspor Lengkap"
            >
              <SlidersHorizontal className="w-4 h-4 shrink-0" />
              <span>Import & Export Hub</span>
            </button>

            {/* Primary Add Button (Tablet & Desktop) */}
            {canWrite && (
              <button
                type="button"
                onClick={onAddClick}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 rounded-xl shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all cursor-pointer min-h-[40px] whitespace-nowrap"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Tambah Data</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar (Toolbar) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Left Side: Search Input + Filter Modal Popup Button */}
          <div className="flex items-center gap-2 flex-1">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={`Cari data ${schema.title.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
              />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200"
                  title="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Modal Trigger Button (Next to Search) */}
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer min-h-[42px] shrink-0 ${
                activeFilterCount > 0
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-xs hover:bg-indigo-100'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Buka Pengaturan Filter Data"
            >
              <SlidersHorizontal className={`w-4 h-4 ${activeFilterCount > 0 ? 'text-indigo-600' : 'text-slate-500'}`} />
              <span className="font-bold">Filter</span>
              {activeFilterCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-extrabold bg-indigo-600 text-white rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Right Side: Quick Refresh & View Switcher */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-indigo-600 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Tampilan Tabel (Desktop/Tablet)"
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-indigo-600 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Tampilan Kartu (Smartphone)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="p-2.5 text-slate-600 hover:text-indigo-600 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer min-h-[42px] min-w-[42px] flex items-center justify-center"
              title="Segarkan Data dari Cloud Firestore"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* 3. Active Filter Chips & Clear All */}
        {(activeFilterCount > 0 || searchQuery) && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Filter Aktif:
            </span>

            {/* Search Query Chip */}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                Pencarian: "{searchQuery}"
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="hover:text-rose-600 ml-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Sort Chip */}
            {activeFilters.sortBy && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Urut: {schema.fields.find(f => f.key === activeFilters.sortBy)?.label || activeFilters.sortBy} ({activeFilters.sortOrder === 'desc' ? 'Z-A / Maks' : 'A-Z / Min'})
                <button
                  type="button"
                  onClick={handleRemoveSortChip}
                  className="hover:text-rose-600 ml-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Category Chips */}
            {Object.keys(activeFilters.categories).map((fieldKey) => {
              const vals = activeFilters.categories[fieldKey];
              const fieldLabel = schema.fields.find(f => f.key === fieldKey)?.label || fieldKey;
              if (!Array.isArray(vals)) return null;
              return vals.map((val: string) => (
                <span key={`${fieldKey}-${val}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {fieldLabel}: {val}
                  <button
                    type="button"
                    onClick={() => handleRemoveCategoryChip(fieldKey, val)}
                    className="hover:text-rose-600 ml-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ));
            })}

            {/* Numeric Range Chips */}
            {Object.keys(activeFilters.numberRanges).map((fieldKey) => {
              const range = activeFilters.numberRanges[fieldKey];
              if (!range) return null;
              const fieldLabel = schema.fields.find(f => f.key === fieldKey)?.label || fieldKey;
              const chips = [];
              if (range.min !== undefined && range.min !== '') {
                chips.push(
                  <span key={`${fieldKey}-min`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Min {fieldLabel}: {Number(range.min).toLocaleString('id-ID')}
                    <button
                      type="button"
                      onClick={() => handleRemoveNumberRangeChip(fieldKey, 'min')}
                      className="hover:text-rose-600 ml-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              }
              if (range.max !== undefined && range.max !== '') {
                chips.push(
                  <span key={`${fieldKey}-max`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Maks {fieldLabel}: {Number(range.max).toLocaleString('id-ID')}
                    <button
                      type="button"
                      onClick={() => handleRemoveNumberRangeChip(fieldKey, 'max')}
                      className="hover:text-rose-600 ml-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              }
              return chips;
            })}

            {/* Clear All Reset Button */}
            <button
              type="button"
              onClick={handleResetAllFilters}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors ml-auto cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Semua Filter</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Main Content: Table or Cards with Skeleton / Empty State */}
      {loading && filteredAndSortedData.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
              <span className="text-xs font-bold text-slate-700">Sinkronisasi Basis Data {schema.title}...</span>
            </div>
            <div className="h-4 bg-slate-100 rounded-md w-24 animate-pulse" />
          </div>
          <div className="space-y-3 pt-1">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="flex items-center gap-4 py-2.5 border-b border-slate-50 last:border-0 animate-pulse">
                <div className="w-6 h-3.5 bg-slate-100 rounded shrink-0" />
                <div className="w-1/4 h-3.5 bg-slate-200/80 rounded" />
                <div className="w-1/3 h-3.5 bg-slate-100 rounded" />
                <div className="w-1/6 h-3.5 bg-slate-100 rounded" />
                <div className="ml-auto w-16 h-3.5 bg-slate-100 rounded shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ) : filteredAndSortedData.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">Tidak ada entri data yang cocok</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {searchQuery || activeFilterCount > 0
                ? 'Tidak ditemukan entri yang sesuai dengan kriteria filter dan pencarian aktif Anda.'
                : 'Mulai dengan menambahkan data baru atau mengimpor berkas Excel.'}
            </p>
          </div>
          {(searchQuery || activeFilterCount > 0) && (
            <button
              type="button"
              onClick={handleResetAllFilters}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Bersihkan Filter & Pencarian</span>
            </button>
          )}
          {canWrite && !searchQuery && activeFilterCount === 0 && (
            <button
              type="button"
              onClick={onAddClick}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Data Sekarang</span>
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* 4A. Desktop & Tablet Responsive Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 select-none">
                  <th className="px-5 py-3.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider w-12">
                    #
                  </th>
                  {visibleFields.map((field) => {
                    const isSorted = activeFilters.sortBy === field.key;
                    const isSortable = ['text', 'number', 'select'].includes(field.type);
                    return (
                      <th 
                        key={field.key} 
                        onClick={() => isSortable && handleHeaderSortClick(field.key)}
                        className={`px-5 py-3.5 text-[10px] font-extrabold uppercase tracking-wider ${
                          isSortable ? 'cursor-pointer hover:bg-slate-100/70 transition-colors' : ''
                        } ${isSorted ? 'text-indigo-600' : 'text-slate-500'}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{field.label}</span>
                          {isSortable && (
                            isSorted ? (
                              activeFilters.sortOrder === 'desc' ? (
                                <ArrowDown className="w-3 h-3 text-indigo-600" />
                              ) : (
                                <ArrowUp className="w-3 h-3 text-indigo-600" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100" />
                            )
                          )}
                        </div>
                      </th>
                    );
                  })}
                  <th className="px-5 py-3.5 text-right text-[10px] font-extrabold text-slate-400 uppercase tracking-wider w-32">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedData.map((item, idx) => (
                  <tr 
                    key={item.id || idx}
                    className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                    onClick={() => onDetailClick(item)}
                  >
                    <td className="px-5 py-4 text-xs font-mono text-slate-400">
                      {idx + 1}
                    </td>
                    {visibleFields.map((field) => (
                      <td key={field.key} className="px-5 py-4 whitespace-nowrap">
                        {renderCellContent(field, item[field.key])}
                      </td>
                    ))}
                    <td className="px-5 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onDetailClick(item)}
                          className="p-1.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                          title="Buka Halaman Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canWrite && (
                          <>
                            <button
                              type="button"
                              onClick={() => onEditClick(item)}
                              className="p-1.5 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-lg transition-colors cursor-pointer"
                              title="Edit Data"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteClick(item.id)}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Data"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 4B. Smartphone & Touch-Friendly Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedData.map((item, idx) => (
            <div 
              key={item.id || idx}
              onClick={() => onDetailClick(item)}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      #{idx + 1} • {String(item.id).substring(0, 8)}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1.5 line-clamp-1">
                      {item.name || item.customer_name || item.action || 'Entri #' + (idx + 1)}
                    </h3>
                  </div>
                  {item.category || item.department || item.payment_status || item.status ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                      {item.category || item.department || item.payment_status || item.status}
                    </span>
                  ) : null}
                </div>

                <div className="space-y-2 text-xs">
                  {visibleFields.slice(0, 3).map((f) => (
                    <div key={f.key} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-slate-400 font-medium">{f.label}:</span>
                      <div className="text-right">{renderCellContent(f, item[f.key])}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                <span 
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  onClick={() => onDetailClick(item)}
                >
                  Lihat Detail →
                </span>
                <div className="flex items-center gap-1">
                  {canWrite && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEditClick(item)}
                        className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer transition-colors"
                        title="Edit Data"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteClick(item.id)}
                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer transition-colors"
                        title="Hapus Data"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4C. Interactive Infinite Pagination ("Muat 100 Data Berikutnya") */}
      {hasMore && onLoadMore && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Database className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>
              Menampilkan <strong>{data.length}</strong> dari total <strong>{totalServerCount?.toLocaleString('id-ID') || data.length}</strong> data di Firestore.
            </span>
          </div>

          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 border border-indigo-200 rounded-xl transition-all shadow-xs cursor-pointer min-h-[42px] disabled:opacity-60"
          >
            {loadingMore ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Memuat 100 Data Berikutnya...</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 text-indigo-600" />
                <span>Muat 100 Data Berikutnya</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 5. Mobile Floating Action Button (FAB) - Strictly for Mobile Smartphone (md:hidden) */}
      {canWrite && (
        <div className="fixed bottom-20 right-5 z-40 md:hidden flex items-center">
          <button
            type="button"
            onClick={onAddClick}
            id="fab-add-button"
            className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white p-3.5 rounded-full shadow-xl shadow-indigo-600/40 hover:shadow-2xl transition-all duration-200 cursor-pointer border border-indigo-400/30 min-h-[52px] min-w-[52px]"
            title={`Tambah ${schema.title} Baru`}
            aria-label={`Tambah ${schema.title} Baru`}
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Filter Modal Dialog Component */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        schema={schema}
        currentFilters={activeFilters}
        onApplyFilters={(newFilters) => setActiveFilters(newFilters)}
        onResetFilters={handleResetAllFilters}
      />
    </div>
  );
}
