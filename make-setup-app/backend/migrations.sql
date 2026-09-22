-- migrations.sql
-- Atualizações incrementais para alinhar o schema com o backend PHP e remover hardcodes

-- Ajustes na tabela despesas_mensais (necessários para o motor de rollover)
ALTER TABLE `despesas_mensais` ADD COLUMN `juros_acumulados` DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE `despesas_mensais` ADD COLUMN `origem_rollover_mes` VARCHAR(7) NULL;

-- Ajustes na tabela usuarios (necessário para o registro de login)
ALTER TABLE `usuarios` ADD COLUMN `senha_hash` VARCHAR(255) NOT NULL;
