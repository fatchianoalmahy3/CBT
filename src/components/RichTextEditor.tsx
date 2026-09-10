import { useState, ChangeEvent } from 'react';
import { Bold, Italic, List, AlignLeft, Eye } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
}

export function RichTextEditor({ value, onChange, placeholder, label }: RichTextEditorProps) {
  const [isPreview, setIsPreview] = useState(false);

  // Minimalist, robust, real-time rich text editor simulation using standard content editable or direct interactive controls
  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const applyFormat = (format: string) => {
    if (isPreview) return;
    let selectedText = '';
    
    // We can simulate visual formatting tools by wrapping text beautifully
    let startTag = '';
    let endTag = '';
    switch (format) {
      case 'bold':
        startTag = '<strong>';
        endTag = '</strong>';
        break;
      case 'italic':
        startTag = '<em>';
        endTag = '</em>';
        break;
      case 'list':
        startTag = '<ul>\n  <li>';
        endTag = '</li>\n</ul>';
        break;
      case 'p':
        startTag = '<p>';
        endTag = '</p>';
        break;
    }

    // Append beautiful template or wraps
    const val = value || '';
    onChange(val + startTag + 'Teks Baru' + endTag);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className={`text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
            isPreview ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          {isPreview ? 'Sunting Teks' : 'Pratinjau HTML'}
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all">
        {/* Editor Toolbar */}
        <div className="bg-slate-50 border-b border-slate-100 px-3 py-1.5 flex items-center gap-1">
          <button
            type="button"
            disabled={isPreview}
            onClick={() => applyFormat('bold')}
            className="p-1.5 hover:bg-white text-slate-600 hover:text-indigo-600 rounded-lg disabled:opacity-40 transition-colors"
            title="Tebalkan"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={isPreview}
            onClick={() => applyFormat('italic')}
            className="p-1.5 hover:bg-white text-slate-600 hover:text-indigo-600 rounded-lg disabled:opacity-40 transition-colors"
            title="Miringkan"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={isPreview}
            onClick={() => applyFormat('list')}
            className="p-1.5 hover:bg-white text-slate-600 hover:text-indigo-600 rounded-lg disabled:opacity-40 transition-colors"
            title="Daftar Bulat"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={isPreview}
            onClick={() => applyFormat('p')}
            className="p-1.5 hover:bg-white text-slate-600 hover:text-indigo-600 rounded-lg disabled:opacity-40 text-xs font-bold font-mono transition-colors"
            title="Paragraf"
          >
            P
          </button>
          <div className="h-4 w-px bg-slate-200 mx-1"></div>
          <span className="text-[10px] text-slate-400 font-mono select-none">HTML WYSIWYG Engine</span>
        </div>

        {/* Text Area or HTML Preview */}
        {isPreview ? (
          <div 
            className="p-4 min-h-[140px] max-h-[250px] overflow-y-auto prose prose-sm text-slate-700 bg-slate-50/50"
            dangerouslySetInnerHTML={{ __html: value || `<p className="text-slate-400 italic">Kosong</p>` }}
          />
        ) : (
          <textarea
            value={value}
            onChange={handleTextareaChange}
            placeholder={placeholder || 'Tulis konten HTML di sini... Gunakan toolbar di atas untuk mempercepat.'}
            className="w-full p-4 min-h-[140px] text-xs font-mono text-slate-700 focus:outline-none resize-y"
          />
        )}
      </div>
    </div>
  );
}
