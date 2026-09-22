import React, { useState } from 'react';
import {
  Dog, Plus, Power, X, ShoppingCart, Trash2, Calendar, Pencil, Archive, Check,
  Eye, FileText, Bookmark, Save, PiggyBank, CheckCircle
} from 'lucide-react';
import type { Pet, ReservaPet, ItemAgendaPet, ItemCompraPet, CarrinhoSalvoPet, HistoricoCompraPet, EmergenciaPet } from '../types';
import { confirmDelete, showAlertSuccess, showToastSuccess } from '../utils/sweetAlert';
import { ImageUploader } from './ImageUploader';

interface PetsViewProps {
  pets: Pet[];
  reservas: ReservaPet[];
  agenda: ItemAgendaPet[];
  compras: ItemCompraPet[];
  carrinhosSalvos?: CarrinhoSalvoPet[];
  historicoCompras: HistoricoCompraPet[];
  emergencias?: EmergenciaPet[];
  petsEnabled: boolean;
  onTogglePetsModule: () => void;
  onAddPet: (novo: Pet) => void;
  onEditPet: (editado: Pet) => void;
  onDeletePet: (id: string) => void;
  onAddCompra?: (nova: ItemCompraPet) => void;
  onUpdateCompra?: (editada: ItemCompraPet) => void;
  onToggleCompraStatus?: (id: string) => void;
  onRemoveCompra?: (id: string) => void;
  onClearCart?: () => void;
  onAddAgenda?: (novo: ItemAgendaPet) => void;
  onDeleteAgenda?: (id: string) => void;
  onConcluirAgenda?: (item: ItemAgendaPet, valorPago: number, metodoPagamento: string) => void;
  onAportarReserva?: (petId: string, valorAporte: number) => void;
  onEditReservaMeta?: (petId: string, novaMeta: number) => void;
  onLoadSavedCartToCurrent?: (carrinhoSalvo: CarrinhoSalvoPet) => void;
  onSaveCarrinhoTemplate?: (novo: CarrinhoSalvoPet) => void;
  onDeleteCarrinhoTemplate?: (id: string) => void;
  onFinalizarCompraMensal: (historico: HistoricoCompraPet) => void;
  onRegistrarEmergencia?: (emergencia: EmergenciaPet) => void;
  globalSearchTerm?: string;
}

