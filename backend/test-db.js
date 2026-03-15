const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const pool = mysql.createPool({
    host:               process.env.DB_HOST,
    port:               Number(process.env.DB_PORT),
    database:           process.env.DB_NAME,
    user:               process.env.DB_USER,
    password:           process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: true }
  });

  const [rows] = await pool.query('SELECT id, city, state, status FROM properties LIMIT 20');
  console.log('Top 20 properties:\n', rows);
  
  const [rows2] = await pool.query('SELECT COUNT(*) as c, city, state FROM properties GROUP BY city, state');
  console.log('\nCity/State breakdown:\n', rows2);

  process.exit(0);
}
check();
