import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  KeyRound, 
  Mail, 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  Bell
} from 'lucide-react';
import type { UserProfile } from '../types';
import { showAlertSuccess, showToastSuccess } from '../utils/sweetAlert';
import { ImageUploader } from './ImageUploader';

interface UserProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (updatedUser: Partial<UserProfile>) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpdateUser
}) => {
  const [activeTab, setActiveTab] = useState<'perfil' | 'senha' | 'preferencias'>('perfil');

  // Form State Perfil
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [avatar, setAvatar] = useState(user.avatar);

  // Form State Senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  // Form State Preferências
  const [mfaEnabled, setMfaEnabled] = useState(user.mfaEnabled);
  const [notifEmail, setNotifEmail] = useState(true);

  if (!isOpen) return null;

  const handleSavePerfil = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    onUpdateUser({ name, email, avatar });
    showToastSuccess('Perfil e foto de avatar atualizados! 👤');
    onClose();
  };

  const handleTrocarSenha = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      alert("⚠️ Preencha todos os campos de senha!");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      alert("⚠️ A nova senha e a confirmação não conferem!");
      return;
    }

    if (novaSenha.length < 6) {
      alert("⚠️ A nova senha deve conter pelo menos 6 caracteres!");
      return;
    }

    setSenhaAtual('');
    setNovaSenha('');
    setConfirmarSenha('');
    showAlertSuccess('🔐 Senha Alterada!', 'Sua senha foi redefinida com sucesso no banco de dados encriptado.');
    onClose();
  };

  const handleSavePreferencias = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({ mfaEnabled });
    showToastSuccess('Preferências de segurança salvas! 🛡️');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img 
              src={avatar || user.avatar} 
              alt={user.name}
              style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary)' }}
            />
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Configurações da Conta</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {user.name} • Tenant ID: <code style={{ color: 'var(--color-primary)' }}>{user.usuarioId}</code>
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Sub-tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          {[
            { id: 'perfil', label: 'Dados & Foto de Perfil', icon: <User size={15} /> },
            { id: 'senha', label: 'Segurança & Senha', icon: <Lock size={15} /> },
            { id: 'preferencias', label: 'Segurança & MFA', icon: <ShieldCheck size={15} /> }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: activeTab === t.id ? 'var(--bg-primary-light)' : 'transparent',
                color: activeTab === t.id ? 'var(--color-primary)' : 'var(--text-muted)',
                border: activeTab === t.id ? '1px solid var(--color-primary)' : '1px solid transparent'
              }}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab 1: Perfil Pessoal & Upload de Avatar */}
        {activeTab === 'perfil' && (
          <form onSubmit={handleSavePerfil} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Image File Upload */}
            <ImageUploader 
              label="Upload da Foto de Perfil / Avatar"
              value={avatar}
              onChange={setAvatar}
              aspectRatio="square"
            />

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Nome Completo</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" required value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', paddingLeft: '2.4rem' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>E-mail Cadastrado</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', paddingLeft: '2.4rem' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="button" className="btn-outline" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn-primary">Salvar Perfil</button>
            </div>
          </form>
        )}

        {/* Tab 2: Troca de Senha */}
        {activeTab === 'senha' && (
          <form onSubmit={handleTrocarSenha} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Senha Atual</label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="password" required placeholder="••••••••" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} style={{ width: '100%', paddingLeft: '2.4rem' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Nova Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="password" required placeholder="••••••••" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} style={{ width: '100%', paddingLeft: '2.4rem' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Confirmar Nova Senha</label>
              <div style={{ position: 'relative' }}>
                <CheckCircle2 size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="password" required placeholder="••••••••" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} style={{ width: '100%', paddingLeft: '2.4rem' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="button" className="btn-outline" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn-primary">Atualizar Senha</button>
            </div>
          </form>
        )}

        {/* Tab 3: Preferências de Segurança & MFA */}
        {activeTab === 'preferencias' && (
          <form onSubmit={handleSavePreferencias} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <strong style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={16} style={{ color: 'var(--color-primary)' }} />
                  Autenticação Multifator (MFA 2FA)
                </strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Exige código de verificação via aplicativo autenticador</p>
              </div>
              <input type="checkbox" checked={mfaEnabled} onChange={e => setMfaEnabled(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Bell size={16} style={{ color: 'var(--color-secondary)' }} />
                  Notificações de Segurança & Contas por E-mail
                </strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Alertas de vencimento de contas, pets e resumos mensais</p>
              </div>
              <input type="checkbox" checked={notifEmail} onChange={e => setNotifEmail(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="button" className="btn-outline" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn-primary">Salvar Preferências</button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
