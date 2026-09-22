<?php
declare(strict_types=1);

namespace App\Core;

class AuthMiddleware {
    /**
     * Valida a requisição e retorna o user_id atual.
     * Busca os dados reais na tabela usuarios para auditoria.
     */
    public static function authenticate(\PDO $pdo = null): array {
        // Habilitar CORS para ambiente de dev local React -> PHP
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-User-Id");
        
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }

        if (!function_exists('getallheaders')) {
            $headers = [];
            foreach ($_SERVER as $name => $value) {
                if (substr($name, 0, 5) == 'HTTP_') {
                    $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
                }
            }
        } else {
            $headers = getallheaders();
        }

        $userId = null;
        $usuarioNome = 'Desconhecido';
        $perfil = 'comum';

        $authHeader = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null;
        
        if ($authHeader && preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $token = $matches[1];
            $payload = \App\Core\Security::validateBearerToken($token);
            if ($payload) {
                $userId = $payload['user_id'];
                $usuarioNome = $payload['nome'] ?? 'Desconhecido';
                $perfil = $payload['role'] ?? 'comum';
            }
        }

        // Fallback for X- headers if not using Bearer
        if (!$userId) {
            foreach ($headers as $key => $val) {
                $lk = strtolower($key);
                if ($lk === 'x-user-id') $userId = $val;
            }
            $userId = $userId ?? $_GET['user_id'] ?? null;
        }
        
        if (!$userId) {
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Não autorizado. Credenciais ausentes."]);
            exit();
        }

        if ($pdo && (!$authHeader || empty($payload))) {
            $stmt = $pdo->prepare("SELECT nome, role FROM usuarios WHERE id = :id LIMIT 1");
            $stmt->execute([':id' => $userId]);
            $userRow = $stmt->fetch(\PDO::FETCH_ASSOC);
            if ($userRow) {
                $usuarioNome = $userRow['nome'];
                $perfil = $userRow['role'] ?? 'comum';
            } else {
                http_response_code(401);
                echo json_encode(["status" => "error", "message" => "Não autorizado. Usuário não encontrado no banco de dados."]);
                exit();
            }
        }

        return [
            'user_id' => $userId,
            'usuario_nome' => $usuarioNome,
            'perfil' => $perfil,
            'ip' => self::getClientIp()
        ];
    }

    private static function getClientIp(): string {
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            return $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            return trim($ips[0]);
        }
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
}
