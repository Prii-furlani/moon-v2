import React, { useState } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  Calendar, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight,
  CalendarDays,
  PiggyBank,
  CheckCircle2,
  PieChart,
  Clock,
  Sparkles,
  Car,
  Dog,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { 
  Lancamento, 
  DespesaMensal, 
  NavigationTab,
  Pet,
  ReservaPet,
  EmergenciaPet,
  CartaoCredito,
  FaturaItem,
  RitualEstetica,
  Veiculo,
  Abastecimento,
  ManutencaoVeiculo,
  Inadimplencia,
  PrivacySettings,
  MetaPlanejamento
} from '../types';

interface DashboardViewProps {
  lancamentos: Lancamento[];
  despesas: DespesaMensal[];
  pets?: Pet[];
  reservasPets?: ReservaPet[];
  emergenciasPets?: EmergenciaPet[];
  cartoes?: CartaoCredito[];
  faturas?: FaturaItem[];
  rituais?: RitualEstetica[];
  veiculos?: Veiculo[];
  abastecimentos?: Abastecimento[];
  manutencoes?: ManutencaoVeiculo[];
  inadimplencias?: Inadimplencia[];
  metas?: MetaPlanejamento[];
  privacySettings?: PrivacySettings;
  onNavigateTab: (tab: NavigationTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  lancamentos,
  despesas,
  pets = [],
  reservasPets = [],
  emergenciasPets = [],
  cartoes = [],
  rituais = [],
  veiculos = [],
  abastecimentos = [],
  manutencoes = [],
  inadimplencias = [],
  metas = [],
  privacySettings,
  onNavigateTab
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Module Feature Flags (Respeita as configurações ativas do inquilino)
  const isEsteticaEnabled = privacySettings?.esteticaEnabled !== false;
  const isCarrosEnabled = privacySettings?.carrosEnabled !== false;
  const isPetsEnabled = privacySettings?.petsModuleEnabled !== false;
  const isCartoesEnabled = privacySettings?.cartoesEnabled !== false;
  const isInadimplenciasEnabled = privacySettings?.inadimplenciasEnabled !== false;

  // General Current Month Metrics
  const now = new Date();
  const currentMonthYYYYMM = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

  const isLancamentoAtivo = (l: Lancamento) => {
    if (l.recorrente) {
      if (l.dataInicioRecorrencia && l.dataInicioRecorrencia > currentMonthYYYYMM) return false;
      if (l.dataFimRecorrencia && l.dataFimRecorrencia < currentMonthYYYYMM) return false;
      return true;
    }
    if (l.mesEspecifico && l.mesEspecifico !== currentMonthYYYYMM) return false;
    return true;
  };

  const totalReceitas = lancamentos
    .filter(l => l.tipo === 'receita' && isLancamentoAtivo(l))
    .reduce((acc, l) => acc + l.valor, 0);

  const totalDespesasRealizadas = lancamentos
    .filter(l => l.tipo === 'despesa' && l.status === 'realizado' && isLancamentoAtivo(l))
    .reduce((acc, l) => acc + l.valor, 0);

  const saldoAtual = totalReceitas - totalDespesasRealizadas;

  // 12-Month Annual Cash Flow Projection Engine for selectedYear
  const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const fluxoAnual = mesesNomes.map((mesNome, index) => {
    const monthNum = (index + 1).toString().padStart(2, '0');
    const mesYYYYMM = `${selectedYear}-${monthNum}`;

    // 1. Receitas Projetadas
    const receitaProjetada = lancamentos
      .filter(l => l.tipo === 'receita')
      .reduce((acc, l) => {
        if (l.recorrente) {
          const inicioValido = !l.dataInicioRecorrencia || l.dataInicioRecorrencia <= mesYYYYMM;
          const fimValido = !l.dataFimRecorrencia || l.dataFimRecorrencia >= mesYYYYMM;
          return (inicioValido && fimValido) ? acc + l.valor : acc;
        } else {
          return (l.mesEspecifico === mesYYYYMM) ? acc + l.valor : acc;
        }
      }, 0);

    // 2. Gastos Fixos (Despesas e Lançamentos Recorrentes)
    const saidasFixasLancamentos = lancamentos
      .filter(l => l.tipo === 'despesa')
      .reduce((acc, l) => {
        if (l.recorrente) {
          const inicioValido = !l.dataInicioRecorrencia || l.dataInicioRecorrencia <= mesYYYYMM;
          const fimValido = !l.dataFimRecorrencia || l.dataFimRecorrencia >= mesYYYYMM;
          return (inicioValido && fimValido) ? acc + l.valor : acc;
        } else {
          return (l.mesEspecifico === mesYYYYMM) ? acc + l.valor : acc;
        }
      }, 0);

    const despesasDoMes = despesas
      .filter(d => d.mes === mesYYYYMM)
      .reduce((acc, d) => acc + d.valorPrevisto, 0);

    // 3. Gastos com Pets (se módulo ativo)
    const gastosPets = isPetsEnabled ? pets.filter(p => p.ativo !== false).reduce((acc, p) => acc + p.gastoMensalEstimado, 0) : 0;
    
    // 4. Gastos com Estética & Autocuidado (Unhas, Cabelo, Barba - se módulo ativo)
    const gastosEstetica = isEsteticaEnabled ? rituais.reduce((acc, r) => {
      const mult = r.frequencia === 'Semanal' ? 4 : r.frequencia === 'Bisemanal' ? 2 : 1;
      return acc + (r.valor * mult);
    }, 0) : 0;

    // 5. Gastos com Veículos (Combustível + Parcela do Financiamento + Revisões/Mecânica - se módulo ativo)
    let gastosVeiculos = 0;
    if (isCarrosEnabled) {
      // Baseline Combustível/Manutenção preventiva da frota
      gastosVeiculos += veiculos.reduce((acc, v) => acc + v.gastoMensalEstimado, 0);
      
      // Parcelas do Financiamento do Veículo
      veiculos.forEach(v => {
        if (v.financiado && v.valorParcelaFinanciamento) {
          const pagas = v.parcelasPagasFinanciamento || 0;
          const totais = v.parcelasTotaisFinanciamento || 1;
          if (pagas < totais) {
            gastosVeiculos += v.valorParcelaFinanciamento;
          }
        }
      });

      // Manutenções Parceladas de Veículos
      const parcelasMecanica = manutencoes.reduce((acc, m) => {
        if (!m.dataInicio) return acc;
        const mInicio = m.dataInicio.substring(0, 7);
        if (mesYYYYMM >= mInicio) {
          const yearDiff = parseInt(mesYYYYMM.substring(0,4)) - parseInt(mInicio.substring(0,4));
          const monthDiff = parseInt(mesYYYYMM.substring(5,7)) - parseInt(mInicio.substring(5,7));
          const monthsPassed = (yearDiff * 12) + monthDiff;
          if (monthsPassed >= 0 && monthsPassed < m.parcelasTotal) {
            return acc + m.valorParcela;
          }
        }
        return acc;
      }, 0);

      gastosVeiculos += parcelasMecanica;
    }

    // 6. Faturas no Cartão (se módulo ativo)
    const gastosCartoes = isCartoesEnabled ? (cartoes.reduce((acc, c) => acc + c.faturaAtual, 0) / 12) : 0;

    // Total de Saídas Reais Projetadas do Mês (Soma Consolidada de TUDO)
    const totalSaidas = saidasFixasLancamentos + despesasDoMes + gastosPets + gastosEstetica + gastosVeiculos + gastosCartoes;
    const saldoLiquido = receitaProjetada - totalSaidas;

    return {
      mes: mesNome,
      mesNum: index + 1,
      receitaProjetada,
      gastosFixos: saidasFixasLancamentos + despesasDoMes,
      gastosPets,
      gastosEstetica,
      gastosVeiculos,
      gastosCartoes,
      totalSaidas,
      saldoLiquido
    };
  });

  const totalReceitasAno = fluxoAnual.reduce((acc, f) => acc + f.receitaProjetada, 0);
  const totalSaidasAno = fluxoAnual.reduce((acc, f) => acc + f.totalSaidas, 0);
  const resultadoAnualProjetado = totalReceitasAno - totalSaidasAno;

  // Dynamic Breakdown por Categoria (Gráfico / Progresso)
  const categoryTotals: Record<string, number> = {};

  // 1. Despesas do Mês Atual
  despesas
    .filter(d => d.mes === currentMonthYYYYMM)
    .forEach(d => {
      const cat = d.categoria || 'Geral';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + d.valorPrevisto;
    });

  // 2. Lançamentos de Despesas Ativos
  lancamentos
    .filter(l => l.tipo === 'despesa' && isLancamentoAtivo(l))
    .forEach(l => {
      const cat = l.categoria || 'Outros';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + l.valor;
    });

  // 3. Faturas de Cartões de Crédito (se ativado)
  const totalCartoes = isCartoesEnabled ? cartoes.reduce((acc, c) => acc + c.faturaAtual, 0) : 0;
  const totalLimiteDisponivel = isCartoesEnabled ? cartoes.reduce((acc, c) => acc + c.limiteDisponivel, 0) : 0;
  if (isCartoesEnabled && totalCartoes > 0) {
    categoryTotals['Cartão de Crédito'] = (categoryTotals['Cartão de Crédito'] || 0) + totalCartoes;
  }

  // 4. Módulo Veículos (se ativado)
  let totalVeiculos = isCarrosEnabled ? abastecimentos.reduce((acc, a) => acc + a.valorTotal, 0) : 0;
  if (isCarrosEnabled) {
    totalVeiculos += manutencoes.filter(m => m.ativa).reduce((acc, m) => acc + m.valorParcela, 0);
    veiculos.forEach(v => {
      if (v.financiado && v.valorParcelaFinanciamento) {
        totalVeiculos += v.valorParcelaFinanciamento;
      }
    });
    if (totalVeiculos > 0) {
      categoryTotals['Veículos & Transporte'] = (categoryTotals['Veículos & Transporte'] || 0) + totalVeiculos;
    }
  }

  // 5. Módulo Pets (se ativado)
  const totalPets = isPetsEnabled ? pets.filter(p => p.ativo !== false).reduce((acc, p) => acc + p.gastoMensalEstimado, 0) : 0;
  if (isPetsEnabled && totalPets > 0) {
    categoryTotals['Pets'] = (categoryTotals['Pets'] || 0) + totalPets;
  }

  // 6. Módulo Estética (se ativado)
  const totalEstetica = isEsteticaEnabled ? rituais.reduce((acc, r) => acc + r.valor, 0) : 0;
  if (isEsteticaEnabled && totalEstetica > 0) {
    categoryTotals['Estética & Cuidados'] = (categoryTotals['Estética & Cuidados'] || 0) + totalEstetica;
  }

  // 7. Módulo Inadimplências (se ativado)
  const totalDividasProprias = isInadimplenciasEnabled 
    ? inadimplencias.filter(i => i.tipo === 'divida_propria' && i.status !== 'quitado').reduce((acc, i) => acc + i.valorAtualizado, 0) 
    : 0;
  const totalAReceber = isInadimplenciasEnabled 
    ? inadimplencias.filter(i => i.tipo === 'a_receber' && i.status !== 'quitado').reduce((acc, i) => acc + i.valorAtualizado, 0) 
    : 0;

  const grandTotalGastos = Object.values(categoryTotals).reduce((acc, val) => acc + val, 0);
  const sobraMensalEstimada = totalReceitas - grandTotalGastos;

  // =========================================================================
  // IMPROVEMENTS 1, 2, 3 & 4 (ANALYTICAL KPIS & DYNAMIC CALCULATIONS)
  // =========================================================================

  // 1. Taxa de Comprometimento da Renda (%)
  const taxaComprometimento = totalReceitas > 0 
    ? Math.round((grandTotalGastos / totalReceitas) * 100) 
    : 0;

  const getComprometimentoBadge = (taxa: number) => {
    if (taxa <= 70) return { label: `${taxa}% comprometido (Saudável)`, color: 'var(--status-success)', bg: 'var(--status-success-bg)' };
    if (taxa <= 85) return { label: `${taxa}% comprometido (Atenção)`, color: 'var(--color-secondary)', bg: 'var(--bg-secondary-light)' };
    return { label: `${taxa}% comprometido (Alerta)`, color: 'var(--status-error)', bg: 'var(--status-error-bg)' };
  };
  const compBadge = getComprometimentoBadge(taxaComprometimento);

  // 2. Reserva Total "Tem Guardado" Dinâmica (Soma das Caixinhas dos Pets + Reserva Familiar)
  const totalReservasPets = reservasPets.reduce((acc, r) => acc + (r.valorAtual || 0), 0);
  const totalReservaFamiliar = metas.reduce((acc, m) => acc + (m.valorAtual || 0), 0); // Dinâmico das metas
  const totalTemGuardado = totalReservasPets + totalReservaFamiliar;

  // 3. Meses de Cobertura da Reserva (Autonomia Financeira)
  const custoVidaMensal = grandTotalGastos > 0 ? grandTotalGastos : 1;
  const mesesAutonomia = (totalTemGuardado / custoVidaMensal).toFixed(1);

  // 4. Indicador de Emergências Veterinárias Ocorridas no Mês
  const emergenciasMesAtual = emergenciasPets.filter(e => {
    if (!e.data) return false;
    return e.data.substring(0, 7) === currentMonthYYYYMM;
  });

  // Raw Vencimentos Organizados por Dia do Mês
  const rawVencimentos = [
    ...despesas.filter(d => d.mes === currentMonthYYYYMM).map(d => ({
      dia: d.diaVencimento,
      item: d.descricao || 'Despesa',
      valor: d.valorPrevisto,
      categoria: d.categoria,
      pago: d.status === 'pago'
    })),
    ...cartoes.filter(c => c.faturaAtual > 0).map(c => ({
      dia: c.diaVencimento,
      item: `Fatura Cartão ${c.nomeCartao}`,
      valor: c.faturaAtual,
      categoria: 'Cartão',
      pago: false
    })),
    ...manutencoes.filter(m => m.ativa).map(m => ({
      dia: m.dataInicio ? parseInt(m.dataInicio.split('-')[2]) : 10,
      item: `Manutenção: ${m.descricao}`,
      valor: m.valorParcela,
      categoria: 'Carros',
      pago: false
    })),
    ...lancamentos.filter(l => l.tipo === 'despesa' && l.recorrente && isLancamentoAtivo(l)).map(l => ({
      dia: l.dia || 1,
      item: l.descricao,
      valor: l.valor,
      categoria: l.categoria,
      pago: l.status === 'realizado'
    }))
  ];

  const proximosVencimentos = rawVencimentos
    .sort((a, b) => a.dia - b.dia)
    .slice(0, 10);

  const coresPalette = [
    'var(--color-primary)',
    'var(--color-secondary)',
    '#C9923B',
    '#A6523B',
    '#607A56',
    '#7D916E',
    '#9BB08C',
    '#4A6B82',
    '#B57C9E',
    '#D99A6C'
  ];

  const categoriasBreakdown = Object.entries(categoryTotals)
    .filter(([_, val]) => val > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([nome, valor], index) => {
      const pct = grandTotalGastos > 0 ? Math.round((valor / grandTotalGastos) * 100) : 0;
      return {
        nome,
        valor,
        pct,
        cor: coresPalette[index % coresPalette.length]
      };
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Visão Geral Financeira (Executiva)
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Consolidado do mês, fluxo de caixa anual projetado, investimentos guardados e vencimentos por dia.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-outline" onClick={() => onNavigateTab('despesas')}>
            <CalendarDays size={16} />
            <span>Despesas Mês a Mês</span>
          </button>
          
          <button className="btn-primary" onClick={() => onNavigateTab('lancamentos')}>
            <TrendingUp size={16} />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Card 1: Saldo Disponível */}
        <div className="moon-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Saldo Atual Em Conta</span>
            <Wallet size={20} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.35rem' }}>
            R$ {saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.25rem', 
            fontSize: '0.75rem', 
            color: sobraMensalEstimada >= 0 ? 'var(--status-success)' : 'var(--status-error)', 
            marginTop: '0.25rem',
            fontWeight: 600
          }}>
            {sobraMensalEstimada >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>
              {sobraMensalEstimada >= 0 ? 'Sobra Mensal Estimada: ' : 'Déficit Mensal Estimado: '} 
              R$ {Math.abs(sobraMensalEstimada).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Card 2: Entradas / Receitas + TAXA DE COMPROMETIMENTO DA RENDA */}
        <div className="moon-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Receitas do Mês</span>
            <TrendingUp size={20} style={{ color: 'var(--status-success)' }} />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--status-success)', marginTop: '0.35rem' }}>
            R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem', flexWrap: 'wrap', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Renda Principal + Projetos</span>
            <span className="badge" style={{ fontSize: '0.65rem', backgroundColor: compBadge.bg, color: compBadge.color, fontWeight: 700, padding: '0.1rem 0.35rem' }}>
              {compBadge.label}
            </span>
          </div>
        </div>

        {/* Card 3: Investimentos / Tem Guardado DINÂMICO + AUTONOMIA FINANCEIRA */}
        <div className="moon-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Reserva "Tem Guardado"</span>
            <PiggyBank size={20} style={{ color: 'var(--color-secondary)' }} />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--color-secondary)', marginTop: '0.35rem' }}>
            R$ {totalTemGuardado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--status-success)', fontWeight: 600, marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ShieldCheck size={14} />
            <span>Garante {mesesAutonomia} meses de autonomia financeira</span>
          </div>
        </div>

