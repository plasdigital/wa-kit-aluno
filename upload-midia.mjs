/**
 * Sobe mídia para a Meta. São DOIS destinos diferentes, e trocar um pelo outro
 * é o erro clássico de quem monta template com imagem:
 *
 *   --handle (padrão)  Resumable Upload API → `header_handle`
 *                      Pertence ao APP. Serve só de EXEMPLO na hora de criar o
 *                      template — é o que o revisor da Meta olha. Não envia nada.
 *
 *   --media            Cloud API /{PHONE_NUMBER_ID}/media → `media id`
 *                      Pertence ao NÚMERO, vale 30 dias. É o que vai no ENVIO da
 *                      mensagem. Em carrossel, cada card exige o seu: a doc diz
 *                      "Required. Header asset's uploaded media asset ID."
 *
 * Um template com imagem precisa dos dois, em momentos diferentes. O handle não
 * envia mensagem, e o media id não cria template.
 *
 *   node upload-midia.mjs foto.jpg
 *   node upload-midia.mjs a.jpg b.jpg --env ../cliente-x/.env.local
 *   node upload-midia.mjs *.jpg --media --json    imprime { "arquivo": "media id" }
 *
 * Precisa de APP_ID + WA_TOKEN (handle) ou PHONE_NUMBER_ID + WA_TOKEN (media).
 *
 * ⚠️ Imagem só JPEG ou PNG, até 5 MB, 8-bit RGB/RGBA. WebP a Cloud API recusa
 * (só vale para figurinha) — converta antes.
 * ⚠️ O upload é em uma tacada só (`file_offset: 0`). A API permite retomar de um
 * offset, mas imagem de template tem no máximo 5 MB — não vale a complexidade.
 */

import { readFileSync, statSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { carregarEnv, exigir, lerArgs } from './_meta-api.mjs';

const { flags, soltos } = lerArgs(process.argv.slice(2));
const env = carregarEnv(typeof flags.env === 'string' ? flags.env : undefined);
const VERSAO = env.GRAPH_VERSION || 'v23.0';

const TIPOS = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
};

/** Sobe um arquivo e devolve o handle. Lança com a mensagem da Meta se falhar. */
export async function subir(caminho, env) {
  const tipo = TIPOS[extname(caminho).toLowerCase()];
  if (!tipo) throw new Error(`extensão sem tipo conhecido: ${caminho} (aceito: ${Object.keys(TIPOS).join(', ')})`);

  const tamanho = statSync(caminho).size;
  const nome = basename(caminho);

  // 1. abre a sessão — devolve "upload:MTph..."
  const params = new URLSearchParams({ file_name: nome, file_length: String(tamanho), file_type: tipo });
  const rSessao = await fetch(`https://graph.facebook.com/${VERSAO}/${env.APP_ID}/uploads?${params}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.WA_TOKEN}` },
  });
  const sessao = await rSessao.json().catch(() => ({}));
  if (!rSessao.ok || !sessao.id) throw new Error(`abrir sessão: ${JSON.stringify(sessao.error ?? sessao)}`);

  // 2. manda os bytes — aqui o Authorization é OAuth, não Bearer. A Meta rejeita
  //    Bearer neste passo (é a pegadinha clássica da Resumable Upload API).
  const rEnvio = await fetch(`https://graph.facebook.com/${VERSAO}/${sessao.id}`, {
    method: 'POST',
    headers: {
      Authorization: `OAuth ${env.WA_TOKEN}`,
      file_offset: '0',
      'Content-Type': 'application/octet-stream',
    },
    body: readFileSync(caminho),
  });
  const envio = await rEnvio.json().catch(() => ({}));
  if (!rEnvio.ok || !envio.h) throw new Error(`enviar bytes: ${JSON.stringify(envio.error ?? envio)}`);

  return envio.h;
}

/**
 * Sobe pela Cloud API e devolve o `media id` — o que a MENSAGEM usa.
 * Vale 30 dias e está preso ao número (PHONE_NUMBER_ID), não ao app.
 */
export async function subirMedia(caminho, env) {
  const tipo = TIPOS[extname(caminho).toLowerCase()];
  if (!tipo) throw new Error(`extensão sem tipo conhecido: ${caminho} (aceito: ${Object.keys(TIPOS).join(', ')})`);

  const form = new FormData();
  form.append('messaging_product', 'whatsapp');
  form.append('type', tipo);
  form.append('file', new Blob([readFileSync(caminho)], { type: tipo }), basename(caminho));

  const r = await fetch(`https://graph.facebook.com/${VERSAO}/${env.PHONE_NUMBER_ID}/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.WA_TOKEN}` },
    body: form,
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok || !json.id) throw new Error(`upload de mídia: ${JSON.stringify(json.error ?? json)}`);
  return json.id;
}

// Rodou direto pela linha de comando? (importado por outro script, só exporta as funções)
if (process.argv[1]?.endsWith('upload-midia.mjs')) {
  if (!soltos.length) {
    console.error('\nUso: node upload-midia.mjs <arquivo...> [--media] [--env <caminho>] [--json]\n');
    process.exit(1);
  }
  const paraEnvio = Boolean(flags.media);
  exigir(env, paraEnvio ? ['PHONE_NUMBER_ID', 'WA_TOKEN'] : ['APP_ID', 'WA_TOKEN']);

  const resultado = {};
  for (const arquivo of soltos) {
    try {
      const id = paraEnvio ? await subirMedia(arquivo, env) : await subir(arquivo, env);
      resultado[basename(arquivo)] = id;
      if (!flags.json) console.log(`✅ ${basename(arquivo)}  ${paraEnvio ? '(media id)' : '(handle)'}\n   ${id}\n`);
    } catch (erro) {
      console.error(`❌ ${basename(arquivo)}: ${erro.message}\n`);
      process.exitCode = 1;
    }
  }
  if (flags.json) console.log(JSON.stringify(resultado, null, 2));
}
