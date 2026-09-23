import React, { useState } from 'react';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Repeat,
  Pencil,
  Trash2
} from 'lucide-react';
import type { Lancamento, TransactionType } from '../types';
import { confirmDelete, showToastSuccess } from '../utils/sweetAlert';
import { maskCurrency, unmaskCurrency } from '../utils/masks';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';

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
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header & Title */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Lançamentos (Entradas & Saídas)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Controle de fluxo financeiro, salários, freelas e custos operacionais fixos.
          </p>
        </div>

        <Button onClick={handleOpenAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Lançamento
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Entradas Previstas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              + R$ {entradasPrevistas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Saídas Fixas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              - R$ {saidasFixas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Resultado Projetado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              R$ {resultadoProjetado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls & Table Card */}
      <Card>
        <CardContent className="pt-6">
          
          {/* Filters & Search Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
            
            {/* Tabs Filter */}
            <div className="flex bg-muted p-1 rounded-md border border-border">
              {(['todos', 'receita', 'despesa'] as const).map(ft => (
                <button
                  key={ft}
                  onClick={() => setFilterType(ft)}
                  className={`px-4 py-1.5 rounded-sm text-sm font-semibold transition-all ${
                    filterType === ft 
                      ? 'bg-background text-primary shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {ft === 'todos' ? 'Todos' : ft === 'receita' ? 'Receita (+)' : 'Despesa (-)'}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="text"
                placeholder="Filtrar por nome ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Transactions Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Dia do Mês</TableHead>
                <TableHead>Recorrência</TableHead>
                <TableHead className="text-right">Valor (R$)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLancamentos.map(item => {
                const isReceita = item.tipo === 'receita';

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isReceita ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {isReceita ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-foreground">{item.descricao}</span>
                        {item.status === 'realizado' && item.metodoPagamento && (
                          <span className="text-xs text-muted-foreground">
                            💳 {item.metodoPagamento} {item.dataPagamento ? `em ${item.dataPagamento.split('-').reverse().join('/')}` : ''}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="secondary" className="font-medium text-xs">
                        {item.categoria}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-muted-foreground text-sm">
                      Dia {item.dia}
                    </TableCell>

                    <TableCell className="text-muted-foreground text-sm">
                      {item.recorrente ? (
                        <span className="inline-flex items-center gap-1 text-secondary">
                          <Repeat className="h-3 w-3" /> Mensal
                          {item.dataFimRecorrencia && item.dataFimRecorrencia < currentMonthYYYYMM && (
                            <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 h-4">Antigo</Badge>
                          )}
                          {item.dataInicioRecorrencia && item.dataInicioRecorrencia > currentMonthYYYYMM && (
                            <Badge className="ml-1 text-[10px] px-1 py-0 h-4">Futuro</Badge>
                          )}
                        </span>
                      ) : (
                        <span>
                          Pontual {item.mesEspecifico && `(${item.mesEspecifico})`}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className={`text-right font-bold text-sm ${
                      isReceita ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {isReceita ? '+' : '-'} R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-secondary" onClick={() => handleOpenEdit(item)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item)} title="Excluir">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredLancamentos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Nenhum lançamento encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Add / Edit Lançamento */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Lançamento' : 'Cadastrar Novo Lançamento'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            
            <div>
              <Label className="mb-2 block">Tipo <span className="text-destructive">*</span></Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" name="tipo" className="accent-primary" checked={tipo === 'receita'} onChange={() => setTipo('receita')} />
                  <span>Receita (+)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" name="tipo" className="accent-primary" checked={tipo === 'despesa'} onChange={() => setTipo('despesa')} />
                  <span>Despesa (-)</span>
                </label>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Descrição <span className="text-destructive">*</span></Label>
              <Input 
                type="text" 
                required
                placeholder="Ex: Consultoria de Software"
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Categoria <span className="text-destructive">*</span></Label>
                <Select value={categoria} onValueChange={setCategoria} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Renda Principal">Renda Principal</SelectItem>
                    <SelectItem value="Renda Extra">Renda Extra</SelectItem>
                    <SelectItem value="Moradia">Moradia</SelectItem>
                    <SelectItem value="Utilidades">Utilidades</SelectItem>
                    <SelectItem value="Alimentação">Alimentação</SelectItem>
                    <SelectItem value="Saúde">Saúde</SelectItem>
                    <SelectItem value="Transporte">Transporte</SelectItem>
                    <SelectItem value="Pets">Pets</SelectItem>
                    <SelectItem value="Lazer">Lazer</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">Valor (R$) <span className="text-destructive">*</span></Label>
                <Input 
                  type="text"
                  required
                  placeholder="R$ 0,00"
                  value={valor}
                  onChange={e => setValor(maskCurrency(e.target.value))}
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Dia do Vencimento/Recebimento <span className="text-destructive">*</span></Label>
              <Input 
                type="number" 
                min="1" 
                max="31"
                required
                value={dia} 
                onChange={e => setDia(e.target.value)} 
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium mt-1">
              <input type="checkbox" className="accent-primary w-4 h-4 rounded" checked={recorrente} onChange={e => {
                setRecorrente(e.target.checked);
                if (e.target.checked) {
                  setMesEspecifico('');
                }
              }} />
              <span>Repetir mensalmente (Lançamento Recorrente)</span>
            </label>

            <div className="grid grid-cols-2 gap-4 bg-muted p-4 rounded-md mt-2">
              <div>
                <Label className="mb-2 block text-xs">Data do Pagamento (Opcional)</Label>
                <Input 
                  type="date"
                  value={dataPagamento}
                  onChange={e => setDataPagamento(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-2 block text-xs">Método de Pagamento</Label>
                <Select value={metodoPagamento} onValueChange={setMetodoPagamento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Não especificado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pix">Pix</SelectItem>
                    <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                    <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Transferência">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!recorrente && (
              <div className="mt-2">
                <Label className="mb-2 block">Mês Específico (Opcional - Ex: 13º Salário)</Label>
                <Input 
                  type="month" 
                  value={mesEspecifico} 
                  onChange={e => setMesEspecifico(e.target.value)} 
                  className="w-1/2"
                />
                <span className="text-xs text-muted-foreground mt-1 block">Deixe vazio se for apenas um ganho/gasto deste mês.</span>
              </div>
            )}

            {editingId && recorrente && (
              <div className="mt-2 bg-primary/10 p-4 rounded-md border border-primary/20">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-primary">
                  <input type="checkbox" className="accent-primary w-4 h-4" checked={isProgressiveEdit} onChange={e => setIsProgressiveEdit(e.target.checked)} />
                  <span>Aplicar novo valor apenas a partir de um mês específico (Preservar Histórico)</span>
                </label>
                
                {isProgressiveEdit && (
                  <div className="mt-3">
                    <Label className="mb-2 block text-primary">A partir de qual mês este valor passa a valer? <span className="text-destructive">*</span></Label>
                    <Input 
                      type="month" 
                      required={isProgressiveEdit}
                      value={progressiveMonth} 
                      onChange={e => setProgressiveMonth(e.target.value)} 
                      className="w-1/2 border-primary/40 focus-visible:ring-primary"
                    />
                    <span className="text-xs text-primary/70 mt-1 block">Meses anteriores manterão o valor antigo no fluxo de caixa anual.</span>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingId ? 'Salvar Alterações' : 'Salvar Lançamento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
