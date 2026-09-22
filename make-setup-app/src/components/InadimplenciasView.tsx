import React, { useState } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  Scale, 
  Clock, 
  X,
  Pencil,
  Trash2
} from 'lucide-react';
import type { Inadimplencia } from '../types';
import { confirmDelete, showToastSuccess } from '../utils/sweetAlert';

interface InadimplenciasViewProps {
  inadimplencias: Inadimplencia[];
  onQuitarInadimplencia: (id: string) => void;
  onAddInadimplencia: (nova: Inadimplencia) => void;
  onEditInadimplencia: (editada: Inadimplencia) => void;
  onDeleteInadimplencia: (id: string) => void;
}

export const InadimplenciasView: React.FC<InadimplenciasViewProps> = ({
  inadimplencias,
  onQuitarInadimplencia,
  onAddInadimplencia,
  onEditInadimplencia,
  onDeleteInadimplencia
}) => {
  const [filterTipo, setFilterTipo] = useState<'todos' | 'divida_propria' | 'a_receber'>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [credorOuDevedor, setCredorOuDevedor] = useState('');
  const [tipo, setTipo] = useState<'divida_propria' | 'a_receber'>('divida_propria');
  const [descricao, setDescricao] = useState('');
  const [valorOriginal, setValorOriginal] = useState('');
  const [jurosMulta, setJurosMulta] = useState('0');
  const [dataVencimentoOriginal, setDataVencimentoOriginal] = useState('');

  const filteredItems = inadimplencias.filter(item => filterTipo === 'todos' || item.tipo === filterTipo);

  // Metrics
  const totalDividasProprias = inadimplencias
    .filter(i => i.tipo === 'divida_propria' && i.status !== 'quitado')
    .reduce((acc, i) => acc + i.valorAtualizado, 0);

  const totalAReceber = inadimplencias
    .filter(i => i.tipo === 'a_receber' && i.status !== 'quitado')
    .reduce((acc, i) => acc + i.valorAtualizado, 0);

  const handleOpenAdd = () => {
    setEditingId(null);
    setCredorOuDevedor('');
    setTipo('divida_propria');
    setDescricao('');
    setValorOriginal('');
    setJurosMulta('0');
    setDataVencimentoOriginal(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Inadimplencia) => {
    setEditingId(item.id);
    setCredorOuDevedor(item.credorOuDevedor);
    setTipo(item.tipo);
    setDescricao(item.descricao);
    setValorOriginal(item.valorOriginal.toString());
    setJurosMulta(item.jurosMulta.toString());
    setDataVencimentoOriginal(item.dataVencimentoOriginal);
    setIsModalOpen(true);
  };

  const handleDeleteWithConfirm = (item: Inadimplencia) => {
    confirmDelete(
      'Excluir Pendência?',
      `Tem certeza que deseja excluir o registro de "${item.credorOuDevedor}" (R$ ${item.valorAtualizado.toFixed(2)})?`,
      () => onDeleteInadimplencia(item.id)
    );
  };

  const handleQuitarWithToast = (id: string, credor: string) => {
    onQuitarInadimplencia(id);
    showToastSuccess(`Pendência de "${credor}" liquidada com sucesso! 🎉`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credorOuDevedor || !valorOriginal) return;

    const valOrig = parseFloat(valorOriginal);
    const jur = parseFloat(jurosMulta || '0');

    if (editingId) {
      const target = inadimplencias.find(i => i.id === editingId);
      if (target) {
        const editada: Inadimplencia = {
          ...target,
          credorOuDevedor,
          tipo,
          descricao,
          valorOriginal: valOrig,
          jurosMulta: jur,
          valorAtualizado: valOrig + jur,
          dataVencimentoOriginal: dataVencimentoOriginal || target.dataVencimentoOriginal
        };
        onEditInadimplencia(editada);
        showToastSuccess('Pendência atualizada com sucesso!');
      }
    } else {
      const nova: Inadimplencia = {
        id: `inad_${Date.now()}`,
        credorOuDevedor,
        tipo,
        descricao,
        valorOriginal: valOrig,
        jurosMulta: jur,
        valorAtualizado: valOrig + jur,
        dataVencimentoOriginal: dataVencimentoOriginal || new Date().toISOString().split('T')[0],
        status: 'pendente'
      };
      onAddInadimplencia(nova);
      showToastSuccess('Pendência registrada com sucesso!');
    }

    setIsModalOpen(false);
    setEditingId(null);
    setCredorOuDevedor('');
    setValorOriginal('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Inadimplências, Negociações & Cobranças
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Gestão de dívidas em atraso (próprias) e empréstimos/pendências a receber de terceiros.
          </p>
        </div>

        <button className="btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>+ Nova Pendência / Dívida</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem'
      }}>
        <div className="moon-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Dívidas Próprias Pendentes</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-error)', marginTop: '0.25rem' }}>
            R$ {totalDividasProprias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--status-error)', fontWeight: 600 }}>Com juros e correções</span>
        </div>

        <div className="moon-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total a Receber de Terceiros</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-success)', marginTop: '0.25rem' }}>
            R$ {totalAReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--status-success)', fontWeight: 600 }}>Valores a cobrar</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="moon-card">
        
        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {[
            { id: 'todos', label: 'Todas as Pendências' },
            { id: 'divida_propria', label: 'Dívidas Próprias (-)' },
            { id: 'a_receber', label: 'A Receber (+)' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterTipo(f.id as any)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: 600,
                backgroundColor: filterTipo === f.id ? 'var(--bg-primary-light)' : 'transparent',
                color: filterTipo === f.id ? 'var(--color-primary)' : 'var(--text-muted)',
                border: filterTipo === f.id ? '1px solid var(--color-primary)' : '1px solid var(--border-color)'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Tipo</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Credor / Devedor</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Descrição</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Vencimento Original</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Valor Orig.</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Juros/Multa</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Valor Atualizado</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Quitação</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Editar/Excluir</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => {
                const isPropria = item.tipo === 'divida_propria';
                const isQuitado = item.status === 'quitado';

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: isQuitado ? 0.6 : 1 }}>
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <span className={isPropria ? 'badge badge-error' : 'badge badge-success'} style={{ fontSize: '0.68rem' }}>
                        {isPropria ? 'Dívida Própria' : 'A Receber'}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {item.credorOuDevedor}
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-muted)' }}>
                      {item.descricao}
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-muted)' }}>
                      {item.dataVencimentoOriginal}
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      {isQuitado ? (
                        <span className="badge badge-success" style={{ fontSize: '0.68rem' }}><CheckCircle2 size={12} /> Quitado</span>
                      ) : item.status === 'em_renegociacao' ? (
                        <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}><Scale size={12} /> Em Negociação</span>
                      ) : (
                        <span className="badge badge-error" style={{ fontSize: '0.68rem' }}><Clock size={12} /> Pendente</span>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                      R$ {item.valorOriginal.toFixed(2)}
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right', color: 'var(--status-error)' }}>
                      + R$ {item.jurosMulta.toFixed(2)}
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right', fontWeight: 700, color: isPropria ? 'var(--status-error)' : 'var(--status-success)', fontSize: '0.95rem' }}>
                      R$ {item.valorAtualizado.toFixed(2)}
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem', textAlign: 'center' }}>
                      {!isQuitado ? (
                        <button
                          onClick={() => handleQuitarWithToast(item.id, item.credorOuDevedor)}
                          className="btn-primary"
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                        >
                          Quitar
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--status-success)', fontWeight: 600 }}>Liquidado</span>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button onClick={() => handleOpenEdit(item)} style={{ color: 'var(--color-secondary)', padding: '0.25rem' }} title="Editar">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDeleteWithConfirm(item)} style={{ color: 'var(--status-error)', padding: '0.25rem' }} title="Excluir">
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

      {/* Modal Add / Edit Inadimplência */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                {editingId ? 'Editar Pendência' : 'Cadastrar Nova Pendência / Dívida'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Tipo de Pendência <span style={{ color: 'var(--status-error)' }}>*</span></label>
                <select value={tipo} onChange={e => setTipo(e.target.value as any)} style={{ width: '100%' }} required>
                  <option value="divida_propria">Dívida Própria (A Pagar)</option>
                  <option value="a_receber">A Receber (Cobrança de Terceiro)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Credor ou Devedor (Nome/Empresa) <span style={{ color: 'var(--status-error)' }}>*</span></label>
                <input type="text" required placeholder="Ex: Amil Saúde / Carlos Eduardo" value={credorOuDevedor} onChange={e => setCredorOuDevedor(e.target.value)} style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Descrição do Acordo / Motivo</label>
                <input type="text" placeholder="Ex: Mensalidade atrasada / Empréstimo conserto" value={descricao} onChange={e => setDescricao(e.target.value)} style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Valor Original (R$) <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <input type="number" step="0.01" required placeholder="300.00" value={valorOriginal} onChange={e => setValorOriginal(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Juros / Multa Acumulada (R$)</label>
                  <input type="number" step="0.01" placeholder="24.50" value={jurosMulta} onChange={e => setJurosMulta(e.target.value)} style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Data do Vencimento Original</label>
                <input type="date" value={dataVencimentoOriginal} onChange={e => setDataVencimentoOriginal(e.target.value)} style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">
                  {editingId ? 'Salvar Alterações' : 'Salvar Pendência'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
