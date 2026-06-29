import React, { useState, useEffect } from 'react';
import { Cpu, Sun, Moon, Menu, X, Search, ShieldAlert, CheckCircle, Download } from 'lucide-react';
import { useAppContext } from '../../lib/context';
// @ts-ignore
import logoImg from '../../logo.png';

interface TopbarProps {
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onOpenCommandPalette: () => void;
}

export function Topbar({ isMobileMenuOpen, onToggleMobileMenu, onOpenCommandPalette }: TopbarProps) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const { db } = useAppContext();
  const [lastExport, setLastExport] = useState<number | null>(null);
  const [exportState, setExportState] = useState<'idle' | 'success'>('idle');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load last export timestamp and update on intervals
  useEffect(() => {
    const updateLastExport = () => {
      const stored = localStorage.getItem('zinnxs_last_export');
      setLastExport(stored ? parseInt(stored, 10) : null);
    };
    
    updateLastExport();
    const interval = setInterval(updateLastExport, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleBackupClick = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `zinnxs_db_export_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      localStorage.setItem('zinnxs_last_export', Date.now().toString());
      setLastExport(Date.now());
      
      setExportState('success');
      setTimeout(() => setExportState('idle'), 2000);
    } catch (e) {
      console.error("Backup export failed from Topbar", e);
    }
  };

  const isBackupSafe = lastExport && (Date.now() - lastExport < 24 * 60 * 60 * 1000);

  return (
    <header className="h-[60px] bg-hud-panel/60 border-b border-hud-border sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleMobileMenu}
          className="md:hidden p-1.5 text-hud-muted hover:text-hud-accent transition-colors border border-hud-border hover:border-hud-accent mr-1 bg-hud-bg/30"
          title="Menu"
        >
          {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <div className="w-8 h-8 border border-hud-accent/40 bg-white flex items-center justify-center relative p-0.5 overflow-hidden">
          <img src={logoImg} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          <div className="absolute inset-[-2px] border border-hud-accent/30 animate-pulse pointer-events-none"></div>
        </div>
        <div className="font-display font-black tracking-[0.2em] text-base sm:text-lg">
          <span className="text-hud-text">ZINNXS</span>
          <span className="text-hud-accent">TECH</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4 font-mono text-[10px] tracking-widest uppercase">
        {/* Backup Status Indicator */}
        <button
          onClick={handleBackupClick}
          className={`flex items-center gap-1.5 px-2.5 py-1 border transition-all ${
            exportState === 'success'
              ? 'bg-teal-500/10 border-teal-500 text-teal-400'
              : isBackupSafe
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:border-emerald-400'
                : 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20 hover:border-amber-400 animate-pulse'
          }`}
          title={
            exportState === 'success'
              ? 'Backup Concluído!'
              : isBackupSafe
                ? 'Backup seguro (realizado recentemente)'
                : 'Backup recomendado! Clique para exportar JSON'
          }
        >
          {exportState === 'success' ? (
            <>
              <CheckCircle size={11} className="text-teal-400" />
              <span className="hidden xs:inline">BACKUP OK!</span>
            </>
          ) : isBackupSafe ? (
            <>
              <CheckCircle size={11} className="text-emerald-400" />
              <span className="hidden xs:inline">DB SEGURO</span>
            </>
          ) : (
            <>
              <ShieldAlert size={11} className="text-amber-400" />
              <span>BACKUP RECOMENDADO</span>
            </>
          )}
          <Download size={10} className="opacity-70" />
        </button>

        {/* Strategic Command Palette Trigger for Mobile & Desktop */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 border border-hud-border hover:border-hud-accent/60 bg-hud-bg/30 text-hud-muted hover:text-hud-accent transition-all"
          title="Abrir busca rápida (Ctrl+K)"
        >
          <Search size={12} className="animate-pulse" />
          <span>PESQUISAR...</span>
          <kbd className="bg-hud-bg/50 px-1 border border-hud-border/80 text-[8px] text-hud-muted rounded-xs font-mono ml-1">CTRL+K</kbd>
        </button>

        <button
          onClick={onOpenCommandPalette}
          className="flex lg:hidden p-1.5 text-hud-muted hover:text-hud-accent transition-colors border border-hud-border hover:border-hud-accent bg-hud-bg/30"
          title="Pesquisa Geral"
        >
          <Search size={14} />
        </button>

        <button 
          onClick={toggleTheme}
          className="flex items-center gap-2 text-hud-muted hover:text-hud-accent transition-colors p-1.5 sm:p-1 border border-hud-border sm:border-transparent bg-hud-bg/30 sm:bg-transparent"
          title="Alternar Tema"
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          <span className="hidden md:inline">Tema</span>
        </button>
      </div>
    </header>
  );
}
