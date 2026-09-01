/**
 * Registro de número na WhatsApp Cloud API — as 3 etapas, uma por comando.
 *
 * Nada dispara sozinho: cada etapa é um comando separado, porque as duas
 * últimas têm limite rígido (10 tentativas por número a cada 72h).
 *
 * Ordem obrigatória:
 *   1) node registrar-numero.mjs request-code sms     → recebe SMS com o código
 *   2) node registrar-numero.mjs verify-code 123456   → confirma a posse do número
 *   3) node registrar-numero.mjs register 654321      → registra E cria o PIN de 2 etapas
 *
 * O PIN do passo 3 é escolhido por você, 6 dígitos. É ele que vira o PIN de
 * verificação em duas etapas. Anote — é exigido para excluir o número depois.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const VERSAO = 'v23.0';

function carregarEnv() {
  const env = {};
  try {
    const bruto = readFileSync(join(AQUI, '.env.local'), 'utf8');
    for (const linha of bruto.split(/\r?\n/)) {
      const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    console.error('❌ Não achei o .env.local nesta pasta. Copie o .env.exemplo e preencha.');
    process.exit(1);
  }
  return env;
}

// Cada código de erro da Meta com o que fazer a respeito.
const ERROS = {
  100: 'Parâmetro inválido. Confira o PHONE_NUMBER_ID e o formato do que foi enviado.',
  190: 'Token inválido ou expirado. Gere outro em App Dashboard > WhatsApp > Configuração da API.',
  200: 'Sem permissão. O token precisa de whatsapp_business_management.',
  131000: 'Erro genérico da Meta. Costuma ser transitório — esperar e repetir.',
  131014: 'Erro interno da Meta. Transitório, repetir mais tarde.',
  131031: 'Conta comercial BLOQUEADA. Nada de registro até resolver no Business Manager.',
  133005: 'PIN não confere. O número já tem 2 etapas ativo com OUTRO PIN.',
  133006: 'Número precisa ser reverificado. Volte para o request-code.',
  133008: 'Tentativas de PIN esgotadas. Aguarde o tempo indicado antes de tentar de novo.',
  133010: 'Número não está verificado. Faça request-code + verify-code antes.',
  133012: 'Número já vinculado a um CAPI companion (app WhatsApp Business). Não é o fluxo simples.',
  133015: 'Aguarde alguns minutos antes de tentar registrar de novo.',
  133016: '🚨 LIMITE ESTOURADO: muitas tentativas. O número fica travado por 72h.',
  136024: 'Número já registrado em outra conta ou em uso.',
};

async function post(caminho, token, corpo) {
  const url = `https://graph.facebook.com/${VERSAO}/${caminho}`;
  const opcoes = {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  };
  if (corpo) {
    opcoes.headers['Content-Type'] = 'application/json';
    opcoes.body = JSON.stringify(corpo);
  }
  const r = await fetch(url, opcoes);
  const json = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, json };
}

function relatar(resultado, sucesso) {
  if (resultado.ok && resultado.json?.success !== false) {
    console.log(`\n✅ ${sucesso}\n`);
    return true;
  }
  const e = resultado.json?.error ?? {};
  console.log(`\n❌ Falhou (HTTP ${resultado.status})`);
  console.log(`   código: ${e.code ?? '?'}${e.error_subcode ? ` / subcódigo ${e.error_subcode}` : ''}`);
  console.log(`   mensagem: ${e.message ?? '(sem mensagem)'}`);
  if (e.error_user_msg) console.log(`   detalhe: ${e.error_user_msg}`);
  if (ERROS[e.code]) console.log(`\n   → ${ERROS[e.code]}`);
  if (e.fbtrace_id) console.log(`\n   fbtrace_id: ${e.fbtrace_id}  (informe isso se abrir suporte com a Meta)`);
  console.log('');
  return false;
}

const env = carregarEnv();
const token = env.WA_TOKEN;
const phoneId = env.PHONE_NUMBER_ID;

if (!token || !phoneId) {
  console.error('❌ Faltou WA_TOKEN ou PHONE_NUMBER_ID no .env.local.');
  process.exit(1);
}

const [comando, argumento] = process.argv.slice(2);

switch (comando) {
  case 'request-code': {
    const metodo = (argumento ?? 'sms').toUpperCase();
    if (!['SMS', 'VOICE'].includes(metodo)) {
      console.error('❌ Método deve ser "sms" ou "voice".');
      process.exit(1);
    }
    console.log(`\n📲 Pedindo código por ${metodo} para o número ${phoneId}...`);
    const r = await post(`${phoneId}/request_code?code_method=${metodo}&language=pt_BR`, token);
    if (relatar(r, `Código enviado por ${metodo}. Chega em segundos no aparelho com o chip.`)) {
      console.log('   Próximo passo: node registrar-numero.mjs verify-code <código de 6 dígitos>\n');
    }
    break;
  }

  case 'verify-code': {
    if (!/^\d{6}$/.test(argumento ?? '')) {
      console.error('❌ Informe o código de 6 dígitos que chegou por SMS/voz.');
      process.exit(1);
    }
    console.log(`\n🔑 Confirmando a posse do número com o código ${argumento}...`);
    const r = await post(`${phoneId}/verify_code?code=${argumento}`, token);
    if (relatar(r, 'Posse confirmada. code_verification_status agora é VERIFIED.')) {
      console.log('   Próximo passo: node registrar-numero.mjs register <PIN de 6 dígitos que VOCÊ escolhe>\n');
    }
    break;
  }

  case 'register': {
    if (!/^\d{6}$/.test(argumento ?? '')) {
      console.error('❌ Informe um PIN de 6 dígitos. Você escolhe qual — ele vira o PIN de duas etapas.');
      process.exit(1);
    }
    console.log(`\n🚀 Registrando o número e criando o PIN de duas etapas...`);
    console.log('   ⚠️ Esta chamada consome 1 das 10 tentativas permitidas a cada 72h.');
    const r = await post(`${phoneId}/register`, token, {
      messaging_product: 'whatsapp',
      pin: argumento,
    });
    if (relatar(r, 'Número REGISTRADO na Cloud API.')) {
      console.log(`   🔐 Guarde o PIN ${argumento} — ele é exigido para excluir o número da plataforma.`);
      console.log('   Confira com: node diagnostico-numero.mjs  (status deve virar CONNECTED)\n');
    }
    break;
  }

  case 'trocar-pin': {
    if (!/^\d{6}$/.test(argumento ?? '')) {
      console.error('❌ Informe o novo PIN de 6 dígitos.');
      process.exit(1);
    }
    console.log(`\n🔐 Trocando o PIN de duas etapas (não exige o PIN antigo)...`);
    const r = await post(`${phoneId}`, token, { pin: argumento });
    relatar(r, `PIN alterado para ${argumento}. Anote.`);
    break;
  }

  default:
    console.log(`
Uso: node registrar-numero.mjs <comando> <argumento>

  request-code sms      pede o código de verificação por SMS
  request-code voice    pede o código por chamada de voz
  verify-code 123456    confirma a posse com o código recebido
  register 654321       registra o número e cria o PIN de 2 etapas (você escolhe o PIN)
  trocar-pin 654321     troca o PIN depois, sem precisar do antigo

Antes de tudo, rode o diagnóstico read-only:
  node diagnostico-numero.mjs
`);
}
