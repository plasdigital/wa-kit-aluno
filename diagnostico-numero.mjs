/**
 * Diagnóstico READ-ONLY de um número na WhatsApp Cloud API.
 *
 * Não registra, não muda PIN, não gasta tentativa. Só lê o estado real
 * do número na Graph API e traduz o que cada campo significa.
 *
 * Uso:
 *   1. Crie o .env.local nesta pasta (veja .env.exemplo)
 *   2. node diagnostico-numero.mjs
 *
 * Para diagnosticar um número que mora em OUTRA pasta (o de um cliente, por
 * exemplo), sem trazer o token dele pra cá:
 *   node diagnostico-numero.mjs --env ../cliente-x/.env.local
 */

import { carregarEnv, lerArgs } from './_meta-api.mjs';

const VERSAO = 'v23.0';

async function graph(caminho, token) {
  const url = `https://graph.facebook.com/${VERSAO}/${caminho}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const json = await r.json();
  return { ok: r.ok, status: r.status, json };
}

// Traduções dos campos que decidem se o número pode ou não ser registrado.
const STATUS = {
  CONNECTED: '🟢 registrado e ativo na Cloud API',
  PENDING: '🟡 aguardando aprovação (ainda não registrado)',
  DISCONNECTED: '🔴 desconectado da Cloud API',
  MIGRATED: '🔵 migrado para outra conta',
  FLAGGED: '🔴 sinalizado por qualidade baixa',
  BANNED: '⛔ banido — precisa de apelação antes de qualquer registro',
  RESTRICTED: '🔴 restrito (bateu limite de mensagens)',
  RATE_LIMITED: '🟡 limitado por taxa',
  UNVERIFIED: '🟡 não verificado',
  UNKNOWN: '⚪ desconhecido',
};

const VERIFICACAO = {
  VERIFIED: '🟢 posse do número confirmada por SMS/voz — liberado para o /register',
  NOT_VERIFIED: '🔴 posse NÃO confirmada — precisa de request_code + verify_code ANTES do /register',
  UNVERIFIED: '🔴 posse NÃO confirmada — precisa de request_code + verify_code ANTES do /register',
  EXPIRED: '🟡 verificação expirou — refazer request_code + verify_code',
};

const NOME = {
  APPROVED: '🟢 nome de exibição aprovado',
  AVAILABLE_WITHOUT_REVIEW: '🟢 nome liberado sem revisão',
  PENDING_REVIEW: '🟡 nome em análise',
  DECLINED: '🔴 nome recusado — trocar antes de registrar',
  EXPIRED: '🟡 certificado do nome expirou',
  NONE: '⚪ nenhum nome de exibição definido',
};

function linha(rotulo, valor, dicionario) {
  const bruto = valor ?? '(não retornado)';
  const traduzido = dicionario?.[valor];
  console.log(`  ${rotulo.padEnd(26)} ${bruto}${traduzido ? `  → ${traduzido}` : ''}`);
}

const { flags } = lerArgs(process.argv.slice(2));
const env = carregarEnv(flags.env);
const token = env.WA_TOKEN;
const phoneId = env.PHONE_NUMBER_ID;
const wabaId = env.WABA_ID;

if (!token || !phoneId) {
  console.error('❌ Faltou WA_TOKEN ou PHONE_NUMBER_ID. Preencha o .env.local desta pasta,');
  console.error('   ou aponte o de outro número com  --env <caminho>.');
  process.exit(1);
}

console.log(`\n🔎 Diagnóstico do número (phone_number_id ${phoneId})\n`);

const campos = [
  'id',
  'display_phone_number',
  'verified_name',
  'status',
  'code_verification_status',
  'name_status',
  'quality_rating',
  'platform_type',
  'account_mode',
  'messaging_limit_tier',
  'is_official_business_account',
  'is_pin_enabled',
  'last_onboarded_time',
  'throughput',
].join(',');

const numero = await graph(`${phoneId}?fields=${campos}`, token);

if (!numero.ok) {
  const e = numero.json?.error ?? {};
  console.log(`❌ A Graph API recusou a leitura (HTTP ${numero.status}).`);
  console.log(`   code=${e.code} subcode=${e.error_subcode ?? '-'}`);
  console.log(`   ${e.message ?? '(sem mensagem)'}`);
  if (e.code === 190) console.log('\n   → Token inválido ou expirado. Gere outro em App Dashboard > WhatsApp > API Setup.');
  if (e.code === 200 || e.code === 10) console.log('\n   → O token não tem whatsapp_business_management. Use o token do painel do app dono da WABA.');
  if (e.code === 100) console.log('\n   → PHONE_NUMBER_ID errado, ou esse token não enxerga esse número.');
  process.exit(1);
}

const d = numero.json;
linha('display_phone_number', d.display_phone_number);
linha('verified_name', d.verified_name);
linha('status', d.status, STATUS);
linha('code_verification_status', d.code_verification_status, VERIFICACAO);
linha('name_status', d.name_status, NOME);
linha('platform_type', d.platform_type);
linha('account_mode', d.account_mode);
linha('quality_rating', d.quality_rating);
linha('messaging_limit_tier', d.messaging_limit_tier);
linha('is_pin_enabled', d.is_pin_enabled);
linha('last_onboarded_time', d.last_onboarded_time);

if (wabaId) {
  console.log(`\n🔎 Todos os números da WABA ${wabaId}\n`);
  const lista = await graph(`${wabaId}/phone_numbers?fields=id,display_phone_number,status,code_verification_status,platform_type,account_mode`, token);
  if (lista.ok) {
    for (const n of lista.json.data ?? []) {
      console.log(`  ${n.display_phone_number}  id=${n.id}  status=${n.status}  verif=${n.code_verification_status}  plataforma=${n.platform_type ?? '-'}`);
    }
  } else {
    console.log(`  ⚠️ não consegui listar: ${lista.json?.error?.message}`);
  }
}

// Veredito: o que fazer a seguir, em função do estado real lido acima.
console.log('\n📋 Veredito\n');

// A ordem importa: `status` manda. Número já CONNECTED foi registrado — e aí
// `code_verification_status: EXPIRED` é só o código de SMS antigo vencendo, não
// um problema. Checar a verificação antes do status fazia o script mandar registrar
// número que já estava no ar (observado em 19/ago/2026).
if (d.status === 'BANNED') {
  console.log('  ⛔ Número banido. Nada de registro até a apelação ser aceita.');
} else if (d.status === 'CONNECTED') {
  console.log('  → O número JÁ está registrado na Cloud API. O que falta não é registro.');
  if (d.code_verification_status !== 'VERIFIED')
    console.log(`    (${d.code_verification_status} em code_verification_status é o código de SMS vencido — não afeta quem já está CONNECTED.)`);
  if (d.is_pin_enabled === false)
    console.log('    ⚠️ Sem PIN de duas etapas. Ative: POST /' + phoneId + ' com {"pin":"<6 dígitos>"}.');
  else
    console.log('    Se o objetivo é só trocar o PIN: POST /' + phoneId + ' com {"pin":"NOVO"} (não pede o PIN antigo).');
} else if (d.code_verification_status !== 'VERIFIED') {
  console.log('  → A posse do número ainda não foi confirmada. O /register vai falhar de qualquer jeito.');
  console.log('    Ordem certa: request_code (SMS ou VOICE) → verify_code → register.');
} else {
  console.log('  → Número verificado mas não conectado: é exatamente o caso do /register.');
  console.log('    POST /' + phoneId + '/register com {"messaging_product":"whatsapp","pin":"<6 dígitos>"}');
  console.log('    O PIN que você mandar aí VIRA o PIN de duas etapas. Não precisa mexer no Manager antes.');
}

console.log('\n  ⚠️ Limite: 10 tentativas de register por número a cada 72h (erro 133016 trava por 72h).\n');
