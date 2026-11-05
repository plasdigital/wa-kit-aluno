/**
 * descobrir-ids.mjs — com SÓ o token, descobre o app, as WABAs e os números que ele enxerga.
 *
 * READ-ONLY. Não muda nada na Meta, não imprime o token.
 *
 *   node descobrir-ids.mjs                      # mostra o que o token enxerga
 *   node descobrir-ids.mjs --gravar             # e preenche APP_ID, WABA_ID e PHONE_NUMBER_ID
 *                                               #   vazios do .env.local desta pasta
 *   node descobrir-ids.mjs --bm 123456789       # token de "todos os ativos": lista pela BM
 *   node descobrir-ids.mjs --env ../outro/.env  # soma um segundo .env por cima
 *
 * Por que existe (05/nov/2026): o agente do kit do aluno pedia "o ID do WhatsApp" para a pessoa
 * que tinha acabado de criar o app — ela não sabia onde achar, e nem precisava. O token do
 * usuário do sistema já diz de qual app ele é e quais WABAs ele enxerga (debug_token →
 * granular_scopes.target_ids); a WABA diz quais números tem. Quem procura ID é a máquina.
 *
 * Precisa de: WA_TOKEN. Com APP_ID + APP_SECRET, usa o token do app no debug_token (mais
 * garantido); sem eles, o próprio token se inspeciona.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { AQUI, carregarEnv, lerArgs, get, relatar } from './_meta-api.mjs';

const { flags } = lerArgs(process.argv.slice(2));
const env = carregarEnv(typeof flags.env === 'string' ? flags.env : undefined);
const VERSAO = env.GRAPH_VERSION || 'v23.0';

if (!env.WA_TOKEN) {
  console.error('\n❌ Faltou WA_TOKEN no .env.local desta pasta.');
  console.error('   O token certo é o do usuário do sistema: business.facebook.com > Configurações do');
  console.error('   negócio > Usuários do sistema > Gerar novo token (veja o §A7 do manual).\n');
  process.exit(1);
}

console.log(`\n🔎 O que este token enxerga (Graph API ${VERSAO})\n`);

/* ------------------------------------------------------------ 1. de quem e de qual app */

const quem = await get('me?fields=id,name', env);
if (!relatar(quem)) process.exit(1);
console.log(`   token de        ${quem.json.name ?? '?'} (${quem.json.id})`);

const inspetor = env.APP_ID && env.APP_SECRET ? `${env.APP_ID}|${env.APP_SECRET}` : env.WA_TOKEN;
const dbg = await get(
  `debug_token?input_token=${encodeURIComponent(env.WA_TOKEN)}&access_token=${encodeURIComponent(inspetor)}`,
  env
);
const d = dbg.json?.data;
if (!dbg.ok || !d) {
  console.log('\n⚠️  A Meta não deixou o token se inspecionar (debug_token).');
  relatar(dbg);
  console.log('   → Preencha APP_ID e APP_SECRET (Configurações > Básico do app) e rode de novo.\n');
  process.exit(1);
}

const vence = d.expires_at ? new Date(d.expires_at * 1000).toLocaleString('pt-BR') : 'nunca';
console.log(`   app             ${d.application ?? '?'} (${d.app_id ?? '?'})`);
console.log(`   vence           ${d.expires_at === 0 ? 'nunca' : vence}`);
console.log(`   permissões      ${(d.scopes ?? []).join(', ') || '(nenhuma)'}`);

const faltam = ['whatsapp_business_management', 'whatsapp_business_messaging'].filter(
  (s) => !(d.scopes ?? []).includes(s)
);
if (faltam.length) {
  console.log(`\n⚠️  Faltam permissões no token: ${faltam.join(', ')}.`);
  console.log('   Gere outro token do usuário do sistema marcando essas duas.');
}

/* ------------------------------------------------------------ 2. as WABAs e os números */

// Dois jeitos de achar as WABAs, conferidos em 05/nov/2026:
//  a) o token foi gerado com ativos escolhidos → granular_scopes traz target_ids;
//  b) o token vale para "todos os ativos" (sem target_ids) → lista-se pela empresa (BM):
//     /{bm}/owned_whatsapp_business_accounts + /{bm}/client_whatsapp_business_accounts.
//     O id da BM está no link de business.facebook.com (?business_id=...): o dono manda o
//     LINK da página, não precisa saber o que é id.
const alvo = (d.granular_scopes ?? []).find((g) => g.scope === 'whatsapp_business_management');
let wabas = [...new Set(alvo?.target_ids ?? [])];
const bm = typeof flags.bm === 'string' ? flags.bm : env.BUSINESS_ID;

