/**
 * Base compartilhada dos scripts da Graph API / WhatsApp Cloud API.
 *
 * Não roda sozinho — é importado por templates.mjs e afins.
 *
 * Credenciais: lê o `.env.local` DESTA pasta como base e, se vier `--env <caminho>`,
 * sobrepõe com o arquivo apontado (valor vazio no arquivo de cima NÃO apaga o de baixo).
 * É assim que se atende mais de um cliente sem misturar as credenciais:
 *
 *   node templates.mjs listar --env ../cliente-x/.env.local
 *
 * O token sai da base (esta pasta), o WABA_ID sai do cliente. Nada é gravado de volta.
 */

import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const AQUI = dirname(fileURLToPath(import.meta.url));

/** Lê um .env simples (CHAVE=valor). Devolve {} se o arquivo não existir. */
function lerArquivoEnv(caminho, obrigatorio) {
  let bruto;
  try {
    bruto = readFileSync(caminho, 'utf8');
  } catch {
    if (obrigatorio) {
      console.error(`❌ Não achei o arquivo de credenciais: ${caminho}`);
      process.exit(1);
    }
    return {};
  }
  const env = {};
  for (const linha of bruto.split(/\r?\n/)) {
    if (/^\s*#/.test(linha)) continue;
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

/**
 * Os segredos já vistos, para nunca serem impressos de volta.
 *
 * 🔴 Achado em 01/set/2026, testando o kit do aluno: quando o token está malformado (colado com
 * espaço, cortado no meio), a Meta devolve `Malformed access token <o token inteiro>` — e nós
 * imprimíamos a mensagem crua dela. Ou seja: o script que promete nunca mostrar o token o
 * mostrava exatamente na hora em que o dono ia colar a saída num chat pedindo ajuda.
 */
const SEGREDOS = new Set();

function registrarSegredos(env) {
  for (const [chave, valor] of Object.entries(env)) {
    if (typeof valor === 'string' && valor.length >= 12 && !/_VERSION$|_VERSAO$/.test(chave)) {
      SEGREDOS.add(valor);
    }
  }
  return env;
}

/** Troca qualquer segredo conhecido por uma marca. Usar em TODO texto que a Meta devolve. */
export function mascarar(texto) {
  if (typeof texto !== 'string') return texto;
  let saida = texto;
  for (const s of SEGREDOS) {
    if (s && saida.includes(s)) saida = saida.split(s).join(`${s.slice(0, 6)}…[oculto]`);
  }
  return saida;
}

/**
 * Base (esta pasta) + overlay opcional. Chave vazia no overlay não sobrescreve.
 */
export function carregarEnv(caminhoExtra) {
  // A base NUNCA é obrigatória: comandos puramente locais (gerar modelo, validar
  // arquivo) têm que rodar sem credencial nenhuma. Quem precisa de chave chama
  // `exigir()`, que reclama com uma mensagem melhor do que "arquivo não existe".
  const base = lerArquivoEnv(join(AQUI, '.env.local'), false);
  if (!caminhoExtra) return registrarSegredos(base);

  const alvo = isAbsolute(caminhoExtra) ? caminhoExtra : resolve(process.cwd(), caminhoExtra);
  const extra = lerArquivoEnv(alvo, true);
  const junto = { ...base };
  for (const [k, v] of Object.entries(extra)) if (v !== '') junto[k] = v;
  return registrarSegredos(junto);
}

/** Separa `--flag valor` / `--flag` dos argumentos soltos. */
export function lerArgs(argv) {
  const flags = {};
  const soltos = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) {
      soltos.push(a);
      continue;
    }
    const nome = a.slice(2);
    const proximo = argv[i + 1];
    if (proximo !== undefined && !proximo.startsWith('--')) {
      flags[nome] = proximo;
      i++;
    } else {
      flags[nome] = true;
    }
  }
  return { flags, soltos };
}

/** Códigos de erro da Meta com o que fazer a respeito. Só os confirmados. */
export const ERROS = {
  4: 'Limite de chamadas da aplicação estourado. Esperar e repetir.',
  10: 'Ação exige que o negócio dono do app seja BSP do WhatsApp. Não dá pra fazer por aqui.',
  100: 'Parâmetro inválido. Confira os IDs e o corpo enviado — a mensagem crua acima diz qual campo.',
  190: 'Token inválido ou expirado. Gere outro em App Dashboard > WhatsApp > Configuração da API.',
  200: 'Sem permissão. O token precisa do escopo whatsapp_business_management.',
  368: 'Ação bloqueada temporariamente por política. Ver Business Manager.',
  80007: 'Limite de chamadas da WABA estourado. Esperar e repetir.',
  131000: 'Erro genérico da Meta. Costuma ser transitório — esperar e repetir.',
  131009: 'Valor de parâmetro inválido para a Cloud API.',
  131014: 'Erro interno da Meta. Transitório, repetir mais tarde.',
  131031: 'Conta comercial BLOQUEADA. Nada funciona até resolver no Business Manager.',
  132000: 'Número de parâmetros não bate com o que o template declara.',
  132001: 'Template não existe nesse idioma, ou não está APPROVED.',
  132005: 'O texto montado passou do limite de caracteres do template.',
  132007: 'Conteúdo viola a política de templates da Meta.',
  132012: 'Formato de parâmetro inválido no template.',
  132015: 'Template pausado por qualidade baixa. Não envia até melhorar.',
  132016: 'Template desabilitado de vez por qualidade. Precisa criar outro.',
  133016: '🚨 LIMITE ESTOURADO: muitas tentativas. O número fica travado por 72h.',
};

/** Chamada crua à Graph API. Nunca imprime o token. */
export async function chamar(metodo, caminho, env, corpo) {
  const versao = env.GRAPH_VERSION || 'v23.0';
  const url = `https://graph.facebook.com/${versao}/${caminho}`;
  const opcoes = { method: metodo, headers: { Authorization: `Bearer ${env.WA_TOKEN}` } };
  if (corpo) {
    opcoes.headers['Content-Type'] = 'application/json';
    opcoes.body = JSON.stringify(corpo);
  }
  const r = await fetch(url, opcoes);
  const json = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, json };
}

