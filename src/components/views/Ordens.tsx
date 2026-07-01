import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { useAppContext } from '../../lib/context';
import { generateId, formatBRL, formatDate } from '../../lib/db';
import { motion } from 'motion/react';
import { Search, FileText, Plus, Edit2, Trash2, Printer, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { PrintOS } from '../ui/PrintOS';
import { OS, OsItem } from '../../types';

export function Ordens() {
  const { db, updateDB } = useAppContext();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [printOS, setPrintOS] = useState<OS | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<OS>>({ produtos: [] });
  const [items, setItems] = useState<OsItem[]>([]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkConfirmDelete, setBulkConfirmDelete] = useState(false);

  const getClienteName = (id: string) => db.clientes.find(c => c.id === id)?.nome || '—';

  const filtered = db.ordens.filter(o => {
    const matchSearch = o.codigo.toLowerCase().includes(search.toLowerCase()) || 
                        getClienteName(o.clienteId).toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'todos' || o.situacao === filter;
    return matchSearch && matchFilter;
  });

  const recalcTotal = (currentItems: OsItem[], desc: number = 0) => {
    const sub = currentItems.reduce((acc, i) => acc + (i.qtd * i.valor), 0);
    return Math.max(0, sub - desc);
  };

  const billingBreakdown = () => {
    let serviceCount = 0;
    let serviceTotal = 0;
    let productCount = 0;
    let productTotal = 0;
    let manualCount = 0;
    let manualTotal = 0;

    items.forEach(item => {
      const isSvc = db.servicos.some(s => s.nome.toLowerCase() === item.descricao.toLowerCase());
      const isProd = db.estoque.some(p => p.nome.toLowerCase() === item.descricao.toLowerCase());

      const val = item.qtd * item.valor;
      if (isSvc) {
        serviceCount += item.qtd;
        serviceTotal += val;
      } else if (isProd) {
        productCount += item.qtd;
        productTotal += val;
      } else {
        manualCount += item.qtd;
        manualTotal += val;
      }
    });

    const subtotal = serviceTotal + productTotal + manualTotal;
    const finalTotal = Math.max(0, subtotal - (formData.desconto || 0));

    return {
      serviceCount,
      serviceTotal,
      productCount,
      productTotal,
      manualCount,
      manualTotal,
      subtotal,
      finalTotal
    };
  };

  const breakdown = billingBreakdown();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filtered.map(o => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };

  const bulkDelete = () => {
    updateDB(prev => ({
      ...prev,
      ordens: prev.ordens.filter(o => !selectedIds.includes(o.id))
    }));
    setSelectedIds([]);
    setBulkConfirmDelete(false);
  };

  const bulkUpdateStatus = (newStatus: 'Em espera' | 'Em andamento' | 'Concluído' | 'Entregue') => {
    updateDB(prev => ({
      ...prev,
      ordens: prev.ordens.map(o => {
        if (selectedIds.includes(o.id)) {
          const prevStatus = o.situacao;
          if (prevStatus === newStatus) return o;

          const history = o.historico ? [...o.historico] : [
            {
              id: generateId(),
              status: 'Criado' as const,
              data: o.createdAt || new Date().toISOString(),
              descricao: 'Ordem de serviço registrada no sistema.'
            }
          ];

          history.push({
            id: generateId(),
            status: newStatus,
            data: new Date().toISOString(),
            descricao: `Situação alterada via ação em massa de "${prevStatus}" para "${newStatus}".`
          });

          return {
            ...o,
            situacao: newStatus,
            historico: history
          };
        }
        return o;
      })
    }));
    setSelectedIds([]);
  };

  const openModal = (id?: string) => {
    if (id) {
      const os = db.ordens.find(o => o.id === id);
      if (os) {
        setFormData(os);
        setItems(os.produtos || []);
      }
      setEditingId(id);
    } else {
      const nextId = (db.lastOS || 0) + 1;
      const code = `OS-${String(nextId).padStart(3, '0')}`;
      setFormData({
        codigo: code,
        situacao: 'Em espera',
        dataInicio: new Date().toISOString().slice(0, 10),
        desconto: 0,
        valorTotal: 0
      });
      setItems([]);
      setEditingId(null);
    }
    setModalOpen(true);
  };

  const save = () => {
    if (!formData.codigo || !formData.clienteId) {
      alert("Código e Cliente são obrigatórios.");
      return;
    }

    const finalTotal = recalcTotal(items, formData.desconto || 0);

    updateDB(prev => {
      const copy = { ...prev, ordens: [...prev.ordens] };
      const nowStr = new Date().toISOString();
      const existingOs = editingId ? prev.ordens.find(o => o.id === editingId) : null;
      
      let history = existingOs?.historico ? [...existingOs.historico] : [];
      
      if (editingId && history.length === 0) {
        history.push({
          id: generateId(),
          status: 'Criado',
          data: existingOs?.createdAt || nowStr,
          descricao: 'Ordem de serviço registrada no sistema.'
        });
      }

      const newStatus = formData.situacao || 'Em espera';
      
      if (!editingId) {
        history.push({
          id: generateId(),
          status: 'Criado',
          data: nowStr,
          descricao: 'Ordem de serviço inicializada em espera.'
        });
      } else if (existingOs && existingOs.situacao !== newStatus) {
        history.push({
          id: generateId(),
          status: newStatus as any,
          data: nowStr,
          descricao: `Situação alterada de "${existingOs.situacao}" para "${newStatus}".`
        });
      } else {
        history.push({
          id: generateId(),
          status: 'Editado',
          data: nowStr,
          descricao: 'Ordem de serviço atualizada (detalhes ou itens).'
        });
      }

      const osData: OS = {
        ...formData,
        produtos: items,
        valorTotal: finalTotal,
        id: editingId || generateId(),
        codigo: formData.codigo!,
        clienteId: formData.clienteId!,
        responsavel: formData.responsavel || '',
        situacao: newStatus as any,
        dataInicio: formData.dataInicio || new Date().toISOString(),
        desconto: formData.desconto || 0,
        createdAt: formData.createdAt || nowStr,
        historico: history
      };

      if (editingId) {
        const idx = copy.ordens.findIndex(o => o.id === editingId);
        if (idx !== -1) copy.ordens[idx] = osData;
      } else {
        copy.ordens.push(osData);
        copy.lastOS = (copy.lastOS || 0) + 1;
      }
      return copy;
    });
    setModalOpen(false);
  };

  const remove = (id: string) => {
    updateDB(prev => ({
      ...prev,
      ordens: prev.ordens.filter(o => o.id !== id)
    }));
    setDeletingId(null);
    setSelectedIds(prev => prev.filter(x => x !== id));
  };

  const addItemRow = () => {
    setItems([...items, { descricao: '', qtd: 1, valor: 0 }]);
  };

  const updateItem = (index: number, field: keyof OsItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    
    // Auto update total in form data preview
    setFormData(prev => ({...prev, valorTotal: recalcTotal(newItems, prev.desconto)}));
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    setFormData(prev => ({...prev, valorTotal: recalcTotal(newItems, prev.desconto)}));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 max-w-7xl mx-auto"
    >
      <header className="mb-8 border-b border-hud-border pb-4">
        <h1 className="font-display font-black text-2xl sm:text-3xl text-hud-text tracking-widest uppercase mb-1 flex items-center gap-3">
          <span className="text-hud-accent">_</span>Ordens de Serviço
        </h1>
        <p className="font-mono text-xs text-hud-muted tracking-widest uppercase">
          // DB.ORDERS · Gerenciamento de Tarefas
        </p>
      </header>

      <div className="hud-panel mb-6 flex flex-col md:flex-row items-center gap-4 p-4">
        <div className="relative w-full md:w-auto flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-hud-muted" size={16} />
          <input 
            type="text" 
            placeholder="BUSCAR CÓDIGO OU CLIENTE..." 
            className="hud-input pl-10 uppercase w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
          {['todos', 'Em espera', 'Em andamento', 'Concluído', 'Entregue'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase border whitespace-nowrap transition-colors",
                filter === f 
                  ? "bg-hud-accent/20 border-hud-accent text-hud-accent" 
                  : "bg-transparent border-hud-border text-hud-muted hover:border-hud-accent/50 hover:text-hud-text"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <button onClick={() => openModal()} className="hud-button-primary whitespace-nowrap w-full md:w-auto">
          <Plus size={16} />
          Nova OS
        </button>
      </div>

      {/* Bulk actions banner */}
      {selectedIds.length > 0 && (
        <div className="hud-panel border-l-4 border-l-hud-accent bg-hud-panel/90 border border-hud-border mb-6 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs animate-slide-in">
          <div className="flex items-center gap-3">
            <div className="px-2 py-1 bg-hud-accent/25 text-hud-accent border border-hud-accent/40 font-bold uppercase tracking-wider text-[10px]">
              [ {selectedIds.length} ITENS SELECIONADOS ]
            </div>
            <span className="text-hud-muted hidden md:inline uppercase text-[9px] tracking-wider">// SELECIONE UMA AÇÃO EM MASSA</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto justify-end">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-hud-muted uppercase tracking-wider">SITUAÇÃO:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    bulkUpdateStatus(e.target.value as any);
                    e.target.value = '';
                  }
                }}
                className="bg-hud-bg border border-hud-border/70 text-hud-text text-[10px] tracking-wider px-2 py-1 outline-none uppercase cursor-pointer rounded-sm"
                defaultValue=""
              >
                <option value="" disabled>ALTERAR EM MASSA...</option>
                <option value="Em espera">EM ESPERA</option>
                <option value="Em andamento">EM ANDAMENTO</option>
                <option value="Concluído">CONCLUÍDO</option>
                <option value="Entregue">ENTREGUE</option>
              </select>
            </div>

            <div className="h-4 w-px bg-hud-border hidden sm:block"></div>

            {bulkConfirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-hud-danger font-bold uppercase tracking-wider animate-pulse">CONFIRMA EXCLUSÃO?</span>
                <button
                  onClick={bulkDelete}
                  className="px-2.5 py-1 bg-hud-danger/20 border border-hud-danger text-hud-danger hover:bg-hud-danger hover:text-black font-bold uppercase text-[10px] tracking-wider transition-all"
                >
                  SIM
                </button>
                <button
                  onClick={() => setBulkConfirmDelete(false)}
                  className="px-2.5 py-1 border border-hud-border text-hud-muted hover:text-hud-text font-bold uppercase text-[10px] tracking-wider transition-all"
                >
                  NÃO
                </button>
              </div>
            ) : (
              <button
                onClick={() => setBulkConfirmDelete(true)}
                className="px-3 py-1 bg-hud-danger/10 border border-hud-danger/40 text-hud-danger hover:bg-hud-danger/20 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5 transition-all"
              >
                <Trash2 size={12} />
                EXCLUIR
              </button>
            )}

            <button
              onClick={() => setSelectedIds([])}
              className="p-1 text-hud-muted hover:text-hud-text"
              title="Limpar seleção"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="hud-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-hud-bg/50 border-b border-hud-border">
                <th className="p-3 w-10 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded-xs border-hud-border bg-hud-bg/40 text-hud-accent focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4"
                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted">Código</th>
                <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted">Cliente</th>
                <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted">Serviço/Motivo</th>
                <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted">Situação</th>
                <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted text-right">Valor</th>
                <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-hud-muted font-mono text-xs uppercase">
                    [ Nenhuma OS encontrada ]
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="border-b border-hud-border/50 hover:bg-hud-accent/5 transition-colors group">
                    <td className="p-3 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded-xs border-hud-border bg-hud-bg/40 text-hud-accent focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4"
                        checked={selectedIds.includes(o.id)}
                        onChange={(e) => handleSelectOne(o.id, e.target.checked)}
                      />
                    </td>
                    <td className="p-3 font-display font-bold text-sm tracking-wider text-hud-text group-hover:text-hud-accent">
                      {o.codigo}
                    </td>
                    <td className="p-3 text-sm">{getClienteName(o.clienteId)}</td>
                    <td className="p-3 text-sm text-hud-muted max-w-[200px] truncate">{o.motivo || o.servico || '—'}</td>
                    <td className="p-3">
                      <span className={cn(
                          "px-2 py-1 font-mono text-[10px] uppercase tracking-wider border",
                          o.situacao === 'Em espera' ? "bg-hud-warn/10 text-hud-warn border-hud-warn/30" :
                          o.situacao === 'Em andamento' ? "bg-hud-accent/10 text-hud-accent border-hud-accent/30" :
                          o.situacao === 'Concluído' ? "bg-teal-500/10 text-teal-400 border-teal-500/30" :
                          "bg-purple-500/10 text-purple-400 border-purple-500/30"
                        )}>
                          {o.situacao}
                        </span>
                    </td>
                    <td className="p-3 font-mono text-xs text-hud-accent font-bold text-right">
                      {o.valorTotal ? formatBRL(o.valorTotal) : '—'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setPrintOS(o)} className="p-2 border border-hud-border hover:border-hud-accent text-hud-muted hover:text-hud-accent transition-colors bg-hud-bg/50" title="Imprimir Ordem">
                          <Printer size={14} />
                        </button>
                        <button onClick={() => openModal(o.id)} className="p-2 border border-hud-border hover:border-hud-accent text-hud-muted hover:text-hud-accent transition-colors bg-hud-bg/50" title="Editar Ordem">
                          <Edit2 size={14} />
                        </button>
                        {deletingId === o.id ? (
                          <button onClick={() => remove(o.id)} className="p-2 border border-hud-danger bg-hud-danger/20 text-hud-danger transition-colors font-mono text-[10px] uppercase tracking-widest">
                            Confirma?
                          </button>
                        ) : (
                          <button onClick={() => setDeletingId(o.id)} className="p-2 border border-hud-border hover:border-hud-danger text-hud-muted hover:text-hud-danger transition-colors bg-hud-bg/50" title="Deletar Ordem">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Calculation Summary Bar */}
        <div className="border-t border-hud-border/70 p-4 bg-hud-bg/30 flex flex-col md:flex-row justify-between items-center gap-4 font-mono text-xs uppercase text-hud-muted">
          <div className="flex flex-wrap gap-4 md:gap-8 justify-center md:justify-start w-full md:w-auto">
            <div>
              <span className="text-[10px] tracking-wider block text-hud-muted/60">MOSTRANDO:</span>
              <span className="text-hud-text font-bold">{filtered.length} REGISTROS</span>
            </div>
            <div className="h-8 w-px bg-hud-border/40 hidden sm:block"></div>
            <div>
              <span className="text-[10px] tracking-wider block text-hud-muted/60">VALOR TOTAL VISÍVEL:</span>
              <span className="text-hud-accent font-bold">
                {formatBRL(filtered.reduce((acc, o) => acc + (o.valorTotal || 0), 0))}
              </span>
            </div>
            <div className="h-8 w-px bg-hud-border/40 hidden sm:block"></div>
            <div>
              <span className="text-[10px] tracking-wider block text-hud-muted/60">MÉDIA DOS VALORES:</span>
              <span className="text-hud-text font-bold">
                {filtered.length > 0 
                  ? formatBRL(filtered.reduce((acc, o) => acc + (o.valorTotal || 0), 0) / filtered.length)
                  : 'R$ 0,00'
                }
              </span>
            </div>
          </div>
          {selectedIds.length > 0 && (
            <div className="bg-hud-accent/10 border border-hud-accent/30 px-3 py-1.5 flex items-center gap-3 w-full md:w-auto justify-between rounded-xs">
              <span className="text-hud-accent font-bold text-[10px]">SELECIONADOS: {selectedIds.length}</span>
              <span className="text-hud-accent font-bold">
                {formatBRL(db.ordens.filter(o => selectedIds.includes(o.id)).reduce((acc, o) => acc + (o.valorTotal || 0), 0))}
              </span>
            </div>
          )}
        </div>
      </div>

      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        title={editingId ? `SYS.UPDATE_OS [${formData.codigo}]` : "SYS.NEW_OS"}
        size="lg"
        footer={
          <>
            <button className="hud-button-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="hud-button-primary" onClick={save}>[ Write_Data ]</button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="hud-label">Código da OS *</label>
            <input 
              className="hud-input" 
              value={formData.codigo || ''} 
              onChange={e => setFormData({...formData, codigo: e.target.value})}
              readOnly={!!editingId}
            />
          </div>
          <div>
            <label className="hud-label">Cliente *</label>
            <select 
              className="hud-input appearance-none" 
              value={formData.clienteId || ''} 
              onChange={e => setFormData({...formData, clienteId: e.target.value})}
            >
              <option value="">SELECIONAR CLIENTE...</option>
              {db.clientes.map(c => <option key={c.id} value={c.id}>{c.nome.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="hud-label">Responsável</label>
            <input 
              className="hud-input uppercase" 
              value={formData.responsavel || ''} 
              onChange={e => setFormData({...formData, responsavel: e.target.value})}
            />
          </div>
          <div>
            <label className="hud-label">Situação</label>
            <select 
              className="hud-input appearance-none uppercase" 
              value={formData.situacao || ''} 
              onChange={e => setFormData({...formData, situacao: e.target.value as any})}
            >
              <option value="Em espera">EM ESPERA</option>
              <option value="Em andamento">EM ANDAMENTO</option>
              <option value="Concluído">CONCLUÍDO</option>
              <option value="Entregue">ENTREGUE</option>
            </select>
          </div>
          <div>
            <label className="hud-label">Data de Início</label>
            <input 
              type="date"
              className="hud-input" 
              value={formData.dataInicio || ''} 
              onChange={e => setFormData({...formData, dataInicio: e.target.value})}
            />
          </div>
          <div>
            <label className="hud-label">Data de Entrega</label>
            <input 
              type="date"
              className="hud-input" 
              value={formData.dataEntrega || ''} 
              onChange={e => setFormData({...formData, dataEntrega: e.target.value})}
            />
          </div>
          
          <div className="md:col-span-2 mt-4 border-t border-hud-border pt-4">
            <label className="hud-label text-hud-text">Descrição do Problema</label>
            <input 
              className="hud-input" 
              value={formData.motivo || ''} 
              onChange={e => setFormData({...formData, motivo: e.target.value})}
            />
          </div>
          <div className="md:col-span-2">
            <label className="hud-label text-hud-text">Serviço Realizado</label>
            <textarea 
              className="hud-input min-h-[80px]" 
              value={formData.servico || ''} 
              onChange={e => setFormData({...formData, servico: e.target.value})}
            />
          </div>

          <div className="md:col-span-2 mt-4 border-t border-hud-border pt-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
              <label className="hud-label text-hud-text !mb-0 font-bold uppercase tracking-wider">// Itens & Serviços Utilizados</label>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {db.servicos.length > 0 && (
                  <select 
                    onChange={(e) => {
                      const svcId = e.target.value;
                      if (!svcId) return;
                      const svc = db.servicos.find(s => s.id === svcId);
                      if (svc) {
                        const newItems = [...items, { descricao: svc.nome, qtd: 1, valor: svc.preco }];
                        setItems(newItems);
                        setFormData(prev => ({
                          ...prev, 
                          valorTotal: recalcTotal(newItems, prev.desconto || 0)
                        }));
                      }
                      e.target.value = ""; // Reset value
                    }}
                    className="bg-hud-bg hover:bg-hud-accent/10 border border-hud-border/70 hover:border-hud-accent/50 text-hud-accent text-[10px] font-mono tracking-wider px-2.5 py-1 outline-none uppercase cursor-pointer rounded-sm transition-all max-w-[180px] sm:max-w-none"
                    defaultValue=""
                  >
                    <option value="" disabled>+ INCLUIR SERVIÇO...</option>
                    {db.servicos.map(s => (
                      <option key={s.id} value={s.id} className="bg-hud-panel text-hud-text">
                        {s.nome.toUpperCase()} ({formatBRL(s.preco)})
                      </option>
                    ))}
                  </select>
                )}

                {db.estoque.length > 0 && (
                  <select 
                    onChange={(e) => {
                      const itemId = e.target.value;
                      if (!itemId) return;
                      const item = db.estoque.find(i => i.id === itemId);
                      if (item) {
                        const newItems = [...items, { descricao: item.nome, qtd: 1, valor: item.venda }];
                        setItems(newItems);
                        setFormData(prev => ({
                          ...prev, 
                          valorTotal: recalcTotal(newItems, prev.desconto || 0)
                        }));
                      }
                      e.target.value = ""; // Reset value
                    }}
                    className="bg-hud-bg hover:bg-hud-accent/10 border border-hud-border/70 hover:border-hud-accent/50 text-hud-accent text-[10px] font-mono tracking-wider px-2.5 py-1 outline-none uppercase cursor-pointer rounded-sm transition-all max-w-[180px] sm:max-w-none"
                    defaultValue=""
                  >
                    <option value="" disabled>+ INCLUIR PRODUTO...</option>
                    {db.estoque.map(i => (
                      <option key={i.id} value={i.id} className="bg-hud-panel text-hud-text">
                        {i.nome.toUpperCase()} ({formatBRL(i.venda)})
                      </option>
                    ))}
                  </select>
                )}

                <button onClick={addItemRow} className="hud-button-outline !py-1 !text-[10px] flex items-center gap-1">
                  <Plus size={12}/> Manual
                </button>
              </div>
            </div>
            
            <div className="border border-hud-border bg-hud-bg/50 overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[500px]">
                <thead className="bg-hud-panel border-b border-hud-border">
                  <tr>
                    <th className="p-2 font-mono text-[9px] uppercase text-hud-muted text-left w-16">Qtd</th>
                    <th className="p-2 font-mono text-[9px] uppercase text-hud-muted text-left">Descrição</th>
                    <th className="p-2 font-mono text-[9px] uppercase text-hud-muted text-left w-24">Valor Un.</th>
                    <th className="p-2 font-mono text-[9px] uppercase text-hud-muted text-center w-12">Rem</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b border-hud-border/30 last:border-0">
                      <td className="p-1">
                        <input type="number" min="1" className="hud-input !px-2 !py-1 text-center" value={item.qtd} onChange={e => updateItem(idx, 'qtd', parseFloat(e.target.value)||0)} />
                      </td>
                      <td className="p-1">
                        <input className="hud-input !px-2 !py-1 uppercase" value={item.descricao} onChange={e => updateItem(idx, 'descricao', e.target.value)} />
                      </td>
                      <td className="p-1">
                        <input type="number" step="0.01" className="hud-input !px-2 !py-1 text-right" value={item.valor} onChange={e => updateItem(idx, 'valor', parseFloat(e.target.value)||0)} />
                      </td>
                      <td className="p-1 text-center">
                        <button onClick={() => removeItem(idx)} className="p-1.5 text-hud-muted hover:text-hud-danger transition-colors">
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr><td colSpan={4} className="p-4 text-center font-mono text-[10px] text-hud-muted uppercase">Sem itens registrados</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Detailed Breakdown Panel */}
              <div className="hud-panel p-4 bg-hud-bg/30 border border-hud-border/60 flex flex-col justify-between font-mono text-[10px] text-hud-muted uppercase tracking-wider space-y-2">
                <h5 className="font-bold text-hud-text text-xs border-b border-hud-border/40 pb-1.5 mb-1 flex justify-between">
                  <span>// DETALHAMENTO DE VALORES</span>
                  <span className="text-hud-accent">REATIVO</span>
                </h5>
                <div className="flex justify-between items-center py-0.5">
                  <span>Serviços ({breakdown.serviceCount} unidades):</span>
                  <span className="text-hud-text font-bold">{formatBRL(breakdown.serviceTotal)}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span>Produtos ({breakdown.productCount} unidades):</span>
                  <span className="text-hud-text font-bold">{formatBRL(breakdown.productTotal)}</span>
                </div>
                {breakdown.manualCount > 0 && (
                  <div className="flex justify-between items-center py-0.5">
                    <span>Avulsos / Manual ({breakdown.manualCount} unidades):</span>
                    <span className="text-hud-text font-bold">{formatBRL(breakdown.manualTotal)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-hud-border/40 flex justify-between items-center font-bold text-hud-text">
                  <span>SUBTOTAL BRUTO:</span>
                  <span>{formatBRL(breakdown.subtotal)}</span>
                </div>
                {breakdown.subtotal > 0 && (
                  <div className="w-full bg-hud-bg h-1 border border-hud-border/30 rounded-xs overflow-hidden flex">
                    {breakdown.serviceTotal > 0 && (
                      <div 
                        className="bg-hud-accent h-full" 
                        style={{ width: `${(breakdown.serviceTotal / breakdown.subtotal) * 100}%` }}
                        title={`Serviços: ${Math.round((breakdown.serviceTotal / breakdown.subtotal) * 100)}%`}
                      />
                    )}
                    {breakdown.productTotal > 0 && (
                      <div 
                        className="bg-purple-500 h-full" 
                        style={{ width: `${(breakdown.productTotal / breakdown.subtotal) * 100}%` }}
                        title={`Produtos: ${Math.round((breakdown.productTotal / breakdown.subtotal) * 100)}%`}
                      />
                    )}
                    {breakdown.manualTotal > 0 && (
                      <div 
                        className="bg-amber-500 h-full" 
                        style={{ width: `${(breakdown.manualTotal / breakdown.subtotal) * 100}%` }}
                        title={`Avulsos: ${Math.round((breakdown.manualTotal / breakdown.subtotal) * 100)}%`}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Total Card */}
              <div className="hud-panel p-4 bg-hud-bg/80 border-t-2 border-t-hud-accent flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-center font-mono text-xs text-hud-muted">
                    <span>SUBTOTAL:</span>
                    <span className="font-bold text-hud-text">{formatBRL(breakdown.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center font-mono text-xs text-hud-muted">
                    <span>DESCONTO (R$):</span>
                    <input 
                      type="number" 
                      className="hud-input !px-2 !py-0.5 !text-right w-24 !text-xs font-bold" 
                      value={formData.desconto || ''} 
                      onChange={e => {
                        const v = parseFloat(e.target.value) || 0;
                        setFormData(prev => ({...prev, desconto: v, valorTotal: recalcTotal(items, v)}));
                      }}
                    />
                  </div>
                </div>
                <div className="pt-3 border-t border-hud-border flex justify-between items-center font-display font-black text-xl text-hud-accent tracking-wider">
                  <span>TOTAL:</span>
                  <span>{formatBRL(formData.valorTotal || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order History Timeline */}
          {editingId && (
            <div className="md:col-span-2 mt-6 border-t border-hud-border pt-6">
              <h4 className="font-mono text-xs font-bold text-hud-text uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="text-hud-accent">//</span> HISTÓRICO DE ALTERAÇÕES & LINHA DO TEMPO
              </h4>
              
              <div className="relative border-l border-hud-border/50 ml-3 pl-6 space-y-4">
                {(() => {
                  const currentOS = db.ordens.find(o => o.id === editingId);
                  const historyList = currentOS?.historico && currentOS.historico.length > 0 
                    ? currentOS.historico 
                    : [
                        {
                          id: 'init',
                          status: 'Criado' as const,
                          data: currentOS?.createdAt || currentOS?.dataInicio || new Date().toISOString(),
                          descricao: 'Ordem de serviço registrada no sistema.'
                        }
                      ];

                  // Sort by date descending so newest is at the top
                  const sortedHistory = [...historyList].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

                  return sortedHistory.map((evt) => {
                    const isCreated = evt.status === 'Criado';
                    const isEdited = evt.status === 'Editado';
                    
                    let bulletColor = "bg-hud-muted border-hud-border";
                    if (evt.status === 'Em espera') bulletColor = "bg-hud-warn border-hud-warn/80";
                    else if (evt.status === 'Em andamento') bulletColor = "bg-hud-accent border-hud-accent/80";
                    else if (evt.status === 'Concluído') bulletColor = "bg-teal-500 border-teal-500/80";
                    else if (evt.status === 'Entregue') bulletColor = "bg-purple-500 border-purple-500/80";
                    else if (isCreated) bulletColor = "bg-hud-accent border-hud-accent/80";
                    else if (isEdited) bulletColor = "bg-hud-muted border-hud-border";

                    return (
                      <div key={evt.id} className="relative group">
                        {/* Timeline Bullet */}
                        <div className={cn(
                          "absolute -left-[31px] top-1.5 w-3 h-3 rounded-full border flex items-center justify-center transition-all group-hover:scale-110",
                          bulletColor
                        )} />
                        
                        <div className="hud-panel p-3 bg-hud-bg/25 border border-hud-border/40 hover:border-hud-border/70 transition-all">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 mb-1">
                            <span className={cn(
                              "font-mono text-[9px] font-bold px-2 py-0.5 border uppercase tracking-wider",
                              evt.status === 'Em espera' ? "bg-hud-warn/10 text-hud-warn border-hud-warn/20" :
                              evt.status === 'Em andamento' ? "bg-hud-accent/10 text-hud-accent border-hud-accent/20" :
                              evt.status === 'Concluído' ? "bg-teal-500/10 text-teal-400 border-teal-500/20" :
                              evt.status === 'Entregue' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                              isCreated ? "bg-hud-accent/10 text-hud-accent border-hud-accent/20" :
                              "bg-hud-bg text-hud-muted border-hud-border"
                            )}>
                              {evt.status}
                            </span>
                            
                            <span className="font-mono text-[9px] text-hud-muted tracking-wider">
                              {formatDate(evt.data)} · {new Date(evt.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <p className="text-hud-text text-xs font-mono uppercase tracking-wide">
                            {evt.descricao}
                          </p>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <PrintOS 
        os={printOS}
        cliente={printOS ? db.clientes.find(c => c.id === printOS.clienteId) || null : null}
        onClose={() => setPrintOS(null)}
      />
    </motion.div>
  );
}
