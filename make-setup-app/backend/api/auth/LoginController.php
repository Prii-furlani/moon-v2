<?php
declare(strict_types=1);

namespace App\Api\Auth;

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../core/Security.php';

use App\Core\Security;
use PDO;
use Exception;

class LoginController {
    private PDO $pdo;
    private Security $security;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
        $this->security = new Security($pdo);
        Security::setSecurityHeaders();
    }

    public function handleRequest(): void {
        header('Content-Type: application/json');

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(["status" => "error", "message" => "Método não permitido"]);
            exit();
        }

        $action = $_GET['action'] ?? 'login';
        
        try {
            if ($action === 'login') {
                $this->login();
            } elseif ($action === 'mfa-verify') {
                $this->mfaVerify();
            } else {
                http_response_code(404);
                echo json_encode(["status" => "error", "message" => "Ação desconhecida"]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Erro interno no servidor"]);
        }
    }

    private function login(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $rawEmail = $input['email'] ?? '';
        $password = $input['password'] ?? '';
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

        // 1. Sanitização
        $email = filter_var(trim($rawEmail), FILTER_SANITIZE_EMAIL);
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->sendInvalidCredentialsError();
        }
        $email = strtolower($email);

        // Pseudonimização para checar rate limit sem expor e-mail
        $emailHash = Security::generatePseudonymizedHash($email);

        // 2. Proteção contra Força Bruta
        if ($this->security->isRateLimited($ip, $emailHash)) {
            http_response_code(429);
            echo json_encode([
                "status" => "error",
                "message" => "Muitas tentativas falhas. Conta bloqueada temporariamente. Tente novamente em 15 minutos."
            ]);
            exit();
        }

        // 3. Consulta Prevenida contra Injeção
        $stmt = $this->pdo->prepare("SELECT id,  nome, senha_hash, role, mfa_ativo, hash_pseudonimizado, onboarding_completed FROM usuarios WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        // 4. Verificação de Senha com Prevenção de Timing Attack
        // Sempre executamos password_verify, mesmo que o usuário não exista (usando um hash dummy se necessário), 
        // para gastar o mesmo tempo de processamento.
        $dummyHash = '$2y$10$wI/nQhDqI/G9yvLpUvA.bO60O7N5y6xQn3wM.W3jXbZJ8XwP9Q6uO'; 
        $isValidPassword = false;

        if ($user) {
            $isValidPassword = password_verify($password, $user['senha_hash']);
        } else {
            password_verify($password, $dummyHash);
        }

        if (!$user || !$isValidPassword) {
            // Auditoria de Falha (Se usuário não existir, logamos o hash tentado do e-mail)
            $this->security->logAudit(
                $user ? $user['id'] : '', 
                '', 
                '', 
                'AUTH_LOGIN_FAILED', 
                "Tentativa de login falhou. Hash: $emailHash", 
                $ip
            );
            $this->sendInvalidCredentialsError();
        }

        // 5. Fluxo de MFA
        if ($user['mfa_ativo'] == 1) {
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            
            // Estado temporário
            $tempToken = bin2hex(random_bytes(32));
            $_SESSION['mfa_pending_user'] = $user;
            $_SESSION['mfa_temp_token'] = $tempToken;
            $_SESSION['mfa_expires_at'] = time() + 300; // 5 minutos

            echo json_encode([
                "status" => "MFA_REQUIRED",
                "session_temp_token" => $tempToken,
                "message" => "Código MFA exigido."
            ]);
            exit();
        }

        // 6. Login Direto (MFA Desativado)
        $this->security->logAudit(
            $user['id'], 
            $user['nome'], 
            $user['role'], 
            'AUTH_LOGIN_SUCCESS', 
            "Login realizado sem MFA. Hash: {$user['hash_pseudonimizado']}", 
            $ip
        );

        Security::issueSecureSession($user);
        $token = Security::generateBearerToken($user);

        echo json_encode([
            "status" => "success",
            "message" => "Login efetuado com sucesso.",
            "token" => $token,
            "user" => [
                "id" => $user['id'],
                "nome" => $user['nome'],
                "role" => $user['role'],
                "onboarding_completed" => $user['onboarding_completed']
            ]
        ]);
    }

    private function mfaVerify(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $token = $input['session_temp_token'] ?? '';
        $code = $input['mfa_code'] ?? '';
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (empty($_SESSION['mfa_pending_user']) || empty($_SESSION['mfa_temp_token'])) {
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Sessão MFA inválida ou expirada."]);
            exit();
        }

        if ($_SESSION['mfa_temp_token'] !== $token || time() > $_SESSION['mfa_expires_at']) {
            $this->clearMfaSession();
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Token inválido ou expirado."]);
            exit();
        }

        $user = $_SESSION['mfa_pending_user'];

        // Implementação simulada de validação TOTP (aceita '123456')
        // Num cenário real, usaríamos uma lib TOTP validando contra o segredo salvo no BD.
        if ($code !== '123456') {
            $this->security->logAudit(
                $user['id'], 
                $user['nome'], 
                $user['role'], 
                'AUTH_LOGIN_FAILED', 
                "Falha na validação MFA.", 
                $ip
            );
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Código MFA incorreto."]);
            exit();
        }

        // MFA Aprovado
        $this->security->logAudit(
            $user['id'], 
            $user['nome'], 
            $user['role'], 
            'AUTH_LOGIN_SUCCESS', 
            "Login realizado com sucesso via MFA. Hash: {$user['hash_pseudonimizado']}", 
            $ip
        );

        $this->clearMfaSession();
        Security::issueSecureSession($user);
        $token = Security::generateBearerToken($user);

        echo json_encode([
            "status" => "success",
            "message" => "Login efetuado com sucesso via MFA.",
            "token" => $token,
            "user" => [
                "id" => $user['id'],
                "nome" => $user['nome'],
                "role" => $user['role'],
                "onboarding_completed" => $user['onboarding_completed']
            ]
        ]);
    }

    private function clearMfaSession(): void {
        unset($_SESSION['mfa_pending_user']);
        unset($_SESSION['mfa_temp_token']);
        unset($_SESSION['mfa_expires_at']);
    }

    private function sendInvalidCredentialsError(): void {
        http_response_code(401);
        echo json_encode([
            "status" => "error",
            // Mensagem genérica OBRIGATÓRIA para evitar enumeração de usuários
            "message" => "Credenciais inválidas."
        ]);
        exit();
    }
}

// Inicializa e roda o Controller
global $pdo; // $pdo vem do db.php
$controller = new LoginController($pdo);
$controller->handleRequest();
