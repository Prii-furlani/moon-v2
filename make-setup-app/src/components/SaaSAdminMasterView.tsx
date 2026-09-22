import React, { useState } from 'react';
import { 
  Crown, 
  Users, 
  TrendingUp, 
  Power, 
  Lock, 
  CheckCircle2, 
  AlertOctagon, 
  Search,
  Globe
} from 'lucide-react';
import type { Tenant, PrivacySettings } from '../types';
import { showToastSuccess } from '../utils/sweetAlert';

interface SaaSAdminMasterViewProps {
  tenants: Tenant[];
  privacySettings: PrivacySettings;
  onToggleTenantStatus: (tenantId: string) => void;
  onToggleGlobalMaintenanceMode: () => void;
}

export const SaaSAdminMasterView: React.FC<SaaSAdminMasterViewProps> = ({
  tenants,
  privacySettings,
  onToggleTenantStatus,
  onToggleGlobalMaintenanceMode
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // SaaS Global Metrics
  const activeTenantsCount = tenants.filter(t => t.status === 'ativo').length;
  const mrrTotal = tenants
    .filter(t => t.status === 'ativo')
    .reduce((acc, t) => acc + t.mrr, 0);

  const arrTotal = mrrTotal * 12;
  const churnRate = 1.2;

  const filteredTenants = tenants.filter(t => 
    t.nomeFamiliaOuEmpresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.titularEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner: Admin Master Level Badge */}
      <div style={{
        backgroundColor: 'var(--bg-primary-light)',
        border: '2px solid var(--color-primary)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Crown size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Painel Admin Master SaaS (Dono da Plataforma)
              </h1>
              <span className="badge badge-terracota" style={{ fontSize: '0.7rem' }}>
                Nível I — Dono da Plataforma
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Gestão global do ecossistema SaaS, faturamento de assinaturas, retenção e parâmetros da plataforma.
            </p>
          </div>
        </div>

        {/* Global Maintenance Toggle */}
        <button 
          className={privacySettings.globalMaintenanceMode ? 'btn-secondary' : 'btn-outline'}
          onClick={() => {
            onToggleGlobalMaintenanceMode();
            showToastSuccess(privacySettings.globalMaintenanceMode ? 'Modo de Manutenção Desativado' : 'Modo de Manutenção Ativado Globalmente!');
          }}
          style={{ fontSize: '0.82rem' }}
        >
          <Power size={16} />
          <span>{privacySettings.globalMaintenanceMode ? 'SaaS em Manutenção Global' : 'Ativar Modo Manutenção Global'}</span>
        </button>
      </div>

      {/* Privacy Notice: Protection of Customer Financial Data */}
      <div style={{
        backgroundColor: 'var(--status-success-bg)',
        border: '1px solid var(--status-success)',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        fontSize: '0.82rem',
        color: 'var(--text-main)'
      }}>
        <Lock size={20} style={{ color: 'var(--status-success)', flexShrink: 0 }} />
        <span>
          <strong>Proteção Legal Privacy by Design (LGPD):</strong> Como Admin Master, você gerencia os inquilinos e cobranças do SaaS, mas <strong>não possui acesso visual aos dados financeiros sensíveis ou extratos pessoais dos seus clientes</strong> (garantindo confidencialidade absoluta por lei).
        </span>
      </div>

      {/* SaaS Global Metrics KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem'
      }}>
        <div className="moon-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Clientes Ativos (Tenants)</span>
            <Users size={18} />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.35rem' }}>
            {activeTenantsCount} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>de {tenants.length} assinantes</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--status-success)', fontWeight: 600 }}>+12% neste mês</span>
        </div>

        <div className="moon-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Receita Recorrente Mensal (MRR)</span>
            <TrendingUp size={18} />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '0.35rem' }}>
            R$ {mrrTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/mês</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ARR Projetado: R$ {arrTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="moon-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Taxa de Cancelamento (Churn)</span>
            <AlertOctagon size={18} />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--status-success)', marginTop: '0.35rem' }}>
            {churnRate}% <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>a.m.</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--status-success)', fontWeight: 600 }}>Excelente retenção</span>
        </div>

        <div className="moon-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Status do Sistema & ANPD</span>
            <Globe size={18} />
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--status-success)', marginTop: '0.35rem' }}>
            100% Operacional
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DPO & Auditoria Ativos</span>
        </div>
      </div>

      {/* Tenant Management Table */}
      <div className="moon-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Gerenciamento de Clientes & Assinaturas SaaS (Tenants)</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ativar, suspender ou alterar planos de contas de clientes</p>
          </div>

          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar cliente ou e-mail..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.4rem', height: '36px', fontSize: '0.82rem' }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Tenant ID</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Cliente / Titular</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>E-mail Titular</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Plano SaaS</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Membros</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>MRR</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Ação de Gestão</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map(tenant => {
                const isAtivo = tenant.status === 'ativo';

                return (
                  <tr key={tenant.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: isAtivo ? 1 : 0.65 }}>
                    <td style={{ padding: '0.85rem 0.5rem', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-primary)' }}>
                      {tenant.id}
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {tenant.nomeFamiliaOuEmpresa}
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-muted)' }}>
                      {tenant.titularEmail}
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <span className="badge badge-sage" style={{ fontSize: '0.7rem' }}>
                        {tenant.plano}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-muted)' }}>
                      {tenant.membrosCount} membro(s)
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>
                      R$ {tenant.mrr.toFixed(2)}
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      {isAtivo ? (
                        <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                          <CheckCircle2 size={12} /> Ativo
                        </span>
                      ) : (
                        <span className="badge badge-error" style={{ fontSize: '0.68rem' }}>
                          <Power size={12} /> Suspenso
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem', textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          onToggleTenantStatus(tenant.id);
                          showToastSuccess(`Status do tenant ${tenant.nomeFamiliaOuEmpresa} alterado!`);
                        }}
                        className={isAtivo ? 'btn-outline' : 'btn-primary'}
                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                      >
                        {isAtivo ? 'Suspender Conta' : 'Ativar Conta'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
