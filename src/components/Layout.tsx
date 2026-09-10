import React, { useState } from 'react';
import { ModuleSchema, PageViewMode } from '../core/types';
import { 
  Package, 
  Users, 
  Receipt, 
  History, 
  ShieldAlert, 
  Key, 
  Database, 
  Menu, 
  X, 
  Layers, 
  SlidersHorizontal,
  Home,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  modules: ModuleSchema[];
  activeModuleId: string;
  onModuleSelect: (id: string) => void;
  userRole: string;
  onRoleChange: (role: string) => void;
  viewMode?: PageViewMode;
  onViewModeChange?: (mode: PageViewMode) => void;
}

export function Layout({
  children,
  modules,
  activeModuleId,
  onModuleSelect,
  userRole,
  onRoleChange,
  viewMode = 'list',
  onViewModeChange
}: LayoutProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Package': return <Package className="w-4 h-4" />;
      case 'Users': return <Users className="w-4 h-4" />;
      case 'Receipt': return <Receipt className="w-4 h-4" />;
      case 'History': return <History className="w-4 h-4" />;
      default: return <Layers className="w-4 h-4" />;
    }
  };

  const roles = [
    { value: 'SUPER_ADMIN', label: '🛡️ Super Admin (Full Akses)' },
    { value: 'HR_MANAGER', label: '👥 HR Manager (Karyawan & Audit)' },
    { value: 'SALES_REP', label: '💼 Sales Rep (Produk & Pesanan)' },
    { value: 'VIEWER', label: '👁️ Viewer Only (Hanya Baca)' }
  ];

  const handleModuleClick = (id: string) => {
    onModuleSelect(id);
    setMobileDrawerOpen(false);
  };

  return (
    <div className="h-full flex overflow-hidden font-sans bg-[#f8fafc] text-slate-900 antialiased">
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileDrawerOpen && (
        <div 
          onClick={() => setMobileDrawerOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Layout (Desktop & Mobile Slide-Over Drawer) */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-[#0f172a] text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800
        transform transition-transform duration-200 ease-in-out
        ${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-md shadow-indigo-600/30">
              SK
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-white block">Enterprise Kit</span>
              <span className="text-[10px] text-indigo-400 font-mono font-bold tracking-wider uppercase block">Tupoksi Engine v2</span>
            </div>
          </div>
          <button 
            onClick={() => setMobileDrawerOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modules Navigation Links */}
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-extrabold mb-2.5 px-3">
            Modul & Tupoksi Operasional
          </div>

          <div className="space-y-1">
            {modules.map((mod) => {
              const isActive = activeModuleId === mod.id;
              const isAllowed = mod.allowedRoles.includes(userRole);

              return (
                <button
                  key={mod.id}
                  onClick={() => handleModuleClick(mod.id)}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl transition-all text-left cursor-pointer min-h-[44px] ${
                    isActive
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                      : 'hover:bg-slate-800/70 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-white' : 'opacity-70'}>
                      {getIcon(mod.icon)}
                    </span>
                    <span className="text-xs font-semibold">{mod.title}</span>
                  </div>
                  {!isAllowed && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
                      Terkunci
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-8 text-[10px] uppercase tracking-widest text-slate-500 font-extrabold mb-2.5 px-3">
            Database & Storage Engine
          </div>
          <div className="space-y-2.5 px-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Cloud Firestore</span>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                FIREBASE LIVE
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Cloud Storage</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ACTIVE
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Security Rules</span>
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                ENFORCED
              </span>
            </div>
          </div>
        </nav>

        {/* User Role Simulator Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0b0f19]">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400 font-bold px-1">
              <span className="flex items-center gap-1.5">
                <Key className="w-3 h-3 text-indigo-400" />
                Simulasi RBAC
              </span>
              <span className="text-[9px] text-indigo-400 font-mono">LIVE</span>
            </div>
            <select
              value={userRole}
              onChange={(e) => onRoleChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl text-xs py-2.5 px-3 text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r.value} value={r.value} className="bg-slate-900 text-white">
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </aside>

      {/* Main Container Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] pb-16 md:pb-0 overflow-hidden">
        {/* Dynamic Top App Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 md:px-8 flex items-center justify-between flex-shrink-0 shadow-2xs z-10">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              title="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-extrabold text-slate-900">
                Enterprise Admin Gateway
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-[10px] font-bold text-amber-700 rounded-full border border-amber-200">
                <Database className="w-3 h-3 text-amber-500" />
                Firebase Firestore
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Peran Saat Ini</div>
              <div className="text-xs font-extrabold text-indigo-600">
                {userRole.replace('_', ' ')}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Viewport Content */}
        <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto min-h-0">
          {children}
        </div>
      </main>

      {/* Mobile Smartphone Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 px-2 py-1 flex items-center justify-around shadow-lg">
        {modules.map((mod) => {
          const isActive = activeModuleId === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => handleModuleClick(mod.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all cursor-pointer min-h-[48px] min-w-[48px] ${
                isActive ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {getIcon(mod.icon)}
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[70px]">
                {mod.title.split(' ')[1] || mod.title.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
