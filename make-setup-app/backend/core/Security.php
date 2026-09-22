<?php
declare(strict_types=1);

namespace App\Core;

use PDO;

class Security {
    private const SECRET_SALT = 'MoonFinance@2026_LGPD_SecureSalt!';
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Aplica cabeçalhos rígidos de segurança na resposta HTTP.
     */
    public static function setSecurityHeaders(): void {
        header("Strict-Transport-Security: max-age=31536000; includeSubDomains; preload");
        header("X-Frame-Options: DENY");
        header("X-XSS-Protection: 1; mode=block");
        header("X-Content-Type-Options: nosniff");
        header("Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'");
        header("Referrer-Policy: strict-origin-when-cross-origin");
    }

    /**
     * Gera um hash irreversível pseudonimizado (ex: a partir de um E-mail ou ID).
     * Essencial para atender a LGPD sem expor dados PII em logs de auditoria.
     */
    public static function generatePseudonymizedHash(string $identifier): string {
        return hash_hmac('sha256', strtolower(trim($identifier)), self::SECRET_SALT);
    }

    /**
     * Proteção contra Brute Force: Verifica se o usuário (ou IP) excedeu as tentativas de login.
     * Retorna true se estiver bloqueado.
     */
    public function isRateLimited(string $ip, string $emailHash): bool {
        // Num cenário de produção completo, usaríamos Redis ou uma tabela `login_attempts` dedicata.
        // Aqui usaremos a tabela `logs_sistema` para checar falhas recentes (últimos 15 minutos).
        $stmt = $this->pdo->prepare("
            SELECT COUNT(id) FROM logs_sistema 
            WHERE acao = 'AUTH_LOGIN_FAILED' 
            AND (ip = :ip OR detalhes LIKE :emailHash)
            AND criado_em > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
        ");
        $stmt->execute([
            ':ip' => $ip,
            ':emailHash' => "%{$emailHash}%"
        ]);
        
        $attempts = (int)$stmt->fetchColumn();
        return $attempts >= 5;
    }

    /**
     * Registra eventos de auditoria na base de dados garantindo
     * que os dados sensíveis (PII) estejam protegidos.
     */
    public function logAudit(
        string $userId, 
        string $userName, 
        string $role, 
        string $action, 
        string $details, 
        string $ip
    ): void {
        // Mascara o último octeto do IP para privacidade (ex: 192.168.1.100 -> 192.168.1.0)
        $ipParts = explode('.', $ip);
        if (count($ipParts) === 4) {
            $ipParts[3] = '0';
            $maskedIp = implode('.', $ipParts);
        } else {
            $maskedIp = '0.0.0.0';
        }

        $stmt = $this->pdo->prepare("
            INSERT INTO logs_sistema (id, usuario_id, usuario_nome, perfil, acao, detalhes, ip)
            VALUES (:id, :userId, :userName, :role, :action, :details, :ip)
        ");
        
        $stmt->execute([
            ':id' => 'log_' . bin2hex(random_bytes(8)),
            ':userId' => empty($userId) ? null : $userId,
            ':userName' => empty($userName) ? null : $userName,
            ':role' => empty($role) ? null : $role,
            ':action' => $action,
            ':details' => $details,
            ':ip' => $maskedIp
        ]);
    }

    /**
     * Emite os cookies seguros da sessão HTTP.
     */
    public static function issueSecureSession(array $userData): void {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Proteções extras nativas do PHP para sessão
        session_regenerate_id(true);

        $_SESSION['user_id'] = $userData['id'];
        $_SESSION['role'] = $userData['role'];
        $_SESSION['hash_pseudonimizado'] = $userData['hash_pseudonimizado'];
        $_SESSION['logged_in_at'] = time();

        // Aplicando Cookies HTTP Only, Secure e SameSite=Strict se o cabeçalho ainda não foi enviado
        if (!headers_sent()) {
            setcookie(session_name(), session_id(), [
                'expires' => time() + 86400, // 24 horas
                'path' => '/',
                'domain' => '', 
                'secure' => true, // Apenas HTTPS
                'httponly' => true, // Previne XSS via JS (document.cookie)
                'samesite' => 'Strict' // Previne CSRF
            ]);
        }
    }

    /**
     * Gera um Bearer Token (JWT simples) com validade de 7 dias
     */
    public static function generateBearerToken(array $userData): string {
        $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = base64_encode(json_encode([
            'user_id' => $userData['id'],
            'nome' => $userData['nome'] ?? 'Desconhecido',
            'role' => $userData['role'] ?? 'comum',
            'exp' => time() + (86400 * 7) // 7 days
        ]));
        $signature = hash_hmac('sha256', "$header.$payload", self::SECRET_SALT);
        return "$header.$payload.$signature";
    }

    /**
     * Valida o Bearer Token e retorna o payload ou null se inválido/expirado
     */
    public static function validateBearerToken(string $token): ?array {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;
        
        $signature = hash_hmac('sha256', "{$parts[0]}.{$parts[1]}", self::SECRET_SALT);
        if (!hash_equals($signature, $parts[2])) return null;
        
        $payload = json_decode(base64_decode($parts[1]), true);
        if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) return null;
        
        return $payload;
    }
}
