-- ==============================================================================
-- MOONFINANCE (moonfinanceme.com.br) - ESTRUTURA COMPLETA DE BANCO DE DADOS MYSQL
-- Multi-Tenant, RBAC, Cartões, Veículos, Pets, Planejamento & Sonhos, Estética, Logs & Privacidade
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `pri04258_moon_finance_me` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `pri04258_moon_finance_me`;

-- ------------------------------------------------------------------------------
-- 2. USUÁRIOS & RBAC (admin_master, tenant_admin, member, viewer)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` VARCHAR(50) NOT NULL,
  `nome` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `senha_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin_master', 'tenant_admin', 'member', 'viewer') NOT NULL DEFAULT 'tenant_admin',
  `mfa_ativo` TINYINT(1) NOT NULL DEFAULT 1,
  `hash_pseudonimizado` VARCHAR(64) NOT NULL UNIQUE,
  `avatar_url` TEXT NULL,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. LANÇAMENTOS (FLUXO DE CAIXA / RECEITAS E SAÍDAS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lancamentos` (
  `id` VARCHAR(50) NOT NULL,
  `usuario_id` VARCHAR(50) NOT NULL,
  `descricao` VARCHAR(200) NOT NULL,
  `categoria` VARCHAR(100) NOT NULL,
  `tipo` ENUM('receita', 'despesa') NOT NULL,
  `valor` DECIMAL(10,2) NOT NULL,
  `dia` INT NOT NULL,
  `recorrente` TINYINT(1) NOT NULL DEFAULT 0,
  `mes_especifico` VARCHAR(7) NULL,
  `data_inicio_recorrencia` VARCHAR(7) NULL,
  `data_fim_recorrencia` VARCHAR(7) NULL,
  `status` ENUM('realizado', 'previsto') NOT NULL DEFAULT 'realizado',
  `metodo_pagamento` VARCHAR(50) NULL,
  `data_pagamento` DATE NULL,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. DESPESAS MENSAIS (ROLLOVER, JUROS E VENCIMENTOS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `despesas_mensais` (
  `id` VARCHAR(50) NOT NULL,
  `usuario_id` VARCHAR(50) NOT NULL,
  `descricao` VARCHAR(200) NOT NULL,
  `categoria` VARCHAR(100) NOT NULL,
  `dia_vencimento` INT NOT NULL,
  `valor_previsto` DECIMAL(10,2) NOT NULL,
  `valor_pago` DECIMAL(10,2) NULL,
  `data_pagamento` DATE NULL,
  `metodo_pagamento` VARCHAR(50) NULL,
  `status` ENUM('pago', 'previsto', 'atrasado') NOT NULL DEFAULT 'previsto',
  `mes` VARCHAR(7) NOT NULL,
  `juros_acumulados` DECIMAL(10,2) DEFAULT 0.00,
  `origem_rollover_mes` VARCHAR(7) NULL,
  `lancamento_origem_id` VARCHAR(50) NULL,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. PLANEJAMENTO & PAINEL DOS SONHOS (MÉDIO E LONGO PRAZO)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `metas_planejamento` (
  `id` VARCHAR(50) NOT NULL,
  `usuario_id` VARCHAR(50) NOT NULL,
  `titulo` VARCHAR(150) NOT NULL,
  `categoria` VARCHAR(50) NOT NULL DEFAULT 'Moradia',
  `valor_meta` DECIMAL(10,2) NOT NULL,
  `valor_atual` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `prazo_tipo` ENUM('curto', 'medio', 'longo') NOT NULL DEFAULT 'longo',
  `prazo_anos` VARCHAR(50) NULL,
  `data_limite` DATE NULL,
  `foto_url` TEXT NULL,
  `observacao` TEXT NULL,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. CARTÕES DE CRÉDITO
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cartoes_credito` (
  `id` VARCHAR(50) NOT NULL,
  `usuario_id` VARCHAR(50) NOT NULL,
  `nome_cartao` VARCHAR(100) NOT NULL,
  `banco` VARCHAR(100) NOT NULL,
  `limite_total` DECIMAL(10,2) NOT NULL,
  `limite_disponivel` DECIMAL(10,2) NOT NULL,
  `fatura_atual` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `dia_fechamento` INT NOT NULL,
  `dia_vencimento` INT NOT NULL,
  `ultimos_digitos` VARCHAR(4) NOT NULL,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. COMPRAS DO CARTÃO DE CRÉDITO (ITENS DA FATURA)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `compras_cartao` (
  `id` VARCHAR(50) NOT NULL,
  `cartao_id` VARCHAR(50) NOT NULL,
  `descricao` VARCHAR(200) NOT NULL,
  `categoria` VARCHAR(100) NOT NULL,
  `valor` DECIMAL(10,2) NOT NULL,
  `parcela` VARCHAR(20) NULL,
  `data_compra` DATE NOT NULL,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`cartao_id`) REFERENCES `cartoes_credito`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. PETS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pets` (
  `id` VARCHAR(50) NOT NULL,
  `usuario_id` VARCHAR(50) NOT NULL,
  `nome` VARCHAR(100) NOT NULL,
  `especie` VARCHAR(50) NOT NULL DEFAULT 'cachorro',
  `raca` VARCHAR(100) NULL,
  `idade` VARCHAR(50) NULL,
  `data_nascimento` DATE NULL,
  `foto_url` TEXT NULL,
  `gasto_mensal_estimado` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `ativo` TINYINT(1) NOT NULL DEFAULT 1,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. METAS FINANCEIRAS & RESERVAS PET/EMERGÊNCIA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `metas_financeiras` (
  `id` VARCHAR(50) NOT NULL,
  `usuario_id` VARCHAR(50) NOT NULL,
  `pet_id` VARCHAR(50) NULL,
  `titulo_ou_objetivo` VARCHAR(150) NOT NULL,
  `categoria` ENUM('geral', 'pet', 'emergencia', 'viagem', 'outro') NOT NULL DEFAULT 'geral',
  `valor_atual` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `valor_meta` DECIMAL(10,2) NOT NULL,
  `data_limite` DATE NULL,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`pet_id`) REFERENCES `pets`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. AGENDA PET
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `agenda_pet` (
  `id` VARCHAR(50) NOT NULL,
  `pet_id` VARCHAR(50) NOT NULL,
  `titulo` VARCHAR(150) NOT NULL,
  `tipo` ENUM('vacina', 'consulta', 'banho', 'tosa', 'medicamento', 'exame', 'vermifugo') NOT NULL,
  `data_agendada` DATE NOT NULL,
  `recorrencia` VARCHAR(50) NULL,
  `valor` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('pendente', 'realizado') NOT NULL DEFAULT 'pendente',
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`pet_id`) REFERENCES `pets`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. CARRINHOS SALVOS PET
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `carrinhos_salvos_pets` (
  `id` VARCHAR(50) NOT NULL,
  `nome` VARCHAR(150) NOT NULL,
  `frequencia` VARCHAR(50) NOT NULL DEFAULT 'Mensal',
  `loja` VARCHAR(100) NULL,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `itens_carrinho_salvo_pet` (
  `id` VARCHAR(50) NOT NULL,
  `carrinho_id` VARCHAR(50) NOT NULL,
  `pet_id` VARCHAR(50) NOT NULL,
  `pet_nome` VARCHAR(100) NOT NULL,
  `produto` VARCHAR(200) NOT NULL,
  `quantidade` INT NOT NULL DEFAULT 1,
  `valor_sem_desconto` DECIMAL(10,2) NULL,
  `valor_com_desconto` DECIMAL(10,2) NOT NULL,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`carrinho_id`) REFERENCES `carrinhos_salvos_pets`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 13. HISTÓRICO DE COMPRAS PET
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `historico_compras_pets` (
  `id` VARCHAR(50) NOT NULL,
  `data_compra` VARCHAR(50) NOT NULL,
  `nome_lista` VARCHAR(150) NULL,
  `loja` VARCHAR(100) NULL,
  `metodo_pagamento` VARCHAR(50) NOT NULL,
  `teve_frete` TINYINT(1) NOT NULL DEFAULT 0,
  `valor_frete` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `valor_desconto` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `valor_produtos` DECIMAL(10,2) NOT NULL,
  `total_pago` DECIMAL(10,2) NOT NULL,
  `itens_comprados_count` INT NOT NULL DEFAULT 0,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `itens_historico_compra_pet` (
  `id` VARCHAR(50) NOT NULL,
  `historico_id` VARCHAR(50) NOT NULL,
  `pet_id` VARCHAR(50) NOT NULL,
  `pet_nome` VARCHAR(100) NOT NULL,
  `produto` VARCHAR(200) NOT NULL,
  `quantidade` INT NOT NULL DEFAULT 1,
  `valor_com_desconto` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`historico_id`) REFERENCES `historico_compras_pets`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 14. EMERGÊNCIAS VETERINÁRIAS DE PETS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `emergencias_pets` (
  `id` VARCHAR(50) NOT NULL,
  `pet_id` VARCHAR(50) NOT NULL,
  `pet_nome` VARCHAR(100) NOT NULL,
  `data` DATE NOT NULL,
  `valor_total` DECIMAL(10,2) NOT NULL,
  `usou_reserva` TINYINT(1) NOT NULL DEFAULT 0,
  `valor_usado_reserva` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `metodo_pagamento_restante` VARCHAR(50) NULL,
  `parcelado` TINYINT(1) NOT NULL DEFAULT 0,
  `parcelas` INT NULL,
  `observacao` TEXT NULL,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`pet_id`) REFERENCES `pets`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 15. VEÍCULOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `veiculos` (
  `id` VARCHAR(50) NOT NULL,
  `usuario_id` VARCHAR(50) NOT NULL,
  `nome` VARCHAR(100) NOT NULL,
  `marca_modelo` VARCHAR(100) NOT NULL,
  `placa` VARCHAR(20) NOT NULL,
  `foto_url` TEXT NULL,
  `km_atual` INT NOT NULL DEFAULT 0,
  `gasto_mensal_estimado` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `financiado` TINYINT(1) NOT NULL DEFAULT 0,
  `valor_parcela_financiamento` DECIMAL(10,2) NULL,
  `parcelas_totais_financiamento` INT NULL,
  `parcelas_pagas_financiamento` INT NULL,
  `dia_vencimento_financiamento` INT NULL,
  `banco_financiamento` VARCHAR(100) NULL,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 16. ABASTECIMENTOS DE VEÍCULOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `abastecimentos` (
  `id` VARCHAR(50) NOT NULL,
  `veiculo_id` VARCHAR(50) NOT NULL,
  `posto` VARCHAR(100) NOT NULL,
  `litros` DECIMAL(8,2) NOT NULL,
  `km_atual` INT NOT NULL,
  `valor_total` DECIMAL(10,2) NOT NULL,
  `data_abastecimento` DATE NOT NULL,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`veiculo_id`) REFERENCES `veiculos`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 17. MANUTENÇÕES DE VEÍCULOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `manutencoes_veiculo` (
  `id` VARCHAR(50) NOT NULL,
  `veiculo_id` VARCHAR(50) NOT NULL,
  `descricao` VARCHAR(200) NOT NULL,
  `oficina` VARCHAR(100) NOT NULL,
  `valor_total` DECIMAL(10,2) NOT NULL,
  `parcelas_total` INT NOT NULL DEFAULT 1,
  `parcela_atual` INT NOT NULL DEFAULT 1,
  `valor_parcela` DECIMAL(10,2) NOT NULL,
  `data_inicio` DATE NOT NULL,
  `ativa` TINYINT(1) NOT NULL DEFAULT 1,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`veiculo_id`) REFERENCES `veiculos`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 18. RITUAIS DE ESTÉTICA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `rituais_estetica` (
  `id` VARCHAR(50) NOT NULL,
  `usuario_id` VARCHAR(50) NOT NULL,
  `nome` VARCHAR(100) NOT NULL,
  `genero_alvo` ENUM('todos', 'homem', 'mulher', 'masculino', 'feminino') NOT NULL DEFAULT 'todos',
  `valor` DECIMAL(10,2) NOT NULL,
  `frequencia` VARCHAR(50) NOT NULL DEFAULT 'Mensal',
  `proxima_data` DATE NOT NULL,
  `historico_gasto` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 19. INADIMPLÊNCIAS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `inadimplencias` (
  `id` VARCHAR(50) NOT NULL,
  `usuario_id` VARCHAR(50) NOT NULL,
  `credor_ou_devedor` VARCHAR(150) NOT NULL,
  `tipo` ENUM('divida_propria', 'a_receber') NOT NULL DEFAULT 'divida_propria',
  `descricao` VARCHAR(200) NOT NULL,
  `valor_original` DECIMAL(10,2) NOT NULL,
  `juros_multa` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `valor_atualizado` DECIMAL(10,2) NOT NULL,
  `data_vencimento_original` DATE NOT NULL,
  `status` ENUM('pendente', 'em_renegociacao', 'quitado') NOT NULL DEFAULT 'pendente',
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 20. LOGS DO SISTEMA & AUDITORIA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `logs_sistema` (
  `id` VARCHAR(50) NOT NULL,
  `usuario_id` VARCHAR(50) NULL,
  `usuario_nome` VARCHAR(150) NULL,
  `perfil` VARCHAR(50) NULL,
  `acao` VARCHAR(100) NOT NULL,
  `detalhes` TEXT NULL,
  `ip` VARCHAR(45) NULL,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 22. SEED DE DADOS INICIAIS (PHPMYADMIN / HOSTGATOR `moon_finance_me`)
-- ------------------------------------------------------------------------------

-- Seed Tenant Primário
INSERT INTO `tenants` (`id`, `nome_familia_ou_empresa`, `plano`, `status`, `mrr`, `titular_email`) VALUES
('tenant_88192', 'Família Furlani', 'Pro Family', 'ativo', 49.90, 'priscila@moonfinanceme.com.br')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- Seed Usuária Administradora (Priscila Furlani com a senha 'Admin@123')
INSERT INTO `usuarios` (`id`, `tenant_id`, `nome`, `email`, `senha_hash`, `role`, `mfa_ativo`, `hash_pseudonimizado`, `avatar_url`) VALUES
('usr_892193', 'tenant_88192', 'Priscila Furlani', 'priscila@moonfinanceme.com.br', '$2y$10$cptRv.9Y1sqzxHqgzfKNcOR5r3ptd.xLy2672rvwUeQ17ZVwU0cEu', 'tenant_admin', 1, 'anon_usr_7x9f2a89', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- Seed Configurações de Privacidade do Tenant
INSERT INTO `configuracoes_privacidade` (`tenant_id`, `pseudonymize_export`, `mfa_required`, `auto_encrypt_at_rest`, `consent_analytics`, `pets_module_enabled`, `planejamento_enabled`, `familia_enabled`, `estetica_enabled`, `carros_enabled`, `cartoes_enabled`, `inadimplencias_enabled`, `lgpd_accepted_at`) VALUES
('tenant_88192', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE `tenant_id`=`tenant_id`;

-- Seed Metas de Planejamento & Sonhos
INSERT INTO `metas_planejamento` (`id`, `tenant_id`, `titulo`, `categoria`, `valor_meta`, `valor_atual`, `prazo_tipo`, `prazo_anos`, `data_limite`, `foto_url`, `observacao`) VALUES
('meta_pln_01', 'tenant_88192', 'Entrada do Apartamento Novo 🏢', 'Moradia', 15000.00, 3500.00, 'longo', '4 a 6 anos', '2031-12-31', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=400', 'Fundo de entrada para o apartamento próprio da família.'),
('meta_pln_02', 'tenant_88192', 'Viagem para a Itália / Europa ✈️', 'Lazer & Viagens', 20000.00, 8500.00, 'medio', '2 a 3 anos', '2028-07-15', 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&q=80&w=400', 'Férias em família na Costa Amalfitana.'),
('meta_pln_03', 'tenant_88192', 'Especialização / MBA Executivo 🎓', 'Educação', 12000.00, 4000.00, 'curto', '1 ano', '2027-03-31', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=400', 'Curso de Especialização em Gestão Financeira.')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- Seed Pets (Lua & Sofy)
INSERT INTO `pets` (`id`, `tenant_id`, `nome`, `especie`, `raca`, `idade`, `data_nascimento`, `foto_url`, `gasto_mensal_estimado`) VALUES
('pet_01', 'tenant_88192', 'Lua', 'gato', 'Tigrado', '4 anos', '2022-04-15', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=300', 150.00),
('pet_02', 'tenant_88192', 'Sofy', 'cachorro', 'Vira-lata (SRD)', '4 anos', '2022-02-19', 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=300', 200.00)
ON DUPLICATE KEY UPDATE `id`=`id`;

-- Seed Log do Sistema Inicial
INSERT INTO `logs_sistema` (`id`, `tenant_id`, `usuario_id`, `usuario_nome`, `perfil`, `acao`, `detalhes`, `ip`) VALUES
('log_01', 'tenant_88192', 'usr_892193', 'Priscila Furlani', 'tenant_admin', 'SISTEMA_INICIALIZADO', 'Banco de dados MySQL moon_finance_me criado e populado via phpMyAdmin HostGator', '127.0.0.1')
ON DUPLICATE KEY UPDATE `id`=`id`;
