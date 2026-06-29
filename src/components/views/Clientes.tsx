import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { useAppContext } from '../../lib/context';
import { generateId } from '../../lib/db';
import { motion } from 'motion/react';
import { Search, UserPlus, Edit2, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Cliente } from '../../types';

export function Clientes() {
  const { db, updateDB } = useAppContext();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Cliente>>({});
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');

  const filtered = db.clientes.filter(c => 
    c.nome.toLowerCase().includes(search.toLowerCase()) || 
    (c.cpf || '').includes(search) || 
    (c.telefone || '').includes(search)
  );

  const handleCepChange = async (value: string) => {
    const rawCep = value.replace(/\D/g, '');
    
    let maskedValue = value;
    if (rawCep.length <= 8) {
      if (rawCep.length > 5) {
        maskedValue = `${rawCep.slice(0, 5)}-${rawCep.slice(5)}`;
      } else {
        maskedValue = rawCep;
      }
    }

    setFormData(prev => ({ ...prev, cep: maskedValue }));
    setCepError('');

    if (rawCep.length === 8) {
      setCepLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
        if (response.ok) {
          const data = await response.json();
          if (data.erro) {
            setCepError('CEP NÃO ENCONTRADO');
          } else {
            setFormData(prev => ({
              ...prev,
              endereco: data.logradouro || '',
              bairro: data.bairro || '',
            }));
          }
        } else {
          setCepError('ERRO AO BUSCAR CEP');
        }
      } catch (err) {
        setCepError('CONEXÃO FALHOU');
      } finally {
        setCepLoading(false);
      }
    }
  };

  const openModal = (id?: string) => {
    setCepLoading(false);
    setCepError('');
    if (id) {
      const client = db.clientes.find(c => c.id === id);
      setFormData(client || {});
      setEditingId(id);
    } else {
      setFormData({});
      setEditingId(null);
    }
    setModalOpen(true);
  };

  const save = () => {
    if (!formData.nome) {
      alert("Nome é obrigatório"); // Ideally a custom toast
      return;
    }
    
    updateDB(prev => {
      const copy = { ...prev, clientes: [...prev.clientes] };
      if (editingId) {
        const idx = copy.clientes.findIndex(c => c.id === editingId);
        if (idx !== -1) {
          copy.clientes[idx] = { ...copy.clientes[idx], ...formData } as Cliente;
        }
      } else {
        copy.clientes.push({
          id: generateId(),
          ...formData,
          createdAt: new Date().toISOString()
        } as Cliente);
      }
      return copy;
    });
    setModalOpen(false);
  };

  const remove = (id: string) => {
    updateDB(prev => ({
      ...prev,
      clientes: prev.clientes.filter(c => c.id !== id)
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
          <span className="text-hud-accent">_</span>Clientes
        </h1>
        <p className="font-mono text-xs text-hud-muted tracking-widest uppercase">
          // DB.CLIENTS · Acesso de Registros
        </p>
      </header>

      <div className="hud-panel mb-6 flex flex-col sm:flex-row items-center gap-4 p-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-hud-muted" size={16} />
          <input 
            type="text" 
            placeholder="BUSCAR NOME, CPF, TELEFONE..." 
            className="hud-input pl-10 uppercase w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button onClick={() => openModal()} className="hud-button-primary w-full sm:w-auto whitespace-nowrap">
          <UserPlus size={16} />
          Novo Registro
        </button>
      </div>

      <div className="hud-panel overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-hud-bg/50 border-b border-hud-border">
              <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted">Identificação</th>
              <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted">Contato</th>
              <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted">Endereço</th>
              <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted text-right">Executar</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-hud-muted font-mono text-xs uppercase">
                  [ Nenhum dado retornado da consulta ]
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="border-b border-hud-border/50 hover:bg-hud-accent/5 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-sm text-hud-text uppercase">{c.nome}</div>
                    <div className="font-mono text-[10px] text-hud-muted mt-1">{c.cpf || 'CPF NÃO REGISTRADO'}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm">{c.telefone || '—'}</div>
                    <div className="font-mono text-[10px] text-hud-muted mt-1">{c.email || '—'}</div>
                  </td>
                  <td className="p-3 text-sm text-hud-muted max-w-[200px] truncate">
                    {[c.endereco, c.numero ? `Nº ${c.numero}` : '', c.bairro].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openModal(c.id)} className="p-2 border border-hud-border hover:border-hud-accent text-hud-muted hover:text-hud-accent transition-colors bg-hud-bg/50">
                        <Edit2 size={14} />
                      </button>
                      {deletingId === c.id ? (
                        <button onClick={() => remove(c.id)} className="p-2 border border-hud-danger bg-hud-danger/20 text-hud-danger transition-colors font-mono text-[10px] uppercase tracking-widest">
                          Confirma?
                        </button>
                      ) : (
                        <button onClick={() => setDeletingId(c.id)} className="p-2 border border-hud-border hover:border-hud-danger text-hud-muted hover:text-hud-danger transition-colors bg-hud-bg/50">
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
        title={editingId ? "SYS.UPDATE_CLIENT" : "SYS.NEW_CLIENT"}
        size="lg"
        footer={
          <>
            <button className="hud-button-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="hud-button-primary" onClick={save}>[ Confirmar_Write ]</button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="hud-label">Nome Completo *</label>
            <input 
              className="hud-input" 
              value={formData.nome || ''} 
              onChange={e => setFormData({...formData, nome: e.target.value})}
              autoFocus
            />
          </div>
          <div>
            <label className="hud-label">CPF</label>
            <input 
              className="hud-input" 
              value={formData.cpf || ''} 
              onChange={e => setFormData({...formData, cpf: e.target.value})}
            />
          </div>
          <div>
            <label className="hud-label">Telefone</label>
            <input 
              className="hud-input" 
              value={formData.telefone || ''} 
              onChange={e => setFormData({...formData, telefone: e.target.value})}
            />
          </div>
          <div>
            <label className="hud-label flex items-center justify-between">
              <span>CEP</span>
              {cepLoading && <span className="text-[9px] text-hud-accent animate-pulse">BUSCANDO...</span>}
              {cepError && <span className="text-[9px] text-hud-danger">{cepError}</span>}
            </label>
            <input 
              className="hud-input uppercase" 
              placeholder="00000-000"
              maxLength={9}
              value={formData.cep || ''} 
              onChange={e => handleCepChange(e.target.value)}
            />
          </div>
          <div>
            <label className="hud-label">E-mail</label>
            <input 
              type="email"
              className="hud-input" 
              value={formData.email || ''} 
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <label className="hud-label">Endereço</label>
              <input 
                className="hud-input" 
                value={formData.endereco || ''} 
                onChange={e => setFormData({...formData, endereco: e.target.value})}
              />
            </div>
            <div className="md:col-span-1">
              <label className="hud-label">Número</label>
              <input 
                className="hud-input" 
                placeholder="Nº"
                value={formData.numero || ''} 
                onChange={e => setFormData({...formData, numero: e.target.value})}
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="hud-label">Bairro</label>
            <input 
              className="hud-input" 
              value={formData.bairro || ''} 
              onChange={e => setFormData({...formData, bairro: e.target.value})}
            />
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
