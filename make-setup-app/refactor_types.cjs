const fs = require('fs');
const path = require('path');

const typesPath = path.resolve(__dirname, 'src', 'types.ts');
let code = fs.readFileSync(typesPath, 'utf8');

// Remove tenantId from interfaces
code = code.replace(/[ \t]*tenantId\??:\s*string;\n/g, '');

// Remove tenantName
code = code.replace(/[ \t]*tenantName\??:\s*string;\n/g, '');

// Remove tenant_id from JWTTokenClaim
code = code.replace(/[ \t]*tenant_id:\s*string;\n/g, '');

// Also remove Tenant interface
code = code.replace(/export interface Tenant \{[\s\S]*?\}\n\n/g, '');

fs.writeFileSync(typesPath, code);
console.log('Refactored types.ts');
