<?php
declare(strict_types=1);
/**
 * MoonFinance (moonfinanceme.com.br)
 * CRUD Completo de Lançamentos Financeiros (GET, POST, PUT, DELETE)
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
    try {
        $stmt = $pdo->prepare("SELECT * FROM lancamentos WHERE usuario_id = :usuario_id ORDER BY dia ASC, criado_em DESC");
        $stmt->execute([':usuario_id' => $userId]);
        $data = $stmt->fetchAll();

        echo json_encode([
            "status" => "success",
            "count" => count($data),
            "data" => array_map(function($l) {
                return [
                    "id" => $l['id'],
                    "tenantId" => $l['tenant_id'],
                    "usuarioId" => $l['usuario_id'] ?? null,
                    "descricao" => $l['descricao'],
                    "categoria" => $l['categoria'],
                    "tipo" => $l['tipo'],
                    "valor" => (float)$l['valor'],
                    "dia" => (int)$l['dia'],
                    "recorrente" => $l['recorrente'] == 1,
                    "status" => $l['status'],
                    "metodoPagamento" => $l['metodo_pagamento'] ?? null,
                    "dataPagamento" => $l['data_pagamento'] ?? null,
                    "mesEspecifico" => $l['mes_especifico'] ?? null,
                    "dataInicioRecorrencia" => $l['data_inicio_recorrencia'] ?? null,
                    "dataFimRecorrencia" => $l['data_fim_recorrencia'] ?? null,
                    "criadoEm" => $l['criado_em'] ?? null
                ];
            }, $data)
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['descricao']) || empty($input['valor']) || empty($input['tipo'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Dados incompletos"]);
        exit();
    }

    $allowedTipos = ['receita', 'despesa'];
    if (!in_array($input['tipo'], $allowedTipos)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Tipo de lançamento inválido"]);
        exit();
    }
    $status = $input['status'] ?? 'realizado';
    $allowedStatus = ['realizado', 'previsto'];
    if (!in_array($status, $allowedStatus)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Status de lançamento inválido"]);
        exit();
    }

    try {
        $pdo->beginTransaction();

        $sql = "INSERT INTO lancamentos (id,  usuario_id, descricao, categoria, tipo, valor, dia, recorrente, status, metodo_pagamento, data_pagamento) 
                VALUES (:id,  :usuario_id, :descricao, :categoria, :tipo, :valor, :dia, :recorrente, :status, :metodo_pagamento, :data_pagamento)";
        
        $stmt = $pdo->prepare($sql);
        $id = $input['id'] ?? 'lan_' . time() . '_' . rand(100, 999);
        
        $stmt->execute([
            ':id' => $id,
            ':usuario_id' => $userId,
            ':usuario_id' => $userId,
            ':descricao' => trim($input['descricao']),
            ':categoria' => $input['categoria'] ?? 'Geral',
            ':tipo' => $input['tipo'],
            ':valor' => (float)$input['valor'],
            ':dia' => (int)($input['dia'] ?? 5),
            ':recorrente' => !empty($input['recorrente']) ? 1 : 0,
            ':status' => $input['status'] ?? 'realizado',
            ':metodo_pagamento' => $input['metodo_pagamento'] ?? $input['metodoPagamento'] ?? null,
            ':data_pagamento' => $input['data_pagamento'] ?? $input['dataPagamento'] ?? null
        ]);

        $security->logAudit( $userId, $userName, $userRole, 'CRIAR_LANCAMENTO', json_encode(["id" => $id, "descricao" => $input['descricao']]), $userIp);

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Lançamento criado com sucesso", "id" => $id]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Erro ao salvar lançamento: " . $e->getMessage()]);
    }
} elseif ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['id'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ID é obrigatório para atualização"]);
        exit();
    }
    
    $allowedTipos = ['receita', 'despesa'];
    if (!empty($input['tipo']) && !in_array($input['tipo'], $allowedTipos)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Tipo de lançamento inválido"]);
        exit();
    }
    
    $status = $input['status'] ?? 'realizado';
    $allowedStatus = ['realizado', 'previsto'];
    if (!in_array($status, $allowedStatus)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Status de lançamento inválido"]);
        exit();
    }

    try {
        $pdo->beginTransaction();

        $sql = "UPDATE lancamentos SET 
                descricao = :descricao, 
                categoria = :categoria, 
                tipo = :tipo, 
                valor = :valor, 
                dia = :dia, 
                recorrente = :recorrente, 
                status = :status,
                metodo_pagamento = :metodo_pagamento,
                data_pagamento = :data_pagamento
                WHERE id = :id AND usuario_id = :usuario_id";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id' => $input['id'],
            ':usuario_id' => $userId,
            ':descricao' => trim($input['descricao']),
            ':categoria' => $input['categoria'] ?? 'Geral',
            ':tipo' => $input['tipo'],
            ':valor' => (float)$input['valor'],
            ':dia' => (int)($input['dia'] ?? 5),
            ':recorrente' => !empty($input['recorrente']) ? 1 : 0,
            ':status' => $input['status'] ?? 'realizado',
            ':metodo_pagamento' => $input['metodo_pagamento'] ?? $input['metodoPagamento'] ?? null,
            ':data_pagamento' => $input['data_pagamento'] ?? $input['dataPagamento'] ?? null
        ]);

        if ($stmt->rowCount() === 0) {
            throw new Exception("Lançamento não encontrado ou não pertence a este usuário.");
        }

        $security->logAudit( $userId, $userName, $userRole, 'EDITAR_LANCAMENTO', json_encode(["id" => $input['id']]), $userIp);

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Lançamento atualizado com sucesso"]);
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

        $stmt = $pdo->prepare("DELETE FROM lancamentos WHERE id = :id AND usuario_id = :usuario_id");
        $stmt->execute([
            ':id' => $id,
            ':usuario_id' => $userId
        ]);

        if ($stmt->rowCount() === 0) {
            throw new Exception("Lançamento não encontrado ou não pertence a este usuário.");
        }

        $security->logAudit( $userId, $userName, $userRole, 'EXCLUIR_LANCAMENTO', json_encode(["id" => $id]), $userIp);

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Lançamento removido com sucesso"]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
