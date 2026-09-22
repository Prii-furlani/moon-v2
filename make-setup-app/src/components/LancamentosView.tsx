import React, { useState } from 'react';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  X,
  Repeat,
  Pencil,
  Trash2
} from 'lucide-react';
import type { Lancamento, TransactionType } from '../types';
import { confirmDelete, showToastSuccess } from '../utils/sweetAlert';
import { maskCurrency, unmaskCurrency } from '../utils/masks';

interface LancamentosViewProps {
  lancamentos: Lancamento[];
  onAddLancamento: (novo: Lancamento) => void;
  onEditLancamento: (editado: Lancamento) => void;
  onEditLancamentoProgressivo: (idAntigo: string, novoLancamento: Lancamento, mesReferencia: string) => void;
  onDeleteLancamento: (id: string) => void;
  globalSearchTerm?: string;
}

export const LancamentosView: React.FC<LancamentosViewProps> = ({
  lancamentos,
  onAddLancamento,
  onEditLancamento,
  onEditLancamentoProgressivo,
  onDeleteLancamento
}) => {
  const [filterType, setFilterType] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('Alimentação');
  const [tipo, setTipo] = useState<TransactionType>('receita');
  const [valor, setValor] = useState('');
  const [dia, setDia] = useState('5');
  const [recorrente, setRecorrente] = useState(false);
  const [mesEspecifico, setMesEspecifico] = useState('');
  const [status, setStatus] = useState<'realizado' | 'previsto'>('realizado');
  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [dataPagamento, setDataPagamento] = useState('');

  // Progressive Edit States
  const [isProgressiveEdit, setIsProgressiveEdit] = useState(false);
  const [progressiveMonth, setProgressiveMonth] = useState('');

  // Computed metrics
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

  const entradasPrevistas = lancamentos
    .filter(l => l.tipo === 'receita' && isLancamentoAtivo(l))
    .reduce((acc, l) => acc + l.valor, 0);

  const saidasFixas = lancamentos
    .filter(l => l.tipo === 'despesa' && isLancamentoAtivo(l))
    .reduce((acc, l) => acc + l.valor, 0);

  const resultadoProjetado = entradasPrevistas - saidasFixas;

  // Filtered List
  const filteredLancamentos = lancamentos.filter(item => {
    const matchesFilter = filterType === 'todos' || item.tipo === filterType;
    const matchesSearch = item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setDescricao('');
    setCategoria('Alimentação');
    setTipo('receita');
    setValor('');
    setDia('5');
    setRecorrente(false);
    setMesEspecifico('');
    setStatus('realizado');
    setMetodoPagamento('');
    setDataPagamento('');
    setIsProgressiveEdit(false);
    setProgressiveMonth('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Lancamento) => {
    setEditingId(item.id);
    setDescricao(item.descricao);
    setCategoria(item.categoria);
    setTipo(item.tipo);
    setValor(maskCurrency(item.valor));
    setDia(item.dia.toString());
    setRecorrente(item.recorrente || false);
    setMesEspecifico(item.mesEspecifico || '');
    setStatus(item.status);
    setMetodoPagamento(item.metodoPagamento || '');
    setDataPagamento(item.dataPagamento || '');
    setIsProgressiveEdit(false);
    setProgressiveMonth('');
    setIsModalOpen(true);
  };

  const handleDelete = (item: Lancamento) => {
    confirmDelete(
      'Excluir Lançamento?',
      `Tem certeza que deseja excluir "${item.descricao}" (R$ ${item.valor.toFixed(2)})?`,
      () => onDeleteLancamento(item.id)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || !valor) return;

    if (editingId) {
      const editado: Lancamento = {
        id: editingId,
        descricao,
        categoria,
        tipo,
        valor: unmaskCurrency(valor),
        dia: parseInt(dia),
        recorrente,
        mesEspecifico: !recorrente && mesEspecifico ? mesEspecifico : undefined,
        status,
        metodoPagamento: status === 'realizado' ? metodoPagamento : undefined,
        dataPagamento: status === 'realizado' ? dataPagamento : undefined
      };

      if (isProgressiveEdit && progressiveMonth && recorrente) {
        onEditLancamentoProgressivo(editingId, editado, progressiveMonth);
        showToastSuccess(`Alteração projetada a partir de ${progressiveMonth}!`);
      } else {
        onEditLancamento(editado);
        showToastSuccess('Lançamento atualizado com sucesso!');
      }
    } else {
      const novo: Lancamento = {
        id: `lan_${Date.now()}`,
        descricao,
        categoria,
        tipo,
        valor: unmaskCurrency(valor),
        dia: parseInt(dia),
        recorrente,
        mesEspecifico: !recorrente && mesEspecifico ? mesEspecifico : undefined,
        status,
        metodoPagamento: status === 'realizado' ? metodoPagamento : undefined,
        dataPagamento: status === 'realizado' ? dataPagamento : undefined
      };
      onAddLancamento(novo);
      showToastSuccess('Lançamento criado com sucesso!');
    }

    setIsModalOpen(false);
    setEditingId(null);
    setDescricao('');
    setValor('');
    setMesEspecifico('');
    setIsProgressiveEdit(false);
    setProgressiveMonth('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header & Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Lançamentos (Entradas & Saídas)
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Controle de fluxo financeiro, salários, freelas e custos operacionais fixos.
          </p>
        </div>

        <button className="btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>+ Novo Lançamento</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem'
      }}>
        <div className="moon-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Entradas Previstas</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-success)', marginTop: '0.35rem' }}>
            + R$ {entradasPrevistas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="moon-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Saídas Fixas</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-error)', marginTop: '0.35rem' }}>
            - R$ {saidasFixas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="moon-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Resultado Projetado</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.35rem' }}>
            R$ {resultadoProjetado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Controls & Table Card */}
      <div className="moon-card">
        
        {/* Filters & Search Toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}>
          
          {/* Tabs Filter */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--bg-input)',
            padding: '3px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)'
          }}>
            {(['todos', 'receita', 'despesa'] as const).map(ft => (
              <button
                key={ft}
                onClick={() => setFilterType(ft)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  backgroundColor: filterType === ft ? 'var(--bg-card)' : 'transparent',
                  color: filterType === ft ? 'var(--color-primary)' : 'var(--text-muted)',
                  boxShadow: filterType === ft ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {ft === 'todos' ? 'Todos' : ft === 'receita' ? 'Receita (+)' : 'Despesa (-)'}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder="Filtrar por nome ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.4rem', height: '36px', fontSize: '0.82rem' }}
            />
          </div>

        </div>

        {/* Transactions Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Tipo</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Descrição</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Categoria</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Dia do Mês</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Recorrência</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Valor (R$)</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredLancamentos.map(item => {
                const isReceita = item.tipo === 'receita';

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.15s ease' }}>
                    
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        backgroundColor: isReceita ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
                        color: isReceita ? 'var(--status-success)' : 'var(--status-error)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isReceita ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span>{item.descricao}</span>
                        {item.status === 'realizado' && item.metodoPagamento && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            💳 {item.metodoPagamento} {item.dataPagamento ? `em ${item.dataPagamento.split('-').reverse().join('/')}` : ''}
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <span className="badge badge-sage" style={{ fontSize: '0.7rem' }}>
                        {item.categoria}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-muted)' }}>
                      Dia {item.dia}
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-muted)' }}>
                      {item.recorrente ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', color: 'var(--color-secondary)' }}>
                          <Repeat size={13} /> Mensal
                          {item.dataFimRecorrencia && item.dataFimRecorrencia < currentMonthYYYYMM && (
                            <span className="badge" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)', fontSize: '0.65rem' }}>Antigo</span>
                          )}
                          {item.dataInicioRecorrencia && item.dataInicioRecorrencia > currentMonthYYYYMM && (
                            <span className="badge" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--color-primary)', fontSize: '0.65rem' }}>Futuro</span>
                          )}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.78rem' }}>
                          Pontual {item.mesEspecifico && `(${item.mesEspecifico})`}
                        </span>
                      )}
                    </td>                    <td style={{ 
                      padding: '0.85rem 0.5rem', 
                      textAlign: 'right', 
                      fontWeight: 700, 
                      fontSize: '0.95rem',
                      color: isReceita ? 'var(--status-success)' : 'var(--status-error)' 
                    }}>
                      {isReceita ? '+' : '-'} R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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

      {/* Modal Add / Edit Lançamento */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                {editingId ? 'Editar Lançamento' : 'Cadastrar Novo Lançamento'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Tipo <span style={{ color: 'var(--status-error)' }}>*</span></label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input type="radio" name="tipo" checked={tipo === 'receita'} onChange={() => setTipo('receita')} />
                    <span>Receita (+)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input type="radio" name="tipo" checked={tipo === 'despesa'} onChange={() => setTipo('despesa')} />
                    <span>Despesa (-)</span>
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Descrição <span style={{ color: 'var(--status-error)' }}>*</span></label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Consultoria de Software"
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Categoria <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <select value={categoria} onChange={e => setCategoria(e.target.value)} style={{ width: '100%' }} required>
                    <option value="Renda Principal">Renda Principal</option>
                    <option value="Renda Extra">Renda Extra</option>
                    <option value="Moradia">Moradia</option>
                    <option value="Utilidades">Utilidades</option>
                    <option value="Alimentação">Alimentação</option>
                    <option value="Saúde">Saúde</option>
                    <option value="Transporte">Transporte</option>
                    <option value="Pets">Pets</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Valor (R$) <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <input 
                    type="text"
                    required
                    placeholder="R$ 0,00"
                    value={valor}
                    onChange={e => setValor(maskCurrency(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Dia do Vencimento/Recebimento <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <input 
                    type="number" 
                    min="1" 
                    max="31"
                    required
                    value={dia} 
                    onChange={e => setDia(e.target.value)} 
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                <input type="checkbox" checked={recorrente} onChange={e => {
                  setRecorrente(e.target.checked);
                  if (e.target.checked) {
                    setMesEspecifico('');
                  }
                }} />
                <span>Repetir mensalmente (Lançamento Recorrente)</span>
              </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem', padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Data do Pagamento (Opcional)</label>
                    <input 
                      type="date"
                      value={dataPagamento}
                      onChange={e => setDataPagamento(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Método de Pagamento</label>
                    <select value={metodoPagamento} onChange={e => setMetodoPagamento(e.target.value)} style={{ width: '100%' }}>
                      <option value="">Não especificado</option>
                      <option value="Pix">Pix</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Transferência">Transferência</option>
                    </select>
                  </div>
                </div>

              {!recorrente && (
                <div style={{ marginTop: '0.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Mês Específico (Opcional - Ex: 13º Salário)</label>
                  <input 
                    type="month" 
                    value={mesEspecifico} 
                    onChange={e => setMesEspecifico(e.target.value)} 
                    style={{ width: '100%', maxWidth: '200px' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>Deixe vazio se for apenas um ganho/gasto deste mês.</span>
                </div>
              )}

              {editingId && recorrente && (
                <div style={{ marginTop: '0.75rem', backgroundColor: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={isProgressiveEdit} onChange={e => setIsProgressiveEdit(e.target.checked)} />
                    <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Aplicar novo valor apenas a partir de um mês específico (Preservar Histórico Passado)</span>
                  </label>
                  
                  {isProgressiveEdit && (
                    <div style={{ marginTop: '0.85rem' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>A partir de qual mês este valor passa a valer? <span style={{ color: 'var(--status-error)' }}>*</span></label>
                      <input 
                        type="month" 
                        required={isProgressiveEdit}
                        value={progressiveMonth} 
                        onChange={e => setProgressiveMonth(e.target.value)} 
                        style={{ width: '100%', maxWidth: '200px' }}
                      />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>Meses anteriores manterão o valor antigo no fluxo de caixa anual.</span>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? 'Salvar Alterações' : 'Salvar Lançamento'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
