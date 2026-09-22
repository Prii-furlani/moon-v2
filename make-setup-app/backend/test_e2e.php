<?php
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/core/AuthMiddleware.php';

echo "Iniciando Testes de Integração MoonFinance...\n";

// Pegar o primeiro usuário para usar como mock
$stmt = $pdo->query("SELECT id, tenant_id FROM usuarios LIMIT 1");
$user = $stmt->fetch();

if (!$user) {
    echo "Nenhum usuário encontrado para testes.\n";
    exit;
}

$tenantId = $user['tenant_id'];
$userId = $user['id'];

echo "Usando Tenant: $tenantId e Usuário: $userId\n";

// Helper function to simulate request
function simulateRequest($method, $endpoint, $payload = []) {
    global $tenantId, $userId;
    
    $_SERVER['REQUEST_METHOD'] = $method;
    $_GET['tenant_id'] = $tenantId;
    $_GET['user_id'] = $userId;
    
    $_SERVER['HTTP_X_TENANT_ID'] = $tenantId;
    $_SERVER['HTTP_X_USER_ID'] = $userId;

    // Capture output
    ob_start();
    
    // Set input
    if (!empty($payload)) {
        // Unfortunately, php://input cannot be overridden in CLI easily using normal methods unless we mock file_get_contents.
        // A better approach for E2E in CLI is to use cURL against the local web server.
    }
}
