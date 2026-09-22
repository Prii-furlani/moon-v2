const fs = require('fs');
const path = require('path');

function processPhpFile(filePath) {
    let code = fs.readFileSync(filePath, 'utf8');

    // 1. Remove $tenantId = $auth['tenant_id'];
    code = code.replace(/\$tenantId\s*=\s*\$auth\['tenant_id'\];\s*\n?/g, '');
    code = code.replace(/\$tenantId\s*=\s*null;\s*\n?/g, '');
    code = code.replace(/\$auth\['tenant_id'\]/g, 'null'); // in case it's used elsewhere directly
    
    // 2. Fix logAudit calls
    // $security->logAudit($tenantId, $userId, ...) -> $security->logAudit($userId, ...)
    code = code.replace(/->logAudit\(\s*\$tenantId\s*,/g, '->logAudit(');
    code = code.replace(/->logAudit\(\s*null\s*,/g, '->logAudit(');
    
    // 3. Replace tenant_id with usuario_id in SQL WHERE clauses
    code = code.replace(/tenant_id\s*=\s*:tenant_id/g, 'usuario_id = :usuario_id');
    
    // 4. Replace parameter binding
    code = code.replace(/':tenant_id'\s*=>\s*\$tenantId/g, "':usuario_id' => $userId");
    
    // 5. Remove tenant_id from INSERT statements
    // INSERT INTO table (id, tenant_id, usuario_id, ...)
    code = code.replace(/,\s*tenant_id\s*,/g, ', ');
    code = code.replace(/\(\s*tenant_id\s*,/g, '(');
    code = code.replace(/,\s*:tenant_id\s*,/g, ', ');
    code = code.replace(/\(\s*:tenant_id\s*,/g, '(');
    
    // 6. Fix "não pertence a este tenant" messages
    code = code.replace(/não pertence a este tenant/g, 'não pertence a este usuário');

    fs.writeFileSync(filePath, code);
    console.log("Refactored PHP " + filePath);
}

const dir = path.resolve(__dirname, 'backend', 'api');
const allFiles = [];
function findPhp(currentDir) {
    fs.readdirSync(currentDir).forEach(f => {
        const full = path.join(currentDir, f);
        if (fs.statSync(full).isDirectory()) {
            findPhp(full);
        } else if (full.endsWith('.php')) {
            allFiles.push(full);
        }
    });
}
findPhp(dir);

allFiles.forEach(processPhpFile);
