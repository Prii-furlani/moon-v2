<?php
/**
 * MoonFinance (moonfinanceme.com.br)
 * CRUD Completo de Inadimplências e Cobranças (GET, POST, PUT, DELETE)
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
        $stmt = $pdo->prepare("SELECT * FROM inadimplencias WHERE usuario_id = :usuario_id ORDER BY data_vencimento_original ASC");
        $stmt->execute([':usuario_id' => $userId]);
        $items = $stmt->fetchAll();

        echo json_encode([
            "status" => "success",
            "count" => count($items),
            "data" => array_map(function($i) {
                return [
                    "id" => $i['id'],
                    "tenantId" => $i['tenant_id'],
                    "credorOuDevedor" => $i['credor_ou_devedor'],
                    "tipo" => $i['tipo'],
                    "descricao" => $i['descricao'],
                    "valorOriginal" => (float)$i['valor_original'],
                    "jurosMulta" => (float)$i['juros_multa'],
                    "valorAtualizado" => (float)$i['valor_atualizado'],
                    "dataVencimentoOriginal" => $i['data_vencimento_original'],
                    "status" => $i['status'],
                    "criadoEm" => $i['criado_em'] ?? null
                ];
            }, $items)
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['credor_ou_devedor']) || empty($input['valor_original']) || empty($input['data_vencimento_original'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Credor/Devedor, Valor Original e Data de Vencimento são obrigatórios"]);
        exit();
    }

    try {
        $pdo->beginTransaction();

        $sql = "INSERT INTO inadimplencias (id,  credor_ou_devedor, tipo, descricao, valor_original, juros_multa, valor_atualizado, data_vencimento_original, status)
                VALUES (:id,  :credor_ou_devedor, :tipo, :descricao, :valor_original, :juros_multa, :valor_atualizado, :data_vencimento_original, :status)";
        
        $stmt = $pdo->prepare($sql);
        $id = $input['id'] ?? 'inad_' . time() . '_' . rand(100, 999);

        $stmt->execute([
            ':id' => $id,
            ':usuario_id' => $userId,
            ':credor_ou_devedor' => trim($input['credor_ou_devedor']),
            ':tipo' => in_array($input['tipo'] ?? '', ['divida_propria', 'a_receber']) ? $input['tipo'] : 'divida_propria',
            ':descricao' => trim($input['descricao'] ?? ''),
            ':valor_original' => (float)$input['valor_original'],
            ':juros_multa' => (float)($input['juros_multa'] ?? 0.00),
            ':valor_atualizado' => (float)($input['valor_atualizado'] ?? $input['valor_original']),
            ':data_vencimento_original' => $input['data_vencimento_original'],
            ':status' => in_array($input['status'] ?? '', ['pendente', 'em_renegociacao', 'quitado']) ? $input['status'] : 'pendente'
        ]);

        $security->logAudit( $userId, $userName, $userRole, 'CRIAR_INADIMPLENCIA', json_encode(["id" => $id, "tipo" => $input['tipo'] ?? 'divida_propria']), $userIp);

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Registro de Inadimplência cadastrado com sucesso", "id" => $id]);
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

    try {
        $pdo->beginTransaction();

        $sql = "UPDATE inadimplencias SET 
                credor_ou_devedor = :credor_ou_devedor, 
                tipo = :tipo, 
                descricao = :descricao, 
                valor_original = :valor_original, 
                juros_multa = :juros_multa, 
                valor_atualizado = :valor_atualizado, 
                data_vencimento_original = :data_vencimento_original, 
                status = :status 
                WHERE id = :id AND usuario_id = :usuario_id";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id' => $input['id'],
            ':usuario_id' => $userId,
            ':credor_ou_devedor' => trim($input['credor_ou_devedor']),
            ':tipo' => in_array($input['tipo'] ?? '', ['divida_propria', 'a_receber']) ? $input['tipo'] : 'divida_propria',
            ':descricao' => trim($input['descricao'] ?? ''),
            ':valor_original' => (float)$input['valor_original'],
            ':juros_multa' => (float)($input['juros_multa'] ?? 0.00),
            ':valor_atualizado' => (float)($input['valor_atualizado'] ?? $input['valor_original']),
            ':data_vencimento_original' => $input['data_vencimento_original'],
            ':status' => in_array($input['status'] ?? '', ['pendente', 'em_renegociacao', 'quitado']) ? $input['status'] : 'pendente'
        ]);

        if ($stmt->rowCount() === 0) {
            throw new Exception("Inadimplência não encontrada ou não pertence a este usuário.");
        }

        $security->logAudit( $userId, $userName, $userRole, 'EDITAR_INADIMPLENCIA', json_encode(["id" => $input['id']]), $userIp);

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Inadimplência atualizada com sucesso"]);
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

        $stmt = $pdo->prepare("DELETE FROM inadimplencias WHERE id = :id AND usuario_id = :usuario_id");
        $stmt->execute([
            ':id' => $id,
            ':usuario_id' => $userId
        ]);

        if ($stmt->rowCount() === 0) {
            throw new Exception("Inadimplência não encontrada ou não pertence a este usuário.");
        }

        $security->logAudit( $userId, $userName, $userRole, 'EXCLUIR_INADIMPLENCIA', json_encode(["id" => $id]), $userIp);

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Registro removido com sucesso"]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
