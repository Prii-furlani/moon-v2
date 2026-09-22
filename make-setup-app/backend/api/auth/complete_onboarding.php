<?php
/**
 * MoonFinance
 * Endpoint para marcar onboarding_completed = 1
 */
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../core/Security.php';

use App\Core\Security;

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método não permitido"]);
    exit();
}

$user = Security::validateToken();
if (!$user) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Não autorizado"]);
    exit();
}

try {
    $stmt = $pdo->prepare("UPDATE usuarios SET onboarding_completed = 1 WHERE id = :id AND usuario_id = :usuario_id");
    $stmt->execute([
        ':id' => $user['id'],
        ':tenant_id' => $user['tenant_id']
    ]);

    echo json_encode([
        "status" => "success",
        "message" => "Onboarding concluído com sucesso."
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erro interno no servidor"]);
}
