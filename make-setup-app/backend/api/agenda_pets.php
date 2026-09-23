<?php
declare(strict_types=1);
/**
 * MoonFinance (moonfinanceme.com.br)
 * CRUD de Agenda de Pets
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
            $stmt = $pdo->prepare("SELECT a.* FROM agenda_pet a INNER JOIN pets p ON a.pet_id = p.id WHERE p.usuario_id = :usuario_id AND a.pet_id = :pet_id ORDER BY a.data_agendada ASC");
            $stmt->execute([':usuario_id' => $userId, ':pet_id' => $petId]);
        } else {
            $stmt = $pdo->prepare("SELECT a.* FROM agenda_pet a INNER JOIN pets p ON a.pet_id = p.id WHERE p.usuario_id = :usuario_id ORDER BY a.data_agendada ASC");
            $stmt->execute([':usuario_id' => $userId]);
        }
        $agenda = $stmt->fetchAll();

        echo json_encode([
            "status" => "success",
            "data" => array_map(function($a) {
                return [
                    "id" => $a['id'],
                    "petId" => $a['pet_id'],
                    "tipoServico" => $a['tipo_servico'],
                    "dataAgendada" => $a['data_agendada'],
                    "local" => $a['local'],
                    "status" => $a['status'],
                    "custoEstimado" => (float)$a['custo_estimado'],
                    "criadoEm" => $a['criado_em'] ?? null
                ];
            }, $agenda)
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['petId']) || empty($input['tipoServico']) || empty($input['dataAgendada'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Pet, Tipo de Serviço e Data são obrigatórios."]);
        exit();
    }

    try {
        $pdo->beginTransaction();
        
        $stmtPet = $pdo->prepare("SELECT id FROM pets WHERE id = :id AND usuario_id = :usuario_id");
        $stmtPet->execute([':id' => $input['petId'], ':usuario_id' => $userId]);
        if (!$stmtPet->fetch()) {
            throw new Exception("Pet não encontrado ou acesso negado.");
        }

        $id = $input['id'] ?? 'agend_' . time() . '_' . rand(100, 999);
        $stmt = $pdo->prepare("INSERT INTO agenda_pet (id, pet_id, tipo_servico, data_agendada, local, status, custo_estimado) VALUES (:id, :pet_id, :tipo, :data, :local, :status, :custo)");
        $stmt->execute([
            ':id' => $id,
            ':pet_id' => $input['petId'],
            ':tipo' => trim($input['tipoServico']),
            ':data' => $input['dataAgendada'],
            ':local' => trim($input['local'] ?? ''),
            ':status' => trim($input['status'] ?? 'Pendente'),
            ':custo' => (float)($input['custoEstimado'] ?? 0.00)
        ]);

        $security->logAudit($userId, $userName, $userRole, 'AGENDAR_PET', json_encode(["pet_id" => $input['petId'], "agenda_id" => $id, "tipo" => $input['tipoServico']]), $userIp);

        $pdo->commit();
        
        $insertedData = [
            "id" => $id,
            "petId" => $input['petId'],
            "tipoServico" => trim($input['tipoServico']),
            "dataAgendada" => $input['dataAgendada'],
            "local" => trim($input['local'] ?? ''),
            "status" => trim($input['status'] ?? 'Pendente'),
            "custoEstimado" => (float)($input['custoEstimado'] ?? 0.00)
        ];

        echo json_encode([
            "status" => "success", 
            "message" => "Agendamento criado com sucesso.",
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
        
        $stmtCheck = $pdo->prepare("SELECT a.pet_id FROM agenda_pet a INNER JOIN pets p ON a.pet_id = p.id WHERE a.id = :id AND p.usuario_id = :usuario_id");
        $stmtCheck->execute([':id' => $input['id'], ':usuario_id' => $userId]);
        $agenda = $stmtCheck->fetch();

        if (!$agenda) {
            throw new Exception("Agendamento não encontrado ou acesso negado.");
        }

        $stmt = $pdo->prepare("UPDATE agenda_pet SET tipo_servico = :tipo, data_agendada = :data, local = :local, status = :status, custo_estimado = :custo WHERE id = :id");
        $stmt->execute([
            ':tipo' => trim($input['tipoServico'] ?? ''),
            ':data' => $input['dataAgendada'] ?? null,
            ':local' => trim($input['local'] ?? ''),
            ':status' => trim($input['status'] ?? 'Pendente'),
            ':custo' => (float)($input['custoEstimado'] ?? 0.00),
            ':id' => $input['id']
        ]);
        
        $security->logAudit($userId, $userName, $userRole, 'EDITAR_AGENDA_PET', json_encode(["agenda_id" => $input['id']]), $userIp);

        $pdo->commit();
        
        $updatedData = [
            "id" => $input['id'],
            "petId" => $agenda['pet_id'],
            "tipoServico" => trim($input['tipoServico'] ?? ''),
            "dataAgendada" => $input['dataAgendada'] ?? null,
            "local" => trim($input['local'] ?? ''),
            "status" => trim($input['status'] ?? 'Pendente'),
            "custoEstimado" => (float)($input['custoEstimado'] ?? 0.00)
        ];

        echo json_encode([
            "status" => "success",
            "message" => "Agendamento atualizado com sucesso.",
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
        
        $stmtCheck = $pdo->prepare("SELECT a.id FROM agenda_pet a INNER JOIN pets p ON a.pet_id = p.id WHERE a.id = :id AND p.usuario_id = :usuario_id");
        $stmtCheck->execute([':id' => $id, ':usuario_id' => $userId]);
        if (!$stmtCheck->fetch()) {
            throw new Exception("Agendamento não encontrado ou acesso negado.");
        }

        $stmt = $pdo->prepare("DELETE FROM agenda_pet WHERE id = :id");
        $stmt->execute([':id' => $id]);

        $security->logAudit($userId, $userName, $userRole, 'EXCLUIR_AGENDA_PET', json_encode(["agenda_id" => $id]), $userIp);

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Agendamento excluído com sucesso."]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
