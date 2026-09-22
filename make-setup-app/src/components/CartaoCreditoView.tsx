import React, { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  X,
  Trash2,
  Pencil
} from 'lucide-react';
import type { CartaoCredito, FaturaItem } from '../types';
import { confirmDelete, showToastSuccess, showToastError } from '../utils/sweetAlert';
import { maskCurrency, unmaskCurrency, maskNumbersOnly } from '../utils/masks';

interface CartaoCreditoViewProps {
  cartoes: CartaoCredito[];
  faturas: FaturaItem[];
  onAddCartao: (novo: CartaoCredito) => void;
  onEditCartao: (editado: CartaoCredito) => void;
  onDeleteCartao: (id: string) => void;
  onAddFaturaItem: (item: FaturaItem) => void;
  onEditFaturaItem: (editado: FaturaItem) => void;
  onDeleteFaturaItem: (id: string) => void;
  onPagarFaturaCartao?: (cartaoId: string, valorFatura: number, valorPago: number, metodoPagamento: string) => void;
}

export const CartaoCreditoView: React.FC<CartaoCreditoViewProps> = ({
  cartoes,
  faturas,
  onAddCartao,
  onEditCartao,
  onDeleteCartao,
  onAddFaturaItem,
  onEditFaturaItem,
  onDeleteFaturaItem,
  onPagarFaturaCartao
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string>(cartoes[0]?.id || 'card_01');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaturaId, setEditingFaturaId] = useState<string | null>(null);

  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  // Form State Compra
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('Alimentação');
  const [valor, setValor] = useState('');
  const [parcela, setParcela] = useState('1/1');

  // Form State Pagamento
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [valorPago, setValorPago] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState('Pix');

  // Form State Novo Cartão
  const [nomeCartao, setNomeCartao] = useState('');
  const [banco, setBanco] = useState('');
  const [limiteTotal, setLimiteTotal] = useState('');
  const [diaFechamento, setDiaFechamento] = useState('25');
  const [diaVencimento, setDiaVencimento] = useState('5');
  const [ultimosDigitos, setUltimosDigitos] = useState('1234');

  const selectedCard = cartoes.find(c => c.id === selectedCardId) || cartoes[0];
  const cardFaturas = faturas.filter(f => f.cartaoId === selectedCardId);

  const handleDeleteCardWithConfirm = (card: CartaoCredito) => {
    confirmDelete(
      'Excluir Cartão de Crédito?',
      `Tem certeza que deseja excluir o cartão "${card.nomeCartao}"?`,
      () => onDeleteCartao(card.id)
    );
  };

  const handleDeleteItemWithConfirm = (item: FaturaItem) => {
    confirmDelete(
      'Remover Compra do Cartão?',
      `Excluir o lançamento "${item.descricao}" (R$ ${item.valor.toFixed(2)}) da fatura?`,
      () => onDeleteFaturaItem(item.id)
    );
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeCartao || !limiteTotal) return;

    const lim = unmaskCurrency(limiteTotal);

    if (editingCardId) {
      const target = cartoes.find(c => c.id === editingCardId);
      if (target) {
        onEditCartao({
          ...target,
          nomeCartao,
          banco: banco || 'Banco Digital',
          limiteTotal: lim,
          limiteDisponivel: lim - target.faturaAtual, // Adjust based on new limit
          diaFechamento: parseInt(diaFechamento),
          diaVencimento: parseInt(diaVencimento),
          ultimosDigitos: ultimosDigitos || '0000'
        });
        showToastSuccess(`Cartão "${nomeCartao}" atualizado! 💳`);
      }
    } else {
      const novo: CartaoCredito = {
        id: `card_${Date.now()}`,
        nomeCartao,
        banco: banco || 'Banco Digital',
        limiteTotal: lim,
        limiteDisponivel: lim,
        faturaAtual: 0,
        diaFechamento: parseInt(diaFechamento),
        diaVencimento: parseInt(diaVencimento),
        ultimosDigitos: ultimosDigitos || '0000'
      };
      onAddCartao(novo);
      showToastSuccess(`Cartão "${nomeCartao}" cadastrado! 💳`);
    }

    setIsCardModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || !valor || !selectedCard) return;

    if (editingFaturaId) {
      const target = faturas.find(f => f.id === editingFaturaId);
      if (target) {
        onEditFaturaItem({
          ...target,
          cartaoId: selectedCardId,
          descricao,
          categoria,
          valor: unmaskCurrency(valor),
          parcela: parcela !== '1/1' ? parcela : undefined,
        });
        showToastSuccess('Compra atualizada com sucesso!');
      }
    } else {
      const novo: FaturaItem = {
        id: `fat_${Date.now()}`,
        cartaoId: selectedCardId,
        descricao,
        categoria,
        valor: unmaskCurrency(valor),
        parcela: parcela !== '1/1' ? parcela : undefined,
        data: new Date().toISOString().split('T')[0]
      };
      onAddFaturaItem(novo);
      showToastSuccess('Compra lançada na fatura com sucesso!');
    }
    
    setIsModalOpen(false);
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valorPago || !selectedCard || !onPagarFaturaCartao) return;
    
    onPagarFaturaCartao(selectedCard.id, selectedCard.faturaAtual, unmaskCurrency(valorPago), metodoPagamento);
    setIsPaymentModalOpen(false);
  };

  const handleOpenAddCard = () => {
    setEditingCardId(null);
    setNomeCartao('');
    setBanco('');
    setLimiteTotal('');
    setDiaFechamento('25');
    setDiaVencimento('5');
    setUltimosDigitos('');
    setIsCardModalOpen(true);
  };

  const handleOpenEditCard = (card: CartaoCredito, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCardId(card.id);
    setNomeCartao(card.nomeCartao);
    setBanco(card.banco);
    setLimiteTotal(maskCurrency(card.limiteTotal));
    setDiaFechamento(card.diaFechamento.toString());
    setDiaVencimento(card.diaVencimento.toString());
    setUltimosDigitos(card.ultimosDigitos);
    setIsCardModalOpen(true);
  };

  const handleOpenAddFatura = () => {
    setEditingFaturaId(null);
    setDescricao('');
    setCategoria('Alimentação');
    setValor('');
    setParcela('1/1');
    setSelectedCardId(selectedCard.id);
    setIsModalOpen(true);
  };

  const handleOpenEditFatura = (item: FaturaItem) => {
    setEditingFaturaId(item.id);
    setDescricao(item.descricao);
    setCategoria(item.categoria);
    setValor(maskCurrency(item.valor));
    setParcela(item.parcela || '1/1');
    setSelectedCardId(item.cartaoId);
    setIsModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Cartões de Crédito & Faturas
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Gestão de limites, vencimentos e compras parceladas no cartão.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn-outline" onClick={handleOpenAddCard}>
            <Plus size={16} />
            <span>+ Novo Cartão</span>
          </button>
          
          <button className="btn-primary" onClick={handleOpenAddFatura}>
            <Plus size={16} />
            <span>+ Compra no Cartão</span>
          </button>
        </div>
      </div>

      {/* Cards List Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.25rem'
      }}>
        {cartoes.map(card => {
          const isSelected = card.id === selectedCardId;
          const pct = Math.min(Math.round((card.faturaAtual / card.limiteTotal) * 100), 100);

          return (
            <div
              key={card.id}
              onClick={() => setSelectedCardId(card.id)}
              className="moon-card moon-card-hover"
              style={{
                cursor: 'pointer',
                border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                backgroundColor: isSelected ? 'var(--bg-primary-light)' : 'var(--bg-card)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{card.nomeCartao}</h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{card.banco} • Final ****{card.ultimosDigitos}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CreditCard size={24} style={{ color: 'var(--color-primary)' }} />
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      onClick={(e) => handleOpenEditCard(card, e)}
                      style={{ color: 'var(--text-muted)', padding: '0.2rem' }}
                      title="Editar Cartão"
                      className="btn-icon-hover"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (cartoes.length <= 1) {
                          showToastError('Você precisa manter ao menos um cartão cadastrado.');
                          return;
                        }
                        handleDeleteCardWithConfirm(card);
                      }}
                      style={{ color: 'var(--status-error)', padding: '0.2rem' }}
                      title="Excluir Cartão"
                      className="btn-icon-hover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Fatura Atual:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                    R$ {card.faturaAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                  {card.faturaAtual > 0 && onPagarFaturaCartao && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCardId(card.id);
                        setValorPago(maskCurrency(card.faturaAtual));
                        setMetodoPagamento('Pix');
                        setIsPaymentModalOpen(true);
                      }}
                      style={{
                        padding: '0.2rem 0.6rem',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Pagar
                    </button>
                  )}
                </div>
              </div>

              <div style={{ height: '6px', backgroundColor: 'var(--bg-input)', borderRadius: '99px', overflow: 'hidden', marginBottom: '0.85rem' }}>
                <div style={{ height: '100%', width: `${pct}%`, backgroundColor: 'var(--color-primary)', transition: 'width 0.4s ease' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Limite Disponível: <strong>R$ {card.limiteDisponivel.toLocaleString('pt-BR')}</strong></span>
                <span>Vence Dia {card.diaVencimento}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invoice Items Table */}
      {selectedCard && (
        <div className="moon-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Detalhamento da Fatura ({selectedCard.nomeCartao})</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Fechamento dia {selectedCard.diaFechamento} | Vencimento dia {selectedCard.diaVencimento}</p>
            </div>
            <span className="badge badge-sage" style={{ fontSize: '0.75rem' }}>
              Fatura Aberta
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Data</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Descrição</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Categoria</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Parcela</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Valor (R$)</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {cardFaturas.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-muted)' }}>{item.data}</td>
                    <td style={{ padding: '0.85rem 0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {item.descricao}
                      {item.descricao.includes('Transbordo') && (
                        <span className="badge badge-warning" style={{ fontSize: '0.65rem', marginLeft: '0.5rem', backgroundColor: 'var(--status-warning-bg)', color: 'var(--status-warning)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>Rollover</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <span className="badge badge-sage" style={{ fontSize: '0.7rem' }}>{item.categoria}</span>
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      {item.parcela ? (
                        <span className="badge badge-terracota" style={{ fontSize: '0.68rem' }}>Parcela {item.parcela}</span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>À vista</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>
                      R$ {item.valor.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                      <button onClick={() => handleOpenEditFatura(item)} style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }} title="Editar Lançamento">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDeleteItemWithConfirm(item)} style={{ color: 'var(--status-error)' }} title="Excluir Lançamento">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add Novo Cartão */}
      {isCardModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCardModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{editingCardId ? 'Editar Cartão' : 'Cadastrar Novo Cartão'}</h3>
              <button onClick={() => setIsCardModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Nome do Cartão <span style={{ color: 'var(--status-error)' }}>*</span></label>
                <input type="text" required placeholder="Ex: Nubank Ultravioleta" value={nomeCartao} onChange={e => setNomeCartao(e.target.value)} style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Banco Emissor</label>
                  <input type="text" placeholder="Ex: C6 Bank / Itaú" value={banco} onChange={e => setBanco(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Limite Total (R$) <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <input type="text" required placeholder="R$ 15.000,00" value={limiteTotal} onChange={e => setLimiteTotal(maskCurrency(e.target.value))} style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.35rem' }}>Dia Fechamento</label>
                  <input type="number" min="1" max="31" value={diaFechamento} onChange={e => setDiaFechamento(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.35rem' }}>Dia Vencimento</label>
                  <input type="number" min="1" max="31" value={diaVencimento} onChange={e => setDiaVencimento(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.35rem' }}>Últimos 4 Dígitos</label>
                  <input type="text" maxLength={4} placeholder="1234" value={ultimosDigitos} onChange={e => setUltimosDigitos(maskNumbersOnly(e.target.value, 4))} style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-outline" onClick={() => setIsCardModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Cartão</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Compra no Cartão */}
      {isModalOpen && selectedCard && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{editingFaturaId ? 'Editar Compra' : 'Lançar Compra no Cartão'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Cartão <span style={{ color: 'var(--status-error)' }}>*</span></label>
                <select value={selectedCardId} onChange={e => setSelectedCardId(e.target.value)} style={{ width: '100%' }} required>
                  {cartoes.map(c => (
                    <option key={c.id} value={c.id}>{c.nomeCartao} ({c.banco})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Descrição do Estabelecimento/Compra <span style={{ color: 'var(--status-error)' }}>*</span></label>
                <input type="text" required placeholder="Ex: Mercado Livre / Amazon" value={descricao} onChange={e => setDescricao(e.target.value)} style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Categoria <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <select value={categoria} onChange={e => setCategoria(e.target.value)} style={{ width: '100%' }} required>
                    <option value="Alimentação">Alimentação</option>
                    <option value="Carros">Carros</option>
                    <option value="Assinaturas">Assinaturas</option>
                    <option value="Eletrônicos">Eletrônicos</option>
                    <option value="Vestuário">Vestuário</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Valor da Parcela (R$) <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <input type="text" required placeholder="R$ 150,00" value={valor} onChange={e => setValor(maskCurrency(e.target.value))} style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Parcelamento (ex: 2/6 ou 1/1)</label>
                <input type="text" placeholder="1/1" value={parcela} onChange={e => setParcela(e.target.value)} style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar no Cartão</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pagamento Fatura */}
      {isPaymentModalOpen && selectedCard && (
        <div className="modal-overlay" onClick={() => setIsPaymentModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Pagar Fatura</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePaySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: 'var(--bg-input)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Total da Fatura Atual</p>
                <h2 style={{ color: 'var(--color-primary)', margin: 0 }}>R$ {selectedCard.faturaAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Valor a ser Pago (R$) <span style={{ color: 'var(--status-error)' }}>*</span></label>
                <input type="text" required placeholder="R$ 0,00" value={valorPago} onChange={e => setValorPago(maskCurrency(e.target.value))} style={{ width: '100%', fontSize: '1.1rem', padding: '0.75rem' }} />
              </div>

              {unmaskCurrency(valorPago || '0') < selectedCard.faturaAtual && unmaskCurrency(valorPago || '0') > 0 && (
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-warning-bg)', borderLeft: '3px solid var(--status-warning)', color: 'var(--status-warning)', fontSize: '0.8rem', borderRadius: '4px' }}>
                  <strong>Aviso de Transbordo (Rollover):</strong> O saldo restante de R$ {(selectedCard.faturaAtual - unmaskCurrency(valorPago)).toFixed(2)} será rolado para o próximo mês com acréscimo de juros (12% a.m).
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Método de Pagamento</label>
                <select value={metodoPagamento} onChange={e => setMetodoPagamento(e.target.value)} style={{ width: '100%' }}>
                  <option value="Pix">Pix</option>
                  <option value="Saldo em Conta">Saldo em Conta</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-outline" onClick={() => setIsPaymentModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Confirmar Pagamento</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
