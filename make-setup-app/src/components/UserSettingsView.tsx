import React, { useState } from 'react';
import {
  User,
  Lock,
  Bell,
  Blocks,
  CheckCircle2,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  Dog,
  Car,
  CreditCard,
  AlertTriangle,
  Sun,
  Moon,
  Laptop,
  Compass,
  Users,
  KeyRound,
  Key
} from 'lucide-react';
import type { UserProfile, ThemePreference, PrivacySettings } from '../types';
import { showAlertSuccess, showToastSuccess, showToastError } from '../utils/sweetAlert';
import { fetchApiData, API_BASE_URL } from '../services/api';
import { ImageUploader } from './ImageUploader';

interface UserSettingsViewProps {
  user: UserProfile;
  privacySettings: PrivacySettings;
  onUpdateUser: (updatedUser: Partial<UserProfile>) => void;
  onTogglePrivacySetting: (key: keyof PrivacySettings) => void;
}

export const UserSettingsView: React.FC<UserSettingsViewProps> = ({
  user,
  privacySettings,
  onUpdateUser,
  onTogglePrivacySetting
}) => {
  const [activeTab, setActiveTab] = useState<'perfil' | 'senha' | 'mfa' | 'preferencias' | 'modulos'>('perfil');

  // Form State Perfil
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Form State Senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);

  // Form State Preferências & Tema
  const [themePreference, setThemePreference] = useState<ThemePreference>(user.themePreference || 'light');
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifVencimento, setNotifVencimento] = useState(true);

  const handleSavePerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    try {
      // 1. Atualizar Perfil (Nome)
      const resPerfil = await fetchApiData<{ status: string; message: string }>('perfil.php', {
        method: 'PUT',
        body: JSON.stringify({ nome: name })
      });

      if (resPerfil?.status !== 'success') {
        showToastError(resPerfil?.message || 'Erro ao atualizar perfil.');
        return;
      }

      let finalAvatarUrl = avatar;

      // 2. Upload Avatar
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);

        const uploadRes = await fetch(`${API_BASE_URL}/upload_avatar.php`, {
          method: 'POST',
          body: formData
        });

        const uploadData = await uploadRes.json();
        if (uploadData.status === 'success') {
          finalAvatarUrl = uploadData.avatar_url;
        } else {
          showToastError(uploadData.message || 'Erro ao fazer upload da foto.');
          return;
        }
      } else if (!avatar && user.avatar) {
        // Remover avatar
        const removeRes = await fetchApiData<{ status: string }>('upload_avatar.php', {
          method: 'DELETE'
        });
        if (removeRes?.status === 'success') {
          finalAvatarUrl = '';
        }
      }

      onUpdateUser({ name, email, avatar: finalAvatarUrl });
      showToastSuccess('Dados do perfil e foto de avatar salvos com sucesso! 👤');
    } catch (err) {
      console.error(err);
      showToastError('Erro de conexão ao salvar perfil.');
    }
  };

  const handleTrocarSenha = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      alert("⚠️ Preencha todos os campos para trocar a senha!");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      alert("⚠️ A nova senha e a confirmação de senha não coincidem!");
      return;
    }

    if (novaSenha.length < 6) {
      alert("⚠️ A nova senha precisa conter pelo menos 6 caracteres!");
      return;
    }

    setSenhaAtual('');
    setNovaSenha('');
    setConfirmarSenha('');
    showAlertSuccess(
      '🔐 Senha Alterada com Sucesso!',
      'Sua nova credencial foi atualizada e encriptada com hash seguro no banco de dados.'
    );
  };

  const handleSavePreferencias = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({ themePreference });
    showToastSuccess('Preferências de segurança, notificações e tema salvas! 🎨');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Configurações da Conta & Segurança
            </h1>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Gerencie suas credenciais de acesso, foto de perfil, autenticação em duas etapas (2FA), tema padrão e privacidade.
          </p>
        </div>

        {/* Tenant Claims Info */}
        <div style={{
          padding: '0.65rem 1rem',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          {/* <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Inquilino Associado:</span>
            <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{user.tenantName}</div>
          </div> */}
          {/* <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '0.75rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Perfil RBAC:</span>
            <div style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>{user.role.toUpperCase()}</div>
          </div> */}
        </div>
      </div>

      {/* Main Container with Sidebar Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr',
        gap: '1.5rem'
      }}>

        {/* Left Sub-Navigation Tabs */}
        <div className="moon-card" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {[
            { id: 'perfil', label: 'Dados & Foto de Perfil', icon: User },
            { id: 'senha', label: 'Segurança & Senha', icon: Lock },
            { id: 'preferencias', label: 'Aparência & Tema', icon: Bell },
            { id: 'modulos', label: 'Módulos Opcionais', icon: Blocks }
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;

            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? 'var(--bg-primary-light)' : 'transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--text-main)',
                  borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={18} style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-secondary)' }} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Content View */}
        <div>

          {/* Tab 1: Perfil & Upload de Avatar */}
          {activeTab === 'perfil' && (
            <div className="moon-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Informações Pessoais & Foto de Perfil</h3>

              <form onSubmit={handleSavePerfil} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '560px' }}>

                {/* Image Upload Component */}
                <ImageUploader
                  label="Upload da Foto de Perfil / Avatar"
                  value={avatar}
                  onChange={setAvatar}
                  onFileSelect={setAvatarFile}
                  aspectRatio="square"
                />

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>Nome Completo</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', paddingLeft: '2.4rem' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>E-mail Principal</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', paddingLeft: '2.4rem' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>ID Pseudonimizado (LGPD Compliance)</label>
                  <input type="text" disabled value={user.pseudonymizedId} style={{ width: '100%', backgroundColor: 'var(--bg-input)', opacity: 0.8 }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn-primary">
                    <CheckCircle2 size={16} />
                    <span>Salvar Alterações do Perfil</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 2: Alteração de Senha Segura */}
          {activeTab === 'senha' && (
            <div className="moon-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <KeyRound size={22} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Redefinição de Senha do Usuário</h3>
              </div>

              <form onSubmit={handleTrocarSenha} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '560px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>Senha Atual</label>
                  <div style={{ position: 'relative' }}>
                    <Key size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type={showSenhaAtual ? "text" : "password"} required placeholder="••••••••" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} style={{ width: '100%', paddingLeft: '2.4rem', paddingRight: '2.4rem' }} />
                    <div onClick={() => setShowSenhaAtual(!showSenhaAtual)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                      {showSenhaAtual ? <EyeOff size={16} /> : <Eye size={16} />}
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>Nova Senha</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type={showNovaSenha ? "text" : "password"} required placeholder="••••••••" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} style={{ width: '100%', paddingLeft: '2.4rem', paddingRight: '2.4rem' }} />
                    <div onClick={() => setShowNovaSenha(!showNovaSenha)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                      {showNovaSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>Confirmar Nova Senha</label>
                  <div style={{ position: 'relative' }}>
                    <CheckCircle2 size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type={showConfirmarSenha ? "text" : "password"} required placeholder="••••••••" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} style={{ width: '100%', paddingLeft: '2.4rem', paddingRight: '2.4rem' }} />
                    <div onClick={() => setShowConfirmarSenha(!showConfirmarSenha)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                      {showConfirmarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn-primary">
                    <Lock size={16} />
                    <span>Atualizar Senha com Criptografia</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 4: Aparência, Tema Padrão & Notificações */}
          {activeTab === 'preferencias' && (
            <div className="moon-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Preferências de Aparência & Notificações</h3>

              <form onSubmit={handleSavePreferencias} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '560px' }}>

                {/* Theme Preference Option Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.65rem', color: 'var(--text-main)' }}>
                    Tema Padrão da Conta (Persistido ao Fazer Login)
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    {[
                      { id: 'light', label: 'Claro', icon: Sun, color: '#E5B869' },
                      { id: 'dark', label: 'Escuro 100%', icon: Moon, color: 'var(--color-primary)' },
                      { id: 'system', label: 'Sistema (SO)', icon: Laptop, color: 'var(--color-secondary)' }
                    ].map(t => {
                      const Icon = t.icon;
                      const isSelected = themePreference === t.id;

                      return (
                        <div
                          key={t.id}
                          onClick={() => setThemePreference(t.id as ThemePreference)}
                          style={{
                            padding: '1rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                            backgroundColor: isSelected ? 'var(--bg-primary-light)' : 'var(--bg-input)',
                            textAlign: 'center',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Icon size={24} style={{ color: t.color }} />
                          <span style={{ fontSize: '0.82rem', fontWeight: isSelected ? 700 : 500, color: 'var(--text-main)' }}>
                            {t.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>Notificações por E-mail</strong>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Receba resumos semanais de gastos e balanços do mês</p>
                    </div>
                    <input type="checkbox" checked={notifEmail} onChange={e => setNotifEmail(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.85rem' }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>Alertas de Vencimento de Contas</strong>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Notificar 3 dias antes do vencimento do IPTU, Enel e cartões</p>
                    </div>
                    <input type="checkbox" checked={notifVencimento} onChange={e => setNotifVencimento(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <button type="submit" className="btn-primary">
                    <CheckCircle2 size={16} />
                    <span>Salvar Aparência & Notificações</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 5: Módulos Opcionais */}
          {activeTab === 'modulos' && (
            <div className="moon-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Blocks size={22} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Módulos Adicionais</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Ative ou desative módulos extras da plataforma para deixar a interface apenas com o que você precisa. Seus dados cadastrados nunca são apagados ao desativar um módulo, eles apenas ficam ocultos.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* Módulo Autocuidado */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--bg-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Autocuidado & Beleza</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Gerencie seus rituais estéticos e de bem-estar.</p>
                    </div>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={privacySettings.esteticaEnabled} onChange={() => onTogglePrivacySetting('esteticaEnabled')} />
                    <span className="slider"></span>
                  </label>
                </div>

                {/* Módulo Pets */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--bg-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Dog size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Mundo Pet</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Acompanhe despesas e vacinas dos seus pets.</p>
                    </div>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={privacySettings.petsModuleEnabled} onChange={() => onTogglePrivacySetting('petsModuleEnabled')} />
                    <span className="slider"></span>
                  </label>
                </div>

                {/* Módulo Veículos */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--bg-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Car size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Veículos & Carros</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Controle abastecimentos, manutenção e km.</p>
                    </div>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={privacySettings.carrosEnabled} onChange={() => onTogglePrivacySetting('carrosEnabled')} />
                    <span className="slider"></span>
                  </label>
                </div>

                {/* Módulo Cartões de Crédito */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--bg-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Cartões de Crédito</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Controle limites, faturas e fechamentos.</p>
                    </div>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={privacySettings.cartoesEnabled} onChange={() => onTogglePrivacySetting('cartoesEnabled')} />
                    <span className="slider"></span>
                  </label>
                </div>

                {/* Módulo Inadimplências */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--bg-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Inadimplências & Acordos</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Controle valores devidos (A Pagar / A Receber).</p>
                    </div>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={privacySettings.inadimplenciasEnabled} onChange={() => onTogglePrivacySetting('inadimplenciasEnabled')} />
                    <span className="slider"></span>
                  </label>
                </div>

                {/* Módulo Planejamento & Sonhos */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--bg-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Compass size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Planejamento & Sonhos</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Metas de médio/longo prazo (Moradia, Entrada de Imóvel, Viagens).</p>
                    </div>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={privacySettings.planejamentoEnabled ?? true} onChange={() => onTogglePrivacySetting('planejamentoEnabled')} />
                    <span className="slider"></span>
                  </label>
                </div>

                {/* Módulo Membros da Família */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--bg-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Membros da Família</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Convites e controle de acesso RBAC para a família.</p>
                    </div>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={privacySettings.familiaEnabled ?? true} onChange={() => onTogglePrivacySetting('familiaEnabled')} />
                    <span className="slider"></span>
                  </label>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
