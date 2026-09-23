<?php
/**
 * MoonFinance (moonfinanceme.com.br)
 * Endpoint de Registro (Criação de Conta)
 */
require_once __DIR__ . '/../../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método não permitido"], JSON_UNESCAPED_UNICODE);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$nome = isset($input['name']) ? trim($input['name']) : (isset($input['nome']) ? trim($input['nome']) : '');
$email = isset($input['email']) ? strtolower(trim($input['email'])) : '';
$password = isset($input['password']) ? trim($input['password']) : '';
$cpf = isset($input['cpf']) ? preg_replace('/[^0-9]/', '', $input['cpf']) : '';
$dataNascimento = isset($input['dataNascimento']) ? trim($input['dataNascimento']) : '';

if (empty($nome) || empty($email) || empty($password) || empty($cpf) || empty($dataNascimento)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Nome, e-mail, CPF, data de nascimento e senha são obrigatórios"], JSON_UNESCAPED_UNICODE);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "E-mail inválido"], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    // Verifica se e-mail já existe
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE LOWER(email) = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(["status" => "error", "message" => "E-mail já cadastrado"], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // Verifica se CPF já existe
    $stmtCpf = $pdo->prepare("SELECT id FROM usuarios WHERE cpf = :cpf LIMIT 1");
    $stmtCpf->execute([':cpf' => $cpf]);
    if ($stmtCpf->fetch()) {
        http_response_code(409);
        echo json_encode(["status" => "error", "message" => "Este CPF já está cadastrado em outra conta."], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $pdo->beginTransaction();

    // Hash da senha e pseudonymização
    $senha_hash = password_hash($password, PASSWORD_DEFAULT);
    $user_id = 'usr_' . uniqid();
    $hash_pseudonimizado = hash('sha256', $email . time() . rand(1, 1000));

    $stmtUser = $pdo->prepare("INSERT INTO usuarios (id, nome, email, senha_hash, role, hash_pseudonimizado, cpf, data_nascimento, onboarding_completed) VALUES (:id, :nome, :email, :senha_hash, :role, :hash_pseudonimizado, :cpf, :data_nascimento, 0)");
    $stmtUser->execute([
        ':id' => $user_id,
        ':nome' => $nome,
        ':email' => $email,
        ':senha_hash' => $senha_hash,
        ':role' => 'tenant_admin',
        ':hash_pseudonimizado' => $hash_pseudonimizado,
        ':cpf' => $cpf,
        ':data_nascimento' => $dataNascimento
    ]);

    // Grava log de auditoria no sistema
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $log_id = 'log_' . uniqid();
    $stmtLog = $pdo->prepare("INSERT INTO logs_sistema (id, usuario_id, usuario_nome, perfil, acao, detalhes, ip) VALUES (:id, :usuario_id, :usuario_nome, :perfil, :acao, :detalhes, :ip)");
    $stmtLog->execute([
        ':id' => $log_id,
        ':usuario_id' => $user_id,
        ':usuario_nome' => $nome,
        ':perfil' => 'tenant_admin',
        ':acao' => 'AUTH_REGISTER_SUCCESS',
        ':detalhes' => 'Nova conta criada com sucesso via registro.',
        ':ip' => $ip
    ]);

    $pdo->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Conta criada com sucesso",
        "user" => [
            "id" => $user_id,
            "nome" => $nome,
            "email" => $email,
            "role" => 'tenant_admin',
            "onboarding_completed" => 0
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    error_log("Erro de Registro (MySQL): " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erro interno ao criar conta: " . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
