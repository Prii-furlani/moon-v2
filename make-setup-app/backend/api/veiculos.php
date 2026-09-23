<?php
declare(strict_types=1);
/**
 * MoonFinance (moonfinanceme.com.br)
 * CRUD Completo de Veículos (GET, POST, PUT, DELETE)
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
        $stmtVeiculos = $pdo->prepare("SELECT * FROM veiculos WHERE usuario_id = :usuario_id ORDER BY criado_em DESC");
        $stmtVeiculos->execute([':usuario_id' => $userId]);
        $veiculos = $stmtVeiculos->fetchAll();

        echo json_encode([
            "status" => "success",
            "data" => array_map(function($v) {
                return [
                    "id" => $v['id'],
                    "usuarioId" => $v['usuario_id'],
                    "nome" => $v['nome'],
                    "marcaModelo" => $v['marca_modelo'],
                    "placa" => $v['placa'],
                    "fotoUrl" => $v['foto_url'],
                    "kmAtual" => (int)$v['km_atual'],
                    "gastoMensalEstimado" => (float)$v['gasto_mensal_estimado'],
                    "financiado" => $v['financiado'] == 1,
                    "valorParcelaFinanciamento" => (float)$v['valor_parcela_financiamento'],
                    "criadoEm" => $v['criado_em'] ?? null
                ];
            }, $veiculos)
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['nome']) || (empty($input['marca_modelo']) && empty($input['marcaModelo']))) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Nome e Marca/Modelo do Veículo são obrigatórios."]);
        exit();
    }

    try {
        $pdo->beginTransaction();

        $sql = "INSERT INTO veiculos (id, usuario_id, nome, marca_modelo, placa, foto_url, km_atual, gasto_mensal_estimado, financiado, valor_parcela_financiamento)
                VALUES (:id, :usuario_id, :nome, :marca_modelo, :placa, :foto_url, :km_atual, :gasto_mensal_estimado, :financiado, :valor_parcela_financiamento)";
        
        $stmt = $pdo->prepare($sql);
        $id = $input['id'] ?? 'vcl_' . time() . '_' . rand(100, 999);

        $stmt->execute([
            ':id' => $id,
            ':usuario_id' => $userId,
            ':nome' => trim($input['nome']),
            ':marca_modelo' => trim($input['marca_modelo'] ?? $input['marcaModelo'] ?? ''),
            ':placa' => trim($input['placa'] ?? ''),
            ':foto_url' => trim($input['foto_url'] ?? $input['fotoUrl'] ?? ''),
            ':km_atual' => (int)($input['km_atual'] ?? $input['kmAtual'] ?? 0),
            ':gasto_mensal_estimado' => (float)($input['gasto_mensal_estimado'] ?? $input['gastoMensalEstimado'] ?? 0.00),
            ':financiado' => !empty($input['financiado']) ? 1 : 0,
            ':valor_parcela_financiamento' => (float)($input['valor_parcela_financiamento'] ?? $input['valorParcelaFinanciamento'] ?? 0.00)
        ]);

        $security->logAudit($userId, $userName, $userRole, 'CRIAR_VEICULO', json_encode(["id" => $id, "nome" => $input['nome']]), $userIp);

        $pdo->commit();
        
        $insertedData = [
            "id" => $id,
            "usuarioId" => $userId,
            "nome" => trim($input['nome']),
            "marcaModelo" => trim($input['marca_modelo'] ?? $input['marcaModelo'] ?? ''),
            "placa" => trim($input['placa'] ?? ''),
            "fotoUrl" => trim($input['foto_url'] ?? $input['fotoUrl'] ?? ''),
            "kmAtual" => (int)($input['km_atual'] ?? $input['kmAtual'] ?? 0),
            "gastoMensalEstimado" => (float)($input['gasto_mensal_estimado'] ?? $input['gastoMensalEstimado'] ?? 0.00),
            "financiado" => !empty($input['financiado']),
            "valorParcelaFinanciamento" => (float)($input['valor_parcela_financiamento'] ?? $input['valorParcelaFinanciamento'] ?? 0.00)
        ];

        echo json_encode([
            "status" => "success", 
            "message" => "Veículo cadastrado com sucesso.", 
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
        echo json_encode(["status" => "error", "message" => "ID é obrigatório para atualização."]);
        exit();
    }

    try {
        $pdo->beginTransaction();

        $sql = "UPDATE veiculos SET 
                nome = :nome, 
                marca_modelo = :marca_modelo, 
                placa = :placa, 
                foto_url = :foto_url, 
                km_atual = :km_atual, 
                gasto_mensal_estimado = :gasto_mensal_estimado, 
                financiado = :financiado, 
                valor_parcela_financiamento = :valor_parcela_financiamento 
                WHERE id = :id AND usuario_id = :usuario_id";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id' => $input['id'],
            ':usuario_id' => $userId,
            ':nome' => trim($input['nome']),
            ':marca_modelo' => trim($input['marca_modelo'] ?? $input['marcaModelo'] ?? ''),
            ':placa' => trim($input['placa'] ?? ''),
            ':foto_url' => trim($input['foto_url'] ?? $input['fotoUrl'] ?? ''),
            ':km_atual' => (int)($input['km_atual'] ?? $input['kmAtual'] ?? 0),
            ':gasto_mensal_estimado' => (float)($input['gasto_mensal_estimado'] ?? $input['gastoMensalEstimado'] ?? 0.00),
            ':financiado' => !empty($input['financiado']) ? 1 : 0,
            ':valor_parcela_financiamento' => (float)($input['valor_parcela_financiamento'] ?? $input['valorParcelaFinanciamento'] ?? 0.00)
        ]);

        if ($stmt->rowCount() === 0) {
            throw new Exception("Veículo não encontrado ou não pertence a este usuário.");
        }

        $security->logAudit($userId, $userName, $userRole, 'EDITAR_VEICULO', json_encode(["id" => $input['id']]), $userIp);

        $pdo->commit();
        
        $updatedData = [
            "id" => $input['id'],
            "usuarioId" => $userId,
            "nome" => trim($input['nome']),
            "marcaModelo" => trim($input['marca_modelo'] ?? $input['marcaModelo'] ?? ''),
            "placa" => trim($input['placa'] ?? ''),
            "fotoUrl" => trim($input['foto_url'] ?? $input['fotoUrl'] ?? ''),
            "kmAtual" => (int)($input['km_atual'] ?? $input['kmAtual'] ?? 0),
            "gastoMensalEstimado" => (float)($input['gasto_mensal_estimado'] ?? $input['gastoMensalEstimado'] ?? 0.00),
            "financiado" => !empty($input['financiado']),
            "valorParcelaFinanciamento" => (float)($input['valor_parcela_financiamento'] ?? $input['valorParcelaFinanciamento'] ?? 0.00)
        ];

        echo json_encode([
            "status" => "success", 
            "message" => "Veículo atualizado com sucesso.",
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
        echo json_encode(["status" => "error", "message" => "ID é obrigatório para exclusão."]);
        exit();
    }

    try {
        $pdo->beginTransaction();
        
        $stmt = $pdo->prepare("DELETE FROM veiculos WHERE id = :id AND usuario_id = :usuario_id");
        $stmt->execute([':id' => $id, ':usuario_id' => $userId]);
        
        if ($stmt->rowCount() === 0) {
            throw new Exception("Veículo não encontrado ou não pertence a este usuário.");
        }
        
        $security->logAudit($userId, $userName, $userRole, 'EXCLUIR_VEICULO', json_encode(["veiculo_id" => $id]), $userIp);

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Veículo removido com sucesso."]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
