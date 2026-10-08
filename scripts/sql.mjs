#!/usr/bin/env node
// Minimal SQL runner for applying/inspecting the remote Supabase database.
// Usage:
//   node scripts/sql.mjs -c "select 1"
//   node scripts/sql.mjs path/to/file.sql
import fs from "node:fs";
import pg from "pg";

function loadEnvLocal() {
  const file = new URL("../.env.local", import.meta.url);
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/i);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const env = { ...loadEnvLocal(), ...process.env };

// Prefer the session-mode pooler URL recorded by `supabase link`: the
// `db.<ref>.supabase.co` direct host is IPv6-only and does not resolve on
// some Windows setups.
const poolerFile = new URL("../supabase/.temp/pooler-url", import.meta.url);
const url = fs.existsSync(poolerFile)
  ? fs.readFileSync(poolerFile, "utf8").trim()
  : env.SUPABASE_DB_URL;
if (!url) {
  console.error("No database URL (supabase/.temp/pooler-url or SUPABASE_DB_URL)");
  process.exit(1);
}

const u = new URL(url);
// Pooler URLs recorded by the CLI omit the password — take it from
// SUPABASE_DB_URL in .env.local.
let password = u.password ? decodeURIComponent(u.password) : "";
if (!password && env.SUPABASE_DB_URL) {
  const p = new URL(env.SUPABASE_DB_URL).password;
  password = p ? decodeURIComponent(p) : "";
}
const config = {
  host: u.hostname,
  port: Number(u.port || 5432),
  user: decodeURIComponent(u.username),
  password,
  database: u.pathname.replace(/^\//, ""),
  ssl: { rejectUnauthorized: false },
  statement_timeout: 120000,
};

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/sql.mjs -c "sql" | node scripts/sql.mjs file.sql');
  process.exit(1);
}
const sql = args[0] === "-c" ? args.slice(1).join(" ") : fs.readFileSync(args[0], "utf8");

const client = new pg.Client(config);
try {
  await client.connect();
  const res = await client.query(sql);
  const results = Array.isArray(res) ? res : [res];
  for (const r of results) {
    if (r.rows && r.rows.length > 0) {
      console.table(r.rows);
    } else if (r.command) {
      console.log(`${r.command} ${r.rowCount ?? 0}`);
    }
  }
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
