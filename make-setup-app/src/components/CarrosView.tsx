import React, { useState } from 'react';
import { 
  Fuel, 
  Wrench, 
  Gauge, 
  X,
  Plus,
  Trash2,
  Pencil,
  Landmark,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { Veiculo, Abastecimento, ManutencaoVeiculo } from '../types';
import { confirmDelete, showToastSuccess, showToastError } from '../utils/sweetAlert';
import { ImageUploader } from './ImageUploader';
import { 
  maskPlaca, maskKM, unmaskKM, 
  maskLitros, unmaskLitros, 
  maskCurrency, unmaskCurrency 
} from '../utils/masks';

interface CarrosViewProps {
  veiculos: Veiculo[];
  abastecimentos: Abastecimento[];
  manutencoes: ManutencaoVeiculo[];
  onAddVeiculo: (novo: Veiculo) => void;
  onEditVeiculo: (editado: Veiculo) => void;
  onDeleteVeiculo: (id: string) => void;
  onAddAbastecimento: (novo: Abastecimento) => void;
  onEditAbastecimento: (editado: Abastecimento) => void;
  onDeleteAbastecimento: (id: string) => void;
  onAddManutencao: (nova: ManutencaoVeiculo) => void;
  onEditManutencao: (editada: ManutencaoVeiculo) => void;
  onDeleteManutencao: (id: string) => void;
}

export const CarrosView: React.FC<CarrosViewProps> = ({
  veiculos,
  abastecimentos,
  manutencoes,
  onAddVeiculo,
  onEditVeiculo,
  onDeleteVeiculo,
  onAddAbastecimento,
  onEditAbastecimento,
  onDeleteAbastecimento,
  onAddManutencao,
  onEditManutencao,
  onDeleteManutencao
}) => {
  const [selectedVeiculoId, setSelectedVeiculoId] = useState<string>(veiculos[0]?.id || 'veic_01');
  const [carouselStartIndex, setCarouselStartIndex] = useState<number>(0);
  const [isVeiculoModalOpen, setIsVeiculoModalOpen] = useState(false);
  const [editingVeiculoId, setEditingVeiculoId] = useState<string | null>(null);

  // Auto-scroll carousel window to selected vehicle if out of view
  React.useEffect(() => {
    const selIdx = veiculos.findIndex(v => v.id === selectedVeiculoId);
    if (selIdx !== -1) {
      if (selIdx < carouselStartIndex) {
        setCarouselStartIndex(selIdx);
      } else if (selIdx >= carouselStartIndex + 3) {
        setCarouselStartIndex(selIdx - 2);
      }
    }
  }, [selectedVeiculoId, veiculos]);
  
  const [isAbastModalOpen, setIsAbastModalOpen] = useState(false);
  const [editingAbastId, setEditingAbastId] = useState<string | null>(null);
  
  const [isManutModalOpen, setIsManutModalOpen] = useState(false);
  const [editingManutId, setEditingManutId] = useState<string | null>(null);

  // Form State Novo Veículo (com Financiamento)
  const [nomeVeiculo, setNomeVeiculo] = useState('');
  const [marcaModelo, setMarcaModelo] = useState('');
  const [placa, setPlaca] = useState('');
  const [kmAtualVeiculo, setKmAtualVeiculo] = useState('');
  const [veiculoFotoUrl, setVeiculoFotoUrl] = useState('');
  const [financiado, setFinanciado] = useState(false);
  const [valorParcelaFinanciamento, setValorParcelaFinanciamento] = useState('');
  const [parcelasTotaisFinanciamento, setParcelasTotaisFinanciamento] = useState('');
  const [parcelasPagasFinanciamento, setParcelasPagasFinanciamento] = useState('');
  const [diaVencimentoFinanciamento, setDiaVencimentoFinanciamento] = useState('10');
  const [bancoFinanciamento, setBancoFinanciamento] = useState('');

  // Form State Abastecimento
  const [posto, setPosto] = useState('');
  const [litros, setLitros] = useState('');
  const [kmAtual, setKmAtual] = useState('');
  const [valorAbast, setValorAbast] = useState('');

  // Form State Manutenção
  const [descManut, setDescManut] = useState('');
  const [oficina, setOficina] = useState('');
  const [valorTotalManut, setValorTotalManut] = useState('');
  const [parcelasTotal, setParcelasTotal] = useState('6');

  const selectedVeiculo = veiculos.find(v => v.id === selectedVeiculoId) || veiculos[0];
  const veicAbastecimentos = abastecimentos.filter(a => a.veiculoId === selectedVeiculoId);
  const veicManutencoes = manutencoes.filter(m => m.veiculoId === selectedVeiculoId);

  // Compute metrics
  const totalAbastMes = veicAbastecimentos.reduce((acc, a) => acc + a.valorTotal, 0);
  const parcelasAtivasMes = veicManutencoes
    .filter(m => m.ativa)
    .reduce((acc, m) => acc + m.valorParcela, 0);
  
  const parcelaFinanciamentoMes = (selectedVeiculo?.financiado && selectedVeiculo.valorParcelaFinanciamento) ? selectedVeiculo.valorParcelaFinanciamento : 0;
  const totalGastoVeiculoMes = totalAbastMes + parcelasAtivasMes + parcelaFinanciamentoMes;

  const handleDeleteVeiculoWithConfirm = (v: Veiculo) => {
    confirmDelete(
      'Excluir Veículo?',
      `Tem certeza que deseja excluir o veículo "${v.nome}" (${v.placa})?`,
      () => onDeleteVeiculo(v.id)
    );
  };

  const handleDeleteAbastWithConfirm = (a: Abastecimento) => {
    confirmDelete(
      'Excluir Abastecimento?',
      `Remover registro de abastecimento no ${a.posto} (R$ ${a.valorTotal.toFixed(2)})?`,
      () => onDeleteAbastecimento(a.id)
    );
  };

  const handleDeleteManutWithConfirm = (m: ManutencaoVeiculo) => {
    confirmDelete(
      'Excluir Manutenção?',
      `Remover parcela de manutenção "${m.descricao}" (R$ ${m.valorParcela.toFixed(2)}/mês)?`,
      () => onDeleteManutencao(m.id)
    );
  };

  const handlePagarParcelaFinanciamento = (v: Veiculo) => {
    const pagas = (v.parcelasPagasFinanciamento || 0) + 1;
    const totais = v.parcelasTotaisFinanciamento || 1;
    if (pagas > totais) {
      showToastError('Todas as parcelas do financiamento já foram pagas!');
      return;
    }
    onEditVeiculo({
      ...v,
      parcelasPagasFinanciamento: pagas
    });
    showToastSuccess(`Parcela ${pagas}/${totais} registrada como PAGA! 🚘🎉`);
  };

  const handleVeiculoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeVeiculo || !placa) return;

    const defaultFallback = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=400';

    const financiamentoData = financiado ? {
      financiado: true,
      valorParcelaFinanciamento: unmaskCurrency(valorParcelaFinanciamento),
      parcelasTotaisFinanciamento: parseInt(parcelasTotaisFinanciamento || '1'),
      parcelasPagasFinanciamento: parseInt(parcelasPagasFinanciamento || '0'),
      diaVencimentoFinanciamento: parseInt(diaVencimentoFinanciamento || '10'),
      bancoFinanciamento: bancoFinanciamento || 'Banco / Financeira'
    } : {
      financiado: false,
      valorParcelaFinanciamento: 0,
      parcelasTotaisFinanciamento: 0,
      parcelasPagasFinanciamento: 0,
      diaVencimentoFinanciamento: undefined,
      bancoFinanciamento: undefined
    };

    if (editingVeiculoId) {
      const target = veiculos.find(v => v.id === editingVeiculoId);
      if (target) {
        onEditVeiculo({
          ...target,
          nome: nomeVeiculo,
          marcaModelo: marcaModelo || '',
          placa,
          fotoUrl: veiculoFotoUrl || target.fotoUrl || defaultFallback,
          kmAtual: unmaskKM(kmAtualVeiculo),
          ...financiamentoData
        });
        showToastSuccess(`Veículo atualizado! 🚗`);
      }
    } else {
      const novo: Veiculo = {
        id: `veic_${Date.now()}`,
        nome: nomeVeiculo,
        marcaModelo: marcaModelo || '',
        placa,
        fotoUrl: veiculoFotoUrl || defaultFallback,
        kmAtual: unmaskKM(kmAtualVeiculo),
        gastoMensalEstimado: 500,
        ...financiamentoData
      };
      onAddVeiculo(novo);
      showToastSuccess(`Veículo "${nomeVeiculo}" cadastrado com sucesso! 🚗`);
    }
    
    setIsVeiculoModalOpen(false);
  };

  const handleAbastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valorAbast || !litros) return;

    if (editingAbastId) {
      const target = abastecimentos.find(a => a.id === editingAbastId);
      if (target) {
        onEditAbastecimento({
          ...target,
          posto: posto || 'Posto de Gasolina Local',
          litros: unmaskLitros(litros),
          kmAtual: unmaskKM(kmAtual) || target.kmAtual,
          valorTotal: unmaskCurrency(valorAbast)
        });
        showToastSuccess('Abastecimento atualizado! ⛽');
      }
    } else {
      const novo: Abastecimento = {
        id: `abs_${Date.now()}`,
        veiculoId: selectedVeiculo.id,
        veiculoNome: selectedVeiculo.nome,
        posto: posto || 'Posto de Gasolina Local',
        litros: unmaskLitros(litros),
        kmAtual: unmaskKM(kmAtual) || selectedVeiculo.kmAtual + 300,
        valorTotal: unmaskCurrency(valorAbast),
        data: new Date().toISOString().split('T')[0]
      };
      onAddAbastecimento(novo);
      showToastSuccess('Abastecimento registrado! ⛽');
    }
    
    setIsAbastModalOpen(false);
  };

  const handleManutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descManut || !valorTotalManut) return;

    const tot = unmaskCurrency(valorTotalManut);
    const numParc = parseInt(parcelasTotal);

    if (editingManutId) {
      const target = manutencoes.find(m => m.id === editingManutId);
      if (target) {
        onEditManutencao({
          ...target,
          descricao: descManut,
          oficina: oficina || 'Oficina Mecânica',
          valorTotal: tot,
          parcelasTotal: numParc,
          valorParcela: tot / numParc
        });
        showToastSuccess('Manutenção atualizada! 🔧');
      }
    } else {
      const nova: ManutencaoVeiculo = {
        id: `manut_${Date.now()}`,
        veiculoId: selectedVeiculo.id,
        veiculoNome: selectedVeiculo.nome,
        descricao: descManut,
        oficina: oficina || 'Oficina Mecânica',
        valorTotal: tot,
        parcelasTotal: numParc,
        parcelaAtual: 1,
        valorParcela: tot / numParc,
        dataInicio: new Date().toISOString().split('T')[0],
        ativa: true
      };
      onAddManutencao(nova);
      showToastSuccess('Manutenção parcelada cadastrada! 🔧');
    }
    
    setIsManutModalOpen(false);
  };

  const handleOpenAddVeiculo = () => {
    setEditingVeiculoId(null);
    setNomeVeiculo('');
    setMarcaModelo('');
    setPlaca('');
    setKmAtualVeiculo('');
    setVeiculoFotoUrl('');
    setFinanciado(false);
    setValorParcelaFinanciamento('');
    setParcelasTotaisFinanciamento('');
    setParcelasPagasFinanciamento('');
    setDiaVencimentoFinanciamento('10');
    setBancoFinanciamento('');
    setIsVeiculoModalOpen(true);
  };

  const handleOpenEditVeiculo = (v: Veiculo, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingVeiculoId(v.id);
    setNomeVeiculo(v.nome);
    setMarcaModelo(v.marcaModelo);
    setPlaca(v.placa);
    setKmAtualVeiculo(v.kmAtual.toString());
    setVeiculoFotoUrl(v.fotoUrl || '');
    setFinanciado(!!v.financiado);
    setValorParcelaFinanciamento(v.valorParcelaFinanciamento?.toString() || '');
    setParcelasTotaisFinanciamento(v.parcelasTotaisFinanciamento?.toString() || '');
    setParcelasPagasFinanciamento(v.parcelasPagasFinanciamento?.toString() || '');
    setDiaVencimentoFinanciamento(v.diaVencimentoFinanciamento?.toString() || '10');
    setBancoFinanciamento(v.bancoFinanciamento || '');
    setIsVeiculoModalOpen(true);
  };

  const handleOpenAddAbast = () => {
    setEditingAbastId(null);
    setPosto('');
    setLitros('');
    setKmAtual('');
    setValorAbast('');
    setIsAbastModalOpen(true);
  };

  const handleOpenEditAbast = (a: Abastecimento) => {
    setEditingAbastId(a.id);
    setPosto(a.posto);
    setLitros(maskLitros(a.litros));
    setKmAtual(maskKM(a.kmAtual));
    setValorAbast(maskCurrency(a.valorTotal));
    setIsAbastModalOpen(true);
  };

  const handleOpenAddManut = () => {
    setEditingManutId(null);
    setDescManut('');
    setOficina('');
    setValorTotalManut('');
    setParcelasTotal('6');
    setIsManutModalOpen(true);
  };

  const handleOpenEditManut = (m: ManutencaoVeiculo) => {
    setEditingManutId(m.id);
    setDescManut(m.descricao);
    setOficina(m.oficina);
    setValorTotalManut(maskCurrency(m.valorTotal));
    setParcelasTotal(m.parcelasTotal.toString());
    setIsManutModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Módulo Veículos (Carros & Motos)
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Gestão de combustível, revisões de emergência e parcelamento de manutenções.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn-outline" onClick={handleOpenAddVeiculo}>
            <Plus size={16} />
            <span>+ Cadastrar Veículo</span>
          </button>
          
          <button className="btn-secondary" onClick={handleOpenAddAbast}>
            <Fuel size={16} />
            <span>+ Abastecimento</span>
          </button>
          
          <button className="btn-primary" onClick={handleOpenAddManut}>
            <Wrench size={16} />
            <span>+ Manutenção / Parcela</span>
          </button>
        </div>
      </div>

      {/* Vehicle Selector Carousel (Máximo 3 Cards Visíveis por Vez) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {veiculos.length > 3 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.25rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Mostrando {carouselStartIndex + 1} - {Math.min(carouselStartIndex + 3, veiculos.length)} de {veiculos.length} veículos
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                className="btn-outline"
                onClick={() => setCarouselStartIndex(prev => Math.max(0, prev - 1))}
                disabled={carouselStartIndex === 0}
                style={{ padding: '0.35rem 0.65rem', opacity: carouselStartIndex === 0 ? 0.4 : 1, cursor: carouselStartIndex === 0 ? 'not-allowed' : 'pointer' }}
                title="Veículo anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="btn-outline"
                onClick={() => setCarouselStartIndex(prev => Math.min(veiculos.length - 3, prev + 1))}
                disabled={carouselStartIndex + 3 >= veiculos.length}
                style={{ padding: '0.35rem 0.65rem', opacity: carouselStartIndex + 3 >= veiculos.length ? 0.4 : 1, cursor: carouselStartIndex + 3 >= veiculos.length ? 'not-allowed' : 'pointer' }}
                title="Próximo veículo"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '1rem' 
        }}>
          {veiculos.slice(carouselStartIndex, carouselStartIndex + 3).map(v => (
            <div
              key={v.id}
              onClick={() => setSelectedVeiculoId(v.id)}
              className="moon-card moon-card-hover"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                cursor: 'pointer',
                border: selectedVeiculoId === v.id ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                backgroundColor: selectedVeiculoId === v.id ? 'var(--bg-primary-light)' : 'var(--bg-card)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img 
                  src={v.fotoUrl} 
                  alt={v.nome}
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: 'var(--radius-sm)',
                    objectFit: 'cover'
                  }}
                />
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {v.nome}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {v.marcaModelo} • Placa: {v.placa}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-secondary)', marginTop: '2px' }}>
                    <Gauge size={12} style={{ display: 'inline', marginRight: '2px' }} /> {v.kmAtual.toLocaleString('pt-BR')} km
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  onClick={(e) => handleOpenEditVeiculo(v, e)}
                  style={{ color: 'var(--text-muted)', padding: '0.35rem', borderRadius: 'var(--radius-xs)' }}
                  title="Editar Veículo"
                  className="btn-icon-hover"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (veiculos.length <= 1) {
                      showToastError('Você precisa manter ao menos um veículo cadastrado.');
                      return;
                    }
                    handleDeleteVeiculoWithConfirm(v);
                  }}
                  style={{ color: 'var(--status-error)', padding: '0.35rem', borderRadius: 'var(--radius-xs)' }}
                  title="Excluir Veículo"
                  className="btn-icon-hover"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Row for Selected Vehicle */}
      {selectedVeiculo && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem'
        }}>
          <div className="moon-card">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Gasto com Combustível</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem' }}>
              R$ {totalAbastMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{veicAbastecimentos.length} abastecimento(s) este mês</span>
          </div>

          <div className="moon-card">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Parcelas Manutenção Ativas</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-warning)', marginTop: '0.25rem' }}>
              R$ {parcelasAtivasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / mês
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--status-warning)', fontWeight: 600 }}>Impacta fluxo fixo mensal</span>
          </div>

          <div className="moon-card">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Impacto Total no Mês</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '0.25rem' }}>
              R$ {totalGastoVeiculoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Combustível + Parcelas + Financiamento</span>
          </div>
        </div>
      )}

      {/* Financiamento Card para Veículo Selecionado */}
      {selectedVeiculo && selectedVeiculo.financiado && (
        <div className="moon-card" style={{
          border: '1px solid var(--border-color)',
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-primary-light) 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Landmark size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Status do Financiamento</h3>
                  {(selectedVeiculo.parcelasPagasFinanciamento || 0) >= (selectedVeiculo.parcelasTotaisFinanciamento || 1) ? (
                    <span className="badge badge-success">🎉 Quitado!</span>
                  ) : (
                    <span className="badge badge-warning">Em Financiamento</span>
                  )}
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Financeira: {selectedVeiculo.bancoFinanciamento || 'Banco / Financeira'} • Vencimento: todo dia {selectedVeiculo.diaVencimentoFinanciamento || 10}
                </span>
              </div>
            </div>

            {(selectedVeiculo.parcelasPagasFinanciamento || 0) < (selectedVeiculo.parcelasTotaisFinanciamento || 1) && (
              <button 
                className="btn-primary" 
                onClick={() => handlePagarParcelaFinanciamento(selectedVeiculo)}
                style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}
                title="Registrar pagamento de mais 1 parcela"
              >
                <CheckCircle2 size={16} />
                <span>+ Pagar Parcela ({ (selectedVeiculo.parcelasPagasFinanciamento || 0) + 1 }/{ selectedVeiculo.parcelasTotaisFinanciamento || 1 })</span>
              </button>
            )}
          </div>

          {/* Progress Bar & Details */}
          {(() => {
            const pagas = selectedVeiculo.parcelasPagasFinanciamento || 0;
            const totais = selectedVeiculo.parcelasTotaisFinanciamento || 1;
            const pct = Math.min(Math.round((pagas / totais) * 100), 100);
            const valorParc = selectedVeiculo.valorParcelaFinanciamento || 0;
            const restandoCount = Math.max(totais - pagas, 0);
            const saldoDevedor = restandoCount * valorParc;

            return (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 600 }}>Progresso de Quitação: {pagas} de {totais} parcelas pagas ({pct}%)</span>
                  <span style={{ color: 'var(--text-muted)' }}>{restandoCount} parcela(s) restante(s)</span>
                </div>

                <div style={{
                  height: '10px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-input)',
                  overflow: 'hidden',
                  marginBottom: '1rem',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
                    borderRadius: '10px',
                    transition: 'width 0.4s ease'
                  }} />
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '1rem',
                  backgroundColor: 'var(--bg-input)',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Valor da Parcela Mensal</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--status-error)' }}>
                      R$ {valorParc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saldo Devedor Restante</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      R$ {saldoDevedor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Próximo Vencimento</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                      <Clock size={15} /> Dia {selectedVeiculo.diaVencimentoFinanciamento || 10} do mês
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Section 1: Manutenções Emergenciais & Parcelamentos */}
      {selectedVeiculo && (
        <div className="moon-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Manutenções Emergenciais & Parceladas ({selectedVeiculo.nome})</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Serviços mecânicos divididos em N parcelas mensais</p>
            </div>
            <Wrench size={18} style={{ color: 'var(--color-primary)' }} />
          </div>

          {veicManutencoes.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '1rem 0' }}>Nenhuma manutenção emergencial cadastrada para este veículo.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {veicManutencoes.map(m => (
                <div key={m.id} style={{
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{m.descricao}</h4>
                      <span className="badge badge-error" style={{ fontSize: '0.65rem' }}>
                        Parcela {m.parcelaAtual}/{m.parcelasTotal}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Oficina: {m.oficina} • Início: {m.dataInicio}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--status-error)' }}>
                        R$ {m.valorParcela.toFixed(2)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/mês</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Total: R$ {m.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleOpenEditManut(m)} style={{ color: 'var(--text-muted)' }} title="Editar Manutenção">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDeleteManutWithConfirm(m)} style={{ color: 'var(--status-error)' }} title="Excluir Manutenção">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section 2: Histórico de Abastecimentos */}
      {selectedVeiculo && (
        <div className="moon-card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem' }}>Histórico de Abastecimentos</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.65rem 0.5rem' }}>Data</th>
                  <th style={{ padding: '0.65rem 0.5rem' }}>Posto</th>
                  <th style={{ padding: '0.65rem 0.5rem' }}>Litros</th>
                  <th style={{ padding: '0.65rem 0.5rem' }}>Hodômetro</th>
                  <th style={{ padding: '0.65rem 0.5rem', textAlign: 'right' }}>Valor Total</th>
                  <th style={{ padding: '0.65rem 0.5rem', textAlign: 'right' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {veicAbastecimentos.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{a.data}</td>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{a.posto}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{a.litros} L</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>{a.kmAtual.toLocaleString('pt-BR')} km</td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>
                      R$ {a.valorTotal.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                      <button onClick={() => handleOpenEditAbast(a)} style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }} title="Editar Abastecimento">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDeleteAbastWithConfirm(a)} style={{ color: 'var(--status-error)' }} title="Excluir Abastecimento">
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

      {/* Modal Add Veículo (with File Upload) */}
      {isVeiculoModalOpen && (
        <div className="modal-overlay" onClick={() => setIsVeiculoModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{editingVeiculoId ? 'Editar Veículo' : 'Cadastrar Novo Veículo'}</h3>
              <button onClick={() => setIsVeiculoModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleVeiculoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Image Upload Component */}
              <ImageUploader 
                label="Foto do Veículo (Upload de Arquivo)"
                value={veiculoFotoUrl}
                onChange={setVeiculoFotoUrl}
                aspectRatio="cover"
              />

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Nome do Veículo <span style={{ color: 'var(--status-error)' }}>*</span></label>
                <input type="text" required placeholder="Ex: Monza Club 2.0" value={nomeVeiculo} onChange={e => setNomeVeiculo(e.target.value)} style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Marca & Modelo</label>
                <input type="text" placeholder="Ex: GM / Chevrolet" value={marcaModelo} onChange={e => setMarcaModelo(e.target.value)} style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Placa <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <input type="text" required placeholder="ABC-1234" value={placa} onChange={e => setPlaca(maskPlaca(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>KM Atual</label>
                  <input type="text" placeholder="185.000 km" value={kmAtualVeiculo} onChange={e => setKmAtualVeiculo(maskKM(e.target.value))} style={{ width: '100%' }} />
                </div>
              </div>

              {/* Seção de Financiamento */}
              <div style={{
                backgroundColor: 'var(--bg-primary-light)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
                  <input
                    type="checkbox"
                    checked={financiado}
                    onChange={e => setFinanciado(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                  />
                  <span>Este veículo possui financiamento ativo? 🏦</span>
                </label>

                {financiado && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>Valor da Parcela (R$) <span style={{ color: 'var(--status-error)' }}>*</span></label>
                        <input
                          type="text"
                          required={financiado}
                          placeholder="R$ 1.850,00"
                          value={valorParcelaFinanciamento}
                          onChange={e => setValorParcelaFinanciamento(maskCurrency(e.target.value))}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>Dia do Vencimento</label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          placeholder="Ex: 10"
                          value={diaVencimentoFinanciamento}
                          onChange={e => setDiaVencimentoFinanciamento(e.target.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>Total de Parcelas <span style={{ color: 'var(--status-error)' }}>*</span></label>
                        <input
                          type="number"
                          required={financiado}
                          placeholder="Ex: 48"
                          value={parcelasTotaisFinanciamento}
                          onChange={e => setParcelasTotaisFinanciamento(e.target.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>Parcelas Já Pagas <span style={{ color: 'var(--status-error)' }}>*</span></label>
                        <input
                          type="number"
                          required={financiado}
                          placeholder="Ex: 18"
                          value={parcelasPagasFinanciamento}
                          onChange={e => setParcelasPagasFinanciamento(e.target.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>Banco / Financeira</label>
                      <input
                        type="text"
                        placeholder="Ex: Banco BV / Santander Financiamentos"
                        value={bancoFinanciamento}
                        onChange={e => setBancoFinanciamento(e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-outline" onClick={() => setIsVeiculoModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Veículo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Abastecimento */}
      {isAbastModalOpen && selectedVeiculo && (
        <div className="modal-overlay" onClick={() => setIsAbastModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{editingAbastId ? 'Editar Abastecimento' : 'Registrar Abastecimento'} — {selectedVeiculo.nome}</h3>
              <button onClick={() => setIsAbastModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAbastSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Posto de Gasolina</label>
                <input type="text" placeholder="Ex: Posto Shell Ipiranga" value={posto} onChange={e => setPosto(e.target.value)} style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Litros Abastecidos <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <input type="text" required placeholder="40,00 L" value={litros} onChange={e => setLitros(maskLitros(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Valor Total (R$) <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <input type="text" required placeholder="R$ 250,00" value={valorAbast} onChange={e => setValorAbast(maskCurrency(e.target.value))} style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>KM Atual no Painel</label>
                <input type="text" placeholder={`${maskKM(selectedVeiculo.kmAtual + 200)}`} value={kmAtual} onChange={e => setKmAtual(maskKM(e.target.value))} style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-outline" onClick={() => setIsAbastModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Abastecimento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Manutenção / Parcelamento */}
      {isManutModalOpen && selectedVeiculo && (
        <div className="modal-overlay" onClick={() => setIsManutModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{editingManutId ? 'Editar Manutenção' : 'Registrar Manutenção'} — {selectedVeiculo.nome}</h3>
              <button onClick={() => setIsManutModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleManutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Descrição do Serviço / Emergência <span style={{ color: 'var(--status-error)' }}>*</span></label>
                <input type="text" required placeholder="Ex: Troca de embreagem e óleo" value={descManut} onChange={e => setDescManut(e.target.value)} style={{ width: '100%' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Oficina Mecânica</label>
                <input type="text" placeholder="Ex: Della Via Auto Center" value={oficina} onChange={e => setOficina(e.target.value)} style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Valor Total do Serviço (R$) <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <input type="text" required placeholder="R$ 1.800,00" value={valorTotalManut} onChange={e => setValorTotalManut(maskCurrency(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Número de Parcelas <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <select value={parcelasTotal} onChange={e => setParcelasTotal(e.target.value)} style={{ width: '100%' }} required>
                    <option value="1">À vista (1x)</option>
                    <option value="2">2x sem juros</option>
                    <option value="3">3x sem juros</option>
                    <option value="6">6x no cartão</option>
                    <option value="10">10x no cartão</option>
                    <option value="12">12x no cartão</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-outline" onClick={() => setIsManutModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Registrar Parcela</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
