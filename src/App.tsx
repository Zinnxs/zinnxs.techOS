import { useState } from 'react';
import { Topbar } from './components/layout/Topbar';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/views/Dashboard';
import { Clientes } from './components/views/Clientes';
import { Ordens } from './components/views/Ordens';
import { Servicos } from './components/views/Servicos';
import { Estoque } from './components/views/Estoque';
import { Arquivos } from './components/views/Arquivos';
import { useAppContext } from './lib/context';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const { db } = useAppContext();

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
      
      <Topbar />
      <div className="flex flex-1 overflow-hidden z-0">
        <Sidebar currentView={currentView} onChangeView={setCurrentView} />
        <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 bg-transparent">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
