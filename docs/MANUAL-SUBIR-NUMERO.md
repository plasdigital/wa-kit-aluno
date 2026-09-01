# Subir um número no WhatsApp API oficial (Meta Cloud API) — manual mestre

> **Objetivo:** colocar um número de WhatsApp na Cloud API da Meta, seja **número novo** (registro
> direto) ou **número que a empresa já usa no celular** (coexistência), até ele enviar, receber e
> aparecer na ferramenta de atendimento.
> **Ferramentas:** os scripts `.mjs` desta pasta · `developers.facebook.com` · `business.facebook.com`
> **Entrada:** um número de telefone + uma empresa com CNPJ
> **Saída:** número `CONNECTED`, token que não expira, template aprovado, webhook entregando.
>
> **Escrito em 01/set/2026**, a partir de um caso real de agosto/2026 que percorreu os dois
> caminhos e bateu em quase todos os muros possíveis. Cada 🧱 aqui é um lugar onde alguém
> travou de verdade.
>
> ⏳ **Preço e política da Meta envelhecem rápido.** Antes de decidir qualquer coisa com base
> no §9, confira a página oficial de preços — e peça ao seu agente de IA para conferir junto.

---

## 0. Como ler isto

Este documento é longo de propósito: é a **referência única**, não um resumo. Você não lê tudo — lê a
§1, descobre qual é o seu caminho, e vai direto para ele.

| Se você quer… | Vá para |
|---|---|
| **Nunca fez isso na vida** — o que precisa existir antes | **§0.5** — a corrente do zero |
| Descobrir qual caminho seguir | **§1** — árvore de decisão |
| Entender as peças antes de mexer | **§2** e **§3** |
| Número **novo**, só para API e automação | **§5 — Caminho A** |
| Número **que a loja já usa no celular** | **§6 — Caminho B** |
| Passar pelo App Review | **§7** |
| Consertar algo que quebrou | **§8** — catálogo de erros |
| Saber o que custa | **§9** |
| Conferir se terminou | **§10** — checklists |

> **Atalho.** Abra a pasta no Claude Code e diga: *"me conduza pelo Caminho B deste manual, uma etapa
> de cada vez"*. Ele lê o guia, roda o diagnóstico, interpreta o retorno da Meta e só avança quando o
> checkpoint passa. É mais rápido do que decifrar erro da Meta sozinho.

---

## 0.5 — A corrente do zero: o que precisa existir antes de escolher o caminho

> Esta seção existe para quem **nunca fez isso na vida**. Se você já opera na Meta, pule para o §1.
> Ela lista **até o passo óbvio de propósito** — é mais barato pular uma linha do que descobrir no
> meio que faltava uma conta.

### Antes da corrente: de quem é o aplicativo na Meta?

Existem **duas formas** de falar com a API oficial — e o que separa uma da outra **não é a
ferramenta**, é **de quem é o app registrado na Meta**.

| | **O app é da ferramenta** | **O app é seu** |
|---|---|---|
| Como se faz | contrata e clica em *conectar* | este manual inteiro |
| Quem aparece para a Meta | a ferramenta | você |
| Exemplos | ManyChat, Wati, 360dialog, Twilio, Take Blip | Chatwoot na VPS, n8n, código próprio |
| Preço da mensagem | o da Meta **+ a margem deles** | o da Meta |
| Acesso à API crua | só o que a ferramenta expõe | tudo |
| Trocar de ferramenta depois | dói | é trocar o token |

**A mesma ferramenta pode estar dos dois lados** — e é por isso que a pergunta certa nunca é *"qual
ferramenta?"*. O **Chatwoot** é o exemplo: contratado na nuvem deles, o app é deles; instalado numa
VPS, você leva `APP_ID`, `APP_SECRET`, `CONFIGURATION_ID` e o token — o app é **seu**, e você caiu
neste manual.

> ⚠️ **Confira na fonte antes de decidir com base nisso:** se o Chatwoot Cloud ainda exige que você traga as
> suas próprias credenciais, ele **não** é exemplo da coluna da esquerda — é a coluna da direita
> hospedada por eles, e o exemplo limpo de "app da ferramenta" passa a ser o ManyChat.

> 🎓 Quem termina este manual **vira a coluna da esquerda para o próprio cliente**: é exatamente o
> Caminho B (§6) — app da agência, número do cliente.

**Daqui em diante, o manual trata só da coluna da direita.**

Legenda: *(óbvio)* = quase todo mundo já tem · 🧱 = onde a pessoa trava · ⏯️ = assunto grande o
bastante para virar vídeo/tutorial separado.

| # | O que | O que é, para quem nunca viu | Obrigatório? | Se faltar | |
|---|---|---|---|---|---|
| 1 | **Conta pessoal no Facebook** | o perfil comum, de pessoa física — a Meta amarra tudo a uma pessoa | **sempre** *(óbvio)* | não dá para criar portfólio nem app | |
| 2 | **Portfólio comercial** (a "BM") | a empresa dentro da Meta, que guarda apps, contas e a fatura — **não é a Página do Facebook** | **sempre** | não existe app, não existe WABA, não existe número | ⏯️ |
| 3 | **App no Meta for Developers** | a integração: permissões, domínios, webhooks | **sempre** | sem token, sem API | ⏯️ |
| 4 | **Verificação do negócio** | a Meta conferindo CNPJ e documentos do portfólio | **depende do caminho** ⬇️ | **A:** funciona, com teto de **250 conversas/dia** e **2 números por portfólio** (20 depois de verificar) · **B:** trava o App Review, e sem App Review não há coexistência | ⏯️ |
| 5 | **Ferramenta de atendimento** | a tela onde as conversas aparecem e de onde se responde | **sempre**, por motivos diferentes ⬇️ | **A:** o número sai do celular — sem inbox, ninguém vê o que chega · **B:** é ela que abre o Embedded Signup; sem ela não existe coexistência | 🧱 ⏯️ |

```
1. conta pessoal do Facebook ─┐
2. portfólio comercial (BM)   │
3. app no Meta for Developers ├── existe antes de qualquer caminho
4. verificação do negócio     │   (4 e 5 começam no dia 1, em paralelo)
5. ferramenta de atendimento ─┘
        │
        └──► §1 — árvore de decisão (Caminho A ou Caminho B)
```

**Os insumos técnicos** — chip num aparelho ligado, Node.js, cartão internacional, URL HTTPS,
políticas publicadas — estão no **§4**. Esta seção trata só das **contas e estruturas**, que são o
que ninguém imagina que precisa antes de começar.

### As três coisas que quase todo mundo entende errado aqui

**A verificação do negócio não é obrigatória sempre.** É o engano mais comum, e ele vai nas duas
direções. No **Caminho A** você monta tudo, registra o número e envia template **sem ela** — o que
você ganha ao verificar é sair do teto de 250 conversas iniciadas por dia (§A1). No **Caminho B**
ela é **pré-requisito duro**: a própria API lista `business_verification_passes: true` como
condição para submeter o App Review (§7.3). Em ambos os casos, **comece a verificação no primeiro
dia** — ela demora dias e não impede o resto de andar.

**No Caminho B são dois portfólios, não um.** O app é da **agência**; a WABA, o número e o
histórico são do **cliente**. Isso não é preferência, é desenho da Meta: se o portfólio dono do app
for o mesmo do cliente, o Embedded Signup exibe o portfólio dele **desabilitado**, com a etiqueta
*"This Meta Business Account owns the app"*, e não há ajuste que resolva (§3.3). Descobrir isso
depois custa semanas.

**Página do Facebook não entra nessa lista.** Não é pré-requisito de nada aqui. O que o App Review
pede em termos de "endereço público" são **três URLs em HTTPS válido** — privacidade, termos e
exclusão de dados — mais ícone e categoria no app (§6.2, passo 3). Confundir portfólio comercial
com Página é o erro clássico do §2.

### 🧱 A ferramenta: o travamento que ninguém antecipa

Este é o ponto onde quem está começando do zero para, porque **a resposta é outro projeto inteiro**.

- **Caminho A** — o número deixa de abrir no celular. Se ninguém tiver uma tela de conversas, a
  mensagem que chega não é vista por humano nenhum. *Exceção honesta:* se o número for **só** para
  disparo e automação, um n8n recebendo o webhook resolve — inbox só é necessária quando existe
  atendimento humano.
- **Caminho B** — é estrutural. Quem abre o popup do Embedded Signup, recebe o `code` e troca por
  token é a **ferramenta** (§6.1). Não existe caminho manual pelo painel da Meta.

