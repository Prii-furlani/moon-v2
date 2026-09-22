import React, { useState } from 'react';
import { 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Pencil,
  Trash2,
  RefreshCw
} from 'lucide-react';
import type { DespesaMensal, Lancamento } from '../types';
import { confirmDelete, showToastSuccess } from '../utils/sweetAlert';
import { maskCurrency, unmaskCurrency } from '../utils/masks';

interface DespesasViewProps {
  despesas: DespesaMensal[];
  lancamentos: Lancamento[];
  onUpdateStatus: (id: string, novoStatus: 'pago' | 'previsto', valorPago?: number, dataPagamento?: string, metodoPagamento?: string) => void;
  onAddDespesa: (nova: DespesaMensal) => void;
  onEditDespesa: (editada: DespesaMensal) => void;
  onDeleteDespesa: (id: string) => void;
}

export const DespesasView: React.FC<DespesasViewProps> = ({
  despesas,
  lancamentos,
  onUpdateStatus,
  onAddDespesa,
  onEditDespesa,
  onDeleteDespesa
}) => {
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentItem, setPaymentItem] = useState<DespesaMensal | null>(null);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentValue, setPaymentValue] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Pix');

  // Form State
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('Moradia');
  const [diaVencimento, setDiaVencimento] = useState('10');
  const [valorPrevisto, setValorPrevisto] = useState('');
  const [editingLancamentoOrigemId, setEditingLancamentoOrigemId] = useState<string | undefined>(undefined);

  // New fields for variable/daily expenses
  const [tipoDespesa, setTipoDespesa] = useState<'fixa' | 'variavel'>('fixa');
  const [dataCompra, setDataCompra] = useState(new Date().toISOString().split('T')[0]);
  const [modalPaymentMethod, setModalPaymentMethod] = useState('Pix');

  // Months available (All 12 months of 2026)
  const allMonths = Array.from({ length: 12 }, (_, i) => `2026-${String(i + 1).padStart(2, '0')}`);
  const monthLabels: Record<string, string> = {
    '2026-01': 'Janeiro 2026',
    '2026-02': 'Fevereiro 2026',
    '2026-03': 'Março 2026',
    '2026-04': 'Abril 2026',
    '2026-05': 'Maio 2026',
    '2026-06': 'Junho 2026',
    '2026-07': 'Julho 2026',
    '2026-08': 'Agosto 2026',
    '2026-09': 'Setembro 2026',
    '2026-10': 'Outubro 2026',
    '2026-11': 'Novembro 2026',
    '2026-12': 'Dezembro 2026'
  };

  // Calculate sliding window of 4 visible months
  const selectedIdx = allMonths.indexOf(selectedMonth);
  let startIdx = selectedIdx - 1;
  if (startIdx < 0) startIdx = 0;
  if (startIdx > allMonths.length - 4) startIdx = allMonths.length - 4;
  const visibleMonths = allMonths.slice(startIdx, startIdx + 4);

  const monthDespesasBase = despesas.filter(d => d.mes === selectedMonth);
  
  // Inject recurring Lancamentos (Ghosts)
  const ghostDespesas = lancamentos
    .filter(l => l.tipo === 'despesa' && l.recorrente)
    .filter(l => {
      // Check if it's active in the selectedMonth
      if (l.dataInicioRecorrencia && l.dataInicioRecorrencia > selectedMonth) return false;
      if (l.dataFimRecorrencia && l.dataFimRecorrencia < selectedMonth) return false;
      // Check if it already has a real DespesaMensal mapped to it in this month
      if (monthDespesasBase.some(d => d.lancamentoOrigemId === l.id)) return false;
      return true;
    })
    .map((l): DespesaMensal => ({
      id: `ghost_${l.id}`,
      lancamentoOrigemId: l.id,
      descricao: l.descricao,
      categoria: l.categoria,
      diaVencimento: l.dia,
      valorPrevisto: l.valor,
      status: 'previsto' as const,
      mes: selectedMonth
    }));

  const monthDespesas = [...monthDespesasBase, ...ghostDespesas].sort((a, b) => a.diaVencimento - b.diaVencimento);

  // Calculations
  const totalPrevisto = monthDespesas.reduce((acc, d) => acc + d.valorPrevisto, 0);
  const totalPago = monthDespesas
    .filter(d => d.status === 'pago')
    .reduce((acc, d) => acc + (d.valorPago || d.valorPrevisto), 0);

  const percentPago = totalPrevisto > 0 ? Math.min(Math.round((totalPago / totalPrevisto) * 100), 100) : 0;
  const pendenciasRollover = monthDespesas.filter(d => d.status === 'atrasado' || d.origemRolloverMes);

  // New Financial Indicators
  const rendaEstimada = lancamentos
    .filter(l => l.tipo === 'receita')
    .reduce((acc, l) => {
      if (l.recorrente) {
        const inicioValido = !l.dataInicioRecorrencia || l.dataInicioRecorrencia <= selectedMonth;
        const fimValido = !l.dataFimRecorrencia || l.dataFimRecorrencia >= selectedMonth;
        return (inicioValido && fimValido) ? acc + l.valor : acc;
      } else {
        return (l.mesEspecifico === selectedMonth) ? acc + l.valor : acc;
      }
    }, 0);

  const margemSobra = rendaEstimada - totalPrevisto;
  const margemSeguranca = rendaEstimada > 0 ? ((margemSobra / rendaEstimada) * 100).toFixed(1) : '0.0';

  const handleOpenAdd = () => {
    setEditingId(null);
    setEditingLancamentoOrigemId(undefined);
    setDescricao('');
    setCategoria('Moradia');
    setDiaVencimento('10');
    setValorPrevisto('');
    setTipoDespesa('fixa');
    setDataCompra(new Date().toISOString().split('T')[0]);
    setModalPaymentMethod('Pix');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: DespesaMensal) => {
    setEditingId(item.id);
    setEditingLancamentoOrigemId(item.lancamentoOrigemId);
    setDescricao(item.descricao);
    setCategoria(item.categoria);
    setDiaVencimento(item.diaVencimento.toString());
    setValorPrevisto(maskCurrency(item.valorPrevisto));
    setTipoDespesa('fixa'); // Edit is always fixed behavior for now, or could check status
    setIsModalOpen(true);
  };

  const handleDelete = (item: DespesaMensal) => {
    confirmDelete(
      'Excluir Conta Programada?',
      `Tem certeza que deseja excluir "${item.descricao}" do mês de ${monthLabels[selectedMonth]}?`,
      () => onDeleteDespesa(item.id)
    );
  };

  const handleTogglePayment = (item: DespesaMensal) => {
    if (item.status === 'pago') {
      onUpdateStatus(item.id, 'previsto');
      showToastSuccess('Status alterado para "A Vencer"');
    } else {
      setPaymentItem(item);
      setPaymentValue(maskCurrency(item.valorPrevisto));
      
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setPaymentDate(now.toISOString().slice(0, 16));
      
      setPaymentMethod('Pix');
      setIsPaymentModalOpen(true);
    }
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentItem) return;
    
    // Convert datetime local to readable format if needed, or keep as is.
    const dateFormatted = new Date(paymentDate).toLocaleString('pt-BR');
    
    if (paymentItem.id.startsWith('ghost_')) {
      // It's a synced expense from Lancamentos that hasn't been instantiated yet
      const nova: DespesaMensal = {
        ...paymentItem,
        id: `desp_sync_${Date.now()}`,
        status: 'pago',
        valorPago: unmaskCurrency(paymentValue),
        dataPagamento: dateFormatted,
        metodoPagamento: paymentMethod
      };
      onAddDespesa(nova);
    } else {
      // It's a real existing DespesaMensal
      onUpdateStatus(paymentItem.id, 'pago', unmaskCurrency(paymentValue), dateFormatted, paymentMethod);
    }
    
    showToastSuccess(`Conta "${paymentItem.descricao}" marcada como PAGA!`);
    setIsPaymentModalOpen(false);
    setPaymentItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || !valorPrevisto) return;

    if (editingId) {
      const target = despesas.find(d => d.id === editingId);
      if (target) {
        const editada: DespesaMensal = {
          ...target,
          descricao,
          categoria,
          diaVencimento: parseInt(diaVencimento),
          valorPrevisto: unmaskCurrency(valorPrevisto)
        };
        onEditDespesa(editada);
        showToastSuccess('Conta atualizada com sucesso!');
      }
    } else {
      const varDia = parseInt(dataCompra.split('-')[2]);
      const varMes = dataCompra.substring(0, 7); // yyyy-MM
      
      const nova: DespesaMensal = {
        id: `desp_${Date.now()}`,
        descricao,
        categoria,
        diaVencimento: tipoDespesa === 'variavel' ? varDia : parseInt(diaVencimento),
        valorPrevisto: unmaskCurrency(valorPrevisto),
        status: tipoDespesa === 'variavel' ? 'pago' : 'previsto',
        mes: tipoDespesa === 'variavel' ? varMes : selectedMonth,
        valorPago: tipoDespesa === 'variavel' ? unmaskCurrency(valorPrevisto) : undefined,
        dataPagamento: tipoDespesa === 'variavel' ? new Date(dataCompra + 'T12:00:00').toLocaleString('pt-BR') : undefined,
        metodoPagamento: tipoDespesa === 'variavel' ? modalPaymentMethod : undefined
      };
      onAddDespesa(nova);
      showToastSuccess(tipoDespesa === 'variavel' ? 'Gasto do dia registrado e pago!' : 'Conta cadastrada com sucesso!');
    }

    setIsModalOpen(false);
    setEditingId(null);
    setDescricao('');
    setValorPrevisto('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Title & Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Módulo de Despesas Mês a Mês & Rollover
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Gerenciamento de contas pendentes com motor de acúmulo e correção automática de mora.
          </p>
        </div>

        <button className="btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>+ Nova Conta Programada</span>
        </button>
      </div>

      {/* Month Navigator Toolbar */}
      <div className="moon-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Calendar size={20} style={{ color: 'var(--color-primary)' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
            Mês de Referência: <span style={{ color: 'var(--color-primary)' }}>{monthLabels[selectedMonth]}</span>
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            className="btn-outline" 
            style={{ padding: '0.4rem 0.6rem' }}
            disabled={allMonths.indexOf(selectedMonth) === 0}
            onClick={() => {
              const idx = allMonths.indexOf(selectedMonth);
              if (idx > 0) setSelectedMonth(allMonths[idx - 1]);
            }}
          >
            <ChevronLeft size={16} />
          </button>

          {visibleMonths.map(m => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: 600,
                backgroundColor: selectedMonth === m ? 'var(--color-primary)' : 'transparent',
                color: selectedMonth === m ? '#FFFFFF' : 'var(--text-main)',
                border: selectedMonth === m ? 'none' : '1px solid var(--border-color)'
              }}
            >
              {monthLabels[m].split(' ')[0]}
            </button>
          ))}

          <button 
            className="btn-outline" 
            style={{ padding: '0.4rem 0.6rem' }}
            disabled={allMonths.indexOf(selectedMonth) === allMonths.length - 1}
            onClick={() => {
              const idx = allMonths.indexOf(selectedMonth);
              if (idx < allMonths.length - 1) setSelectedMonth(allMonths[idx + 1]);
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Financial Indicators Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="moon-card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Renda Estimada</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--status-success)' }}>
            R$ {rendaEstimada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="moon-card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Comprometido</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--status-error)' }}>
            R$ {totalPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="moon-card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Margem de Sobra Livre</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary)' }}>
            R$ {margemSobra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="moon-card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Margem de Segurança</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {margemSeguranca}%
          </div>
        </div>
      </div>

      {/* Progress & Summary Bar */}
      <div className="moon-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Progresso de Quitação das Despesas</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>de R$ {totalPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <span className="badge badge-sage" style={{ fontSize: '0.85rem' }}>
            {percentPago}% Quitado
          </span>
        </div>

        {/* Progress Bar Track */}
        <div style={{
          height: '10px',
          width: '100%',
          backgroundColor: 'var(--bg-input)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${percentPago}%`,
            backgroundColor: 'var(--color-secondary)',
            transition: 'width 0.4s ease'
          }} />
        </div>
      </div>

      {/* Rollover Engine Banner Notification */}
      {pendenciasRollover.length > 0 && (
        <div style={{
          backgroundColor: 'var(--status-error-bg)',
          border: '1px solid var(--status-error)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <AlertTriangle size={24} style={{ color: 'var(--status-error)', flexShrink: 0 }} />
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--status-error)' }}>
              Motor de Rollover Ativo — {pendenciasRollover.length} Conta(s) Pendente(s) Acumulada(s)
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: '0.15rem' }}>
              Contas não pagas no mês anterior acumulam automaticamente no mês atual corrigidas com juros de mora de 2,8% a.m.
            </p>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="moon-card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Vencimento</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Descrição</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Categoria</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Status / Rollover</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Valor Previsto</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Juros / Mora</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Ação de Quitação</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Editar/Excluir</th>
              </tr>
            </thead>
            <tbody>
              {monthDespesas.map(item => {
                const isPaid = item.status === 'pago';
                const isAtrasado = item.status === 'atrasado';

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: isPaid ? 'transparent' : isAtrasado ? 'rgba(188, 71, 58, 0.04)' : 'transparent' }}>
                    
                    <td style={{ padding: '0.85rem 0.5rem', fontWeight: 600 }}>
                      Dia {item.diaVencimento}
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {item.lancamentoOrigemId && (
                          <span title="Sincronizado do Lançamento Recorrente" style={{ display: 'flex', alignItems: 'center' }}>
                            <RefreshCw size={12} style={{ color: 'var(--color-primary)' }} />
                          </span>
                        )}
                        {item.descricao}
                      </div>
                      {item.origemRolloverMes && (
                        <div style={{ fontSize: '0.73rem', color: 'var(--status-error)', fontWeight: 600 }}>
                          ↳ Transferido de {monthLabels[item.origemRolloverMes] || item.origemRolloverMes}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <span className="badge badge-sage" style={{ fontSize: '0.7rem' }}>
                        {item.categoria}
                      </span>
                      {isPaid && item.metodoPagamento && (
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          Pago via {item.metodoPagamento}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      {isPaid ? (
                        <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                          <CheckCircle2 size={12} /> Quitado
                        </span>
                      ) : isAtrasado ? (
                        <span className="badge badge-error" style={{ fontSize: '0.68rem' }}>
                          <AlertTriangle size={12} /> Atrasado (Rollover)
                        </span>
                      ) : (
                        <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>
                          <Clock size={12} /> A Vencer
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        R$ {item.valorPrevisto.toFixed(2)}
                      </div>
                      {isPaid && item.valorPago !== item.valorPrevisto && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--status-success)', fontWeight: 600 }}>
                          Real: R$ {item.valorPago?.toFixed(2)}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right', color: 'var(--status-error)', fontWeight: 600 }}>
                      {item.jurosAcumulados && item.jurosAcumulados > 0 ? `+ R$ ${item.jurosAcumulados.toFixed(2)}` : 'R$ 0.00'}
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem', textAlign: 'center' }}>
                      {isPaid ? (
                        <button
                          onClick={() => handleTogglePayment(item)}
                          className="btn-outline"
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          Desfazer Pago
                        </button>
                      ) : (
                        <button
                          onClick={() => handleTogglePayment(item)}
                          className="btn-primary"
                          style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
                        >
                          Pagar Agora
                        </button>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button onClick={() => handleOpenEdit(item)} style={{ color: 'var(--color-secondary)', padding: '0.25rem' }} title="Editar">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(item)} style={{ color: 'var(--status-error)', padding: '0.25rem' }} title="Excluir">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Despesa */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                {editingId ? 'Editar Conta' : 'Nova Conta Programada'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {!editingId && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setTipoDespesa('fixa')}
                    style={{ 
                      padding: '0.75rem', 
                      borderRadius: 'var(--radius-sm)', 
                      border: tipoDespesa === 'fixa' ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                      backgroundColor: tipoDespesa === 'fixa' ? 'var(--bg-primary-light)' : 'transparent',
                      color: tipoDespesa === 'fixa' ? 'var(--color-primary)' : 'var(--text-main)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    📅 Conta Programada
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setTipoDespesa('variavel')}
                    style={{ 
                      padding: '0.75rem', 
                      borderRadius: 'var(--radius-sm)', 
                      border: tipoDespesa === 'variavel' ? '2px solid var(--status-success)' : '1px solid var(--border-color)',
                      backgroundColor: tipoDespesa === 'variavel' ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                      color: tipoDespesa === 'variavel' ? 'var(--status-success)' : 'var(--text-main)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    🛍️ Gasto do Dia (Avulso)
                  </button>
                </div>
              )}

              <div>
                {editingLancamentoOrigemId && (
                  <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--color-primary)', display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <RefreshCw size={16} />
                    <span>Conta integrada via Lançamento Recorrente. Para alterar Nome, Categoria, Dia ou Valor Previsto para todos os meses, você deve ir na aba "Lançamentos".</span>
                  </div>
                )}
                
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Descrição da Conta <span style={{ color: 'var(--status-error)' }}>*</span></label>
                <input 
                  type="text" 
                  required
                  disabled={!!editingLancamentoOrigemId}
                  placeholder="Ex: Condomínio / Conta de Luz"
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  style={{ width: '100%', opacity: editingLancamentoOrigemId ? 0.7 : 1 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Categoria <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <select value={categoria} onChange={e => setCategoria(e.target.value)} style={{ width: '100%', opacity: editingLancamentoOrigemId ? 0.7 : 1 }} required disabled={!!editingLancamentoOrigemId}>
                    <option value="Moradia">Moradia</option>
                    <option value="Utilidades">Utilidades</option>
                    <option value="Saúde">Saúde</option>
                    <option value="Impostos">Impostos</option>
                    <option value="Assinaturas">Assinaturas</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Valor Previsto (R$) <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <input 
                    type="text"
                    required
                    disabled={!!editingLancamentoOrigemId}
                    placeholder="R$ 250,00"
                    value={valorPrevisto}
                    onChange={e => setValorPrevisto(maskCurrency(e.target.value))}
                    style={{ width: '100%', opacity: editingLancamentoOrigemId ? 0.7 : 1 }}
                  />
                </div>
              </div>

              {tipoDespesa === 'fixa' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Dia de Vencimento <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <input 
                    type="number" 
                    min="1" 
                    max="31" 
                    required 
                    placeholder="Ex: 10"
                    value={diaVencimento}
                    onChange={e => setDiaVencimento(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              {tipoDespesa === 'variavel' && !editingId && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Data da Compra <span style={{ color: 'var(--status-error)' }}>*</span></label>
                    <input 
                      type="date" 
                      required 
                      value={dataCompra}
                      onChange={e => setDataCompra(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Método de Pagamento</label>
                    <select value={modalPaymentMethod} onChange={e => setModalPaymentMethod(e.target.value)} style={{ width: '100%' }}>
                      <option value="Pix">Pix</option>
                      <option value="Crédito">Cartão de Crédito</option>
                      <option value="Débito">Cartão de Débito</option>
                      <option value="Dinheiro">Dinheiro</option>
                    </select>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {isPaymentModalOpen && paymentItem && (
        <div className="modal-overlay" onClick={() => setIsPaymentModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                Confirmar Pagamento
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Dando baixa em <strong>{paymentItem.descricao}</strong>. Confirme o valor real pago, a data e a forma de pagamento.
            </p>

            <form onSubmit={handleConfirmPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Valor Real Pago (R$) <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <input 
                    type="text"
                    required
                    placeholder="R$ 0,00"
                    value={paymentValue}
                    onChange={e => setPaymentValue(maskCurrency(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Forma de Pagamento <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '100%' }} required>
                    <option value="Pix">Pix</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Transferência">Transferência Bancária</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Data e Hora do Pagamento <span style={{ color: 'var(--status-error)' }}>*</span></label>
                <input 
                  type="datetime-local"
                  required
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-outline" onClick={() => setIsPaymentModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ backgroundColor: 'var(--status-success)', borderColor: 'var(--status-success)' }}>
                  Confirmar Quitação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
