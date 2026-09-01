const pool = require('./pool');

async function testConnection() {
    try {
        const result = await pool.query('SELECT NOW() AS fecha');

        console.log('✅ PostgreSQL conectado correctamente');
        console.log('Fecha BD:', result.rows[0].fecha);
    } catch (error) {
        console.error('❌ Error conectando a PostgreSQL');
        console.error(error.message);
    } finally {
        await pool.end();
    }
}

testConnection();