**A recomendação deste manual:** **Chatwoot**, numa **VPS sua ou do cliente** — porque a infra e
as credenciais ficam com vocês, e porque a versão 4.16.2 já faz coexistência nativamente (§6.1).
Montar essa VPS é um projeto à parte, e existe um kit pronto para ela, no mesmo formato deste:
[github.com/plasdigital/vps-kit-aluno](https://github.com/plasdigital/vps-kit-aluno) ⏯️.

### O mapa inteiro numa tela

Este é o desenho que serve de slide: a decisão de topo, o bloco comum e as duas pontas.

```
                    +----------------------------------+
                    |  CONECTAR NA API OFICIAL         |
                    |  de quem é o APP na Meta?        |
                    +----------------+-----------------+
              +----------------------+----------------------+
              v                                             v
  +------------------------+              +---------------------------+
  | DA FERRAMENTA          |              | MEU - sou o desenvolvedor |
  | ManyChat, Wati,        |              | (o resto deste manual)    |
  | 360dialog, Twilio      |              +-------------+-------------+
  +------------------------+                            |
  | contrata -> conecta    |      BLOCO COMUM (todo mundo faz)
  | número novo OU         |      1. conta pessoal no Facebook  (óbvio)
  | existente, lá dentro   |      2. portfólio comercial (a "BM")
  +------------------------+      3. app no Meta for Developers
  | ✅ zero configuração    |      4. publicar o app -> 3 URLs + ícone + categoria
  | ❌ preço com margem     |      🧱 ferramenta de atendimento (Chatwoot/n8n/própria)
  | ❌ sem API crua         |      💳 cartão - SÓ para iniciar conversa
  | ❌ preso à ferramenta   |      ⭐ verificação do negócio - começa no dia 1
  +------------------------+         sem ela: 2 números · com ela: 20
                                             |
                        +--------------------+--------------------+
                        v                                         v
              NÚMERO NOVO (§5)                        WHATSAPP QUE JÁ EXISTE (§6)
      +-----------------------------+         +----------------------------------+
      | adicionar o número          |         | ⭐ verificação do negócio         |
      |   -> SMS confirma a POSSE   |         |    OBRIGATÓRIA aqui              |
      | 🔑 token                     |         | Facebook Login for Business      |
      | 🎯 REGISTRAR                 |         | App Review (permissões WhatsApp) |
      |   POST /register + PIN      |         |   ⏳ o gargalo: dias de espera    |
      | 📡 webhook (receber)         |         | Embedded Signup pela ferramenta  |
      | 🔗 ferramenta de atendimento |         | 📡 webhook + smb_message_echoes  |
      | ✅ enviar a 1ª mensagem      |         | ✅ enviar a 1ª mensagem           |
      +-----------------------------+         +----------------------------------+
```

**Três nomes que se parecem e não são a mesma coisa** — vale dizer em voz alta antes de mostrar o
mapa, porque é onde todo mundo se perde:

| Nome | O que é |
|---|---|
| **Verificação do negócio** | a Meta conferindo o CNPJ do portfólio |
| **App Review** | a Meta liberando as permissões do app (só o Caminho B) |
| **Publicar o app** | ligar a chave de *Em desenvolvimento* → *Ativo* (não é revisão) |

E dentro do Caminho A, mais duas:

| Nome | O que é |
|---|---|
| **Adicionar o número** | o SMS/ligação que prova a **posse** do telefone — feito no painel |
| **Registrar o número** | `POST /{PHONE_NUMBER_ID}/register` com o PIN — **só por API** (§3.1) |

### ⚠️ O Caminho B não é alternativa ao A — ele depende do A

O mapa acima mostra os dois caminhos lado a lado, mas existe uma seta entre eles que quase ninguém
enxerga a tempo: **para submeter o App Review (§7) você precisa gravar um vídeo do seu app enviando
mensagem e o destinatário recebendo** — e, para isso, precisa de **um número seu já funcionando na
API**.

Como admin do app você tem **Acesso Padrão** (§3.2), que serve justamente para operar os ativos que
você mesmo administra. Então a sequência é:

```
Caminho A (número seu)  ──►  material do App Review  ──►  Caminho B (número do cliente)
```

Isso dá **três motivos** para subir um número novo, não um:

1. disparo e automação, sem tirar o WhatsApp do celular de ninguém;
2. **gravar os dois screencasts do App Review** (§7.1);
3. percorrer o processo inteiro sem risco num número de cliente.

> **No caso real foi exatamente assim:** o número novo subiu pelo Caminho A, e o número que a
> loja já usava no balcão foi pelo B. Não foi acaso — é a ordem que a dependência impõe.

🎓 **Se você está aprendendo isto:** o Caminho A não é o "caminho alternativo", é o **passo 1**.
Quem tenta começar pela coexistência trava no App Review sem ter o que filmar.


---

## 1. Qual dos dois caminhos é o seu

Primeira decisão, e ela muda **tudo**: prazo, custo, quem precisa ser aprovado pela Meta e o que a
empresa mantém ou perde.

```
O número que vai para a API já está em uso num celular hoje?
│
├── NÃO — chip novo, ou número que ninguém usa no WhatsApp
│   │
│   └──► CAMINHO A — Registro direto (§5)
│        • Você faz sozinho, sem depender de aprovação da Meta
│        • 1 a 2 h de trabalho + a espera da verificação do negócio
│        • O número passa a existir SÓ via API (não abre mais no celular)
│        • Throughput até 80 msg/s
│
└── SIM — é o WhatsApp que a empresa usa, que está impresso,
    │     salvo na agenda dos clientes, aberto no balcão
    │
    └──► CAMINHO B — Coexistência (§6)
         • Exige App Review aprovado (10 dias no caso real; a Meta promete até 20)
         • O número continua no celular E entra na API
         • O atendente segue respondendo pelo app; o que sai do app não é cobrado
         • Throughput travado em 20 msg/s
         • Precisa de app de Tech Provider — que NÃO pode ser do portfólio do cliente (§3.3)
```

### O erro de decisão mais caro

Escolher o Caminho A para o número principal da empresa. **Registrar direto tira o WhatsApp do
celular** — o app para de funcionar e o histórico fica fora de alcance de quem atende. Numa loja,
loja ou consultório onde a pessoa responde entre um cliente e outro, isso é inaceitável, e a
descoberta costuma vir tarde demais.

### O outro lado: escolher o Caminho B sem precisar

O erro acima é o mais caro, mas o inverso é o mais comum: pedir coexistência por um número que
ninguém conhece ainda. **Número novo tem mais liberdade dentro da Meta**, e a diferença é grande:

| | Número novo (A) | Coexistência (B) |
|---|---|---|
| Throughput | **80 msg/s** | 20 msg/s, fixo |
| App Review | não precisa | obrigatório — dias de espera |
| Listas de transmissão | — | ❌ desativadas (as existentes viram só leitura) |
| Temporárias / ver uma vez / localização ao vivo | — | ❌ desativadas |
| Dispositivos vinculados | — | ❌ todos desvinculados; WhatsApp Web tem que religar |
| Grupos | — | continuam no app, **não** sincronizam com a API |
| Catálogo, etiquetas, respostas rápidas, Canais | — | continuam no app, sem suporte na API |

*(A lista completa do que a loja perde está no §6.0; os motivos econômicos do B, logo abaixo dela.)*

**A regra que fecha os dois lados:** o **Caminho A é a escolha padrão**; a coexistência é a
**exceção que se paga** quando o número já tem valor de mercado — está impresso, divulgado, salvo na
agenda dos clientes. Aí o que se ganha (o celular continua funcionando, e o que a atendente responde
por ele não é cobrado) compensa tudo que a tabela acima cobra.

**A regra:** número que o cliente já conhece → **Caminho B**. Número novo, criado para disparo e
automação → **Caminho A**. Os dois convivem na mesma operação: no caso real, o número novo (para
disparo) subiu pelo A, e o número que a loja já usava foi pelo B.

---

## 2. O vocabulário mínimo — quem é quem

Metade dos travamentos é confusão entre estas peças. Elas se parecem, têm nomes parecidos, e a Meta
troca o nome delas de tempos em tempos.

| Peça | O que é | Nome que a Meta usa hoje | Erro clássico |
|---|---|---|---|
| **Portfólio comercial** | a empresa dentro da Meta; guarda contas, páginas, apps | *Portfólio comercial* (já foi *Business Manager*) | achar que é a Página do Facebook |
| **App** | a integração; guarda permissões, domínios, webhooks | *App*, em `developers.facebook.com` | achar que precisa de um app por cliente |
| **WABA** | a conta de WhatsApp; agrupa números, templates e a fatura | *WhatsApp Business Account* | achar que é o número |
| **Número** | o telefone em si, dentro de uma WABA | *Phone number* | ver a linha abaixo ⬇️ |
| **`PHONE_NUMBER_ID`** | o **ID** do número — inteiro longo gerado pela Meta | *Identificação do número de telefone* | **colar o telefone aqui** → erro `100` |
| **Token** | a credencial que autentica as chamadas | *Token de acesso* | usar o temporário de 24 h em produção |
| **Webhook** | a URL para onde a Meta manda o que chega | *Webhook / URL de callback* | verificar a URL e esquecer de assinar o campo |
| **Template** | mensagem pré-aprovada; única forma de iniciar conversa | *Modelo de mensagem* | categoria errada = reprovação **e** preço errado |

### Quem é dono de quê — a tabela que resolve a discussão com o cliente

| Ativo | De quem é | Muda de dono depois? |
|---|---|---|
| App Meta (Tech Provider) | **da agência** | ⚠️ tecnicamente sim, mas quebra o App Review — §3.3 |
| WABA | **do cliente** | ❌ **não.** *"You cannot migrate a WABA from one business to another"* |
| Número | **do cliente**, dentro da WABA dele | só saindo e refazendo |
| Templates | **do cliente**, nascem na WABA | ❌ não migram entre WABAs |
| Conversas e histórico | **do cliente** | — |
| Chatwoot / VPS | **do cliente** | — |
| `config_id` (configuração de login) | **da agência**, vive no app | — |

> **Isto não fere a regra "infra e credencial são do cliente".** VPS, Chatwoot, WABA, número e
> conversas seguem 100% do cliente. O que é da agência é o **papel de provedor**, que por definição
> não pode ser do cliente — quem tenta, trava (§3.3).
>
> A documentação do Embedded Signup é explícita a favor do cliente:
> *"Business customers onboarded via Embedded Signup **own all of their WhatsApp assets** […] Business
> customers also have full access to WhatsApp Manager. Note that you cannot restrict this access in
> any way."*

---

## 3. As três verdades que economizam um dia de trabalho

Nenhuma das três está escrita com todas as letras na documentação da Meta. Todas as três já custaram
tempo real.

### 3.1 — O painel da Meta **não registra número**. Nunca registrou.

No WhatsApp Manager existe uma tela de verificação em duas etapas. Você abre, ela pede o **PIN
atual**, você não tem PIN nenhum, e ela responde *"The PIN could not be changed"*. Você tenta de
novo, com outro PIN, em outro navegador. **Não é o seu PIN que está errado.**

O painel serve para **adicionar** e **verificar a posse** de um número. Quem **registra** o número
para a Cloud API é uma chamada de API:

```
POST /{PHONE_NUMBER_ID}/register
```

Não existe botão para isso. E o PIN de duas etapas **nasce nessa chamada** — número não registrado
não tem PIN, então a tela "trocar PIN" falha para sempre, por definição.

> É por isso que este processo usa scripts em vez de prints de tela.

### 3.2 — Ser admin do app dá **Acesso Padrão**. Embedded Signup exige **Acesso Avançado**.

| | Acesso Padrão | Acesso Avançado |
|---|---|---|
| Como se obtém | automático em app do tipo *Business* | **só com App Review aprovado** |
| Serve para | operar **os ativos que você mesmo administra** | operar ativos **de terceiros** |
| Exemplo | registrar e usar o seu próprio número (Caminho A) | conectar número de cliente por Embedded Signup |

A frase da doc que fecha a questão: *"If Advanced access is not approved for a given permission, the
permission does not appear in the Embedded Signup flow and your clients cannot grant it to your app."*

Sem isso, o Embedded Signup devolve:

> **#2655111** — *O app do parceiro não tem as permissões de mensagens e Gerenciamento do WhatsApp
> Business avançadas que são necessárias para a integração. Peça essas permissões por meio do
> processo de análise do app.*

**A regra:** papel no app não substitui App Review — nem quando o app, o negócio e o número são todos
seus.

### 3.3 — O dono do app **não pode ser o cliente**

Esta travou a coexistência do caso real por duas semanas, **mesmo com o App Review aprovado**.

Com Acesso Avançado no bolso, o Embedded Signup abre normal. Só que, na tela de escolher o portfólio
do cliente, o portfólio dele aparece **desabilitado**, com a etiqueta:

> *"This Meta Business Account owns the app"*

Nenhum ajuste de permissão, verificação ou papel resolve. **É por desenho.** O Embedded Signup roda
sobre o Facebook Login for Business, que é um **ato de concessão entre duas partes distintas**: uma
empresa autoriza o app de **outra** empresa.

> *"To serve businesses that **you do not own or manage**, your app must be approved for Advanced
> Access via Meta's App Review."*

Quando o portfólio já é dono do app, não existe o que conceder — ele já tem acesso por propriedade.
Não há "cliente" do outro lado da mesa.

**O desenho certo:**

| Papel | Quem | Fica com |
|---|---|---|
| **Tech Provider** (dono do app) | **a agência** | o app, o `config_id`, o App Review |
| **Cliente** | **a empresa atendida** | a WABA, o número, os templates, o histórico |

> **Como se descobre isso em 5 minutos:** rode o mesmo fluxo escolhendo **o portfólio da própria
> agência** como cliente. Se funcionar inteiro — foi o que aconteceu no caso real em 31/ago —, o app e o
> fluxo estão certos; estavam apenas do lado errado da mesa.

⚠️ **Não transfira o app para consertar isso.** O procedimento de transferência **começa removendo a
verificação do app**, e verificação é pré-requisito do App Review. A Meta não garante em lugar nenhum
que o Acesso Avançado sobrevive. Se não sobreviver, cai a operação inteira de uma vez, com cliente no
ar. App Review novo custa **tempo**; transferência custa **risco sobre operação viva**.

⚠️ **Não conecte o número na BM da agência "para migrar depois".** WABA não migra entre empresas.
Conectou na BM errada, é refazer do zero.

---

## 4. Antes de começar — o que precisa estar na mão

| # | O quê | Por quê | Dá pra começar sem? |
|---|---|---|---|
| 1 | **CNPJ e documentos da empresa** | a verificação do negócio exige | começa sem, mas trava em 250 conversas/dia |
| 2 | **O número de telefone** | vira o canal | ❌ |
| 3 | **O chip nesse número, num aparelho ligado** | recebe o código | ❌ |
| 4 | **Cartão internacional** ou linha de crédito | **só para mensagem que a empresa inicia** (template/disparo) — o próprio painel escreve *“Add payment to send business-initiated messages”*. Receber e responder dentro da janela de 24 h não depende dele | ✅ dá pra montar o número inteiro sem |
| 5 | **Node.js 18+** | rodar os scripts (`node --version`) | ❌ |
| 6 | **URL pública HTTPS** (n8n ou Chatwoot) | receber o webhook | só na etapa do webhook |
| 7 | *(Caminho B)* **App WhatsApp Business ≥ 2.24.17** no celular | versão antiga trava o fluxo no meio | ❌ |
| 8 | *(Caminho B)* **Políticas em HTTPS válido** — privacidade, termos, exclusão de dados | pré-requisito do App Review | ❌ |

> ⚠️ **Caminho A: o número não pode estar em uso no WhatsApp.** Nem no app comum, nem no Business. Se
> estiver, apague a conta **dentro do app** (Configurações → Conta → Apagar minha conta) e espere
> alguns minutos. Chip de operadora funciona; número virtual/VoIP costuma ser recusado.

### As duas ferramentas, e por que uma não substitui a outra

| | **MCP `meta-devtools`** | **Os scripts do núcleo** |
|---|---|---|
| O que é | o painel do app, dentro da IA | chamadas diretas à Graph API |
| Serve para | ver configuração, webhooks, App Review, limites de uso | **fazer as coisas acontecerem** |
| Registra número | ❌ | ✅ |
| Cria template | ❌ | ✅ |
| Lê a config do app | ✅ | ❌ |
| Assina webhook | ✅ (é a única escrita dele) | ❌ |

**O MCP vê, o script faz.** Você quer os dois; nenhum sozinho resolve.

```bash
claude mcp add --transport http meta-devtools https://mcp.facebook.com/devtools --scope user
```

Depois `/mcp` → `meta-devtools` → **Authenticate**. A permissão é **por app**: app que você não
marcar na tela de consentimento não aparece para a IA — e sumir dali não quer dizer que não existe. A
sessão não sobrevive a reinícios do Claude Code; reautenticar é normal.

---

# §5 · CAMINHO A — Número novo, registro direto

**Quando:** chip novo, número dedicado à API, disparo e automação.
**Tempo:** 1 a 2 h de trabalho + espera da verificação do negócio (dias) e do template (minutos a horas).
**Não precisa de App Review.**

### A ordem do painel da Meta × a ordem que funciona

O painel (*Use cases → Customize*) sugere uma ordem que **não é a melhor para quem vai direto para
produção**. Ele abre num *"Try it out"* com número de teste e manda configurar o webhook antes de o
número existir de verdade.

| # | O painel sugere | A ordem daqui |
|---|---|---|
| 1 | *Try it out* (número de teste da Meta) | **pular** — ou usar só para ver funcionando uma vez |
| 2 | Configure Webhooks | 🔑 **token** (A4) — sem ele nem o registro roda |
| 3 | Register your phone number | 🎯 **registrar** (A5) — o passo que pode falhar |
| 4 | Add payment | 📡 **webhook** (A8) — agora dá para testar de verdade |
| 5 | Send message | 💳 **pagamento** — só se for iniciar conversa |
| 6 | *(Step 3)* Business verification | ✅ **enviar a primeira mensagem** — a prova |

**Por que trocar:** cada passo desta ordem tem um sinal próprio de que deu certo. Webhook
configurado antes do número registrado é configuração no vazio — não há o que testar, e você não
descobre se errou. A Meta ordena assim porque assume que você veio do número de teste.

**A exceção honesta:** o **template** (A6) se submete cedo, porque espera aprovação. O que fica por
último é o **envio**, não a criação.

**Cuidado com a palavra "token" nesta etapa:** no webhook, o *token de verificação* é uma string que
**você inventa** e repete nos dois lados. O *token de acesso* é a credencial da Meta. Mesmo nome,
naturezas opostas.

**E repare onde a Meta coloca a verificação do negócio:** no *Step 3*, depois de tudo funcionando.
É a confirmação, na própria tela, de que ela **não** bloqueia o Caminho A (§0.5).

## A1 — Portfólio da empresa e verificação

1. **business.facebook.com** → criar **portfólio comercial**.
2. Preencher nome legal, endereço, site e CNPJ — os dados **têm que bater** com os documentos.
3. **Central de Segurança** → iniciar a **verificação do negócio**.

> **Comece a verificação no primeiro dia e siga sem esperar por ela.** Leva dias e é o gargalo real,
> mas não bloqueia nada até a hora de escalar. Sem verificação você fica em **250 conversas iniciadas
> por dia** — suficiente para montar tudo e testar.

**✅ Checkpoint:** o portfólio existe e a verificação está *pendente* ou *aprovada*.

## A2 — O app no Meta for Developers

1. **developers.facebook.com** → **Meus Apps** → **Criar App**.
2. Tipo: **Negócios** (Business).
3. **Vincule o app ao portfólio** da etapa A1. *(Pular aqui custa uma volta depois.)*
4. Adicione o produto **WhatsApp**.

**✅ Checkpoint:** o app aparece em *Meus Apps* e tem "WhatsApp" na barra lateral.

## A3 — WABA, número e nome de exibição

Em **WhatsApp → Configuração da API**:

1. **Crie ou selecione a WABA.**
2. **Adicione o número.** A Meta manda código por SMS ou chamada — informe e confirme.
3. **Defina o nome de exibição.** Passa por aprovação e **não pode ser enganoso**: precisa ter
   relação com a empresa.

> Confirmar o número aqui é **confirmar a posse**, não registrar. São coisas diferentes, e é
> exatamente aqui que quase todo mundo acha que terminou. Falta a **A5**.

**✅ Checkpoint:** o número aparece na lista da WABA, mesmo que com aviso.

## A4 — As credenciais

Na mesma tela, anote três coisas:

| O que | Onde | Serve para |
|---|---|---|
| **Token de acesso temporário** | botão "Gerar" | autenticar tudo — ⏳ **vale ~24 h** |
| **Identificação do número de telefone** | abaixo do seletor de número | registrar e enviar |
| **Identificação da conta do WhatsApp Business** | mesma tela | templates |

```bash
# na raiz desta pasta
cp .env.exemplo .env.local
# preencher WA_TOKEN, PHONE_NUMBER_ID, WABA_ID
```

> ⚠️ **`PHONE_NUMBER_ID` não é o número de telefone.** É um ID numérico longo. Colar o telefone ali
> gera erro `100` e você perde tempo procurando o problema no lugar errado.
>
> O `.env.local` **nunca** é versionado. Não cole o conteúdo dele numa conversa nem dentro de um node
> do n8n — no n8n, token vira **credencial**.

**✅ Checkpoint:**

```bash
node diagnostico-numero.mjs
```

Voltou o quadro com `display_phone_number`, `status` e `code_verification_status`? Credenciais
certas. Erro `190` → token venceu. Erro `100` → confira o `PHONE_NUMBER_ID`.

## A5 — 🎯 O registro (a etapa que não tem botão)

**Primeiro o diagnóstico.** Ele não muda nada, não gasta cota, e diz se a chamada tem chance:

| Campo | Valor | Significa |
|---|---|---|
| `code_verification_status` | `VERIFIED` | posse confirmada — pode registrar |
| | `NOT_VERIFIED` | falta confirmar (comandos 1 e 2) |
| `status` | `PENDING` | **não registrado** — é o caso do `register` |
| | `CONNECTED` | 🟢 já está registrado, não faça nada |
| | `BANNED` | pare: precisa de apelação antes de qualquer coisa |

**Depois, as três etapas — uma por comando, de propósito:**

```bash
# 1. a Meta manda um código de 6 dígitos para o chip
node registrar-numero.mjs request-code sms

# 2. confirma que o número é seu
node registrar-numero.mjs verify-code 123456

# 3. registra o número E cria o PIN de duas etapas
node registrar-numero.mjs register 654321
```

**Sobre o passo 3:** o PIN de 6 dígitos **é escolhido por você, ali, naquele comando**. Não existe
PIN anterior para descobrir. É essa chamada que cria o PIN — e é por isso que a tela do Manager pedia
um PIN que nunca existiu. **Anote esse PIN**: a Meta o exige para excluir o número depois.

> ⚠️ **`register` é limitado a 10 tentativas por número a cada 72 h.** Estourou, o número trava por 3
> dias (erro `133016`) e **não há apelação**. Nunca rode `register` "só pra ver se funciona" — é
> exatamente para isso que existe o diagnóstico.

SMS não chega? `node registrar-numero.mjs request-code voice` — a Meta liga e fala o código.

**✅ Checkpoint:** rode o diagnóstico de novo. `status` = 🟢 `CONNECTED`. **A parte difícil acabou.**

> `is_pin_enabled` ainda `false` logo depois é normal — leva minutos para propagar. Se persistir:
> `node registrar-numero.mjs trocar-pin 654321`, que **não pede o PIN antigo** (a tela pede, a API não).

## A6 — O primeiro template

O número já **envia**. Mas:

> **Fora da janela de 24 horas, só template aprovado inicia conversa.** Quando o cliente escreve,
> abre uma janela de 24 h de texto livre. Fora dela — cliente que nunca falou, ou falou ontem — **só
> template**.

Toda conta nasce só com o `hello_world` de fábrica, em inglês.

```bash
node templates.mjs listar
node templates.mjs modelo boas_vindas.json
# editar o boas_vindas.json
node templates.mjs validar boas_vindas.json   # confere local, não chama a Meta
node templates.mjs criar boas_vindas.json     # manda pra aprovação
```

**Por que validar antes:** reprovação custa horas de espera, e os motivos são quase sempre mecânicos
— nome com maiúscula, variável sem exemplo, `{{2}}` antes de `{{1}}`, corpo terminando em variável,
marketing sem opção de sair. O `validar` pega isso em um segundo, de graça.

**A categoria define o preço:**

| Categoria | Para quê | Custo |
|---|---|---|
| `UTILITY` | confirmação de pedido, status de entrega, cobrança | o mais barato |
| `AUTHENTICATION` | código de acesso / OTP | intermediário |
| `MARKETING` | promoção, novidade, reengajamento | o mais caro |

Categoria errada não é só preço: promocional cadastrado como `UTILITY` é reprovado, ou reclassificado
pela Meta depois — e reclassificação retroativa já aconteceu com 4 templates do caso real.

**✅ Checkpoint:** `node templates.mjs listar` mostra o template. Nasce `PENDING`, vira 🟢 `APPROVED`
em minutos ou horas.

## A7 — O token permanente

O token da A4 vale ~24 h. Amanhã tudo para com erro `190`, no pior momento possível.

1. **business.facebook.com** → **Configurações do negócio** → **Usuários do sistema**.
2. Crie um usuário do sistema **administrador**.
3. **Adicionar ativos** → o **app** e a **WABA**, com controle total.
4. **Gerar novo token** → escolha o app → marque:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
5. Copie. **Ele aparece uma vez só.**

> ⚠️ Token que não expira é senha. No n8n entra como **credencial** (Header Auth), nunca digitado
> dentro de um node — token dentro de node vai junto quando alguém exporta o fluxo.

**✅ Checkpoint:** `node diagnostico-numero.mjs` funciona com o token novo.

## A8 — O webhook (para o número **receber**)

Até aqui o número só **envia**. Faltam **duas coisas diferentes**:

1. **Verificar a URL** — a Meta chama seu endereço com um desafio (`hub.challenge`) e espera o valor
   de volta. É o aperto de mão.
2. **Assinar o tópico** — dizer *quais eventos* você quer.

> ⚠️ **Verificar a URL não é assinar o tópico.** Dá para a verificação passar, tudo ficar verde na
> tela, e o número continuar mudo — porque nenhum campo foi assinado. Não gera erro nenhum:
> simplesmente não chega nada. É aqui que o MCP paga o que custa: ele lista o que está **de fato**
> assinado, e a resposta "nenhum" encerra a investigação em 10 segundos.

1. No n8n, node **Webhook** + fluxo **ativo** (a URL de produção só existe com o fluxo ativo; a de
   teste, com `/webhook-test/`, não serve).
2. No app: **WhatsApp → Configuração → Webhooks** → URL de callback + token de verificação (uma senha
   que você inventa e o fluxo devolve).
3. **Verificar e salvar.**
4. **Assine os campos.** No tópico `whatsapp_business_account`, no mínimo `messages` — que traz as
   mensagens recebidas **e** os status de entrega.

**✅ Checkpoint:** mande uma mensagem do seu celular para o número. A execução aparece no n8n.

## A9 — Ligar a IA no painel (MCP)

Instalação em §4. Depois de conectar, pergunte:

> *"liste meus apps da Meta"* · *"esse app está inscrito em quais webhooks?"* · *"tem pendência de
> compliance ou App Review?"* · *"estou perto de estourar algum limite de chamadas?"*

**O que ele NÃO faz:** registrar número, enviar mensagem, criar ou ler template, ler conversa, gerar
token, criar app.

**✅ Checkpoint:** *"liste meus apps da Meta"* devolve o seu app com o App ID.

---

# §6 · CAMINHO B — Coexistência

**Quando:** o número já é usado no celular e não pode sair de lá.
**Tempo:** dias a semanas — o App Review é o gargalo (10 dias no caso real).
**O nome oficial não é "coexistência":** na doc da Meta é **"Onboard WhatsApp Business app users"**.
*Coexistence* é apelido de mercado, que a própria Meta reconhece — mas quem procurar a palavra na
documentação não acha.

## 6.0 — O que é, e o que muda para a loja

| | Sem coexistência | Com coexistência |
|---|---|---|
| App no celular da loja | **para de funcionar** | continua funcionando |
| Histórico antigo | perdido para a API | fica no celular (e sincroniza — ver 6.7) |
| Quem responde | só o sistema | atendente no balcão **ou** atendente no sistema |
| Custo da resposta | toda resposta pela API é cobrada | o que sai do celular **não** é cobrado |
| Throughput | até 80 msg/s | **20 msg/s**, fixo |

Essa última linha de custo é o motivo econômico da escolha, e vale registrar: a partir de
**01/out/2026 a Meta cobra mensagem de serviço**. O que a atendente responde pelo celular fica de
fora da cobrança; o que sai pela API, não. **Quem mantém o atendimento humano no app e usa a API só
para automação e campanha vai pagar menos.**

### O que a loja perde ao ativar — diga isto **antes** de decidir

| Recurso | Depois do onboarding |
|---|---|
| Conversas 1:1 | continuam, espelhadas nos dois lados; ganham editar/apagar |
| Contatos | sem mudança |
| Grupos | continuam no app, mas **não sincronizam com a API** |
| Mensagens temporárias / ver uma vez / localização ao vivo | ❌ **desativadas** em todas as conversas 1:1 |
| **Listas de transmissão** | ❌ **desativadas.** As existentes viram somente leitura |
| Chamadas de voz e vídeo | continuam no app, não via API |
| Catálogo, pedidos, status, respostas rápidas, etiquetas, saudação/ausência, perfil comercial, Canais | continuam no app, **não** suportados pela API |
| **Dispositivos vinculados** | ❌ **todos desvinculados** — WhatsApp Web precisa ser religado. Windows e WearOS não são suportados |

### Como se desfaz — a resposta que derruba a objeção do cliente

**Quem desconecta é a própria loja, no celular:** *Configurações → Conta → Plataforma de Negócios →
Desconectar conta*. Não usa Deregister API, não pede PIN, e o número segue no app com as conversas.
Isso dispara um webhook `account_update` com evento `PARTNER_REMOVED`.

(Tirar um número do Caminho A é que seria caro: `DELETE` exigindo o PIN.)

## 6.1 — Arquitetura: quem faz o quê

```
Cliente do WhatsApp
        │
        ▼
  Número da loja (app WhatsApp Business no celular do balcão)
        │  ├── atendente responde pelo celular ──► webhook smb_message_echoes ──┐
        │  └── cliente escreve ─────────────────► webhook messages ─────────────┤
        ▼                                                                        ▼
   Meta Cloud API  ◄──── envia resposta ─────────────────────  Chatwoot / n8n (VPS do cliente)
        ▲
        │
   Embedded Signup (popup da Meta dentro da ferramenta)
   App Meta do Tech Provider ── portfólio DA AGÊNCIA (§3.3)
```

Três peças que precisam concordar entre si:

1. **App Meta** — dono da integração: permissões, domínios autorizados, URLs legais.
2. **Configuração de Login do Facebook para Empresas** (`config_id`) — define **o que o popup pede**
   ao cliente: quais ativos, quais permissões, qual validade de token.
3. **A ferramenta** (Chatwoot, no caso) — dona da inbox. Ela abre o popup, recebe o `code`, troca por
   token e cria a inbox.

> **O Chatwoot 4.16.2 já faz coexistência nativamente.** Apurado lendo o bundle que está no ar, não a
> documentação dele:
>
> ```js
> window.FB.login(cb, {
>   config_id: e, response_type: "code", override_default_response_type: true,
>   extras: { setup: {}, featureType: "whatsapp_business_app_onboarding", sessionInfoVersion: "3" }
> })
> ```
>
> O `featureType: 'whatsapp_business_app_onboarding'` **é** a coexistência. Sem ele, o popup só
> oferece criar conta nova. ⚠️ `coexistence` **deixou de ser** valor válido desde a v3.

## 6.2 — A ordem certa dos passos

Esta lista teria evitado quase todo o retrabalho do caso real. Ela só ficou clara no fim — que é
exatamente o motivo de estar escrita aqui.

| # | Passo | Onde |
|---|---|---|
| 1 | **Verificação do negócio do portfólio da agência** (não a do cliente) | Central de Empresas |
| 2 | Publicar política de privacidade, termos e exclusão de dados em HTTPS válido — **as da agência** | site da agência |
| 3 | Colar as 3 URLs + ícone + categoria em *Configurações → Básico* | App Meta |
| 4 | Autorizar o domínio da ferramenta em *Login para Empresas → Configurações* | App Meta |
| 5 | Criar a configuração de login **pelo modelo** da Meta → anotar o `config_id` | App Meta |
| 6 | Gravar `APP_ID`, `APP_SECRET`, `CONFIGURATION_ID`, `API_VERSION` + ligar a flag | Chatwoot |
| 7 | Assinar `messages` + `smb_message_echoes` + `account_update` | App Meta |
| 8 | **App Review: Acesso Avançado nas 2 permissões** ⏱️ o gargalo | App Meta |
| 9 | Rodar o Embedded Signup e conectar o número | ferramenta |
| 10 | Conferir por API e apontar o override de callback | Graph API |

## 6.3 — Preparar o app do Tech Provider

**App novo e limpo, no portfólio da agência.** Não reaproveite app com rejeição anterior no histórico
— atrapalha a análise.

Os passos 1 a 7 acima são os mesmos do Caminho A2/A8, com três diferenças:

- **As políticas são da agência**, não do cliente.
- **O domínio da ferramenta precisa entrar em dois campos**: `js_sdk_host_domains` **e**
  `oauth_redirect_uris`. Faltando qualquer um, o popup morre com erro de domínio não autorizado — e o
  erro *parece* ser da ferramenta quando é configuração da Meta.
- **Os webhooks incluem `smb_message_echoes`** (o que a atendente digita no celular aparece no
  sistema) e **`account_update`** (avisa quando a loja desconecta).

> **Sobre `history` e `smb_app_state_sync`:** existem, trazem histórico e agenda — mas **o Chatwoot
> não processa nenhum dos dois**. Assiná-los só gera tráfego descartado. Se a sua ferramenta também
> não processa, deixe fora de propósito e assuma o limite: o histórico antigo fica no celular.

## 6.4 — A configuração de login: **use o modelo**

*Login do Facebook para Empresas → Configurações → **Criar do modelo*** → **"Configuração do cadastro
incorporado do WhatsApp com token de expiração em 60 dias"**. A Meta monta variação, produtos, ativos
e permissões sozinha.

> ⚠️ **Nunca monte à mão pelo assistente.** O **contador de permissões não volta atrás**: desmarcar um
> produto tira a permissão da lista visível, mas não do contador. A tela chega a exibir *"7 opções
> selecionadas"* com 3 itens listados — as outras 4 são fantasmas que não dá mais para desmarcar. O
> painel passa a mostrar *"Algumas permissões foram restritas e não serão solicitadas aos usuários
> deste app"*, e a Meta **não monta a tela de consentimento** quando a configuração pede permissão
> restrita. O popup morre em *"Sorry, something went wrong"*.
>
> Configuração é barata: dá para ter várias no mesmo app; vale a que o `config_id` apontar. Se
> desconfiar da atual, **apague e recrie pelo modelo**.

⚠️ O outro modelo, *Parceiro de mensuração do WhatsApp*, **não serve**: dá acesso somente leitura e só
roda no Cadastro Incorporado v2 — o Chatwoot usa v3.

⚠️ **A configuração não se audita por API.** `/{app_id}/business_login_configs`, `/{app_id}/configs`,
`/{config_id}` — todos devolvem erro 2500/100, mesmo com app access token, e não há ação no MCP para
isso. **A conferência real é o próprio popup**, que mostra na tela os ativos e permissões que está
pedindo. A prova de que a coexistência está ligada: a tela de ativos oferece **"Conectar um app do
WhatsApp Business"** ao lado de "Criar uma conta do WhatsApp Business".

## 6.5 — Gravar as credenciais na ferramenta

> Os comandos prontos (as 4 chaves, a flag e o teste que prova que ficou de pé) estão em
> [MANUAL-APP-REVIEW.md §3](MANUAL-APP-REVIEW.md#3--a-ferramenta-preparar-o-chatwoot).

No Chatwoot, **não** por variável de ambiente — por `rails runner` gravando `InstallationConfig`,
para o `APP_SECRET` não aparecer em `docker service inspect`:

- `WHATSAPP_APP_ID`
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_CONFIGURATION_ID`
- `WHATSAPP_API_VERSION`

Depois de gravar, **`GlobalConfig.clear_cache` é obrigatório** — senão o valor velho continua servindo.

> 🐚 **O container do Chatwoot é busybox.** `grep -o '.\{n\}'` e `grep -oE '.{n}'` falham os dois com
> *"Invalid contents of {}"*. Saída: `awk` com `index()` + `substr()`.

## 6.6 — O App Review (§7) — o gargalo

Este é o passo 8, e é o único bloqueio real. Detalhes em §7 — e o passo a passo completo em
[MANUAL-APP-REVIEW.md](MANUAL-APP-REVIEW.md).

> ⏱️ **10 dias** na primeira vez do caso real (18–29/ago/2026). A tela diz *"most submissions are reviewed
> within 20 days"*. Planeje com a folga da Meta, não com a média.

## 6.7 — O dia de conectar: roteiro do balcão

Combine hora com a loja. Alguém precisa estar **com o celular na mão**, no balcão.

**Avise antes:**
- dispositivos vinculados caem — o WhatsApp Web vai precisar ser religado;
- listas de transmissão ficam desativadas;
- mensagens temporárias / ver uma vez / localização ao vivo saem do ar;
- app precisa estar em **2.24.17+**.

**O fluxo, do lado do cliente:**

1. Na ferramenta, rode o **Embedded Signup**.
2. Escolha **o portfólio do cliente** — que agora aparece **habilitado** (se estiver cinza, releia §3.3).
3. Escolha **"Conectar um app do WhatsApp Business"** e digite o número da loja.
4. O WhatsApp mostra um **código de verificação**.
5. No celular, chega mensagem da **Official Facebook Business Account** → **"Connect"** → **"Connect
   to the Business Platform"** → **"Confirm"** (é aqui que se decide compartilhar o histórico) → cola
   o código.

> ⏱️ **A janela de 24 horas.** Concluído o fluxo, há **apenas 24 h** para sincronizar contatos e
> histórico. Passou disso, é desconectar e refazer tudo. **Sincronize imediatamente** e peça para
> manter o app aberto durante o processo. O que vem: mensagens de até **180 dias** (em 3 fases: 0–1,
> 1–90, 90–180), mídia só dos **últimos 14 dias**, **grupos não entram**.

**Teste com número descartável antes do número principal.** Se der errado, a loja não fica sem atender.

## 6.8 — Conferir que ficou de pé

Por API, no número:

- `is_on_biz_app: true`
- `platform_type: CLOUD_API`
- `status: CONNECTED`
- `Account mode: Live`

Depois:

1. **Inscreva o app na WABA nova:** `POST /<WABA_ID>/subscribed_apps`. WABA sem app inscrito não
   entrega nada — e não dá erro, só silêncio.
2. **Aponte o override de callback do número** para a inbox correspondente. É assim que um app da
   agência serve vários clientes:

```
app da agência
 ├── WABA do cliente A → override → https://chat.clienteA.com/webhooks/whatsapp/<numero>
 ├── WABA do cliente B → override → https://chat.clienteB.com/webhooks/whatsapp/<numero>
 └── ...
```

> **A WABA nova não herda os templates.** Número que entra em WABA nova precisa dos templates
> **submetidos de novo** lá. Vale para os UTILITY que o disparo usa. Conte esse prazo no cronograma.

## 6.9 — A janela de 24 h no atendimento (regra diferente do Caminho A)

- A janela **só abre** quando o cliente manda mensagem para um número **já onboarded** na Cloud API.
- Se o cliente escreveu **pouco antes** do onboarding, só dá para responder com **template**.
- Mensagens enviadas **pelo app** **não** criam, **não** estendem e **não** afetam a janela nem a
  cobrança da Cloud API.

## 6.10 — Token de 60 dias ⚠️ pendência conhecida

O `Whatsapp::TokenExchangeService` troca o `code` por access token e guarda em
`provider_config['api_key']`. Existe um `Whatsapp::ReauthorizationService`, mas **não foi verificado
se ele renova sozinho**. Se não renovar, **a inbox morre em ~60 dias sem aviso**. Verifique antes de
considerar a entrega fechada.

---

# §7 · O App Review, em detalhe

> 📘 **A execução tela por tela mora em [MANUAL-APP-REVIEW.md](MANUAL-APP-REVIEW.md)**
> — o formulário aba por aba, os roteiros dos dois vídeos, os textos prontos, o gabarito do Data Use
> Checkup e o catálogo de erros. Aqui fica o *porquê*; lá, o *como*.

**O que se pede:** Acesso Avançado em **`whatsapp_business_messaging`** e
**`whatsapp_business_management`**. Só isso.

## 7.1 — Não espere a integração funcionar para pedir

Este impasse é invenção de quem está começando, e custa dias: *"não dá para conectar sem Acesso Avançado, e não dá
para pedir Acesso Avançado sem ter conectado"*. **Falso.** A doc aceita explicitamente:

- `whatsapp_business_management` → *"Record a video of your app, **or WhatsApp Manager**, being used
  to create a message template."*
- `whatsapp_business_messaging` → vídeo enviando mensagem para **um número qualquer de WhatsApp**,
  mostrando o cliente recebendo.
- E, direto: *"You don't need to wait for Embedded Signup to be fully implemented to start this
  process."*

> **A regra geral:** quando um raciocínio produzir um impasse circular, a hipótese mais provável não é
> que a plataforma seja mal projetada — é que **uma das premissas está errada**. Volte à doc antes de
> aceitar o impasse.

**O que precisa estar na mão para gravar** (🧱 é aqui que a submissão empaca, não na burocracia):

| Vídeo | O que mostrar | O que já precisa existir |
|---|---|---|
| `whatsapp_business_messaging` | seu app/ferramenta enviando, e a mensagem chegando num WhatsApp qualquer | **um número seu já registrado na API** (Caminho A, §5) |
| `whatsapp_business_management` | um template sendo criado — pode ser no **WhatsApp Manager** | a WABA do passo acima |

Os dois rodam com **Acesso Padrão** (§3.2), porque o número é seu. O Acesso Avançado que você está
pedindo serve para operar número **de cliente** — não para gravar a demonstração.

### ⛔ Não grave o vídeo com uma API não oficial

A pergunta aparece sozinha: *dá para gravar o screencast com Evolution/Uazapi ligados no inbox, em
vez de esperar um número na Cloud API?* Visualmente até parece a mesma tela. **Não faça.** Dois
motivos, e o segundo é o que decide:

1. É um vídeo usando o WhatsApp por um meio que os Termos não autorizam, entregue à própria
   empresa que escreveu esses Termos. O que está em risco não é a submissão — é o **app do Tech
   Provider**, do qual dependem todos os clientes que você conectar nele depois.
2. Número registrado na Cloud API **não abre no celular**. Então a API não oficial rodaria em
   **outro número**, e o vídeo mostraria uma conversa cujo número **não pertence à WABA** que está
   pedindo a permissão. É o campo mais fácil de o revisor cruzar — não exige entender de API.

**E o caminho sem risco nenhum já está aqui:** o número do Caminho A **é** o cenário de gravação.
Quem subiu um número novo não precisa dessa discussão.

## 7.2 — Peça **só** as permissões que usa

*"Requesting unnecessary permissions is a common reason for rejection during App Review."* E, no
plano prático: **cada permissão pedida é mais um vídeo e mais uma descrição** — permissão sem vídeo é
reprovação automática da submissão inteira.

Cuidado com as que entram sozinhas: `whatsapp_business_manage_events` é arrastada por marcar
*Conversions API* na configuração de login. `manage_app_solution` e `public_profile` costumam vir de
carona. Remova em *Analisar → Análise do app*.

⚠️ **Remover da análise não remove do caso de uso.** A tela *Analisar → Teste* continua listando
todas, e está certo assim.

⚠️ **`grant_status: REJECTED` aparece até em permissão que você nunca pediu** (`gaming_profile`, por
exemplo). É o estado padrão de permissão nunca analisada, **não** uma reprovação.

## 7.3 — Pré-requisitos reais

O `requirements` da API lista como pré-requisito apenas:

- `has_privacy_policy` → `true`
- `business_verification_passes` → `true`

**O e-mail de contato não verificado NÃO bloqueia o App Review.** Ele só custa receber as
notificações da análise — dá para acompanhar pelo painel.

> E um alerta: **trocar o e-mail não dispara a confirmação.** Apagar e digitar de novo não faz chegar
> link nenhum (testado, com busca no Gmail incluindo spam e lixeira). Afirmação sobre comportamento de
> plataforma que não está na doc é **hipótese**, e hipótese se apresenta como hipótese.

## 7.4 — Durante a análise

- **Nada pode ser reenviado.** `can_submit` volta `false`: *"Não é possível enviar para a análise do
  app enquanto um envio anterior estiver em análise."*
- ⚠️ **A API continua reportando `screencast` e `api_precheck` como `false` mesmo com a submissão
  aceita.** É divergência conhecida entre API e tela. **Quem manda é o formulário** — ele não libera o
  Submit com etapa obrigatória em falta. **Não tente "consertar" isso durante a análise.**

---

# §8 · Catálogo de erros

> **Antes de qualquer diagnóstico:** `node diagnostico-numero.mjs`. Não muda nada, não gasta cota, e
> responde metade das perguntas desta seção.

## 8.1 — Registro do número

| Erro | Causa | Correção |
|---|---|---|
| *"The PIN could not be changed"* | o número **nunca foi registrado**; não há PIN para trocar | pare de mexer na tela → `register` (§3.1) |
| `is_pin_enabled` false após registrar | propagação (se o PIN tivesse sido recusado, viria `133005`) | espere minutos; persistindo, `trocar-pin` |
| **`133016`** — número travado | **10 tentativas por 72 h** estouradas; cada chamada conta, inclusive as que falharam | ❌ **não existe correção. Espere 72 h.** Sem apelação |
| **`133010`** — não verificado | pulou direto para `register` | `request-code` → `verify-code` → `register` |
| **`136024`** — já registrado em outra conta | vinculado a outra WABA, ou ainda ativo no app | apague a conta no app e espere; se for de outra WABA, só o admin de lá remove |
| **`133012`** — CAPI companion | o número está em **coexistência** | não é o Caminho A. Use outro número, ou vá para o §6 |
| **`131031`** — conta bloqueada | restrição no portfólio, nada a ver com o número | Business Manager → Central de Segurança |
| SMS não chega | operadora bloqueando internacional, VoIP, chip fora do aparelho | `request-code voice` — a Meta liga e fala |

## 8.2 — Token e permissão

| Erro | Causa | Correção |
|---|---|---|
| **`190`** | token do painel vale ~24 h | gere outro; **definitivo:** token de usuário do sistema (A7) |
| **`200` / `10`** | token sem o escopo, ou não enxerga o ativo | precisa de `whatsapp_business_management` + `whatsapp_business_messaging`; confira se app e WABA são ativos daquele usuário do sistema |
| **`100`** | **nº 1 de longe:** telefone no lugar do `PHONE_NUMBER_ID` | confira os dois IDs em *WhatsApp → Configuração da API*; a mensagem crua diz qual campo está errado |

## 8.3 — Embedded Signup / coexistência

| Sintoma | Causa | Correção |
|---|---|---|
| **`#2655111`** | sem Acesso Avançado | App Review (§7) |
| Portfólio do cliente **cinza**, *"This Meta Business Account owns the app"* | o app é do portfólio do cliente | app novo no portfólio da agência (§3.3) |
| *"Sorry, something went wrong"* no popup | configuração de login montada à mão, com permissão restrita | apague e recrie **pelo modelo** (§6.4) |
| Erro de domínio não autorizado | domínio faltando em `js_sdk_host_domains` **ou** `oauth_redirect_uris` | autorize nos **dois** campos |
| Fluxo trava no celular | app WhatsApp Business < 2.24.17 | atualizar o app antes |
| Histórico não sincronizou | passou da janela de 24 h | desconectar e refazer |

## 8.4 — Webhook mudo

Ordem de conferência, da causa mais comum para a mais rara:

1. **O campo está assinado?** Verificar a URL ≠ assinar o tópico. Pergunte ao MCP: *"esse app está
   inscrito em quais webhooks?"*
2. **O app está inscrito na WABA?** `GET /<WABA_ID>/subscribed_apps` — vazio é silêncio total, sem erro.
3. **O fluxo do n8n está ativo?** URL de teste (`/webhook-test/`) não recebe produção.
4. **Tem override de callback no número** apontando para outro lugar?
5. **Outro app inscrito na mesma WABA** pode estar consumindo — confira quem mais está lá.

## 8.5 — Templates

| Causa da reprovação | Como evitar |
|---|---|
| Categoria errada (promoção como `UTILITY`) | promoção é `MARKETING`, sempre |
| Marketing sem opção de sair | inclua o opt-out |
| Texto vago, sem contexto de negócio | a Meta precisa entender o uso pelo texto |
| Variável sem exemplo · `{{2}}` antes de `{{1}}` · corpo começando/terminando em variável | `node templates.mjs validar` pega os três |

Template `REJECTED` pode ser **editado e reenviado**, não precisa criar outro:

```bash
node templates.mjs editar nome_do_template novo.json --confirmar
```

## 8.6 — Armadilhas de ambiente

- **Container busybox** (Chatwoot): `grep -o '.\{n\}'` e `grep -oE '.{n}'` falham. Use `awk` com
  `index()` + `substr()`.
- **Config do Chatwoot por `rails runner`, não por env var** — e `GlobalConfig.clear_cache` depois.
- **MCP adicionado durante uma sessão só carrega depois de reiniciar** o Claude Code. Até lá, REST.
- **Sessão remota (Claude Code na nuvem) não faz deploy nem DNS nem VPS** — a política de rede
  responde 403 para `developers.hostinger.com` e bloqueia a porta 22. Construir, sim; publicar, não.

---

# §9 · O que isso custa

> ⚠️ **Bloco volátil — conferido em agosto/2026.** Preço da Meta muda por decreto e por mercado.
> Confirme na doc oficial antes de prometer valor a cliente. A Meta só muda preço no **dia 1º de
> jan/abr/jul/out**, com aviso mínimo de 1 mês (rate card), 3 meses (add-on) ou 6 meses (modelo).

- **Não se paga pela conta, pelo app nem pelo número.** Cobra-se **por mensagem entregue**.
- O preço depende de **categoria do template**, **país do destinatário** e **volume**.
- **Utilidade e autenticação para o Brasil: US$ 0,0068 por mensagem** (tarifa que a Meta publica).
- **Marketing no Brasil:** a Meta **não expõe o número em texto** — está só nos CSV/PDF de rate card
  por moeda. 🚫 **Não use número de fonte secundária com cliente** sem baixar o rate card BRL oficial.

## As duas datas que mudam a conta

**🟡 01/ago/2026 — já valendo.** Mensagens do **Meta Business Agent** (o agente de IA nativo da Meta)
passaram a ser cobradas **por token**: US$ 2,00 por 1 milhão de tokens, global. Uma mensagem consome
20–25 mil tokens → **~4 a 5 centavos de dólar por mensagem**. Não são gratuitas nem dentro da janela
de 72 h de free entry point. Exigem linha de crédito anexada, ou não são entregues.

**🔴 01/out/2026 — o mais importante.** Duas mudanças ao mesmo tempo:

1. **Mensagens de serviço passam a ser cobradas** por mensagem (eram gratuitas desde nov/2024).
2. **Templates de utilidade dentro da janela de 24 h passam a ser cobrados** (eram gratuitos desde
   jul/2025).

A tarifa de serviço será **igual à de utilidade/autenticação daquele mercado**, e **sem volume tier**.

### O exemplo oficial da Meta — mesma conversa, três momentos

Conversa com: 1 template de marketing → 2 respostas do Meta Business Agent → 1 resposta humana → 1
confirmação de pedido (utilidade).

| Momento | Cobranças |
|---|---|
| Até jul/2026 | **1** — só o marketing |
| A partir de 01/ago/2026 | **3** — marketing + 2 MBA |
| A partir de 01/out/2026 | **5** — marketing + 2 MBA + serviço + utilidade |

### Três coisas para revisar antes de outubro

1. **Contar quantas mensagens de serviço o time envia por mês.** Esse número vira fatura.
2. **Consolidar respostas.** Bot que quebra a resposta em 4 balõezinhos gera **4 cobranças** em vez
   de 1.
3. **Reavaliar o desenho:** atendimento humano no app (grátis) + API só para automação e campanha.
   É esta a alavanca da coexistência.

### 🇧🇷 Faturamento em Reais — tem prazo

- Localização de billing para o Brasil começou em **01/jul/2026**; desde **16/jul/2026** dá para
  criar **novas WABAs em BRL**, faturadas pela Facebook Brasil.
- ⚠️ **Migrar todas as WABAs do portfólio para BRL até 30/jun/2027.** A partir de **01/jul/2027** a
  Meta **deixa de entregar mensagens** de WABA que não esteja em BRL. Existe a *WABA Currency
  Migration API* desde jun/2026.

### Outro prazo na agenda

⚠️ **O Embedded Signup v2 será descontinuado em 15/out/2026.** Quem estiver em v2 migra para v4 antes
disso.

---

# §10 · Checklists

## Caminho A — número novo

- [ ] Portfólio criado e verificação do negócio iniciada
- [ ] App criado, com o produto WhatsApp e **vinculado ao portfólio**
- [ ] WABA criada, número adicionado, nome de exibição aprovado
- [ ] `.env.local` preenchido e o diagnóstico rodando sem erro
- [ ] **`status` = `CONNECTED`** ← *a etapa que a tela não faz*
- [ ] **PIN de duas etapas anotado** em lugar seguro
- [ ] Pelo menos um template próprio `APPROVED`
- [ ] Token de usuário do sistema no lugar do temporário
- [ ] Webhook verificado **e** o campo `messages` assinado
- [ ] Mensagem de teste do celular aparecendo no destino
- [ ] MCP `meta-devtools` conectado e listando o app

## Caminho B — coexistência

**Antes (agência):**
- [ ] App **novo e limpo no portfólio da agência** — nunca no do cliente
- [ ] Verificação do negócio da **agência** aprovada
- [ ] Políticas da **agência** em HTTPS válido, coladas em *Configurações → Básico*
- [ ] Domínio da ferramenta em `js_sdk_host_domains` **e** `oauth_redirect_uris`
- [ ] `config_id` criado **pelo modelo** de 60 dias
- [ ] `messages` + `smb_message_echoes` + `account_update` assinados
- [ ] Credenciais gravadas por `rails runner` + `GlobalConfig.clear_cache`
- [ ] **App Review aprovado** nas duas permissões (`is_live: true`)
- [ ] Popup abre e oferece **"Conectar um app do WhatsApp Business"**

**No dia (com a loja):**
- [ ] Loja avisada: dispositivos vinculados caem, transmissão desativada, app ≥ 2.24.17
- [ ] Testado antes com número descartável
- [ ] Portfólio do cliente aparece **habilitado** no popup
- [ ] Alguém no balcão confirma no celular
- [ ] Sincronização feita **dentro da janela de 24 h**

**Depois:**
- [ ] `is_on_biz_app: true` e `platform_type: CLOUD_API`
- [ ] `POST /<WABA_ID>/subscribed_apps` feito
- [ ] Override de callback do número apontando para a inbox certa
- [ ] Templates **resubmetidos na WABA nova**
- [ ] Mensagem de teste indo e voltando nos **dois sentidos** (celular e ferramenta)
- [ ] ⚠️ Renovação do token de 60 dias verificada (§6.10)

---

# §11 · As cinco frases que resumem tudo

1. **O painel não registra número** — quem registra é `POST /register`, e o PIN nasce ali.
2. Papel no app dá Acesso Padrão; **Embedded Signup exige Acesso Avançado**, que só sai por App Review.
3. **O app tem que ser da agência.** Portfólio dono do app não pode ser o cliente no Embedded Signup.
4. **Não espere a integração funcionar para pedir App Review** — a Meta aceita vídeo do WhatsApp
   Manager e de número de teste.
5. **Configuração de login: use o modelo.** O assistente tem contador que não volta atrás — e a
   configuração não se audita por API; o popup é o teste.

---

# §12 · Onde está o resto

| Assunto | Onde |
|---|---|
| Os scripts (`diagnostico-numero`, `registrar-numero`, `templates`, `upload-midia`) | a raiz desta pasta |
| O passo a passo enxuto, do zero | [`../COMECE-AQUI.md`](../COMECE-AQUI.md) |
| O App Review, tela por tela | [`MANUAL-APP-REVIEW.md`](MANUAL-APP-REVIEW.md) |
| O que pedir ao seu agente de IA, com o comando de cada coisa | [`../CLAUDE.md`](../CLAUDE.md) |
| VPS + Chatwoot do zero (a ferramenta do §6.1) | [github.com/plasdigital/vps-kit-aluno](https://github.com/plasdigital/vps-kit-aluno) |
| A documentação oficial da Meta | [developers.facebook.com](https://developers.facebook.com/documentation/business-messaging/whatsapp/) |

---

*Este manual nasceu de um caso real (ago/2026) e é para ser reusado. Conteúdo de preço e política
da Meta envelhece rápido — reconferir o §9 na fonte oficial a cada trimestre.*
