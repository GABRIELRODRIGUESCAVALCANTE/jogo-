'use strict';
// Cria as tabelas no banco apontado por DATABASE_URL.  Uso: npm run migrar
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

(async()=>{
  if(!process.env.DATABASE_URL){ console.error('Defina DATABASE_URL (ex.: postgres://usuario:senha@host:5432/estrela)'); process.exit(1); }
  const pool = new Pool({ connectionString:process.env.DATABASE_URL, ssl:process.env.PGSSL==='1' ? true : undefined });
  await pool.query(fs.readFileSync(path.join(__dirname,'esquema.sql'),'utf8'));
  console.log('Banco pronto.');
  await pool.end();
})().catch(e=>{ console.error(e.message); process.exit(1); });
