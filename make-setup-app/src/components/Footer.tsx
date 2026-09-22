import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer style={{
      textAlign: 'center',
      padding: '1.5rem',
      marginTop: 'auto',
      color: 'var(--text-muted)',
      fontSize: '0.8rem',
      fontFamily: '"Inter", sans-serif'
    }}>
      &copy; 2026 MoonFinance Me. Desenvolvido com excelência por Priscila Furlani.
    </footer>
  );
};
