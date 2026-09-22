# Task Plan - Figma Site Exploration

- [x] Navigate to https://clamp-lime-50987844.figma.site and wait for load.
- [x] Capture initial screenshot.
- [ ] Explore layout, color scheme, typography.
- [x] Identify and document main navigation and tabs.
- [ ] Explore income/expense tracking features.
- [ ] Explore pet/vehicle budgeting features.
- [ ] Explore charts and visualization.
- [ ] Explore interactive elements (dialogs, buttons, forms).
- [ ] Document sample data.
- [ ] Summarize findings.

## Findings

### General Layout & Theme
- **App Name**: MoonFinance (.me)
- **Language**: Portuguese (PT-BR)
- **Theme**: Warm, beige/sand background with dark brown/reddish accents.
- **Sidebar**: Left-aligned navigation.
- **Header**: Search bar, notifications, theme toggle, profile.

### Navigation Items
- **Geral**: Dashboard, Lançamentos, Despesas
- **Módulos**: Estética, Pets, Carros
- **Crédito**: Cartão de crédito, Inadimplências

### Dashboard (Visão Geral)
- **KPI Cards**:
  - Receita do mês: R$ 10.450,00 (+8,8%)
  - Despesas do mês: R$ 5.860,00 (-20,9% red)
  - Saldo líquido: R$ 4.590,00 (+12,4%)
  - Margem líquida: 43,9% (+3,1%)
- **Charts**:
  - Fluxo de Caixa (Last 6 Months): Receita (green) vs. Despesa (brown). Jun values: Receita R$ 9.800,00, Despesa R$ 8.240,00.
  - Por categoria (August): Donut chart showing Moradia (R$ 2.340,00), Utilidades (R$ 541,00), Saúde (R$ 640,00), Carros (R$ 780,00), Estética (R$ 320,00), Pets (R$ 245,00).
- **Other Dashboard Elements**:
  - Liquidez vs. rentabilidade: Warning box suggesting allocation of R$ 1.120,00 with "Simular alocação" button.
  - Próximos vencimentos: Sabesp (R$ 128,90, Previsto), Plano de saúde (R$ 640,00, Previsto), IPTU (R$ 218,40, Atrasado).
  - Indicadores: Margem bruta (62,4%), Liquidez corrente (1,78), Comprometimento (56,0%).

### Lançamentos Page
- **KPI Cards**:
  - Entradas previstas: R$ 10.450,00
  - Saídas fixas: R$ 4.761,20
  - Resultado projetado: R$ 5.688,80
- **Controls**: Filters for Todos, Receita, Despesa. "+ Novo" button.
- **Transactions Table (August 2026)**:
  - Salário (Renda, dia 5): + R$ 8.600,00 (Recurring)
  - Freelance design (Renda, dia 18): + R$ 1.850,00
  - Financiamento apto (Moradia, dia 10): - R$ 2.340,00 (Recurring)
  - Enel — energia (Utilidades, dia 15): - R$ 312,40 (Recurring)
  - Sabesp — água (Utilidades, dia 15): - R$ 128,90 (Recurring)
  - Internet fibra (Utilidades, dia 8): - R$ 99,90 (Recurring)
  - Plano de saúde (Saúde, dia 12): - R$ 640,00 (Recurring)
  - Mercado (Alimentação, dia 20): - R$ 1.240,00

### Despesas Page
- **KPI Cards**:
  - Previsto no mês: R$ 3.739,60
  - Já realizado: R$ 2.738,60 (with progress bar)
  - A vencer: R$ 1.001,00
- **Rollover Info Box**: Shows active rollover engine. E.g., IPTU (parcela jul) accumulated to Aug with interest: R$ 218,40 -> R$ 224,52 (2.8% a.m.).
- **Accounts List**:
  - Financiamento apto: R$ 2.340,00 (Paid, Moradia, dia 10)
  - Enel — energia: R$ 298,70 (Paid, Utilidades, dia 15) - *Note: actual value paid differs from plan in Lançamentos (R$ 312,40)*
  - Sabesp — água: R$ 128,90 (Expected, Utilidades, dia 15, has "Pagar" button)
  - Plano de saúde: R$ 640,00 (Expected, Saúde, dia 12, has "Pagar" button)
  - Internet fibra: R$ 99,90 (Paid, Utilidades, dia 8)
  - IPTU (parcela jul): R$ 224,52 (Overdue, Impostos, dia 5, has "Pagar" button)
- **Interactive Elements**:
  - "+ Nova conta" button opens a modal form with fields: Descrição, Categoria, Dia do vencimento, Valor previsto (R$), Status, Cancelar button, and a disabled Salvar conta button.
  - "Pagar" buttons on unpaid items.
  - Edit and Delete icons on each row.

### Estética Page
- **KPI Cards**:
  - Impacto mensal projetado: R$ 520,00
  - Projeção anual no fluxo de caixa: R$ 6.240,00
- **Scheduled Rituals**:
  - Manicure & pedicure: R$ 65,00 (Weekly, Next: 23 Aug)
  - Corte de cabelo: R$ 90,00 (Monthly, Next: 04 Sep)
  - Sobrancelha: R$ 45,00 (Biweekly, Next: 27 Aug)
  - Barba: R$ 40,00 (Biweekly, Next: 26 Aug)
- **Interactive Elements**:
  - "+ Novo ritual" button.
