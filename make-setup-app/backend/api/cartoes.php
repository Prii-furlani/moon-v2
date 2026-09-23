<?php
declare(strict_types=1);
/**
 * MoonFinance (moonfinanceme.com.br)
 * CRUD Completo de Cartões de Crédito (GET, POST, PUT, DELETE)
 */
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../core/AuthMiddleware.php';
require_once __DIR__ . '/../core/Security.php';

header('Content-Type: application/json');
$auth = \App\Core\AuthMiddleware::authenticate($pdo);
$userId = $auth['user_id'];
$userName = $auth['usuario_nome'];
$userRole = $auth['perfil'];
$userIp = $auth['ip'];

$security = new \App\Core\Security($pdo);

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET') {
    try {
        $stmtCartoes = $pdo->prepare("SELECT * FROM cartoes_credito WHERE usuario_id = :usuario_id ORDER BY criado_em DESC");
        $stmtCartoes->execute([':usuario_id' => $userId]);
        $cartoes = $stmtCartoes->fetchAll();

        echo json_encode([
            "status" => "success",
            "cartoes" => array_map(function($c) {
                return [
                    "id" => $c['id'],
                    "usuarioId" => $c['usuario_id'] ?? null,
                    "nomeCartao" => $c['nome_cartao'],
                    "banco" => $c['banco'],
                    "limiteTotal" => (float)$c['limite_total'],
                    "limiteDisponivel" => (float)$c['limite_disponivel'],
                    "faturaAtual" => (float)$c['fatura_atual'],
                    "diaFechamento" => (int)$c['dia_fechamento'],
                    "diaVencimento" => (int)$c['dia_vencimento'],
                    "ultimosDigitos" => $c['ultimos_digitos'],
                    "criadoEm" => $c['criado_em'] ?? null
                ];
            }, $cartoes)
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if ($action === 'pagar_fatura') {
        try {
            $pdo->beginTransaction();
            
            $cartaoId = $input['cartao_id'] ?? $input['cartaoId'] ?? '';
            $valorFatura = (float)($input['valor_total_fatura'] ?? $input['valorTotalFatura'] ?? 0);
            $valorPago = (float)($input['valor_pago'] ?? $input['valorPago'] ?? 0);
            $metodoPagamento = $input['metodo_pagamento'] ?? $input['metodoPagamento'] ?? 'N/A';
            $jurosMensal = (float)($input['juros_mensal'] ?? $input['jurosMensal'] ?? 12.0); // 12% a.m by default
            $mesAtual = date('Y-m');
            $mesSeguinte = date('Y-m', strtotime('+1 month'));

            // 1. Lançamento financeiro do pagamento
            $lancId = 'lan_' . time() . '_' . rand(100, 999);
            $stmt = $pdo->prepare("INSERT INTO lancamentos (id, usuario_id, descricao, categoria, tipo, valor, dia, recorrente, status, metodo_pagamento) VALUES (:id, :usuario_id, :desc, 'Cartão de Crédito', 'despesa', :valor, :dia, 0, 'realizado', :metodo)");
            $stmt->execute([
                ':id' => $lancId, ':usuario_id' => $userId,
                ':desc' => "Pagamento Fatura Cartão", ':valor' => $valorPago, 
                ':dia' => date('d'), ':metodo' => $metodoPagamento
            ]);

            // 2. Criar Despesa paga
            $despId = 'desp_' . time() . '_' . rand(100, 999);
            $stmt = $pdo->prepare("INSERT INTO despesas_mensais (id, usuario_id, descricao, categoria, dia_vencimento, valor_previsto, valor_pago, data_pagamento, metodo_pagamento, status, mes) VALUES (:id, :usuario_id, :desc, 'Cartão de Crédito', :dia, :previsto, :pago, :data_pag, :metodo, 'pago', :mes)");
            $stmt->execute([
                ':id' => $despId, ':usuario_id' => $userId,
                ':desc' => "Fatura Cartão", ':dia' => date('d'),
                ':previsto' => $valorFatura, ':pago' => $valorPago,
                ':data_pag' => date('Y-m-d'), ':metodo' => $metodoPagamento,
                ':mes' => $mesAtual
            ]);

            // 3. Lógica de Rollover
            $saldoDevedor = $valorFatura - $valorPago;
            $jurosGerados = 0;

            if ($saldoDevedor > 0) {
                $jurosGerados = $saldoDevedor * ($jurosMensal / 100);
                $saldoRollover = $saldoDevedor + $jurosGerados;
                
                $rolloverId = 'desp_' . time() . '_' . rand(100, 999);
                $stmt = $pdo->prepare("INSERT INTO despesas_mensais (id, usuario_id, descricao, categoria, dia_vencimento, valor_previsto, status, mes, juros_acumulados, origem_rollover_mes, lancamento_origem_id) VALUES (:id, :usuario_id, :desc, 'Cartão de Crédito (Rollover)', :dia, :previsto, 'previsto', :mes, :juros, :origem_mes, :origem_id)");
                $stmt->execute([
                    ':id' => $rolloverId, ':usuario_id' => $userId,
                    ':desc' => "Fatura Cartão - Rollover Juros", ':dia' => date('d'),
                    ':previsto' => $saldoRollover, ':mes' => $mesSeguinte,
                    ':juros' => $jurosGerados, ':origem_mes' => $mesAtual, ':origem_id' => $lancId
                ]);
            }

            // Atualiza limite do cartão baseando apenas no que foi pago
            $stmt = $pdo->prepare("UPDATE cartoes_credito SET fatura_atual = fatura_atual - :pago + :juros, limite_disponivel = limite_total - (fatura_atual - :pago + :juros) WHERE id = :id AND usuario_id = :usuario_id");
            $stmt->execute([
                ':pago' => $valorPago,
                ':juros' => $jurosGerados,
                ':id' => $cartaoId,
                ':usuario_id' => $userId
            ]);

            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "Fatura processada com sucesso."]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    } else {
        // Add Cartao
        if (empty($input['nomeCartao'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Nome do Cartão obrigatório."]);
            exit();
        }
        try {
            $pdo->beginTransaction();
            $id = $input['id'] ?? 'crd_' . time() . '_' . rand(100, 999);
            $stmt = $pdo->prepare("INSERT INTO cartoes_credito (id, usuario_id, nome_cartao, banco, limite_total, limite_disponivel, fatura_atual, dia_fechamento, dia_vencimento, ultimos_digitos) VALUES (:id, :usuario_id, :nome, :banco, :limite_t, :limite_d, :fatura, :dia_f, :dia_v, :digitos)");
            $stmt->execute([
                ':id' => $id, ':usuario_id' => $userId,
                ':nome' => trim($input['nomeCartao']), ':banco' => trim($input['banco'] ?? ''),
                ':limite_t' => (float)$input['limiteTotal'], ':limite_d' => (float)$input['limiteDisponivel'],
                ':fatura' => (float)($input['faturaAtual'] ?? 0), ':dia_f' => (int)$input['diaFechamento'],
                ':dia_v' => (int)$input['diaVencimento'], ':digitos' => trim($input['ultimosDigitos'] ?? '')
            ]);

            $security->logAudit($userId, $userName, $userRole, 'CRIAR_CARTAO_CREDITO', json_encode(["cartao_id" => $id, "nome" => $input['nomeCartao']]), $userIp);

            $pdo->commit();
            
            $insertedData = [
                "id" => $id,
                "usuarioId" => $userId,
                "nomeCartao" => trim($input['nomeCartao']),
                "banco" => trim($input['banco'] ?? ''),
                "limiteTotal" => (float)$input['limiteTotal'],
                "limiteDisponivel" => (float)$input['limiteDisponivel'],
                "faturaAtual" => (float)($input['faturaAtual'] ?? 0),
                "diaFechamento" => (int)$input['diaFechamento'],
                "diaVencimento" => (int)$input['diaVencimento'],
                "ultimosDigitos" => trim($input['ultimosDigitos'] ?? '')
            ];

            echo json_encode([
                "status" => "success", 
                "message" => "Cartão de Crédito criado com sucesso.", 
                "data" => $insertedData
            ], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    }
} elseif ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['id'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ID é obrigatório para atualização."]);
        exit();
    }
    
    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("UPDATE cartoes_credito SET nome_cartao = :nome, banco = :banco, limite_total = :limite_t, limite_disponivel = :limite_d, dia_fechamento = :dia_f, dia_vencimento = :dia_v, ultimos_digitos = :digitos WHERE id = :id AND usuario_id = :usuario_id");
        $stmt->execute([
            ':nome' => trim($input['nomeCartao']), ':banco' => trim($input['banco'] ?? ''),
            ':limite_t' => (float)$input['limiteTotal'], ':limite_d' => (float)$input['limiteDisponivel'],
            ':dia_f' => (int)$input['diaFechamento'], ':dia_v' => (int)$input['diaVencimento'],
            ':digitos' => trim($input['ultimosDigitos'] ?? ''), ':id' => $input['id'], ':usuario_id' => $userId
        ]);

        if ($stmt->rowCount() === 0) {
            throw new Exception("Cartão não encontrado ou não pertence a este usuário.");
        }

        $security->logAudit($userId, $userName, $userRole, 'EDITAR_CARTAO_CREDITO', json_encode(["cartao_id" => $input['id']]), $userIp);

        $pdo->commit();
        
        $updatedData = [
            "id" => $input['id'],
            "usuarioId" => $userId,
            "nomeCartao" => trim($input['nomeCartao']),
            "banco" => trim($input['banco'] ?? ''),
            "limiteTotal" => (float)$input['limiteTotal'],
            "limiteDisponivel" => (float)$input['limiteDisponivel'],
            "faturaAtual" => (float)($input['faturaAtual'] ?? 0), // If we want to return the actual we would fetch it, but usually not updated here
            "diaFechamento" => (int)$input['diaFechamento'],
            "diaVencimento" => (int)$input['diaVencimento'],
            "ultimosDigitos" => trim($input['ultimosDigitos'] ?? '')
        ];

        echo json_encode([
            "status" => "success",
            "message" => "Cartão atualizado com sucesso.",
            "data" => $updatedData
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? null;
    }

    if (!$id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ID é obrigatório para exclusão."]);
        exit();
    }

    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("DELETE FROM cartoes_credito WHERE id = :id AND usuario_id = :usuario_id");
        $stmt->execute([':id' => $id, ':usuario_id' => $userId]);

        if ($stmt->rowCount() === 0) {
            throw new Exception("Cartão não encontrado ou não pertence a este usuário.");
        }

        $security->logAudit($userId, $userName, $userRole, 'EXCLUIR_CARTAO_CREDITO', json_encode(["cartao_id" => $id]), $userIp);

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Cartão excluído com sucesso."]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
