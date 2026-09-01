/**
 * Templates de mensagem da WhatsApp Cloud API — o que o MCP não faz.
 *
 * Template é o único jeito de INICIAR conversa (fora da janela de 24h), e toda
 * criação passa por aprovação da Meta. Reprovar é barato pra Meta e caro pra você:
 * por isso o `validar` roda ANTES de qualquer chamada, e o `criar` valida sozinho.
 *
 *   node templates.mjs listar                      lista todos, com status e qualidade
 *   node templates.mjs listar APPROVED             filtra por status
 *   node templates.mjs ver boas_vindas             mostra o template montado, como chega no chat
 *   node templates.mjs modelo novo.json            gera um JSON de partida pra editar
 *   node templates.mjs validar novo.json           só confere local — não chama a Meta
 *   node templates.mjs criar novo.json             valida e manda pra aprovação
 *   node templates.mjs editar boas_vindas alt.json altera componentes de um template existente
 *   node templates.mjs apagar boas_vindas --confirmar
 *
 * Em qualquer comando: --env <caminho> soma o .env de um cliente ao desta pasta.
 *   node templates.mjs listar --env ../cliente-x/.env.local
 *
 * Precisa de WABA_ID (a conta) e WA_TOKEN. Não usa PHONE_NUMBER_ID: template é
 * da conta inteira, não de um número.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { apagar, carregarEnv, exigir, get, lerArgs, post, relatar } from './_meta-api.mjs';

const { flags, soltos } = lerArgs(process.argv.slice(2));
const [comando, arg1, arg2] = soltos;

const CATEGORIAS = ['UTILITY', 'MARKETING', 'AUTHENTICATION'];
const LIMITES = { header: 60, body: 1024, footer: 60, botoes: 10, nome: 512 };
/** Carrossel tem régua própria: 2–10 cards, corpo curto, 1–2 botões por card. */
const CARROSSEL = { minCards: 2, maxCards: 10, body: 160, minBotoes: 1, maxBotoes: 2 };

// ---------------------------------------------------------------- validação

/** Extrai os números das variáveis {{1}}, {{2}}... na ordem em que aparecem. */
function variaveis(texto = '') {
  return [...texto.matchAll(/\{\{\s*(\d+)\s*\}\}/g)].map((m) => Number(m[1]));
}

/**
 * Regras do componente CAROUSEL, que não são as do template comum.
 *
 * O que a Meta cobra e o resto do validador não veria: o carrossel é uma matriz,
 * não uma lista — todo card tem que ter o MESMO formato de mídia e os MESMOS tipos
 * de botão, na mesma ordem. Um card fora do padrão reprova o template inteiro,
 * então vale gastar as linhas aqui em vez de descobrir pela reprovação.
 */
