<?php
declare(strict_types=1);
/**
 * MoonFinance (moonfinanceme.com.br)
 * CRUD de Emergências Pet
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
    $petId = $_GET['pet_id'] ?? null;
    try {
        if ($petId) {
            $stmt = $pdo->prepare("SELECT e.* FROM emergencias_pets e INNER JOIN pets p ON e.pet_id = p.id WHERE p.usuario_id = :usuario_id AND e.pet_id = :pet_id ORDER BY e.data DESC");
            $stmt->execute([':usuario_id' => $userId, ':pet_id' => $petId]);
        } else {
            $stmt = $pdo->prepare("SELECT e.* FROM emergencias_pets e INNER JOIN pets p ON e.pet_id = p.id WHERE p.usuario_id = :usuario_id ORDER BY e.data DESC");
            $stmt->execute([':usuario_id' => $userId]);
        }
        $emergencias = $stmt->fetchAll();

        echo json_encode([
            "status" => "success",
            "data" => array_map(function($e) {
                return [
                    "id" => $e['id'],
                    "petId" => $e['pet_id'],
                    "descricao" => $e['descricao'],
                    "data" => $e['data'],
                    "custo" => (float)$e['custo'],
                    "clinicaVeterinario" => $e['clinica_veterinario'],
                    "criadoEm" => $e['criado_em'] ?? null
                ];
            }, $emergencias)
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['petId']) || empty($input['descricao'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Pet e Descrição são obrigatórios."]);
        exit();
    }

    try {
        $pdo->beginTransaction();
        
        $stmtPet = $pdo->prepare("SELECT id FROM pets WHERE id = :id AND usuario_id = :usuario_id");
        $stmtPet->execute([':id' => $input['petId'], ':usuario_id' => $userId]);
        if (!$stmtPet->fetch()) {
            throw new Exception("Pet não encontrado ou acesso negado.");
        }

        $id = $input['id'] ?? 'emerg_' . time() . '_' . rand(100, 999);
        $stmt = $pdo->prepare("INSERT INTO emergencias_pets (id, pet_id, descricao, data, custo, clinica_veterinario) VALUES (:id, :pet_id, :desc, :data, :custo, :clinica)");
        $stmt->execute([
            ':id' => $id,
            ':pet_id' => $input['petId'],
            ':desc' => trim($input['descricao']),
            ':data' => $input['data'] ?? date('Y-m-d'),
            ':custo' => (float)($input['custo'] ?? 0.00),
            ':clinica' => trim($input['clinicaVeterinario'] ?? '')
        ]);

        $security->logAudit($userId, $userName, $userRole, 'REGISTRAR_EMERGENCIA_PET', json_encode(["pet_id" => $input['petId'], "emergencia_id" => $id, "custo" => (float)($input['custo'] ?? 0)]), $userIp);

        $pdo->commit();
        
        $insertedData = [
            "id" => $id,
            "petId" => $input['petId'],
            "descricao" => trim($input['descricao']),
            "data" => $input['data'] ?? date('Y-m-d'),
            "custo" => (float)($input['custo'] ?? 0.00),
            "clinicaVeterinario" => trim($input['clinicaVeterinario'] ?? '')
        ];

        echo json_encode([
            "status" => "success", 
            "message" => "Emergência registrada com sucesso.",
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
        echo json_encode(["status" => "error", "message" => "ID é obrigatório para atualização."]);
        exit();
    }

    try {
        $pdo->beginTransaction();
        
        $stmtCheck = $pdo->prepare("SELECT e.pet_id FROM emergencias_pets e INNER JOIN pets p ON e.pet_id = p.id WHERE e.id = :id AND p.usuario_id = :usuario_id");
        $stmtCheck->execute([':id' => $input['id'], ':usuario_id' => $userId]);
        $emerg = $stmtCheck->fetch();

        if (!$emerg) {
            throw new Exception("Emergência não encontrada ou acesso negado.");
        }

        $stmt = $pdo->prepare("UPDATE emergencias_pets SET descricao = :desc, data = :data, custo = :custo, clinica_veterinario = :clinica WHERE id = :id");
        $stmt->execute([
            ':desc' => trim($input['descricao'] ?? ''),
            ':data' => $input['data'] ?? date('Y-m-d'),
            ':custo' => (float)($input['custo'] ?? 0.00),
            ':clinica' => trim($input['clinicaVeterinario'] ?? ''),
            ':id' => $input['id']
        ]);
        
        $security->logAudit($userId, $userName, $userRole, 'EDITAR_EMERGENCIA_PET', json_encode(["emergencia_id" => $input['id']]), $userIp);

        $pdo->commit();
        
        $updatedData = [
            "id" => $input['id'],
            "petId" => $emerg['pet_id'],
            "descricao" => trim($input['descricao'] ?? ''),
            "data" => $input['data'] ?? date('Y-m-d'),
            "custo" => (float)($input['custo'] ?? 0.00),
            "clinicaVeterinario" => trim($input['clinicaVeterinario'] ?? '')
        ];

        echo json_encode([
            "status" => "success",
            "message" => "Emergência atualizada com sucesso.",
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
        
        $stmtCheck = $pdo->prepare("SELECT e.id FROM emergencias_pets e INNER JOIN pets p ON e.pet_id = p.id WHERE e.id = :id AND p.usuario_id = :usuario_id");
        $stmtCheck->execute([':id' => $id, ':usuario_id' => $userId]);
        if (!$stmtCheck->fetch()) {
            throw new Exception("Emergência não encontrada ou acesso negado.");
        }

        $stmt = $pdo->prepare("DELETE FROM emergencias_pets WHERE id = :id");
        $stmt->execute([':id' => $id]);

        $security->logAudit($userId, $userName, $userRole, 'EXCLUIR_EMERGENCIA_PET', json_encode(["emergencia_id" => $id]), $userIp);

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Emergência excluída com sucesso."]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