if (!wabas.length && bm) {
  for (const borda of ['owned_whatsapp_business_accounts', 'client_whatsapp_business_accounts']) {
    const r = await get(`${bm}/${borda}?fields=id,name&limit=100`, env);
    if (r.ok) wabas.push(...(r.json.data ?? []).map((w) => w.id));
    else relatar(r);
  }
  wabas = [...new Set(wabas)];
}

if (!wabas.length && !bm && alvo) {
  console.log('\n🟡 O token vale para todos os ativos da empresa, então a lista sai pela BM.');
  console.log('   Peça ao dono o LINK da página de business.facebook.com (tem "business_id=" nele)');
  console.log('   e rode:  node descobrir-ids.mjs --bm <o número depois de business_id=>\n');
  process.exit(0);
}

if (!wabas.length) {
  console.log('\n🟡 O token não enxerga nenhuma conta do WhatsApp (WABA).');
  console.log('   Normal logo depois de criar o app. O caminho:');
  console.log('   1. no app, adicione o produto WhatsApp (isso cria a WABA);');
  console.log('   2. em Usuários do sistema > Adicionar ativos, dê ao usuário a WABA com controle total;');
  console.log('   3. gere o token de novo e rode este comando outra vez.\n');
  process.exit(0);
}

const achados = [];
for (const waba of wabas) {
  const info = await get(`${waba}?fields=name`, env);
  const nums = await get(
    `${waba}/phone_numbers?fields=id,display_phone_number,verified_name,status,code_verification_status`,
    env
  );
  console.log(`\n   WABA ${waba}  ${info.json?.name ? `— ${info.json.name}` : ''}`);
  if (!nums.ok) {
    relatar(nums);
    continue;
  }
  const lista = nums.json.data ?? [];
  if (!lista.length) console.log('     (nenhum número ainda — adicione um no painel do WhatsApp do app)');
  for (const n of lista) {
    console.log(
      `     número ${n.display_phone_number}  id ${n.id}  ${n.verified_name ?? ''}  [${n.status ?? '?'}]`
    );
    achados.push({ waba, numero: n.id });
  }
  if (!lista.length) achados.push({ waba, numero: null });
}

/* ------------------------------------------------------------ 3. gravar no .env.local */

const unicaWaba = wabas.length === 1 ? wabas[0] : null;
const unicoNumero = achados.filter((a) => a.numero).length === 1 ? achados.find((a) => a.numero) : null;
const sugestao = {
  APP_ID: d.app_id ? String(d.app_id) : '',
  BUSINESS_ID: bm ? String(bm) : '',
  WABA_ID: unicoNumero?.waba ?? unicaWaba ?? '',
  PHONE_NUMBER_ID: unicoNumero?.numero ?? '',
};

console.log('\n   Para o .env.local:');
for (const [k, v] of Object.entries(sugestao)) {
  console.log(`     ${k}=${v || '(mais de uma opção ou nenhuma — o dono escolhe pela lista acima)'}`);
}

if (flags.gravar) {
  const arq = join(AQUI, '.env.local');
  if (!existsSync(arq)) {
    console.log('\n❌ Não existe .env.local nesta pasta para gravar. cp .env.exemplo .env.local\n');
    process.exit(1);
  }
  let texto = readFileSync(arq, 'utf8');
  const gravados = [];
  for (const [k, v] of Object.entries(sugestao)) {
    if (!v) continue;
    const re = new RegExp(`^(\\s*${k}\\s*=)\\s*$`, 'm'); // só preenche o que está VAZIO
    if (re.test(texto)) {
      texto = texto.replace(re, `$1${v}`);
      gravados.push(k);
    } else if (!new RegExp(`^\\s*${k}\\s*=`, 'm').test(texto)) {
      texto += `${texto.endsWith('\n') ? '' : '\n'}${k}=${v}\n`;
      gravados.push(k);
    }
  }
  writeFileSync(arq, texto);
  console.log(
    gravados.length
      ? `\n✅ Gravei no .env.local: ${gravados.join(', ')} (o que já estava preenchido ficou como estava).\n`
      : '\n   Nada gravado: os campos já estavam preenchidos ou não houve escolha única.\n'
  );
} else {
  console.log('\n   (rode com --gravar para preencher os campos vazios do .env.local)\n');
}