export const get = (caminho, env) => chamar('GET', caminho, env);
export const post = (caminho, env, corpo) => chamar('POST', caminho, env, corpo);
export const apagar = (caminho, env) => chamar('DELETE', caminho, env);

/** Imprime o erro da Meta de forma legível. Devolve true se deu certo. */
export function relatar(resultado, sucesso) {
  if (resultado.ok && resultado.json?.error === undefined) {
    if (sucesso) console.log(`\n✅ ${sucesso}\n`);
    return true;
  }
  const e = resultado.json?.error ?? {};
  console.log(`\n❌ Falhou (HTTP ${resultado.status})`);
  console.log(`   código: ${e.code ?? '?'}${e.error_subcode ? ` / subcódigo ${e.error_subcode}` : ''}`);
  console.log(`   mensagem: ${mascarar(e.message) ?? '(sem mensagem)'}`);
  if (e.error_user_title) console.log(`   título: ${mascarar(e.error_user_title)}`);
  if (e.error_user_msg) console.log(`   detalhe: ${mascarar(e.error_user_msg)}`);
  if (ERROS[e.code]) console.log(`\n   → ${ERROS[e.code]}`);
  if (e.fbtrace_id) console.log(`\n   fbtrace_id: ${e.fbtrace_id}  (informe isso se abrir suporte com a Meta)`);
  console.log('');
  return false;
}

/** Garante que as chaves existem; encerra com mensagem útil se faltar. */
export function exigir(env, chaves) {
  const faltando = chaves.filter((k) => !env[k]);
  if (faltando.length) {
    console.error(`\n❌ Faltou no .env.local desta pasta: ${faltando.join(', ')}`);
    console.error('   Não tem o arquivo ainda?  cp .env.exemplo .env.local');
    console.error('   Credencial em outra pasta? use --env <caminho> para somar os dois.\n');
    process.exit(1);
  }
}
