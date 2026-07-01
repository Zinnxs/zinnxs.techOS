import React from 'react';
import { Modal } from './Modal';
import { Keyboard, HelpCircle, Navigation, Pocket, Settings, Activity, FileText } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  const Kbd = ({ children }: { children: React.ReactNode }) => (
    <kbd className="bg-hud-panel border-2 border-hud-border/80 border-b-hud-accent px-1.5 py-0.5 rounded-sm text-hud-accent text-[11px] font-mono font-bold shadow-[0_2px_0_rgba(0,0,0,0.4)] mx-0.5 inline-flex items-center justify-center min-w-[20px] text-center h-5">
      {children}
    </kbd>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="SYS.HELP_HOTKEYS [ Atalhos de Teclado ]"
      size="md"
      footer={
        <button className="hud-button-primary !py-1.5 !px-4" onClick={onClose}>
          [ ENTENDIDO ]
        </button>
      }
    >
      <div className="space-y-6 font-mono text-xs text-hud-muted">
        {/* Header decoration */}
        <div className="flex items-center gap-2 border-b border-hud-border/40 pb-3">
          <Keyboard className="text-hud-accent shrink-0" size={16} />
          <p className="uppercase text-[10px] tracking-widest text-hud-accent font-bold">
            // COMANDOS RÁPIDOS DE TERMINAL
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Section 1: Navigation */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-hud-text uppercase tracking-wider flex items-center gap-1.5 border-b border-hud-border/20 pb-1">
              <Navigation size={12} className="text-hud-accent" />
              Navegação de Telas
            </h4>
            <p className="text-[9px] uppercase tracking-wider mb-2 text-hud-muted">
              Pressione a tecla fora de campos de digitação:
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-hud-border/10">
                <span className="uppercase text-hud-muted">Dashboard</span>
                <div className="flex gap-1">
                  <Kbd>1</Kbd> <span className="opacity-40">ou</span> <Kbd>D</Kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-hud-border/10">
                <span className="uppercase text-hud-muted">Clientes</span>
                <div className="flex gap-1">
                  <Kbd>2</Kbd> <span className="opacity-40">ou</span> <Kbd>C</Kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-hud-border/10">
                <span className="uppercase text-hud-muted">Ordens de Serviço</span>
                <div className="flex gap-1">
                  <Kbd>3</Kbd> <span className="opacity-40">ou</span> <Kbd>O</Kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-hud-border/10">
                <span className="uppercase text-hud-muted">Serviços Cadastrados</span>
                <div className="flex gap-1">
                  <Kbd>4</Kbd> <span className="opacity-40">ou</span> <Kbd>S</Kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-hud-border/10">
                <span className="uppercase text-hud-muted">Estoque / Produtos</span>
                <div className="flex gap-1">
                  <Kbd>5</Kbd> <span className="opacity-40">ou</span> <Kbd>E</Kbd>
                </div>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-hud-border/10">
                <span className="uppercase text-hud-muted">Arquivos / Imagens</span>
                <div className="flex gap-1">
                  <Kbd>6</Kbd> <span className="opacity-40">ou</span> <Kbd>A</Kbd>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Global Shortcuts */}
          <div className="space-y-4">
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-hud-text uppercase tracking-wider flex items-center gap-1.5 border-b border-hud-border/20 pb-1">
                <Activity size={12} className="text-hud-accent" />
                Atalhos Globais
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1 border-b border-hud-border/10">
                  <span className="uppercase text-hud-muted">Abrir Ajuda</span>
                  <Kbd>?</Kbd>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-hud-border/10">
                  <span className="uppercase text-hud-muted">Busca Rápida</span>
                  <div className="flex gap-1">
                    <Kbd>Ctrl</Kbd>+<Kbd>K</Kbd>
                  </div>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-hud-border/10">
                  <span className="uppercase text-hud-muted">Fechar Janelas</span>
                  <Kbd>Esc</Kbd>
                </div>
              </div>
            </div>

            <div className="bg-hud-bg/40 border border-hud-border/40 p-3 rounded-sm space-y-1.5">
              <h5 className="text-[9px] font-black tracking-widest text-hud-accent uppercase">
                💡 DICA DE OPERAÇÃO
              </h5>
              <p className="text-[10px] leading-relaxed uppercase text-hud-muted">
                Para evitar perda de dados, clique em <strong className="text-hud-text">"DB SEGURO / BACKUP"</strong> no topo ou no painel lateral a cada alteração massiva para baixar um arquivo JSON de backup.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
