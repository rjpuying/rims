#!/usr/bin/env node
// RIMS database test runner.
//
//   node scripts/run-tests.mjs            # run every tests/*.sql
//   node scripts/run-tests.mjs 01         # run files whose name contains "01"
//
// Each test file is wrapped as:
//   begin; <tests/_bootstrap.sql> <test file>; rollback;
// so the remote database is never mutated. Test helpers print PASS notices;
// a raised FAIL/exception marks the file as failed.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
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
const poolerFile = new URL("../supabase/.temp/pooler-url", import.meta.url);
const url = fs.existsSync(poolerFile)
  ? fs.readFileSync(poolerFile, "utf8").trim()
  : env.SUPABASE_DB_URL;
if (!url) {
  console.error("No database URL (supabase/.temp/pooler-url or SUPABASE_DB_URL)");
  process.exit(1);
}
const u = new URL(url);
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

const testsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "tests");
const bootstrap = fs.readFileSync(path.join(testsDir, "_bootstrap.sql"), "utf8");
const filter = process.argv.slice(2).join(" ");
const files = fs
  .readdirSync(testsDir)
  .filter((f) => f.endsWith(".sql") && !f.startsWith("_"))
  .filter((f) => !filter || f.includes(filter))
  .sort();

if (files.length === 0) {
  console.error(`No test files found in tests/${filter ? ` matching "${filter}"` : ""}`);
  process.exit(1);
}

let failed = 0;
for (const file of files) {
  const body = fs.readFileSync(path.join(testsDir, file), "utf8");
  const script = `begin;\n${bootstrap}\n${body}\nrollback;`;

  const client = new pg.Client(config);
  let passes = 0;
  let done = false;

  client.on("notice", (msg) => {
    const m = msg.message ?? "";
    if (m.startsWith("PASS")) {
      passes += 1;
      console.log(`  + ${m.replace(/^PASS\s*\|\s*/, "")}`);
    } else if (m.startsWith("FAIL")) {
      console.log(`  - ${m.replace(/^FAIL\s*\|\s*/, "")}`);
    } else {
      console.log(`  . ${m}`);
    }
  });

  console.log(`\n== ${file}`);
  try {
    await client.connect();
    await client.query(script);
    done = true;
    console.log(`   OK — ${passes} assertion(s) passed`);
  } catch (err) {
    failed += 1;
    console.log(`   FAILED${passes ? ` after ${passes} passing assertion(s)` : ""}`);
    console.log(`   ${err.message}`);
    try {
      await client.query("rollback");
    } catch {
      /* connection is already broken/aborted */
    }
  } finally {
    await client.end().catch(() => {});
  }
  void done;
}

console.log(
  `\n${files.length - failed}/${files.length} test file(s) passed`,
);
process.exit(failed > 0 ? 1 : 0);
