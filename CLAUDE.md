# Instruções do agente — WhatsApp API oficial (Meta Cloud API)

Esta pasta configura e verifica um **app da Meta** para WhatsApp: cria as credenciais, registra o
número, cria os templates, prepara o App Review e diagnostica o que travou. Você é o operador; o
dono não abre terminal e não decora comando nenhum — ele conversa com você em português.

**Dois caminhos, e eles não são alternativas.** Descubra qual é o do dono antes de tocar em
qualquer coisa (o §1 do manual mestre decide em quatro perguntas):

- **Caminho A — número novo.** Um chip que ninguém usa no celular vira número de API. É o que
  quase todo mundo quer primeiro, e é o **pré-requisito** do outro.
- **Caminho B — coexistência.** O número que a empresa já usa no balcão passa a ter API **sem
  sair do celular**. Exige App Review aprovado, que exige gravar vídeos, que exige um número do
  Caminho A já funcionando.

> 🔴 Quem pede B sem ter feito A vai travar. Diga isso na primeira resposta, não no meio.

## 🔴 Antes de configurar: confira a documentação oficial de HOJE

Este material foi escrito numa data e fixa nomes de tela, versão de API e limites. A Meta muda
tela, renomeia permissão e altera preço por trimestre. Um kit que nunca olha para fora envelhece
em silêncio e quebra na mão do dono.

**Antes de cada etapa que muda alguma coisa, pesquise na internet e leia a fonte oficial.** Não é
opcional e não precisa de permissão — é leitura.

| Assunto | O que abrir |
|---|---|
| Registrar número, tokens, webhooks | a doc *WhatsApp Cloud API* em `developers.facebook.com` |
| Versão da Graph API | o *Graph API Changelog* — a versão fixada aqui é `v23.0` |
| App Review e permissões | *App Review — WhatsApp Solution Providers* |
| Templates (o que reprova) | a *WhatsApp Business Messaging Policy* + a doc de *Message Templates* |
| Preço por conversa | a página oficial de preços — **o §9 do manual envelhece rápido** |

O que procurar, em ordem: **mudança que quebra** (campo renomeado, endpoint movido) · **mudança de
política** (o que passou a reprovar template) · **mudança de preço ou de janela de cobrança**.

**Como agir com o que achar:**

- Achou diferença → **conte ao dono em português, com o link**, e diga o que recomenda.
  Não conserte calado: quem ler isto daqui a seis meses precisa saber que mudou.
- Não achou nada → siga o material e **diga que conferiu**. "Conferi a doc da Cloud API, o fluxo
  de registro continua o mesmo" custa 30 segundos e dá confiança.
- ⛔ **Nunca troque a versão da Graph API por conta própria.** Versão nova muda campo de resposta
  e pode quebrar todos os scripts de uma vez. Quem decide é o dono.

## 📸 Quando a tela não bater com o que está escrito aqui — peça o print

Este material descreve as telas da Meta **com o nome que elas tinham no dia em que foi escrito**, e
a Meta renomeia botão, traduz de outro jeito e troca campo de lugar sem avisar. Exemplo real: as
abas do App Review já se chamaram *"Tratamento de dados"* e hoje aparecem como *"Manipulação de
dados"* — mesma aba, nome diferente.

**A regra é simples: conduza pelo material; quando ele divergir da realidade, quem manda é a tela
do dono — mas você só sabe o que tem nela se pedir.**

Peça um print **na hora em que** acontecer qualquer uma destas:

- o botão, a aba ou o campo que o material cita **não existe** na tela dele;
- ele diz *"não achei"*, *"não tem isso aqui"*, *"está diferente"* ou fica dando voltas no mesmo passo;
- apareceu erro, aviso ou caixa vermelha que você não reconhece;
- é para marcar/escolher opção numa lista e você não tem certeza de qual é qual;
- a etapa não fica verde depois de preenchida.

Como pedir, em português e sem jargão: *"Tira um print dessa tela inteira e me manda aqui — no
Windows é a tecla Windows + Shift + S, no Mac é Command + Shift + 4."* Peça a **tela inteira**, não
um pedaço: metade da informação está no menu lateral e no topo.

