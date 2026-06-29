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
      const osData: OS = {
        ...formData,
        produtos: items,
        valorTotal: finalTotal,
        id: editingId || generateId(),
        codigo: formData.codigo!,
        clienteId: formData.clienteId!,
        responsavel: formData.responsavel || '',
        situacao: formData.situacao || 'Em espera',
        dataInicio: formData.dataInicio || new Date().toISOString(),
        desconto: formData.desconto || 0,
        createdAt: formData.createdAt || new Date().toISOString()
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

      <div className="hud-panel overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-hud-bg/50 border-b border-hud-border">
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
                <td colSpan={6} className="p-8 text-center text-hud-muted font-mono text-xs uppercase">
                  [ Nenhuma OS encontrada ]
                </td>
              </tr>
            ) : (
              filtered.map((o) => (
                <tr key={o.id} className="border-b border-hud-border/50 hover:bg-hud-accent/5 transition-colors group">
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
                      <button onClick={() => setPrintOS(o)} className="p-2 border border-hud-border hover:border-hud-accent text-hud-muted hover:text-hud-accent transition-colors bg-hud-bg/50">
                        <Printer size={14} />
                      </button>
                      <button onClick={() => openModal(o.id)} className="p-2 border border-hud-border hover:border-hud-accent text-hud-muted hover:text-hud-accent transition-colors bg-hud-bg/50">
                        <Edit2 size={14} />
                      </button>
                      {deletingId === o.id ? (
                        <button onClick={() => remove(o.id)} className="p-2 border border-hud-danger bg-hud-danger/20 text-hud-danger transition-colors font-mono text-[10px] uppercase tracking-widest">
                          Confirma?
                        </button>
                      ) : (
                        <button onClick={() => setDeletingId(o.id)} className="p-2 border border-hud-border hover:border-hud-danger text-hud-muted hover:text-hud-danger transition-colors bg-hud-bg/50">
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
            <div className="flex justify-between items-center mb-2">
              <label className="hud-label text-hud-text !mb-0">Produtos / Serviços Utilizados</label>
              <button onClick={addItemRow} className="hud-button-outline !py-1 !text-[10px]">
                <Plus size={12}/> Adicionar Linha
              </button>
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

            <div className="flex justify-end mt-4">
              <div className="hud-panel p-4 w-full md:w-64 bg-hud-bg/80 border-t-2 border-t-hud-accent">
                <div className="flex justify-between items-center mb-2 font-mono text-xs text-hud-muted">
                  <span>SUBTOTAL:</span>
                  <span>{formatBRL(items.reduce((acc, i) => acc + (i.qtd * i.valor), 0))}</span>
                </div>
                <div className="flex justify-between items-center mb-3 font-mono text-xs text-hud-muted">
                  <span>DESCONTO (R$):</span>
                  <input 
                    type="number" 
                    className="hud-input !px-2 !py-0.5 !text-right w-24 !text-xs" 
                    value={formData.desconto || ''} 
                    onChange={e => {
                      const v = parseFloat(e.target.value) || 0;
                      setFormData(prev => ({...prev, desconto: v, valorTotal: recalcTotal(items, v)}));
                    }}
                  />
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-hud-border font-display font-bold text-lg text-hud-accent">
                  <span>TOTAL:</span>
                  <span>{formatBRL(formData.valorTotal || 0)}</span>
                </div>
              </div>
            </div>
          </div>
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
