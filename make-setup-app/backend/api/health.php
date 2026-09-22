<?php
/**
 * MoonFinance (moonfinanceme.com.br)
 * Health Check Endpoint
 * Verifica o status da conexão PDO e retorna dados do MySQL
 */
require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json; charset=UTF-8');

try {
    // Tenta uma query super leve para validar
    $stmt = $pdo->query("SELECT 1");
    $stmt->fetch();

    $version = $pdo->getAttribute(PDO::ATTR_SERVER_VERSION);
    
    echo json_encode([
        "status" => "online",
        "database" => [
            "connected" => true,
            "host" => $_ENV['DB_HOST'] ?? 'localhost',
            "name" => $_ENV['DB_DATABASE'] ?? 'pri04258_moon_finance_me',
            "version" => $version
        ],
        "timestamp" => gmdate('Y-m-d\TH:i:s\Z')
    ], JSON_UNESCAPED_UNICODE);
    http_response_code(200);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "offline",
        "database" => [
            "connected" => false,
            "error" => $e->getMessage()
        ],
        "timestamp" => gmdate('Y-m-d\TH:i:s\Z')
    ], JSON_UNESCAPED_UNICODE);
}
