import React, { useState, useEffect, useRef } from 'react';
import { Search, User, FileText, Settings, X, CornerDownLeft, Command, HelpCircle } from 'lucide-react';
import { useAppContext } from '../../lib/context';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Cliente, OS, Servico } from '../../types';
// @ts-ignore
import logoImg from '../../logo.png';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onChangeView: (view: string) => void;
}

export function CommandPalette({ isOpen, onClose, onChangeView }: CommandPaletteProps) {
  const { db } = useAppContext();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Reset search and selection index when palette opens/closes
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Search through Clientes, Ordens, and Serviços
  const getFilteredResults = () => {
    if (!query.trim()) {
      // Show default/recent suggestions or empty state
      return [];
    }

    const q = query.toLowerCase();

    // 1. Clientes
    const clientesMatches = db.clientes
      .filter(c => 
        c.nome.toLowerCase().includes(q) || 
        (c.cpf && c.cpf.includes(q)) || 
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.telefone && c.telefone.includes(q))
      )
      .map(c => ({
        id: `cliente-${c.id}`,
        type: 'cliente' as const,
        title: c.nome,
        subtitle: `Cliente • Tel: ${c.telefone || '—'} • CPF: ${c.cpf || '—'}`,
        view: 'clientes',
        original: c,
      }));

    // 2. Ordens de Serviço
    const ordensMatches = db.ordens
      .filter(o => {
        const clientName = db.clientes.find(c => c.id === o.clienteId)?.nome || '';
        return (
          o.codigo.toLowerCase().includes(q) ||
          clientName.toLowerCase().includes(q) ||
          (o.responsavel && o.responsavel.toLowerCase().includes(q)) ||
          o.situacao.toLowerCase().includes(q)
        );
      })
      .map(o => {
        const clientName = db.clientes.find(c => c.id === o.clienteId)?.nome || '—';
        return {
          id: `ordem-${o.id}`,
          type: 'ordem' as const,
          title: `OS ${o.codigo}`,
          subtitle: `Ordem • Cliente: ${clientName} • Status: ${o.situacao} • R$ ${o.valorTotal.toFixed(2)}`,
          view: 'ordens',
          original: o,
        };
      });

    // 3. Serviços
    const servicosMatches = db.servicos
      .filter(s => 
        s.nome.toLowerCase().includes(q) || 
        (s.categoria && s.categoria.toLowerCase().includes(q)) ||
        (s.descricao && s.descricao.toLowerCase().includes(q))
      )
      .map(s => ({
        id: `servico-${s.id}`,
        type: 'servico' as const,
        title: s.nome,
        subtitle: `Serviço • Categoria: ${s.categoria || 'Geral'} • R$ ${s.preco.toFixed(2)}`,
        view: 'servicos',
        original: s,
      }));

    return [...clientesMatches, ...ordensMatches, ...servicosMatches];
  };

  const results = getFilteredResults();

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, results.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(1, results.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, results]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (resultsContainerRef.current) {
      const activeEl = resultsContainerRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleSelect = (item: typeof results[0]) => {
    onChangeView(item.view);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 z-[100] backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog Container */}
          <div className="fixed inset-0 z-[101] flex items-start justify-center p-4 pt-[10vh] sm:pt-[15vh]">
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="hud-panel w-full max-w-xl flex flex-col bg-hud-panel border-hud-accent/40 shadow-2xl overflow-hidden max-h-[70vh] sm:max-h-[500px]"
            >
              {/* Header with Search Input */}
              <div className="relative flex items-center border-b border-hud-border/70 p-3 bg-hud-bg/40 gap-3">
                <div className="w-7 h-7 border border-hud-accent/40 bg-white p-0.5 rounded-sm overflow-hidden shrink-0 flex items-center justify-center relative">
                  <img src={logoImg} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 border border-hud-accent/20 pointer-events-none"></div>
                </div>
                <Search className="text-hud-accent mr-1 flex-shrink-0 animate-pulse" size={16} />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="DIGITE PARA PESQUISAR CLIENTES, PEDIDOS OU SERVIÇOS..."
                  className="w-full bg-transparent font-mono text-xs text-hud-text tracking-wider placeholder-hud-muted outline-none uppercase"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                />
                
                {/* Keyboard info or clear button */}
                <div className="flex items-center gap-2 ml-2">
                  <button 
                    onClick={onClose}
                    className="p-1 hover:bg-hud-danger/10 border border-transparent hover:border-hud-danger/20 text-hud-muted hover:text-hud-danger transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Suggestions / Results */}
              <div 
                ref={resultsContainerRef}
                className="flex-1 overflow-y-auto custom-scrollbar p-2"
              >
                {query.trim() === '' ? (
                  <div className="py-8 px-4 text-center">
                    <Command className="mx-auto mb-3 text-hud-accent/40" size={32} />
                    <p className="font-mono text-[11px] text-hud-text tracking-widest uppercase mb-2">
                      Pesquisa Unificada Zinnxs
                    </p>
                    <p className="font-mono text-[9px] text-hud-muted uppercase max-w-xs mx-auto leading-relaxed">
                      Digite o nome de um cliente, código de OS, responsável ou tipo de serviço para localizar instantaneamente.
                    </p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="py-8 px-4 text-center font-mono">
                    <HelpCircle className="mx-auto mb-3 text-hud-danger/40" size={32} />
                    <p className="text-[10px] text-hud-danger tracking-widest uppercase mb-1">
                      Nenhum resultado encontrado
                    </p>
                    <p className="text-[9px] text-hud-muted uppercase">
                      Tente buscar com termos diferentes ou menos específicos.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="px-2 py-1 font-mono text-[9px] text-hud-accent tracking-widest uppercase border-b border-hud-border/30 mb-1">
                      Resultados Encontrados ({results.length})
                    </div>
                    {results.map((item, idx) => {
                      const isActive = idx === selectedIndex;
                      return (
                        <button
                          key={item.id}
                          data-active={isActive ? "true" : "false"}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={cn(
                            "w-full text-left p-3 font-mono border transition-all duration-150 flex items-center justify-between group",
                            isActive 
                              ? "bg-hud-accent/15 border-hud-accent text-hud-text" 
                              : "bg-transparent border-transparent text-hud-muted hover:text-hud-text"
                          )}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={cn(
                              "w-7 h-7 flex items-center justify-center border flex-shrink-0",
                              isActive ? "border-hud-accent/50 bg-hud-accent/10" : "border-hud-border bg-hud-bg/30"
                            )}>
                              {item.type === 'cliente' ? (
                                <User size={13} className={isActive ? "text-hud-accent" : ""} />
                              ) : (
                                <FileText size={13} className={isActive ? "text-hud-accent" : ""} />
                              )}
                            </div>
                            <div className="overflow-hidden">
                              <div className={cn(
                                "text-xs font-bold uppercase tracking-wider truncate mb-0.5",
                                isActive ? "text-hud-text" : "text-hud-muted group-hover:text-hud-text"
                              )}>
                                {item.title}
                              </div>
                              <div className="text-[9px] uppercase tracking-wide opacity-80 truncate">
                                {item.subtitle}
                              </div>
                            </div>
                          </div>

                          {/* Action indicator */}
                          <div className="flex items-center gap-1.5 ml-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[9px] uppercase tracking-widest text-hud-accent">
                              Ir para
                            </span>
                            <CornerDownLeft size={10} className="text-hud-accent" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-hud-border/70 p-2.5 bg-hud-panel/90 font-mono text-[9px] text-hud-muted flex justify-between items-center px-4">
                <div className="flex gap-4">
                  <span className="hidden sm:inline">
                    <span className="text-hud-accent font-bold">↑↓</span> Navegar
                  </span>
                  <span>
                    <span className="text-hud-accent font-bold">ENTER</span> Selecionar
                  </span>
                  <span>
                    <span className="text-hud-accent font-bold">ESC</span> Fechar
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Command size={10} />
                  <span>ZINNXS SEARCH</span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
