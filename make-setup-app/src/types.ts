export type NavigationTab = 
  | 'dashboard'
  | 'lancamentos'
  | 'despesas'
  | 'planejamento'
  | 'estetica'
  | 'pets'
  | 'carros'
  | 'cartao'
  | 'inadimplencias'
  | 'privacy'
  | 'user_settings'
  | 'saas_master';

export type UserRole = 'admin_master' | 'tenant_admin' | 'member' | 'viewer';
export type ThemePreference = 'light' | 'dark' | 'system';

export interface UserProfile {
  id: string;
  usuarioId?: string;
  name: string;
  email: string;
  role: UserRole;
  mfaEnabled: boolean;
  pseudonymizedId: string;
  avatar: string;
  themePreference?: ThemePreference; // Preferência de Tema ('light' | 'dark' | 'system')
  genero?: 'feminino' | 'masculino' | 'transgenero' | 'nao-binario' | 'outro';
  isFirstLogin?: boolean;
}

export interface JWTTokenClaim {
  user_id: string;
  role: UserRole;
  exp: number;
  iss: string;
}

export interface ConviteMembro {
  id: string;
  nome: string;
  email: string;
  role: 'member' | 'viewer';
  status: 'ativo' | 'pendente';
  dataConvite: string;
}

export type TransactionType = 'receita' | 'despesa';

export interface Lancamento {
  id: string;
  usuarioId?: string;
  descricao: string;
  categoria: string;
  tipo: TransactionType;
  valor: number;
  dia: number;
  recorrente: boolean;
  mesEspecifico?: string; // Para eventos anuais esporádicos (13º, bônus) no formato 'YYYY-MM'
  dataInicioRecorrencia?: string; // 'YYYY-MM' - a partir de qual mês este valor é válido
  dataFimRecorrencia?: string; // 'YYYY-MM' - até qual mês este valor foi válido (antes de um reajuste)
  status: 'realizado' | 'previsto';
  metodoPagamento?: string;
  dataPagamento?: string;
}

export interface DespesaMensal {
  id: string;
  descricao: string;
  categoria: string;
  diaVencimento: number;
  valorPrevisto: number;
  valorPago?: number;
  dataPagamento?: string;
  metodoPagamento?: string;
  status: 'pago' | 'previsto' | 'atrasado';
  mes: string;
  jurosAcumulados?: number;
  origemRolloverMes?: string;
  lancamentoOrigemId?: string; // ID do Lançamento Recorrente (se aplicável)
  dataInicioRecorrencia?: string; // 'YYYY-MM'
  dataFimRecorrencia?: string; // 'YYYY-MM'
}

export interface SessaoRealizada {
  id: string;
  data: string;
  valor: number;
}

export interface RitualEstetica {
  id: string;
  nome: string;
  categoria: 'estetica';
  generoAlvo: 'todos' | 'homem' | 'mulher' | 'masculino' | 'feminino';
  valor: number;
  frequencia: 'Semanal' | 'Bisemanal' | 'Mensal';
  proximaData: string;
  historicoGasto: number;
  sessoesRealizadas?: SessaoRealizada[];
}

export interface Pet {
  id: string;
  nome: string;
  especie: 'cachorro' | 'gato' | 'outro';
  raca: string;
  idade: string;
  dataNascimento?: string; // YYYY-MM-DD (Data de aniversário/nascimento aproximada)
  fotoUrl: string;
  gastoMensalEstimado: number;
  ativo?: boolean;
}

export interface ReservaPet {
  id: string;
  petId: string;
  petNome: string;
  objetivo?: string;
  valorAtual: number;
  meta: number;
}

export interface EmergenciaPet {
  id: string;
  petId: string;
  petNome: string;
  data: string;
  valorTotal: number;
  usouReserva: boolean;
  valorUsadoReserva?: number;
  metodoPagamentoRestante?: string;
  parcelado?: boolean;
  parcelas?: number;
  observacao?: string;
}

export interface ItemAgendaPet {
  id: string;
  petId: string;
  petNome: string;
  titulo: string;
  tipo: 'vacina' | 'consulta' | 'banho' | 'tosa' | 'medicamento' | 'exame' | 'vermifugo';
  data: string;
  recorrencia?: string;
  valor: number;
  status?: 'pendente' | 'realizado';
}

