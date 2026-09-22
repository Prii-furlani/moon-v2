import React from 'react';
import { 
  Moon, 
  Sun, 
  Menu,
  LogOut
} from 'lucide-react';
import type { UserProfile, UserRole, NavigationTab } from '../types';

interface HeaderProps {
  user: UserProfile;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onRoleChange: (role: UserRole) => void;
  onNavigateTab: (tab: NavigationTab) => void;
  onToggleMobileMenu?: () => void;
  globalSearchTerm?: string;
  onSearchChange?: (term: string) => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isDarkMode,
  onToggleTheme,
  onNavigateTab,
  onToggleMobileMenu,
  onLogout
}) => {
  return (
    <header style={{
      height: '60px',
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(8px)'
    }}>
      
      {/* Mobile Hamburger Button */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          className="mobile-only"
          onClick={onToggleMobileMenu}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-main)',
            padding: '0.25rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Right Controls: Minimal Theme, Profile & Logout Only */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginLeft: 'auto' }}>
        
        {/* Light / Dark Mode Toggle Button */}
        <button 
          onClick={onToggleTheme}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-main)',
            transition: 'all 0.2s ease'
          }}
          title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
        >
          {isDarkMode ? <Sun size={16} style={{ color: '#E5B869' }} /> : <Moon size={16} style={{ color: 'var(--color-primary)' }} />}
        </button>

        {/* Divider */}
        <div style={{ height: '20px', width: '1px', backgroundColor: 'var(--border-color)' }} />

        {/* Minimal User Profile Chip */}
        <div 
          onClick={() => onNavigateTab('user_settings')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.55rem', 
            cursor: 'pointer',
            padding: '0.25rem 0.5rem',
            borderRadius: 'var(--radius-full)',
            transition: 'backgroundColor 0.15s ease'
          }}
          className="user-header-chip"
          title="Configurações da Conta"
        >
          <img 
            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=873F2B&color=fff&bold=true`} 
            alt={user.name}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1.5px solid var(--color-primary)'
            }}
          />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {user.name}
          </span>
        </div>

        {/* Botão de Sair (Logout) */}
        {onLogout && (
          <button
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--status-error)',
              backgroundColor: 'transparent',
              color: 'var(--status-error)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Sair da Conta (Logout)"
          >
            <LogOut size={14} />
            <span>Sair</span>
          </button>
        )}

      </div>

    </header>
  );
};
