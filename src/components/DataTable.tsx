import { useState, useMemo } from 'react';
import { ModuleSchema } from '../core/types';
import { 
  Search, 
  Edit3, 
  Trash2, 
  Plus, 
  RefreshCw, 
  Eye, 
  MapPin, 
  FileText, 
  File, 
  SlidersHorizontal,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw
} from 'lucide-react';
import { FilterModal, FilterState } from './FilterModal';

interface DataTableProps {
  schema: ModuleSchema;
  data: any[];
  loading: boolean;
  onAddClick: () => void;
  onEditClick: (item: any) => void;
  onDeleteClick: (id: string) => void;
  onRefresh: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userRole: string;
}

const INITIAL_FILTER_STATE: FilterState = {
  categories: {},
  numberRanges: {},
  sortBy: undefined,
  sortOrder: 'asc'
};

export function DataTable({
  schema,
  data,
  loading,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onRefresh,
  searchQuery,
  onSearchChange,
  userRole
}: DataTableProps) {
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>(INITIAL_FILTER_STATE);

  const canWrite = schema.allowedRoles.includes(userRole);

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

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item => {
        return schema.fields.some(field => {
          const val = item[field.key];
          if (val === undefined || val === null) return false;
          return String(val).toLowerCase().includes(q);
        }) || (item.id && String(item.id).toLowerCase().includes(q));
      });
    }

    // Categories
    Object.keys(activeFilters.categories).forEach((fieldKey) => {
      const vals = activeFilters.categories[fieldKey];
      if (Array.isArray(vals) && vals.length > 0) {
        result = result.filter(item => vals.includes(String(item[fieldKey])));
      }
    });

    // Number ranges
    Object.keys(activeFilters.numberRanges).forEach((fieldKey) => {
      const range = activeFilters.numberRanges[fieldKey];
      if (range) {
        if (range.min !== undefined && range.min !== '') {
          result = result.filter(item => Number(item[fieldKey]) >= Number(range.min));
        }
        if (range.max !== undefined && range.max !== '') {
          result = result.filter(item => Number(item[fieldKey]) <= Number(range.max));
        }
      }
    });

    // Sorting
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
        return isDesc 
          ? String(valB).localeCompare(String(valA))
          : String(valA).localeCompare(String(valB));
      });
    }

    return result;
  }, [data, searchQuery, activeFilters, schema.fields]);

  const handleHeaderSortClick = (fieldKey: string) => {
    setActiveFilters(prev => {
      if (prev.sortBy === fieldKey) {
        if (prev.sortOrder === 'asc') return { ...prev, sortOrder: 'desc' };
        return { ...prev, sortBy: undefined, sortOrder: 'asc' };
      }
      return { ...prev, sortBy: fieldKey, sortOrder: 'asc' };
    });
  };

  const formatValue = (field: any, val: any) => {
    if (val === undefined || val === null || val === '') return <span className="text-slate-400 italic text-xs">Kosong</span>;

    if (field.type === 'file') {
      return (
        <a 
          href={val} 
          target="_blank" 
          rel="noreferrer" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full transition-colors"
        >
          <File className="w-3.5 h-3.5" />
          Lihat Berkas
        </a>
      );
    }

    if (field.type === 'location') {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-slate-700 font-medium">
          <MapPin className="w-3.5 h-3.5 text-indigo-500" />
          {val.name || `LAT: ${val.lat?.toFixed(2)}, LNG: ${val.lng?.toFixed(2)}`}
        </span>
      );
    }

    if (field.type === 'number') {
      return (
        <span className="font-mono text-xs font-semibold text-slate-800">
          IDR {Number(val).toLocaleString('id-ID')}
        </span>
      );
    }

    if (field.type === 'richtext') {
      return (
        <div 
          className="text-xs text-slate-600 line-clamp-1 truncate max-w-[200px]"
          dangerouslySetInnerHTML={{ __html: val }}
        />
      );
    }

    return <span className="text-xs text-slate-700 font-medium">{val}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={`Cari ${schema.title.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Modal Trigger Button */}
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer min-h-[42px] shrink-0 ${
                activeFilterCount > 0
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-xs hover:bg-indigo-100'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Buka Filter Data"
            >
              <SlidersHorizontal className={`w-4 h-4 ${activeFilterCount > 0 ? 'text-indigo-600' : 'text-slate-500'}`} />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-extrabold bg-indigo-600 text-white rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="p-2.5 text-slate-600 hover:text-indigo-600 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer min-h-[42px] min-w-[42px] flex items-center justify-center"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            {canWrite && (
              <button
                type="button"
                onClick={onAddClick}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer min-h-[42px]"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Filter Aktif:
            </span>
            <button
              type="button"
              onClick={() => setActiveFilters(INITIAL_FILTER_STATE)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors ml-auto cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filter</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Data list and Dynamic detail view panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table/List Container */}
        <div className={`bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all ${selectedDetail ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 select-none">
                  {schema.fields.map((field) => {
                    const isSorted = activeFilters.sortBy === field.key;
                    const isSortable = ['text', 'number', 'select'].includes(field.type);
                    return (
                      <th 
                        key={field.key} 
                        onClick={() => isSortable && handleHeaderSortClick(field.key)}
                        className={`px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-wider ${
                          isSortable ? 'cursor-pointer hover:bg-slate-100/70 transition-colors' : ''
                        } ${isSorted ? 'text-indigo-600' : 'text-slate-400'}`}
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
                  <th className="px-6 py-3.5 text-right text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={schema.fields.length + 1} className="text-center py-12">
                      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-xs text-slate-500 font-semibold">Mengambil data dari Firestore...</p>
                    </td>
                  </tr>
                ) : filteredAndSortedData.length === 0 ? (
                  <tr>
                    <td colSpan={schema.fields.length + 1} className="text-center py-12">
                      <p className="text-xs text-slate-400 font-medium italic">Tidak ada data ditemukan.</p>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedData.map((item) => (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${selectedDetail?.id === item.id ? 'bg-indigo-50/40' : ''}`}
                      onClick={() => setSelectedDetail(item)}
                    >
                      {schema.fields.map((field) => (
                        <td key={field.key} className="px-6 py-3.5 whitespace-nowrap">
                          {formatValue(field, item[field.key])}
                        </td>
                      ))}
                      <td className="px-6 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedDetail(item)}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {canWrite && (
                            <>
                              <button
                                type="button"
                                onClick={() => onEditClick(item)}
                                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-amber-600 rounded-lg transition-colors cursor-pointer"
                                title="Edit Data"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteClick(item.id)}
                                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Data"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Detail Viewer Panel */}
        {selectedDetail && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                Detail Entri
              </h3>
              <button 
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="text-xs text-slate-400 hover:text-slate-600 font-semibold p-1 hover:bg-slate-50 rounded-lg"
              >
                ✕ Tutup
              </button>
            </div>

            <div className="space-y-4">
              {schema.fields.map((field) => {
                const val = selectedDetail[field.key];
                return (
                  <div key={field.key} className="space-y-1 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{field.label}</span>
                    {field.type === 'richtext' ? (
                      <div 
                        className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 max-h-40 overflow-y-auto mt-1 prose prose-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: val || '<p class="text-slate-400 italic">Kosong</p>' }}
                      />
                    ) : field.type === 'file' && val ? (
                      <div className="mt-1">
                        {val.startsWith('data:image') || val.includes('unsplash.com') ? (
                          <div className="rounded-xl overflow-hidden border border-slate-100 shadow-xs bg-slate-50 max-h-32">
                            <img src={val} alt="Uploaded attachment" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        ) : (
                          <a 
                            href={val} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="flex items-center gap-2 p-2 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-lg border border-indigo-100 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            Unduh Dokumen Berkas
                          </a>
                        )}
                      </div>
                    ) : field.type === 'location' && val ? (
                      <div className="mt-1 bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{val.name || 'Lokasi Terpilih'}</p>
                          <span className="text-[10px] font-mono text-slate-400">LAT: {val.lat?.toFixed(4)}, LNG: {val.lng?.toFixed(4)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs font-medium text-slate-800 leading-relaxed">{val || '-'}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        schema={schema}
        currentFilters={activeFilters}
        onApplyFilters={(newFilters) => setActiveFilters(newFilters)}
        onResetFilters={() => setActiveFilters(INITIAL_FILTER_STATE)}
      />
    </div>
  );
}
