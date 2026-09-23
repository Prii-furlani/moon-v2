<?php
declare(strict_types=1);
/**
 * MoonFinance (moonfinanceme.com.br)
 * CRUD de Manutenções de Veículos
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
            $stmt = $pdo->prepare("SELECT m.* FROM manutencoes_veiculo m INNER JOIN veiculos v ON m.veiculo_id = v.id WHERE v.usuario_id = :usuario_id AND m.veiculo_id = :veiculo_id ORDER BY m.data_inicio DESC");
            $stmt->execute([':usuario_id' => $userId, ':veiculo_id' => $veiculoId]);
        } else {
            $stmt = $pdo->prepare("SELECT m.* FROM manutencoes_veiculo m INNER JOIN veiculos v ON m.veiculo_id = v.id WHERE v.usuario_id = :usuario_id ORDER BY m.data_inicio DESC");
            $stmt->execute([':usuario_id' => $userId]);
        }
        $manutencoes = $stmt->fetchAll();

        echo json_encode([
            "status" => "success",
            "data" => array_map(function($m) {
                return [
                    "id" => $m['id'],
                    "veiculoId" => $m['veiculo_id'],
                    "descricao" => $m['descricao'],
                    "oficina" => $m['oficina'],
                    "dataInicio" => $m['data_inicio'],
                    "valorTotal" => (float)$m['valor_total'],
                    "parcelasTotal" => (int)($m['parcelas_total'] ?? 1),
                    "valorParcela" => (float)($m['valor_parcela'] ?? $m['valor_total']),
                    "criadoEm" => $m['criado_em'] ?? null
                ];
            }, $manutencoes)
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['veiculoId']) || empty($input['descricao']) || empty($input['valorTotal'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Veículo, Descrição e Valor Total são obrigatórios."]);
        exit();
    }

    try {
        $pdo->beginTransaction();
        
        $stmtVeiculo = $pdo->prepare("SELECT id FROM veiculos WHERE id = :id AND usuario_id = :usuario_id");
        $stmtVeiculo->execute([':id' => $input['veiculoId'], ':usuario_id' => $userId]);
        if (!$stmtVeiculo->fetch()) {
            throw new Exception("Veículo não encontrado ou acesso negado.");
        }

        $id = $input['id'] ?? 'man_' . time() . '_' . rand(100, 999);
        $stmt = $pdo->prepare("INSERT INTO manutencoes_veiculo (id, veiculo_id, descricao, oficina, data_inicio, valor_total, parcelas_total, valor_parcela) VALUES (:id, :veiculo_id, :descricao, :oficina, :data_inicio, :valor_total, :parcelas_total, :valor_parcela)");
        $stmt->execute([
            ':id' => $id,
            ':veiculo_id' => $input['veiculoId'],
            ':descricao' => trim($input['descricao']),
            ':oficina' => trim($input['oficina'] ?? ''),
            ':data_inicio' => $input['dataInicio'] ?? date('Y-m-d'),
            ':valor_total' => (float)$input['valorTotal'],
            ':parcelas_total' => (int)($input['parcelasTotal'] ?? 1),
            ':valor_parcela' => (float)($input['valorParcela'] ?? $input['valorTotal'])
        ]);

        $security->logAudit($userId, $userName, $userRole, 'REGISTRAR_MANUTENCAO', json_encode(["veiculo_id" => $input['veiculoId'], "manutencao_id" => $id, "valor" => (float)$input['valorTotal']]), $userIp);

        $pdo->commit();
        
        $insertedData = [
            "id" => $id,
            "veiculoId" => $input['veiculoId'],
            "descricao" => trim($input['descricao']),
            "oficina" => trim($input['oficina'] ?? ''),
            "dataInicio" => $input['dataInicio'] ?? date('Y-m-d'),
            "valorTotal" => (float)$input['valorTotal'],
            "parcelasTotal" => (int)($input['parcelasTotal'] ?? 1),
            "valorParcela" => (float)($input['valorParcela'] ?? $input['valorTotal'])
        ];

        echo json_encode([
            "status" => "success", 
            "message" => "Manutenção registrada com sucesso.",
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
        
        $stmtCheck = $pdo->prepare("SELECT m.veiculo_id FROM manutencoes_veiculo m INNER JOIN veiculos v ON m.veiculo_id = v.id WHERE m.id = :id AND v.usuario_id = :usuario_id");
        $stmtCheck->execute([':id' => $input['id'], ':usuario_id' => $userId]);
        $manutencao = $stmtCheck->fetch();

        if (!$manutencao) {
            throw new Exception("Manutenção não encontrada ou acesso negado.");
        }

        $stmt = $pdo->prepare("UPDATE manutencoes_veiculo SET descricao = :descricao, oficina = :oficina, data_inicio = :data_inicio, valor_total = :valor_total, parcelas_total = :parcelas_total, valor_parcela = :valor_parcela WHERE id = :id");
        $stmt->execute([
            ':descricao' => trim($input['descricao']),
            ':oficina' => trim($input['oficina'] ?? ''),
            ':data_inicio' => $input['dataInicio'] ?? date('Y-m-d'),
            ':valor_total' => (float)$input['valorTotal'],
            ':parcelas_total' => (int)($input['parcelasTotal'] ?? 1),
            ':valor_parcela' => (float)($input['valorParcela'] ?? $input['valorTotal']),
            ':id' => $input['id']
        ]);
        
        $security->logAudit($userId, $userName, $userRole, 'EDITAR_MANUTENCAO', json_encode(["manutencao_id" => $input['id']]), $userIp);

        $pdo->commit();
        
        $updatedData = [
            "id" => $input['id'],
            "veiculoId" => $manutencao['veiculo_id'],
            "descricao" => trim($input['descricao']),
            "oficina" => trim($input['oficina'] ?? ''),
            "dataInicio" => $input['dataInicio'] ?? date('Y-m-d'),
            "valorTotal" => (float)$input['valorTotal'],
            "parcelasTotal" => (int)($input['parcelasTotal'] ?? 1),
            "valorParcela" => (float)($input['valorParcela'] ?? $input['valorTotal'])
        ];

        echo json_encode([
            "status" => "success",
            "message" => "Manutenção atualizada com sucesso.",
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
        
        $stmtCheck = $pdo->prepare("SELECT m.id FROM manutencoes_veiculo m INNER JOIN veiculos v ON m.veiculo_id = v.id WHERE m.id = :id AND v.usuario_id = :usuario_id");
        $stmtCheck->execute([':id' => $id, ':usuario_id' => $userId]);
        if (!$stmtCheck->fetch()) {
            throw new Exception("Manutenção não encontrada ou acesso negado.");
        }

        $stmt = $pdo->prepare("DELETE FROM manutencoes_veiculo WHERE id = :id");
        $stmt->execute([':id' => $id]);

        $security->logAudit($userId, $userName, $userRole, 'EXCLUIR_MANUTENCAO', json_encode(["manutencao_id" => $id]), $userIp);

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Manutenção excluída com sucesso."]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
