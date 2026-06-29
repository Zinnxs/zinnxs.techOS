import React, { useState, useEffect } from 'react';
import { AlertTriangle, Download, X, Check, ShieldAlert } from 'lucide-react';
import { useAppContext } from '../../lib/context';

export function BackupReminder() {
  const { db } = useAppContext();
  const [showToast, setShowToast] = useState(false);
  const [exportState, setExportState] = useState<'idle' | 'success'>('idle');

  useEffect(() => {
    // Check when was the last time the user exported the database
    const lastExport = localStorage.getItem('zinnxs_last_export');
    const dismissedUntil = localStorage.getItem('zinnxs_backup_snooze');
    const now = Date.now();

    // If dismissed recently, respect the snooze
    if (dismissedUntil && now < parseInt(dismissedUntil, 10)) {
      return;
    }

    // If never exported, or exported more than 24 hours ago, show the reminder
    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (!lastExport || now - parseInt(lastExport, 10) > ONE_DAY) {
      // Show the reminder after 3 seconds on load
      const timer = setTimeout(() => {
        setShowToast(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleExport = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `zinnxs_db_export_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      // Save last export timestamp
      localStorage.setItem('zinnxs_last_export', Date.now().toString());
      
      setExportState('success');
      setTimeout(() => {
        setExportState('idle');
        setShowToast(false);
      }, 2000);
    } catch (e) {
      console.error("Backup export failed", e);
    }
  };

  const handleSnooze = () => {
    // Snooze reminder for 1 hour
    const snoozeTime = Date.now() + 60 * 60 * 1000;
    localStorage.setItem('zinnxs_backup_snooze', snoozeTime.toString());
    setShowToast(false);
  };

  if (!showToast) return null;

  return (
    <div 
      className="fixed bottom-6 right-6 z-[100] max-w-sm w-full bg-hud-panel/95 backdrop-blur-md border-2 border-amber-500/50 shadow-2xl p-4 text-hud-text animate-slide-in font-mono"
      style={{
        boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xs mt-0.5 shrink-0 animate-pulse">
          <ShieldAlert size={18} />
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-start">
            <h4 className="text-xs font-black tracking-widest text-amber-400 uppercase">
              // ALERTA DE BACKUP
            </h4>
            <button 
              onClick={handleSnooze}
              className="p-0.5 text-hud-muted hover:text-hud-danger transition-colors border border-transparent hover:border-hud-border/40"
              title="Lembrar mais tarde"
            >
              <X size={14} />
            </button>
          </div>
          
          <p className="text-[10px] leading-relaxed text-hud-muted uppercase">
            Seus dados são salvos localmente. Excluir o cache ou redefinir o navegador apagará suas OS's. Exporte um backup para garantir a segurança dos dados.
          </p>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleExport}
              className={`flex-1 py-1.5 px-3 text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 border ${
                exportState === 'success'
                  ? 'bg-teal-500/20 border-teal-500 text-teal-400'
                  : 'bg-amber-500/20 border-amber-500/60 text-amber-400 hover:bg-amber-500 hover:text-black hover:border-amber-500'
              }`}
            >
              {exportState === 'success' ? (
                <>
                  <Check size={12} className="animate-bounce" />
                  EXPORTADO!
                </>
              ) : (
                <>
                  <Download size={12} />
                  EXPORTAR JSON
                </>
              )}
            </button>
            <button
              onClick={handleSnooze}
              className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase border border-hud-border hover:border-hud-accent/50 text-hud-muted hover:text-hud-text transition-all bg-hud-bg/30"
            >
              DEPOIS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