        {/* Card 4: Projeção Anual Líquida */}
        <div className="moon-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Resultado Anual Projetado ({selectedYear})</span>
            <TrendingUp size={20} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '0.35rem' }}>
            R$ {resultadoAnualProjetado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--status-success)', fontWeight: 600 }}>Excelente capacidade de sobra</span>
        </div>
      </div>

      {/* Main Section: FLUXO DE CAIXA ANUAL (12 MESES) MINIMALISTA */}
      <div className="moon-card">
        
        {/* Header & Year Selector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                Fluxo de Caixa Anual Projetado ({selectedYear})
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Projeção de 12 meses (Receitas vs. Gastos Fixos + Parcelamentos).
            </p>
          </div>

          {/* Select de Ano */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ano de Exercício:</label>
            <select 
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value))}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: 'var(--color-primary)',
                borderColor: 'var(--color-primary)',
                backgroundColor: 'var(--bg-primary-light)',
                cursor: 'pointer'
              }}
            >
              <option value={2024}>2024 (Histórico)</option>
              <option value={2025}>2025 (Histórico)</option>
              <option value={2026}>2026 (Ano Atual)</option>
              <option value={2027}>2027 (Projeção Futura)</option>
            </select>
          </div>
        </div>

        {/* Sleek Annual Metric Summary Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--status-success-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-success)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Entradas Anual:</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--status-success)' }}>
              R$ {totalReceitasAno.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Saídas Anual (Fixas + Cartões):</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--status-error)' }}>
              R$ {totalSaidasAno.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-primary-light)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-primary)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sobra Líquida Projetada ({selectedYear}):</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              R$ {resultadoAnualProjetado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Minimalist 12-Month Area Chart */}
        <div style={{ height: '280px', width: '100%', paddingBottom: '1rem', marginTop: '1rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={fluxoAnual} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7D916E" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#7D916E" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A6523B" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#A6523B" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="mes" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
                dy={10} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
                tickFormatter={(value) => `${value / 1000}k`} 
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const itemData = payload[0].payload;
                    return (
                      <div style={{ backgroundColor: 'var(--bg-main)', padding: '0.85rem 1.1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', minWidth: '240px' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem' }}>
                          Projeção para {label} de {selectedYear}
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--status-success)', fontWeight: 700, marginBottom: '0.35rem' }}>
                          <span>🟢 Receita Projetada:</span>
                          <span>R$ {itemData.receitaProjetada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--status-error)', fontWeight: 700, marginBottom: '0.5rem' }}>
                          <span>🔴 Saídas Consolidadas:</span>
                          <span>R$ {itemData.totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', borderTop: '1px dashed var(--border-color)', paddingTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>• Fixas & Moradia:</span>
                            <span>R$ {itemData.gastosFixos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          {isCarrosEnabled && itemData.gastosVeiculos > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>• Veículos (Financiamento+Mecânica):</span>
                              <span>R$ {itemData.gastosVeiculos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}
                          {isEsteticaEnabled && itemData.gastosEstetica > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>• Autocuidado & Rituais:</span>
                              <span>R$ {itemData.gastosEstetica.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}
                          {isPetsEnabled && itemData.gastosPets > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>• Módulo Pets:</span>
                              <span>R$ {itemData.gastosPets.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}
                          {isCartoesEnabled && itemData.gastosCartoes > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>• Faturas no Cartão:</span>
                              <span>R$ {itemData.gastosCartoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}
                        </div>

                        <div style={{ marginTop: '0.5rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 800 }}>
                          <span>Sobra Estimada:</span>
                          <span style={{ color: itemData.saldoLiquido >= 0 ? 'var(--color-primary)' : 'var(--status-error)' }}>
                            R$ {itemData.saldoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="receitaProjetada" 
                stroke="#7D916E" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorReceita)" 
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--bg-main)' }}
              />
              <Area 
                type="monotone" 
                dataKey="totalSaidas" 
                stroke="#A6523B" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorSaidas)" 
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--bg-main)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* Restored Useful Widgets: Categorias Breakdown + Vencimentos por Dia */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem'
      }}>
        
        {/* Widget 1: Distribuição de Despesas por Categoria */}
        <div className="moon-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChart size={20} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Distribuição por Categoria</h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Este Mês</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {categoriasBreakdown.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                Nenhuma despesa ou valor registrado para este mês.
              </p>
            ) : (
              categoriasBreakdown.map(cat => (
                <div key={cat.nome}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600 }}>{cat.nome}</span>
                    <strong style={{ color: 'var(--text-main)' }}>R$ {cat.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({cat.pct}%)</strong>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'var(--bg-input)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${cat.pct}%`, backgroundColor: cat.cor }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Widget 2: Vencimentos Organizados por Dia do Mês */}
        <div className="moon-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} style={{ color: 'var(--color-secondary)' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Vencimentos por Dia do Mês</h3>
            </div>
            <span className="badge badge-sage" style={{ fontSize: '0.7rem' }}>Organizado por Dia</span>
          </div>

          <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {proximosVencimentos.map((venc, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-primary-light)',
                    color: 'var(--color-primary)',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    Dia {venc.dia}
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.88rem', display: 'block' }}>{venc.item}</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{venc.categoria}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    R$ {venc.valor.toFixed(2)}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--status-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <CheckCircle2 size={12} /> Liquidado
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Resumo Consolidado dos Módulos da Família */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Resumo Consolidado dos Módulos da Família
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Visão sintética em tempo real de todos os módulos ativos na sua conta.
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem'
        }}>
          
          {/* Card Módulo Estética & Cuidados (Unhas, Barba, Cabelo) */}
          {isEsteticaEnabled && (
            <div 
              onClick={() => onNavigateTab('estetica')}
              className="moon-card moon-card-hover"
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem', height: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={20} />
                  </div>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700 }}>Autocuidado</h4>
                </div>
                <span style={{ padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'var(--bg-secondary-light)', color: 'var(--color-secondary)' }}>
                  {rituais.length} ativos
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Gasto Mensal em Rituais</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  R$ {totalEstetica.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  {rituais.length > 0 ? `Próximo: ${rituais[0].nome}` : 'Nenhum agendado'}
                </span>
                <span style={{ fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '2px', transition: 'all 0.2s' }}>
                  Ver Módulo <ArrowUpRight size={14} />
                </span>
              </div>
            </div>
          )}

          {/* Card Módulo Veículos (Carros & Motos) */}
          {isCarrosEnabled && (
            <div 
              onClick={() => onNavigateTab('carros')}
              className="moon-card moon-card-hover"
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem', height: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-secondary-light)', color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Car size={20} />
                  </div>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700 }}>Veículos</h4>
                </div>
                <span style={{ padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'var(--bg-secondary-light)', color: 'var(--color-secondary)' }}>
                  {veiculos.length} ativos
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Gasto Total da Frota (Mês)</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  R$ {totalVeiculos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  {veiculos[0] ? `${veiculos[0].nome} (${veiculos[0].placa})` : 'Sem veículos'}
                </span>
                <span style={{ fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '2px', transition: 'all 0.2s' }}>
                  Ver Módulo <ArrowUpRight size={14} />
                </span>
              </div>
            </div>
          )}

          {/* Card Módulo Pets + INDICADOR DE EMERGÊNCIAS VETERINÁRIAS NO MÊS */}
          {isPetsEnabled && (
            <div 
              onClick={() => onNavigateTab('pets')}
              className="moon-card moon-card-hover"
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem', height: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Dog size={20} />
                  </div>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700 }}>Pets</h4>
                </div>
                <span style={{ padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'var(--bg-secondary-light)', color: 'var(--color-secondary)' }}>
                  {pets.length} ativos
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Gasto Estimado Mensal</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  R$ {totalPets.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                {emergenciasMesAtual.length > 0 ? (
                  <span style={{ color: 'var(--status-error)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    🚨 {emergenciasMesAtual.length} emergência(s)
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>
                    Sem pendências
                  </span>
                )}
                <span style={{ fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '2px', transition: 'all 0.2s' }}>
                  Ver Módulo <ArrowUpRight size={14} />
                </span>
              </div>
            </div>
          )}

          {/* Card Módulo Cartões de Crédito */}
          {isCartoesEnabled && (
            <div 
              onClick={() => onNavigateTab('cartao')}
              className="moon-card moon-card-hover"
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem', height: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CreditCard size={20} />
                  </div>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700 }}>Cartões</h4>
                </div>
                <span style={{ padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'var(--bg-secondary-light)', color: 'var(--color-secondary)' }}>
                  {cartoes.length} ativos
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Faturas Atuais</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  R$ {totalCartoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  Limite: R$ {totalLimiteDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span style={{ fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '2px', transition: 'all 0.2s' }}>
                  Ver Módulo <ArrowUpRight size={14} />
                </span>
              </div>
            </div>
          )}

          {/* Card Módulo Inadimplências / Dívidas */}
          {isInadimplenciasEnabled && (
            <div 
              onClick={() => onNavigateTab('inadimplencias')}
              className="moon-card moon-card-hover"
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem', height: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertCircle size={20} />
                  </div>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700 }}>Dívidas & Créditos</h4>
                </div>
                <span style={{ padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'var(--bg-secondary-light)', color: 'var(--color-secondary)' }}>
                  Ativo
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Dívidas Próprias Pendentes</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  R$ {totalDividasProprias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>
                  A receber: R$ {totalAReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span style={{ fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '2px', transition: 'all 0.2s' }}>
                  Ver Módulo <ArrowUpRight size={14} />
                </span>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
