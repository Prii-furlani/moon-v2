<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Listar Logs de Auditoria LGPD
    try {
        $stmt = $pdo->query("SELECT * FROM lgpd_audit_logs ORDER BY criado_em DESC LIMIT 50");
        $logs = $stmt->fetchAll();

        echo json_encode([
            "status" => "success",
            "count" => count($logs),
            "data" => $logs
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    // Registrar Log de Auditoria / Ação de Privacidade
    $input = json_decode(file_get_contents('php://input'), true);

    try {
        $sql = "INSERT INTO lgpd_audit_logs (usuario_id, usuario_nome, perfil, acao, detalhes, ip_origem)
                VALUES (:usuario_id, :usuario_nome, :perfil, :acao, :detalhes, :ip_origem)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':usuario_id' => $input['usuario_id'] ?? 'usr_892193',
            ':usuario_nome' => $input['usuario_nome'] ?? 'Priscila Furlani',
            ':perfil' => $input['perfil'] ?? 'Titular',
            ':acao' => $input['acao'] ?? 'Acesso a Dados Financeiros',
            ':detalhes' => $input['detalhes'] ?? 'Ação registrada no sistema.',
            ':ip_origem' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
        ]);

        echo json_encode(["status" => "success", "message" => "Log de auditoria LGPD gravado."]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
