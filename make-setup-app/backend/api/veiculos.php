<?php
declare(strict_types=1);
/**
 * MoonFinance (moonfinanceme.com.br)
 * CRUD Completo de Veículos, Abastecimentos e Manutenções (GET, POST, PUT, DELETE)
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

if ($method === 'GET') {
    try {
        $stmtVeiculos = $pdo->prepare("SELECT * FROM veiculos WHERE usuario_id = :usuario_id ORDER BY criado_em DESC");
        $stmtVeiculos->execute([':usuario_id' => $userId]);
        $veiculos = $stmtVeiculos->fetchAll();

        $stmtAbastecimentos = $pdo->prepare("SELECT * FROM abastecimentos WHERE usuario_id = :usuario_id ORDER BY data_abastecimento DESC");
        $stmtAbastecimentos->execute([':usuario_id' => $userId]);
        $abastecimentos = $stmtAbastecimentos->fetchAll();

        $stmtManutencoes = $pdo->prepare("SELECT * FROM manutencoes_veiculo WHERE usuario_id = :usuario_id ORDER BY data_inicio DESC");
        $stmtManutencoes->execute([':usuario_id' => $userId]);
        $manutencoes = $stmtManutencoes->fetchAll();

        echo json_encode([
            "status" => "success",
            "veiculos" => array_map(function($v) {
                return [
                    "id" => $v['id'],
                    "tenantId" => $v['tenant_id'],
                    "nome" => $v['nome'],
                    "marcaModelo" => $v['marca_modelo'],
                    "placa" => $v['placa'],
                    "fotoUrl" => $v['foto_url'],
                    "kmAtual" => $v['km_atual'],
                    "gastoMensalEstimado" => $v['gasto_mensal_estimado'],
                    "financiado" => $v['financiado'] == 1,
                    "valorParcelaFinanciamento" => $v['valor_parcela_financiamento'],
                    "criadoEm" => $v['criado_em'] ?? null
                ];
            }, $veiculos),
            "abastecimentos" => array_map(function($a) {
                return [
                    "id" => $a['id'],
                    "tenantId" => $a['tenant_id'],
                    "veiculoId" => $a['veiculo_id'],
                    "dataAbastecimento" => $a['data_abastecimento'],
                    "litros" => $a['litros'],
                    "valorTotal" => $a['valor_total'],
                    "kmAtual" => $a['km_atual'],
                    "criadoEm" => $a['criado_em'] ?? null
                ];
            }, $abastecimentos),
            "manutencoes" => array_map(function($m) {
                return [
                    "id" => $m['id'],
                    "tenantId" => $m['tenant_id'],
                    "veiculoId" => $m['veiculo_id'],
                    "descricao" => $m['descricao'],
                    "oficina" => $m['oficina'],
                    "dataInicio" => $m['data_inicio'],
                    "valorTotal" => $m['valor_total'],
                    "parcelasTotal" => $m['parcelas_total'] ?? 1,
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

    if ($action === 'registrar_abastecimento') {
        try {
            $pdo->beginTransaction();
            $id = $input['id'] ?? 'abs_' . time() . '_' . rand(100, 999);
            $stmt = $pdo->prepare("INSERT INTO abastecimentos (id,  veiculo_id, data_abastecimento, litros, valor_total, km_atual) VALUES (:id,  :veiculo_id, :data_abastecimento, :litros, :valor_total, :km_atual)");
            $stmt->execute([
                ':id' => $id, ':usuario_id' => $userId, ':veiculo_id' => $input['veiculoId'],
                ':data_abastecimento' => $input['dataAbastecimento'], ':litros' => (float)$input['litros'],
                ':valor_total' => (float)$input['valorTotal'], ':km_atual' => (int)$input['kmAtual']
            ]);

            $security->logAudit( $userId, $userName, $userRole, 'REGISTRAR_ABASTECIMENTO', json_encode(["abastecimento_id" => $id, "veiculo_id" => $input['veiculoId']]), $userIp);

            $pdo->commit();
            echo json_encode(["status" => "success", "id" => $id]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    } elseif ($action === 'registrar_manutencao') {
        try {
            $pdo->beginTransaction();
            $id = $input['id'] ?? 'man_' . time() . '_' . rand(100, 999);
            $stmt = $pdo->prepare("INSERT INTO manutencoes_veiculo (id,  veiculo_id, descricao, oficina, data_inicio, valor_total, parcelas_total, valor_parcela) VALUES (:id,  :veiculo_id, :descricao, :oficina, :data_inicio, :valor_total, :parcelas_total, :valor_parcela)");
            $stmt->execute([
                ':id' => $id, ':usuario_id' => $userId, ':veiculo_id' => $input['veiculoId'],
                ':descricao' => trim($input['descricao']), ':oficina' => trim($input['oficina'] ?? ''),
                ':data_inicio' => $input['dataInicio'], ':valor_total' => (float)$input['valorTotal'],
                ':parcelas_total' => (int)($input['parcelasTotal'] ?? 1), ':valor_parcela' => (float)($input['valorParcela'] ?? $input['valorTotal'])
            ]);

            $security->logAudit( $userId, $userName, $userRole, 'REGISTRAR_MANUTENCAO', json_encode(["manutencao_id" => $id, "veiculo_id" => $input['veiculoId']]), $userIp);

            $pdo->commit();
            echo json_encode(["status" => "success", "id" => $id]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    } else {
        // default action: cadastrar_veiculo
        if (empty($input['nome']) || empty($input['marca_modelo']) && empty($input['marcaModelo'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Nome e Marca/Modelo do Veículo são obrigatórios"]);
            exit();
        }

    try {
        $pdo->beginTransaction();

        $sql = "INSERT INTO veiculos (id,  nome, marca_modelo, placa, foto_url, km_atual, gasto_mensal_estimado, financiado, valor_parcela_financiamento)
                VALUES (:id,  :nome, :marca_modelo, :placa, :foto_url, :km_atual, :gasto_mensal_estimado, :financiado, :valor_parcela_financiamento)";
        
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

        $security->logAudit( $userId, $userName, $userRole, 'CRIAR_VEICULO', json_encode(["id" => $id, "nome" => $input['nome']]), $userIp);

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Veículo cadastrado com sucesso", "id" => $id]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
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

        $security->logAudit( $userId, $userName, $userRole, 'EDITAR_VEICULO', json_encode(["id" => $input['id']]), $userIp);

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Veículo atualizado com sucesso"]);
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

    if ($action === 'deletar_abastecimento') {
        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("DELETE FROM abastecimentos WHERE id = :id AND usuario_id = :usuario_id");
            $stmt->execute([':id' => $id, ':usuario_id' => $userId]);

            $security->logAudit( $userId, $userName, $userRole, 'EXCLUIR_ABASTECIMENTO', json_encode(["abastecimento_id" => $id]), $userIp);

            $pdo->commit();
            echo json_encode(["status" => "success"]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    } elseif ($action === 'deletar_manutencao') {
        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("DELETE FROM manutencoes_veiculo WHERE id = :id AND usuario_id = :usuario_id");
            $stmt->execute([':id' => $id, ':usuario_id' => $userId]);

            $security->logAudit( $userId, $userName, $userRole, 'EXCLUIR_MANUTENCAO', json_encode(["manutencao_id" => $id]), $userIp);

            $pdo->commit();
            echo json_encode(["status" => "success"]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    } else {
        // default: deletar_veiculo
        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("DELETE FROM veiculos WHERE id = :id AND usuario_id = :usuario_id");
            $stmt->execute([':id' => $id, ':usuario_id' => $userId]);
            if ($stmt->rowCount() === 0) throw new Exception("Veículo não encontrado ou não pertence a este usuário.");
            
            $security->logAudit( $userId, $userName, $userRole, 'EXCLUIR_VEICULO', json_encode(["veiculo_id" => $id]), $userIp);

            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "Veículo removido com sucesso"]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    }
}
