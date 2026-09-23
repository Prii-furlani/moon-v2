<?php
/**
 * MoonFinance (moonfinanceme.com.br)
 * CRUD Completo de Planejamento & Painel dos Sonhos (GET, POST, PUT, DELETE)
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
        $stmt = $pdo->prepare("SELECT * FROM metas_planejamento WHERE usuario_id = :usuario_id ORDER BY valor_meta DESC");
        $stmt->execute([':usuario_id' => $userId]);
        $metas = $stmt->fetchAll();

        echo json_encode([
            "status" => "success",
            "count" => count($metas),
            "data" => array_map(function($m) {
                return [
                    "id" => $m['id'],
                    "tenantId" => $m['tenant_id'],
                    "titulo" => $m['titulo'],
                    "categoria" => $m['categoria'],
                    "valorMeta" => (float)$m['valor_meta'],
                    "valorAtual" => (float)$m['valor_atual'],
                    "prazoTipo" => $m['prazo_tipo'],
                    "prazoAnos" => $m['prazo_anos'],
                    "dataLimite" => $m['data_limite'],
                    "fotoUrl" => $m['foto_url'],
                    "observacao" => $m['observacao'],
                    "criadoEm" => $m['criado_em'] ?? null
                ];
            }, $metas)
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['titulo']) || empty($input['valor_meta'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Título e Valor da Meta são obrigatórios"]);
        exit();
    }

    try {
        $pdo->beginTransaction();

        $sql = "INSERT INTO metas_planejamento (id,  titulo, categoria, valor_meta, valor_atual, prazo_tipo, prazo_anos, data_limite, foto_url, observacao)
                VALUES (:id,  :titulo, :categoria, :valor_meta, :valor_atual, :prazo_tipo, :prazo_anos, :data_limite, :foto_url, :observacao)";
        
        $stmt = $pdo->prepare($sql);
        $id = $input['id'] ?? 'meta_pln_' . time() . '_' . rand(100, 999);

        $stmt->execute([
            ':id' => $id,
            ':usuario_id' => $userId,
            ':titulo' => trim($input['titulo']),
            ':categoria' => trim($input['categoria'] ?? 'Moradia'),
            ':valor_meta' => (float)$input['valor_meta'],
            ':valor_atual' => (float)($input['valor_atual'] ?? 0.00),
            ':prazo_tipo' => in_array($input['prazo_tipo'] ?? '', ['curto', 'medio', 'longo']) ? $input['prazo_tipo'] : 'longo',
            ':prazo_anos' => trim($input['prazo_anos'] ?? ''),
            ':data_limite' => !empty($input['data_limite']) ? $input['data_limite'] : null,
            ':foto_url' => trim($input['foto_url'] ?? ''),
            ':observacao' => trim($input['observacao'] ?? '')
        ]);

        $security->logAudit( $userId, $userName, $userRole, 'CRIAR_META_PLANEJAMENTO', json_encode(["id" => $id, "titulo" => $input['titulo']]), $userIp);

        $pdo->commit();

        $insertedData = [
            "id" => $id,
            "usuarioId" => $userId,
            "titulo" => trim($input['titulo']),
            "categoria" => trim($input['categoria'] ?? 'Moradia'),
            "valorMeta" => (float)$input['valor_meta'],
            "valorAtual" => (float)($input['valor_atual'] ?? 0.00),
            "prazoTipo" => in_array($input['prazo_tipo'] ?? '', ['curto', 'medio', 'longo']) ? $input['prazo_tipo'] : 'longo',
            "prazoAnos" => trim($input['prazo_anos'] ?? ''),
            "dataLimite" => !empty($input['data_limite']) ? $input['data_limite'] : null,
            "fotoUrl" => trim($input['foto_url'] ?? ''),
            "observacao" => trim($input['observacao'] ?? '')
        ];

        echo json_encode([
            "status" => "success", 
            "message" => "Meta de Planejamento criada com sucesso.", 
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

        $sql = "UPDATE metas_planejamento SET 
                titulo = :titulo, 
                categoria = :categoria, 
                valor_meta = :valor_meta, 
                valor_atual = :valor_atual, 
                prazo_tipo = :prazo_tipo, 
                prazo_anos = :prazo_anos, 
                data_limite = :data_limite, 
                foto_url = :foto_url, 
                observacao = :observacao 
                WHERE id = :id AND usuario_id = :usuario_id";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id' => $input['id'],
            ':usuario_id' => $userId,
            ':titulo' => trim($input['titulo']),
            ':categoria' => trim($input['categoria'] ?? 'Moradia'),
            ':valor_meta' => (float)$input['valor_meta'],
            ':valor_atual' => (float)($input['valor_atual'] ?? 0.00),
            ':prazo_tipo' => in_array($input['prazo_tipo'] ?? '', ['curto', 'medio', 'longo']) ? $input['prazo_tipo'] : 'longo',
            ':prazo_anos' => trim($input['prazo_anos'] ?? ''),
            ':data_limite' => !empty($input['data_limite']) ? $input['data_limite'] : null,
            ':foto_url' => trim($input['foto_url'] ?? ''),
            ':observacao' => trim($input['observacao'] ?? '')
        ]);

        if ($stmt->rowCount() === 0) {
            throw new Exception("Meta não encontrada ou não pertence a este usuário.");
        }

        $security->logAudit( $userId, $userName, $userRole, 'EDITAR_META_PLANEJAMENTO', json_encode(["id" => $input['id']]), $userIp);

        $pdo->commit();
        
        $updatedData = [
            "id" => $input['id'],
            "usuarioId" => $userId,
            "titulo" => trim($input['titulo']),
            "categoria" => trim($input['categoria'] ?? 'Moradia'),
            "valorMeta" => (float)$input['valor_meta'],
            "valorAtual" => (float)($input['valor_atual'] ?? 0.00),
            "prazoTipo" => in_array($input['prazo_tipo'] ?? '', ['curto', 'medio', 'longo']) ? $input['prazo_tipo'] : 'longo',
            "prazoAnos" => trim($input['prazo_anos'] ?? ''),
            "dataLimite" => !empty($input['data_limite']) ? $input['data_limite'] : null,
            "fotoUrl" => trim($input['foto_url'] ?? ''),
            "observacao" => trim($input['observacao'] ?? '')
        ];

        echo json_encode([
            "status" => "success", 
            "message" => "Meta de Planejamento atualizada com sucesso.", 
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

        $stmt = $pdo->prepare("DELETE FROM metas_planejamento WHERE id = :id AND usuario_id = :usuario_id");
        $stmt->execute([
            ':id' => $id,
            ':usuario_id' => $userId
        ]);

        if ($stmt->rowCount() === 0) {
            throw new Exception("Meta não encontrada ou não pertence a este usuário.");
        }

        $security->logAudit( $userId, $userName, $userRole, 'EXCLUIR_META_PLANEJAMENTO', json_encode(["id" => $id]), $userIp);

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Meta removida com sucesso"]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
