<?php
declare(strict_types=1);
/**
 * MoonFinance (moonfinanceme.com.br)
 * CRUD Completo de Pets (GET, POST, PUT, DELETE)
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
        $stmtPets = $pdo->prepare("SELECT * FROM pets WHERE ativo = 1 AND usuario_id = :usuario_id ORDER BY criado_em DESC");
        $stmtPets->execute([':usuario_id' => $userId]);
        $pets = $stmtPets->fetchAll();

        echo json_encode([
            "status" => "success",
            "data" => array_map(function($p) {
                return [
                    "id" => $p['id'],
                    "usuarioId" => $p['usuario_id'],
                    "nome" => $p['nome'],
                    "especie" => $p['especie'],
                    "raca" => $p['raca'],
                    "idade" => $p['idade'],
                    "dataNascimento" => $p['data_nascimento'],
                    "fotoUrl" => $p['foto_url'],
                    "gastoMensalEstimado" => (float)$p['gasto_mensal_estimado'],
                    "ativo" => $p['ativo'] == 1,
                    "criadoEm" => $p['criado_em']
                ];
            }, $pets)
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['nome'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Nome do Pet é obrigatório."]);
        exit();
    }

    try {
        $pdo->beginTransaction();

        $sql = "INSERT INTO pets (id, usuario_id, nome, especie, raca, idade, data_nascimento, foto_url, gasto_mensal_estimado, ativo)
                VALUES (:id, :usuario_id, :nome, :especie, :raca, :idade, :data_nascimento, :foto_url, :gasto_mensal_estimado, 1)";
        
        $stmt = $pdo->prepare($sql);
        $id = $input['id'] ?? 'pet_' . time() . '_' . rand(100, 999);

        $stmt->execute([
            ':id' => $id,
            ':usuario_id' => $userId,
            ':nome' => trim($input['nome']),
            ':especie' => trim($input['especie'] ?? 'cachorro'),
            ':raca' => trim($input['raca'] ?? ''),
            ':idade' => trim($input['idade'] ?? ''),
            ':data_nascimento' => $input['data_nascimento'] ?? $input['dataNascimento'] ?? null,
            ':foto_url' => trim($input['foto_url'] ?? $input['fotoUrl'] ?? ''),
            ':gasto_mensal_estimado' => (float)($input['gasto_mensal_estimado'] ?? $input['gastoMensalEstimado'] ?? 0.00)
        ]);

        $security->logAudit($userId, $userName, $userRole, 'CRIAR_PET', json_encode(["id" => $id, "nome" => $input['nome']]), $userIp);

        $pdo->commit();
        
        $insertedData = [
            "id" => $id,
            "usuarioId" => $userId,
            "nome" => trim($input['nome']),
            "especie" => trim($input['especie'] ?? 'cachorro'),
            "raca" => trim($input['raca'] ?? ''),
            "idade" => trim($input['idade'] ?? ''),
            "dataNascimento" => $input['data_nascimento'] ?? $input['dataNascimento'] ?? null,
            "fotoUrl" => trim($input['foto_url'] ?? $input['fotoUrl'] ?? ''),
            "gastoMensalEstimado" => (float)($input['gasto_mensal_estimado'] ?? $input['gastoMensalEstimado'] ?? 0.00),
            "ativo" => true
        ];

        echo json_encode([
            "status" => "success", 
            "message" => "Pet cadastrado com sucesso.", 
            "data" => $insertedData
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} elseif ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['id'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ID do Pet é obrigatório para atualização."]);
        exit();
    }

    try {
        $pdo->beginTransaction();

        $sql = "UPDATE pets SET 
                nome = :nome, 
                especie = :especie, 
                raca = :raca, 
                idade = :idade, 
                data_nascimento = :data_nascimento, 
                foto_url = :foto_url, 
                gasto_mensal_estimado = :gasto_mensal_estimado 
                WHERE id = :id AND usuario_id = :usuario_id";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id' => $input['id'],
            ':usuario_id' => $userId,
            ':nome' => trim($input['nome']),
            ':especie' => trim($input['especie'] ?? 'cachorro'),
            ':raca' => trim($input['raca'] ?? ''),
            ':idade' => trim($input['idade'] ?? ''),
            ':data_nascimento' => $input['data_nascimento'] ?? $input['dataNascimento'] ?? null,
            ':foto_url' => trim($input['foto_url'] ?? $input['fotoUrl'] ?? ''),
            ':gasto_mensal_estimado' => (float)($input['gasto_mensal_estimado'] ?? $input['gastoMensalEstimado'] ?? 0.00)
        ]);

        if ($stmt->rowCount() === 0) {
            throw new Exception("Pet não encontrado ou não pertence a este usuário.");
        }

        $security->logAudit($userId, $userName, $userRole, 'EDITAR_PET', json_encode(["id" => $input['id']]), $userIp);

        $pdo->commit();
        
        $updatedData = [
            "id" => $input['id'],
            "usuarioId" => $userId,
            "nome" => trim($input['nome']),
            "especie" => trim($input['especie'] ?? 'cachorro'),
            "raca" => trim($input['raca'] ?? ''),
            "idade" => trim($input['idade'] ?? ''),
            "dataNascimento" => $input['data_nascimento'] ?? $input['dataNascimento'] ?? null,
            "fotoUrl" => trim($input['foto_url'] ?? $input['fotoUrl'] ?? ''),
            "gastoMensalEstimado" => (float)($input['gasto_mensal_estimado'] ?? $input['gastoMensalEstimado'] ?? 0.00),
            "ativo" => true
        ];

        echo json_encode([
            "status" => "success", 
            "message" => "Pet atualizado com sucesso.",
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

        $stmt = $pdo->prepare("UPDATE pets SET ativo = 0 WHERE id = :id AND usuario_id = :usuario_id");
        $stmt->execute([
            ':id' => $id,
            ':usuario_id' => $userId
        ]);

        if ($stmt->rowCount() === 0) {
            throw new Exception("Pet não encontrado ou não pertence a este usuário.");
        }

        $security->logAudit($userId, $userName, $userRole, 'EXCLUIR_PET', json_encode(["id" => $id]), $userIp);

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Pet desativado com sucesso."]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
