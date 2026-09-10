import React from 'react';
import { FieldSchema, ModuleSchema } from './types';
import { MapPin, FileText, ExternalLink, Download } from 'lucide-react';

/**
 * Filter out technical ID fields for clean end-user presentation
 */
export function getVisibleFields(schema: ModuleSchema): FieldSchema[] {
  return schema.fields.filter(f => f.key !== 'id');
}

/**
 * Standard Indonesian Currency Formatter
 */
export function formatCurrency(val: any): string {
  const num = Number(val);
  if (isNaN(num)) return 'Rp 0';
  return `Rp ${num.toLocaleString('id-ID')}`;
}

/**
 * Clean plain-text formatting for exports, print tables, or titles
 */
export function formatPlainString(field: FieldSchema, val: any): string {
  if (val === undefined || val === null || val === '') return '-';
  
  if (field.type === 'number') {
    return formatCurrency(val);
  }
  
  if (field.type === 'location' && val) {
    if (typeof val === 'object') {
      return val.name || `${val.lat?.toFixed(4)}, ${val.lng?.toFixed(4)}`;
    }
    return String(val);
  }

  if (field.type === 'richtext' && val) {
    return String(val).replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  }

  if (field.type === 'file' && val) {
    return '[Lampiran Berkas]';
  }

  return String(val);
}

/**
 * Universal badge color mapper for select/status fields
 */
export function getSelectBadgeClasses(val: string): string {
  const positive = ['Lunas', 'Elektronik', 'Teknologi', 'Aktif', 'Selesai', 'Disetujui', 'Terkonfirmasi'];
  const warning = ['Menunggu Pembayaran', 'Sumber Daya Manusia', 'Pemasaran', 'Proses', 'Tertunda'];
  const danger = ['Batal', 'Ditolak', 'Nonaktif', 'Kadaluarsa'];

  if (positive.includes(val)) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (warning.includes(val)) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  if (danger.includes(val)) {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

interface FieldRendererProps {
  field: FieldSchema;
  value: any;
  mode?: 'table' | 'card' | 'detail' | 'print';
}

/**
 * Standardized DRY Field Renderer for any schema field across the application
 */
export const FieldRenderer: React.FC<FieldRendererProps> = ({ field, value, mode = 'table' }) => {
  if (value === undefined || value === null || value === '') {
    return <span className="text-slate-400 text-xs italic">-</span>;
  }

  // 1. Currency & Numbers
  if (field.type === 'number') {
    if (mode === 'detail') {
      return (
        <p className="text-base sm:text-lg font-mono font-bold text-slate-900">
          {formatCurrency(value)}
        </p>
      );
    }
    return (
      <span className="font-mono text-xs font-semibold text-slate-800">
        {formatCurrency(value)}
      </span>
    );
  }

  // 2. Select & Status Badges
  if (field.type === 'select') {
    const badgeClass = getSelectBadgeClasses(String(value));
    return (
      <span className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${badgeClass}`}>
        {value}
      </span>
    );
  }

  // 3. Location Picker
  if (field.type === 'location' && value) {
    const locName = typeof value === 'object' 
      ? (value.name || `${value.lat?.toFixed(2)}, ${value.lng?.toFixed(2)}`) 
      : String(value);

    if (mode === 'detail') {
      return (
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">{locName}</p>
              {typeof value === 'object' && value.lat && value.lng && (
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  GPS: {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
                </p>
              )}
            </div>
          </div>
          {typeof value === 'object' && value.lat && value.lng && (
            <a
              href={`https://www.google.com/maps?q=${value.lat},${value.lng}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 px-3 py-2 rounded-lg border border-slate-200 transition-colors shadow-2xs self-start sm:self-auto"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Google Maps</span>
            </a>
          )}
        </div>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded-md">
        <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
        <span className="truncate max-w-[140px]">{locName}</span>
      </span>
    );
  }

  // 4. File & Media
  if (field.type === 'file' && value) {
    const isImg = typeof value === 'string' && (value.startsWith('data:image') || value.includes('unsplash.com') || value.includes('http'));

    if (mode === 'detail') {
      return (
        <div className="space-y-3">
          {isImg && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xs max-w-md bg-slate-900">
              <img 
                src={value} 
                alt="Media Preview" 
                className="w-full h-auto max-h-72 object-cover" 
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Dokumen Berkas Asli</span>
          </a>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        {isImg ? (
          <img src={value} alt="thumb" className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0" referrerPolicy="no-referrer" />
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-medium">
            <FileText className="w-3 h-3" /> Berkas
          </span>
        )}
      </div>
    );
  }

  // 5. Rich Text
  if (field.type === 'richtext') {
    if (mode === 'detail') {
      return (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs sm:text-sm text-slate-700 leading-relaxed max-w-none prose prose-slate">
          <div dangerouslySetInnerHTML={{ __html: value }} />
        </div>
      );
    }
    const plainText = String(value).replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
    return (
      <span className="text-xs text-slate-600 truncate max-w-[200px] block" title={plainText}>
        {plainText || '-'}
      </span>
    );
  }

  // 6. Default Text / String
  if (mode === 'detail') {
    return (
      <p className="text-xs sm:text-sm font-semibold text-slate-800">
        {String(value)}
      </p>
    );
  }

  return (
    <span className="text-xs text-slate-800 truncate max-w-[200px] block" title={String(value)}>
      {String(value)}
    </span>
  );
};
