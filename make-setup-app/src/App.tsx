import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { DashboardView } from './components/DashboardView';
import { LancamentosView } from './components/LancamentosView';
import { DespesasView } from './components/DespesasView';
import { PlanejamentoView } from './components/PlanejamentoView';
import { EsteticaView } from './components/EsteticaView';
import { PetsView } from './components/PetsView';
import { CarrosView } from './components/CarrosView';
import { CartaoCreditoView } from './components/CartaoCreditoView';
import { InadimplenciasView } from './components/InadimplenciasView';

import { UserSettingsView } from './components/UserSettingsView';

import { AuthView } from './components/AuthView';
import { OnboardingWizard } from './components/OnboardingWizard';
import { fetchApiData } from './services/api';
import { MoonLoader } from './components/ui/MoonLoader';
import { CardSkeleton, TableSkeleton } from './components/ui/skeleton';

import type { 
  NavigationTab, 
  UserProfile, 
  UserRole, 

  Lancamento, 
  DespesaMensal, 
  MetaPlanejamento,
  RitualEstetica, 
  Pet, 
  ReservaPet, 
  ItemAgendaPet, 
  ItemCompraPet, 
  CarrinhoSalvoPet,
  HistoricoCompraPet, 
  EmergenciaPet,
  Veiculo, 
  Abastecimento, 
  ManutencaoVeiculo, 
  CartaoCredito, 
  FaturaItem, 
  Inadimplencia, 
  AuditLog, 
  PrivacySettings 
} from './types';


