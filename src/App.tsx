import { useState, useEffect } from 'react';
import { Topbar } from './components/layout/Topbar';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/views/Dashboard';
import { Clientes } from './components/views/Clientes';
import { Ordens } from './components/views/Ordens';
import { Servicos } from './components/views/Servicos';
import { Estoque } from './components/views/Estoque';
import { Arquivos } from './components/views/Arquivos';
import { CommandPalette } from './components/ui/CommandPalette';
import { BackupReminder } from './components/ui/BackupReminder';
import { ShortcutsModal } from './components/ui/ShortcutsModal';
import { useAppContext } from './lib/context';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const { db } = useAppContext();

  // Listen for Ctrl+K, ? or navigation keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Search (Ctrl+K or Cmd+K)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      // Check if user is typing in an input
      const active = document.activeElement;
      const isTyping = active && (
        active.tagName === 'INPUT' || 
        active.tagName === 'TEXTAREA' || 
        active.tagName === 'SELECT' || 
        active.hasAttribute('contenteditable')
      );

      // 2. Help Shortcuts (?)
      if (e.key === '?' && !isTyping) {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
        return;
      }

      // If user is typing, don't trigger general navigation single-key hotkeys
      if (isTyping) return;

      // 3. Navigation shortcuts
      switch (e.key.toLowerCase()) {
        case '1':
        case 'd':
          e.preventDefault();
          setCurrentView('dashboard');
          break;
        case '2':
        case 'c':
          e.preventDefault();
          setCurrentView('clientes');
          break;
        case '3':
        case 'o':
          e.preventDefault();
          setCurrentView('ordens');
          break;
        case '4':
        case 's':
          e.preventDefault();
          setCurrentView('servicos');
          break;
        case '5':
        case 'e':
          e.preventDefault();
          setCurrentView('estoque');
          break;
        case '6':
        case 'a':
          e.preventDefault();
          setCurrentView('arquivos');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Simple router
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'clientes':
        return <Clientes />;
      case 'ordens':
        return <Ordens />;
      case 'servicos':
        return <Servicos />;
      case 'estoque':
        return <Estoque />;
      case 'arquivos':
        return <Arquivos />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Background Layer */}
      <div className="fixed inset-0 pointer-events-none z-[-10] transition-colors duration-500 bg-gradient-to-br from-hud-bg to-hud-panel" />
      <div className="fixed inset-0 pointer-events-none z-[-9] bg-[radial-gradient(ellipse_at_top,var(--bg-gradient-start),transparent_70%)] opacity-100" />
      
      <Topbar 
        isMobileMenuOpen={isMobileMenuOpen} 
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)} 
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden z-0">
        <Sidebar 
          currentView={currentView} 
          onChangeView={setCurrentView} 
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 bg-transparent">
          {renderView()}
        </main>
      </div>

      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onChangeView={setCurrentView}
      />

      <BackupReminder />
      <ShortcutsModal 
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
