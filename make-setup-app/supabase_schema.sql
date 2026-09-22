-- Crie as tabelas copiando e colando este código no SQL Editor do Supabase

-- Tabela de Lancamentos
create table public.lancamentos (
  id text primary key,
  tenant_id text not null,
  descricao text not null,
  categoria text not null,
  tipo text not null,
  valor numeric not null,
  dia integer,
  recorrente boolean,
  status text not null,
  data_inicio_recorrencia text,
  data_fim_recorrencia text,
  mes_especifico text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Despesas
create table public.despesas (
  id text primary key,
  tenant_id text not null,
  nome text,
  descricao text,
  categoria text not null,
  dia_vencimento integer,
  data_vencimento text,
  valor_previsto numeric not null,
  valor_pago numeric,
  status text not null,
  mes text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Pets
create table public.pets (
  id text primary key,
  tenant_id text not null,
  nome text not null,
  especie text not null,
  raca text,
  idade text,
  foto_url text,
  gasto_mensal_estimado numeric not null,
  contribuicao_mensal_reserva numeric,
  ativo boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Cartoes
create table public.cartoes (
  id text primary key,
  tenant_id text not null,
  nome_cartao text not null,
  banco text not null,
  limite_total numeric not null,
  limite_disponivel numeric not null,
  fatura_atual numeric not null,
  dia_fechamento integer not null,
  dia_vencimento integer not null,
  ultimos_digitos text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS (Segurança) mas permitir acesso anônimo para o momento (apenas para testes)
alter table public.lancamentos enable row level security;
alter table public.despesas enable row level security;
alter table public.pets enable row level security;
alter table public.cartoes enable row level security;

create policy "Permitir leitura anonima lancamentos" on public.lancamentos for select using (true);
create policy "Permitir escrita anonima lancamentos" on public.lancamentos for insert with check (true);
create policy "Permitir atualizacao anonima lancamentos" on public.lancamentos for update using (true);
create policy "Permitir remocao anonima lancamentos" on public.lancamentos for delete using (true);

create policy "Permitir leitura anonima despesas" on public.despesas for select using (true);
create policy "Permitir escrita anonima despesas" on public.despesas for insert with check (true);
create policy "Permitir atualizacao anonima despesas" on public.despesas for update using (true);
create policy "Permitir remocao anonima despesas" on public.despesas for delete using (true);

create policy "Permitir leitura anonima pets" on public.pets for select using (true);
create policy "Permitir escrita anonima pets" on public.pets for insert with check (true);
create policy "Permitir atualizacao anonima pets" on public.pets for update using (true);
create policy "Permitir remocao anonima pets" on public.pets for delete using (true);

create policy "Permitir leitura anonima cartoes" on public.cartoes for select using (true);
create policy "Permitir escrita anonima cartoes" on public.cartoes for insert with check (true);
create policy "Permitir atualizacao anonima cartoes" on public.cartoes for update using (true);
create policy "Permitir remocao anonima cartoes" on public.cartoes for delete using (true);
