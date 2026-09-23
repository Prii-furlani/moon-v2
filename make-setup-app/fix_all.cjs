const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      content = content.replace(/tenantId:\s*user!\.tenantId/g, 'usuarioId: user?.usuarioId || user?.id');
      content = content.replace(/tenantId:\s*user!\.usuarioId/g, 'usuarioId: user?.usuarioId || user?.id');
      content = content.replace(/tenantId/g, 'usuarioId');
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

replaceInDir('src/components');
console.log('Fixed components');
