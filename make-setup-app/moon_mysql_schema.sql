-- ==============================================================================
-- MOONFINANCE - BANCO DE DADOS COMPLETO E DETALHADO (MYSQL / PHPMYADMIN)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `moonfinanceme_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `moonfinanceme_db`;

-- 2. USUÁRIOS
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` VARCHAR(50) NOT NULL,
  `nome` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `role` VARCHAR(20) NOT NULL DEFAULT 'tenant_admin',
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. LANÇAMENTOS (RECEITAS / DESPESAS AVULSAS)
CREATE TABLE IF NOT EXISTS `lancamentos` (
  `id` VARCHAR(50) NOT NULL,
  `descricao` VARCHAR(200) NOT NULL,
  `categoria` VARCHAR(100) NOT NULL,
  `tipo` VARCHAR(20) NOT NULL,
  `valor` DECIMAL(10,2) NOT NULL,
  `dia` INT,
  `recorrente` TINYINT(1) NOT NULL DEFAULT 0,
  `status` VARCHAR(20) NOT NULL DEFAULT 'realizado',
  `mes_especifico` VARCHAR(7) NULL,
  `data_inicio_recorrencia` VARCHAR(7) NULL,
  `data_fim_recorrencia` VARCHAR(7) NULL,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. DESPESAS MENSAIS FIXAS
CREATE TABLE IF NOT EXISTS `despesas_mensais` (
  `id` VARCHAR(50) NOT NULL,
  `descricao` VARCHAR(200) NOT NULL,
  `categoria` VARCHAR(100) NOT NULL,
  `dia_vencimento` INT NOT NULL,
  `valor_previsto` DECIMAL(10,2) NOT NULL,
  `valor_pago` DECIMAL(10,2) NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'previsto',
  `mes` VARCHAR(7) NOT NULL,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. PETS
CREATE TABLE IF NOT EXISTS `pets` (
  `id` VARCHAR(50) NOT NULL,
  `usuario_id` VARCHAR(50) NOT NULL,
  `nome` VARCHAR(100) NOT NULL,
  `especie` VARCHAR(50) NOT NULL,
  `raca` VARCHAR(100),
  `idade` VARCHAR(50),
  `gasto_mensal_estimado` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `contribuicao_mensal_reserva` DECIMAL(10,2) DEFAULT 0.00,
  `ativo` TINYINT(1) NOT NULL DEFAULT 1,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. VEÍCULOS
CREATE TABLE IF NOT EXISTS `veiculos` (
  `id` VARCHAR(50) NOT NULL,
  `usuario_id` VARCHAR(50) NOT NULL,
  `nome` VARCHAR(100) NOT NULL,
  `marca_modelo` VARCHAR(150) NOT NULL,
  `placa` VARCHAR(20),
  `km_atual` INT NOT NULL DEFAULT 0,
  `gasto_mensal_estimado` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. ABASTECIMENTOS DE VEÍCULOS
CREATE TABLE IF NOT EXISTS `abastecimentos` (
  `id` VARCHAR(50) NOT NULL,
  `veiculo_id` VARCHAR(50) NOT NULL,
  `posto` VARCHAR(150) NOT NULL,
  `litros` DECIMAL(8,2) NOT NULL,
  `km_atual` INT NOT NULL,
  `valor_total` DECIMAL(10,2) NOT NULL,
  `data_abastecimento` DATE NOT NULL,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`veiculo_id`) REFERENCES `veiculos`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. MANUTENÇÕES DE VEÍCULOS (PARCELADAS)
CREATE TABLE IF NOT EXISTS `manutencoes_veiculos` (
  `id` VARCHAR(50) NOT NULL,
  `veiculo_id` VARCHAR(50) NOT NULL,
  `descricao` VARCHAR(250) NOT NULL,
  `oficina` VARCHAR(150),
  `valor_total` DECIMAL(10,2) NOT NULL,
  `parcelas_total` INT NOT NULL DEFAULT 1,
  `valor_parcela` DECIMAL(10,2) NOT NULL,
  `data_inicio` DATE NOT NULL,
  `ativa` TINYINT(1) NOT NULL DEFAULT 1,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`veiculo_id`) REFERENCES `veiculos`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. CARTÕES DE CRÉDITO
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
  `ultimos_digitos` VARCHAR(10),
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. COMPRAS NO CARTÃO (ITENS DA FATURA)
CREATE TABLE IF NOT EXISTS `faturas_itens` (
  `id` VARCHAR(50) NOT NULL,
  `cartao_id` VARCHAR(50) NOT NULL,
  `descricao` VARCHAR(200) NOT NULL,
  `categoria` VARCHAR(100) NOT NULL,
  `valor` DECIMAL(10,2) NOT NULL,
  `parcela` VARCHAR(20),
  `data_compra` DATE NOT NULL,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`cartao_id`) REFERENCES `cartoes_credito`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. RITUAIS DE ESTÉTICA E AUTOCUIDADO
CREATE TABLE IF NOT EXISTS `rituais_estetica` (
  `id` VARCHAR(50) NOT NULL,
  `usuario_id` VARCHAR(50) NOT NULL,
  `nome` VARCHAR(150) NOT NULL,
  `categoria` VARCHAR(100) NOT NULL,
  `valor` DECIMAL(10,2) NOT NULL,
  `frequencia` VARCHAR(50) NOT NULL,
  `proxima_data` DATE,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
