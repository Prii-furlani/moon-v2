import React, { useState } from 'react';
import { 
  Sparkles, 
  Wallet, 
  HeartHandshake, 
  Dog, 
  CarFront,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Target,
  AlertTriangle
} from 'lucide-react';
import type { UserProfile, PrivacySettings } from '../types';

interface OnboardingWizardProps {
  user: UserProfile;
  privacySettings: PrivacySettings;
  onComplete: (updatedUser: Partial<UserProfile>, updatedPrivacy: Partial<PrivacySettings>) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ user, privacySettings, onComplete }) => {
  const [step, setStep] = useState(1);

  // States
  const [esteticaEnabled, setEsteticaEnabled] = useState(privacySettings.esteticaEnabled);
  const [genero, setGenero] = useState(user.genero || 'nao-binario');
  const [petsEnabled, setPetsEnabled] = useState(privacySettings.petsModuleEnabled);
  const [carrosEnabled, setCarrosEnabled] = useState(privacySettings.carrosEnabled);
  const [cartoesEnabled, setCartoesEnabled] = useState(privacySettings.cartoesEnabled ?? true);
  const [inadimplenciasEnabled, setInadimplenciasEnabled] = useState(privacySettings.inadimplenciasEnabled ?? true);
  const [planejamentoEnabled, setPlanejamentoEnabled] = useState(privacySettings.planejamentoEnabled ?? true);
  
  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const handleFinish = () => {
    const now = new Date().toISOString();
    onComplete(
      { isFirstLogin: false, genero },
      { 
        esteticaEnabled, 
        petsModuleEnabled: petsEnabled, 
        carrosEnabled,
        cartoesEnabled,
        inadimplenciasEnabled,
        planejamentoEnabled,
        familiaEnabled: false,
        lgpdAcceptedAt: now,
        setupCompletedAt: now
      }
    );
  };

  const ToggleCard = ({ icon: Icon, title, description, checked, onChange }: any) => (
    <div 
      onClick={() => onChange(!checked)}
      style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: '1rem', 
        padding: '1.25rem', 
        border: `2px solid ${checked ? 'var(--color-primary)' : 'var(--border-color)'}`, 
        borderRadius: 'var(--radius-lg)', 
        cursor: 'pointer', 
        backgroundColor: checked ? 'var(--bg-input)' : 'var(--bg-body)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        boxShadow: checked ? '0 4px 12px rgba(180, 132, 108, 0.15)' : 'none'
      }}
    >
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
        backgroundColor: checked ? 'var(--color-primary)' : 'var(--bg-input)',
        color: checked ? 'white' : 'var(--text-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.3s'
      }}>
        <Icon size={24} />
      </div>
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', color: checked ? 'var(--color-primary)' : 'var(--text-main)' }}>{title}</h4>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{description}</p>
      </div>
      <div style={{
        width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${checked ? 'var(--color-primary)' : 'var(--text-muted)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: checked ? 'var(--color-primary)' : 'transparent',
        transition: 'all 0.2s'
      }}>
        {checked && <CheckCircle2 size={14} color="white" />}
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div className="moon-card" style={{
        maxWidth: step === 2 ? '800px' : '560px', width: '100%',
        display: 'flex', flexDirection: 'column', gap: '1.5rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: 'none',
        padding: window.innerWidth < 768 ? '1.5rem' : '2.5rem',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto',
        transition: 'max-width 0.4s ease'
      }}>
        {/* Detalhe Superior de Cores */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '6px',
          background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))'
        }} />
        
        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              height: '4px', flex: 1, borderRadius: '2px',
              backgroundColor: s <= step ? 'var(--color-primary)' : 'var(--bg-input)',
              transition: 'all 0.4s'
            }} />
          ))}
        </div>

        {/* STEP 1: Welcome */}
        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <div style={{ width: '72px', height: '72px', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 8px 16px rgba(180,132,108,0.3)' }}>
              <Sparkles size={36} />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
              Boas-vindas, {user.name.split(' ')[0]}!
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Estamos felizes em ter você na MoonFinance. Antes de começarmos, vamos configurar sua conta para que ela se adapte ao seu estilo de vida e necessidades financeiras.
            </p>
            <div style={{ backgroundColor: 'var(--bg-body)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: '50%' }}>
                <Wallet size={28} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.25rem', color: 'var(--text-main)' }}>O coração do sistema</strong>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  Sua jornada começa no fluxo de <strong>Lançamentos</strong>. Todos os módulos adicionais que você ativar conversarão automaticamente com o seu caixa principal.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Modules Selection */}
        {step === 2 && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Personalize seu Dashboard</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Selecione os módulos que você deseja habilitar. Não se preocupe, você pode alterar isso depois nas configurações.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              <ToggleCard 
                icon={CreditCard} 
                title="Cartões de Crédito" 
                description="Controle de faturas, limites e compras parceladas." 
                checked={cartoesEnabled} 
                onChange={setCartoesEnabled} 
              />
              <ToggleCard 
                icon={Target} 
                title="Planejamento de Metas" 
                description="Defina objetivos de curto a longo prazo." 
                checked={planejamentoEnabled} 
                onChange={setPlanejamentoEnabled} 
              />
              <ToggleCard 
                icon={CarFront} 
                title="Garagem e Veículos" 
                description="Abastecimentos, consumo (Km/L) e manutenções." 
                checked={carrosEnabled} 
                onChange={setCarrosEnabled} 
              />
              <ToggleCard 
                icon={HeartHandshake} 
                title="Autocuidado & Estética" 
                description="Planeje rituais de beleza, academia e bem-estar." 
                checked={esteticaEnabled} 
                onChange={setEsteticaEnabled} 
              />
              <ToggleCard 
                icon={Dog} 
                title="Mundo Pet" 
                description="Vacinas, banhos, ração e fundo de emergência." 
                checked={petsEnabled} 
                onChange={setPetsEnabled} 
              />
              <ToggleCard 
                icon={AlertTriangle} 
                title="Inadimplências" 
                description="Rastreie valores que você deve ou tem a receber." 
                checked={inadimplenciasEnabled} 
                onChange={setInadimplenciasEnabled} 
              />
            </div>
          </div>
        )}

        {/* STEP 3: Final Setup & LGPD */}
        {step === 3 && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <div style={{ width: '72px', height: '72px', backgroundColor: 'var(--status-success)', color: 'white', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 8px 16px rgba(46, 125, 50, 0.2)' }}>
              <CheckCircle2 size={36} />
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Tudo Pronto!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Para finalizar e acessar seu painel, precisamos apenas confirmar algumas informações finais.
            </p>
            
            {esteticaEnabled && (
              <div style={{ backgroundColor: 'var(--bg-body)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Como você se identifica?</label>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Como você ativou o módulo de <strong>Autocuidado</strong>, isso nos ajudará a sugerir serviços e ícones mais adequados para o seu perfil.</p>
                <select 
                  value={genero} 
                  onChange={e => setGenero(e.target.value as any)} 
                  style={{ width: '100%', padding: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', fontSize: '1rem' }}
                >
                  <option value="feminino">Feminino</option>
                  <option value="masculino">Masculino</option>
                  <option value="transgenero">Transgênero</option>
                  <option value="nao-binario">Não-binário / Outro</option>
                  <option value="outro">Prefiro não dizer</option>
                </select>
              </div>
            )}

              <div style={{ backgroundColor: 'rgba(46, 125, 50, 0.1)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(46, 125, 50, 0.3)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <CheckCircle2 size={24} style={{ color: 'var(--status-success)' }} />
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--status-success)', fontSize: '1rem' }}>Tudo pronto para começar!</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                    Você pode ativar ou desativar esses módulos a qualquer momento na tela de <strong>Configurações da Conta</strong>. Nenhum dado é perdido ao desativar um módulo.
                  </p>
                </div>
              </div>

          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <button 
            className="btn-outline" 
            onClick={handlePrev}
            style={{ visibility: step === 1 ? 'hidden' : 'visible', padding: '0.75rem 1.5rem', fontSize: '1rem' }}
          >
            <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} /> Voltar
          </button>

          {step < 3 ? (
            <button className="btn-primary" onClick={handleNext} style={{ padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 600 }}>
              Continuar <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
            </button>
          ) : (
            <button 
              className="btn-primary" 
              onClick={handleFinish} 
              style={{ 
                padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 600,
                backgroundColor: 'var(--status-success)', 
                borderColor: 'var(--status-success)',
                cursor: 'pointer',
                transform: 'scale(1)',
                transition: 'all 0.2s'
              }}
            >
              Acessar Meu Painel <CheckCircle2 size={18} style={{ marginLeft: '0.5rem' }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