export interface ItemCompraPet {
  id: string;
  petId: string;
  petNome: string;
  produto: string;
  recorrencia?: string;
  quantidade: number;
  valorSemDesconto?: number;
  valorComDesconto: number;
  comprado?: boolean;
}

export interface CarrinhoSalvoPet {
  id: string;
  nome: string;
  frequencia: 'Mensal' | 'Quinzenal' | 'Semanal' | 'Eventual';
  loja?: string;
  itens: ItemCompraPet[];
}

export interface HistoricoCompraPet {
  id: string;
  dataCompra: string;
  nomeLista?: string;
  loja?: string;
  metodoPagamento: string;
  teveFrete: boolean;
  valorFrete: number;
  valorDesconto: number;
  valorProdutos: number;
  totalPago: number;
  itensCompradosCount: number;
  itensComprados: ItemCompraPet[];
}

export interface Veiculo {
  id: string;
  nome: string;
  marcaModelo: string;
  placa: string;
  fotoUrl: string;
  kmAtual: number;
  gastoMensalEstimado: number;
  financiado?: boolean;
  valorParcelaFinanciamento?: number;
  parcelasTotaisFinanciamento?: number;
  parcelasPagasFinanciamento?: number;
  diaVencimentoFinanciamento?: number;
  bancoFinanciamento?: string;
}

export interface Abastecimento {
  id: string;
  veiculoId: string;
  veiculoNome: string;
  posto: string;
  litros: number;
  kmAtual: number;
  valorTotal: number;
  data: string;
}

export interface ManutencaoVeiculo {
  id: string;
  veiculoId: string;
  veiculoNome: string;
  descricao: string;
  oficina: string;
  valorTotal: number;
  parcelasTotal: number;
  parcelaAtual: number;
  valorParcela: number;
  dataInicio: string;
  ativa: boolean;
}

export interface CartaoCredito {
  id: string;
  nomeCartao: string;
  banco: string;
  limiteTotal: number;
  limiteDisponivel: number;
  faturaAtual: number;
  diaFechamento: number;
  diaVencimento: number;
  ultimosDigitos: string;
}

export interface FaturaItem {
  id: string;
  cartaoId: string;
  descricao: string;
  categoria: string;
  valor: number;
  parcela?: string;
  data: string;
}

export interface Inadimplencia {
  id: string;
  credorOuDevedor: string;
  tipo: 'divida_propria' | 'a_receber';
  descricao: string;
  valorOriginal: number;
  jurosMulta: number;
  valorAtualizado: number;
  dataVencimentoOriginal: string;
  status: 'pendente' | 'em_renegociacao' | 'quitado';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  usuario: string;
  perfil: string;
  acao: string;
  detalhes: string;
  ip: string;
}

export interface PrivacySettings {
  pseudonymizeExport: boolean;
  mfaRequired: boolean;
  autoEncryptAtRest: boolean;
  consentAnalytics: boolean;
  petsModuleEnabled: boolean;
  esteticaEnabled: boolean;
  carrosEnabled: boolean;
  cartoesEnabled: boolean;
  inadimplenciasEnabled: boolean;
  planejamentoEnabled?: boolean;
  familiaEnabled?: boolean;
  globalMaintenanceMode?: boolean;
  lgpdAcceptedAt?: string;
  setupCompletedAt?: string;
}

export interface MetaPlanejamento {
  id: string;
  titulo: string;
  categoria: 'Moradia' | 'Educação' | 'Lazer & Viagens' | 'Veículos' | 'Investimentos' | 'Tecnologia' | 'Outros';
  valorMeta: number;
  valorAtual: number;
  prazoTipo: 'curto' | 'medio' | 'longo'; // Curto (< 1 ano), Médio (1-3 anos), Longo (4-6+ anos)
  prazoAnos?: string; // Ex: "4 a 6 anos"
  dataLimite: string; // YYYY-MM-DD
  fotoUrl?: string;
  observacao?: string;
}