import { showToastInfo, showToastSuccess, showToastError } from './utils/sweetAlert';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(() => {
    const saved = localStorage.getItem('moon_privacy');
    return saved ? JSON.parse(saved) : {
      petsModuleEnabled: true,
      globalMaintenanceMode: false,
      esteticaEnabled: true,
      carrosEnabled: true,
      cartoesEnabled: true,
      inadimplenciasEnabled: true,
      planejamentoEnabled: true,
      pseudonymizeExport: false
    };
  });

  useEffect(() => {
    // Auth Lifecycle check
    const savedUser = localStorage.getItem('moon_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      if (parsedUser.role !== 'admin_master' && (!parsedUser.id || !parsedUser.tenantId)) {
        // Sessão corrompida / antiga sem os IDs da API. Forçar limpeza.
        localStorage.removeItem('moon_user');
        setUser(null);
      } else {
        setUser(parsedUser);
      }
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('moon_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('moon_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('moon_privacy', JSON.stringify(privacySettings));
  }, [privacySettings]);

  // App Data State
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [despesas, setDespesas] = useState<DespesaMensal[]>([]);
  const [metasPlanejamento, setMetasPlanejamento] = useState<MetaPlanejamento[]>([]);
  const [estetica, setEstetica] = useState<RitualEstetica[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [reservasPets, setReservasPets] = useState<ReservaPet[]>([]);
  const [agendaPets, setAgendaPets] = useState<ItemAgendaPet[]>([]);
  const [comprasPets, setComprasPets] = useState<ItemCompraPet[]>([]);
  const [carrinhosSalvosPets, setCarrinhosSalvosPets] = useState<CarrinhoSalvoPet[]>([]);
  const [historicoComprasPets, setHistoricoComprasPets] = useState<HistoricoCompraPet[]>([]);
  const [emergenciasPets, setEmergenciasPets] = useState<EmergenciaPet[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);
  const [manutencoes, setManutencoes] = useState<ManutencaoVeiculo[]>([]);
  const [cartoes, setCartoes] = useState<CartaoCredito[]>([]);
  const [faturas, setFaturas] = useState<FaturaItem[]>([]);
  const [inadimplencias, setInadimplencias] = useState<Inadimplencia[]>([]);
  const [, setAuditLogs] = useState<AuditLog[]>([]);

  const handleLogout = () => {
    localStorage.removeItem('moon_user');
    localStorage.removeItem('moon_privacy');
    sessionStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
    setCurrentTab('dashboard');
    showToastSuccess('Você saiu da sua conta com segurança. Até breve! 👋');
  };

  // Meta Planejamento Handlers
  const handleAddMetaPlanejamento = (nova: MetaPlanejamento) => {
    setMetasPlanejamento(prev => [nova, ...prev]);
  };

  const handleEditMetaPlanejamento = (editada: MetaPlanejamento) => {
    setMetasPlanejamento(prev => prev.map(m => m.id === editada.id ? editada : m));
  };

  const handleDeleteMetaPlanejamento = (id: string) => {
    setMetasPlanejamento(prev => prev.filter(m => m.id !== id));
  };

  const handleAportarMetaPlanejamento = (id: string, valorAporte: number) => {
    setMetasPlanejamento(prev => prev.map(m => {
      if (m.id === id) {
        return {
          ...m,
          valorAtual: m.valorAtual + valorAporte
        };
      }
      return m;
    }));
  };

  // Fetch real MySQL data from HostGator backend API on startup
  useEffect(() => {
    async function loadMySQLData() {
      try {
        const resLancamentos = await fetchApiData<{ status: string; data: Lancamento[] }>('lancamentos.php');
        if (resLancamentos?.status === 'success' && Array.isArray(resLancamentos.data)) {
          setLancamentos(resLancamentos.data);
        }

        const resDespesas = await fetchApiData<{ status: string; data: DespesaMensal[] }>('despesas.php');
        if (resDespesas?.status === 'success' && Array.isArray(resDespesas.data)) {
          setDespesas(resDespesas.data);
        }

        const resPets = await fetchApiData<{ status: string; pets: any[], reservas: any[], agenda: any[], historico_compras: any[] }>('pets.php');
        if (resPets?.status === 'success') {
          if (Array.isArray(resPets.pets)) {
            setPets(resPets.pets.map(p => ({
              id: p.id,
                            especie: p.especie,
              raca: p.raca,
              idade: p.idade,
              dataNascimento: p.data_nascimento || p.dataNascimento,
              fotoUrl: p.foto_url || p.fotoUrl,
              gastoMensalEstimado: parseFloat(p.gasto_mensal_estimado || p.gastoMensalEstimado || 0),
              ativo: p.ativo == 1
            })));
          }
          if (Array.isArray(resPets.reservas)) setReservasPets(resPets.reservas);
          if (Array.isArray(resPets.agenda)) setAgendaPets(resPets.agenda);
          if (Array.isArray(resPets.historico_compras)) setHistoricoComprasPets(resPets.historico_compras);
        }

        const resVeiculos = await fetchApiData<{ status: string; veiculos: Veiculo[], abastecimentos: Abastecimento[], manutencoes: ManutencaoVeiculo[] }>('veiculos.php');
        if (resVeiculos?.status === 'success') {
          if (Array.isArray(resVeiculos.veiculos)) setVeiculos(resVeiculos.veiculos);
          if (Array.isArray(resVeiculos.abastecimentos)) setAbastecimentos(resVeiculos.abastecimentos);
          if (Array.isArray(resVeiculos.manutencoes)) setManutencoes(resVeiculos.manutencoes);
        }

        const resCartoes = await fetchApiData<{ status: string; cartoes: CartaoCredito[], faturas: FaturaItem[] }>('cartoes.php');
        if (resCartoes?.status === 'success') {
          if (Array.isArray(resCartoes.cartoes)) setCartoes(resCartoes.cartoes);
          if (Array.isArray(resCartoes.faturas)) setFaturas(resCartoes.faturas);
        }

        const resPlanejamento = await fetchApiData<{ status: string; data: MetaPlanejamento[] }>('planejamento.php');
        if (resPlanejamento?.status === 'success' && Array.isArray(resPlanejamento.data)) {
          setMetasPlanejamento(resPlanejamento.data);
        }

        const resEstetica = await fetchApiData<{ status: string; data: RitualEstetica[] }>('estetica.php');
        if (resEstetica?.status === 'success' && Array.isArray(resEstetica.data)) {
          setEstetica(resEstetica.data);
        }

        const resInad = await fetchApiData<{ status: string; data: Inadimplencia[] }>('inadimplencias.php');
        if (resInad?.status === 'success' && Array.isArray(resInad.data)) {
          setInadimplencias(resInad.data);
        }
      } catch (err) {
        console.warn('Erro ao carregar dados iniciais (MySQL):', err);
      } finally {
        setIsDataLoading(false);
      }
    }

    loadMySQLData();
  }, []);

  // Sync Theme Preference with User Account Settings
  useEffect(() => {
    const pref = user?.themePreference || 'light';
    let enableDark = false;

    if (pref === 'dark') {
      enableDark = true;
    } else if (pref === 'light') {
      enableDark = false;
    } else if (pref === 'system') {
      enableDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    setIsDarkMode(enableDark);
    if (enableDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user?.themePreference, isDarkMode]);

  // --- AUTO-LOGOUT INATIVIDADE (1h) ---
  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const handleLogout = () => {
      localStorage.removeItem('moon_user');
      localStorage.removeItem('moon_privacy');
      sessionStorage.clear();
      setUser(null);
      setIsAuthenticated(false);
      setCurrentTab('dashboard');
      showToastInfo('Sua conta foi deslogada por inatividade por questões de segurança.');
    };

    const resetTimer = () => {
      clearTimeout(timeoutId);
      // 1 hora = 3600000 milissegundos
      timeoutId = setTimeout(handleLogout, 3600000);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer));

    resetTimer(); // Inicia na montagem

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [isAuthenticated]);

  // Central Granular Audit Logger Function
  const addAuditLog = (acao: string, detalhes: string) => {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`;
    
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            usuario: user!.name,
      perfil: user!.role === 'admin_master' ? 'Admin Master' : user!.role === 'tenant_admin' ? 'Tenant Admin' : user!.role === 'member' ? 'Member' : 'Viewer',
      acao,
      detalhes,
      ip: '189.121.44.10'
    };

    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleUpdateUserProfile = (updatedUser: Partial<UserProfile>) => {
    setUser(prev => {
      if (!prev) return null;
      const nextUser = { ...prev, ...updatedUser };
      addAuditLog(
        'Perfil do Usuário Atualizado',
        `Alterações salvas: Nome: ${nextUser.name} | E-mail: ${nextUser.email} | Tema Preferido: ${nextUser.themePreference?.toUpperCase() || 'LIGHT'}`
      );
      return nextUser;
    });
  };

  const handleRoleChange = (newRole: UserRole) => {
    setUser(prev => prev ? ({ ...prev, role: newRole }) : null);

    if (newRole === 'admin_master') {
      showToastInfo('👑 Perfil Admin Master ativado. Você permanece na Visão Geral das suas finanças.');
    } else if (newRole === 'viewer') {
      showToastInfo('👁️ Modo Viewer (Somente Leitura) Ativado!');
    } else if (newRole === 'member') {
      showToastInfo('👤 Modo Member (Operacional) Ativado!');
    } else {
      showToastSuccess('🛡️ Modo Tenant Admin (Dono da Conta) Ativado!');
    }

    addAuditLog(
      'Alternância de Nível de Acesso (RBAC)',
      `Novo nível ativo: ${newRole.toUpperCase()}. Permissões e escopos recalculados.`
    );
  };

  const handleToggleTheme = () => {
    setIsDarkMode(prev => {
      const nextTheme = !prev;
      setUser(u => u ? ({ ...u, themePreference: nextTheme ? 'dark' : 'light' }) : null);
      return nextTheme;
    });
  };

  const handleTogglePetsModule = () => {
    setPrivacySettings(prev => {
      const nextVal = !prev.petsModuleEnabled;
      addAuditLog(
        'Módulo de Pets Alternado',
        `Módulo Pets ${nextVal ? 'ATIVADO' : 'DESATIVADO'} nas configurações do inquilino.`
      );
      return { ...prev, petsModuleEnabled: nextVal };
    });
  };

  const handleCompleteOnboarding = async (updatedUser: Partial<UserProfile>, updatedPrivacy: Partial<PrivacySettings>) => {
    try {
      await fetchApiData('perfil.php?action=onboarding', {
        method: 'PUT',
        body: JSON.stringify({
          genero: updatedUser.genero,
          ...updatedPrivacy
        })
      });
      setUser(prev => prev ? ({ ...prev, ...updatedUser }) : null);
      setPrivacySettings(prev => ({ ...prev, ...updatedPrivacy }));
      addAuditLog('Onboarding Concluído', 'Usuário completou a configuração inicial (módulos e perfil).');
    } catch (err) {
      console.error("Erro ao salvar onboarding", err);
      alert("Ocorreu um erro ao salvar suas configurações. Tente novamente.");
    }
  };

  // --- CRUD HANDLERS WITH GRANULAR AUDIT LOGGING ---
  const handleAddLancamento = async (novo: Lancamento) => {
    const item = { ...novo, tenantId: user!.usuarioId: user!.id };
    setLancamentos(prev => [item, ...prev]);
    addAuditLog(
      'Lançamento Financeiro Criado',
      `Descrição: '${novo.descricao}' | Categoria: ${novo.categoria} | Tipo: ${novo.tipo.toUpperCase()} | Valor: R$ ${novo.valor.toFixed(2)} | Dia: ${novo.dia}`
    );

    try {
      await fetchApiData('lancamentos.php', {
        method: 'POST',
        body: JSON.stringify(item)
      });
    } catch (err) {
      console.warn('Persistência no MySQL (lancamentos.php):', err);
    }
  };

  const handleEditLancamento = (editado: Lancamento) => {
    const antigo = lancamentos.find(l => l.id === editado.id);
    setLancamentos(prev => prev.map(l => l.id === editado.id ? editado : l));
    addAuditLog(
      'Lançamento Financeiro Editado',
      `Item: '${editado.descricao}' | Valor anterior: R$ ${antigo?.valor.toFixed(2) || '0.00'} -> Novo valor: R$ ${editado.valor.toFixed(2)} | Categoria: ${editado.categoria}`
    );
  };

  const handleEditLancamentoProgressivo = (idAntigo: string, novoLancamento: Lancamento, mesReferenciaYYYYMM: string) => {
    const antigo = lancamentos.find(l => l.id === idAntigo);
    if (!antigo) return;

    // Calcular o mês anterior para fechar a recorrência antiga
    const date = new Date(`${mesReferenciaYYYYMM}-01T12:00:00Z`);
    date.setMonth(date.getMonth() - 1);
    const mesFimAntigo = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    // Fecha a recorrência do antigo
    const antigoFechado: Lancamento = {
      ...antigo,
      dataFimRecorrencia: mesFimAntigo
    };

    // Abre a nova recorrência
    const novoInicio: Lancamento = {
      ...novoLancamento,
      id: `lan_${Date.now()}_prog`,
      dataInicioRecorrencia: mesReferenciaYYYYMM
    };

    setLancamentos(prev => [
      ...prev.map(l => l.id === idAntigo ? antigoFechado : l),
      novoInicio
    ]);

    addAuditLog(
      'Edição Progressiva de Lançamento',
      `Item '${antigoFechado.descricao}' finalizado em ${mesFimAntigo}. Novo valor (R$ ${novoInicio.valor.toFixed(2)}) entra em vigor a partir de ${mesReferenciaYYYYMM}.`
    );
  };

  const handleDeleteLancamento = (id: string) => {
    const alvo = lancamentos.find(l => l.id === id);
    setLancamentos(prev => prev.filter(l => l.id !== id));
    if (alvo) {
      addAuditLog(
        'Lançamento Financeiro Excluído',
        `Item removido: '${alvo.descricao}' | Valor: R$ ${alvo.valor.toFixed(2)} | Categoria: ${alvo.categoria}`
      );
    }
  };

  const handleAddDespesa = async (nova: DespesaMensal) => {
    const item = { ...nova, tenantId: user!.tenantId };
    setDespesas(prev => [...prev, item]);
    addAuditLog(
      'Despesa Programada Criada',
      `Descrição: '${nova.descricao}' | Vencimento: Dia ${nova.diaVencimento} | Valor Previsto: R$ ${nova.valorPrevisto.toFixed(2)} | Mês: ${nova.mes}`
    );

    try {
      await fetchApiData('despesas.php', {
        method: 'POST',
        body: JSON.stringify(item)
      });
    } catch (err) {
      console.warn('Persistência no MySQL (despesas.php):', err);
    }
  };

  const handleEditDespesa = (editada: DespesaMensal) => {
    const antiga = despesas.find(d => d.id === editada.id);
    setDespesas(prev => prev.map(d => d.id === editada.id ? editada : d));
    addAuditLog(
      'Despesa Programada Editada',
      `Item: '${editada.descricao}' | Valor Previsto anterior: R$ ${antiga?.valorPrevisto.toFixed(2) || '0.00'} -> Novo: R$ ${editada.valorPrevisto.toFixed(2)}`
    );
  };

  const handleDeleteDespesa = (id: string) => {
    const alvo = despesas.find(d => d.id === id);
    setDespesas(prev => prev.filter(d => d.id !== id));
    if (alvo) {
      addAuditLog(
        'Despesa Programada Excluída',
        `Item removido: '${alvo.descricao}' | Valor Previsto: R$ ${alvo.valorPrevisto.toFixed(2)} | Mês: ${alvo.mes}`
      );
    }
  };

  const handleUpdateDespesaStatus = (
    id: string, 
    novoStatus: 'pago' | 'previsto', 
    valorPago?: number,
    dataPagamento?: string,
    metodoPagamento?: string
  ) => {
    const alvo = despesas.find(d => d.id === id);
    setDespesas(prev => prev.map(d => {
      if (d.id === id) {
        return {
          ...d,
          status: novoStatus,
          valorPago: novoStatus === 'pago' ? (valorPago || d.valorPrevisto) : undefined,
          dataPagamento: novoStatus === 'pago' ? dataPagamento : undefined,
          metodoPagamento: novoStatus === 'pago' ? metodoPagamento : undefined
        };
      }
      return d;
    }));

    if (alvo) {
      const valFinal = valorPago || alvo.valorPrevisto;
      addAuditLog(
        'Status de Despesa Alterado',
        `Despesa '${alvo.descricao}' alterada para [${novoStatus.toUpperCase()}] | Valor Pago: R$ ${valFinal.toFixed(2)} (Previsto: R$ ${alvo.valorPrevisto.toFixed(2)}) | Método: ${metodoPagamento || 'N/A'}`
      );
    }
  };

  const handleAddEstetica = (novo: RitualEstetica) => {
    setEstetica(prev => [...prev, { ...novo, tenantId: user!.tenantId }]);
    addAuditLog(
      'Ritual de Estética Cadastrado',
      `Serviço: '${novo.nome}' | Público: ${novo.generoAlvo.toUpperCase()} | Valor/Sessão: R$ ${novo.valor.toFixed(2)} | Frequência: ${novo.frequencia}`
    );
  };

  const handleEditEstetica = (editado: RitualEstetica) => {
    setEstetica(prev => prev.map(e => e.id === editado.id ? editado : e));
    addAuditLog(
      'Ritual de Estética Editado',
      `Serviço: '${editado.nome}' | Valor: R$ ${editado.valor.toFixed(2)} | Próxima Sessão: ${editado.proximaData}`
    );
  };

  const handleDeleteEstetica = (id: string) => {
    const alvo = estetica.find(e => e.id === id);
    setEstetica(prev => prev.filter(e => e.id !== id));
    if (alvo) {
      addAuditLog(
        'Ritual de Estética Excluído',
        `Ritual removido: '${alvo.nome}' | Valor da sessão: R$ ${alvo.valor.toFixed(2)}`
      );
    }
  };

  const handleLogSessaoEstetica = (id: string, dataSessao: string) => {
    const alvo = estetica.find(r => r.id === id);
    if (!alvo) return;

    let novaData = alvo.proximaData;
    try {
      const dataObj = new Date(`${alvo.proximaData}T12:00:00Z`);
      if (alvo.frequencia === 'Semanal') dataObj.setDate(dataObj.getDate() + 7);
      else if (alvo.frequencia === 'Bisemanal') dataObj.setDate(dataObj.getDate() + 14);
      else dataObj.setMonth(dataObj.getMonth() + 1);
      novaData = dataObj.toISOString().split('T')[0];
    } catch(e) {}

    const novaSessao = { id: `sessao_${Date.now()}`, data: dataSessao, valor: alvo.valor };

    setEstetica(prev => prev.map(r => {
      if (r.id === id) {
        return { 
          ...r, 
          historicoGasto: r.historicoGasto + r.valor,
          proximaData: novaData,
          sessoesRealizadas: [...(r.sessoesRealizadas || []), novaSessao]
        };
      }
      return r;
    }));

    addAuditLog(
      'Sessão de Estética Registrada',
      `Sessão de '${alvo.nome}' em ${dataSessao} | Valor: R$ ${alvo.valor.toFixed(2)} | Próxima: ${novaData}`
    );
  };

  const handleAddPet = async (novo: Pet) => {
    const item = { ...novo, tenantId: user!.ativo: true };
    try {
      const res = await fetchApiData<{ status: string; message?: string; id?: string }>('pets.php', {
        method: 'POST',
        body: JSON.stringify(item)
      });
      if (res?.status === 'success') {
        if (res.id) item.id = res.id;
        setPets(prev => [...prev, item]);
        addAuditLog(
          'Novo Pet Cadastrado',
          `Pet: ${novo.nome} (${novo.especie.toUpperCase()} - ${novo.raca}) | Idade: ${novo.idade} | Gasto Est.: R$ ${novo.gastoMensalEstimado.toFixed(2)}`
        );
      } else {
        showToastError(res?.message || 'Erro ao cadastrar pet');
      }
    } catch (err) {
      showToastError('Erro de conexão ao salvar pet');
    }
  };

  const handleEditPet = async (editado: Pet) => {
    try {
      const res = await fetchApiData<{ status: string; message?: string }>('pets.php', {
        method: 'PUT',
        body: JSON.stringify(editado)
      });
      if (res?.status === 'success') {
        setPets(prev => prev.map(p => p.id === editado.id ? editado : p));
        addAuditLog(
          'Pet Atualizado',
          `Pet: ${editado.nome} | Ativo: ${editado.ativo !== false ? 'Sim' : 'Não'}`
        );
      } else {
        showToastError(res?.message || 'Erro ao atualizar pet');
      }
    } catch (err) {
      showToastError('Erro de conexão ao atualizar pet');
    }
  };

  const handleDeletePet = async (id: string) => {
    try {
      const res = await fetchApiData<{ status: string; message?: string }>(`pets.php?id=${id}`, {
        method: 'DELETE'
      });
      if (res?.status === 'success') {
        const alvo = pets.find(p => p.id === id);
        setPets(prev => prev.filter(p => p.id !== id));
        if (alvo) {
          addAuditLog(
            'Pet Excluído',
            `Removido pet: ${alvo.nome} (${alvo.raca})`
          );
        }
      } else {
        showToastError(res?.message || 'Erro ao excluir pet');
      }
    } catch (err) {
      showToastError('Erro de conexão ao excluir pet');
    }
  };

  const handleAddCompraPet = async (nova: ItemCompraPet) => {
    const item = { ...nova, tenantId: user!.tenantId };
    try {
      const res = await fetchApiData<{ status: string; id?: string; message?: string }>('pets.php?action=add_compra', {
        method: 'POST',
        body: JSON.stringify(item)
      });
      if (res?.status === 'success') {
        if (res.id) item.id = res.id;
        setComprasPets(prev => [...prev, item]);
        addAuditLog(
          'Produto de Pet Adicionado à Lista',
          `Produto: '${nova.produto}' para ${nova.petNome} | Qtd: ${nova.quantidade} | Valor c/ Desconto: R$ ${nova.valorComDesconto.toFixed(2)}`
        );
      } else {
        showToastError(res?.message || 'Erro ao adicionar produto');
      }
    } catch (err) {
      showToastError('Erro de conexão ao adicionar produto');
    }
  };

  const handleToggleCompraPetStatus = async (id: string) => {
    const alvo = comprasPets.find(c => c.id === id);
    if (!alvo) return;
    try {
      const res = await fetchApiData<{ status: string; message?: string }>(`pets.php?action=toggle_compra&id=${id}`, { method: 'PUT', body: JSON.stringify({ comprado: !alvo.comprado }) });
      if (res?.status === 'success') {
        setComprasPets(prev => prev.map(c => c.id === id ? { ...c, comprado: !c.comprado } : c));
      } else {
        showToastError(res?.message || 'Erro ao atualizar status');
      }
    } catch (err) {
      showToastError('Erro de conexão');
    }
  };

  const handleRemoveCompraPet = async (id: string) => {
    try {
      const res = await fetchApiData<{ status: string; message?: string }>(`pets.php?action=remove_compra&id=${id}`, { method: 'DELETE' });
      if (res?.status === 'success') {
        const alvo = comprasPets.find(c => c.id === id);
        setComprasPets(prev => prev.filter(c => c.id !== id));
        if (alvo) {
          addAuditLog('Produto de Pet Removido da Lista', `Removido: '${alvo.produto}' (${alvo.petNome})`);
        }
      } else {
        showToastError(res?.message || 'Erro ao remover produto');
      }
    } catch (err) {
      showToastError('Erro de conexão');
    }
  };

  const handleSaveCarrinhoTemplate = async (novo: CarrinhoSalvoPet) => {
    const item = { ...novo, tenantId: user!.tenantId };
    try {
      const res = await fetchApiData<{ status: string; id?: string; message?: string }>('pets.php?action=save_carrinho', {
        method: 'POST',
        body: JSON.stringify(item)
      });
      if (res?.status === 'success') {
        if (res.id) item.id = res.id;
        setCarrinhosSalvosPets(prev => {
          const idx = prev.findIndex(c => c.id === item.id);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = item;
            return next;
          }
          return [...prev, item];
        });
        addAuditLog('Template de Carrinho Pet Salvo', `Lista '${item.nome}' (${item.frequencia}) salva com ${item.itens.length} itens.`);
      } else {
        showToastError(res?.message || 'Erro ao salvar carrinho');
      }
    } catch (err) {
      showToastError('Erro de conexão');
    }
  };

  const handleDeleteCarrinhoTemplate = async (id: string) => {
    try {
      const res = await fetchApiData<{ status: string; message?: string }>(`pets.php?action=delete_carrinho&id=${id}`, { method: 'DELETE' });
      if (res?.status === 'success') {
        const alvo = carrinhosSalvosPets.find(c => c.id === id);
        setCarrinhosSalvosPets(prev => prev.filter(c => c.id !== id));
        if (alvo) {
          addAuditLog('Template de Carrinho Pet Excluído', `Lista removida: '${alvo.nome}'`);
        }
      } else {
        showToastError(res?.message || 'Erro ao excluir carrinho');
      }
    } catch (err) {
      showToastError('Erro de conexão');
    }
  };

  const handleAddAgendaPet = async (novo: ItemAgendaPet) => {
    const item = { ...novo, tenantId: user!.tenantId };
    try {
      const res = await fetchApiData<{ status: string; id?: string; message?: string }>('pets.php?action=add_agenda', {
        method: 'POST',
        body: JSON.stringify(item)
      });
      if (res?.status === 'success') {
        const itemComId = { ...item, id: res.id || item.id };
        setAgendaPets(prev => [itemComId, ...prev]);
        
        const yearMonth = itemComId.data ? itemComId.data.substring(0, 7) : new Date().toISOString().substring(0, 7);
        const parts = (itemComId.data || '').split('-');
        const day = parseInt(parts[2]) || 15;
        const novaDespesaPrevista: DespesaMensal = {
          id: `desp_ag_${itemComId.id}`,           categoria: 'Pets', diaVencimento: day, valorPrevisto: itemComId.valor, status: 'previsto', mes: yearMonth
        };
        setDespesas(prev => [novaDespesaPrevista, ...prev]);
        addAuditLog('Compromisso / Vacina de Pet Agendado', `Agendado '${itemComId.titulo}' para ${itemComId.petNome} em ${itemComId.data} (Valor Est: R$ ${itemComId.valor.toFixed(2)})`);
      } else {
        showToastError(res?.message || 'Erro ao agendar compromisso');
      }
    } catch (err) {
      showToastError('Erro de conexão');
    }
  };

  const handleDeleteAgendaPet = async (id: string) => {
    try {
      const res = await fetchApiData<{ status: string; message?: string }>(`pets.php?action=delete_agenda&id=${id}`, { method: 'DELETE' });
      if (res?.status === 'success') {
        const alvo = agendaPets.find(a => a.id === id);
        setAgendaPets(prev => prev.filter(a => a.id !== id));
        setDespesas(prev => prev.filter(d => d.id !== `desp_ag_${id}`));
        if (alvo) {
          addAuditLog('Compromisso de Pet Cancelado', `Removido agendamento '${alvo.titulo}' de ${alvo.petNome}`);
        }
      } else {
        showToastError(res?.message || 'Erro ao cancelar compromisso');
      }
    } catch (err) {
      showToastError('Erro de conexão');
    }
  };

  const handleConcluirAgendaPet = async (item: ItemAgendaPet, valorPago: number, metodoPagamento: string) => {
    try {
      const res = await fetchApiData<{ status: string; message?: string }>('pets.php?action=concluir_agenda', {
        method: 'POST',
        body: JSON.stringify({ ...item, tenantId: user!.valorPago, metodoPagamento })
      });
      if (res?.status === 'success') {
        setAgendaPets(prev => prev.map(a => a.id === item.id ? { ...a, status: 'realizado', valor: valorPago } : a));

        const todayStr = new Date().toISOString().split('T')[0];
        const yearMonth = item.data ? item.data.substring(0, 7) : todayStr.substring(0, 7);
        const parts = (item.data || todayStr).split('-');
        const day = parseInt(parts[2]) || new Date().getDate();

        const novoLancamento: Lancamento = {
          id: `lan_${Date.now()}`,           categoria: 'Pets', tipo: 'despesa', valor: valorPago, dia: day, recorrente: false, status: 'realizado', metodoPagamento
        };
        setLancamentos(prev => [novoLancamento, ...prev]);

        setDespesas(prev => {
          const existingIdx = prev.findIndex(d => d.id === `desp_ag_${item.id}`);
          if (existingIdx !== -1) {
            const next = [...prev];
            next[existingIdx] = { ...next[existingIdx], valorPago, metodoPagamento, dataPagamento: todayStr, status: 'pago' };
            return next;
          } else {
            const novaDespesaPago: DespesaMensal = {
              id: `desp_ag_${item.id}`,               categoria: 'Pets', diaVencimento: day, valorPrevisto: valorPago, valorPago: valorPago, dataPagamento: todayStr, metodoPagamento, status: 'pago', mes: yearMonth
            };
            return [novaDespesaPago, ...prev];
          }
        });

        if (item.recorrencia && item.recorrencia.includes('Anual')) {
          const nextYear = (parseInt(parts[0]) || new Date().getFullYear()) + 1;
          const nextDateStr = `${nextYear}-${parts[1] || '01'}-${parts[2] || '01'}`;
          const proximoItem: ItemAgendaPet = { id: `ag_${Date.now()}_next`, petId: item.petId, petNome: item.petNome, tipo: item.tipo, titulo: item.titulo, data: nextDateStr, recorrencia: item.recorrencia, valor: item.valor, status: 'pendente' };
          handleAddAgendaPet(proximoItem);
        }

        addAuditLog('Cuidados Pet Concluído', `Registrada vacina/consulta '${item.titulo}' para ${item.petNome} (Valor R$ ${valorPago.toFixed(2)} - ${metodoPagamento})`);
      } else {
        showToastError(res?.message || 'Erro ao concluir agenda');
      }
    } catch (err) {
      showToastError('Erro de conexão');
    }
  };

  const handleAportarReservaPet = async (petId: string, valorAporte: number) => {
    try {
      const res = await fetchApiData<{ status: string; message?: string }>('pets.php?action=aportar_reserva', {
        method: 'POST',
        body: JSON.stringify({ petId, valorAporte })
      });
      if (res?.status === 'success') {
        setReservasPets(prev => {
          const idx = prev.findIndex(r => r.petId === petId);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = { ...next[idx], valorAtual: (next[idx].valorAtual || 0) + valorAporte };
            return next;
          } else {
            const petTarget = pets.find(p => p.id === petId);
            return [...prev, { id: `res_${Date.now()}`, petId, petNome: petTarget?.nome || 'Pet', objetivo: 'Fundo Emergencial Saúde', valorAtual: valorAporte, meta: 1000 }];
          }
        });
        const petTarget = pets.find(p => p.id === petId);
        addAuditLog('Aporte em Reserva Emergencial Pet', `Aporte de R$ ${valorAporte.toFixed(2)} depositado na Reserva de Saúde de ${petTarget?.nome || 'Pet'}.`);
      } else {
        showToastError(res?.message || 'Erro ao aportar');
      }
    } catch (err) {
      showToastError('Erro de conexão');
    }
  };

  const handleEditReservaMetaPet = async (petId: string, novaMeta: number) => {
    try {
      const res = await fetchApiData<{ status: string; message?: string }>('pets.php?action=edit_reserva_meta', {
        method: 'PUT',
        body: JSON.stringify({ petId, novaMeta })
      });
      if (res?.status === 'success') {
        setReservasPets(prev => {
          const idx = prev.findIndex(r => r.petId === petId);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = { ...next[idx], meta: novaMeta };
            return next;
          } else {
            const petTarget = pets.find(p => p.id === petId);
            return [...prev, { id: `res_${Date.now()}`, petId, petNome: petTarget?.nome || 'Pet', objetivo: 'Fundo Emergencial Saúde', valorAtual: 0, meta: novaMeta }];
          }
        });
      } else {
        showToastError(res?.message || 'Erro ao atualizar meta');
      }
    } catch (err) {
      showToastError('Erro de conexão');
    }
  };

  const handleFinalizarCompraMensalPet = async (historico: HistoricoCompraPet) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonth = todayStr.substring(0, 7);
    const historicoParaSalvar = { ...historico, tenantId: user!.tenantId };
    try {
      const res = await fetchApiData<{ status: string; message?: string }>('pets.php?action=finalizar_compra', {
        method: 'POST',
        body: JSON.stringify(historicoParaSalvar)
      });
      if (res?.status === 'success') {
        setHistoricoComprasPets(prev => [historicoParaSalvar, ...prev]);
        setComprasPets([]);
        
        const novoLancamento: Lancamento = {
          id: `lan_${Date.now()}`,           categoria: 'Pets', tipo: 'despesa', valor: historico.totalPago, dia: new Date().getDate(), recorrente: true, status: 'realizado'
        };
        setLancamentos(prev => [novoLancamento, ...prev]);

        const novaDespesaCompra: DespesaMensal = {
          id: `desp_compra_${Date.now()}`,           categoria: 'Pets', diaVencimento: new Date().getDate(), valorPrevisto: historico.totalPago, valorPago: historico.totalPago,
          dataPagamento: todayStr, metodoPagamento: historico.metodoPagamento, status: 'pago', mes: currentMonth
        };
        setDespesas(prev => [novaDespesaCompra, ...prev]);

        addAuditLog('Compra de Pets Finalizada com Sucesso', `Checkout efetuado | Lista: '${historico.nomeLista || 'Geral'}' | Total Pago: R$ ${historico.totalPago.toFixed(2)} | Método: ${historico.metodoPagamento} | Frete: R$ ${historico.valorFrete.toFixed(2)}`);
      } else {
        showToastError(res?.message || 'Erro ao registrar compra');
      }
    } catch (err) {
      showToastError('Erro de conexão ao registrar compra');
    }
  };

  const handleRegistrarEmergenciaPet = async (emergencia: EmergenciaPet) => {
    const emergenciaParaSalvar = { ...emergencia, tenantId: user!.tenantId };
    try {
      const res = await fetchApiData<{ status: string; message?: string }>('pets.php?action=registrar_emergencia', {
        method: 'POST',
        body: JSON.stringify(emergenciaParaSalvar)
      });
      if (res?.status === 'success') {
        setEmergenciasPets(prev => [emergenciaParaSalvar, ...prev]);
        
        if (emergencia.usouReserva && (emergencia.valorUsadoReserva || 0) > 0) {
          setReservasPets(prev => prev.map(r => {
            if (r.petId === emergencia.petId) {
              return { ...r, valorAtual: Math.max(0, r.valorAtual - (emergencia.valorUsadoReserva || 0)) };
            }
            return r;
          }));
        }

        const valorRestante = emergencia.valorTotal - (emergencia.usouReserva ? (emergencia.valorUsadoReserva || 0) : 0);
        
        if (valorRestante > 0) {
          const todayStr = new Date().toISOString().split('T')[0];
          const currentMonth = todayStr.substring(0, 7);
          
          const novoLancamento: Lancamento = {
            id: `lan_emerg_${Date.now()}`,             categoria: 'Pets', tipo: 'despesa', valor: valorRestante, dia: new Date().getDate(), recorrente: false, status: 'realizado', metodoPagamento: emergencia.metodoPagamentoRestante
          };
          setLancamentos(prev => [novoLancamento, ...prev]);

          const novaDespesa: DespesaMensal = {
            id: `desp_emerg_${Date.now()}`,             categoria: 'Pets', diaVencimento: new Date().getDate(), valorPrevisto: valorRestante, valorPago: valorRestante, dataPagamento: todayStr,
            metodoPagamento: emergencia.metodoPagamentoRestante, status: 'pago', mes: currentMonth
          };
          setDespesas(prev => [novaDespesa, ...prev]);
        }
        
        addAuditLog('Emergência Veterinária Registrada', `Emergência de ${emergencia.petNome} no valor de R$ ${emergencia.valorTotal.toFixed(2)}.`);
      } else {
        showToastError(res?.message || 'Erro ao registrar emergência');
      }
    } catch (err) {
      showToastError('Erro de conexão ao registrar emergência');
    }
  };

  const handleAddVeiculo = async (novo: Veiculo) => {
    const item = { ...novo, tenantId: user!.tenantId };
    try {
      const res = await fetchApiData<{ status: string; id?: string; message?: string }>('veiculos.php', {
        method: 'POST',
        body: JSON.stringify(item)
      });
      if (res?.status === 'success') {
        if (res.id) item.id = res.id;
        setVeiculos(prev => [...prev, item]);
        addAuditLog('Novo Veículo Cadastrado', `Veículo: ${novo.nome} (${novo.marcaModelo}) | Placa: ${novo.placa} | KM Inicial: ${novo.kmAtual}`);
      } else {
        showToastError(res?.message || 'Erro ao cadastrar veículo');
      }
    } catch (err) {
      showToastError('Erro de conexão');
    }
  };

  const handleDeleteVeiculo = async (id: string) => {
    try {
      const res = await fetchApiData<{ status: string; message?: string }>(`veiculos.php?id=${id}`, { method: 'DELETE' });
      if (res?.status === 'success') {
        const alvo = veiculos.find(v => v.id === id);
        setVeiculos(prev => prev.filter(v => v.id !== id));
        if (alvo) {
          addAuditLog('Veículo Excluído', `Veículo removido: ${alvo.nome} (${alvo.placa})`);
        }
      } else {
        showToastError(res?.message || 'Erro ao excluir veículo');
      }
    } catch (err) {
      showToastError('Erro de conexão');
    }
  };

  const handleEditVeiculo = async (editado: Veiculo) => {
    try {
      const res = await fetchApiData<{ status: string; message?: string }>('veiculos.php', {
        method: 'PUT',
        body: JSON.stringify(editado)
      });
      if (res?.status === 'success') {
        setVeiculos(prev => prev.map(v => v.id === editado.id ? editado : v));
        addAuditLog('Veículo Atualizado', `Veículo: ${editado.nome} | Placa: ${editado.placa} | KM: ${editado.kmAtual}`);
      } else {
        showToastError(res?.message || 'Erro ao atualizar veículo');
      }
    } catch (err) {
      showToastError('Erro de conexão');
    }
  };

  const handleAddAbastecimento = async (novo: Abastecimento) => {
    const item = { ...novo, tenantId: user!.tenantId };
    try {
      const res = await fetchApiData<{ status: string; id?: string; message?: string }>('veiculos.php?action=registrar_abastecimento', {
        method: 'POST',
        body: JSON.stringify(item)
      });
      if (res?.status === 'success') {
        if (res.id) item.id = res.id;
        setAbastecimentos(prev => [...prev, item]);
        setVeiculos(prev => prev.map(v => v.id === novo.veiculoId ? { ...v, kmAtual: Math.max(v.kmAtual, novo.kmAtual) } : v));
        addAuditLog('Abastecimento Registrado', `Veículo: ${novo.veiculoNome} | Posto: ${novo.posto} | Litros: ${novo.litros}L | Hodômetro: ${novo.kmAtual}km | Total: R$ ${novo.valorTotal.toFixed(2)}`);
      } else {
        showToastError(res?.message || 'Erro ao registrar abastecimento');
      }
    } catch (err) {
      showToastError('Erro de conexão');
    }
  };

  const handleDeleteAbastecimento = async (id: string) => {
    try {
      const res = await fetchApiData<{ status: string; message?: string }>(`veiculos.php?action=delete_abastecimento&id=${id}`, { method: 'DELETE' });
      if (res?.status === 'success') {
        const alvo = abastecimentos.find(a => a.id === id);
        setAbastecimentos(prev => prev.filter(a => a.id !== id));
        if (alvo) {
          addAuditLog('Abastecimento Excluído', `Removido abastecimento do ${alvo.veiculoNome} no ${alvo.posto} (R$ ${alvo.valorTotal.toFixed(2)})`);
        }
      } else {
        showToastError(res?.message || 'Erro ao excluir abastecimento');
      }
    } catch (err) {
      showToastError('Erro de conexão');
    }
  };

  const handleEditAbastecimento = async (editado: Abastecimento) => {
    try {
      const res = await fetchApiData<{ status: string; message?: string }>('veiculos.php?action=edit_abastecimento', {
        method: 'PUT',
        body: JSON.stringify(editado)
      });
      if (res?.status === 'success') {
        setAbastecimentos(prev => prev.map(a => a.id === editado.id ? editado : a));
        setVeiculos(prev => prev.map(v => v.id === editado.veiculoId ? { ...v, kmAtual: Math.max(v.kmAtual, editado.kmAtual) } : v));
        addAuditLog('Abastecimento Atualizado', `Veículo: ${editado.veiculoNome} | Posto: ${editado.posto} | Total: R$ ${editado.valorTotal.toFixed(2)}`);
      } else {
        showToastError(res?.message || 'Erro ao atualizar abastecimento');
      }
    } catch (err) {
      showToastError('Erro de conexão');
    }
  };

  const handleAddManutencao = async (nova: ManutencaoVeiculo) => {
    const item = { ...nova, tenantId: user!.tenantId };
    try {
      const res = await fetchApiData<{ status: string; id?: string; message?: string }>('veiculos.php?action=registrar_manutencao', {
        method: 'POST',
        body: JSON.stringify(item)
      });
      if (res?.status === 'success') {
        if (res.id) item.id = res.id;
        setManutencoes(prev => [...prev, item]);
        addAuditLog('Manutenção Emergencial/Parcelada Cadastrada', `Serviço: '${nova.descricao}' (${nova.veiculoNome}) | Oficina: ${nova.oficina} | Parcelas: ${nova.parcelasTotal}x de R$ ${nova.valorParcela.toFixed(2)} (Total: R$ ${nova.valorTotal.toFixed(2)})`);
      } else {
        showToastError(res?.message || 'Erro ao cadastrar manutenção');
      }
    } catch (err) {
      showToastError('Erro de conexão');
    }
  };

  const handleDeleteManutencao = async (id: string) => {
    try {
      const res = await fetchApiData<{ status: string; message?: string }>(`veiculos.php?action=delete_manutencao&id=${id}`, { method: 'DELETE' });
      if (res?.status === 'success') {
        const alvo = manutencoes.find(m => m.id === id);
        setManutencoes(prev => prev.filter(m => m.id !== id));
        if (alvo) {
          addAuditLog('Manutenção Excluída', `Removida manutenção '${alvo.descricao}' (${alvo.veiculoNome})`);
        }
      } else {
        showToastError(res?.message || 'Erro ao excluir manutenção');
      }
    } catch (err) {
      showToastError('Erro de conexão');
    }
  };

  const handleEditManutencao = async (editada: ManutencaoVeiculo) => {
    try {
      const res = await fetchApiData<{ status: string; message?: string }>('veiculos.php?action=edit_manutencao', {
        method: 'PUT',
        body: JSON.stringify(editada)
      });
      if (res?.status === 'success') {
        setManutencoes(prev => prev.map(m => m.id === editada.id ? editada : m));
        addAuditLog('Manutenção Atualizada', `Serviço: '${editada.descricao}' (${editada.veiculoNome}) | Valor Total: R$ ${editada.valorTotal.toFixed(2)}`);
      } else {
        showToastError(res?.message || 'Erro ao atualizar manutenção');
      }
    } catch (err) {
      showToastError('Erro de conexão');
    }
  };

  const handleAddCartao = async (novo: CartaoCredito) => {
    const item = { ...novo, tenantId: user!.tenantId };
    try {
      const res = await fetchApiData<{ status: string; id?: string; message?: string }>('cartoes.php', {
        method: 'POST',
        body: JSON.stringify(item)
      });
      if (res?.status === 'success') {
        if (res.id) item.id = res.id;
        setCartoes(prev => [...prev, item]);
        addAuditLog('Novo Cartão de Crédito Cadastrado', `Cartão: ${novo.nomeCartao} (${novo.banco}) | Limite Total: R$ ${novo.limiteTotal.toFixed(2)} | Vencimento: Dia ${novo.diaVencimento}`);
      } else {
        showToastError(res?.message || 'Erro ao cadastrar cartão');
      }
    } catch (err) {
      showToastError('Erro de conexão');
    }
  };

  const handleDeleteCartao = async (id: string) => {
    try {
      const res = await fetchApiData<{ status: string; message?: string }>(`cartoes.php?id=${id}`, { method: 'DELETE' });
      if (res?.status === 'success') {
        const alvo = cartoes.find(c => c.id === id);
        setCartoes(prev => prev.filter(c => c.id !== id));
        if (alvo) {
          addAuditLog('Cartão de Crédito Excluído', `Removido cartão: ${alvo.nomeCartao} (${alvo.banco})`);
        }
      } else {
        showToastError(res?.message || 'Erro ao excluir cartão');
      }
    } catch (err) {
      showToastError('Erro de conexão');
    }
  };

  const handleEditCartao = async (editado: CartaoCredito) => {
    try {
      const res = await fetchApiData<{ status: string; message?: string }>('cartoes.php', {
        method: 'PUT',
        body: JSON.stringify(editado)
      });
      if (res?.status === 'success') {
        setCartoes(prev => prev.map(c => c.id === editado.id ? editado : c));
        addAuditLog('Cartão de Crédito Atualizado', `Cartão: ${editado.nomeCartao} | Limite Total: R$ ${editado.limiteTotal.toFixed(2)}`);
      } else {
        showToastError(res?.message || 'Erro ao atualizar cartão');
      }
    } catch (err) {
      showToastError('Erro de conexão');
    }
  };

  const handleAddFaturaItem = async (novo: FaturaItem) => {
    const item = { ...novo, tenantId: user!.tenantId };
    try {
      const res = await fetchApiData<{ status: string; id?: string; message?: string }>('cartoes.php?action=registrar_compra', {
        method: 'POST',
        body: JSON.stringify(item)
      });
      if (res?.status === 'success') {
        if (res.id) item.id = res.id;
        setFaturas(prev => [...prev, item]);
        setCartoes(prev => prev.map(c => c.id === novo.cartaoId ? { ...c, faturaAtual: c.faturaAtual + novo.valor } : c));
        addAuditLog('Compra no Cartão de Crédito Lançada', `Estabelecimento: '${novo.descricao}' | Categoria: ${novo.categoria} | Valor: R$ ${novo.valor.toFixed(2)} | Parcela: ${novo.parcela || 'À vista'}`);
      } else {
        showToastError(res?.message || 'Erro ao registrar compra');
      }
    } catch (err) {
      showToastError('Erro de conexão');
    }
  };

  const handleDeleteFaturaItem = async (id: string) => {
    try {
      const res = await fetchApiData<{ status: string; message?: string }>(`cartoes.php?action=delete_compra&id=${id}`, { method: 'DELETE' });
      if (res?.status === 'success') {
        const target = faturas.find(f => f.id === id);
        if (target) {
          setCartoes(prev => prev.map(c => c.id === target.cartaoId ? { ...c, faturaAtual: Math.max(0, c.faturaAtual - target.valor) } : c));
          addAuditLog('Item da Fatura de Cartão Excluído', `Removido lançamento: '${target.descricao}' | Valor: R$ ${target.valor.toFixed(2)}`);
        }
        setFaturas(prev => prev.filter(f => f.id !== id));
      } else {
        showToastError(res?.message || 'Erro ao excluir compra');
      }
    } catch (err) {
      showToastError('Erro de conexão');
    }
  };

  const handleEditFaturaItem = async (editado: FaturaItem) => {
    try {
      const res = await fetchApiData<{ status: string; message?: string }>('cartoes.php?action=edit_compra', {
        method: 'PUT',
        body: JSON.stringify(editado)
      });
      if (res?.status === 'success') {
        const original = faturas.find(f => f.id === editado.id);
        if (original && original.cartaoId === editado.cartaoId) {
          const diferenca = editado.valor - original.valor;
          setCartoes(prev => prev.map(c => c.id === editado.cartaoId ? { ...c, faturaAtual: Math.max(0, c.faturaAtual + diferenca) } : c));
        } else if (original) {
          setCartoes(prev => prev.map(c => {
            if (c.id === original.cartaoId) return { ...c, faturaAtual: Math.max(0, c.faturaAtual - original.valor) };
            if (c.id === editado.cartaoId) return { ...c, faturaAtual: c.faturaAtual + editado.valor };
            return c;
          }));
        }
        setFaturas(prev => prev.map(f => f.id === editado.id ? editado : f));
        addAuditLog('Compra no Cartão Atualizada', `Lançamento: '${editado.descricao}' | Valor Atualizado: R$ ${editado.valor.toFixed(2)}`);
      } else {
        showToastError(res?.message || 'Erro ao atualizar compra');
      }
    } catch (err) {
      showToastError('Erro de conexão');
    }
  };
  const handlePagarFaturaCartao = async (cartaoId: string, valorFatura: number, valorPago: number, metodoPagamento: string) => {
    try {
      const res = await fetchApiData<{ status: string; message?: string }>('cartoes.php?action=pagar_fatura', {
        method: 'POST',
        body: JSON.stringify({
          cartao_id: cartaoId,
          valor_total_fatura: valorFatura,
          valor_pago: valorPago,
          metodo_pagamento: metodoPagamento,
          juros_mensal: 12.0
        })
      });

      if (res?.status === 'success') {
        const saldoDevedor = valorFatura - valorPago;
        const juros = saldoDevedor > 0 ? saldoDevedor * 0.12 : 0;
        const todayStr = new Date().toISOString().split('T')[0];
        const currentMonth = todayStr.substring(0, 7);

        // 1. Atualizar state de lançamentos
        const novoLancamento: Lancamento = {
          id: `lan_${Date.now()}`,           categoria: 'Cartão de Crédito', tipo: 'despesa', valor: valorPago, dia: new Date().getDate(),
          recorrente: false, status: 'realizado', metodoPagamento
        };
        setLancamentos(prev => [novoLancamento, ...prev]);

        // 2. Atualizar state de despesas mensais (atual e possível rollover)
        const novaDespesa: DespesaMensal = {
          id: `desp_${Date.now()}`,           categoria: 'Cartão de Crédito', diaVencimento: new Date().getDate(), valorPrevisto: valorFatura,
          valorPago: valorPago, dataPagamento: todayStr, metodoPagamento, status: 'pago', mes: currentMonth
        };
        setDespesas(prev => [novaDespesa, ...prev]);

        if (saldoDevedor > 0) {
          const nextMonthDate = new Date();
          nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
          const nextMonthStr = nextMonthDate.toISOString().substring(0, 7);
          
          const despesaRollover: DespesaMensal = {
            id: `desp_roll_${Date.now()}`,             categoria: 'Cartão de Crédito', diaVencimento: new Date().getDate(), valorPrevisto: saldoDevedor + juros,
            valorPago: 0, status: 'previsto', mes: nextMonthStr
          };
          setDespesas(prev => [despesaRollover, ...prev]);

          const faturaRollover: FaturaItem = {
            id: `fat_roll_${Date.now()}`, cartaoId, descricao: 'Rollover (Transbordo Fatura Anterior)',
            categoria: 'Juros', parcela: '1/1', valor: saldoDevedor + juros, data: todayStr
          };
          setFaturas(prev => [...prev, faturaRollover]);
        }

        // 3. Atualizar state do Cartão
        setCartoes(prev => prev.map(c => {
          if (c.id === cartaoId) {
            return {
              ...c,
              faturaAtual: Math.max(0, c.faturaAtual - valorPago + juros),
              limiteDisponivel: c.limiteTotal - Math.max(0, c.faturaAtual - valorPago + juros)
            };
          }
          return c;
        }));

        addAuditLog('Pagamento de Fatura de Cartão', `Cartão pago: R$ ${valorPago.toFixed(2)} | Rollover: R$ ${saldoDevedor.toFixed(2)}`);
        showToastSuccess('Fatura processada com sucesso!');
      } else {
        showToastError(res?.message || 'Erro ao processar pagamento');
      }
    } catch (err) {
      showToastError('Erro de conexão ao pagar fatura');
    }
  };

  const handleQuitarInadimplencia = (id: string) => {
    const alvo = inadimplencias.find(i => i.id === id);
    setInadimplencias(prev => prev.map(i => i.id === id ? { ...i, status: 'quitado' } : i));
    if (alvo) {
      addAuditLog(
        'Pendência / Inadimplência Liquidada',
        `Inadimplência '${alvo.credorOuDevedor}' no valor de R$ ${alvo.valorAtualizado.toFixed(2)} marcada como QUITADA!`
      );
    }
  };

  const handleAddInadimplencia = (nova: Inadimplencia) => {
    setInadimplencias(prev => [...prev, { ...nova, tenantId: user!.tenantId }]);
    addAuditLog(
      'Nova Pendência / Inadimplência Registrada',
      `Credor/Devedor: '${nova.credorOuDevedor}' | Tipo: ${nova.tipo.toUpperCase()} | Valor Orig.: R$ ${nova.valorOriginal.toFixed(2)} | Valor Atualizado: R$ ${nova.valorAtualizado.toFixed(2)}`
    );
  };

  const handleEditInadimplencia = (editada: Inadimplencia) => {
    setInadimplencias(prev => prev.map(i => i.id === editada.id ? editada : i));
    addAuditLog(
      'Pendência / Inadimplência Editada',
      `Item: '${editada.credorOuDevedor}' | Valor Atualizado: R$ ${editada.valorAtualizado.toFixed(2)}`
    );
  };

  const handleDeleteInadimplencia = (id: string) => {
    const alvo = inadimplencias.find(i => i.id === id);
    setInadimplencias(prev => prev.filter(i => i.id !== id));
    if (alvo) {
      addAuditLog(
        'Pendência / Inadimplência Excluída',
        `Removida pendência de '${alvo.credorOuDevedor}' (R$ ${alvo.valorAtualizado.toFixed(2)})`
      );
    }
  };





  const handleTogglePrivacySetting = (key: keyof PrivacySettings) => {
    setPrivacySettings(prev => ({ ...prev, [key]: !prev[key] }));
  };



  if (isLoading) {
    return <MoonLoader />;
  }

  if (!user) {
    return (
      <AuthView 
        onLoginSuccess={(loggedInUser) => {
          if (loggedInUser) {
            setUser(loggedInUser);
          }
        }} 
      />
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="mobile-only"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(30, 23, 19, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 90
          }}
        />
      )}

      {/* Navigation Sidebar */}
      <Sidebar 
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setIsMobileMenuOpen(false); // fecha o menu ao navegar no mobile
        }}
        petsEnabled={privacySettings.petsModuleEnabled}
        esteticaEnabled={privacySettings.esteticaEnabled}
        carrosEnabled={privacySettings.carrosEnabled}
        cartoesEnabled={privacySettings.cartoesEnabled}
        inadimplenciasEnabled={privacySettings.inadimplenciasEnabled}
        planejamentoEnabled={privacySettings.planejamentoEnabled ?? true}

        isMobileMenuOpen={isMobileMenuOpen}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        
        {user!.isFirstLogin && (
          <OnboardingWizard 
            user={user} 
            privacySettings={privacySettings} 
            onComplete={handleCompleteOnboarding} 
          />
        )}

        <Header 
          user={user}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
          onRoleChange={handleRoleChange}
          onNavigateTab={setCurrentTab}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          globalSearchTerm={globalSearchTerm}
          onSearchChange={setGlobalSearchTerm}
          onLogout={handleLogout}
        />

        {/* Global Read-Only Viewer Warning Banner */}
        {user!.role === 'viewer' && (
          <div style={{
            backgroundColor: 'var(--status-warning-bg)',
            borderBottom: '1px solid var(--status-warning)',
            padding: '0.65rem 1.75rem',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'var(--status-warning)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>👁️ <strong>Nível IV - Modo Visualizador (Viewer):</strong> Você está acessando em modo estritamente de leitura. Adições e modificações estão desativadas.</span>
          </div>
        )}

        <main className="main-content">
          
          {isDataLoading && currentTab !== 'user_settings' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
              <TableSkeleton rows={4} />
              <TableSkeleton rows={3} />
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && (
            <DashboardView 
              lancamentos={lancamentos}
              despesas={despesas}
              pets={pets}
              reservasPets={reservasPets}
              emergenciasPets={emergenciasPets}
              cartoes={cartoes}
              faturas={faturas}
              rituais={estetica}
              veiculos={veiculos}
              abastecimentos={abastecimentos}
              manutencoes={manutencoes}
              inadimplencias={inadimplencias}
              metas={metasPlanejamento}
              privacySettings={privacySettings}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'lancamentos' && (
            <LancamentosView 
              lancamentos={lancamentos}
              onAddLancamento={handleAddLancamento}
              onEditLancamento={handleEditLancamento}
              onEditLancamentoProgressivo={handleEditLancamentoProgressivo}
              onDeleteLancamento={handleDeleteLancamento}
              globalSearchTerm={globalSearchTerm}
            />
          )}

          {currentTab === 'despesas' && (
            <DespesasView 
              despesas={despesas}
              lancamentos={lancamentos}
              onUpdateStatus={handleUpdateDespesaStatus}
              onAddDespesa={handleAddDespesa}
              onEditDespesa={handleEditDespesa}
              onDeleteDespesa={handleDeleteDespesa}
            />
          )}

          {currentTab === 'planejamento' && (
            <PlanejamentoView 
              metas={metasPlanejamento}
              onAddMeta={handleAddMetaPlanejamento}
              onEditMeta={handleEditMetaPlanejamento}
              onDeleteMeta={handleDeleteMetaPlanejamento}
              onAportarMeta={handleAportarMetaPlanejamento}
              globalSearchTerm={globalSearchTerm}
            />
          )}

          {currentTab === 'estetica' && (
            <EsteticaView 
              rituais={estetica}
              onAddLancamento={handleAddLancamento}
              onAddRitual={(novo) => handleAddEstetica(novo)}
              onEditRitual={handleEditEstetica}
              onDeleteRitual={handleDeleteEstetica}
              onLogSessao={handleLogSessaoEstetica}
            />
          )}

          {currentTab === 'pets' && (
            <PetsView 
              pets={pets} 
              reservas={reservasPets} 
              agenda={agendaPets}
              compras={comprasPets}
              carrinhosSalvos={carrinhosSalvosPets}
              historicoCompras={historicoComprasPets}
              emergencias={emergenciasPets}
              petsEnabled={privacySettings.petsModuleEnabled}
              onTogglePetsModule={handleTogglePetsModule}
              onAddPet={handleAddPet}
              onEditPet={handleEditPet}
              onDeletePet={handleDeletePet}
              onAddCompra={handleAddCompraPet}
              onUpdateCompra={(itemEditado) => {
                setComprasPets(prev => prev.map(c => c.id === itemEditado.id ? itemEditado : c));
              }}
              onToggleCompraStatus={handleToggleCompraPetStatus}
              onRemoveCompra={handleRemoveCompraPet}
              onClearCart={() => setComprasPets([])}
              onAddAgenda={handleAddAgendaPet}
              onDeleteAgenda={handleDeleteAgendaPet}
              onConcluirAgenda={handleConcluirAgendaPet}
              onAportarReserva={handleAportarReservaPet}
              onEditReservaMeta={handleEditReservaMetaPet}
              onLoadSavedCartToCurrent={(carrinhoSalvo) => {
                setComprasPets(carrinhoSalvo.itens.map(it => ({ ...it, id: `cmp_${Date.now()}_${Math.random().toString(36).substr(2,4)}` })));
              }}
              onSaveCarrinhoTemplate={handleSaveCarrinhoTemplate}
              onDeleteCarrinhoTemplate={handleDeleteCarrinhoTemplate}
              onFinalizarCompraMensal={handleFinalizarCompraMensalPet}
              onRegistrarEmergencia={handleRegistrarEmergenciaPet}
              globalSearchTerm={globalSearchTerm}
            />
          )}

          {currentTab === 'carros' && (
            <CarrosView 
              veiculos={veiculos}
              abastecimentos={abastecimentos}
              manutencoes={manutencoes}
              onAddVeiculo={handleAddVeiculo}
              onEditVeiculo={handleEditVeiculo}
              onDeleteVeiculo={handleDeleteVeiculo}
              onAddAbastecimento={handleAddAbastecimento}
              onEditAbastecimento={handleEditAbastecimento}
              onDeleteAbastecimento={handleDeleteAbastecimento}
              onAddManutencao={handleAddManutencao}
              onEditManutencao={handleEditManutencao}
              onDeleteManutencao={handleDeleteManutencao}
            />
          )}

          {currentTab === 'cartao' && (
            <CartaoCreditoView 
              cartoes={cartoes}
              faturas={faturas}
              onAddCartao={handleAddCartao}
              onEditCartao={handleEditCartao}
              onDeleteCartao={handleDeleteCartao}
              onAddFaturaItem={handleAddFaturaItem}
              onEditFaturaItem={handleEditFaturaItem}
              onDeleteFaturaItem={handleDeleteFaturaItem}
              onPagarFaturaCartao={handlePagarFaturaCartao}
            />
          )}

          {currentTab === 'inadimplencias' && (
            <InadimplenciasView 
              inadimplencias={inadimplencias}
              onQuitarInadimplencia={handleQuitarInadimplencia}
              onAddInadimplencia={handleAddInadimplencia}
              onEditInadimplencia={handleEditInadimplencia}
              onDeleteInadimplencia={handleDeleteInadimplencia}
            />
          )}



          {currentTab === 'user_settings' && (
            <UserSettingsView 
              user={user}
              privacySettings={privacySettings}
              onUpdateUser={handleUpdateUserProfile}
              onTogglePrivacySetting={handleTogglePrivacySetting}
            />
          )}


          </>
          )}

          <Footer />
        </main>
      </div>
    </div>
  );
}

export default App;
