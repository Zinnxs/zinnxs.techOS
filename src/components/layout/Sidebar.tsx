import React, { useState } from 'react';
import { Terminal, LayoutDashboard, Users, FileText, Wrench, Package, Folder, Download, Upload } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppContext } from '../../lib/context';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
}

export function Sidebar({ currentView, onChangeView }: SidebarProps) {
  const { db } = useAppContext();
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clientes', label: 'Clientes', icon: Users, badge: db.clientes.length },
    { id: 'ordens', label: 'Ordens de Serviço', icon: FileText, badge: db.ordens.length },
    { id: 'servicos', label: 'Serviços', icon: Wrench, badge: db.servicos.length },
    { id: 'estoque', label: 'Estoque', icon: Package, badge: db.estoque.length },
    { id: 'arquivos', label: 'Arquivos', icon: Folder, badge: db.arquivos.length },
  ];

  return (
    <div className="w-64 flex-shrink-0 bg-hud-panel/60 backdrop-blur-md border-r border-hud-border flex flex-col h-[calc(100vh-60px)] sticky top-[60px]">
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
            onClick={() => onChangeView(item.id)}
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
        
        <button className="flex items-center gap-3 w-full p-3 font-mono text-xs tracking-wider text-hud-muted hover:bg-hud-bg hover:text-hud-text border border-transparent hover:border-hud-border transition-all uppercase text-left">
          <Download size={16} className="opacity-70" />
          Exportar DB
        </button>
        <button className="flex items-center gap-3 w-full p-3 font-mono text-xs tracking-wider text-hud-muted hover:bg-hud-bg hover:text-hud-text border border-transparent hover:border-hud-border transition-all uppercase text-left">
          <Upload size={16} className="opacity-70" />
          Importar DB
        </button>
      </div>
      
      <div className="p-4 border-t border-hud-border/50 text-center font-mono text-[9px] text-hud-muted tracking-widest uppercase">
        ZINNXS.OS v2.0.4<br/>
        <span className="text-hud-accent">STATUS: ONLINE</span>
      </div>
    </div>
  );
}
