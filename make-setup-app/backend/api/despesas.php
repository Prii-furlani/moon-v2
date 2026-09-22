<?php
declare(strict_types=1);
/**
 * MoonFinance (moonfinanceme.com.br)
 * CRUD Completo de Despesas Mês a Mês (GET, POST, PUT, DELETE) + Motor Rollover
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

if ($method === 'GET') {
    $mes = $_GET['mes'] ?? date('Y-m');

    try {
        $pdo->beginTransaction();

        // Motor de Rollover: Verifica contas não pagas do mês anterior e aplica juros de mora (2.8% a.m.)
        $mesAnterior = date('Y-m', strtotime("$mes-01 -1 month"));
        
        $sqlRollover = "SELECT * FROM despesas_mensais WHERE mes = :mesAnterior AND status = 'previsto' AND usuario_id = :usuario_id";
        $stmtRollover = $pdo->prepare($sqlRollover);
        $stmtRollover->execute([
            ':mesAnterior' => $mesAnterior,
            ':usuario_id' => $userId
        ]);
        $pendenciasMesAnterior = $stmtRollover->fetchAll();

        foreach ($pendenciasMesAnterior as $pendencia) {
            $novoId = 'desp_roll_' . time() . '_' . rand(100,999);
            $juros = round($pendencia['valor_previsto'] * 0.028, 2);
            $valorAtualizado = $pendencia['valor_previsto'] + $juros;

            $sqlIns = "INSERT IGNORE INTO despesas_mensais (id,  usuario_id, descricao, categoria, dia_vencimento, valor_previsto, status, mes, juros_acumulados, origem_rollover_mes)
                       VALUES (:id,  :usuario_id, :descricao, :categoria, :dia_vencimento, :valor_previsto, 'atrasado', :mes, :juros_acumulados, :origem_rollover_mes)";
            
            $stmtIns = $pdo->prepare($sqlIns);
            $stmtIns->execute([
                ':id' => $novoId,
                ':usuario_id' => $userId,
                ':usuario_id' => $pendencia['usuario_id'] ?? $userId,
                ':descricao' => $pendencia['descricao'] . ' (Acumulada)',
                ':categoria' => $pendencia['categoria'],
                ':dia_vencimento' => $pendencia['dia_vencimento'],
                ':valor_previsto' => $valorAtualizado,
                ':mes' => $mes,
                ':juros_acumulados' => $juros,
                ':origem_rollover_mes' => $mesAnterior
            ]);

            $stmtUpd = $pdo->prepare("UPDATE despesas_mensais SET status = 'atrasado' WHERE id = :id AND usuario_id = :usuario_id");
            $stmtUpd->execute([
                ':id' => $pendencia['id'],
                ':usuario_id' => $userId
            ]);
        }

        $stmt = $pdo->prepare("SELECT * FROM despesas_mensais WHERE mes = :mes AND usuario_id = :usuario_id ORDER BY dia_vencimento ASC");
        $stmt->execute([
            ':mes' => $mes,
            ':usuario_id' => $userId
        ]);
        $despesas = $stmt->fetchAll();

        $pdo->commit();
        echo json_encode([
            "status" => "success",
            "mes" => $mes,
            "count" => count($despesas),
            "data" => array_map(function($d) {
                return [
                    "id" => $d['id'],
                    "tenantId" => $d['tenant_id'],
                    "usuarioId" => $d['usuario_id'] ?? null,
                    "descricao" => $d['descricao'],
                    "categoria" => $d['categoria'],
                    "diaVencimento" => (int)$d['dia_vencimento'],
                    "valorPrevisto" => (float)$d['valor_previsto'],
                    "valorPago" => $d['valor_pago'] !== null ? (float)$d['valor_pago'] : null,
                    "dataPagamento" => $d['data_pagamento'] ?? null,
                    "metodoPagamento" => $d['metodo_pagamento'] ?? null,
                    "status" => $d['status'],
                    "mes" => $d['mes'],
                    "jurosAcumulados" => (float)($d['juros_acumulados'] ?? 0),
                    "origemRolloverMes" => $d['origem_rollover_mes'] ?? null,
                    "lancamentoOrigemId" => $d['lancamento_origem_id'] ?? null,
                    "criadoEm" => $d['criado_em'] ?? null
                ];
            }, $despesas)
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['descricao']) || empty($input['valorPrevisto'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Descrição e Valor Previsto são obrigatórios"]);
        exit();
    }
    
    $status = $input['status'] ?? 'previsto';
    $allowedStatus = ['pago', 'previsto', 'atrasado'];
    if (!in_array($status, $allowedStatus)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Status de despesa inválido"]);
        exit();
    }

    try {
        $pdo->beginTransaction();
        $sql = "INSERT INTO despesas_mensais (id,  usuario_id, descricao, categoria, dia_vencimento, valor_previsto, valor_pago, status, mes, juros_acumulados, origem_rollover_mes, lancamento_origem_id)
                VALUES (:id,  :usuario_id, :descricao, :categoria, :dia_vencimento, :valor_previsto, :valor_pago, :status, :mes, :juros_acumulados, :origem_rollover_mes, :lancamento_origem_id)";
        
        $stmt = $pdo->prepare($sql);
        $id = $input['id'] ?? 'desp_' . time() . '_' . rand(100, 999);
        $mes = $input['mes'] ?? date('Y-m');

        $stmt->execute([
            ':id' => $id,
            ':usuario_id' => $userId,
            ':usuario_id' => $userId,
            ':descricao' => trim($input['descricao']),
            ':categoria' => $input['categoria'] ?? 'Contas Fixas',
            ':dia_vencimento' => (int)($input['diaVencimento'] ?? 10),
            ':valor_previsto' => (float)$input['valorPrevisto'],
            ':valor_pago' => isset($input['valorRealizado']) ? (float)$input['valorRealizado'] : (isset($input['valorPago']) ? (float)$input['valorPago'] : null),
            ':status' => $input['status'] ?? 'previsto',
            ':mes' => $mes,
            ':juros_acumulados' => (float)($input['juros_acumulados'] ?? $input['jurosAcumulados'] ?? 0.00),
            ':origem_rollover_mes' => $input['origem_rollover_mes'] ?? $input['origemRolloverMes'] ?? null,
            ':lancamento_origem_id' => $input['lancamento_origem_id'] ?? $input['lancamentoOrigemId'] ?? null
        ]);

        $security->logAudit( $userId, $userName, $userRole, 'CRIAR_DESPESA', json_encode(["id" => $id, "descricao" => $input['descricao']]), $userIp);

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Despesa mensal criada com sucesso", "id" => $id]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} elseif ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['id'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ID é obrigatório para atualização"]);
        exit();
    }
    
    $status = $input['status'] ?? 'previsto';
    $allowedStatus = ['pago', 'previsto', 'atrasado'];
    if (!in_array($status, $allowedStatus)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Status de despesa inválido"]);
        exit();
    }

    try {
        $pdo->beginTransaction();
        $sql = "UPDATE despesas_mensais SET 
                descricao = :descricao, 
                categoria = :categoria, 
                dia_vencimento = :dia_vencimento, 
                valor_previsto = :valor_previsto, 
                valor_pago = :valor_pago, 
                status = :status,
                juros_acumulados = :juros_acumulados,
                origem_rollover_mes = :origem_rollover_mes,
                lancamento_origem_id = :lancamento_origem_id
                WHERE id = :id AND usuario_id = :usuario_id";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id' => $input['id'],
            ':usuario_id' => $userId,
            ':descricao' => trim($input['descricao']),
            ':categoria' => $input['categoria'] ?? 'Contas Fixas',
            ':dia_vencimento' => (int)($input['diaVencimento'] ?? 10),
            ':valor_previsto' => (float)$input['valorPrevisto'],
            ':valor_pago' => isset($input['valorRealizado']) ? (float)$input['valorRealizado'] : (isset($input['valorPago']) ? (float)$input['valorPago'] : null),
            ':status' => $input['status'] ?? 'previsto',
            ':juros_acumulados' => (float)($input['juros_acumulados'] ?? $input['jurosAcumulados'] ?? 0.00),
            ':origem_rollover_mes' => $input['origem_rollover_mes'] ?? $input['origemRolloverMes'] ?? null,
            ':lancamento_origem_id' => $input['lancamento_origem_id'] ?? $input['lancamentoOrigemId'] ?? null
        ]);

        if ($stmt->rowCount() === 0) {
            throw new Exception("Despesa não encontrada ou não pertence a este usuário.");
        }

        $security->logAudit( $userId, $userName, $userRole, 'EDITAR_DESPESA', json_encode(["id" => $input['id']]), $userIp);

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Despesa atualizada com sucesso"]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
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
        echo json_encode(["status" => "error", "message" => "ID é obrigatório para exclusão"]);
        exit();
    }

    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("DELETE FROM despesas_mensais WHERE id = :id AND usuario_id = :usuario_id");
        $stmt->execute([
            ':id' => $id,
            ':usuario_id' => $userId
        ]);

        if ($stmt->rowCount() === 0) {
            throw new Exception("Despesa não encontrada ou não pertence a este usuário.");
        }

        $security->logAudit( $userId, $userName, $userRole, 'EXCLUIR_DESPESA', json_encode(["id" => $id]), $userIp);

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Despesa removida com sucesso"]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
