const fs = require('fs');
const path = require('path');

function cleanSchema(filePath) {
    let sql = fs.readFileSync(filePath, 'utf8');

    // Remove tables
    sql = sql.replace(/-- \d+\.\s*TENANTS[\s\S]*?(?=-- \d+\.)/, '');
    sql = sql.replace(/-- \d+\.\s*CONVITES DE MEMBROS DA FAMÍLIA[\s\S]*?(?=-- \d+\.)/, '');
    sql = sql.replace(/-- \d+\.\s*CONFIGURAÇÕES DE PRIVACIDADE E MÓDULOS OPERACIONAIS DO TENANT[\s\S]*?(?=-- \d+\.)/, '');

    // Remove tenant_id column
    sql = sql.replace(/[ \t]*`tenant_id` VARCHAR\(50\)[^\n]*,\n/g, '');
    
    // Remove tenant_id foreign keys
    sql = sql.replace(/[ \t]*FOREIGN KEY \(`tenant_id`\) REFERENCES `tenants`\(`id`\) ON DELETE CASCADE,?\n/g, '');

    // Some indexes using tenant_id
    sql = sql.replace(/[ \t]*INDEX `[^`]+` \(`tenant_id`[^)]*\),?\n/g, '');

    // Fix trailing commas if we removed the last item (rough heuristic, we can fix syntax errors later if they appear)
    sql = sql.replace(/,\n\)/g, '\n)');

    // For tables that need usuario_id but only had tenant_id
    // we should make sure they have usuario_id
    const tablesNeedingUsuarioId = ['pets', 'veiculos', 'cartoes_credito', 'rituais_estetica', 'inadimplencias', 'metas_planejamento', 'metas_financeiras'];
    
    for (const table of tablesNeedingUsuarioId) {
        // Find the CREATE TABLE block for this table
        const regex = new RegExp(`CREATE TABLE IF NOT EXISTS \`${table}\` \\([\\s\\S]*?\\) ENGINE=InnoDB`, 'g');
        sql = sql.replace(regex, (match) => {
            if (!match.includes('`usuario_id`')) {
                // Insert usuario_id after id
                let newMatch = match.replace(/(`id` VARCHAR\(50\) NOT NULL,)/, '$1\n  `usuario_id` VARCHAR(50) NOT NULL,');
                // Add FOREIGN KEY before the last closing parenthesis
                newMatch = newMatch.replace(/\n\)/, ',\n  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE\n)');
                return newMatch;
            }
            return match;
        });
    }

    fs.writeFileSync(filePath, sql);
    console.log("Cleaned " + filePath);
}

const basePath = path.resolve(__dirname);
cleanSchema(path.join(basePath, 'moon_mysql_schema.sql'));
cleanSchema(path.join(basePath, 'backend', 'schema.sql'));