function validarCarrossel(carrossel, comps, erros, avisos) {
  const cards = Array.isArray(carrossel.cards) ? carrossel.cards : [];

  if (cards.length < CARROSSEL.minCards || cards.length > CARROSSEL.maxCards)
    erros.push(
      `CAROUSEL tem ${cards.length} card(s); a Meta aceita de ${CARROSSEL.minCards} a ${CARROSSEL.maxCards}.`,
    );

  // No template com carrossel, o pai só pode ter BODY — nada de header, rodapé
  // ou botão soltos. Quem tem isso é o card.
  for (const tipo of ['HEADER', 'FOOTER', 'BUTTONS']) {
    if (comps.some((c) => c.type?.toUpperCase() === tipo))
      erros.push(`template com CAROUSEL não aceita ${tipo} fora dos cards — mova para dentro do card.`);
  }

  let formatoBase = null;
  let assinaturaBase = null;

  cards.forEach((card, i) => {
    const num = i + 1;
    const partes = Array.isArray(card.components) ? card.components : [];
    const achar = (tipo) => partes.find((c) => c.type?.toUpperCase() === tipo);

    // --- mídia do card
    const header = achar('HEADER');
    if (!header) {
      erros.push(`card ${num}: falta o HEADER de mídia (IMAGE ou VIDEO).`);
    } else {
      const formato = (header.format ?? '').toUpperCase();
      if (!['IMAGE', 'VIDEO'].includes(formato))
        erros.push(`card ${num}: HEADER de carrossel só aceita IMAGE ou VIDEO — recebi "${formato || '(vazio)'}".`);
      else if (formatoBase === null) formatoBase = formato;
      else if (formato !== formatoBase)
        erros.push(`card ${num}: é ${formato} mas o card 1 é ${formatoBase}. Todos os cards têm que ter o mesmo formato.`);

      if (!header.example?.header_handle?.length)
        erros.push(`card ${num}: HEADER precisa de "example": { "header_handle": ["<handle>"] } — use upload-midia.mjs.`);
    }

    // --- corpo do card (opcional: a regra é ter em todos ou em nenhum, conferida
    // depois do laço)
    const body = achar('BODY');
    if (body) {
      const texto = body.text ?? '';
      if (!texto.trim()) erros.push(`card ${num}: BODY está vazio.`);
      if (texto.length > CARROSSEL.body)
        erros.push(`card ${num}: BODY tem ${texto.length} caracteres; no carrossel o limite é ${CARROSSEL.body}.`);

      const unicas = [...new Set(variaveis(texto))];
      const esperado = unicas.map((_, k) => k + 1);
      if (unicas.length && unicas.join() !== esperado.join())
        erros.push(`card ${num}: variáveis devem ser {{1}}, {{2}}... na ordem em que aparecem.`);
      if (unicas.length && !Array.isArray(body.example?.body_text?.[0]))
        erros.push(`card ${num}: BODY tem variável, então precisa de "example": { "body_text": [[...]] }.`);
    }

    // --- botões do card
    const botoes = achar('BUTTONS');
    const lista = Array.isArray(botoes?.buttons) ? botoes.buttons : [];
    if (lista.length < CARROSSEL.minBotoes || lista.length > CARROSSEL.maxBotoes) {
      erros.push(
        `card ${num}: tem ${lista.length} botão(ões); no carrossel cada card precisa de ${CARROSSEL.minBotoes} a ${CARROSSEL.maxBotoes}.`,
      );
    }

    lista.forEach((b, k) => {
      const tipo = b.type?.toUpperCase();
      if (!b.text?.trim()) erros.push(`card ${num}, botão ${k + 1}: falta "text".`);
      else if (b.text.length > 25) erros.push(`card ${num}, botão ${k + 1}: "text" passa de 25 caracteres.`);
      if (tipo === 'URL') {
        if (!b.url) erros.push(`card ${num}, botão ${k + 1}: é URL mas não tem "url".`);
        else {
          if (b.url.length > 2000) erros.push(`card ${num}, botão ${k + 1}: "url" passa de 2000 caracteres.`);
          if (variaveis(b.url).length > 1)
            erros.push(`card ${num}, botão ${k + 1}: URL aceita no máximo UMA variável.`);
        }
      }
      if (tipo === 'PHONE_NUMBER') {
        if (!b.phone_number) erros.push(`card ${num}, botão ${k + 1}: é PHONE_NUMBER mas não tem "phone_number".`);
        else if (b.phone_number.length > 20)
          erros.push(`card ${num}, botão ${k + 1}: "phone_number" passa de 20 caracteres.`);
      }
      if (!['QUICK_REPLY', 'URL', 'PHONE_NUMBER'].includes(tipo))
        erros.push(`card ${num}, botão ${k + 1}: tipo "${b.type}" não é aceito em carrossel.`);
    });

    // A assinatura é o contrato entre os cards: mesmos tipos, mesma ordem.
    const assinatura = lista.map((b) => b.type?.toUpperCase()).join(' + ');
    if (assinaturaBase === null) assinaturaBase = assinatura;
    else if (assinatura !== assinaturaBase)
      erros.push(
        `card ${num}: botões são "${assinatura}" mas o card 1 é "${assinaturaBase}". ` +
          'Todos os cards precisam dos mesmos tipos, na mesma ordem.',
      );
  });

  // "If any card in the carousel includes a card body text, then all cards must
  // include a card body text." Meio-termo a Meta não aceita.
  const comCorpo = cards.filter((c) =>
    (c.components ?? []).some((p) => p.type?.toUpperCase() === 'BODY' && (p.text ?? '').trim()),
  ).length;
  if (comCorpo && comCorpo !== cards.length)
    erros.push(
      `${comCorpo} de ${cards.length} cards têm texto. Ou todos têm corpo, ou nenhum tem — a Meta não aceita meio-termo.`,
    );

  if (cards.length && !cards.some((c) => (c.components ?? []).some((p) => p.type?.toUpperCase() === 'BUTTONS' && (p.buttons ?? []).some((b) => b.type?.toUpperCase() === 'QUICK_REPLY'))))
    avisos.push('nenhum card tem QUICK_REPLY — sem isso o cliente só tem o link para responder ao carrossel.');
}

