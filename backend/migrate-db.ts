import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function runMigrations() {
  console.log('🔄 Connecting to TiDB Cloud Database...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true, // Allow running the entire schema.sql file at once
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    }
  });

  console.log('✅ Connected successfully!');
  console.log('🔄 Loading schema.sql...');

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log('⚙️ Executing table creation. Please wait...');
  
  try {
    await connection.query(schemaSql);
    console.log('✅ Success! All 8 tables have been successfully created in TiDB.');
  } catch (error) {
    console.error('❌ Failed to run migrations:', error);
  } finally {
    await connection.end();
  }
}

runMigrations();
