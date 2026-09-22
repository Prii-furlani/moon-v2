-- ==============================================================================
-- MOONFINANCE - MIGRAÇÃO MULTI-TENANT PARA SINGLE-USER
-- ATENÇÃO: ESTE SCRIPT DEVE SER EXECUTADO NO PHPMYADMIN (PRI04258_MOON_FINANCE_ME)
-- ==============================================================================

SET FOREIGN_KEY_CHECKS=0;

-- 1. ADICIONAR COLUNA usuario_id ONDE FALTAVA
-- Adicionando a coluna permitindo NULL temporariamente para não dar erro
ALTER TABLE `pets` ADD COLUMN `usuario_id` VARCHAR(50) NULL AFTER `id`;
ALTER TABLE `veiculos` ADD COLUMN `usuario_id` VARCHAR(50) NULL AFTER `id`;
ALTER TABLE `cartoes_credito` ADD COLUMN `usuario_id` VARCHAR(50) NULL AFTER `id`;
ALTER TABLE `rituais_estetica` ADD COLUMN `usuario_id` VARCHAR(50) NULL AFTER `id`;
ALTER TABLE `inadimplencias` ADD COLUMN `usuario_id` VARCHAR(50) NULL AFTER `id`;
ALTER TABLE `metas_planejamento` ADD COLUMN `usuario_id` VARCHAR(50) NULL AFTER `id`;
ALTER TABLE `metas_financeiras` ADD COLUMN `usuario_id` VARCHAR(50) NULL AFTER `id`;

-- 2. MIGRAÇÃO DE DADOS (USANDO O DONO DO TENANT COMO usuario_id)
-- Mapear os dados existentes para o usuário master daquele tenant_id
-- Assumimos que Priscila (usr_892193) é a dona de tenant_88192
UPDATE `pets` SET `usuario_id` = 'usr_892193' WHERE `tenant_id` = 'tenant_88192';
UPDATE `veiculos` SET `usuario_id` = 'usr_892193' WHERE `tenant_id` = 'tenant_88192';
UPDATE `cartoes_credito` SET `usuario_id` = 'usr_892193' WHERE `tenant_id` = 'tenant_88192';
UPDATE `rituais_estetica` SET `usuario_id` = 'usr_892193' WHERE `tenant_id` = 'tenant_88192';
UPDATE `inadimplencias` SET `usuario_id` = 'usr_892193' WHERE `tenant_id` = 'tenant_88192';
UPDATE `metas_planejamento` SET `usuario_id` = 'usr_892193' WHERE `tenant_id` = 'tenant_88192';
UPDATE `metas_financeiras` SET `usuario_id` = 'usr_892193' WHERE `tenant_id` = 'tenant_88192';

-- Garantir que não há nulos antes de aplicar NOT NULL (excluir órfãos, se houver)
DELETE FROM `pets` WHERE `usuario_id` IS NULL;
DELETE FROM `veiculos` WHERE `usuario_id` IS NULL;
DELETE FROM `cartoes_credito` WHERE `usuario_id` IS NULL;
DELETE FROM `rituais_estetica` WHERE `usuario_id` IS NULL;
DELETE FROM `inadimplencias` WHERE `usuario_id` IS NULL;
DELETE FROM `metas_planejamento` WHERE `usuario_id` IS NULL;
DELETE FROM `metas_financeiras` WHERE `usuario_id` IS NULL;

-- Aplicar NOT NULL
ALTER TABLE `pets` MODIFY COLUMN `usuario_id` VARCHAR(50) NOT NULL;
ALTER TABLE `veiculos` MODIFY COLUMN `usuario_id` VARCHAR(50) NOT NULL;
ALTER TABLE `cartoes_credito` MODIFY COLUMN `usuario_id` VARCHAR(50) NOT NULL;
ALTER TABLE `rituais_estetica` MODIFY COLUMN `usuario_id` VARCHAR(50) NOT NULL;
ALTER TABLE `inadimplencias` MODIFY COLUMN `usuario_id` VARCHAR(50) NOT NULL;
ALTER TABLE `metas_planejamento` MODIFY COLUMN `usuario_id` VARCHAR(50) NOT NULL;
ALTER TABLE `metas_financeiras` MODIFY COLUMN `usuario_id` VARCHAR(50) NOT NULL;

-- 3. REMOVER COLUNAS tenant_id
ALTER TABLE `usuarios` DROP COLUMN `tenant_id`;
ALTER TABLE `lancamentos` DROP COLUMN `tenant_id`;
ALTER TABLE `despesas_mensais` DROP COLUMN `tenant_id`;
ALTER TABLE `metas_planejamento` DROP COLUMN `tenant_id`;
ALTER TABLE `cartoes_credito` DROP COLUMN `tenant_id`;
ALTER TABLE `compras_cartao` DROP COLUMN `tenant_id`;
ALTER TABLE `pets` DROP COLUMN `tenant_id`;
ALTER TABLE `metas_financeiras` DROP COLUMN `tenant_id`;
ALTER TABLE `agenda_pet` DROP COLUMN `tenant_id`;
ALTER TABLE `historico_compras_pets` DROP COLUMN `tenant_id`;
ALTER TABLE `emergencias_pets` DROP COLUMN `tenant_id`;
ALTER TABLE `veiculos` DROP COLUMN `tenant_id`;
ALTER TABLE `abastecimentos` DROP COLUMN `tenant_id`;
ALTER TABLE `manutencoes_veiculo` DROP COLUMN `tenant_id`;
ALTER TABLE `rituais_estetica` DROP COLUMN `tenant_id`;
ALTER TABLE `inadimplencias` DROP COLUMN `tenant_id`;
ALTER TABLE `logs_sistema` DROP COLUMN `tenant_id`;

-- Algumas tabelas do schema local que talvez nem estivessem na versão mais atual, mas dropamos
-- ALTER TABLE `carrinhos_salvos_pets` DROP COLUMN `tenant_id`;

-- 4. ADICIONAR NOVAS CONSTRAINTS FOREIGN KEY (usuario_id)
ALTER TABLE `lancamentos` ADD CONSTRAINT `fk_lancamentos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE;
ALTER TABLE `despesas_mensais` ADD CONSTRAINT `fk_despesas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE;
ALTER TABLE `pets` ADD CONSTRAINT `fk_pets_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE;
ALTER TABLE `veiculos` ADD CONSTRAINT `fk_veiculos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE;
ALTER TABLE `cartoes_credito` ADD CONSTRAINT `fk_cartoes_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE;
ALTER TABLE `rituais_estetica` ADD CONSTRAINT `fk_estetica_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE;
ALTER TABLE `inadimplencias` ADD CONSTRAINT `fk_inadimplencias_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE;
ALTER TABLE `metas_planejamento` ADD CONSTRAINT `fk_metas_plan_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE;
ALTER TABLE `metas_financeiras` ADD CONSTRAINT `fk_metas_fin_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE;

-- 5. DROPAR TABELAS DE TENANTS E PRIVACIDADE
DROP TABLE IF EXISTS `itens_carrinho_salvo_pet`;
DROP TABLE IF EXISTS `carrinhos_salvos_pets`;
DROP TABLE IF EXISTS `configuracoes_privacidade`;
DROP TABLE IF EXISTS `convites_membros`;
DROP TABLE IF EXISTS `tenants`;

SET FOREIGN_KEY_CHECKS=1;

-- Migração concluída com sucesso.