/**
 * Confere o template contra as regras da Meta antes de gastar uma submissão.
 * `erros` bloqueiam o envio; `avisos` são os motivos clássicos de reprovação.
 */
function validar(t) {
  const erros = [];
  const avisos = [];

  if (!t.name) erros.push('falta "name".');
  else {
    if (!/^[a-z0-9_]+$/.test(t.name))
      erros.push(`"name" só aceita minúscula, número e _ — recebi "${t.name}".`);
    if (t.name.length > LIMITES.nome) erros.push(`"name" passa de ${LIMITES.nome} caracteres.`);
  }

  if (!t.language) erros.push('falta "language" (ex.: pt_BR, en_US).');
  else if (!/^[a-z]{2}(_[A-Z]{2})?$/.test(t.language))
    avisos.push(`"language" tem formato incomum: "${t.language}". O do Brasil é pt_BR.`);

  if (!CATEGORIAS.includes(t.category))
    erros.push(`"category" deve ser ${CATEGORIAS.join(' | ')} — recebi "${t.category ?? '(vazio)'}".`);

  const comps = Array.isArray(t.components) ? t.components : [];
  if (!comps.length) erros.push('falta "components".');

  const porTipo = (tipo) => comps.filter((c) => c.type?.toUpperCase() === tipo);
  const header = porTipo('HEADER')[0];
  const body = porTipo('BODY')[0];
  const footer = porTipo('FOOTER')[0];
  const botoes = porTipo('BUTTONS')[0];

  for (const [tipo, achados] of [
    ['HEADER', porTipo('HEADER')],
    ['BODY', porTipo('BODY')],
    ['FOOTER', porTipo('FOOTER')],
    ['BUTTONS', porTipo('BUTTONS')],
  ]) {
    if (achados.length > 1) erros.push(`só pode haver um componente ${tipo} — achei ${achados.length}.`);
  }

  // --- BODY: o único obrigatório
  if (!body) {
    erros.push('BODY é obrigatório.');
  } else {
    const texto = body.text ?? '';
    if (!texto.trim()) erros.push('BODY está vazio.');
    if (texto.length > LIMITES.body)
      erros.push(`BODY tem ${texto.length} caracteres; o limite é ${LIMITES.body}.`);

    // Ordem de APARIÇÃO, não ordenada: a Meta exige {{1}} antes de {{2}} no texto.
    const unicas = [...new Set(variaveis(texto))];
    const esperado = unicas.map((_, i) => i + 1);
    if (unicas.length && unicas.join() !== esperado.join())
      erros.push(
        `variáveis do BODY devem ser {{1}}, {{2}}... na ordem em que aparecem no texto — ` +
          `achei {{${unicas.join('}}, {{')}}}.`,
      );

    if (unicas.length) {
      const exemplos = body.example?.body_text;
      if (!Array.isArray(exemplos) || !Array.isArray(exemplos[0]))
        erros.push(`BODY tem ${unicas.length} variável(is), então precisa de "example": { "body_text": [[...]] }.`);
      else if (exemplos[0].length !== unicas.length)
        erros.push(`BODY tem ${unicas.length} variável(is) mas ${exemplos[0].length} exemplo(s). Tem que bater.`);
      else if (exemplos[0].some((v) => !String(v ?? '').trim()))
        erros.push('há exemplo vazio no BODY. A Meta reprova exemplo em branco.');
    }

    const semEspaco = texto.trim();
    if (/^\{\{\s*\d+\s*\}\}/.test(semEspaco))
      avisos.push('BODY começa com variável — motivo clássico de reprovação. Ponha texto antes.');
    if (/\{\{\s*\d+\s*\}\}$/.test(semEspaco))
      avisos.push('BODY termina com variável — motivo clássico de reprovação. Ponha texto depois.');
    if (/\}\}\s*\{\{/.test(texto))
      avisos.push('há duas variáveis coladas. A Meta costuma reprovar: separe com texto.');
    if (semEspaco.length < 10) avisos.push('BODY muito curto — tende a reprovar por falta de contexto.');
    if (/\n{3,}/.test(texto)) avisos.push('há 3+ quebras de linha seguidas; a Meta reprova por formatação.');
  }

  // --- HEADER
  if (header) {
    const formato = (header.format ?? 'TEXT').toUpperCase();
    if (formato === 'TEXT') {
      const texto = header.text ?? '';
      if (!texto.trim()) erros.push('HEADER TEXT está vazio.');
      if (texto.length > LIMITES.header)
        erros.push(`HEADER tem ${texto.length} caracteres; o limite é ${LIMITES.header}.`);
      const vars = variaveis(texto);
      if (vars.length > 1) erros.push('HEADER aceita no máximo UMA variável.');
      if (vars.length === 1 && !header.example?.header_text?.length)
        erros.push('HEADER tem variável, então precisa de "example": { "header_text": ["..."] }.');
    } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(formato)) {
      if (!header.example?.header_handle?.length)
        erros.push(`HEADER ${formato} precisa de "example": { "header_handle": ["<handle da Resumable Upload API>"] }.`);
    } else if (formato !== 'LOCATION') {
      erros.push(`HEADER "format" inválido: ${formato}. Use TEXT, IMAGE, VIDEO, DOCUMENT ou LOCATION.`);
    }
  }

  // --- FOOTER
  if (footer) {
    const texto = footer.text ?? '';
    if (texto.length > LIMITES.footer)
      erros.push(`FOOTER tem ${texto.length} caracteres; o limite é ${LIMITES.footer}.`);
    if (variaveis(texto).length) erros.push('FOOTER não aceita variável.');
  }

  // --- BUTTONS
  if (botoes) {
    const lista = Array.isArray(botoes.buttons) ? botoes.buttons : [];
    if (!lista.length) erros.push('BUTTONS foi declarado mas está sem botões.');
    if (lista.length > LIMITES.botoes)
      erros.push(`há ${lista.length} botões; o limite é ${LIMITES.botoes}.`);

    const tipos = lista.map((b) => b.type?.toUpperCase());
    if (tipos.filter((t) => t === 'PHONE_NUMBER').length > 1)
      erros.push('só é permitido UM botão PHONE_NUMBER.');
    if (tipos.filter((t) => t === 'URL').length > 2) erros.push('no máximo DOIS botões URL.');

    lista.forEach((b, i) => {
      const tipo = b.type?.toUpperCase();
      if (!b.text?.trim()) erros.push(`botão ${i + 1} está sem "text".`);
      else if (b.text.length > 25) erros.push(`botão ${i + 1}: "text" passa de 25 caracteres.`);
      if (tipo === 'URL' && !b.url) erros.push(`botão ${i + 1} é URL mas não tem "url".`);
      if (tipo === 'PHONE_NUMBER' && !b.phone_number)
        erros.push(`botão ${i + 1} é PHONE_NUMBER mas não tem "phone_number".`);
      if (tipo === 'URL' && b.url && variaveis(b.url).length && !/\{\{\s*1\s*\}\}\s*$/.test(b.url))
        erros.push(`botão ${i + 1}: variável em URL só é aceita no FIM da URL.`);
      if (!['QUICK_REPLY', 'URL', 'PHONE_NUMBER', 'COPY_CODE', 'FLOW'].includes(tipo))
        avisos.push(`botão ${i + 1}: tipo "${b.type}" não é dos comuns — confira a doc.`);
    });

    const misturado = tipos.includes('QUICK_REPLY') && tipos.some((t) => ['URL', 'PHONE_NUMBER'].includes(t));
    if (misturado) {
      const primeiroCta = tipos.findIndex((t) => ['URL', 'PHONE_NUMBER'].includes(t));
      const ultimoQr = tipos.lastIndexOf('QUICK_REPLY');
      if (ultimoQr > primeiroCta)
        avisos.push('QUICK_REPLY e botões de ação não podem ficar intercalados — agrupe cada tipo.');
    }
  }

  const carrossel = porTipo('CAROUSEL')[0];
  if (carrossel) validarCarrossel(carrossel, comps, erros, avisos);

  if (t.category === 'MARKETING' && !botoes && !carrossel)
    avisos.push('template MARKETING sem botão de opt-out ("Parar promoções") tende a reprovar.');
  if (t.category === 'AUTHENTICATION')
    avisos.push('AUTHENTICATION usa estrutura própria (add_security_recommendation, code_expiration_minutes). Este validador cobre só o básico — confira a doc.');

  return { erros, avisos };
}

