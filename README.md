# Kit — WhatsApp API oficial (Meta Cloud API)

Esta pasta coloca um número de WhatsApp na **API oficial da Meta**: configura o app, registra o
número, cria os templates, prepara e passa pelo **App Review** e diagnostica o que travou. Sem
intermediário, sem mensalidade de plataforma e sem risco de banimento — é o caminho oficial.

Ela serve para os dois cenários: **um número novo** só para automação, e o **número que a empresa
já usa no celular** (coexistência), que continua funcionando no aparelho enquanto a API trabalha.

## Você não precisa decorar comando nenhum

Abra o **Claude Code** (ou Codex, Cursor, Antigravity) dentro desta pasta e converse em português:

> *"me conduza pelo Caminho A, uma etapa por vez"*

A pasta se explica sozinha para o agente — é o que o `AGENTS.md` faz. Ele já sabe quais comandos
existem, quais são seguros de rodar sem perguntar, e quais travam o seu número por 72 horas se
forem rodados na hora errada.

## O que você precisa ter

| | O quê | Obrigatório? |
|---|---|---|
| 1 | Conta pessoal no Facebook | sempre |
| 2 | Portfólio comercial (BM / gerenciador de negócios) | sempre |
| 3 | Empresa com CNPJ, para a verificação do negócio | Caminho A: dá para começar sem (teto de 250 conversas/dia) · Caminho B: **obrigatório** |
| 4 | Um site com política de privacidade, termos e exclusão de dados | sempre |
| 5 | Um chip de celular sem WhatsApp instalado | Caminho A |
| 6 | Node.js 18 ou mais novo | para rodar os scripts |
| 7 | Uma ferramenta de conversas com Embedded Signup (Chatwoot numa VPS) | só no Caminho B |

## A ordem de leitura

1. **[`COMECE-AQUI.md`](COMECE-AQUI.md)** — a corrente do zero até a primeira mensagem. Comece aqui.
2. **[`docs/MANUAL-SUBIR-NUMERO.md`](docs/MANUAL-SUBIR-NUMERO.md)** — o manual completo: os dois
   caminhos, o vocabulário, o catálogo de erros e quanto custa cada conversa.
3. **[`docs/MANUAL-APP-REVIEW.md`](docs/MANUAL-APP-REVIEW.md)** — o App Review tela por tela: o
   formulário, os dois vídeos, os textos e o dia de conectar o número do cliente.
4. **[`docs/MANUAL-NUMERO-INELEGIVEL.md`](docs/MANUAL-NUMERO-INELEGIVEL.md)** — quando o número do
   cliente aparece como *inelegível* na coexistência: cada código de erro e onde se resolve.
5. **[`docs/SEQUENCIA-COEXISTENCIA.md`](docs/SEQUENCIA-COEXISTENCIA.md)** — para quem vai ligar o
   WhatsApp de um **cliente** pela coexistência: as 14 etapas na ordem (BM nova, verificação, VPS,
   app, App Review, dia da conexão), quem faz cada uma e o que trava onde.
6. `AGENTS.md` e `CLAUDE.md` — não são para você. São para o seu agente de IA.

## Os scripts

| Comando | O que faz |
|---|---|
| `node descobrir-ids.mjs` | **read-only** — com só o token do usuário do sistema, descobre o app, as contas (WABA) e os números; `--gravar` preenche o `.env.local`. Os IDs de WABA e número aparecem depois que o número está conectado |
| `node diagnostico-numero.mjs` | **read-only** — lê o estado real do número e traduz cada campo. Rode antes de qualquer coisa |
| `node registrar-numero.mjs` | as 3 etapas do registro, um comando por etapa (limite rígido: 10 tentativas / 72 h) |
| `node templates.mjs` | listar, ver, validar, criar, editar e apagar templates de mensagem |
| `node upload-midia.mjs` | sobe imagem para template (`--handle`) ou para envio (`--media`) |

Configuração: copie `.env.exemplo` para `.env.local` e preencha. **O `.env.local` nunca vai para
o git** — ele contém o token que envia mensagem em nome do seu número.

## Precisa da VPS?

O Caminho B exige uma ferramenta de conversas com o botão do Embedded Signup. Se você ainda não
tem, existe um kit no mesmo formato deste que instala Chatwoot (e n8n, e NocoDB) numa VPS do zero:
**[github.com/plasdigital/vps-kit-aluno](https://github.com/plasdigital/vps-kit-aluno)**.

---

⚠️ **Preço e política da Meta mudam a cada trimestre.** Os números deste material são de
agosto/2026. Confira na fonte oficial antes de fechar preço com cliente — e peça ao seu agente
de IA para conferir junto.