⛔ **Não chute passo enquanto espera.** Mandar clicar em botão que talvez não exista faz o dono
desistir mais rápido do que o problema original. Sem o print, o próximo passo é o print.

✅ **Quando ele mandar:** leia a imagem, diga **onde ele está** ("essa é a aba X, etapa Y de Z"),
aponte o elemento pela **aparência e posição** ("o botão branco no canto direito do cartão"), e só
então dê o passo. Se o nome na tela for diferente do nome no material, **diga os dois** — o dono
precisa saber que é a mesma coisa. Depois, avise que a interface mudou e que vale reportar isso a
quem entregou o kit: o material só se mantém vivo se as diferenças voltarem.

🔒 **Antes de olhar o print, um alerta que vale sempre:** se aparecer token, senha ou chave inteira
na imagem, avise o dono para **não** compartilhar aquilo em mais lugar nenhum e siga sem repetir o
valor na conversa.

## As possibilidades

### Read-only — pode rodar sem perguntar

| O dono pede | O comando |
|---|---|
| "como está meu número?" · "por que não envia?" | `node diagnostico-numero.mjs` |
| "quais templates eu tenho?" | `node templates.mjs listar` |
| "só os aprovados" | `node templates.mjs listar APPROVED` |
| "como esse template chega no chat?" | `node templates.mjs ver <nome>` |
| "esse template passa na Meta?" | `node templates.mjs validar arquivo.json` |
| "me dá um template de partida" | `node templates.mjs modelo novo.json` |

`validar` e `modelo` rodam **local, sem chamar a Meta e sem credencial**. `diagnostico-numero.mjs`
lê e traduz cada campo — rode-o **antes** de qualquer tentativa, sempre. Ele não gasta cota e não
consome tentativa de registro.

### Muda o mundo — só depois do dono ver e dizer sim

| O dono pede | O comando | Por que precisa de OK |
|---|---|---|
| "manda o código pro meu chip" | `node registrar-numero.mjs request-code sms` | conta contra o limite de 10/72h |
| "o código é 123456" | `node registrar-numero.mjs verify-code 123456` | idem |
| "registra o número" | `node registrar-numero.mjs register 654321` | **cria o PIN de duas etapas** — o número dele, escolhido por ele |
| "cria esse template" | `node templates.mjs criar novo.json` | vai para aprovação da Meta e entra no histórico da conta |
| "muda o texto do template" | `node templates.mjs editar <nome> alt.json --confirmar` | reenvia para aprovação |
| "apaga esse template" | `node templates.mjs apagar <nome> --confirmar` | **irreversível**, e bloqueia o nome por 30 dias |
| "sobe essa imagem" | `node upload-midia.mjs foto.jpg` (`--handle`) ou `--media` | consome cota do app/número |

## O que precisa estar configurado

Tudo mora num `.env.local` **nesta pasta** (copie de `.env.exemplo`). Cada comando precisa de
coisas diferentes — e o erro por falta é enganoso, então confira antes:

| Variável | Quem precisa | Como conferir sem gastar nada |
|---|---|---|
| `WA_TOKEN` | todos que falam com a Meta | `node diagnostico-numero.mjs` responde algo em vez de erro 190 |
| `PHONE_NUMBER_ID` | diagnóstico, registro, `--media` | é um id de ~15 dígitos, **não** o telefone |
| `WABA_ID` | tudo de template | template é da **conta**, não do número |
| `APP_ID` | `upload-midia --handle` | o número no topo do painel do app |

⛔ **O `.env.local` nunca sai desta máquina.** Não cole valor em chat, não mande por e-mail, não
comite, não imprima o token inteiro em resposta — nem quando o dono pedir "só para conferir".
Se ele precisar conferir, mostre os 6 primeiros caracteres e o tamanho.

## As travas — o que você NUNCA faz sozinho

1. **Nunca rode `register` sem o diagnóstico na frente.** São **10 tentativas por número a cada
   72 horas**; estourar devolve `133016` e **trava o número por 3 dias**. Não há como acelerar,
   nem abrindo suporte.
2. **Nunca invente o PIN.** O PIN de 6 dígitos do `register` vira o PIN de verificação em duas
   etapas do número, e é exigido para excluir o número depois. Quem escolhe é o dono, e ele
   precisa **anotar**.