function imprimirValidacao({ erros, avisos }) {
  for (const e of erros) console.log(`   ❌ ${e}`);
  for (const a of avisos) console.log(`   ⚠️  ${a}`);
  if (!erros.length && !avisos.length) console.log('   ✅ nada a apontar.');
  console.log('');
}

function lerJson(caminho) {
  try {
    return JSON.parse(readFileSync(caminho, 'utf8'));
  } catch (e) {
    console.error(`\n❌ Não consegui ler o JSON "${caminho}": ${e.message}\n`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------- exibição

const ICONE = { APPROVED: '🟢', PENDING: '🟡', REJECTED: '🔴', PAUSED: '⏸️', DISABLED: '⛔' };

function montarTexto(componentes = []) {
  const linhas = [];
  for (const c of componentes) {
    const tipo = c.type?.toUpperCase();
    if (tipo === 'HEADER') {
      const formato = (c.format ?? 'TEXT').toUpperCase();
      linhas.push(formato === 'TEXT' ? `   ┃ *${c.text}*` : `   ┃ [${formato}]`);
    } else if (tipo === 'BODY') {
      for (const l of (c.text ?? '').split('\n')) linhas.push(`   ┃ ${l}`);
    } else if (tipo === 'FOOTER') {
      linhas.push(`   ┃ ${c.text}`);
    } else if (tipo === 'BUTTONS') {
      for (const b of c.buttons ?? []) {
        const extra = b.url ? ` → ${b.url}` : b.phone_number ? ` → ${b.phone_number}` : '';
        linhas.push(`   ┃ [ ${b.text} ]${extra}`);
      }
    } else if (tipo === 'CAROUSEL') {
      // Os cards são um template dentro do template: recursão, com a lateral
      // recuada pra deixar claro que aquilo é o que se arrasta pro lado.
      (c.cards ?? []).forEach((card, i) => {
        linhas.push(`   ┃`);
        linhas.push(`   ┃ ── card ${i + 1} de ${c.cards.length} ${'─'.repeat(20)}`);
        for (const l of montarTexto(card.components ?? []).split('\n')) {
          linhas.push(l.replace('   ┃ ', '   ┃   '));
        }
      });
    }
  }
  return linhas.join('\n');
}

// ---------------------------------------------------------------- comandos

const env = carregarEnv(typeof flags.env === 'string' ? flags.env : undefined);

/** Busca um template pelo nome. Devolve o primeiro idioma achado. */
async function buscarPorNome(nome) {
  const r = await get(`${env.WABA_ID}/message_templates?name=${encodeURIComponent(nome)}&limit=50`, env);
  if (!relatar(r)) process.exit(1);
  const achados = r.json?.data ?? [];
  if (!achados.length) {
    console.log(`\n❌ Nenhum template chamado "${nome}" nesta WABA.\n`);
    process.exit(1);
  }
  return achados;
}

switch (comando) {
  case 'listar': {
    exigir(env, ['WA_TOKEN', 'WABA_ID']);
    const filtro = arg1?.toUpperCase();
    console.log(`\n📋 Templates da WABA ${env.WABA_ID}${filtro ? ` (status ${filtro})` : ''}...\n`);

    const campos = 'name,status,category,language,quality_score,rejected_reason';
    let caminho = `${env.WABA_ID}/message_templates?fields=${campos}&limit=100`;
    if (filtro) caminho += `&status=${filtro}`;

    const todos = [];
    let cursor;
    do {
      const r = await get(cursor ? `${caminho}&after=${cursor}` : caminho, env);
      if (!relatar(r)) process.exit(1);
      todos.push(...(r.json?.data ?? []));
      cursor = r.json?.paging?.cursors?.after && r.json?.paging?.next ? r.json.paging.cursors.after : null;
    } while (cursor);

    if (!todos.length) {
      console.log('   (nenhum template)\n');
      break;
    }
    for (const t of todos) {
      const q = t.quality_score?.score;
      console.log(
        `${ICONE[t.status] ?? '  '} ${t.name}` +
          `\n     ${t.status} · ${t.category} · ${t.language}${q ? ` · qualidade ${q}` : ''}`,
      );
      if (t.rejected_reason && t.rejected_reason !== 'NONE')
        console.log(`     motivo da reprovação: ${t.rejected_reason}`);
    }
    console.log(`\n   ${todos.length} template(s).\n`);
    break;
  }

  case 'ver': {
    exigir(env, ['WA_TOKEN', 'WABA_ID']);
    if (!arg1) {
      console.error('❌ Informe o nome do template.');
      process.exit(1);
    }
    const achados = await buscarPorNome(arg1);
    for (const t of achados) {
      console.log(`\n${ICONE[t.status] ?? ''} ${t.name} · ${t.language} · ${t.category} · ${t.status}`);
      if (t.rejected_reason && t.rejected_reason !== 'NONE')
        console.log(`   motivo da reprovação: ${t.rejected_reason}`);
      console.log(`   id: ${t.id}\n`);
      console.log('   Como chega no chat:');
      console.log(montarTexto(t.components));
      const vars = variaveis(t.components?.find((c) => c.type === 'BODY')?.text ?? '');
      if (vars.length) console.log(`\n   ⚙️  precisa de ${new Set(vars).size} parâmetro(s) no envio.`);
    }
    console.log('');
    break;
  }

  case 'modelo': {
    const destino = arg1 ?? 'template-novo.json';
    const exemplo = {
      name: 'confirmacao_pedido',
      language: 'pt_BR',
      category: 'UTILITY',
      components: [
        { type: 'HEADER', format: 'TEXT', text: 'Seu pedido foi confirmado' },
        {
          type: 'BODY',
          text: 'Olá, {{1}}! Recebemos seu pedido {{2}} e ele já está em separação. Avisamos aqui quando sair para entrega.',
          example: { body_text: [['Maria', '10482']] },
        },
        { type: 'FOOTER', text: 'Nome da sua empresa' },
        { type: 'BUTTONS', buttons: [{ type: 'QUICK_REPLY', text: 'Acompanhar pedido' }] },
      ],
    };
    writeFileSync(destino, JSON.stringify(exemplo, null, 2) + '\n', 'utf8');
    console.log(`\n✅ Modelo gravado em ${destino}`);
    console.log('   Edite e rode: node templates.mjs validar ' + destino + '\n');
    break;
  }

  case 'validar': {
    if (!arg1) {
      console.error('❌ Informe o arquivo JSON.');
      process.exit(1);
    }
    const t = lerJson(arg1);
    console.log(`\n🔍 Conferindo ${arg1} (nada é enviado à Meta):\n`);
    const r = validar(t);
    imprimirValidacao(r);
    console.log('   Como vai chegar no chat:');
    console.log(montarTexto(t.components));
    console.log('');
    process.exit(r.erros.length ? 1 : 0);
    break;
  }

  case 'criar': {
    exigir(env, ['WA_TOKEN', 'WABA_ID']);
    if (!arg1) {
      console.error('❌ Informe o arquivo JSON. Gere um com: node templates.mjs modelo novo.json');
      process.exit(1);
    }
    const t = lerJson(arg1);
    console.log(`\n🔍 Conferindo antes de enviar:\n`);
    const v = validar(t);
    imprimirValidacao(v);
    if (v.erros.length) {
      console.log('   Não enviei nada. Corrija os ❌ acima.\n');
      process.exit(1);
    }
    if (v.avisos.length && !flags.confirmar) {
      console.log('   Há avisos. Se quiser mandar assim mesmo, repita com --confirmar\n');
      process.exit(1);
    }
    console.log(`📤 Criando "${t.name}" (${t.language}, ${t.category}) na WABA ${env.WABA_ID}...`);
    const r = await post(`${env.WABA_ID}/message_templates`, env, t);
    if (relatar(r, `Template enviado. id ${r.json?.id}, status ${r.json?.status ?? 'PENDING'}.`)) {
      console.log('   A Meta revisa em minutos ou algumas horas.');
      console.log(`   Acompanhe com: node templates.mjs ver ${t.name}\n`);
    }
    break;
  }

  case 'editar': {
    exigir(env, ['WA_TOKEN', 'WABA_ID']);
    if (!arg1 || !arg2) {
      console.error('❌ Uso: node templates.mjs editar <nome> <arquivo.json>');
      process.exit(1);
    }
    const achados = await buscarPorNome(arg1);
    const alvo = achados[0];
    if (!['APPROVED', 'REJECTED'].includes(alvo.status)) {
      console.log(`\n❌ "${arg1}" está ${alvo.status}. Só dá pra editar template APPROVED ou REJECTED.\n`);
      process.exit(1);
    }
    const t = lerJson(arg2);
    console.log(`\n🔍 Conferindo a nova versão:\n`);
    const v = validar({ ...t, name: t.name ?? alvo.name, language: t.language ?? alvo.language });
    imprimirValidacao(v);
    if (v.erros.length) {
      console.log('   Não enviei nada. Corrija os ❌ acima.\n');
      process.exit(1);
    }
    if (!flags.confirmar) {
      console.log(`   Isso reenvia "${arg1}" (id ${alvo.id}) para aprovação. Repita com --confirmar\n`);
      process.exit(1);
    }
    const corpo = { components: t.components };
    if (t.category) corpo.category = t.category;
    const r = await post(alvo.id, env, corpo);
    relatar(r, `"${arg1}" atualizado e reenviado para aprovação.`);
    break;
  }

  case 'apagar': {
    exigir(env, ['WA_TOKEN', 'WABA_ID']);
    if (!arg1) {
      console.error('❌ Informe o nome do template.');
      process.exit(1);
    }
    const achados = await buscarPorNome(arg1);
    if (!flags.confirmar) {
      console.log(`\n⚠️  Isso apaga "${arg1}" em ${achados.length} idioma(s):`);
      for (const t of achados) console.log(`     · ${t.language} (${t.status})`);
      console.log('\n   É irreversível, e o nome fica bloqueado por 30 dias.');
      console.log(`   Se for isso mesmo: node templates.mjs apagar ${arg1} --confirmar\n`);
      process.exit(1);
    }
    const r = await apagar(`${env.WABA_ID}/message_templates?name=${encodeURIComponent(arg1)}`, env);
    relatar(r, `"${arg1}" apagado. O nome fica bloqueado por 30 dias.`);
    break;
  }

  default:
    console.log(`
Uso: node templates.mjs <comando> [argumentos] [--env <caminho do .env>]

  listar [STATUS]              lista os templates da WABA (filtro: APPROVED, PENDING, REJECTED...)
  ver <nome>                   mostra o template montado, como chega no chat
  modelo [arquivo.json]        gera um JSON de partida pra editar
  validar <arquivo.json>       confere as regras da Meta — NÃO envia nada
  criar <arquivo.json>         valida e manda pra aprovação
  editar <nome> <arquivo.json> troca os componentes e reenvia (--confirmar)
  apagar <nome> --confirmar    apaga em todos os idiomas (irreversível)

Precisa de WABA_ID e WA_TOKEN. Exemplo com o .env de um cliente:
  node templates.mjs listar --env ../cliente-x/.env.local
`);
}
