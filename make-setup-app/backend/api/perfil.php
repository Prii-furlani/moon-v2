<?php
/**
 * MoonFinance (moonfinanceme.com.br)
 * Endpoint de Perfil do Usuário
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

if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    if ($action === 'onboarding') {
        try {
            $pdo->beginTransaction();
            
            // 1. Atualizar genero e flag onboarding_completed
            $stmt = $pdo->prepare("UPDATE usuarios SET genero = :genero, onboarding_completed = 1, atualizado_em = NOW() WHERE id = :id");
            $stmt->execute([
                ':genero' => $input['genero'] ?? 'nao-binario',
                ':id' => $userId
            ]);

            $security->logAudit( $userId, $userName, $userRole, 'ONBOARDING_CONCLUIDO', json_encode(["modulos_ativos" => $input]), $userIp);
            
            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "Configuração inicial concluída com sucesso."]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        exit;
    }

    $nome = isset($input['nome']) ? trim($input['nome']) : '';

    if (empty($nome)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "O nome não pode ser vazio."], JSON_UNESCAPED_UNICODE);
        exit;
    }

    try {
        $sql = "UPDATE usuarios SET nome = :nome, atualizado_em = NOW() WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':nome' => $nome, ':id' => $userId]);

        $security->logAudit( $userId, $userName, $userRole, 'EDITAR_PERFIL', json_encode(["nome" => $nome]), $userIp);

        echo json_encode(["status" => "success", "message" => "Perfil atualizado com sucesso."], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método não permitido."], JSON_UNESCAPED_UNICODE);
}
