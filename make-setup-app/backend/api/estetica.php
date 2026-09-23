<?php
/**
 * MoonFinance (moonfinanceme.com.br)
 * CRUD Completo de Rituais de Estética e Autocuidado (GET, POST, PUT, DELETE)
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
        $stmt = $pdo->prepare("SELECT * FROM rituais_estetica WHERE usuario_id = :usuario_id ORDER BY proxima_data ASC");
        $stmt->execute([':usuario_id' => $userId]);
        $rituais = $stmt->fetchAll();

        echo json_encode([
            "status" => "success",
            "count" => count($rituais),
            "data" => array_map(function($r) {
                return [
                    "id" => $r['id'],
                    "tenantId" => $r['tenant_id'],
                    "nome" => $r['nome'],
                    "generoAlvo" => $r['genero_alvo'],
                    "valor" => (float)$r['valor'],
                    "frequencia" => $r['frequencia'],
                    "proximaData" => $r['proxima_data'],
                    "historicoGasto" => (float)$r['historico_gasto'],
                    "criadoEm" => $r['criado_em'] ?? null
                ];
            }, $rituais)
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['nome']) || empty($input['valor']) || empty($input['proxima_data'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Nome, Valor e Próxima Data são obrigatórios"]);
        exit();
    }

    try {
        $pdo->beginTransaction();

        $sql = "INSERT INTO rituais_estetica (id,  nome, genero_alvo, valor, frequencia, proxima_data, historico_gasto)
                VALUES (:id,  :nome, :genero_alvo, :valor, :frequencia, :proxima_data, :historico_gasto)";
        
        $stmt = $pdo->prepare($sql);
        $id = $input['id'] ?? 'est_' . time() . '_' . rand(100, 999);

        $stmt->execute([
            ':id' => $id,
            ':usuario_id' => $userId,
            ':nome' => trim($input['nome']),
            ':genero_alvo' => in_array($input['genero_alvo'] ?? '', ['todos', 'homem', 'mulher', 'masculino', 'feminino']) ? $input['genero_alvo'] : 'todos',
            ':valor' => (float)$input['valor'],
            ':frequencia' => trim($input['frequencia'] ?? 'Mensal'),
            ':proxima_data' => $input['proxima_data'],
            ':historico_gasto' => (float)($input['historico_gasto'] ?? 0.00)
        ]);

        $security->logAudit( $userId, $userName, $userRole, 'CRIAR_RITUAL_ESTETICA', json_encode(["id" => $id, "nome" => $input['nome']]), $userIp);

        $pdo->commit();

        $insertedData = [
            "id" => $id,
            "usuarioId" => $userId,
            "nome" => trim($input['nome']),
            "generoAlvo" => in_array($input['genero_alvo'] ?? '', ['todos', 'homem', 'mulher', 'masculino', 'feminino']) ? $input['genero_alvo'] : 'todos',
            "valor" => (float)$input['valor'],
            "frequencia" => trim($input['frequencia'] ?? 'Mensal'),
            "proximaData" => $input['proxima_data'],
            "historicoGasto" => (float)($input['historico_gasto'] ?? 0.00)
        ];

        echo json_encode([
            "status" => "success", 
            "message" => "Ritual de Estética cadastrado com sucesso.", 
            "data" => $insertedData
        ], JSON_UNESCAPED_UNICODE);
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

        $sql = "UPDATE rituais_estetica SET 
                nome = :nome, 
                genero_alvo = :genero_alvo, 
                valor = :valor, 
                frequencia = :frequencia, 
                proxima_data = :proxima_data, 
                historico_gasto = :historico_gasto 
                WHERE id = :id AND usuario_id = :usuario_id";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id' => $input['id'],
            ':usuario_id' => $userId,
            ':nome' => trim($input['nome']),
            ':genero_alvo' => in_array($input['genero_alvo'] ?? '', ['todos', 'homem', 'mulher', 'masculino', 'feminino']) ? $input['genero_alvo'] : 'todos',
            ':valor' => (float)$input['valor'],
            ':frequencia' => trim($input['frequencia'] ?? 'Mensal'),
            ':proxima_data' => $input['proxima_data'],
            ':historico_gasto' => (float)($input['historico_gasto'] ?? 0.00)
        ]);

        if ($stmt->rowCount() === 0) {
            throw new Exception("Ritual não encontrado ou não pertence a este usuário.");
        }

        $security->logAudit( $userId, $userName, $userRole, 'EDITAR_RITUAL_ESTETICA', json_encode(["id" => $input['id']]), $userIp);

        $pdo->commit();
        
        $updatedData = [
            "id" => $input['id'],
            "usuarioId" => $userId,
            "nome" => trim($input['nome']),
            "generoAlvo" => in_array($input['genero_alvo'] ?? '', ['todos', 'homem', 'mulher', 'masculino', 'feminino']) ? $input['genero_alvo'] : 'todos',
            "valor" => (float)$input['valor'],
            "frequencia" => trim($input['frequencia'] ?? 'Mensal'),
            "proximaData" => $input['proxima_data'],
            "historicoGasto" => (float)($input['historico_gasto'] ?? 0.00)
        ];

        echo json_encode([
            "status" => "success", 
            "message" => "Ritual de Estética atualizado com sucesso.", 
            "data" => $updatedData
        ], JSON_UNESCAPED_UNICODE);
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

        $stmt = $pdo->prepare("DELETE FROM rituais_estetica WHERE id = :id AND usuario_id = :usuario_id");
        $stmt->execute([
            ':id' => $id,
            ':usuario_id' => $userId
        ]);

        if ($stmt->rowCount() === 0) {
            throw new Exception("Ritual não encontrado ou não pertence a este usuário.");
        }

        $security->logAudit( $userId, $userName, $userRole, 'EXCLUIR_RITUAL_ESTETICA', json_encode(["id" => $id]), $userIp);

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Ritual removido com sucesso"]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
