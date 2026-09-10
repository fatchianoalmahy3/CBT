import React, { useState, useEffect } from 'react';
import { MODULE_REGISTRY } from './core/registry';
import { PageViewMode, ToastMessage } from './core/types';
import { useModule } from './hooks/useModule';
import { Layout } from './components/Layout';
import { ListView } from './views/ListView';
import { FormView } from './views/FormView';
import { DetailView } from './views/DetailView';
import { ImportExportView } from './views/ImportExportView';
import { PrintDocumentView } from './views/PrintDocumentView';
import { ToastContainer } from './components/Toast';
import { ConfirmDialog } from './components/ConfirmDialog';
import { 
  Terminal, 
  Layers, 
  Cpu, 
  Code, 
  CheckCircle2, 
  ShieldAlert, 
  X, 
  Sparkles,
  ChevronRight,
  Code2
} from 'lucide-react';

export default function App() {
  const [activeModuleId, setActiveModuleId] = useState('products');
  const [viewMode, setViewMode] = useState<PageViewMode | 'print'>('list');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('admin_active_role') || 'SUPER_ADMIN';
  });

  const [showBlueprint, setShowBlueprint] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Interactive Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Confirm Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteItemData, setDeleteItemData] = useState<any | null>(null);

  // Active module schema
  const activeModule = MODULE_REGISTRY.find(m => m.id === activeModuleId) || MODULE_REGISTRY[0];

  // Dynamic CRUD state for current active module
  const {
    data,
    totalServerCount,
    loading,
    loadingMore,
    hasMore,
    error,
    searchQuery,
    setSearchQuery,
    refresh,
    loadMore,
    createItem,
    bulkImportItems,
    updateItem,
    deleteItem
  } = useModule(activeModuleId);

  const showToast = (
    message: string, 
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    title?: string,
    action?: { label: string; onClick: () => void }
  ) => {
    const newToast: ToastMessage = {
      id: `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      message,
      type,
      title,
      action
    };
    setToasts(prev => [newToast, ...prev].slice(0, 5)); // max 5 stacked toasts
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Handle role change with simulator feedback
  const handleRoleChange = (newRole: string) => {
    setUserRole(newRole);
    localStorage.setItem('admin_active_role', newRole);
    showToast(`Peran simulasi berhasil diubah ke: ${newRole.replace('_', ' ')}`, 'success', 'Peran Diubah');
    setTimeout(() => refresh(), 50);
  };

  // Module change handler
  const handleModuleSelect = (id: string) => {
    setActiveModuleId(id);
    setViewMode('list');
    setSelectedItem(null);
    setSearchQuery('');
  };

  // Navigation handlers
  const handleGoToList = () => {
    setViewMode('list');
    setSelectedItem(null);
  };

  const handleGoToAdd = () => {
    setSelectedItem(null);
    setViewMode('create');
  };

  const handleGoToEdit = (item: any) => {
    setSelectedItem(item);
    setViewMode('edit');
  };

  const handleGoToDetail = (item: any) => {
    setSelectedItem(item);
    setViewMode('detail');
  };

  const handleGoToImportExport = () => {
    setViewMode('import_export');
  };

  const handleGoToPrint = () => {
    setViewMode('print');
  };

  // Form submit handler (Create / Update)
  const handleFormSubmit = async (values: Record<string, any>) => {
    setIsSaving(true);
    try {
      if (viewMode === 'edit' && selectedItem) {
        const updated = await updateItem(selectedItem.id, values);
        setSelectedItem(updated);
        showToast(
          'Data berhasil diperbarui sesuai validasi skema.', 
          'success', 
          `${activeModule.title} Diperbarui`,
          { label: 'Lihat', onClick: () => setViewMode('detail') }
        );
        setViewMode('detail');
      } else {
        const created = await createItem(values);
        showToast(
          'Data baru berhasil ditambahkan ke database REST!', 
          'success', 
          `${activeModule.title} Ditambahkan`,
          { label: 'Detail', onClick: () => { setSelectedItem(created); setViewMode('detail'); } }
        );
        setViewMode('list');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan entri data.', 'error', 'Error Penyimpanan');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Delete handler - trigger confirm dialog
  const requestDelete = (id: string) => {
    const item = data.find((i: any) => i.id === id);
    setDeleteId(id);
    setDeleteItemData(item);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteItem(deleteId);
      showToast('Data berhasil dihapus dari database.', 'info', 'Data Terhapus');
      if (viewMode === 'detail' || viewMode === 'edit') {
        handleGoToList();
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus entri data.', 'error', 'Gagal Hapus');
    } finally {
      setDeleteId(null);
      setDeleteItemData(null);
    }
  };

  // Bulk import handler
  const handleBulkImport = async (items: any[]) => {
    const result = await bulkImportItems(items);
    showToast(`Sukses mengimpor ${result.totalInserted} baris data via Excel!`, 'success', 'Import Sukses');
    return result;
  };

  const isAllowedToView = activeModule.allowedRoles.includes(userRole);

  return (
    <Layout
      modules={MODULE_REGISTRY}
      activeModuleId={activeModuleId}
      onModuleSelect={handleModuleSelect}
      userRole={userRole}
      onRoleChange={handleRoleChange}
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Developer Blueprint Toggle Header */}
        <div className="flex items-center justify-between bg-slate-900 text-slate-300 px-4 py-2.5 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-white">Dynamic Architecture Core:</span>
            <span className="text-slate-400 hidden sm:inline">Halaman terpisah per Tupoksi (List, Form, Detail, Import/Export, Print)</span>
          </div>
          <button
            onClick={() => setShowBlueprint(prev => !prev)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold rounded-lg transition-colors cursor-pointer text-[11px]"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{showBlueprint ? 'Tutup Schema Inspector' : 'Buka Schema Inspector'}</span>
          </button>
        </div>

        {/* Schema Blueprint Inspector (Collapsible) */}
        {showBlueprint && (
          <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-xl border border-slate-800 animate-in fade-in duration-200">
            <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                Live TypeScript Schema Definition ({activeModule.id})
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 font-mono font-bold rounded">
                REST BACKEND VALIDATION CONTRACT
              </span>
            </div>
            <div className="p-5 font-mono text-[11px] text-indigo-300 leading-relaxed overflow-x-auto max-h-64">
              <pre className="text-white select-all">
                {JSON.stringify(activeModule, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* RBAC Access Denied Guard */}
        {!isAllowedToView ? (
          <div className="bg-white border-2 border-dashed border-rose-200 rounded-2xl p-12 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">Hak Akses Modul Dibatasi (403 Forbidden)</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Peran Anda saat ini (<strong>{userRole.replace('_', ' ')}</strong>) tidak memiliki izin untuk melihat modul <strong>{activeModule.title}</strong>.
              </p>
              <p className="text-xs text-slate-400">
                Gunakan menu <strong>Simulasi RBAC</strong> di sidebar untuk beralih ke peran Super Admin.
              </p>
            </div>
          </div>
        ) : (
          /* Multi-Page Views Rendered based on viewMode */
          <div>
            {viewMode === 'list' && (
              <ListView
                schema={activeModule}
                data={data}
                totalServerCount={totalServerCount}
                loading={loading}
                loadingMore={loadingMore}
                hasMore={hasMore}
                onLoadMore={loadMore}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onRefresh={() => refresh(true)}
                onAddClick={handleGoToAdd}
                onEditClick={handleGoToEdit}
                onDetailClick={handleGoToDetail}
                onDeleteClick={requestDelete}
                onImportExportClick={handleGoToImportExport}
                onPrintClick={handleGoToPrint}
                userRole={userRole}
              />
            )}

            {(viewMode === 'create' || viewMode === 'edit') && (
              <FormView
                schema={activeModule}
                initialData={viewMode === 'edit' ? selectedItem : null}
                onSubmit={handleFormSubmit}
                onBack={handleGoToList}
                loading={isSaving}
              />
            )}

            {viewMode === 'detail' && selectedItem && (
              <DetailView
                schema={activeModule}
                item={selectedItem}
                onBack={handleGoToList}
                onEdit={handleGoToEdit}
                onDelete={requestDelete}
                onPrint={handleGoToPrint}
                userRole={userRole}
              />
            )}

            {viewMode === 'import_export' && (
              <ImportExportView
                schema={activeModule}
                currentData={data}
                onBack={handleGoToList}
                onBulkImport={handleBulkImport}
                userRole={userRole}
              />
            )}

            {viewMode === 'print' && (
              <PrintDocumentView
                schema={activeModule}
                data={data}
                onBack={handleGoToList}
                userRole={userRole}
              />
            )}
          </div>
        )}
      </div>

      {/* Global Modals & Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Konfirmasi Hapus Data"
        message={`Apakah Anda yakin ingin menghapus data ini secara permanen?`}
        confirmLabel="Hapus Data"
        cancelLabel="Batal"
        variant="danger"
        previewData={deleteItemData ? [
          { label: 'ID', value: deleteItemData.id },
          { label: 'Modul', value: activeModule.title }
        ] : undefined}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteId(null);
          setDeleteItemData(null);
        }}
      />
    </Layout>
  );
}
