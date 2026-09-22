import React, { useState } from 'react';
import { 
  Plus, 
  Calendar, 
  X,
  Check,
  Pencil,
  Trash2
} from 'lucide-react';
import type { RitualEstetica, Lancamento } from '../types';
import { confirmDelete, showToastSuccess } from '../utils/sweetAlert';

interface EsteticaViewProps {
  rituais: RitualEstetica[];
  onAddLancamento: (novo: Lancamento) => void;
  onAddRitual: (novo: RitualEstetica) => void;
  onEditRitual: (editado: RitualEstetica) => void;
  onDeleteRitual: (id: string) => void;
  onLogSessao: (id: string, dataSessao: string) => void;
}

export const EsteticaView: React.FC<EsteticaViewProps> = ({
  rituais,
  onAddLancamento,
  onAddRitual,
  onEditRitual,
  onDeleteRitual,
  onLogSessao
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Payment/Session Modal State
  const [sessionToLog, setSessionToLog] = useState<RitualEstetica | null>(null);
  const [isFoiPago, setIsFoiPago] = useState(true);
  const [metodoSessao, setMetodoSessao] = useState('Pix');
  const [dataSessao, setDataSessao] = useState(new Date().toISOString().split('T')[0]);

  // Form state
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [frequencia, setFrequencia] = useState<'Semanal' | 'Bisemanal' | 'Mensal'>('Mensal');
  const [proximaData, setProximaData] = useState('');

  // History Modal State
  const [selectedMonthHistory, setSelectedMonthHistory] = useState<string | null>(null);

  // We no longer filter by gender. All rituals created by the user are visible.
  const filteredRituais = rituais;

  // Calculations
  const gastoMensalEstimado = filteredRituais.reduce((acc, r) => {
    const mult = r.frequencia === 'Semanal' ? 4 : r.frequencia === 'Bisemanal' ? 2 : 1;
    return acc + (r.valor * mult);
  }, 0);

  const projecaoAnual = gastoMensalEstimado * 12;

  // Panorama Anual
  const anoAtual = new Date().getFullYear();
  const nomeMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  const panoramaAnual = nomeMeses.map((nome, index) => {
    const planejado = gastoMensalEstimado;
    const strMes = String(index + 1).padStart(2, '0');
    const prefixoMes = `${anoAtual}-${strMes}`;
    
    let realizado = 0;
    let qtd = 0;
    
    rituais.forEach(rit => {
      if (rit.sessoesRealizadas) {
        rit.sessoesRealizadas.forEach(sessao => {
          if (sessao.data.startsWith(prefixoMes)) {
            realizado += sessao.valor;
            qtd += 1;
          }
        });
      }
    });

    return {
      nome,
      planejado,
      realizado,
      qtd,
      isAtual: index === new Date().getMonth(),
      prefixoMes
    };
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setNome('');
    setValor('');
    setFrequencia('Mensal');
    setProximaData(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: RitualEstetica) => {
    setEditingId(item.id);
    setNome(item.nome);
    setValor(item.valor.toString());
    setFrequencia(item.frequencia);
    setProximaData(item.proximaData);
    setIsModalOpen(true);
  };

  const handleDelete = (item: RitualEstetica) => {
    confirmDelete(
      'Excluir Ritual?',
      `Tem certeza que deseja excluir "${item.nome}"?`,
      () => onDeleteRitual(item.id)
    );
  };

  const handleOpenLogSessao = (rit: RitualEstetica) => {
    setSessionToLog(rit);
    setIsFoiPago(true);
    setMetodoSessao('Pix');
    setDataSessao(new Date().toISOString().split('T')[0]);
  };

  const handleConfirmLogSessao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToLog) return;
    
    // Dispara a geracao do Lancamento
    onAddLancamento({
      id: `lanc_estetica_${Date.now()}`,
      descricao: sessionToLog.nome,
      categoria: 'Autocuidado',
      valor: sessionToLog.valor,
      tipo: 'despesa',
      dia: parseInt(dataSessao.split('-')[2], 10),
      recorrente: false,
      status: isFoiPago ? 'realizado' : 'previsto',
      metodoPagamento: isFoiPago ? metodoSessao : undefined,
      dataPagamento: isFoiPago ? dataSessao : undefined,
      mesEspecifico: dataSessao.substring(0, 7)
    });

    // Avanca a data do ritual e guarda log
    onLogSessao(sessionToLog.id, dataSessao);
    showToastSuccess(`Sessão de "${sessionToLog.nome}" registrada com sucesso! ✨`);
    
    setSessionToLog(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !valor) return;

    if (editingId) {
      const target = rituais.find(r => r.id === editingId);
      if (target) {
        const editado: RitualEstetica = {
          ...target,
          nome,
          valor: parseFloat(valor),
          frequencia,
          proximaData: proximaData || target.proximaData
        };
        onEditRitual(editado);
        showToastSuccess('Ritual atualizado com sucesso!');
      }
    } else {
      const novo: RitualEstetica = {
        id: `est_${Date.now()}`,
        nome,
        categoria: 'estetica',
        generoAlvo: 'todos', // Legacy fallback for types
        valor: parseFloat(valor),
        frequencia,
        proximaData: proximaData || new Date().toISOString().split('T')[0],
        historicoGasto: parseFloat(valor)
      };
      onAddRitual(novo);
      showToastSuccess('Ritual de estética cadastrado!');
    }

    setIsModalOpen(false);
    setEditingId(null);
    setNome('');
    setValor('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Autocuidado & Beleza
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Planejamento de rituais de beleza, saúde e bem-estar (filtrados para o seu perfil).
          </p>
        </div>

        <button className="btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>+ Novo Ritual</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Esquerda: Rituais e KPIs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* KPI Row */}
      <div className="moon-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', textAlign: 'right' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gasto Mensal Est.:</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              R$ {gastoMensalEstimado.toFixed(2)}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Projeção Anual:</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-secondary)' }}>
              R$ {projecaoAnual.toFixed(2)}
            </div>
          </div>
        </div>

      </div>

          {/* Ritual Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '1.25rem'
          }}>
        {filteredRituais.map(rit => (
          <div key={rit.id} className="moon-card moon-card-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span className="badge badge-sage" style={{ fontSize: '0.68rem' }}>
                  {rit.generoAlvo === 'mulher' ? '💅 Feminino' : rit.generoAlvo === 'homem' ? '💈 Masculino' : '✨ Unissex'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{rit.frequencia}</span>
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                {rit.nome}
              </h3>

              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
                R$ {rit.valor.toFixed(2)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ sessão</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={14} />
                  <span>Próxima: <strong>{rit.proximaData}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--status-success)' }}>
                  <Check size={14} />
                  <span>{rit.sessoesRealizadas?.length || 0} sessões (R$ {(rit.historicoGasto || 0).toFixed(2)})</span>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button 
                className="btn-outline" 
                onClick={() => handleOpenLogSessao(rit)}
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
              >
                <Check size={14} />
                <span>Registrar Sessão</span>
              </button>

              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button onClick={() => handleOpenEdit(rit)} style={{ color: 'var(--color-secondary)', padding: '0.25rem' }} title="Editar">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(rit)} style={{ color: 'var(--status-error)', padding: '0.25rem' }} title="Excluir">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
          </div>
        </div>

        {/* Direita: Calendário Anual */}
        <div className="moon-card" style={{ position: 'sticky', top: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Panorama Anual ({anoAtual})
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {panoramaAnual.map(mes => {
              const isOver = mes.realizado > mes.planejado;
              const hasActivity = mes.qtd > 0;
              const bgColor = mes.isAtual ? 'var(--bg-primary-light)' : 'var(--bg-card)';
              const borderColor = mes.isAtual ? 'var(--color-primary)' : isOver ? 'var(--status-error)' : hasActivity ? 'var(--status-success)' : 'var(--border-color)';
              
              return (
                <div 
                  key={mes.nome} 
                  className="moon-card-hover"
                  onClick={() => setSelectedMonthHistory(mes.prefixoMes)}
                  style={{ 
                    backgroundColor: bgColor, 
                    border: `1px solid ${borderColor}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.6rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                    cursor: 'pointer'
                  }}
                  title={`Ver histórico de ${mes.nome}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: mes.isAtual ? 'var(--color-primary)' : 'var(--text-main)' }}>{mes.nome}</span>
                    <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--bg-input)', padding: '2px 6px', borderRadius: '10px' }}>
                      {mes.qtd} sessões
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Plan: R$ {mes.planejado.toFixed(0)}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isOver ? 'var(--status-error)' : 'var(--text-main)' }}>
                    Real: R$ {mes.realizado.toFixed(0)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Modal Add / Edit Ritual */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                {editingId ? 'Editar Ritual de Estética' : 'Cadastrar Novo Ritual'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Nome do Serviço / Procedimento <span style={{ color: 'var(--status-error)' }}>*</span></label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Manicure, Corte de Cabelo, Barba"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Valor da Sessão (R$) <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={valor}
                    onChange={e => setValor(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Frequência <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <select value={frequencia} onChange={e => setFrequencia(e.target.value as any)} style={{ width: '100%' }} required>
                    <option value="Semanal">Semanal</option>
                    <option value="Bisemanal">Bisemanal (Quinzenal)</option>
                    <option value="Mensal">Mensal</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Data da Próxima Sessão</label>
                  <input 
                    type="date"
                    value={proximaData}
                    onChange={e => setProximaData(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? 'Salvar Alterações' : 'Salvar Ritual'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Payment/Session Log */}
      {sessionToLog && (
        <div className="modal-overlay" onClick={() => setSessionToLog(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                Registrar Sessão de "{sessionToLog.nome}"
              </h3>
              <button onClick={() => setSessionToLog(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Ao registrar esta sessão, a próxima data do ritual será recalculada, e um Lançamento Financeiro de <strong>R$ {sessionToLog.valor.toFixed(2)}</strong> será criado automaticamente no seu fluxo de caixa.
            </p>

            <form onSubmit={handleConfirmLogSessao} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>O pagamento já foi realizado?</span>
                <label className="switch">
                  <input type="checkbox" checked={isFoiPago} onChange={e => setIsFoiPago(e.target.checked)} />
                  <span className="slider"></span>
                </label>
              </div>

              {isFoiPago && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Data do Pagamento</label>
                    <input 
                      type="date"
                      required
                      value={dataSessao}
                      onChange={e => setDataSessao(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Método de Pagamento</label>
                    <select value={metodoSessao} onChange={e => setMetodoSessao(e.target.value)} style={{ width: '100%' }} required>
                      <option value="Pix">Pix</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Transferência">Transferência</option>
                    </select>
                  </div>
                </div>
              )}
              
              {!isFoiPago && (
                <div style={{ padding: '0.85rem', backgroundColor: 'var(--status-warning-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-warning)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                    O lançamento será criado com status <strong>"Previsto"</strong> na data de hoje. Você poderá marcá-lo como pago posteriormente na aba de Lançamentos.
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn-outline" onClick={() => setSessionToLog(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ backgroundColor: 'var(--status-success)', borderColor: 'var(--status-success)' }}>
                  <Check size={16} /> Confirmar Sessão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Histórico do Mês */}
      {selectedMonthHistory && (
        <div className="modal-overlay" onClick={() => setSelectedMonthHistory(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                Sessões em {selectedMonthHistory.split('-').reverse().join('/')}
              </h3>
              <button onClick={() => setSelectedMonthHistory(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
              {(() => {
                const sessoesNoMes = rituais.flatMap(rit => 
                  (rit.sessoesRealizadas || [])
                    .filter(s => s.data.startsWith(selectedMonthHistory))
                    .map(s => ({ ...s, ritualNome: rit.nome }))
                ).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

                if (sessoesNoMes.length === 0) {
                  return <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>Nenhuma sessão registrada neste mês.</div>;
                }

                const subtotal = sessoesNoMes.reduce((acc, s) => acc + s.valor, 0);

                return (
                  <>
                    {sessoesNoMes.map(sessao => (
                      <div key={sessao.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{sessao.ritualNome}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sessao.data.split('-').reverse().join('/')}</div>
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--status-error)' }}>
                          - R$ {sessao.valor.toFixed(2)}
                        </div>
                      </div>
                    ))}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0.75rem 0.5rem 0.75rem', marginTop: '0.5rem', borderTop: '2px dashed var(--border-color)' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>Subtotal do Mês</span>
                      <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--status-error)' }}>
                        - R$ {subtotal.toFixed(2)}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
