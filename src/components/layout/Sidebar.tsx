import React, { useState, useRef } from 'react';
import { Terminal, LayoutDashboard, Users, FileText, Wrench, Package, Folder, Download, Upload, Check, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppContext } from '../../lib/context';
// @ts-ignore
import logoImg from '../../logo.png';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  isMobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}

export function Sidebar({ currentView, onChangeView, isMobileMenuOpen, onCloseMobileMenu }: SidebarProps) {
  const { db, updateDB } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportState, setExportState] = useState<'idle' | 'success'>('idle');
  const [importState, setImportState] = useState<'idle' | 'success' | 'error'>('idle');
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clientes', label: 'Clientes', icon: Users, badge: db.clientes.length },
    { id: 'ordens', label: 'Ordens de Serviço', icon: FileText, badge: db.ordens.length },
    { id: 'servicos', label: 'Serviços', icon: Wrench, badge: db.servicos.length },
    { id: 'estoque', label: 'Estoque', icon: Package, badge: db.estoque.length },
    { id: 'arquivos', label: 'Arquivos', icon: Folder, badge: db.arquivos.length },
  ];

  const handleExport = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `zinnxs_db_export_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      setExportState('success');
      setTimeout(() => setExportState('idle'), 2000);
      onCloseMobileMenu();
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        
        if (typeof parsed === 'object' && parsed !== null) {
          updateDB(() => ({
            clientes: Array.isArray(parsed.clientes) ? parsed.clientes : [],
            ordens: Array.isArray(parsed.ordens) ? parsed.ordens : [],
            servicos: Array.isArray(parsed.servicos) ? parsed.servicos : [],
            estoque: Array.isArray(parsed.estoque) ? parsed.estoque : [],
            movimentacoes: Array.isArray(parsed.movimentacoes) ? parsed.movimentacoes : [],
            arquivos: Array.isArray(parsed.arquivos) ? parsed.arquivos : [],
            lastOS: typeof parsed.lastOS === 'number' ? parsed.lastOS : db.lastOS || 0,
          }));
          
          setImportState('success');
          setTimeout(() => setImportState('idle'), 2000);
        } else {
          setImportState('error');
          setTimeout(() => setImportState('idle'), 3000);
        }
      } catch (err) {
        setImportState('error');
        setTimeout(() => setImportState('idle'), 3000);
      }
    };
    reader.readAsText(file);
    onCloseMobileMenu();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      {/* Backdrop overlay for mobile screen when sidebar is open */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 top-[60px] bg-black/60 backdrop-blur-xs z-40 md:hidden"
          onClick={onCloseMobileMenu}
        />
      )}
      
      <div className={cn(
        "fixed md:sticky top-[60px] h-[calc(100vh-60px)] z-50 md:z-auto bg-hud-panel md:bg-hud-panel/60 backdrop-blur-md border-r border-hud-border flex flex-col transition-transform duration-300 w-64 flex-shrink-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-4 border-b border-hud-border/50">
          <h2 className="font-mono text-[10px] tracking-widest text-hud-muted uppercase flex items-center gap-2">
            <Terminal size={12} className="text-hud-accent" />
            Módulos do Sistema
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onChangeView(item.id);
                onCloseMobileMenu();
              }}
              className={cn(
                "flex items-center justify-between w-full p-3 font-mono text-xs tracking-wider transition-all border border-transparent uppercase text-left",
                currentView === item.id 
                  ? "bg-hud-accent/15 text-hud-accent border-hud-accent/30" 
                  : "text-hud-muted hover:bg-hud-accent/5 hover:text-hud-text hover:border-hud-border"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon size={16} className={currentView === item.id ? "text-hud-accent" : "opacity-70"} />
                {item.label}
              </div>
              {item.badge !== undefined && (
                <span className={cn(
                  "px-2 py-0.5 text-[10px] font-bold border",
                  currentView === item.id
                    ? "bg-hud-accent text-hud-bg border-hud-accent"
                    : "bg-hud-bg text-hud-muted border-hud-border"
                )}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
          
          <div className="mt-8 mb-2 px-1">
            <h2 className="font-mono text-[10px] tracking-widest text-hud-muted uppercase">
              // SYS_OP
            </h2>
          </div>
          
          <button 
            id="sidebar-btn-export-db"
            onClick={handleExport}
            className={cn(
              "flex items-center gap-3 w-full p-3 font-mono text-xs tracking-wider border border-transparent transition-all uppercase text-left",
              exportState === 'success'
                ? "bg-teal-500/10 text-teal-400 border-teal-500/30"
                : "text-hud-muted hover:bg-hud-bg hover:text-hud-text hover:border-hud-border"
            )}
          >
            {exportState === 'success' ? (
              <>
                <Check size={16} className="text-teal-400" />
                EXPORTADO!
              </>
            ) : (
              <>
                <Download size={16} className="opacity-70" />
                Exportar DB
              </>
            )}
          </button>
          
          <button 
            id="sidebar-btn-import-db"
            onClick={handleImportClick}
            className={cn(
              "flex items-center gap-3 w-full p-3 font-mono text-xs tracking-wider border border-transparent transition-all uppercase text-left",
              importState === 'success' && "bg-teal-500/10 text-teal-400 border-teal-500/30",
              importState === 'error' && "bg-hud-danger/10 text-hud-danger border-hud-danger/30",
              importState === 'idle' && "text-hud-muted hover:bg-hud-bg hover:text-hud-text hover:border-hud-border"
            )}
          >
            {importState === 'success' ? (
              <>
                <Check size={16} className="text-teal-400" />
                IMPORTADO!
              </>
            ) : importState === 'error' ? (
              <>
                <AlertTriangle size={16} className="text-hud-danger" />
                ERRO IMPORT
              </>
            ) : (
              <>
                <Upload size={16} className="opacity-70" />
                Importar DB
              </>
            )}
          </button>

          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json"
            className="hidden"
          />
        </div>
        
        <div className="p-4 border-t border-hud-border/50 text-center font-mono text-[9px] text-hud-muted tracking-widest uppercase flex flex-col items-center gap-2">
          <div className="w-10 h-10 border border-hud-border/40 bg-white p-0.5 rounded-sm overflow-hidden mb-1 flex items-center justify-center">
            <img src={logoImg} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
          <div>
            ZINNXS.OS v2.0.4<br/>
            <span className="text-hud-accent">STATUS: ONLINE</span>
          </div>
        </div>
      </div>
    </>
  );
}
