import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  KeyRound,
  Calendar,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react';
import { showToastSuccess, showToastError, showToastInfo } from '../utils/sweetAlert';
import { fetchApiData } from '../services/api';
import { maskCPF, validateCPF } from '../utils/masks';


interface AuthViewProps {
  onLoginSuccess: (user?: any) => void;
}

type AuthMode = 'login' | 'register' | 'forgot_password';

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  
  // States para Formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(maskCPF(e.target.value));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToastError('Por favor, preencha o e-mail e a senha.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Validar via API MySQL do HostGator
    try {
      const apiRes = await fetchApiData<{ status: string; message?: string; user?: any; token?: string; }>('auth/login.php', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, password })
      });

      if (apiRes && apiRes.status === 'success') {
        showToastSuccess(`Bem-vindo(a), ${apiRes.user?.nome || 'Usuário'}! Login efetuado com sucesso.`);
        onLoginSuccess({ 
          id: apiRes.user?.id, 
          tenantId: apiRes.user?.tenant_id, 
          name: apiRes.user?.nome, 
          email: apiRes.user?.email, 
          role: apiRes.user?.role || 'tenant_admin',
          isFirstLogin: apiRes.user?.onboarding_completed === 0 || apiRes.user?.onboarding_completed === "0" || apiRes.user?.onboarding_completed === false,
          token: apiRes.token
        });
        return;
      }
    } catch (err) {
      console.warn('Backend API login fallback:', err);
    }

    // 2. Validação de Credenciais Administradoras Padrão
    const isMasterAdmin = (cleanEmail === 'priscila@moonfinanceme.com.br' || cleanEmail === 'admin@moon.com') && (password === 'Admin@123' || password === '123456');

    // 3. Validação de Contas Cadastradas Localmente
    const storedUsersJson = localStorage.getItem('moon_registered_users');
    let isRegisteredUser = false;
    if (storedUsersJson) {
      try {
        const usersList = JSON.parse(storedUsersJson);
        const match = usersList.find((u: any) => u.email.toLowerCase() === cleanEmail && u.password === password);
        if (match) isRegisteredUser = true;
      } catch (e) {
        console.error('Error parsing registered users', e);
      }
    }

    if (isMasterAdmin) {
      showToastSuccess('Login efetuado com sucesso!');
      onLoginSuccess({ name: 'Admin Master', email: cleanEmail, role: 'admin_master' });
    } else if (isRegisteredUser) {
      try {
        const usersList = JSON.parse(storedUsersJson!);
        const match = usersList.find((u: any) => u.email.toLowerCase() === cleanEmail && u.password === password);
        showToastSuccess('Login efetuado com sucesso!');
        onLoginSuccess({ name: match.nome, email: match.email, role: 'tenant_admin' });
      } catch (e) {
        onLoginSuccess();
      }
    } else {
      showToastError('⚠️ E-mail ou senha incorretos! Verifique suas credenciais.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !email || !cpf || !dataNascimento || !password || !confirmPassword) {
      showToastError('Preencha todos os campos obrigatórios.');
      return;
    }
    if (!validateCPF(cpf)) {
      showToastError('O CPF informado é inválido.');
      return;
    }
    if (password !== confirmPassword) {
      showToastError('As senhas não coincidem.');
      return;
    }
    if (!lgpdConsent) {
      showToastError('Você deve aceitar os termos de segurança LGPD.');
      return;
    }
    
    const cleanEmail = email.trim().toLowerCase();
    
    // 1. Registrar via API MySQL
    try {
      const apiRes = await fetchApiData<{ status: string; message?: string; user?: any; token?: string; }>('auth/register.php', {
        method: 'POST',
        body: JSON.stringify({ name: nome, email: cleanEmail, password, cpf, dataNascimento })
      });
      
      if (!apiRes || apiRes.status !== 'success') {
        showToastError(apiRes?.message || 'Erro ao criar conta no servidor.');
        return;
      }
      
      showToastSuccess('Conta criada com sucesso! Bem-vindo(a).');
      onLoginSuccess({ 
        id: apiRes.user?.id || `usr_${Date.now()}`, 
        tenantId: apiRes.user?.tenant_id || `tnt_${Date.now()}`, 
        name: apiRes.user?.nome || nome, 
        email: cleanEmail, 
        role: 'tenant_admin', 
        isFirstLogin: true,
        token: apiRes.token
      });
      return;
    } catch (e: any) {
      console.warn('Falha no registro via API remota:', e);
      showToastError(e.message || 'Erro de conexão com o servidor. Tente novamente.');
      return;
    }
  };  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToastError('Informe seu e-mail para recuperar a senha.');
      return;
    }
    showToastInfo('Um link de recuperação foi enviado para ' + email);
    setMode('login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-main)',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Background Decorativo */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-5%',
        width: '40vw',
        height: '40vw',
        borderRadius: '50%',
        backgroundColor: 'var(--color-primary)',
        opacity: 0.05,
        filter: 'blur(60px)'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-5%',
        width: '35vw',
        height: '35vw',
        borderRadius: '50%',
        backgroundColor: 'var(--color-secondary)',
        opacity: 0.08,
        filter: 'blur(50px)'
      }} />

      <div className="moon-card" style={{
        width: '100%',
        maxWidth: '460px',
        position: 'relative',
        zIndex: 10,
        boxShadow: 'var(--shadow-lg)',
        paddingTop: '2rem', // adjust padding to accommodate the top bar
        overflow: 'hidden'
      }}>
        {/* Detalhe Superior de Cores do Projeto */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))'
        }} />
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img 
            src="/logo.svg" 
            alt="MoonFinance Logo" 
            style={{ 
              width: '180px', height: 'auto', objectFit: 'contain', 
              margin: '0 auto', display: 'block' 
            }} 
          />
        </div>

        {/* MODO LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 style={{ fontSize: '1.2rem', textAlign: 'center', marginBottom: '0.5rem' }}>Acesse sua Conta</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>E-mail</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', paddingLeft: '38px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Senha</label>
                <span 
                  onClick={() => setMode('forgot_password')}
                  style={{ fontSize: '0.75rem', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Esqueceu a senha?
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ width: '100%', paddingLeft: '38px', paddingRight: '38px' }}
                />
                <div 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
              Entrar <ArrowRight size={18} />
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Ainda não tem conta? </span>
              <strong 
                onClick={() => setMode('register')} 
                style={{ color: 'var(--color-primary)', cursor: 'pointer', marginLeft: '4px' }}
              >
                Criar Conta
              </strong>
            </div>
          </form>
        )}

        {/* MODO CADASTRO */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <h2 style={{ fontSize: '1.2rem', textAlign: 'center', marginBottom: '0.25rem' }}>Criar Nova Conta</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nome Completo</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Ex: João da Silva"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  style={{ width: '100%', paddingLeft: '36px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>E-mail</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', paddingLeft: '36px' }}
                />
              </div>
            </div>


            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>CPF</label>
                <div style={{ position: 'relative' }}>
                  <FileText size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={handleCpfChange}
                    maxLength={14}
                    style={{ width: '100%', paddingLeft: '36px' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Data Nasc.</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="date" 
                    value={dataNascimento}
                    onChange={e => setDataNascimento(e.target.value)}
                    style={{ width: '100%', paddingLeft: '36px' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Senha</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    style={{ width: '100%', paddingLeft: '36px', paddingRight: '36px' }}
                  />
                  <div 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Confirmar</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    style={{ width: '100%', paddingLeft: '36px', paddingRight: '36px' }}
                  />
                  <div 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                  >
                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </div>
                </div>
              </div>
            </div>

            {/* Checkbox de LGPD (Obrigatório) */}
            <label style={{
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '0.75rem', 
              padding: '0.85rem', 
              backgroundColor: 'var(--status-warning-bg)', 
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--status-warning)',
              marginTop: '0.5rem',
              cursor: 'pointer'
            }}>
              <input 
                type="checkbox" 
                checked={lgpdConsent}
                onChange={e => setLgpdConsent(e.target.checked)}
                style={{ marginTop: '2px' }}
              />
              <span style={{ fontSize: '0.75rem', lineHeight: 1.4, color: 'var(--text-main)' }}>
                <strong>Consentimento LGPD:</strong> Li e aceito os termos de segurança. Consinto com a coleta do meu CPF e e-mail para identificação única, e que meus dados serão guardados criptografados e com acesso restrito, podendo ser solicitada a exclusão a qualquer momento.
              </span>
            </label>

            <button type="submit" className="btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
              <ShieldCheck size={18} /> Criar Conta Segura
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Já tem uma conta? </span>
              <strong 
                onClick={() => setMode('login')} 
                style={{ color: 'var(--color-secondary)', cursor: 'pointer', marginLeft: '4px' }}
              >
                Fazer Login
              </strong>
            </div>
          </form>
        )}

        {/* MODO ESQUECI A SENHA */}
        {mode === 'forgot_password' && (
          <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 style={{ fontSize: '1.2rem', textAlign: 'center', marginBottom: '0.5rem' }}>Recuperar Senha</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Digite seu e-mail cadastrado para enviarmos um link de recuperação (mock).
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>E-mail</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', paddingLeft: '38px' }}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
              Enviar Link de Recuperação <KeyRound size={18} />
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>
              <strong 
                onClick={() => setMode('login')} 
                style={{ color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
              >
                Voltar para o Login
              </strong>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
