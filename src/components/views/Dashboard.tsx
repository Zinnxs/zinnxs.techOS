import React from 'react';
import { cn } from '../../lib/utils';
import { useAppContext } from '../../lib/context';
import { formatBRL, formatDate } from '../../lib/db';
import { MetricCard } from '../ui/MetricCard';
import { ClipboardList, Clock, CheckCircle2, DollarSign, FileText } from 'lucide-react';
import { motion } from 'motion/react';

export function Dashboard() {
  const { db } = useAppContext();
  
  const now = new Date();
  const mes = now.getMonth();
  const ano = now.getFullYear();
  
  const abertas = db.ordens.filter(o => o.situacao === 'Em espera' || o.situacao === 'Em andamento').length;
  const espera = db.ordens.filter(o => o.situacao === 'Em espera').length;
  const concMes = db.ordens.filter(o => {
    if (o.situacao !== 'Concluído' && o.situacao !== 'Entregue') return false;
    const d = new Date(o.createdAt || o.dataInicio || '');
    return d.getMonth() === mes && d.getFullYear() === ano;
  }).length;
  
  const fat = db.ordens.filter(o => {
    const d = new Date(o.createdAt || o.dataInicio || '');
    return (o.situacao === 'Concluído' || o.situacao === 'Entregue') && d.getMonth() === mes && d.getFullYear() === ano;
  }).reduce((s, o) => s + (o.valorTotal || 0), 0);

  const recent = [...db.ordens].reverse().slice(0, 5);

  const getClienteName = (id: string) => {
    return db.clientes.find(c => c.id === id)?.nome || '—';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 max-w-7xl mx-auto"
    >
      <header className="mb-8 border-b border-hud-border pb-4">
        <h1 className="font-display font-black text-2xl sm:text-3xl text-hud-text tracking-widest uppercase mb-1 flex items-center gap-3">
          <span className="text-hud-accent">_</span>Dashboard
        </h1>
        <p className="font-mono text-xs text-hud-muted tracking-widest uppercase">
          // Visão Geral · Sistema Ativo
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="OS em aberto" value={abertas} icon={ClipboardList} variant="green" />
        <MetricCard title="Em espera" value={espera} icon={Clock} variant="amber" />
        <MetricCard title="Concluídas (Mês)" value={concMes} icon={CheckCircle2} variant="teal" />
        <MetricCard title="Faturamento (Mês)" value={formatBRL(fat)} icon={DollarSign} variant="purple" />
      </div>

      <div>
        <h2 className="font-mono text-sm tracking-widest uppercase text-hud-text mb-4 border-b border-hud-border pb-2 flex items-center gap-2">
          <FileText size={16} className="text-hud-accent" />
          Ordens Recentes
        </h2>
        
        <div className="hud-panel overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-hud-bg/50 border-b border-hud-border">
                <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted">Código</th>
                <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted">Cliente</th>
                <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted">Serviço</th>
                <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted">Situação</th>
                <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted">Data</th>
                <th className="p-3 font-mono text-[10px] uppercase tracking-widest text-hud-muted text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-hud-muted font-mono text-xs">
                    NENHUM REGISTRO ENCONTRADO
                  </td>
                </tr>
              ) : (
                recent.map((os) => (
                  <tr key={os.id} className="border-b border-hud-border/50 hover:bg-hud-accent/5 transition-colors group">
                    <td className="p-3 font-display font-bold text-xs tracking-wider group-hover:text-hud-accent transition-colors">
                      {os.codigo}
                    </td>
                    <td className="p-3 text-sm truncate max-w-[150px]">{getClienteName(os.clienteId)}</td>
                    <td className="p-3 text-sm text-hud-muted truncate max-w-[200px]">{os.motivo || os.servico || '—'}</td>
                    <td className="p-3">
                      <span className={cn(
                        "px-2 py-1 font-mono text-[10px] uppercase tracking-wider border",
                        os.situacao === 'Em espera' ? "bg-hud-warn/10 text-hud-warn border-hud-warn/30" :
                        os.situacao === 'Em andamento' ? "bg-hud-accent/10 text-hud-accent border-hud-accent/30" :
                        os.situacao === 'Concluído' ? "bg-teal-500/10 text-teal-400 border-teal-500/30" :
                        "bg-purple-500/10 text-purple-400 border-purple-500/30"
                      )}>
                        {os.situacao}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs text-hud-muted">{formatDate(os.dataInicio)}</td>
                    <td className="p-3 font-mono text-xs text-hud-accent font-bold text-right">
                      {os.valorTotal ? formatBRL(os.valorTotal) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
