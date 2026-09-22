const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, 'src');

function findAndRefactor(currentDir) {
    fs.readdirSync(currentDir).forEach(f => {
        const full = path.join(currentDir, f);
        if (fs.statSync(full).isDirectory()) {
            findAndRefactor(full);
        } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
            let code = fs.readFileSync(full, 'utf8');
            let original = code;
            
            // Remove tenantId from JSX and objects
            code = code.replace(/tenantId:\s*['"`]?tnt_.*?['"`]?,?\s*/g, '');
            code = code.replace(/tenantId:\s*['"`]?tenant_.*?['"`]?,?\s*/g, '');
            code = code.replace(/tenantId:\s*user(?:Obj)?\??\.tenant(?:I|_i)d\s*(?:\|\|\s*['"`].*?['"`])?,?\s*/g, '');
            
            // Remove from destructuring
            code = code.replace(/tenantId\s*,\s*/g, '');
            
            // Any leftover tenantId property in objects (e.g. `tenantId: apiRes.user?.tenant_id,`)
            code = code.replace(/tenantId:\s*.*?,\s*\n/g, '');

            if (code !== original) {
                fs.writeFileSync(full, code);
                console.log('Refactored ' + full);
            }
        }
    });
}

findAndRefactor(dir);
