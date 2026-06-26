import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { useAppContext } from '../../lib/context';
import { generateId, formatBRL } from '../../lib/db';
import { motion } from 'motion/react';
import { Search, Plus, Edit2, Trash2, AlertTriangle, ArrowRightLeft, Package, DollarSign } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { MetricCard } from '../ui/MetricCard';
import { EstoqueItem } from '../../types';

export function Estoque() {
  const { db, updateDB } = useAppContext();
  const [search, setSearch] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<EstoqueItem>>({});

  const [movModalOpen, setMovModalOpen] = useState(false);
  const [movItemId, setMovItemId] = useState<string | null>(null);
  const [movTab, setMovTab] = useState<'entrada'|'saida'|'baixa'>('entrada');
  const [movData, setMovData] = useState({ qtd: 1, custo: 0, motivo: '', osId: '' });

  const [viewState, setViewState] = useState<'main' | 'historico'>('main');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = db.estoque.filter(i => 
    i.nome.toLowerCase().includes(search.toLowerCase()) || 
    (i.categoria || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalValor = db.estoque.reduce((s, i) => s + (i.qtd * i.custo), 0);
  const alertas = db.estoque.filter(i => i.qtd <= i.qtdMin).length;

  const openModal = (id?: string) => {
    if (id) {
      const item = db.estoque.find(x => x.id === id);
      setFormData(item || {});
      setEditingId(id);
    } else {
      setFormData({ unidade: 'un', qtdMin: 1 });
      setEditingId(null);
    }
    setModalOpen(true);
  };

  const save = () => {
    if (!formData.nome) {
      alert("Nome é obrigatório");
      return;
    }
    
    updateDB(prev => {
      const copy = { ...prev, estoque: [...prev.estoque], movimentacoes: [...prev.movimentacoes] };
      const qtdNova = formData.qtd || 0;
      
      if (editingId) {
        const idx = copy.estoque.findIndex(i => i.id === editingId);
        if (idx !== -1) {
          const old = copy.estoque[idx];
          const diff = qtdNova - old.qtd;
          if (diff !== 0) {
            copy.movimentacoes.push({
              id: generateId(),
              itemId: editingId,
              itemNome: formData.nome!,
              tipo: diff > 0 ? 'entrada' : 'ajuste',
              qtd: Math.abs(diff),
              custo: formData.custo || 0,
              motivo: 'Ajuste manual',
              data: new Date().toISOString()
            });
          }
          copy.estoque[idx] = { ...old, ...formData } as EstoqueItem;
        }
      } else {
        const newId = generateId();
        copy.estoque.push({
          id: newId,
          ...formData,
          createdAt: new Date().toISOString()
        } as EstoqueItem);
        
        if (qtdNova > 0) {
          copy.movimentacoes.push({
            id: generateId(),
            itemId: newId,
            itemNome: formData.nome!,
            tipo: 'entrada',
            qtd: qtdNova,
            custo: formData.custo || 0,
            motivo: 'Estoque inicial',
            data: new Date().toISOString()
          });
        }
      }
      return copy;
    });
    setModalOpen(false);
  };

  const remove = (id: string) => {
    updateDB(prev => ({
      ...prev,
      estoque: prev.estoque.filter(i => i.id !== id)
    }));
    setDeletingId(null);
  };

  const openMov = (id: string) => {
    const item = db.estoque.find(i => i.id === id);
    if (!item) return;
    setMovItemId(id);
    setMovTab('entrada');
    setMovData({ qtd: 1, custo: item.custo, motivo: '', osId: '' });
    setMovModalOpen(true);
  };

  const saveMov = () => {
    if (!movItemId) return;
    const item = db.estoque.find(i => i.id === movItemId);
    if (!item) return;

    if (!movData.qtd || movData.qtd <= 0) {
      alert("Informe uma quantidade válida.");
      return;
    }

    if ((movTab === 'saida' || movTab === 'baixa') && movData.qtd > item.qtd) {
      alert("Quantidade maior que o estoque atual!");
      return;
    }

    updateDB(prev => {
      const copy = { ...prev, estoque: [...prev.estoque], movimentacoes: [...prev.movimentacoes] };
      const idx = copy.estoque.findIndex(i => i.id === movItemId);
      if (idx === -1) return copy;

      const target = { ...copy.estoque[idx] };
      
      if (movTab === 'entrada') {
        const tOld = target.qtd * target.custo;
        const tNew = movData.qtd * movData.custo;
        target.qtd += movData.qtd;
        target.custo = target.qtd > 0 ? (tOld + tNew) / target.qtd : movData.custo;
      } else {
        if (target.qtd < movData.qtd) return copy; // Prevent race conditions
        target.qtd = Math.max(0, target.qtd - movData.qtd);
      }
      copy.estoque[idx] = target;

      const osRef = movData.osId ? copy.ordens.find(o => o.id === movData.osId)?.codigo : undefined;

      copy.movimentacoes.push({
        id: generateId(),
        itemId: target.id,
        itemNome: target.nome,
        tipo: movTab,
        qtd: movData.qtd,
        custo: movData.custo,
        motivo: movData.motivo || (movTab === 'entrada' ? 'Entrada' : movTab === 'baixa' ? 'Baixa OS' : 'Saída'),
        osId: movData.osId,
        osRef,
        data: new Date().toISOString()
      });

      return copy;
    });
    setMovModalOpen(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 max-w-7xl mx-auto"
    >
      <header className="mb-8 border-b border-hud-border pb-4">
        <h1 className="font-display font-black text-3xl text-hud-text tracking-widest uppercase mb-1 flex items-center gap-3">
          <span className="text-hud-accent">_</span>Estoque
        </h1>
        <p className="font-mono text-xs text-hud-muted tracking-widest uppercase">
          // DB.INVENTORY · Gestão de Peças
        </p>
      </header>

      {viewState === 'main' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <MetricCard title="Itens Cadastrados" value={db.estoque.length} icon={Package} variant="green" />
            <MetricCard title="Valor em Estoque" value={formatBRL(totalValor)} icon={DollarSign} variant="purple" />
            <MetricCard title="Estoque Baixo" value={alertas} icon={AlertTriangle} variant={alertas > 0 ? "danger" : "teal"} />
          </div>

          <div className="hud-panel mb-6 flex flex-col md:flex-row items-center gap-4 p-4">
            <div className="relative w-full md:w-auto flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-hud-muted" size={16} />
              <input 
                type="text" 
                placeholder="BUSCAR ITEM OU CATEGORIA..." 
                className="hud-input pl-10 uppercase w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button onClick={() => setViewState('historico')} className="hud-button-outline whitespace-nowrap w-full md:w-auto">
              <ArrowRightLeft size={16} />
              Histórico
            </button>
            <button onClick={() => openModal()} className="hud-button-primary whitespace-nowrap w-full md:w-auto">
              <Plus size={16} />
              Novo Item
            </button>
          </div>

          <div className="hud-panel overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-hud-bg/50 border-b border-hud-border">
                  <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted">Item</th>
                  <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted">Categoria</th>
                  <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted">Qtd</th>
                  <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted">Mín</th>
                  <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted">Custo</th>
                  <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted">Venda</th>
                  <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-hud-muted font-mono text-xs uppercase">
                      [ Nenhum item em estoque ]
                    </td>
                  </tr>
                ) : (
                  filtered.map((i) => {
                    const low = i.qtd <= i.qtdMin;
                    return (
                      <tr key={i.id} className={cn(
                        "border-b border-hud-border/50 hover:bg-hud-accent/5 transition-colors group",
                        low ? "bg-hud-danger/5" : ""
                      )}>
                        <td className="p-3">
                          <div className="font-display font-bold text-sm tracking-wider text-hud-text uppercase">
                            {i.nome}
                          </div>
                          {i.obs && <div className="font-mono text-[9px] text-hud-muted mt-1 truncate max-w-[200px]">{i.obs}</div>}
                        </td>
                        <td className="p-3 text-sm text-hud-muted uppercase">{i.categoria || '—'}</td>
                        <td className="p-3">
                          <span className={cn(
                            "font-mono font-bold flex items-center gap-2",
                            low ? "text-hud-danger" : "text-hud-accent"
                          )}>
                            {i.qtd} <span className="text-[9px] text-hud-muted font-normal">{i.unidade}</span>
                            {low && <AlertTriangle size={12} className="text-hud-danger" />}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-xs text-hud-muted">{i.qtdMin}</td>
                        <td className="p-3 font-mono text-xs">{formatBRL(i.custo)}</td>
                        <td className="p-3 font-mono text-xs text-hud-accent font-bold">{i.venda ? formatBRL(i.venda) : '—'}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openMov(i.id)} className="p-2 border border-hud-border hover:border-hud-accent text-hud-muted hover:text-hud-accent transition-colors bg-hud-bg/50">
                              <ArrowRightLeft size={14} />
                            </button>
                            <button onClick={() => openModal(i.id)} className="p-2 border border-hud-border hover:border-hud-accent text-hud-muted hover:text-hud-accent transition-colors bg-hud-bg/50">
                              <Edit2 size={14} />
                            </button>
                            {deletingId === i.id ? (
                              <button onClick={() => remove(i.id)} className="p-2 border border-hud-danger bg-hud-danger/20 text-hud-danger transition-colors font-mono text-[10px] uppercase tracking-widest">
                                Confirmar?
                              </button>
                            ) : (
                              <button onClick={() => setDeletingId(i.id)} className="p-2 border border-hud-border hover:border-hud-danger text-hud-muted hover:text-hud-danger transition-colors bg-hud-bg/50">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="hud-panel mb-6 flex flex-col md:flex-row items-center gap-4 p-4">
            <button onClick={() => setViewState('main')} className="hud-button-outline whitespace-nowrap w-full md:w-auto">
              Voltar ao Estoque
            </button>
            <div className="flex-1"></div>
            <h2 className="font-display font-bold text-lg text-hud-text uppercase tracking-wider">Histórico de Movimentações</h2>
          </div>
          
          <div className="hud-panel overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-hud-bg/50 border-b border-hud-border">
                  <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted">Data</th>
                  <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted">Tipo</th>
                  <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted">Item</th>
                  <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted">Qtd</th>
                  <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted">Custo</th>
                  <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted">Motivo / OS</th>
                </tr>
              </thead>
              <tbody>
                {db.movimentacoes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-hud-muted font-mono text-xs uppercase">
                      [ Nenhuma movimentação registrada ]
                    </td>
                  </tr>
                ) : (
                  [...db.movimentacoes].reverse().map(m => (
                    <tr key={m.id} className="border-b border-hud-border/50 hover:bg-hud-accent/5 transition-colors">
                      <td className="p-3 font-mono text-xs text-hud-muted">{new Date(m.data).toLocaleString()}</td>
                      <td className="p-3">
                        <span className={cn(
                          "px-2 py-1 font-mono text-[9px] uppercase tracking-widest border",
                          m.tipo === 'entrada' ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' :
                          m.tipo === 'saida' ? 'bg-hud-danger/10 border-hud-danger/30 text-hud-danger' :
                          m.tipo === 'baixa' ? 'bg-hud-warn/10 border-hud-warn/30 text-hud-warn' :
                          'bg-hud-muted/10 border-hud-muted/30 text-hud-muted'
                        )}>
                          {m.tipo}
                        </span>
                      </td>
                      <td className="p-3 font-display font-bold text-sm text-hud-text uppercase">{m.itemNome}</td>
                      <td className="p-3 font-mono font-bold">{m.qtd}</td>
                      <td className="p-3 font-mono text-xs">{formatBRL(m.custo)}</td>
                      <td className="p-3">
                        <div className="text-sm uppercase text-hud-text">{m.motivo}</div>
                        {m.osRef && <div className="font-mono text-[10px] text-hud-accent mt-1">OS: {m.osRef}</div>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* MODAL: NOVO ITEM */}
      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        title={editingId ? "SYS.UPDATE_ITEM" : "SYS.NEW_ITEM"}
        footer={
          <>
            <button className="hud-button-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="hud-button-primary" onClick={save}>[ Confirmar_Write ]</button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="hud-label">Nome do Item *</label>
            <input className="hud-input uppercase" value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} autoFocus />
          </div>
          <div>
            <label className="hud-label">Categoria</label>
            <input className="hud-input uppercase" value={formData.categoria || ''} onChange={e => setFormData({...formData, categoria: e.target.value})} />
          </div>
          <div>
            <label className="hud-label">Unidade</label>
            <select className="hud-input appearance-none uppercase" value={formData.unidade || ''} onChange={e => setFormData({...formData, unidade: e.target.value})}>
              <option value="un">un</option><option value="kg">kg</option><option value="g">g</option>
              <option value="m">m</option><option value="cm">cm</option><option value="litro">litro</option>
            </select>
          </div>
          <div>
            <label className="hud-label">Qtd. Inicial</label>
            <input type="number" className="hud-input" value={formData.qtd || ''} onChange={e => setFormData({...formData, qtd: parseFloat(e.target.value)||0})} />
          </div>
          <div>
            <label className="hud-label">Qtd. Mínima</label>
            <input type="number" className="hud-input" value={formData.qtdMin || ''} onChange={e => setFormData({...formData, qtdMin: parseFloat(e.target.value)||1})} />
          </div>
          <div>
            <label className="hud-label">Custo Unit. (R$)</label>
            <input type="number" step="0.01" className="hud-input" value={formData.custo || ''} onChange={e => setFormData({...formData, custo: parseFloat(e.target.value)||0})} />
          </div>
          <div>
            <label className="hud-label">Preço Venda (R$)</label>
            <input type="number" step="0.01" className="hud-input" value={formData.venda || ''} onChange={e => setFormData({...formData, venda: parseFloat(e.target.value)||0})} />
          </div>
          <div className="md:col-span-2">
            <label className="hud-label">Observações</label>
            <textarea className="hud-input min-h-[60px]" value={formData.obs || ''} onChange={e => setFormData({...formData, obs: e.target.value})} />
          </div>
        </div>
      </Modal>

      {/* MODAL: MOVIMENTAÇÃO */}
      <Modal 
        isOpen={movModalOpen} 
        onClose={() => setMovModalOpen(false)}
        title="SYS.EXECUTE_TRANSFER"
        footer={
          <>
            <button className="hud-button-outline" onClick={() => setMovModalOpen(false)}>Cancelar</button>
            <button className="hud-button-primary" onClick={saveMov}>[ Run_Transfer ]</button>
          </>
        }
      >
        <div className="flex gap-2 mb-4">
          <button onClick={() => setMovTab('entrada')} className={cn("px-4 py-2 font-mono text-[10px] tracking-widest uppercase border transition-colors flex-1", movTab === 'entrada' ? 'bg-teal-500/20 border-teal-500 text-teal-400' : 'bg-hud-bg/50 border-hud-border text-hud-muted')}>⬆ Entrada</button>
          <button onClick={() => setMovTab('saida')} className={cn("px-4 py-2 font-mono text-[10px] tracking-widest uppercase border transition-colors flex-1", movTab === 'saida' ? 'bg-hud-danger/20 border-hud-danger text-hud-danger' : 'bg-hud-bg/50 border-hud-border text-hud-muted')}>⬇ Saída</button>
          <button onClick={() => setMovTab('baixa')} className={cn("px-4 py-2 font-mono text-[10px] tracking-widest uppercase border transition-colors flex-1", movTab === 'baixa' ? 'bg-hud-warn/20 border-hud-warn text-hud-warn' : 'bg-hud-bg/50 border-hud-border text-hud-muted')}>🔧 Baixa OS</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="hud-label">Quantidade *</label>
            <input type="number" step="0.01" className="hud-input" value={movData.qtd || ''} onChange={e => setMovData({...movData, qtd: parseFloat(e.target.value)||0})} />
          </div>
          {movTab !== 'saida' && (
            <div>
              <label className="hud-label">Custo Unit. (R$) {movTab === 'baixa' && <span className="text-hud-muted lowercase">(Debitado)</span>}</label>
              <input type="number" step="0.01" className="hud-input" value={movData.custo || ''} onChange={e => setMovData({...movData, custo: parseFloat(e.target.value)||0})} />
            </div>
          )}
          {movTab === 'baixa' && (
            <div className="md:col-span-2">
              <label className="hud-label">Vincular OS</label>
              <select className="hud-input appearance-none" value={movData.osId} onChange={e => setMovData({...movData, osId: e.target.value})}>
                <option value="">-- SELECIONAR --</option>
                {db.ordens.map(o => <option key={o.id} value={o.id}>{o.codigo}</option>)}
              </select>
            </div>
          )}
          <div className="md:col-span-2">
            <label className="hud-label">Motivo / Obs</label>
            <input className="hud-input uppercase" value={movData.motivo} onChange={e => setMovData({...movData, motivo: e.target.value})} />
          </div>
        </div>
      </Modal>

    </motion.div>
  );
}