export const PetsView: React.FC<PetsViewProps> = ({
  pets,
  reservas,
  agenda,
  compras,
  carrinhosSalvos = [],
  historicoCompras,
  emergencias = [],
  petsEnabled,
  onTogglePetsModule,
  onAddPet,
  onEditPet,
  onDeletePet,
  onAddAgenda,
  onDeleteAgenda,
  onConcluirAgenda,
  onAportarReserva,
  onEditReservaMeta,
  onLoadSavedCartToCurrent,
  onSaveCarrinhoTemplate,
  onDeleteCarrinhoTemplate,
  onFinalizarCompraMensal,
  onRegistrarEmergencia,
  globalSearchTerm = ''
}) => {
  // Modals State
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [editingPetId, setEditingPetId] = useState<string | null>(null);

  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CarrinhoSalvoPet | null>(null);
  const [isEditTemplateModalOpen, setIsEditTemplateModalOpen] = useState(false);
  const [editTemplateNome, setEditTemplateNome] = useState('');
  const [editTemplateFrequencia, setEditTemplateFrequencia] = useState<'Mensal' | 'Quinzenal' | 'Semanal' | 'Eventual'>('Mensal');
  const [editTemplateLoja, setEditTemplateLoja] = useState('');
  const [editTemplateItens, setEditTemplateItens] = useState<ItemCompraPet[]>([]);

  const [isProcessarCompraModalOpen, setIsProcessarCompraModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<HistoricoCompraPet | null>(null);

  // Agenda Modal State
  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [agendaPetId, setAgendaPetId] = useState('');
  const [agendaTipo, setAgendaTipo] = useState<'vacina' | 'banho' | 'tosa' | 'consulta' | 'exame' | 'vermifugo'>('vacina');
  const [agendaTitulo, setAgendaTitulo] = useState('');
  const [agendaData, setAgendaData] = useState('');
  const [agendaRecorrencia, setAgendaRecorrencia] = useState('Anual (1x por ano)');
  const [agendaValor, setAgendaValor] = useState('');

  // Modal Concluir Agenda (Check de Vacina / Consulta)
  const [isConcluirAgendaModalOpen, setIsConcluirAgendaModalOpen] = useState(false);
  const [concluirAgendaItem, setConcluirAgendaItem] = useState<ItemAgendaPet | null>(null);
  const [concluirValorReal, setConcluirValorReal] = useState('');
  const [concluirMetodoPagamento, setConcluirMetodoPagamento] = useState('Cartão de Crédito');

  // Aporte / Meta Modal State
  const [isAporteModalOpen, setIsAporteModalOpen] = useState(false);
  const [aportePetId, setAportePetId] = useState('');
  const [valorAporteInput, setValorAporteInput] = useState('');

  const [isMetaModalOpen, setIsMetaModalOpen] = useState(false);
  const [metaPetId, setMetaPetId] = useState('');
  const [metaInput, setMetaInput] = useState('1000');

  // Emergencia Modal State
  const [isEmergenciaModalOpen, setIsEmergenciaModalOpen] = useState(false);
  const [emergenciaPetId, setEmergenciaPetId] = useState('');
  const [emergenciaData, setEmergenciaData] = useState('');
  const [emergenciaValorTotal, setEmergenciaValorTotal] = useState('');
  const [emergenciaUsouReserva, setEmergenciaUsouReserva] = useState(false);
  const [emergenciaValorUsadoReserva, setEmergenciaValorUsadoReserva] = useState('');
  const [emergenciaMetodoRestante, setEmergenciaMetodoRestante] = useState('Cartão de Crédito');
  const [emergenciaParcelado, setEmergenciaParcelado] = useState(false);
  const [emergenciaParcelas, setEmergenciaParcelas] = useState('1');
  const [emergenciaObservacao, setEmergenciaObservacao] = useState('');

  // Pet Form State
  const [nome, setNome] = useState('');
  const [especie, setEspecie] = useState<'cachorro' | 'gato' | 'outro'>('cachorro');
  const [raca, setRaca] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [gastoMensal, setGastoMensal] = useState('');
  const [petFotoUrl, setPetFotoUrl] = useState('');

  // Template Form State
  const [templateNome, setTemplateNome] = useState('Compra para o Mês (Cobasi / Petz)');
  const [templateFrequencia, setTemplateFrequencia] = useState<'Mensal' | 'Quinzenal' | 'Semanal' | 'Eventual'>('Mensal');
  const [templateLoja, setTemplateLoja] = useState('Cobasi');

  // Checkout Form State
  const [nomeListaCheckout, setNomeListaCheckout] = useState('Compra para o Mês (Cobasi / Petz)');
  const [metodoPagamento, setMetodoPagamento] = useState('Cartão de Crédito');
  const [teveFrete, setTeveFrete] = useState(false);
  const [valorFrete, setValorFrete] = useState('0');
  const [valorDescontoCheckout, setValorDescontoCheckout] = useState('0');
  const [itensParaComprar, setItensParaComprar] = useState<ItemCompraPet[]>([]);

  if (!petsEnabled) {
    return (
      <div className="moon-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
        <Dog size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.6 }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Módulo de Pets Desativado
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '460px', margin: '0 auto 1.5rem' }}>
          Você não possui pets cadastrados ou optou por ocultar este módulo. Ative-o quando quiser planejar gastos veterinários, ração e vacinas.
        </p>
        <button className="btn-primary" onClick={onTogglePetsModule}>
          <Power size={16} />
          <span>Ativar Módulo de Pets</span>
        </button>
      </div>
    );
  }

  // Data pre-processing
  const activePets = pets.filter(p => p.ativo !== false);
  const inactivePets = pets.filter(p => p.ativo === false);
  const allDisplayPets = [...activePets, ...inactivePets];

  // Helper to compute exact dynamic age and birthday text from dataNascimento
  const getPetAgeDisplay = (pet: Pet) => {
    if (!pet.dataNascimento) {
      return pet.idade || '1 ano';
    }

    const birthDate = new Date(pet.dataNascimento);
    const today = new Date();

    if (isNaN(birthDate.getTime())) {
      return pet.idade || '1 ano';
    }

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();

    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
      years--;
      months += 12;
    }

    const dayStr = String(birthDate.getDate()).padStart(2, '0');
    const monthStr = birthDate.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');

    const ageStr = years > 0
      ? `${years} ano${years > 1 ? 's' : ''}${months > 0 ? ` e ${months} m` : ''}`
      : `${months} mes${months > 1 ? 'es' : ''}`;

    return `🎂 ${ageStr} (Niver: ${dayStr}/${monthStr})`;
  };

  // Dynamic Calculation of Monthly Estimated Expenses per Pet (Contabilidade Dinâmica dos Gastos Reais)
  const calcGastoMensalRealPet = (petId: string, staticEstimado: number) => {
    const petTarget = pets.find(p => p.id === petId);
    const pNameLower = petTarget ? petTarget.nome.toLowerCase() : '';

    // 1. Sum items in saved list templates or current cart for this pet
    let totalCarrinho = 0;
    carrinhosSalvos.forEach(cs => {
      cs.itens.forEach(it => {
        if (it.petId === petId || (it.petNome && it.petNome.toLowerCase() === pNameLower)) {
          totalCarrinho += (it.valorComDesconto * it.quantidade);
        }
      });
    });

    // 2. Sum completed medical care expenses for this pet
    const totalCuidados = agenda
      .filter(a => a.petId === petId || (a.petNome && a.petNome.toLowerCase() === pNameLower))
      .filter(a => a.status === 'realizado')
      .reduce((acc, a) => acc + a.valor, 0);

    const totalCalculado = totalCarrinho + totalCuidados;
    return totalCalculado > 0 ? totalCalculado : (staticEstimado || 150.00);
  };

  // Filtered History
  const filteredHistorico = historicoCompras.filter(h => {
    if (!globalSearchTerm) return true;
    const term = globalSearchTerm.toLowerCase();
    return (
      (h.nomeLista && h.nomeLista.toLowerCase().includes(term)) ||
      (h.metodoPagamento && h.metodoPagamento.toLowerCase().includes(term)) ||
      (h.loja && h.loja.toLowerCase().includes(term)) ||
      (h.dataCompra && h.dataCompra.toLowerCase().includes(term))
    );
  });

  // Filtered Agenda: Pending vs Completed
  const agendaPendentes = agenda.filter(a => a.status !== 'realizado');
  const agendaRealizadas = agenda.filter(a => a.status === 'realizado');

  // Handlers Pet
  const handleOpenAddPet = () => {
    setEditingPetId(null);
    setNome('');
    setEspecie('cachorro');
    setRaca('');
    setDataNascimento('2022-02-19');
    setGastoMensal('');
    setPetFotoUrl('');
    setIsPetModalOpen(true);
  };

  const handleOpenEditPet = (pet: Pet) => {
    setEditingPetId(pet.id);
    setNome(pet.nome);
    setEspecie(pet.especie);
    setRaca(pet.raca);
    setDataNascimento(pet.dataNascimento || '2022-02-19');
    setGastoMensal(pet.gastoMensalEstimado.toString());
    setPetFotoUrl(pet.fotoUrl || '');
    setIsPetModalOpen(true);
  };

  const handleDeletePetClick = (pet: Pet) => {
    confirmDelete(
      'Excluir Pet permanentemente?',
      `Tem certeza que deseja excluir ${pet.nome}? Esta ação apagará todas as referências ao pet e não pode ser desfeita. Para ocultá-lo da listagem sem perder dados, use a opção de "Inativar".`,
      () => onDeletePet(pet.id)
    );
  };

  const handleTogglePetStatus = (pet: Pet) => {
    const isAtivo = pet.ativo !== false;
    onEditPet({ ...pet, ativo: !isAtivo });
    showToastSuccess(isAtivo ? `${pet.nome} foi inativado.` : `${pet.nome} foi reativado.`);
  };

  const handlePetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !raca) return;

    const defaultFallback = especie === 'cachorro'
      ? 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=300'
      : 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=300';

    if (editingPetId) {
      const target = pets.find(p => p.id === editingPetId);
      if (target) {
        onEditPet({
          ...target,
          nome,
          especie,
          raca,
          idade: target.idade || '4 anos',
          dataNascimento,
          fotoUrl: petFotoUrl || target.fotoUrl || defaultFallback,
          gastoMensalEstimado: parseFloat(gastoMensal || '150')
        });
        showToastSuccess(`Pet "${nome}" atualizado com sucesso! 🐾`);
      }
    } else {
      const novo: Pet = {
        id: `pet_${Date.now()}`,
        nome,
        especie,
        raca,
        idade: '4 anos',
        dataNascimento,
        fotoUrl: petFotoUrl || defaultFallback,
        gastoMensalEstimado: parseFloat(gastoMensal || '150'),
        ativo: true
      };
      onAddPet(novo);
      showToastSuccess(`Pet "${nome}" cadastrado com sucesso! 🐾`);
    }

    setIsPetModalOpen(false);
  };

  // Handlers Agenda / Programação de Vacinas e Consultas
  const handleOpenAddAgenda = () => {
    setAgendaPetId(pets[0]?.id || '');
    setAgendaTipo('vacina');
    setAgendaTitulo('');
    setAgendaData(new Date().toISOString().split('T')[0]);
    setAgendaRecorrencia('Anual (1x por ano)');
    setAgendaValor('150.00');
    setIsAgendaModalOpen(true);
  };

  const handleAgendaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agendaTitulo || !agendaData || !onAddAgenda) return;

    const petTarget = pets.find(p => p.id === (agendaPetId || pets[0]?.id));
    const novo: ItemAgendaPet = {
      id: `ag_${Date.now()}`,
      petId: petTarget?.id || 'pet_01',
      petNome: petTarget?.nome || 'Pet',
      tipo: agendaTipo as any,
      titulo: agendaTitulo,
      data: agendaData,
      recorrencia: agendaRecorrencia,
      valor: parseFloat(agendaValor || '0'),
      status: 'pendente'
    };

    onAddAgenda(novo);
    setIsAgendaModalOpen(false);
    showToastSuccess(`Compromisso "${agendaTitulo}" agendado com sucesso para ${petTarget?.nome}! 📅`);
  };

  // Handlers Concluir Agendamento (Check de Vacina/Consulta)
  const handleOpenConcluirAgenda = (item: ItemAgendaPet) => {
    setConcluirAgendaItem(item);
    setConcluirValorReal(item.valor.toString());
    setConcluirMetodoPagamento('Cartão de Crédito');
    setIsConcluirAgendaModalOpen(true);
  };

  const handleConfirmarConcluirAgenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concluirAgendaItem || !onConcluirAgenda) return;

    const valorPago = parseFloat(concluirValorReal || '0');
    onConcluirAgenda(concluirAgendaItem, valorPago, concluirMetodoPagamento);
    setIsConcluirAgendaModalOpen(false);

    showAlertSuccess(
      '🎉 Cuidado Pet Registrado!',
      `O compromisso "${concluirAgendaItem.titulo}" de ${concluirAgendaItem.petNome} foi marcado como realizado e somado às despesas.`
    );
  };

  // Handlers Aportes e Reserva de Saúde
  const handleOpenAporteModal = (pId: string) => {
    setAportePetId(pId);
    setValorAporteInput('50.00');
    setIsAporteModalOpen(true);
  };

  const handleAporteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(valorAporteInput || '0');
    if (val <= 0 || !onAportarReserva) return;

    onAportarReserva(aportePetId, val);
    setIsAporteModalOpen(false);
    showToastSuccess(`Aporte de R$ ${val.toFixed(2)} realizado na Reserva Emergencial! 💰`);
  };

  const handleOpenMetaModal = (pId: string, metaAtual: number) => {
    setMetaPetId(pId);
    setMetaInput(metaAtual.toString());
    setIsMetaModalOpen(true);
  };

  const handleMetaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const novaMeta = parseFloat(metaInput || '1000');
    if (novaMeta <= 0 || !onEditReservaMeta) return;

    onEditReservaMeta(metaPetId, novaMeta);
    setIsMetaModalOpen(false);
    showToastSuccess('Meta do Fundo Emergencial atualizada!');
  };

  const handleOpenEmergencia = (pId: string) => {
    setEmergenciaPetId(pId);
    setEmergenciaData(new Date().toISOString().split('T')[0]);
    setEmergenciaValorTotal('');
    setEmergenciaUsouReserva(false);
    setEmergenciaValorUsadoReserva('');
    setEmergenciaMetodoRestante('Cartão de Crédito');
    setEmergenciaParcelado(false);
    setEmergenciaParcelas('1');
    setEmergenciaObservacao('');
    setIsEmergenciaModalOpen(true);
  };

  const handleEmergenciaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergenciaPetId || !emergenciaData || !emergenciaValorTotal || !onRegistrarEmergencia) return;

    const petTarget = pets.find(p => p.id === emergenciaPetId);

    const novaEmergencia: EmergenciaPet = {
      id: `emerg_${Date.now()}`,
      petId: petTarget?.id || 'pet_01',
      petNome: petTarget?.nome || 'Pet',
      data: emergenciaData,
      valorTotal: parseFloat(emergenciaValorTotal || '0'),
      usouReserva: emergenciaUsouReserva,
      valorUsadoReserva: emergenciaUsouReserva ? parseFloat(emergenciaValorUsadoReserva || '0') : 0,
      metodoPagamentoRestante: emergenciaMetodoRestante,
      parcelado: emergenciaParcelado,
      parcelas: emergenciaParcelado ? parseInt(emergenciaParcelas || '1') : 1,
      observacao: emergenciaObservacao
    };

    onRegistrarEmergencia(novaEmergencia);
    setIsEmergenciaModalOpen(false);
    showAlertSuccess(
      '🚑 Emergência Registrada',
      `O registro foi salvo com sucesso e deduzido da reserva se aplicável.`
    );
  };

  // Handlers Saved Cart Templates
  const handleOpenSaveTemplateModal = () => {
    setTemplateNome('Compra para o Mês (Cobasi / Petz)');
    setTemplateFrequencia('Mensal');
    setTemplateLoja('Cobasi');
    setIsSaveTemplateModalOpen(true);
  };

  const handleSaveTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateNome || !onSaveCarrinhoTemplate) return;

    const novoTemplate: CarrinhoSalvoPet = {
      id: `tmpl_${Date.now()}`,
      nome: templateNome,
      frequencia: templateFrequencia,
      loja: templateLoja,
      itens: compras.length > 0 ? compras.map(it => ({ ...it })) : [
        {
          id: `item_${Date.now()}_1`,
          petId: pets[0]?.id || 'pet_01',
          petNome: pets[0]?.nome || 'Pet',
          produto: 'Ração Premier Nutrição Clínica Urinário 1.5kg',
          quantidade: 1,
          valorSemDesconto: 89.91,
          valorComDesconto: 89.91
        }
      ]
    };

    onSaveCarrinhoTemplate(novoTemplate);
    setIsSaveTemplateModalOpen(false);
    showToastSuccess(`Lista "${templateNome}" salva com sucesso! 📌`);
  };

  const handleOpenEditTemplateModal = (cs: CarrinhoSalvoPet) => {
    setEditingTemplate(cs);
    setEditTemplateNome(cs.nome);
    setEditTemplateFrequencia(cs.frequencia);
    setEditTemplateLoja(cs.loja || 'Cobasi');
    setEditTemplateItens(cs.itens.map(it => ({ ...it })));
    setIsEditTemplateModalOpen(true);
  };

  const handleSaveEditTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate || !editTemplateNome || !onSaveCarrinhoTemplate) return;

    const updated: CarrinhoSalvoPet = {
      ...editingTemplate,
      nome: editTemplateNome,
      frequencia: editTemplateFrequencia,
      loja: editTemplateLoja,
      itens: editTemplateItens.map(it => ({ ...it }))
    };

    onSaveCarrinhoTemplate(updated);
    setIsEditTemplateModalOpen(false);
    showToastSuccess(`Lista "${editTemplateNome}" atualizada com sucesso! ✏️`);
  };

  // Direct Checkout from Saved List
  const handleUsarEDiretoCheckoutTemplate = (cs: CarrinhoSalvoPet) => {
    if (onLoadSavedCartToCurrent) {
      onLoadSavedCartToCurrent(cs);
    }
    setItensParaComprar(cs.itens.map(it => ({ ...it })));
    setNomeListaCheckout(cs.nome);
    setMetodoPagamento('Cartão de Crédito');
    setTeveFrete(false);
    setValorFrete('0');
    setValorDescontoCheckout('0');

    setIsProcessarCompraModalOpen(true);
    showToastSuccess(`Lista "${cs.nome}" carregada! Confira as opções e finalize a compra. 🛒`);
  };

  // Calculations for Checkout Modal (Math 100% Correct including Freight)
  const calcSubtotalOriginal = itensParaComprar.reduce((acc, c) => acc + ((c.valorSemDesconto || c.valorComDesconto) * c.quantidade), 0);
  const calcSubtotalComDesconto = itensParaComprar.reduce((acc, c) => acc + (c.valorComDesconto * c.quantidade), 0);
  const calcEconomiaProdutos = Math.max(0, calcSubtotalOriginal - calcSubtotalComDesconto);
  const calcDescontoCupom = parseFloat(valorDescontoCheckout || '0');
  const calcFreteVal = teveFrete ? (parseFloat(valorFrete) || 0) : 0;

  // Total Final = Subtotal dos produtos (com desconto) + Frete - Desconto Cupom Extra
  const calcTotalFinalPago = Math.max(0, calcSubtotalComDesconto + calcFreteVal - calcDescontoCupom);

  const handleConfirmarProcessarCompra = (e: React.FormEvent) => {
    e.preventDefault();
    if (itensParaComprar.length === 0) return;

    const dateFormatted = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

    const historico: HistoricoCompraPet = {
      id: `hpet_${Date.now()}`,
      dataCompra: dateFormatted,
      nomeLista: nomeListaCheckout || 'Compra Pet',
      loja: 'Cobasi / Petz',
      metodoPagamento,
      teveFrete,
      valorFrete: calcFreteVal,
      valorDesconto: calcEconomiaProdutos + calcDescontoCupom,
      valorProdutos: calcSubtotalComDesconto,
      totalPago: calcTotalFinalPago,
      itensCompradosCount: itensParaComprar.length,
      itensComprados: [...itensParaComprar]
    };

    onFinalizarCompraMensal(historico);
    setIsProcessarCompraModalOpen(false);

    // Automatically open Receipt Preview Modal for instant verification
    setSelectedReceipt(historico);

    showAlertSuccess(
      '🎉 Compra Finalizada com Sucesso!',
      `Total Pago: R$ ${calcTotalFinalPago.toFixed(2)}\nMétodo: ${metodoPagamento}\nFrete: ${teveFrete && calcFreteVal > 0 ? `R$ ${calcFreteVal.toFixed(2)}` : 'Grátis'}`
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Title & Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Módulo Pets
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Visão Consolidada: Saúde, Reserva Emergencial, Agendamento de Vacinas e Compras.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* <button className="btn-outline" onClick={onTogglePetsModule} style={{ fontSize: '0.8rem' }}>
            <Power size={14} style={{ color: 'var(--status-error)' }} />
            <span>Desativar Módulo</span>
          </button>*/}

          <button className="btn-primary" onClick={handleOpenAddPet}>
            <Plus size={16} />
            <span>+ Novo Pet</span>
          </button>
        </div>
      </div>

      {/* TOP SECTION: Meus Pets Cadastrados & Fundo Emergencial (CARROSSEL HORIZONTAL COMPACTO) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>Meus Pets Cadastrados & Fundo Emergencial</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Deslize para o lado para ver todos)</span>
          </div>
          <span className="badge badge-sage">{allDisplayPets.length} pet(s)</span>
        </div>

        {allDisplayPets.length === 0 ? (
          <div className="moon-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Nenhum pet cadastrado. Clique no botão <strong>+ Novo Pet</strong> acima para cadastrar seu primeiro animalzinho! 🐾
          </div>
        ) : (
          /* Container Horizontal Elegante e Compacto */
          <div style={{
            display: 'flex',
            gap: '1.25rem',
            overflowX: 'auto',
            paddingBottom: '0.75rem',
            paddingTop: '0.2rem',
            scrollbarWidth: 'thin'
          }}>
            {allDisplayPets.map(pet => {
              const isAtivo = pet.ativo !== false;

              // Flexible search matching petId or pet name for reserves
              const petReserva = reservas.find(r =>
                r.petId === pet.id ||
                (r.petId && r.petId.toLowerCase() === pet.id.toLowerCase()) ||
                (r.petNome && r.petNome.toLowerCase() === pet.nome.toLowerCase())
              );

              const valorAtual = petReserva ? (petReserva.valorAtual || 0) : 0;
              const meta = petReserva ? (petReserva.meta || 1000) : 1000;
              const progressPct = Math.min(Math.round((valorAtual / meta) * 100), 100);

              // Calculated Real Monthly Expense & Age Display
              const gastoEstCalculado = calcGastoMensalRealPet(pet.id, pet.gastoMensalEstimado);
              const idadeDisplay = getPetAgeDisplay(pet);

              return (
                <div
                  key={pet.id}
                  className="moon-card moon-card-hover"
                  style={{
                    minWidth: '310px',
                    maxWidth: '340px',
                    flexShrink: 0,
                    opacity: isAtivo ? 1 : 0.6,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <img
                        src={pet.fotoUrl}
                        alt={pet.nome}
                        style={{
                          width: '68px',
                          height: '68px',
                          borderRadius: 'var(--radius-md)',
                          objectFit: 'cover',
                          border: '2px solid var(--color-secondary)',
                          flexShrink: 0
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden' }}>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{pet.nome}</h3>
                            {!isAtivo && <span className="badge badge-terracota" style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem' }}>Inativo</span>}
                          </div>
                          <div style={{ display: 'flex', gap: '0.2rem', flexShrink: 0 }}>
                            <button onClick={() => handleOpenEditPet(pet)} style={{ color: 'var(--text-muted)', padding: '0.15rem' }} title="Editar Pet">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => handleTogglePetStatus(pet)} style={{ color: 'var(--text-muted)', padding: '0.15rem' }} title={isAtivo ? 'Inativar' : 'Reativar'}>
                              {isAtivo ? <Archive size={13} /> : <Check size={13} />}
                            </button>
                            <button onClick={() => handleDeletePetClick(pet)} style={{ color: 'var(--status-error)', padding: '0.15rem' }} title="Excluir Definitivamente">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {pet.especie.toUpperCase()} • {pet.raca}
                        </div>

                        {/* Idade Calculada Dinamicamente com Data de Aniversário */}
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                          {idadeDisplay}
                        </div>

                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '0.2rem' }} title="Calculado dinamicamente com base nas compras e cuidados em saúde do pet">
                          Gasto Est: R$ {gastoEstCalculado.toFixed(2)}/mês
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fundo Emergencial no Card do Pet */}
                  <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Reserva Saúde: </span>
                        <strong style={{ color: 'var(--status-success)', whiteSpace: 'nowrap' }}>
                          R$ {valorAtual.toFixed(2)} / R$ {meta.toFixed(2)}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleOpenAporteModal(pet.id)}
                          style={{
                            height: '26px',
                            padding: '0 0.55rem',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--color-primary)',
                            backgroundColor: 'transparent',
                            border: '1px solid var(--color-primary)',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer'
                          }}
                          title="Guardar valor no fundo emergencial deste pet"
                        >
                          + Guardar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenMetaModal(pet.id, meta)}
                          style={{
                            height: '26px',
                            padding: '0 0.55rem',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            backgroundColor: 'var(--bg-input)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer'
                          }}
                          title="Editar Meta"
                        >
                          Meta
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEmergencia(pet.id)}
                          style={{
                            height: '26px',
                            padding: '0 0.55rem',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#ffffff',
                            backgroundColor: 'var(--status-error)',
                            border: 'none',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            whiteSpace: 'nowrap',
                            gap: '0.2rem',
                            cursor: 'pointer'
                          }}
                          title="Registrar Emergência Médica"
                        >
                          <span>🚨</span>
                          <span>Emergência</span>
                        </button>
                      </div>
                    </div>

                    <div style={{ height: '5px', backgroundColor: 'var(--bg-input)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progressPct}%`, backgroundColor: 'var(--color-secondary)', transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MAIN TWO-COLUMN GRID: Left Main Content vs Right Lateral Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>

        {/* COLUNA ESQUERDA: Listas Salvas e Histórico de Compras */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Listas & Carrinhos Salvos (Templates Reutilizáveis) */}
          <div className="moon-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bookmark size={18} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Listas & Carrinhos Salvos</h3>
              </div>
              <button
                className="btn-outline"
                onClick={handleOpenSaveTemplateModal}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                title="Criar um novo modelo de lista"
              >
                <Save size={14} />
                <span>+ Criar Nova Lista Salva</span>
              </button>
            </div>

            {carrinhosSalvos.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Nenhum template de lista salvo ainda.</p>
            ) : (
              <div style={{ display: 'flex', gap: '0.85rem', overflowX: 'auto', paddingBottom: '0.35rem' }}>
                {carrinhosSalvos.map(cs => (
                  <div key={cs.id} style={{
                    minWidth: '250px',
                    padding: '0.85rem',
                    backgroundColor: 'var(--bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.65rem'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>{cs.nome}</strong>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button
                            onClick={() => handleOpenEditTemplateModal(cs)}
                            style={{ color: 'var(--text-muted)', padding: '0.15rem' }}
                            title="Editar Lista Salva"
                          >
                            <Pencil size={13} />
                          </button>
                          {onDeleteCarrinhoTemplate && (
                            <button
                              onClick={() => confirmDelete('Excluir Lista Salva?', `Remover a lista '${cs.nome}'?`, () => onDeleteCarrinhoTemplate(cs.id))}
                              style={{ color: 'var(--status-error)', padding: '0.15rem' }}
                              title="Excluir Lista Salva"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        📌 {cs.frequencia} • {cs.loja || 'Cobasi'} • {cs.itens.length} produto(s)
                      </div>
                    </div>

                    <button
                      className="btn-primary"
                      onClick={() => handleUsarEDiretoCheckoutTemplate(cs)}
                      style={{ fontSize: '0.78rem', padding: '0.45rem 0.6rem', width: '100%', justifyContent: 'center' }}
                    >
                      <ShoppingCart size={14} />
                      <span>Usar & Efetuar Compra</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Histórico de Compras Realizadas com Contagem Correta no Badge */}
          <div className="moon-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Histórico de Compras Realizadas</h3>
              </div>
              <span className="badge badge-sage">{filteredHistorico.length} registro(s)</span>
            </div>

            {filteredHistorico.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', padding: '1.5rem 0' }}>
                Nenhuma compra registrada no histórico ainda.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredHistorico.map(h => (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '0.95rem' }}>{h.nomeLista || 'Compra Pet'}</strong>
                        <span className="badge badge-sage" style={{ fontSize: '0.7rem' }}>{h.metodoPagamento}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        📅 {h.dataCompra} • {h.itensCompradosCount || h.itensComprados?.length || 0} produto(s) • {h.teveFrete && h.valorFrete > 0 ? `Frete: R$ ${h.valorFrete.toFixed(2)}` : 'Frete Grátis'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                          R$ {h.totalPago.toFixed(2)}
                        </div>
                        {h.valorDesconto > 0 && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--status-success)', fontWeight: 600 }}>
                            Desc: - R$ {h.valorDesconto.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <button
                        className="btn-outline"
                        onClick={() => setSelectedReceipt(h)}
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        title="Ver Nota / Comprovante da Compra"
                      >
                        <Eye size={16} />
                        <span>Ver Notinha</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Histórico de Emergências de Saúde */}
          {emergencias && emergencias.length > 0 && (
            <div className="moon-card" style={{ borderLeft: '4px solid var(--status-error)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--status-error)' }}>Histórico de Emergências</h3>
                </div>
                <span className="badge" style={{ backgroundColor: 'var(--status-error-bg)', color: 'var(--status-error)' }}>{emergencias.length} registro(s)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {emergencias.map(em => (
                  <div key={em.id} style={{ padding: '0.85rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '0.95rem' }}>🚑 Emergência de {em.petNome}</strong>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--status-error)' }}>R$ {em.valorTotal.toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      📅 {em.data} {em.usouReserva ? `• Usou R$ ${(em.valorUsadoReserva || 0).toFixed(2)} da reserva` : '• Não utilizou reserva'}
                    </div>
                    {em.valorTotal - (em.usouReserva ? (em.valorUsadoReserva || 0) : 0) > 0 && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        💳 Restante de R$ {(em.valorTotal - (em.usouReserva ? (em.valorUsadoReserva || 0) : 0)).toFixed(2)} pago em: {em.metodoPagamentoRestante} {em.parcelado ? `(${em.parcelas}x)` : ''}
                      </div>
                    )}
                    {em.observacao && (
                      <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--bg-card)', borderRadius: '4px' }}>
                        📝 {em.observacao}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* COLUNA DIREITA (LATERAL): Próximos Compromissos & Resumo Financeiro */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Próximos Compromissos (Vacinas / Banho / Tosa / Veterinário) com Botão de Check / Dar Vacina */}
          <div className="moon-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>Próximos Compromissos</h3>
              </div>
              <button
                className="btn-primary"
                onClick={handleOpenAddAgenda}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                title="Agendar vacina, consulta veterinária ou exame"
              >
                <Plus size={14} />
                <span>+ Agendar</span>
              </button>
            </div>

            {agendaPendentes.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nenhum compromisso pendente no momento.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {agendaPendentes.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button
                        onClick={() => handleOpenConcluirAgenda(item)}
                        style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: 'var(--bg-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-primary)' }}
                        title="Clique para dar vacina / concluir e registrar gasto"
                      >
                        <CheckCircle size={18} />
                      </button>
                      <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>{item.titulo} ({item.petNome})</h4>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', gap: '0.4rem', marginTop: '0.1rem', flexWrap: 'wrap' }}>
                          <span>📅 {item.data}</span>
                          {item.recorrencia && <span className="badge badge-sage" style={{ fontSize: '0.62rem', padding: '0.1rem 0.3rem' }}>{item.recorrencia}</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                        R$ {item.valor.toFixed(2)}
                      </span>
                      {onDeleteAgenda && (
                        <button
                          onClick={() => confirmDelete('Remover compromisso?', `Remover ${item.titulo}?`, () => onDeleteAgenda(item.id))}
                          style={{ color: 'var(--status-error)', padding: '0.2rem' }}
                          title="Excluir agendamento"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Subseção: Histórico de Cuidados / Vacinas Realizadas */}
            {agendaRealizadas.length > 0 && (
              <div style={{ marginTop: '1.25rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.85rem' }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  ✓ Cuidados Realizados ({agendaRealizadas.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '140px', overflowY: 'auto' }}>
                  {agendaRealizadas.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', padding: '0.35rem 0.5rem', backgroundColor: 'var(--bg-card)', borderRadius: '4px', opacity: 0.85 }}>
                      <span>✓ {item.titulo} ({item.petNome})</span>
                      <strong style={{ color: 'var(--status-success)' }}>R$ {item.valor.toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card Resumo Financeiro Consolidado (SEM DUPLICAÇÃO) */}
          <div className="moon-card" style={{ backgroundColor: 'var(--bg-primary-light)', border: '1px solid var(--color-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <PiggyBank size={20} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Resumo Financeiro Pets</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Orçamento Estimado Total:</span>
                <strong>R$ {pets.reduce((acc, p) => acc + calcGastoMensalRealPet(p.id, p.gastoMensalEstimado), 0).toFixed(2)}/mês</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Fundos Emergenciais Acumulados:</span>
                <strong style={{ color: 'var(--status-success)' }}>
                  R$ {reservas.reduce((acc, r) => acc + (r.valorAtual || 0), 0).toFixed(2)}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Gasto em Compras:</span>
                <strong>R$ {historicoCompras.reduce((acc, h) => acc + (h.totalPago || 0), 0).toFixed(2)}</strong>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL: Agendar Compromisso / Vacina / Consulta */}
      {isAgendaModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAgendaModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Agendar Compromisso de Saúde</h3>
              <button onClick={() => setIsAgendaModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAgendaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Pet <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <select value={agendaPetId} onChange={e => setAgendaPetId(e.target.value)} style={{ width: '100%' }} required>
                    {pets.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Tipo de Cuidado <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <select value={agendaTipo} onChange={e => setAgendaTipo(e.target.value as any)} style={{ width: '100%' }} required>
                    <option value="vacina">Vacina 💉</option>
                    <option value="consulta">Consulta / Veterinário 🩺</option>
                    <option value="exame">Exame / Ultrassom 🧬</option>
                    <option value="vermifugo">Vermífugo / Pipeta 💊</option>
                    <option value="banho">Banho 🧼</option>
                    <option value="tosa">Tosa ✂️</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Título / Descrição <span style={{ color: 'var(--status-error)' }}>*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Vacina V5 Anual ou Pipeta Vermífugo"
                  value={agendaTitulo}
                  onChange={e => setAgendaTitulo(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Data Agendada <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <input
                    type="date"
                    required
                    value={agendaData}
                    onChange={e => setAgendaData(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Recorrência</label>
                  <select value={agendaRecorrencia} onChange={e => setAgendaRecorrencia(e.target.value)} style={{ width: '100%' }}>
                    <option value="Anual (1x por ano)">Anual (1x por ano)</option>
                    <option value="A cada 2 anos">A cada 2 anos</option>
                    <option value="Semestral (2x por ano)">Semestral (2x por ano)</option>
                    <option value="Trimestral">Trimestral</option>
                    <option value="Mensal">Mensal</option>
                    <option value="Eventual">Eventual</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Custo Estimado (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="150.00"
                  value={agendaValor}
                  onChange={e => setAgendaValor(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-outline" onClick={() => setIsAgendaModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Agendamento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Concluir Agendamento (Dar Vacina / Confirmar Consulta) */}
      {isConcluirAgendaModalOpen && concluirAgendaItem && (
        <div className="modal-overlay" onClick={() => setIsConcluirAgendaModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Registrar Realização de Cuidado</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{concluirAgendaItem.titulo} ({concluirAgendaItem.petNome})</p>
              </div>
              <button onClick={() => setIsConcluirAgendaModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmarConcluirAgenda} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Valor Real Pago (R$) <span style={{ color: 'var(--status-error)' }}>*</span></label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={concluirValorReal}
                  onChange={e => setConcluirValorReal(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Forma de Pagamento <span style={{ color: 'var(--status-error)' }}>*</span></label>
                <select value={concluirMetodoPagamento} onChange={e => setConcluirMetodoPagamento(e.target.value)} style={{ width: '100%' }} required>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="PIX">PIX</option>
                  <option value="Boleto Bancário">Boleto Bancário</option>
                  <option value="Débito em Conta">Débito em Conta</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
              </div>

              <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                💡 Ao confirmar, o valor será contabilizado nas despesas reais de Pets e o agendamento será marcado como concluído. Se for recorrente (ex: Anual), o próximo compromisso será programado automaticamente para o ano que vem!
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-outline" onClick={() => setIsConcluirAgendaModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Confirmar e Registrar Realização</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Guardar Dinheiro / Aportar Reserva */}
      {isAporteModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAporteModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Aportar no Fundo Emergencial</h3>
              <button onClick={() => setIsAporteModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAporteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Valor a Guardar este Mês (R$) <span style={{ color: 'var(--status-error)' }}>*</span></label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ex: 50.00 ou 200.00"
                  value={valorAporteInput}
                  onChange={e => setValorAporteInput(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                💡 Guardar valores mensais cria um fundo garantido para emergências veterinárias, ultrassons e vacinas anuais dos seus pets!
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-outline" onClick={() => setIsAporteModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Confirmar Aporte</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Meta da Reserva */}
      {isMetaModalOpen && (
        <div className="modal-overlay" onClick={() => setIsMetaModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Editar Meta de Saúde</h3>
              <button onClick={() => setIsMetaModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleMetaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Meta da Reserva (R$) <span style={{ color: 'var(--status-error)' }}>*</span></label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={metaInput}
                  onChange={e => setMetaInput(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-outline" onClick={() => setIsMetaModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Meta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Adicionar / Editar Pet */}
      {isPetModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPetModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{editingPetId ? 'Editar Pet' : 'Cadastrar Novo Pet'}</h3>
              <button onClick={() => setIsPetModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <ImageUploader
                label="Foto do Pet (Opcional)"
                value={petFotoUrl}
                onChange={setPetFotoUrl}
                aspectRatio="square"
              />

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Nome do Pet <span style={{ color: 'var(--status-error)' }}>*</span></label>
                <input type="text" required placeholder="Ex: Sofy ou Lua" value={nome} onChange={e => setNome(e.target.value)} style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Espécie <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <select value={especie} onChange={e => setEspecie(e.target.value as any)} style={{ width: '100%' }} required>
                    <option value="cachorro">Cachorro 🐶</option>
                    <option value="gato">Gato 🐱</option>
                    <option value="outro">Outro 🐾</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Raça <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <input type="text" required placeholder="Ex: Vira-lata (SRD)" value={raca} onChange={e => setRaca(e.target.value)} style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Data de Nascimento / Aniversário Aproximada</label>
                  <input
                    type="date"
                    value={dataNascimento}
                    onChange={e => setDataNascimento(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Gasto Mensal Est. Inicial (R$)</label>
                  <input type="number" step="0.01" placeholder="150.00" value={gastoMensal} onChange={e => setGastoMensal(e.target.value)} style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-outline" onClick={() => setIsPetModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Pet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Salvar Carrinho Atual como Template */}
      {isSaveTemplateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSaveTemplateModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Salvar Lista Recorrente</h3>
              <button onClick={() => setIsSaveTemplateModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTemplateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Nome da Lista <span style={{ color: 'var(--status-error)' }}>*</span></label>
                <input type="text" required placeholder="Ex: Compra para o Mês (Cobasi)" value={templateNome} onChange={e => setTemplateNome(e.target.value)} style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Frequência</label>
                  <select value={templateFrequencia} onChange={e => setTemplateFrequencia(e.target.value as any)} style={{ width: '100%' }}>
                    <option value="Mensal">Mensal</option>
                    <option value="Quinzenal">Quinzenal</option>
                    <option value="Semanal">Semanal</option>
                    <option value="Eventual">Eventual</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Loja / Estabelecimento</label>
                  <input type="text" placeholder="Ex: Cobasi" value={templateLoja} onChange={e => setTemplateLoja(e.target.value)} style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-outline" onClick={() => setIsSaveTemplateModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Template</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Lista Salva / Template */}
      {isEditTemplateModalOpen && editingTemplate && (
        <div className="modal-overlay" onClick={() => setIsEditTemplateModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Editar Lista Salva</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Altere o nome, frequência, loja ou produtos desta lista.</p>
              </div>
              <button onClick={() => setIsEditTemplateModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditTemplateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Nome da Lista <span style={{ color: 'var(--status-error)' }}>*</span></label>
                <input
                  type="text"
                  required
                  value={editTemplateNome}
                  onChange={e => setEditTemplateNome(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Frequência</label>
                  <select
                    value={editTemplateFrequencia}
                    onChange={e => setEditTemplateFrequencia(e.target.value as any)}
                    style={{ width: '100%' }}
                  >
                    <option value="Mensal">Mensal</option>
                    <option value="Quinzenal">Quinzenal</option>
                    <option value="Semanal">Semanal</option>
                    <option value="Eventual">Eventual</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Loja / Estabelecimento</label>
                  <input
                    type="text"
                    value={editTemplateLoja}
                    onChange={e => setEditTemplateLoja(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Itens do Template */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Produtos da Lista Modelo ({editTemplateItens.length})</label>
                  <button
                    type="button"
                    onClick={() => {
                      const novoItem: ItemCompraPet = {
                        id: `tmpl_item_${Date.now()}`,
                        petId: pets[0]?.id || 'pet_01',
                        petNome: pets[0]?.nome || 'Pet',
                        produto: 'Novo Produto',
                        quantidade: 1,
                        valorSemDesconto: 10.00,
                        valorComDesconto: 10.00
                      };
                      setEditTemplateItens(prev => [...prev, novoItem]);
                    }}
                    style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.78rem' }}
                  >
                    + Adicionar Produto à Lista
                  </button>
                </div>

                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {editTemplateItens.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>
                      Nenhum produto nesta lista.
                    </p>
                  ) : (
                    editTemplateItens.map((item, idx) => (
                      <div key={item.id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', gap: '0.5rem' }}>
                        <div style={{ flex: 1, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={item.produto}
                            onChange={e => {
                              const val = e.target.value;
                              setEditTemplateItens(prev => prev.map((it, i) => i === idx ? { ...it, produto: val } : it));
                            }}
                            style={{ flex: 1, fontSize: '0.82rem', padding: '0.25rem 0.5rem' }}
                            placeholder="Nome do produto"
                          />
                          <select
                            value={item.petId}
                            onChange={e => {
                              const pId = e.target.value;
                              const pName = pets.find(p => p.id === pId)?.nome || 'Pet';
                              setEditTemplateItens(prev => prev.map((it, i) => i === idx ? { ...it, petId: pId, petNome: pName } : it));
                            }}
                            style={{ fontSize: '0.78rem', padding: '0.25rem 0.35rem' }}
                          >
                            {pets.map(p => (
                              <option key={p.id} value={p.id}>{p.nome}</option>
                            ))}
                          </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="number"
                            min="1"
                            value={item.quantidade}
                            onChange={e => {
                              const val = parseInt(e.target.value || '1');
                              setEditTemplateItens(prev => prev.map((it, i) => i === idx ? { ...it, quantidade: val } : it));
                            }}
                            style={{ width: '45px', padding: '0.25rem', textAlign: 'center', fontSize: '0.82rem' }}
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={item.valorComDesconto}
                            onChange={e => {
                              const val = parseFloat(e.target.value || '0');
                              setEditTemplateItens(prev => prev.map((it, i) => i === idx ? { ...it, valorComDesconto: val, valorSemDesconto: val } : it));
                            }}
                            style={{ width: '75px', padding: '0.25rem', textAlign: 'right', fontSize: '0.82rem' }}
                          />
                          <button
                            type="button"
                            onClick={() => setEditTemplateItens(prev => prev.filter((_, i) => i !== idx))}
                            style={{ color: 'var(--status-error)', padding: '0.2rem' }}
                            title="Remover Produto da Lista"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-outline" onClick={() => setIsEditTemplateModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Alterações da Lista</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Fechar Compra (Checkout de Compra Pet) */}
      {isProcessarCompraModalOpen && (
        <div className="modal-overlay" onClick={() => setIsProcessarCompraModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Finalizar & Processar Compra Pet</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Confirme a forma de pagamento, frete e desconto.</p>
              </div>
              <button onClick={() => setIsProcessarCompraModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmarProcessarCompra} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Nome da Lista / Origem</label>
                  <input
                    type="text"
                    placeholder="Ex: Compra para o Mês (Cobasi)"
                    value={nomeListaCheckout}
                    onChange={e => setNomeListaCheckout(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Forma de Pagamento <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <select value={metodoPagamento} onChange={e => setMetodoPagamento(e.target.value)} style={{ width: '100%' }} required>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="PIX">PIX</option>
                    <option value="Boleto Bancário">Boleto Bancário</option>
                    <option value="Débito em Conta">Débito em Conta</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>
              </div>

              {/* Opções de Entrega e Frete com Recálculo Instantâneo em Tempo Real */}
              <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>Entrega e Frete</label>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: teveFrete ? '0.5rem' : 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="freteOpt"
                      checked={!teveFrete}
                      onChange={() => { setTeveFrete(false); setValorFrete('0'); }}
                    />
                    <span>Frete Grátis 🚚</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="freteOpt"
                      checked={teveFrete}
                      onChange={() => setTeveFrete(true)}
                    />
                    <span>Com frete (pago)</span>
                  </label>
                </div>

                {teveFrete && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Valor do Frete (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="15.00"
                      value={valorFrete}
                      onChange={e => setValorFrete(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
              </div>

              {/* Tabela de Produtos da Compra (Com Edição Instantânea de Qtd & Remoção) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Itens da Compra ({itensParaComprar.length})</label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Edite quantidades ou remova produtos diretamente nesta tela</span>
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {itensParaComprar.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>
                      Nenhum item selecionado.
                    </p>
                  ) : (
                    itensParaComprar.map((item, index) => (
                      <div key={item.id || index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', gap: '0.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <strong style={{ fontSize: '0.82rem', display: 'block' }}>{item.produto}</strong>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>🐱 {item.petNome}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <button
                              type="button"
                              onClick={() => {
                                const newQtd = Math.max(1, item.quantidade - 1);
                                setItensParaComprar(prev => prev.map((it, idx) => idx === index ? { ...it, quantidade: newQtd } : it));
                              }}
                              style={{ padding: '0.1rem 0.35rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', fontWeight: 700 }}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantidade}
                              onChange={(e) => {
                                const val = Math.max(1, parseInt(e.target.value || '1'));
                                setItensParaComprar(prev => prev.map((it, idx) => idx === index ? { ...it, quantidade: val } : it));
                              }}
                              style={{ width: '45px', padding: '0.2rem', textAlign: 'center', fontSize: '0.82rem' }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newQtd = item.quantidade + 1;
                                setItensParaComprar(prev => prev.map((it, idx) => idx === index ? { ...it, quantidade: newQtd } : it));
                              }}
                              style={{ padding: '0.1rem 0.35rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', fontWeight: 700 }}
                            >
                              +
                            </button>
                          </div>

                          <span style={{ fontSize: '0.85rem', fontWeight: 700, width: '85px', textAlign: 'right', color: 'var(--status-success)' }}>
                            R$ {(item.valorComDesconto * item.quantidade).toFixed(2)}
                          </span>

                          <button
                            type="button"
                            onClick={() => setItensParaComprar(prev => prev.filter((_, idx) => idx !== index))}
                            style={{ color: 'var(--status-error)', padding: '0.2rem' }}
                            title="Remover item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Summary Totals Breakdown (MATEMÁTICA 100% CORRETA DO FRETE) */}
              <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--bg-primary-light)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Subtotal dos Produtos:</span>
                  <span>R$ {calcSubtotalComDesconto.toFixed(2)}</span>
                </div>

                {calcEconomiaProdutos > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem', color: 'var(--status-success)', fontWeight: 600 }}>
                    <span>Economia Clube (Desconto):</span>
                    <span>- R$ {calcEconomiaProdutos.toFixed(2)}</span>
                  </div>
                )}

                {calcDescontoCupom > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem', color: 'var(--status-success)', fontWeight: 600 }}>
                    <span>Cupom Extra:</span>
                    <span>- R$ {calcDescontoCupom.toFixed(2)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Frete:</span>
                  <span style={{ fontWeight: teveFrete && calcFreteVal > 0 ? 700 : 400, color: teveFrete && calcFreteVal > 0 ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                    {teveFrete && calcFreteVal > 0 ? `+ R$ ${calcFreteVal.toFixed(2)}` : 'Grátis'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 700 }}>Pagamento final total:</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    R$ {calcTotalFinalPago.toFixed(2)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-outline" onClick={() => setIsProcessarCompraModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
                  Confirmar e Finalizar Compra
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: Visualizar Nota / Comprovante de Compra (Botão Olho 👁️) */}
      {selectedReceipt && (
        <div className="modal-overlay" onClick={() => setSelectedReceipt(null)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '2px solid var(--color-primary)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Comprovante de Compra Pet</h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Protocolo #{selectedReceipt.id}</span>
                </div>
              </div>
              <button onClick={() => setSelectedReceipt(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Receipt Metadata */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '0.85rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Data da Compra:</span>
                  <strong style={{ fontSize: '0.85rem' }}>{selectedReceipt.dataCompra}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Lista Utilizada:</span>
                  <strong style={{ fontSize: '0.85rem' }}>{selectedReceipt.nomeLista || 'Geral'} ({selectedReceipt.loja || 'Cobasi'})</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Forma de Pagamento:</span>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}>{selectedReceipt.metodoPagamento}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Frete da Entrega:</span>
                  <strong style={{ fontSize: '0.85rem' }}>
                    {selectedReceipt.teveFrete && selectedReceipt.valorFrete > 0 ? `R$ ${selectedReceipt.valorFrete.toFixed(2)}` : 'Frete Grátis 🚚'}
                  </strong>
                </div>
              </div>

              {/* Table of Purchased Products */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>Produtos Comprados:</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {selectedReceipt.itensComprados?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
                      <div>
                        <strong style={{ fontSize: '0.82rem', display: 'block' }}>{item.produto}</strong>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>🐱 {item.petNome} • {item.quantidade}x R$ {item.valorComDesconto.toFixed(2)}</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        R$ {(item.valorComDesconto * item.quantidade).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div style={{ padding: '0.85rem', backgroundColor: 'var(--status-success-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-success)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Valor Bruto Produtos:</span>
                  <span>R$ {(selectedReceipt.valorProdutos || selectedReceipt.totalPago).toFixed(2)}</span>
                </div>
                {selectedReceipt.valorDesconto > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem', color: 'var(--status-success)', fontWeight: 600 }}>
                    <span>Economia Clube / Desconto:</span>
                    <span>- R$ {selectedReceipt.valorDesconto.toFixed(2)}</span>
                  </div>
                )}
                {selectedReceipt.valorFrete > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Frete:</span>
                    <span>+ R$ {selectedReceipt.valorFrete.toFixed(2)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--status-success)', paddingTop: '0.5rem', marginTop: '0.35rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800 }}>TOTAL PAGO NA NOTA:</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--status-success)' }}>
                    R$ {selectedReceipt.totalPago.toFixed(2)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button className="btn-primary" onClick={() => setSelectedReceipt(null)}>
                  Fechar Comprovante
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL: Registrar Emergência Pet */}
      {isEmergenciaModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEmergenciaModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--status-error)' }}>🚨 Registrar Emergência Médica</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Utilize para cirurgias urgentes, acidentes ou despesas graves.</p>
              </div>
              <button onClick={() => setIsEmergenciaModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEmergenciaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Selecione o Pet <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <select value={emergenciaPetId} onChange={e => setEmergenciaPetId(e.target.value)} style={{ width: '100%' }} required>
                    {pets.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Data do Ocorrido <span style={{ color: 'var(--status-error)' }}>*</span></label>
                  <input type="date" required value={emergenciaData} onChange={e => setEmergenciaData(e.target.value)} style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Custo Total da Emergência (R$) <span style={{ color: 'var(--status-error)' }}>*</span></label>
                <input
                  type="number" step="0.01" required
                  placeholder="Ex: 1200.00"
                  value={emergenciaValorTotal}
                  onChange={e => setEmergenciaValorTotal(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={emergenciaUsouReserva}
                    onChange={e => setEmergenciaUsouReserva(e.target.checked)}
                  />
                  Utilizou o dinheiro da Reserva Saúde para pagar?
                </label>

                {emergenciaUsouReserva && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      Qual valor você retirou da reserva para essa emergência? (R$)
                    </label>
                    <input
                      type="number" step="0.01" required
                      value={emergenciaValorUsadoReserva}
                      onChange={e => setEmergenciaValorUsadoReserva(e.target.value)}
                      style={{ width: '100%' }}
                    />
                    <small style={{ color: 'var(--status-error)', display: 'block', marginTop: '0.2rem' }}>O valor será debitado do saldo da reserva atual deste pet.</small>
                  </div>
                )}
              </div>

              {((parseFloat(emergenciaValorTotal || '0') - (emergenciaUsouReserva ? parseFloat(emergenciaValorUsadoReserva || '0') : 0)) > 0) && (
                <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--color-primary)' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>Valor Restante a Pagar</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Ficou um restante de R$ {(parseFloat(emergenciaValorTotal || '0') - (emergenciaUsouReserva ? parseFloat(emergenciaValorUsadoReserva || '0') : 0)).toFixed(2)} que não foi coberto pela reserva. Como você pagou isso?
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.35rem' }}>Forma de Pagamento</label>
                      <select value={emergenciaMetodoRestante} onChange={e => setEmergenciaMetodoRestante(e.target.value)} style={{ width: '100%' }}>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                        <option value="PIX">PIX</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Débito em Conta">Débito em Conta</option>
                      </select>
                    </div>
                    {emergenciaMetodoRestante === 'Cartão de Crédito' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={emergenciaParcelado} onChange={e => setEmergenciaParcelado(e.target.checked)} />
                          Foi Parcelado?
                        </label>
                        {emergenciaParcelado && (
                          <input
                            type="number" min="1" max="24"
                            placeholder="Qtd vezes"
                            value={emergenciaParcelas}
                            onChange={e => setEmergenciaParcelas(e.target.value)}
                            style={{ width: '100%' }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Observação (O que aconteceu?)</label>
                <textarea
                  rows={3}
                  value={emergenciaObservacao}
                  onChange={e => setEmergenciaObservacao(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)' }}
                  placeholder="Ex: Teve que fazer cirurgia por causa de XYZ..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-outline" onClick={() => setIsEmergenciaModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ backgroundColor: 'var(--status-error)', borderColor: 'var(--status-error)' }}>Confirmar Emergência</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