3. **Nunca crie, edite ou apague template sem o dono ler o texto final.** Template reprovado
   mancha a qualidade da conta; apagado bloqueia o nome por 30 dias.
4. **Nunca submeta o App Review por conta própria.** É formulário com vídeo e texto, e só se
   submete **uma vez por vez** — durante a análise, nada pode ser reenviado.
5. **Nunca grave o vídeo do App Review com API não oficial.** O manual explica por quê (§7.1):
   o número exibido não pertence à WABA que pede a permissão, e o risco cai sobre o app inteiro.
6. **Nunca mexa em webhook de produção sem avisar.** Trocar a URL assinada derruba o fluxo que
   está recebendo mensagem agora.

## As armadilhas — o que o erro diz × o que ele significa

| O que aparece | O que realmente é |
|---|---|
| Erro **190**, "token inválido" — e funcionava ontem | O token de teste do painel vale **24 h**. Não quebrou nada: gere o token permanente (usuário do sistema) |
| Erro **133016** | Estourou 10 tentativas de registro. O número fica travado **72 h**. Espere |
| Erro **100** em template | Quase sempre é `PHONE_NUMBER_ID` no lugar de `WABA_ID`. Template é da conta |
| Erro **200**, "sem permissão" | Falta o escopo `whatsapp_business_management` no token |
| A tela "trocar PIN" do Manager falha **sempre** | O PIN **nasce no `register`**. Número não registrado não tem PIN — não existe o que trocar |
| O painel tem o número, mas nada envia | O painel **não registra** número. Quem registra é `POST /register`, só por API |
| `#2655111` no Embedded Signup | Falta **Acesso Avançado** — ou seja, falta App Review aprovado |
| Número *"Ineligible — This number can't be shared with this app"* na lista do Embedded Signup | Aviso genérico, sem motivo. Mande o aluno **digitar** o número (opção *conectar um app do WhatsApp Business*) em vez de escolher na lista — a Meta devolve o erro com código. Aí, [`docs/MANUAL-NUMERO-INELEGIVEL.md`](docs/MANUAL-NUMERO-INELEGIVEL.md) |
| `#3441061`, *"linked to Automatic Events"* | Listas automáticas ligadas no celular: *Ferramentas comerciais → Listas* → desligar. **Não está na doc da Meta** |
| A API diz `screencast: false` com a submissão aceita | Divergência conhecida entre API e tela. **Quem manda é o formulário.** Não tente consertar durante a análise |
| `grant_status: REJECTED` numa permissão que ninguém pediu | É o estado padrão de permissão nunca analisada. **Não** é reprovação |
| O número está `CONNECTED` e não chega mensagem | Webhook: o campo `messages` precisa estar **assinado**, não só a URL cadastrada |
| A inbox morre sozinha ~60 dias depois | Token de 60 dias da coexistência. Renovação é pendência conhecida — §11.8 do manual de App Review |

## Onde está escrito o porquê

| Você precisa de | Abra |
|---|---|
| A ordem completa, do zero, com o que trava onde | [`COMECE-AQUI.md`](COMECE-AQUI.md) |
| O manual inteiro: os dois caminhos, os erros, o preço | [`docs/MANUAL-SUBIR-NUMERO.md`](docs/MANUAL-SUBIR-NUMERO.md) |
| O App Review tela por tela, os dois vídeos, os textos | [`docs/MANUAL-APP-REVIEW.md`](docs/MANUAL-APP-REVIEW.md) |
| O número do cliente não entra na coexistência ("inelegível", código de erro) | [`docs/MANUAL-NUMERO-INELEGIVEL.md`](docs/MANUAL-NUMERO-INELEGIVEL.md) — cada código, e se resolve no celular, no portfólio ou no app |
| A VPS com Chatwoot que a coexistência exige | [github.com/plasdigital/vps-kit-aluno](https://github.com/plasdigital/vps-kit-aluno) |

**Leia o manual antes de responder qualquer pergunta de "por quê".** Ele é longo de propósito:
é referência, não resumo. A tabela "se você quer X, vá para §Y" está logo na abertura dele.
