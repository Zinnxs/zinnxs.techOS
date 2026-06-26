import React, { useState, useEffect } from 'react';
import { Cpu, Sun, Moon } from 'lucide-react';

export function Topbar() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="h-[60px] bg-hud-panel/60 border-b border-hud-border sticky top-0 z-40 flex items-center justify-between px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 border border-hud-accent bg-hud-accent/10 flex items-center justify-center relative">
          <Cpu size={18} className="text-hud-accent" />
          <div className="absolute inset-[-2px] border border-hud-accent/30 animate-pulse"></div>
        </div>
        <div className="font-display font-black tracking-[0.2em] text-lg">
          <span className="text-hud-text">ZINNXS</span>
          <span className="text-hud-accent">TECH</span>
        </div>
      </div>
      
      <div className="flex items-center gap-6 font-mono text-[10px] tracking-widest uppercase">
        <button 
          onClick={toggleTheme}
          className="flex items-center gap-2 text-hud-muted hover:text-hud-accent transition-colors"
          title="Alternar Tema"
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          <span className="hidden sm:inline">Tema</span>
        </button>
      </div>
    </header>
  );
}
