<?php
declare(strict_types=1);
/**
 * MoonFinance (moonfinanceme.com.br)
 * CRUD de Compras Parceladas/Cartão de Crédito
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
    $cartaoId = $_GET['cartao_id'] ?? null;
    try {
        if ($cartaoId) {
            $stmt = $pdo->prepare("SELECT cc.* FROM compras_cartao cc INNER JOIN cartoes_credito c ON cc.cartao_id = c.id WHERE c.usuario_id = :usuario_id AND cc.cartao_id = :cartao_id ORDER BY cc.data_compra DESC");
            $stmt->execute([':usuario_id' => $userId, ':cartao_id' => $cartaoId]);
        } else {
            $stmt = $pdo->prepare("SELECT cc.* FROM compras_cartao cc INNER JOIN cartoes_credito c ON cc.cartao_id = c.id WHERE c.usuario_id = :usuario_id ORDER BY cc.data_compra DESC");
            $stmt->execute([':usuario_id' => $userId]);
        }
        $compras = $stmt->fetchAll();

        echo json_encode([
            "status" => "success",
            "data" => array_map(function($f) {
                return [
                    "id" => $f['id'],
                    "cartaoId" => $f['cartao_id'],
                    "descricao" => $f['descricao'],
                    "categoria" => $f['categoria'],
                    "parcela" => $f['parcela'],
                    "valor" => (float)$f['valor'],
                    "dataCompra" => $f['data_compra'],
                    "criadoEm" => $f['criado_em'] ?? null
                ];
            }, $compras)
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['cartaoId']) || empty($input['valor'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Cartão e Valor são obrigatórios."]);
        exit();
    }

    try {
        $pdo->beginTransaction();
        
        // Validar propriedade do cartão
        $stmtCartao = $pdo->prepare("SELECT id FROM cartoes_credito WHERE id = :id AND usuario_id = :usuario_id");
        $stmtCartao->execute([':id' => $input['cartaoId'], ':usuario_id' => $userId]);
        if (!$stmtCartao->fetch()) {
            throw new Exception("Cartão não encontrado ou não pertence a este usuário.");
        }

        $id = $input['id'] ?? 'fat_' . time() . '_' . rand(100, 999);
        $stmt = $pdo->prepare("INSERT INTO compras_cartao (id, cartao_id, descricao, categoria, parcela, valor, data_compra) VALUES (:id, :cartao_id, :descricao, :categoria, :parcela, :valor, :data)");
        $stmt->execute([
            ':id' => $id,
            ':cartao_id' => $input['cartaoId'],
            ':descricao' => trim($input['descricao'] ?? ''),
            ':categoria' => trim($input['categoria'] ?? ''),
            ':parcela' => trim($input['parcela'] ?? ''),
            ':valor' => (float)$input['valor'],
            ':data' => $input['data'] ?? date('Y-m-d')
        ]);

        $stmtUpd = $pdo->prepare("UPDATE cartoes_credito SET fatura_atual = fatura_atual + :valor, limite_disponivel = limite_total - (fatura_atual + :valor) WHERE id = :id AND usuario_id = :usuario_id");
        $stmtUpd->execute([':valor' => (float)$input['valor'], ':id' => $input['cartaoId'], ':usuario_id' => $userId]);

        $security->logAudit($userId, $userName, $userRole, 'REGISTRAR_COMPRA_CARTAO', json_encode(["cartao_id" => $input['cartaoId'], "compra_id" => $id, "valor" => $input['valor']]), $userIp);

        $pdo->commit();
        
        $insertedData = [
            "id" => $id,
            "cartaoId" => $input['cartaoId'],
            "descricao" => trim($input['descricao'] ?? ''),
            "categoria" => trim($input['categoria'] ?? ''),
            "parcela" => trim($input['parcela'] ?? ''),
            "valor" => (float)$input['valor'],
            "dataCompra" => $input['data'] ?? date('Y-m-d')
        ];

        echo json_encode([
            "status" => "success", 
            "message" => "Compra registrada com sucesso.",
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
        
        // Verifica se a compra pertence a um cartão do usuário
        $stmtCheck = $pdo->prepare("SELECT cc.cartao_id, cc.valor FROM compras_cartao cc INNER JOIN cartoes_credito c ON cc.cartao_id = c.id WHERE cc.id = :id AND c.usuario_id = :usuario_id");
        $stmtCheck->execute([':id' => $input['id'], ':usuario_id' => $userId]);
        $compra = $stmtCheck->fetch();

        if (!$compra) {
            throw new Exception("Compra não encontrada ou acesso negado.");
        }

        // Se o valor mudar, precisamos ajustar a fatura do cartão
        $diffValor = (float)$input['valor'] - (float)$compra['valor'];

        $stmt = $pdo->prepare("UPDATE compras_cartao SET descricao = :desc, categoria = :cat, parcela = :parc, valor = :val, data_compra = :data WHERE id = :id");
        $stmt->execute([
            ':desc' => trim($input['descricao'] ?? ''), ':cat' => trim($input['categoria'] ?? ''),
            ':parc' => trim($input['parcela'] ?? ''), ':val' => (float)$input['valor'],
            ':data' => $input['dataCompra'] ?? date('Y-m-d'),
            ':id' => $input['id']
        ]);
        
        if ($diffValor !== 0.0) {
            $stmtUpd = $pdo->prepare("UPDATE cartoes_credito SET fatura_atual = fatura_atual + :diff, limite_disponivel = limite_total - (fatura_atual + :diff) WHERE id = :cartao_id AND usuario_id = :usuario_id");
            $stmtUpd->execute([':diff' => $diffValor, ':cartao_id' => $compra['cartao_id'], ':usuario_id' => $userId]);
        }
        
        $security->logAudit($userId, $userName, $userRole, 'EDITAR_COMPRA_CARTAO', json_encode(["compra_id" => $input['id']]), $userIp);

        $pdo->commit();
        
        $updatedData = [
            "id" => $input['id'],
            "cartaoId" => $compra['cartao_id'],
            "descricao" => trim($input['descricao'] ?? ''),
            "categoria" => trim($input['categoria'] ?? ''),
            "parcela" => trim($input['parcela'] ?? ''),
            "valor" => (float)$input['valor'],
            "dataCompra" => $input['dataCompra'] ?? date('Y-m-d')
        ];

        echo json_encode([
            "status" => "success",
            "message" => "Compra atualizada com sucesso.",
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
        
        // Verifica e pega o valor para subtrair da fatura
        $stmtCheck = $pdo->prepare("SELECT cc.cartao_id, cc.valor FROM compras_cartao cc INNER JOIN cartoes_credito c ON cc.cartao_id = c.id WHERE cc.id = :id AND c.usuario_id = :usuario_id");
        $stmtCheck->execute([':id' => $id, ':usuario_id' => $userId]);
        $compra = $stmtCheck->fetch();

        if (!$compra) {
            throw new Exception("Compra não encontrada ou acesso negado.");
        }

        $stmt = $pdo->prepare("DELETE FROM compras_cartao WHERE id = :id");
        $stmt->execute([':id' => $id]);

        // Restaura o limite/fatura do cartão
        $stmtUpd = $pdo->prepare("UPDATE cartoes_credito SET fatura_atual = fatura_atual - :valor, limite_disponivel = limite_total - (fatura_atual - :valor) WHERE id = :cartao_id AND usuario_id = :usuario_id");
        $stmtUpd->execute([':valor' => (float)$compra['valor'], ':cartao_id' => $compra['cartao_id'], ':usuario_id' => $userId]);

        $security->logAudit($userId, $userName, $userRole, 'EXCLUIR_COMPRA_CARTAO', json_encode(["compra_id" => $id]), $userIp);

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Compra excluída com sucesso."]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
