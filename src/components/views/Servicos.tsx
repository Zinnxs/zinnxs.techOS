import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { useAppContext } from '../../lib/context';
import { generateId, formatBRL } from '../../lib/db';
import { motion } from 'motion/react';
import { Search, Plus, Edit2, Trash2, Tag, Clock, DollarSign, PenTool } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Servico } from '../../types';

export function Servicos() {
  const { db, updateDB } = useAppContext();
  const [search, setSearch] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Servico>>({});

  const filtered = db.servicos.filter(s => 
    s.nome.toLowerCase().includes(search.toLowerCase()) || 
    (s.categoria || '').toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (id?: string) => {
    if (id) {
      const s = db.servicos.find(x => x.id === id);
      setFormData(s || {});
      setEditingId(id);
    } else {
      setFormData({});
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
      const copy = { ...prev, servicos: [...prev.servicos] };
      if (editingId) {
        const idx = copy.servicos.findIndex(s => s.id === editingId);
        if (idx !== -1) {
          copy.servicos[idx] = { ...copy.servicos[idx], ...formData } as Servico;
        }
      } else {
        copy.servicos.push({
          id: generateId(),
          ...formData,
          createdAt: new Date().toISOString()
        } as Servico);
      }
      return copy;
    });
    setModalOpen(false);
  };

  const remove = (id: string) => {
    updateDB(prev => ({
      ...prev,
      servicos: prev.servicos.filter(s => s.id !== id)
    }));
    setDeletingId(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 max-w-7xl mx-auto"
    >
      <header className="mb-8 border-b border-hud-border pb-4">
        <h1 className="font-display font-black text-2xl sm:text-3xl text-hud-text tracking-widest uppercase mb-1 flex items-center gap-3">
          <span className="text-hud-accent">_</span>Serviços
        </h1>
        <p className="font-mono text-xs text-hud-muted tracking-widest uppercase">
          // DB.SERVICES · Catálogo Operacional
        </p>
      </header>

      <div className="hud-panel mb-6 flex flex-col md:flex-row items-center gap-4 p-4">
        <div className="relative w-full md:w-auto flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-hud-muted" size={16} />
          <input 
            type="text" 
            placeholder="BUSCAR SERVIÇO OU CATEGORIA..." 
            className="hud-input pl-10 uppercase w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button onClick={() => openModal()} className="hud-button-primary w-full md:w-auto whitespace-nowrap">
          <Plus size={16} />
          Novo Serviço
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full p-12 text-center text-hud-muted font-mono text-xs uppercase hud-panel">
            [ Nenhum serviço catalogado ]
          </div>
        ) : (
          filtered.map(s => {
            const priceStr = s.precoMax && s.precoMax > s.preco 
              ? `${formatBRL(s.preco)} – ${formatBRL(s.precoMax)}` 
              : (s.preco ? formatBRL(s.preco) : 'SOB CONSULTA');

            return (
              <div key={s.id} className="hud-panel p-5 group flex flex-col relative overflow-hidden border-t-2 border-t-hud-border hover:border-t-hud-accent transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-display font-bold text-lg text-hud-text uppercase tracking-wider leading-tight mb-1">
                      {s.nome}
                    </h3>
                    {s.categoria && (
                      <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest bg-hud-accent/10 text-hud-accent px-2 py-0.5 border border-hud-accent/30">
                        <Tag size={10} /> {s.categoria}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <p className="text-sm text-hud-muted mb-4 line-clamp-3">
                    {s.descricao || '[ SEM DESCRIÇÃO ]'}
                  </p>
                  
                  {s.obs && (
                    <div className="bg-hud-bg/50 border-l-2 border-hud-border p-2 mb-4 font-mono text-xs text-hud-muted">
                      <span className="text-hud-warn mr-2">!</span> {s.obs}
                    </div>
                  )}
                </div>

                <div className="border-t border-hud-border/50 pt-4 mt-auto flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div className="font-display font-bold text-lg text-hud-accent">
                      {priceStr}
                    </div>
                    {s.tempo && (
                      <div className="flex items-center gap-1 font-mono text-[10px] text-hud-muted uppercase">
                        <Clock size={12} /> {s.tempo}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 w-full">
                    <button onClick={() => openModal(s.id)} className="hud-button-outline flex-1 !py-1 !text-[10px]">
                      <Edit2 size={12} /> Editar
                    </button>
                    {deletingId === s.id ? (
                      <button onClick={() => remove(s.id)} className="hud-button-outline flex-1 !py-1 !text-[10px] !border-hud-danger !bg-hud-danger/20 !text-hud-danger">
                        Confirmar?
                      </button>
                    ) : (
                      <button onClick={() => setDeletingId(s.id)} className="hud-button-outline flex-1 !py-1 !text-[10px] hover:border-hud-danger hover:text-hud-danger">
                        <Trash2 size={12} /> Excluir
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Decoration */}
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <PenTool size={64} />
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        title={editingId ? "SYS.UPDATE_SERVICE" : "SYS.NEW_SERVICE"}
        footer={
          <>
            <button className="hud-button-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="hud-button-primary" onClick={save}>[ Confirmar_Write ]</button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="hud-label">Nome do Serviço *</label>
            <input 
              className="hud-input uppercase" 
              value={formData.nome || ''} 
              onChange={e => setFormData({...formData, nome: e.target.value})}
              autoFocus
            />
          </div>
          <div>
            <label className="hud-label">Categoria</label>
            <input 
              className="hud-input uppercase" 
              value={formData.categoria || ''} 
              onChange={e => setFormData({...formData, categoria: e.target.value})}
              list="svc-cat"
            />
            <datalist id="svc-cat">
              <option value="Hardware" />
              <option value="Software" />
              <option value="Limpeza" />
              <option value="Diagnóstico" />
              <option value="Instalação" />
              <option value="Manutenção" />
            </datalist>
          </div>
          <div>
            <label className="hud-label">Tempo Estimado</label>
            <input 
              className="hud-input uppercase" 
              value={formData.tempo || ''} 
              onChange={e => setFormData({...formData, tempo: e.target.value})}
              placeholder="Ex: 1H, 2-3 DIAS..."
            />
          </div>
          <div>
            <label className="hud-label">Preço Base (R$)</label>
            <input 
              type="number"
              step="0.01"
              className="hud-input" 
              value={formData.preco || ''} 
              onChange={e => setFormData({...formData, preco: parseFloat(e.target.value) || 0})}
            />
          </div>
          <div>
            <label className="hud-label">Preço Máximo (R$)</label>
            <input 
              type="number"
              step="0.01"
              className="hud-input" 
              value={formData.precoMax || ''} 
              onChange={e => setFormData({...formData, precoMax: parseFloat(e.target.value) || 0})}
            />
          </div>
          <div className="md:col-span-2">
            <label className="hud-label">Descrição</label>
            <textarea 
              className="hud-input min-h-[60px]" 
              value={formData.descricao || ''} 
              onChange={e => setFormData({...formData, descricao: e.target.value})}
            />
          </div>
          <div className="md:col-span-2">
            <label className="hud-label">Observações / Condições</label>
            <textarea 
              className="hud-input min-h-[60px]" 
              value={formData.obs || ''} 
              onChange={e => setFormData({...formData, obs: e.target.value})}
            />
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
