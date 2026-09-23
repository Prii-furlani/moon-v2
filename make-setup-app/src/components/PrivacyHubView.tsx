import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertOctagon, 
  Download, 
  Trash2, 
  Users, 
  FileSpreadsheet,
  Crown,
  UserCheck,
  Search,
  CheckCircle2
} from 'lucide-react';
import type { UserProfile, PrivacySettings, AuditLog, UserRole, ConviteMembro } from '../types';
import { showAlertSuccess, confirmDelete, showToastSuccess } from '../utils/sweetAlert';
import { TenantMembersView } from './TenantMembersView';

interface PrivacyHubViewProps {
  user: UserProfile;
  settings: PrivacySettings;
  auditLogs: AuditLog[];
  membros: ConviteMembro[];
  onToggleSetting: (key: keyof PrivacySettings) => void;
  onRoleChange: (role: UserRole) => void;
  onExportData: () => void;
  onDeleteDataRequest: () => void;
  onAddConvite: (novo: ConviteMembro) => void;
  onDeleteConvite: (id: string) => void;
  onClearDemoData?: () => void;
}

export const PrivacyHubView: React.FC<PrivacyHubViewProps> = ({
  user,
  settings,
  auditLogs,
  membros,
  onToggleSetting,
  onExportData,
  onDeleteDataRequest,
  onAddConvite,
  onDeleteConvite,
  onClearDemoData
}) => {
  const [showPseudonymized, setShowPseudonymized] = useState(true);
  const [isSimulatingIncident, setIsSimulatingIncident] = useState(false);
  const [logSearchTerm, setLogSearchTerm] = useState('');

  const canExportOrDelete = user.role === 'tenant_admin' || user.role === 'admin_master';

  const filteredLogs = auditLogs.filter(log => 
    log.acao.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
    log.detalhes.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
    log.usuario.toLowerCase().includes(logSearchTerm.toLowerCase())
  );

  const handleSimulateIncident = () => {
    setIsSimulatingIncident(true);
    setTimeout(() => {
      setIsSimulatingIncident(false);
      showAlertSuccess(
        '🚨 Simulação de Incidente Registrada (LGPD Art. 48)',
        'Notificação enviada com sucesso para a DPO e log imutável de segurança gravado na trilha de auditoria!'
      );
    }, 1200);
  };

  const handleDeleteAccountWithConfirm = () => {
    if (!canExportOrDelete) {
      alert("⚠️ Apenas o Tenant Admin ou Admin Master podem solicitar a exclusão da conta!");
      return;
    }

    confirmDelete(
      'Solicitar Exclusão Definitiva de Dados (Art. 18 LGPD)?',
      'Esta ação enviará uma solicitação formal para expurgar seus registros de lançamentos, faturas e dados de pets.',
      () => {
        onDeleteDataRequest();
        showAlertSuccess('🔒 Solicitação Recebida!', 'Um protocolo de confirmação de exclusão LGPD foi enviado para o seu e-mail.');
      }
    );
  };

  const handleExportDataWithToast = () => {
    onExportData();
    showToastSuccess('Relatório de dados JSON exportado com sucesso! 📄');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Privacy Hub & Governança LGPD
            </h1>
            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
              <ShieldCheck size={13} /> Multi-Tenant Compliant
            </span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Configurações de Privacy by Design, Privacy by Default, RBAC em 4 Níveis e Direitos do Titular (Art. 18 LGPD).
          </p>
        </div>

        {canExportOrDelete && (
          <button className="btn-primary" onClick={handleExportDataWithToast}>
            <Download size={16} />
            <span>Exportar Meus Dados (JSON)</span>
          </button>
        )}
      </div>

      {/* 4 Levels of Roles Summary Banner */}
      <div className="moon-card" style={{ backgroundColor: 'var(--bg-primary-light)', border: '1px solid var(--color-primary)' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-primary)' }}>
          Estrutura de Controle de Acesso RBAC em 4 Níveis
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.82rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Crown size={14} /> Nível I: Admin Master
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Dono da plataforma SaaS. Visualiza faturamento global (MRR), churn e tenants, sem ver extratos pessoais.
            </p>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 700, color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={14} /> Nível II: Tenant Admin
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Dono da conta do inquilino. Acesso total aos módulos, convida familiares e gerencia plano.
            </p>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <UserCheck size={14} /> Nível III: Member
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Cônjuge/parceiro. Gestão operacional completa de lançamentos e pets, mas não convida nem altera contrato.
            </p>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 700, color: 'var(--status-warning)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Eye size={14} /> Nível IV: Viewer
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Dependente/consultor. Acesso estritamente de leitura aos dashboards e relatórios.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Pillars of Privacy by Design */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem'
      }}>
        <div className="moon-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
            <Lock size={20} />
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700 }}>Criptografia de Ponta</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Dados em repouso encriptados com <strong>AES-256</strong> e conexões seguras sob protocolo <strong>TLS 1.3</strong>.
          </p>
        </div>

        <div className="moon-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-secondary)' }}>
            <Users size={20} />
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700 }}>Controle RBAC & JWT</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            JWT contém claims <code>tenant_id</code> e <code>role</code> para bloquear requisições não autorizadas.
          </p>
        </div>

        <div className="moon-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--status-success)' }}>
            <EyeOff size={20} />
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700 }}>Pseudonimização</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Relatórios e dados de exportação usam hash anônimo (<code>{user.pseudonymizedId}</code>) por padrão.
          </p>
        </div>

        <div className="moon-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--status-warning)' }}>
            <FileSpreadsheet size={20} />
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700 }}>Trilha de Auditoria Detalhada</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Logs imutáveis detalhando data, hora, usuário, ação e valores alterados mantidos para auditoria ANPD.
          </p>
        </div>
      </div>

      {/* Family Members Management Component */}
      <TenantMembersView 
        membros={membros}
        currentUserRole={user.role}
        onAddConvite={onAddConvite}
        onDeleteConvite={onDeleteConvite}
      />

      {/* Demo Interactive Box: Pseudonymization & Identity */}
      <div className="moon-card" style={{ backgroundColor: 'var(--bg-secondary-light)', border: '1px solid var(--color-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Demonstração Prática de Pseudonimização (Privacy by Default)</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Alterne abaixo para verificar como relatórios e exports tratam os dados sensíveis do titular.
            </p>
          </div>

          <button 
            className="btn-outline"
            onClick={() => setShowPseudonymized(!showPseudonymized)}
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            {showPseudonymized ? <Eye size={16} /> : <EyeOff size={16} />}
            <span>{showPseudonymized ? 'Revelar Identidade Real' : 'Ativar Pseudonimização'}</span>
          </button>
        </div>

        <div style={{ marginTop: '1rem', padding: '0.85rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.88rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Tenant ID:</span>
            <div style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-primary)' }}>{user.usuarioId}</div>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Nome do Titular:</span>
            <div style={{ fontWeight: 700 }}>{showPseudonymized ? user.pseudonymizedId : user.name}</div>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>E-mail Cadastrado:</span>
            <div style={{ fontWeight: 700 }}>{showPseudonymized ? 'p***a@moonfinanceme.com.br' : user.email}</div>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Perfil RBAC:</span>
            <div><span className="badge badge-sage" style={{ fontSize: '0.7rem' }}>{user.role.toUpperCase()}</span></div>
          </div>
        </div>
      </div>

      {/* Toggles & Privacy Settings */}
      <div className="moon-card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem' }}>Preferências & Consentimento (Art. 7º LGPD)</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {settings.lgpdAcceptedAt && (
            <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-primary-light)', borderLeft: '3px solid var(--status-success)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-success)', fontWeight: 600, fontSize: '0.9rem' }}>
                <CheckCircle2 size={16} /> LGPD & Termos Aceitos
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                Consentimento livre, expresso e inequivoco registrado e imutável em banco de dados em: <strong>{new Date(settings.lgpdAcceptedAt).toLocaleString('pt-BR')}</strong>
              </p>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <strong style={{ fontSize: '0.9rem' }}>Exige Autenticação Multifator (MFA em 2 Etapas)</strong>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Solicita código de 6 dígitos ao realizar login em novos dispositivos</p>
            </div>
            <input 
              type="checkbox" 
              checked={settings.mfaRequired} 
              onChange={() => onToggleSetting('mfaRequired')} 
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <strong style={{ fontSize: '0.9rem' }}>Pseudonimizar Dados ao Exportar Relatórios</strong>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Oculta nome e e-mail em arquivos JSON/CSV baixados</p>
            </div>
            <input 
              type="checkbox" 
              checked={settings.pseudonymizeExport} 
              onChange={() => onToggleSetting('pseudonymizeExport')} 
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <strong style={{ fontSize: '0.9rem' }}>Módulo de Pets Ativado</strong>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Mapeamento de despesas, ração e vacinas da Lua e Sofy</p>
            </div>
            <input 
              type="checkbox" 
              checked={settings.petsModuleEnabled} 
              onChange={() => onToggleSetting('petsModuleEnabled')} 
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <strong style={{ fontSize: '0.9rem' }}>Módulo Planejamento & Sonhos Ativado</strong>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Gestão de metas por categorias (Moradia, Entrada de Imóvel 4-6 anos, Educação, Lazer)</p>
            </div>
            <input 
              type="checkbox" 
              checked={settings.planejamentoEnabled ?? true} 
              onChange={() => onToggleSetting('planejamentoEnabled')} 
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>


        </div>
      </div>

      {/* Incident Response Simulator & Danger Zone */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        
        {/* Incident Simulator */}
        <div className="moon-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <AlertOctagon size={20} style={{ color: 'var(--status-warning)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Simulador de Incidente de Segurança (ANPD)</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Testa a resposta a incidentes (Art. 48 LGPD) disparando alertas para o DPO e inserindo log imutável na trilha.
          </p>

          <button 
            className="btn-secondary" 
            onClick={handleSimulateIncident} 
            disabled={isSimulatingIncident}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {isSimulatingIncident ? 'Simulando Notificação...' : 'Simular Resposta a Incidente'}
          </button>
        </div>

        {/* Danger Zone: Elimination */}
        <div className="moon-card" style={{ borderColor: 'var(--status-error)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Trash2 size={20} style={{ color: 'var(--status-error)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--status-error)' }}>Direito à Eliminação de Dados</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Solicita a exclusão definitiva e expurgo de todas as informações financeiras de acordo com o Art. 18, VI da LGPD.
          </p>

          <button 
            className="btn-outline" 
            onClick={handleDeleteAccountWithConfirm}
            style={{ width: '100%', justifyContent: 'center', color: 'var(--status-error)', borderColor: 'var(--status-error)' }}
          >
            Solicitar Exclusão de Dados
          </button>

          {onClearDemoData && (
            <button 
              className="btn-outline" 
              onClick={() => {
                confirmDelete(
                  'Limpar Todos os Dados Demo?',
                  'Isso limpará os itens fictícios da tela para que você inicie o sistema 100% limpo alimentado pelo banco MySQL da HostGator.',
                  onClearDemoData
                );
              }}
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.65rem', backgroundColor: 'var(--bg-input)' }}
            >
              <Trash2 size={14} />
              <span>Limpar Dados Demo (Iniciar Banco Limpo)</span>
            </button>
          )}
        </div>

      </div>

      {/* Enhanced Audit Log Table */}
      <div className="moon-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Trilha Imutável de Auditoria (Audit Logs Detalhados)</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Registros de data, hora, valores anteriores/novos e parâmetros de cada alteração no sistema</p>
          </div>

          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder="Buscar nos logs de auditoria..."
              value={logSearchTerm}
              onChange={e => setLogSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.4rem', height: '34px', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.65rem 0.5rem', width: '160px' }}>Data / Hora</th>
                <th style={{ padding: '0.65rem 0.5rem', width: '140px' }}>Usuário</th>
                <th style={{ padding: '0.65rem 0.5rem', width: '120px' }}>Perfil</th>
                <th style={{ padding: '0.65rem 0.5rem', width: '220px' }}>Ação Registrada</th>
                <th style={{ padding: '0.65rem 0.5rem' }}>Detalhes Granulares (Valores / Parâmetros)</th>
                <th style={{ padding: '0.65rem 0.5rem', width: '110px' }}>IP Origem</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'monospace' }}>
                    {log.timestamp}
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {log.usuario}
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <span className="badge badge-sage" style={{ fontSize: '0.65rem' }}>{log.perfil}</span>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                    {log.acao}
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-main)', fontSize: '0.8rem', lineHeight: 1.35 }}>
                    {log.detalhes}
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    {log.ip}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
