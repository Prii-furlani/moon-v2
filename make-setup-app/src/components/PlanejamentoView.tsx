import React, { useState } from 'react';
import { 
  Target, Plus, PiggyBank, Pencil, Trash2, X, Compass,
  Sparkles, CheckCircle2, Home, GraduationCap, Plane, Car, Cpu, TrendingUp
} from 'lucide-react';
import type { MetaPlanejamento } from '../types';
import { confirmDelete, showToastSuccess } from '../utils/sweetAlert';
import { ImageUploader } from './ImageUploader';
import { maskCurrency, unmaskCurrency } from '../utils/masks';

interface PlanejamentoViewProps {
  metas: MetaPlanejamento[];
  onAddMeta: (nova: MetaPlanejamento) => void;
  onEditMeta: (editada: MetaPlanejamento) => void;
  onDeleteMeta: (id: string) => void;
  onAportarMeta: (id: string, valorAporte: number) => void;
  globalSearchTerm?: string;
}

export const PlanejamentoView: React.FC<PlanejamentoViewProps> = ({
  metas,
  onAddMeta,
  onEditMeta,
  onDeleteMeta,
  onAportarMeta,
  globalSearchTerm = ''
}) => {
  const [filterPrazo, setFilterPrazo] = useState<'todos' | 'curto' | 'medio' | 'longo'>('todos');
  const [filterCategoria, setFilterCategoria] = useState<string>('todos');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isAporteModalOpen, setIsAporteModalOpen] = useState(false);
  const [targetMeta, setTargetMeta] = useState<MetaPlanejamento | null>(null);
  const [valorAporteInput, setValorAporteInput] = useState('');

  // Form State
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<MetaPlanejamento['categoria']>('Moradia');
  const [valorMeta, setValorMeta] = useState('');
  const [valorAtual, setValorAtual] = useState('0');
  const [prazoTipo, setPrazoTipo] = useState<'curto' | 'medio' | 'longo'>('longo');
  const [prazoAnos, setPrazoAnos] = useState('4 a 6 anos');
  const [dataLimite, setDataLimite] = useState('2031-12-31');
  const [fotoUrl, setFotoUrl] = useState('');
  const [observacao, setObservacao] = useState('');

  // Category Icon Helper
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Moradia': return <Home size={16} />;
      case 'Educação': return <GraduationCap size={16} />;
      case 'Lazer & Viagens': return <Plane size={16} />;
      case 'Veículos': return <Car size={16} />;
      case 'Investimentos': return <TrendingUp size={16} />;
      case 'Tecnologia': return <Cpu size={16} />;
      default: return <Target size={16} />;
    }
  };

  // Filtered List
  const filteredMetas = metas.filter(m => {
    if (filterPrazo !== 'todos' && m.prazoTipo !== filterPrazo) return false;
    if (filterCategoria !== 'todos' && m.categoria !== filterCategoria) return false;
    if (globalSearchTerm) {
      const term = globalSearchTerm.toLowerCase();
      return (
        m.titulo.toLowerCase().includes(term) ||
        m.categoria.toLowerCase().includes(term) ||
        (m.observacao && m.observacao.toLowerCase().includes(term)) ||
        (m.prazoAnos && m.prazoAnos.toLowerCase().includes(term))
      );
    }
    return true;
  });

  // KPI Calculations
  const totalMetaGeral = metas.reduce((acc, m) => acc + m.valorMeta, 0);
  const totalAcumuladoGeral = metas.reduce((acc, m) => acc + m.valorAtual, 0);
  const pctProgressoGeral = totalMetaGeral > 0 ? Math.min(Math.round((totalAcumuladoGeral / totalMetaGeral) * 100), 100) : 0;

  // Handlers
  const handleOpenAdd = () => {
    setEditingId(null);
    setTitulo('');
    setCategoria('Moradia');
    setValorMeta('15000');
    setValorAtual('0');
    setPrazoTipo('longo');
    setPrazoAnos('4 a 6 anos');
    setDataLimite('2031-12-31');
    setFotoUrl('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=400');
    setObservacao('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: MetaPlanejamento) => {
    setEditingId(m.id);
    setTitulo(m.titulo);
    setCategoria(m.categoria);
    setValorMeta(maskCurrency(m.valorMeta));
    setValorAtual(maskCurrency(m.valorAtual));
    setPrazoTipo(m.prazoTipo);
    setPrazoAnos(m.prazoAnos || '4 a 6 anos');
    setDataLimite(m.dataLimite || '2031-12-31');
    setFotoUrl(m.fotoUrl || '');
    setObservacao(m.observacao || '');
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !valorMeta) return;

    const metaVal = unmaskCurrency(valorMeta);
    const atualVal = unmaskCurrency(valorAtual || '0');

    if (editingId) {
      const target = metas.find(m => m.id === editingId);
      if (target) {
        onEditMeta({
          ...target,
          titulo,
          categoria,
          valorMeta: metaVal,
          valorAtual: atualVal,
          prazoTipo,
          prazoAnos,
          dataLimite,
          fotoUrl,
          observacao
        });
        showToastSuccess(`Meta "${titulo}" atualizada! ✨`);
      }
    } else {
      const nova: MetaPlanejamento = {
        id: `meta_pln_${Date.now()}`,
        titulo,
        categoria,
        valorMeta: metaVal,
        valorAtual: atualVal,
        prazoTipo,
        prazoAnos,
        dataLimite,
        fotoUrl: fotoUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=400',
        observacao
      };
      onAddMeta(nova);
      showToastSuccess(`Sonho "${titulo}" adicionado ao seu Painel de Planejamento! 🌟`);
    }

    setIsModalOpen(false);
  };

  const handleOpenAporte = (m: MetaPlanejamento) => {
    setTargetMeta(m);
    setValorAporteInput(maskCurrency(500));
    setIsAporteModalOpen(true);
  };

  const handleConfirmAporte = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMeta) return;
    const val = unmaskCurrency(valorAporteInput || '0');
    if (val <= 0) return;

    onAportarMeta(targetMeta.id, val);
    setIsAporteModalOpen(false);
    showToastSuccess(`Aporte de R$ ${val.toFixed(2)} guardado para "${targetMeta.titulo}"! 🎉`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Title & Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Planejamento & Painel dos Sonhos ✨
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Planeje metas de médio a longo prazo (Moradia, Entrada de Imóvel, Viagens e Projetos) com acompanhamento de aportes.
          </p>
        </div>

        <button className="btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>+ Nova Meta dos Sonhos</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Total Meta dos Sonhos */}
        <div className="moon-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Total das Metas Planejadas</span>
            <Target size={20} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.35rem' }}>
            R$ {totalMetaGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{metas.length} meta(s) cadastrada(s)</span>
        </div>

        {/* Total Acumulado Guardado */}
        <div className="moon-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Total Guardado Até Agora</span>
            <PiggyBank size={20} style={{ color: 'var(--status-success)' }} />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--status-success)', marginTop: '0.35rem' }}>
            R$ {totalAcumuladoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--status-success)', fontWeight: 600 }}>
            {pctProgressoGeral}% do valor total atingido
          </span>
        </div>

        {/* Faltam para Atingir */}
        <div className="moon-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Falta Guardar</span>
            <Compass size={20} style={{ color: 'var(--color-secondary)' }} />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--color-secondary)', marginTop: '0.35rem' }}>
            R$ {Math.max(0, totalMetaGeral - totalAcumuladoGeral).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Para realização completa dos projetos</span>
        </div>
      </div>

      {/* Filter Tabs & Categories Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
        
        {/* Prazos Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            className={`btn-filter ${filterPrazo === 'todos' ? 'active' : ''}`}
            onClick={() => setFilterPrazo('todos')}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          >
            Todos os Prazos
          </button>
          <button 
            className={`btn-filter ${filterPrazo === 'curto' ? 'active' : ''}`}
            onClick={() => setFilterPrazo('curto')}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          >
            Curto Prazo (&lt; 1 ano)
          </button>
          <button 
            className={`btn-filter ${filterPrazo === 'medio' ? 'active' : ''}`}
            onClick={() => setFilterPrazo('medio')}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          >
            Médio Prazo (1-3 anos)
          </button>
          <button 
            className={`btn-filter ${filterPrazo === 'longo' ? 'active' : ''}`}
            onClick={() => setFilterPrazo('longo')}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          >
            Longo Prazo (4-6+ anos)
          </button>
        </div>

        {/* Categorias Filter Select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Categoria:</span>
          <select 
            value={filterCategoria} 
            onChange={e => setFilterCategoria(e.target.value)}
            style={{ fontSize: '0.82rem', padding: '0.35rem 0.65rem' }}
          >
            <option value="todos">Todas as Categorias</option>
            <option value="Moradia">Moradia (Apartamento/Imóvel)</option>
            <option value="Educação">Educação</option>
            <option value="Lazer & Viagens">Lazer & Viagens</option>
            <option value="Veículos">Veículos</option>
            <option value="Investimentos">Investimentos</option>
            <option value="Tecnologia">Tecnologia</option>
            <option value="Outros">Outros</option>
          </select>
        </div>
      </div>

      {/* Grid of Dream Cards (Painel dos Sonhos) */}
      {filteredMetas.length === 0 ? (
        <div className="moon-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
          <Sparkles size={48} style={{ color: 'var(--color-primary)', marginBottom: '1rem', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Nenhum sonho cadastrado nesta categoria ou prazo</h3>
          <p style={{ fontSize: '0.88rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
            Comece cadastrando sua primeira meta de médio ou longo prazo (como dar entrada no apartamento próprio, fazer uma grande viagem ou uma pós-graduação).
          </p>
          <button className="btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>+ Cadastrar Novo Sonho</span>
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredMetas.map(meta => {
            const pct = Math.min(Math.round((meta.valorAtual / meta.valorMeta) * 100), 100);
            const faltaGuardar = Math.max(0, meta.valorMeta - meta.valorAtual);

            // Calculation of Suggested Monthly Savings Rate based on remaining date
            const today = new Date();
            const targetDate = new Date(meta.dataLimite || '2030-12-31');
            const monthsLeft = Math.max(1, (targetDate.getFullYear() - today.getFullYear()) * 12 + (targetDate.getMonth() - today.getMonth()));
            const aporteMensalSugerido = faltaGuardar / monthsLeft;

            const isLongo = meta.prazoTipo === 'longo';
            const isMedio = meta.prazoTipo === 'medio';

            return (
              <div 
                key={meta.id} 
                className="moon-card moon-card-hover" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  padding: '0',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                {/* Top Inspiratory Image Cover */}
                <div style={{ height: '140px', width: '100%', position: 'relative', overflow: 'hidden', backgroundColor: 'var(--bg-input)' }}>
                  <img 
                    src={meta.fotoUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=400'} 
                    alt={meta.titulo}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
                  
                  {/* Category Badge & Actions on Image */}
                  <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    <span className="badge badge-sage" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'rgba(255,255,255,0.92)', color: 'var(--text-main)', fontWeight: 700 }}>
                      {getCategoryIcon(meta.categoria)}
                      <span>{meta.categoria}</span>
                    </span>
                  </div>

                  <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'flex', gap: '0.35rem' }}>
                    <button 
                      onClick={() => handleOpenEdit(meta)} 
                      style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', padding: '0.3rem', borderRadius: '50%', border: 'none' }}
                      title="Editar Meta"
                    >
                      <Pencil size={13} />
                    </button>
                    <button 
                      onClick={() => confirmDelete('Excluir Meta?', `Remover "${meta.titulo}"?`, () => onDeleteMeta(meta.id))} 
                      style={{ backgroundColor: 'rgba(220,53,69,0.85)', color: '#fff', padding: '0.3rem', borderRadius: '50%', border: 'none' }}
                      title="Excluir Meta"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div style={{ position: 'absolute', bottom: '0.6rem', left: '0.85rem', right: '0.85rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
                      {meta.titulo}
                    </h3>
                  </div>
                </div>

                {/* Card Content Body */}
                <div style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    {/* Prazo & Data Alvo */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', marginBottom: '0.5rem' }}>
                      <span className={`badge ${isLongo ? 'badge-primary' : isMedio ? 'badge-sage' : 'badge-terracota'}`} style={{ fontSize: '0.68rem' }}>
                        ⏳ {meta.prazoAnos || (isLongo ? '4 a 6 anos' : isMedio ? '1 a 3 anos' : '< 1 ano')}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        Meta Alvo: <strong>{meta.dataLimite || '2031'}</strong>
                      </span>
                    </div>

                    {/* Progress Bar & Amounts */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Acumulado:</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--status-success)' }}>
                        R$ {meta.valorAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / R$ {meta.valorMeta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div style={{ height: '7px', backgroundColor: 'var(--bg-input)', borderRadius: '99px', overflow: 'hidden', marginBottom: '0.6rem' }}>
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: 'var(--color-primary)', transition: 'width 0.4s ease' }} />
                    </div>

                    {/* Observação / Descrição */}
                    {meta.observacao && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-input)', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-xs)', margin: 0 }}>
                        💡 {meta.observacao}
                      </p>
                    )}
                  </div>

                  {/* Sugestão de Aporte Mensal & Botão Aportar */}
                  <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {faltaGuardar > 0 ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Aporte Mensal Sugerido:</span>
                        <strong style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                          R$ {aporteMensalSugerido.toFixed(2)}/mês ({monthsLeft} meses restatantes)
                        </strong>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--status-success)', fontWeight: 700, fontSize: '0.8rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                        <CheckCircle2 size={16} />
                        <span>Parabéns! Meta Conquistada com Sucesso! 🎉</span>
                      </div>
                    )}

                    <button 
                      className="btn-primary" 
                      onClick={() => handleOpenAporte(meta)}
                      style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem', padding: '0.5rem' }}
                    >
                      <PiggyBank size={15} />
                      <span>+ Guardar Valor Nesta Meta</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Cadastrar / Editar Meta dos Sonhos */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {editingId ? 'Editar Meta dos Sonhos' : 'Cadastrar Nova Meta no Painel dos Sonhos'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <ImageUploader 
                label="Foto / Imagem Inspiradora do Sonho"
                value={fotoUrl}
                onChange={setFotoUrl}
                aspectRatio="landscape"
              />

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Título do Sonho / Projeto <span style={{ color: 'var(--status-error)' }}>*</span></label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ex: Entrada do Apartamento Novo 🏢 ou Viagem para a Europa ✈️" 
                  value={titulo} 
                  onChange={e => setTitulo(e.target.value)} 
                  style={{ width: '100%' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Categoria <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <select value={categoria} onChange={e => setCategoria(e.target.value as any)} style={{ width: '100%' }} required>
                    <option value="Moradia">Moradia (Entrada do Apto / Casa)</option>
                    <option value="Educação">Educação (Pós-Graduação / Cursos)</option>
                    <option value="Lazer & Viagens">Lazer & Viagens</option>
                    <option value="Veículos">Veículos</option>
                    <option value="Investimentos">Investimentos</option>
                    <option value="Tecnologia">Tecnologia</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Prazo Estimado <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <select 
                    value={prazoTipo} 
                    onChange={e => {
                      const t = e.target.value as any;
                      setPrazoTipo(t);
                      if (t === 'curto') setPrazoAnos('Até 1 ano');
                      else if (t === 'medio') setPrazoAnos('1 a 3 anos');
                      else setPrazoAnos('4 a 6 anos');
                    }} 
                    style={{ width: '100%' }} 
                    required
                  >
                    <option value="curto">Curto Prazo (&lt; 1 ano)</option>
                    <option value="medio">Médio Prazo (1 a 3 anos)</option>
                    <option value="longo">Longo Prazo (4 a 6+ anos)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Valor Alvo da Meta (R$) <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <input 
                    type="text"
                    required 
                    placeholder="R$ 15.000,00" 
                    value={valorMeta} 
                    onChange={e => setValorMeta(maskCurrency(e.target.value))} 
                    style={{ width: '100%' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Valor Já Guardado (R$)</label>
                  <input 
                    type="text"
                    placeholder="R$ 0,00" 
                    value={valorAtual} 
                    onChange={e => setValorAtual(maskCurrency(e.target.value))} 
                    style={{ width: '100%' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Descrição do Prazo (Texto)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 4 a 6 anos ou Em 2030" 
                    value={prazoAnos} 
                    onChange={e => setPrazoAnos(e.target.value)} 
                    style={{ width: '100%' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Data Alvo Limite</label>
                  <input 
                    type="date" 
                    value={dataLimite} 
                    onChange={e => setDataLimite(e.target.value)} 
                    style={{ width: '100%' }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Observação / Detalhes</label>
                <textarea 
                  rows={2} 
                  placeholder="Ex: Valor necessário para dar entrada na planta do apartamento próprio." 
                  value={observacao} 
                  onChange={e => setObservacao(e.target.value)} 
                  style={{ width: '100%' }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Meta dos Sonhos</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Guardar Valor na Meta */}
      {isAporteModalOpen && targetMeta && (
        <div className="modal-overlay" onClick={() => setIsAporteModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Aportar no Sonho: {targetMeta.titulo}</h3>
              <button onClick={() => setIsAporteModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmAporte} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Valor a Guardar (R$) <span style={{ color: 'var(--status-error)' }}>*</span></label>
                <input 
                  type="text"
                  required 
                  placeholder="R$ 500,00" 
                  value={valorAporteInput} 
                  onChange={e => setValorAporteInput(maskCurrency(e.target.value))} 
                  style={{ width: '100%' }} 
                />
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                💡 Cada aporte mensal aproxima você da conquista do seu sonho!
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-outline" onClick={() => setIsAporteModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Confirmar Aporte</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
