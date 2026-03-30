import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import vm from 'node:vm';

function loadEnvFile(path) {
  const envText = fs.readFileSync(path, 'utf8');
  for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    process.env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
}

function loadLegacyClients(path) {
  const source = fs.readFileSync(path, 'utf8');
  const script = new vm.Script(`${source}\nclientsDatabase;`);
  return script.runInNewContext({});
}

loadEnvFile('.env.local');

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Faltan PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
}

const clientsDatabase = loadLegacyClients('legacy/clients.js');

if (!Array.isArray(clientsDatabase) || clientsDatabase.length === 0) {
  throw new Error('No se pudieron leer clientes desde legacy/clients.js');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const payload = clientsDatabase.map((client) => ({
  codigo: String(client.code ?? '').trim() || null,
  nombre: String(client.name ?? 'Sin nombre').trim() || 'Sin nombre',
  celular: String(client.phone ?? 'No registrado').trim() || 'No registrado',
  direccion: String(client.address ?? 'Direccion no registrada').trim() || 'Direccion no registrada',
}));

const deduped = [];
const seen = new Set();

for (const client of payload) {
  const key = client.codigo || `${client.nombre}|${client.celular}|${client.direccion}`;
  if (seen.has(key)) continue;
  seen.add(key);
  deduped.push(client);
}

const { error } = await supabase.from('clientes').upsert(deduped, {
  onConflict: 'codigo',
  ignoreDuplicates: false,
});

if (error) {
  throw error;
}

console.log(JSON.stringify({
  insertedOrUpdated: deduped.length,
}, null, 2));
