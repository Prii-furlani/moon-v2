<?php
/**
 * MoonFinance
 * Endpoint de verificação de sessão (me.php)
 */
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../core/AuthMiddleware.php';
require_once __DIR__ . '/../../core/Security.php';

// Valida a sessão usando o middleware (se falhar, o AuthMiddleware já encerra a requisição)
global $pdo;
$authData = \App\Core\AuthMiddleware::authenticate($pdo);
$userId = $authData['user_id'];

// Busca os dados do usuário atualizados
$stmt = $pdo->prepare("SELECT id, nome, email, role, avatar_url, theme_preference, mfa_ativo, onboarding_completed FROM usuarios WHERE id = :id LIMIT 1");
$stmt->execute([':id' => $userId]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    http_response_code(404);
    echo json_encode(["status" => "error", "message" => "Usuário não encontrado."]);
    exit();
}

// A senha_hash NÃO é selecionada na query, logo não há risco de vazar
echo json_encode([
    "status" => "success",
    "user" => [
        "id" => $user['id'],
        "nome" => $user['nome'],
        "email" => $user['email'],
        "role" => $user['role'],
        "avatarUrl" => $user['avatar_url'],
        "themePreference" => $user['theme_preference'],
        "mfaAtivo" => $user['mfa_ativo'] == 1,
        "onboarding_completed" => $user['onboarding_completed']
    ]
], JSON_UNESCAPED_UNICODE);
