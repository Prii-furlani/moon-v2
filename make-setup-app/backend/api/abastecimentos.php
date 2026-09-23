<?php
declare(strict_types=1);
/**
 * MoonFinance (moonfinanceme.com.br)
 * CRUD de Abastecimentos de Veículos
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
    $veiculoId = $_GET['veiculo_id'] ?? null;
    try {
        if ($veiculoId) {
            $stmt = $pdo->prepare("SELECT a.* FROM abastecimentos a INNER JOIN veiculos v ON a.veiculo_id = v.id WHERE v.usuario_id = :usuario_id AND a.veiculo_id = :veiculo_id ORDER BY a.data_abastecimento DESC");
            $stmt->execute([':usuario_id' => $userId, ':veiculo_id' => $veiculoId]);
        } else {
            $stmt = $pdo->prepare("SELECT a.* FROM abastecimentos a INNER JOIN veiculos v ON a.veiculo_id = v.id WHERE v.usuario_id = :usuario_id ORDER BY a.data_abastecimento DESC");
            $stmt->execute([':usuario_id' => $userId]);
        }
        $abastecimentos = $stmt->fetchAll();

        echo json_encode([
            "status" => "success",
            "data" => array_map(function($a) {
                return [
                    "id" => $a['id'],
                    "veiculoId" => $a['veiculo_id'],
                    "dataAbastecimento" => $a['data_abastecimento'],
                    "litros" => (float)$a['litros'],
                    "valorTotal" => (float)$a['valor_total'],
                    "kmAtual" => (int)$a['km_atual'],
                    "criadoEm" => $a['criado_em'] ?? null
                ];
            }, $abastecimentos)
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['veiculoId']) || empty($input['valorTotal'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Veículo e Valor Total são obrigatórios."]);
        exit();
    }

    try {
        $pdo->beginTransaction();
        
        $stmtVeiculo = $pdo->prepare("SELECT id FROM veiculos WHERE id = :id AND usuario_id = :usuario_id");
        $stmtVeiculo->execute([':id' => $input['veiculoId'], ':usuario_id' => $userId]);
        if (!$stmtVeiculo->fetch()) {
            throw new Exception("Veículo não encontrado ou acesso negado.");
        }

        $id = $input['id'] ?? 'abs_' . time() . '_' . rand(100, 999);
        $stmt = $pdo->prepare("INSERT INTO abastecimentos (id, veiculo_id, data_abastecimento, litros, valor_total, km_atual) VALUES (:id, :veiculo_id, :data_abastecimento, :litros, :valor_total, :km_atual)");
        $stmt->execute([
            ':id' => $id,
            ':veiculo_id' => $input['veiculoId'],
            ':data_abastecimento' => $input['dataAbastecimento'] ?? date('Y-m-d'),
            ':litros' => (float)($input['litros'] ?? 0),
            ':valor_total' => (float)$input['valorTotal'],
            ':km_atual' => (int)($input['kmAtual'] ?? 0)
        ]);

        $security->logAudit($userId, $userName, $userRole, 'REGISTRAR_ABASTECIMENTO', json_encode(["veiculo_id" => $input['veiculoId'], "abastecimento_id" => $id, "valor" => (float)$input['valorTotal']]), $userIp);

        $pdo->commit();
        
        $insertedData = [
            "id" => $id,
            "veiculoId" => $input['veiculoId'],
            "dataAbastecimento" => $input['dataAbastecimento'] ?? date('Y-m-d'),
            "litros" => (float)($input['litros'] ?? 0),
            "valorTotal" => (float)$input['valorTotal'],
            "kmAtual" => (int)($input['kmAtual'] ?? 0)
        ];

        echo json_encode([
            "status" => "success", 
            "message" => "Abastecimento registrado com sucesso.",
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
        
        $stmtCheck = $pdo->prepare("SELECT a.veiculo_id FROM abastecimentos a INNER JOIN veiculos v ON a.veiculo_id = v.id WHERE a.id = :id AND v.usuario_id = :usuario_id");
        $stmtCheck->execute([':id' => $input['id'], ':usuario_id' => $userId]);
        $abastecimento = $stmtCheck->fetch();

        if (!$abastecimento) {
            throw new Exception("Abastecimento não encontrado ou acesso negado.");
        }

        $stmt = $pdo->prepare("UPDATE abastecimentos SET data_abastecimento = :data_abastecimento, litros = :litros, valor_total = :valor_total, km_atual = :km_atual WHERE id = :id");
        $stmt->execute([
            ':data_abastecimento' => $input['dataAbastecimento'] ?? date('Y-m-d'),
            ':litros' => (float)($input['litros'] ?? 0),
            ':valor_total' => (float)$input['valorTotal'],
            ':km_atual' => (int)($input['kmAtual'] ?? 0),
            ':id' => $input['id']
        ]);
        
        $security->logAudit($userId, $userName, $userRole, 'EDITAR_ABASTECIMENTO', json_encode(["abastecimento_id" => $input['id']]), $userIp);

        $pdo->commit();
        
        $updatedData = [
            "id" => $input['id'],
            "veiculoId" => $abastecimento['veiculo_id'],
            "dataAbastecimento" => $input['dataAbastecimento'] ?? date('Y-m-d'),
            "litros" => (float)($input['litros'] ?? 0),
            "valorTotal" => (float)$input['valorTotal'],
            "kmAtual" => (int)($input['kmAtual'] ?? 0)
        ];

        echo json_encode([
            "status" => "success",
            "message" => "Abastecimento atualizado com sucesso.",
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
        
        $stmtCheck = $pdo->prepare("SELECT a.id FROM abastecimentos a INNER JOIN veiculos v ON a.veiculo_id = v.id WHERE a.id = :id AND v.usuario_id = :usuario_id");
        $stmtCheck->execute([':id' => $id, ':usuario_id' => $userId]);
        if (!$stmtCheck->fetch()) {
            throw new Exception("Abastecimento não encontrado ou acesso negado.");
        }

        $stmt = $pdo->prepare("DELETE FROM abastecimentos WHERE id = :id");
        $stmt->execute([':id' => $id]);

        $security->logAudit($userId, $userName, $userRole, 'EXCLUIR_ABASTECIMENTO', json_encode(["abastecimento_id" => $id]), $userIp);

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Abastecimento excluído com sucesso."]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
