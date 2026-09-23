const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function test() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USERNAME || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_DATABASE || 'moonfinance',
        });

        console.log("Connected to database successfully.");

        const [rows, fields] = await connection.execute('SELECT id, usuario_id, acao, detalhes, criado_em FROM logs_sistema ORDER BY criado_em DESC LIMIT 10;');
        
        console.log("=== ÚLTIMOS LOGS DE AUDITORIA ===");
        console.table(rows);

        await connection.end();
    } catch (err) {
        console.error("Database connection failed:", err.message);
    }
}

test();
