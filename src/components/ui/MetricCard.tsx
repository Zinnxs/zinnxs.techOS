import React from 'react';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'green' | 'amber' | 'teal' | 'purple' | 'danger';
}

export function MetricCard({ title, value, icon: Icon, variant = 'green' }: MetricCardProps) {
  const variantStyles = {
    green: 'border-t-hud-accent text-hud-accent',
    amber: 'border-t-hud-warn text-hud-warn',
    teal: 'border-t-teal-500 text-teal-500',
    purple: 'border-t-purple-500 text-purple-500',
    danger: 'border-t-hud-danger text-hud-danger',
  };

  const bgStyles = {
    green: 'bg-hud-accent/10 border-hud-accent/20',
    amber: 'bg-hud-warn/10 border-hud-warn/20',
    teal: 'bg-teal-500/10 border-teal-500/20',
    purple: 'bg-purple-500/10 border-purple-500/20',
    danger: 'bg-hud-danger/10 border-hud-danger/20',
  };

  return (
    <div className={cn(
      "hud-panel p-5 relative overflow-hidden group hover:-translate-y-1 transition-transform border-t-2",
      variantStyles[variant]
    )}>
      <div className={cn(
        "w-10 h-10 flex items-center justify-center border mb-4 rounded-none transition-colors group-hover:border-current",
        bgStyles[variant],
        variantStyles[variant]
      )}>
        <Icon size={20} strokeWidth={1.5} />
      </div>
      <div className="font-display font-bold text-3xl text-hud-text mb-1 tracking-tight">
        {value}
      </div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-hud-muted">
        {title}
      </div>
      
      {/* Decorative corner brackets */}
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-hud-border group-hover:border-current transition-colors m-2"></div>
    </div>
  );
}
