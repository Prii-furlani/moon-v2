import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  CheckCircle2, 
  Clock, 
  X, 
  Trash2, 
  ShieldCheck,
  Eye
} from 'lucide-react';
import type { ConviteMembro, UserRole } from '../types';
import { confirmDelete, showToastSuccess } from '../utils/sweetAlert';

interface TenantMembersViewProps {
  membros: ConviteMembro[];
  currentUserRole: UserRole;
  onAddConvite: (novo: ConviteMembro) => void;
  onDeleteConvite: (id: string) => void;
}

export const TenantMembersView: React.FC<TenantMembersViewProps> = ({
  membros,
  currentUserRole,
  onAddConvite,
  onDeleteConvite
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'viewer'>('member');

  const canManageMembers = currentUserRole === 'tenant_admin' || currentUserRole === 'admin_master';

  const handleDeleteWithConfirm = (membro: ConviteMembro) => {
    if (!canManageMembers) {
      alert("⚠️ Apenas o Tenant Admin pode gerenciar membros da conta!");
      return;
    }

    confirmDelete(
      'Remover Membro da Conta?',
      `Tem certeza que deseja revogar o acesso de "${membro.nome}"?`,
      () => onDeleteConvite(membro.id)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !email) return;

    const novo: ConviteMembro = {
      id: `cnv_${Date.now()}`,
      nome,
      email,
      role,
      status: 'ativo',
      dataConvite: new Date().toISOString().split('T')[0]
    };

    onAddConvite(novo);
    showToastSuccess(`Convite enviado para ${email}! ✉️`);
    setIsModalOpen(false);
    setNome('');
    setEmail('');
  };

  return (
    <div className="moon-card" style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Gestão de Membros da Conta Familiar (Inquilino)</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Convide cônjuges (Nível III - Member) ou dependentes/consultores (Nível IV - Viewer).
          </p>
        </div>

        {canManageMembers && (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <UserPlus size={16} />
            <span>+ Convidar Membro</span>
          </button>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem 0.5rem' }}>Nome / Familiar</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>E-mail</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Nível de Permissão (Role)</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Data do Convite</th>
              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {membros.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.85rem 0.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {m.nome}
                </td>
                <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-muted)' }}>
                  {m.email}
                </td>
                <td style={{ padding: '0.85rem 0.5rem' }}>
                  {m.role === 'member' ? (
                    <span className="badge badge-sage" style={{ fontSize: '0.7rem' }}>
                      <ShieldCheck size={12} /> Nível III: Member (Operacional)
                    </span>
                  ) : (
                    <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                      <Eye size={12} /> Nível IV: Viewer (Somente Leitura)
                    </span>
                  )}
                </td>
                <td style={{ padding: '0.85rem 0.5rem' }}>
                  {m.status === 'ativo' ? (
                    <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                      <CheckCircle2 size={12} /> Ativo
                    </span>
                  ) : (
                    <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>
                      <Clock size={12} /> Pendente
                    </span>
                  )}
                </td>
                <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {m.dataConvite}
                </td>
                <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                  {canManageMembers && (
                    <button onClick={() => handleDeleteWithConfirm(m)} style={{ color: 'var(--status-error)' }} title="Revogar Acesso">
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Convidar Membro */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Convidar Membro para a Conta Familiar</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Nome do Familiar ou Dependente</label>
                <input type="text" required placeholder="Ex: Eduardo Furlani" value={nome} onChange={e => setNome(e.target.value)} style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>E-mail para Convite</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="email" required placeholder="exemplo@furlani.com.br" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', paddingLeft: '2.4rem' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Nível de Acesso (RBAC)</label>
                <select value={role} onChange={e => setRole(e.target.value as any)} style={{ width: '100%' }}>
                  <option value="member">Nível III: Member (Operacional completo — cria, edita e paga contas)</option>
                  <option value="viewer">Nível IV: Viewer (Visualizador estritamente de leitura — para filhos ou consultores)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Enviar Convite</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
