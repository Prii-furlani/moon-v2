import React from 'react';
import { Moon } from 'lucide-react';

export const MoonLoader: React.FC = () => {
  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: 'var(--bg-main)',
        color: 'var(--color-primary)'
      }}
    >

      <Moon size={64} className="moon-anim" strokeWidth={1.5} />
      <h2 style={{ marginTop: '1.5rem', fontWeight: 500, letterSpacing: '0.05em', color: 'var(--text-main)' }}>
        MoonFinance
      </h2>
      <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        Inicializando seu universo financeiro...
      </p>
    </div>
  );
};
