<?php
/**
 * MoonFinance (moonfinanceme.com.br)
 * Endpoint de Upload de Avatar
 */
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../core/AuthMiddleware.php';

header('Content-Type: application/json');
$auth = \App\Core\AuthMiddleware::authenticate();
$userId = $auth['user_id'] ?? null;

$method = $_SERVER['REQUEST_METHOD'];

// Configurações do Upload
$uploadDir = __DIR__ . '/../../public/uploads/avatars/';
$publicDir = '/uploads/avatars/';
$maxSize = 2 * 1024 * 1024; // 2MB
$allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
$allowedExts = ['jpg', 'jpeg', 'png', 'webp'];

if ($method === 'POST') {
    if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Nenhuma imagem válida enviada."], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $file = $_FILES['avatar'];
    
    // Validar tamanho
    if ($file['size'] > $maxSize) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "O arquivo não pode exceder 2MB."], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Validar tipo e extensão
    $fileInfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($fileInfo, $file['tmp_name']);
    finfo_close($fileInfo);

    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

    if (!in_array($mimeType, $allowedTypes) || !in_array($ext, $allowedExts)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Formato de imagem inválido. Use JPG, PNG ou WEBP."], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Criar diretório se não existir
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Nome único
    $filename = 'avatar_' . uniqid() . '_' . time() . '.' . $ext;
    $destination = $uploadDir . $filename;
    $publicUrl = $publicDir . $filename;

    if (move_uploaded_file($file['tmp_name'], $destination)) {
        try {
            $sql = "UPDATE usuarios SET avatar_url = :url, atualizado_em = NOW() WHERE usuario_id = :usuario_id";
            $params = [':url' => $publicUrl, ':usuario_id' => $userId];
            
            if ($userId) {
                $sql .= " AND id = :user_id";
                $params[':user_id'] = $userId;
            }

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            echo json_encode([
                "status" => "success", 
                "message" => "Avatar atualizado com sucesso.",
                "avatar_url" => $publicUrl
            ], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            // Em caso de erro no DB, apaga o arquivo para não gerar lixo
            @unlink($destination);
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Erro ao mover arquivo para o diretório de uploads."], JSON_UNESCAPED_UNICODE);
    }
} elseif ($method === 'DELETE') {
    // Rota para remover o avatar
    try {
        $sql = "UPDATE usuarios SET avatar_url = NULL, atualizado_em = NOW() WHERE usuario_id = :usuario_id";
        $params = [':usuario_id' => $userId];
        
        if ($userId) {
            $sql .= " AND id = :user_id";
            $params[':user_id'] = $userId;
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        echo json_encode([
            "status" => "success", 
            "message" => "Avatar removido com sucesso."
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Método não permitido."], JSON_UNESCAPED_UNICODE);
}
