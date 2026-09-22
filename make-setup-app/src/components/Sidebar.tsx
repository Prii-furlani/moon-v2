import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  CalendarDays,
  Sparkles,
  Dog,
  Car,
  CreditCard,
  AlertTriangle,

  UserCog,
  ChevronLeft,
  ChevronRight,
  Compass
} from 'lucide-react';
import type { NavigationTab } from '../types';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  petsEnabled: boolean;
  esteticaEnabled: boolean;
  carrosEnabled: boolean;
  cartoesEnabled: boolean;
  inadimplenciasEnabled: boolean;
  planejamentoEnabled?: boolean;

  isMobileMenuOpen?: boolean;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  petsEnabled,
  esteticaEnabled,
  carrosEnabled,
  cartoesEnabled,
  inadimplenciasEnabled,
  planejamentoEnabled = true,

  isMobileMenuOpen
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const menuItems = [
    { id: 'dashboard' as NavigationTab, label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'lancamentos' as NavigationTab, label: 'Lançamentos', icon: Receipt },
    { id: 'despesas' as NavigationTab, label: 'Despesas Mês a Mês', icon: CalendarDays },
    ...(planejamentoEnabled ? [{ id: 'planejamento' as NavigationTab, label: 'Planejamento & Sonhos', icon: Compass }] : []),
    ...(esteticaEnabled ? [{ id: 'estetica' as NavigationTab, label: 'Autocuidado & Bem-Estar', icon: Sparkles }] : []),
    ...(petsEnabled ? [{ id: 'pets' as NavigationTab, label: 'Módulo Pets', icon: Dog }] : []),
    ...(carrosEnabled ? [{ id: 'carros' as NavigationTab, label: 'Veículos & Carros', icon: Car }] : []),
    ...(cartoesEnabled ? [{ id: 'cartao' as NavigationTab, label: 'Cartão de Crédito', icon: CreditCard }] : []),
    ...(inadimplenciasEnabled ? [{ id: 'inadimplencias' as NavigationTab, label: 'Inadimplências', icon: AlertTriangle }] : []),
    { id: 'user_settings' as NavigationTab, label: 'Configurações da Conta', icon: UserCog }
  ];

  return (
    <aside
      className={`app-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}
      style={{
        width: isCollapsed ? '80px' : '240px',
        backgroundColor: 'var(--bg-card)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: isCollapsed ? '1.25rem 0.5rem' : '1.25rem 0.85rem',
        height: '100vh',
        position: 'sticky',
        top: 0,
        transition: 'width 0.3s ease, padding 0.3s ease'
      }}>

      {/* Toggle Button for Desktop */}
      <button
        className="desktop-only"
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          position: 'absolute',
          top: '1.15rem',
          right: '-12px',
          width: '24px',
          height: '24px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          zIndex: 60,
          boxShadow: 'var(--shadow-sm)',
          transition: 'color 0.2s ease'
        }}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div>
        {/* Brand Logo Only */}
        <div style={{ 
          marginBottom: '1.5rem', 
          padding: '0.25rem 0.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: isCollapsed ? 'center' : 'flex-start' 
        }}>
          <img 
            src="/logo.svg" 
            alt="MoonFinance Logo" 
            style={{ 
              width: isCollapsed ? '38px' : '150px', 
              height: 'auto', 
              objectFit: 'contain', 
              flexShrink: 0, 
              transition: 'width 0.3s ease' 
            }} 
          />
        </div>

        {/* Minimal Module Navigation List */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'space-between',
                  padding: isCollapsed ? '0.65rem 0' : '0.65rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.86rem',
                  fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? 'var(--bg-primary-light)' : 'transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--text-main)',
                  transition: 'all 0.15s ease',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* O charme do indicador em gradiente no canto esquerdo */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    background: 'linear-gradient(180deg, var(--color-primary), var(--color-secondary))',
                    borderRadius: '0 4px 4px 0'
                  }} />
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', zIndex: 2 }}>
                  <Icon size={18} style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-secondary)', flexShrink: 0 }} />
                  {!isCollapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                </div>

              </button>
            );
          })}
        </nav>
      </div>

    </aside>
  );
};
