# Processo — Aprovar o app na Meta (App Review) e ligar a coexistência

- **Objetivo:** sair de "tenho um app na Meta" e chegar em "o número **do meu cliente** entrou no
  meu sistema sem sair do celular dele".
- **Status:** 🟢 percorrido inteiro uma vez num app real — submetido em 18/ago/2026 e
  **aprovado em 29/ago/2026**, Acesso Avançado nas duas permissões. Tudo aqui foi visto na tela.
- **Ferramentas:** Meta for Developers · WhatsApp Manager · Chatwoot · Ferramenta de Captura do
  Windows · `ffmpeg` · MCP `meta-devtools`.
- **Entrada:** um app na Meta, um portfólio verificado e **um número já registrado na Cloud API**
  (Caminho A do [manual mestre](MANUAL-SUBIR-NUMERO.md)).
- **Saída:** `whatsapp_business_messaging` e `whatsapp_business_management` em **Acesso Avançado**,
  Embedded Signup abrindo sem erro, e o número do cliente em coexistência.
- **Tempo real:** ~4 h de trabalho seu, espalhadas em **10 dias corridos** de espera da Meta.
- **Escrito em:** 01/set/2026.

> **Este documento é o detalhe dos §6 e §7 do [manual mestre](MANUAL-SUBIR-NUMERO.md).**
> Lá está a lógica (qual caminho é o seu, o que a coexistência custa); aqui está a execução, tela
> por tela. Se você caiu aqui sem ter lido o manual, leia pelo menos o §1 dele antes.

## Se você quer X, vá para §Y

| Você quer… | Vá para |
|---|---|
| Entender por que existem quatro "verificações" diferentes | [§0](#0--os-quatro-verificar-que-não-são-a-mesma-coisa) |
| Saber o que precisa existir antes de começar | [§0.5](#05--o-que-precisa-existir-antes-de-começar) |
| Decidir se vale fazer ou contratar | [§1](#1--fazer-ou-contratar) |
| A ordem dos passos, com o que roda em paralelo | [§2](#2--a-ordem-certa-e-o-que-roda-em-paralelo) |
| **Liberar o Embedded Signup dentro do Chatwoot** | [§3](#3--a-ferramenta-preparar-o-chatwoot) |
| Preparar o app na Meta (URLs, domínios, configuração de login, webhooks) | [§4](#4--o-app-na-meta-o-lado-tech-provider) |
| **Preencher o formulário do App Review** | [§5](#5--o-app-review-o-formulário-aba-por-aba) |
| **Gravar os dois vídeos** | [§6](#6--os-dois-vídeos) |
| Os textos que vão no formulário | [§7](#7--os-textos-do-use_case) |
| Responder o questionário de dados | [§8](#8--data-use-checkup) |
| Submeter e o que acontece depois | [§9](#9--submeter-e-esperar) |
| Conectar o número do cliente no dia combinado | [§10](#10--o-dia-de-conectar-o-número) |
| Um erro específico que apareceu na tela | [§11](#11--catálogo-de-erros) |

---

# 0 · Os quatro "verificar" que não são a mesma coisa

Este é o maior nó da cabeça de quem começa, e ele é de **vocabulário**, não de dificuldade. A Meta
usa a palavra "verificação" em quatro processos diferentes, e falhar em explicar isso faz a pessoa
esperar a coisa errada.

| Nome | O que é | Quem analisa | Quanto demora | O que trava se faltar |
|---|---|---|---|---|
| **Verificação do negócio**<br>*(Business verification)* | a Meta conferindo que a **empresa existe**: CNPJ, endereço, documento | time de empresas | dias | número novo: teto de **250 conversas iniciadas/dia**. Coexistência: **trava o App Review** |
| **Publicar o app**<br>*(app em modo Live)* | preencher 3 URLs legais + ícone + categoria e ligar a chave | ninguém — é preenchimento | 20 min | não dá para submeter o App Review |
| **App Review**<br>*(análise do app)* | a Meta assistindo seus vídeos e lendo seus textos para dar **Acesso Avançado** | revisor humano | **10 dias** no caso real | o Embedded Signup devolve **#2655111** |
| **Verificação de acesso**<br>*(access verification)* | declaração de como você trata os dados da plataforma, **depois** da aprovação | automático + revisão | até 5 dias | o acesso avançado não fica ativo de fato |

E mais dois pares de nomes que colidem, e que já custaram tempo:

- **Acesso Padrão × Acesso Avançado.** Padrão vem de graça e serve para operar **os seus próprios**
  ativos. Avançado só sai pelo App Review e serve para operar ativos **de terceiros**. É por isso
  que a sua inbox funciona e a do cliente não.
- **`whatsapp_embedded_signup` × `whatsapp_embedded_signup_inbox_creation`.** São **duas flags
  diferentes** no Chatwoot, com nomes quase iguais (§3).

> 🧭 **Coexistência não é o nome oficial.** Na documentação da Meta o processo se chama
> *"Onboard WhatsApp Business app users"*. Quem procurar "coexistence" não acha a página.

---

# 0.5 · O que precisa existir antes de começar

Legenda: `(óbvio)` = quase todo mundo já tem · `⏯️` = candidato a vídeo separado · `🧱` = onde trava.

| # | O que | O que é (para quem nunca viu) | Obrigatório? | Se faltar | |
|---|---|---|---|---|---|
| 1 | Conta pessoal no Facebook | o perfil comum, de pessoa física | sempre *(óbvio)* | não existe portfólio | — |
| 2 | Portfólio comercial (BM, gerenciador de negócios — **é a mesma coisa**) | a "empresa" dentro da Meta | sempre | não existe app | ⏯️ |
| 3 | **Verificação do negócio do portfólio da AGÊNCIA** | a Meta conferindo o CNPJ de quem é dono do app | **sim, aqui é obrigatório** | `business_verification_passes: false` → o formulário não deixa submeter | ⏯️ |
| 4 | Três páginas em HTTPS **da agência**: privacidade, termos, exclusão de dados | páginas públicas no seu site | sempre | `has_privacy_policy: false` → mesmo bloqueio | — |
| 5 | App na Meta **no portfólio da agência** | o "aplicativo" que faz a ponte | sempre | ver o erro do §11.1 | — |
| 6 | **Um número seu já registrado na Cloud API** | um número que você mesmo subiu (Caminho A) | **sim** | 🧱 sem ele não há o que gravar nos vídeos | ⏯️ |
| 7 | Ferramenta de conversas com Embedded Signup | Chatwoot na sua VPS, ou uma que tenha o botão | sempre | sem ela não existe popup para o cliente clicar | 🧱 ⏯️ |
| 8 | Windows com Ferramenta de Captura + `ffmpeg` | gravar tela e tirar áudio/queimar legenda | sempre | não dá para produzir os vídeos | — |

A corrente, que é o que se lê em 5 segundos:

```
1. conta pessoal ─┐
2. portfólio      │
3. verificação do negócio (dias!)  ├─ tudo isto ANTES de abrir o formulário
4. páginas legais │
5. app no portfólio certo         │
6. um número seu na Cloud API ────┘   ⬅ este é o que as pessoas esquecem
   └──► §3 ferramenta → §4 app → §5 formulário → 10 dias → §10 conectar
```

> 🧱 **O item 6 é a descoberta que reordena tudo.** O App Review pede dois vídeos, e os dois só se
> gravam com um número seu já funcionando na Cloud API. Ou seja: **subir um número novo (Caminho A)
> não é a alternativa à coexistência — é o passo anterior a ela.**

---

# 1 · Fazer ou contratar

Antes da decisão técnica existe esta, e ela é legítima nos dois sentidos.

| | **Contratar** um provedor (Chatwoot Cloud, ManyChat, Zenvia, Take…) | **Ser** o provedor (este documento) |
|---|---|---|
| Quem é dono do app na Meta | **eles** | **você** |
| App Review | não existe para você | ~4 h de trabalho + 10 dias de espera |
| Preço da mensagem | preço da Meta **+ margem deles** | preço da Meta, direto |
| Quando o cliente quiser algo fora do padrão | depende do que a ferramenta expõe | você chama a API crua |
| Trocar de ferramenta depois | perde o número ou vira migração | o número é seu, a ferramenta é detalhe |
| Você pode ser o provedor **do seu cliente** | não | **sim — é isso que se está montando aqui** |

**A régua não é a marca da ferramenta, é a posse do app.** O mesmo Chatwoot aparece nos dois lados:
contratado na nuvem deles, o app é deles; instalado na sua VPS, o app é seu.

> ⚠️ **Zero configuração não é zero burocracia.** Mesmo contratando, o cliente cria conta no
> Facebook, tem portfólio e passa pela verificação do negócio. O que se compra é o App Review e a
> integração — não a burocracia.

---

# 2 · A ordem certa, e o que roda em paralelo

| # | Passo | Onde | Depende de | Tempo |
|---|---|---|---|---|
| 1 | Verificação do negócio da **agência** | Central de Empresas | — | **dias** ⏳ |
| 2 | Publicar privacidade, termos e exclusão de dados | seu site | — | 1 h |
| 3 | 3 URLs + ícone (1024×1024) + categoria em *Configurações → Básico* | App Meta | 2 | 20 min |
| 4 | Autorizar o domínio da ferramenta nos **dois** campos | App Meta | — | 10 min |
| 5 | Criar a configuração de login **pelo modelo** → anotar o `config_id` | App Meta | 3 | 10 min |
| 6 | Gravar as 4 chaves + ligar a flag | Chatwoot | 5 | 20 min |
| 7 | Assinar `messages` + `smb_message_echoes` + `account_update` | App Meta | — | 10 min |
| 8 | Fazer **1 chamada de API por permissão** | Graph API Explorer | — | 5 min ⏳ *(loga em até 2 dias)* |
| 9 | Gravar os dois vídeos | seu PC | um número seu na Cloud API | 1 h |
| 10 | Preencher e submeter o formulário | App Meta | 1, 3, 8, 9 | 1 h |
| 11 | **Esperar** | — | 10 | **10 dias** ⏳ |
| 12 | Rodar o Embedded Signup e conectar o número do cliente | ferramenta | 11 | 30 min |

**O que dá para adiantar enquanto espera o passo 1:** os passos 2, 4, 8 e 9. Não fique parado
esperando a verificação do negócio — ela é a mais longa e a mais independente.

> 🚩 **O passo 8 tem um atraso escondido.** A doc: *"The API call data will be logged within 2 days
> of your successful API call."* Se você fizer a chamada no mesmo dia em que quer submeter, o botão
> *Request advanced access* pode continuar cinza. Faça no primeiro dia.

---

# 3 · A ferramenta: preparar o Chatwoot

Esta é a parte que quase nunca está escrita em lugar nenhum, porque cada ferramenta faz do seu
jeito. Aqui é **Chatwoot auto-hospedado**, versão 4.16.2 ou mais nova.

## 3.1 — Por que o Chatwoot serve

Apurado lendo o JavaScript que está no ar, não a documentação dele:

```js
window.FB.login(cb, {
  config_id: e, response_type: "code", override_default_response_type: true,
  extras: { setup: {}, featureType: "whatsapp_business_app_onboarding", sessionInfoVersion: "3" }
})
```

O `featureType: 'whatsapp_business_app_onboarding'` **é** a coexistência. Sem ele o popup só
oferece criar conta nova. ⚠️ O valor `coexistence`, que aparece em tutorial antigo, **deixou de ser
válido** na v3.

## 3.2 — As quatro chaves

Elas moram no `InstallationConfig` (a tabela de configuração global do Chatwoot), **não em variável
de ambiente**. Conferido no `config/installation_config.yml` do projeto em 01/set/2026:

| Chave | O que é | Onde achar |
|---|---|---|
| `WHATSAPP_APP_ID` | o número do app na Meta | topo do painel do app |
| `WHATSAPP_APP_SECRET` | a senha do app | *Configurações → Básico → Chave secreta do app* |
| `WHATSAPP_CONFIGURATION_ID` | o `config_id` da configuração de login (§4.3) | *Login para Empresas → Configurações* |
| `WHATSAPP_API_VERSION` | versão da Graph API — o padrão do Chatwoot é `v22.0` | — |

> 🔒 **Por que não por variável de ambiente:** `docker service inspect` mostra as variáveis de
> ambiente em texto puro para quem tiver acesso ao host. O `APP_SECRET` é senha do app inteiro —
> com ele, qualquer um fala em nome da sua integração.

**Para gravar** (entre no container do Chatwoot e rode com `bundle exec rails runner`):

```ruby
# 1. ANTES — ver o que já está lá
%w[WHATSAPP_APP_ID WHATSAPP_APP_SECRET WHATSAPP_CONFIGURATION_ID WHATSAPP_API_VERSION].each do |k|
  c = InstallationConfig.find_by(name: k)
  puts "#{k} = #{c&.value.inspect}"
end

# 2. GRAVAR
{
  'WHATSAPP_APP_ID'           => '<APP_ID>',
  'WHATSAPP_APP_SECRET'       => '<APP_SECRET>',
  'WHATSAPP_CONFIGURATION_ID' => '<CONFIG_ID>',
  'WHATSAPP_API_VERSION'      => 'v22.0'
}.each do |name, value|
  c = InstallationConfig.find_or_initialize_by(name: name)
  c.value = value
  c.save!
end

# 3. OBRIGATÓRIO — sem isto o valor velho continua servindo
GlobalConfig.clear_cache
```

✅ **Sinal de sucesso:** rode o bloco 1 de novo e veja os quatro valores. Eles também aparecem em
*Super Admin → Settings*, grupo `whatsapp_embedded`.

## 3.3 — A flag (e a armadilha do nome)

O Chatwoot tem **duas** flags com nome quase igual (conferido em `config/features.yml`, 01/set/2026,
as duas `enabled_by_default: false`):

| Flag | Nome na tela |
|---|---|
| `whatsapp_embedded_signup` | *WhatsApp Embedded Signup* |
| **`whatsapp_embedded_signup_inbox_creation`** | *WhatsApp Embedded Signup Flow* ⬅ **é esta** |

A que libera o botão de conectar por Embedded Signup na criação de inbox é a **segunda**. Ela é
**por conta** (`Account`), não global:

```ruby
acc = Account.find(1)                                        # o ID da sua conta
acc.enable_features!('whatsapp_embedded_signup_inbox_creation')
acc.save!
puts acc.enabled_features
```

✅ **Sinal de sucesso:** em *Configurações → Caixas de entrada → Adicionar caixa → WhatsApp*, o
provedor **WhatsApp Cloud** passa a mostrar o botão de conectar pela Meta, em vez de só os campos
manuais de token.

## 3.4 — O teste que vale mais que qualquer conferência

**A configuração de login não se audita por API.** Todos os caminhos (`/{app_id}/business_login_configs`,
`/{app_id}/configs`, `/{config_id}`) devolvem erro 2500/100, mesmo com app access token, e não há
ação no MCP `meta-devtools` para isso. Testado em 12/ago/2026.

**A conferência real é abrir o popup.** Ele mostra na tela os ativos e as permissões que está
pedindo:

1. Chatwoot → *Configurações → Caixas de entrada → Adicionar caixa → WhatsApp → conectar*.
2. O popup abre em *"Conecte sua conta facilmente a `<seu app>`"*.
3. Avance até a tela de ativos.

✅ **A prova de que a coexistência está ligada:** a tela oferece **"Conectar um app do WhatsApp
Business"** ao lado de *"Criar uma conta do WhatsApp Business"*. Se só aparece a segunda, o
`featureType` não está indo — reveja a versão do Chatwoot e o `config_id`.

⛔ **Pare aí antes do App Review aprovado.** Se avançar até digitar o número, estoura o **#2655111**
(§11.2). Não é problema: é exatamente o que este processo resolve.

---

# 4 · O app na Meta: o lado Tech Provider

## 4.1 — Onde o app tem que morar

**No portfólio da AGÊNCIA. Nunca no do cliente.** Esta é a regra que custou duas semanas no caso real
loja.

O Embedded Signup roda sobre o Facebook Login para Empresas, que é um **ato de concessão entre duas
partes**: a empresa A autoriza o app da empresa B. Quando o portfólio já é dono do app, não existe o
que conceder — e a Meta desabilita a linha do cliente com a etiqueta:

> *"This Meta Business Account owns the app"*

Nenhum ajuste de permissão, papel ou verificação resolve. É por desenho.

> ✅ **Isso não fere "o número tem que ser do cliente".** A doc é explícita: *"Business customers
> onboarded via Embedded Signup **own all of their WhatsApp assets** […] you cannot restrict this
> access in any way."* O cliente continua dono da WABA, do número, dos templates e do histórico. O
> que é da agência é o **papel de provedor** — que por definição não pode ser do cliente.

⛔ **Não tente transferir um app de portfólio.** O procedimento **começa removendo a verificação do
app**, e verificação é pré-requisito do App Review. Não há garantia de que o Acesso Avançado
sobreviva. Refazer o App Review custa tempo; transferir custa risco sobre operação viva.

⛔ **Não reaproveite app com rejeição no histórico.** App novo e limpo.

## 4.2 — Configurações → Básico

| Campo | O que pôr | Armadilha |
|---|---|---|
| Ícone | 1024×1024 | *"Make sure your App Icon does not include any of our trademarks or logos"* — nada de logo do WhatsApp no ícone |
| URL da política de privacidade | página **da agência**, em HTTPS | é a que aparece no popup para o cliente |
| URL dos termos de serviço | idem | |
| URL de exclusão de dados | idem | a mais esquecida das três |
| Categoria do app | a que descreve de verdade | |
| Finalidade do app | **Clientes** (*Clients*) | *"Yourself or your own business"* só se o app for usado apenas por quem tem papel nele — **não é o seu caso** |
| Contato principal | e-mail que você lê | não bloqueia o App Review, mas é por onde chegam as notificações |

> ℹ️ **E-mail de contato não verificado não bloqueia.** Ele não está na lista de pré-requisitos
> (`has_privacy_policy` e `business_verification_passes` são os únicos). O que se perde é receber
> aviso por e-mail — o acompanhamento é pelo painel. E um alerta apurado na marra: **trocar o
> e-mail não dispara a confirmação** (testado em 12/ago, com busca no Gmail incluindo spam e
> lixeira). Isso é comportamento observado, não documentado — trate como hipótese.

## 4.3 — Os dois campos de domínio, e a configuração de login

O domínio da sua ferramenta (`chat.seucliente.com`) precisa entrar em **dois** lugares, em *Login do
Facebook para Empresas → Configurações*:

- `js_sdk_host_domains` — de onde o popup pode ser aberto
- `oauth_redirect_uris` — para onde a Meta devolve o `code`

🧱 **Faltando qualquer um dos dois, o popup morre com erro de domínio não autorizado — e o erro
parece ser da ferramenta quando é configuração da Meta.**

**Criar a configuração de login:** *Login do Facebook para Empresas → Configurações → **Criar do
modelo*** → **"Configuração do cadastro incorporado do WhatsApp com token de expiração em 60 dias"**.
A Meta monta variação, produtos, ativos e permissões sozinha. Anote o `config_id`.

> ⚠️ **Nunca monte à mão pelo assistente.** O **contador de permissões não volta atrás**: desmarcar
> um produto tira a permissão da lista visível, mas não do contador. A tela chega a exibir *"7
> opções selecionadas"* com 3 itens listados — as outras 4 são fantasmas que não dá mais para
> desmarcar. O painel passa a mostrar *"Algumas permissões foram restritas e não serão solicitadas
> aos usuários deste app"*, a Meta não monta a tela de consentimento, e o popup morre em *"Sorry,
> something went wrong"*.
>
> Configuração é barata: dá para ter várias no mesmo app; vale a que o `config_id` apontar. Se
> desconfiar da atual, **apague e recrie pelo modelo**.

⚠️ **O outro modelo não serve.** *Parceiro de mensuração do WhatsApp* dá acesso **somente leitura** e
só roda no Cadastro Incorporado v2; o Chatwoot usa v3.

⚠️ **Não marque produto de anúncio** (Marketing Messages, CTWA, CTD, CTM, Conversions API). Cada um
arrasta uma permissão nova — a Conversions API arrasta `whatsapp_business_manage_events` — e **cada
permissão extra é mais um vídeo e mais um texto no App Review**. Se um dia houver Click-to-WhatsApp,
é **outra** configuração.

## 4.4 — Webhooks

Assine três campos:

| Campo | Para quê |
|---|---|
| `messages` | o cliente escreve → chega na ferramenta |
| `smb_message_echoes` | **a atendente digita no celular → aparece na ferramenta.** É o coração da coexistência |
| `account_update` | avisa quando a loja desconecta (evento `PARTNER_REMOVED`) |

> **Sobre `history` e `smb_app_state_sync`:** existem, trazem histórico e agenda, mas **o Chatwoot
> não processa nenhum dos dois**. Assinar só gera tráfego descartado. Deixe fora de propósito e
> assuma o limite: o histórico antigo fica no celular.

⚠️ **Verificar a URL não é assinar o campo.** São dois botões diferentes na mesma tela. Fica tudo
verde, sem erro nenhum, e o número continua mudo.

---

# 5 · O App Review: o formulário, aba por aba

## 5.1 — O que se pede, e só isso

**Acesso Avançado em duas permissões:**

| Permissão | O que ela faz | Por isso o vídeo dela é… |
|---|---|---|
| `whatsapp_business_management` | mexe na **configuração**: lista WABAs e números compartilhados, registra o número, lê status, assina webhooks, **cria e lê templates** | **criar um template** |
| `whatsapp_business_messaging` | uma coisa só, a mais importante: **enviar e receber mensagem** | **mandar uma mensagem e mostrar ela chegando** |

⛔ **Na tela "Permissões e recursos", não adicione mais nada.** Ela lista tudo que o caso de uso
conhece, com botões azuis *"Adicionar à análise do app"* convidando ao clique. Cada permissão
adicionada vira **mais 4 etapas** e mais um motivo de rejeição. `email` é o pior caso: é dado
pessoal, atrai escrutínio, e a coexistência não usa.

> *"Requesting unnecessary permissions is a common reason for rejection during App Review."*

⚠️ **`grant_status: REJECTED` aparece em permissão que você nunca pediu** (`gaming_profile`,
`public_profile`…). Com `rejection_reasons` vazio, é só o jeito da Meta dizer "sem Acesso Avançado".
**Não é reprovação.**

## 5.2 — As 4 etapas × 2 permissões = 8 caixinhas

São **por permissão**, o que significa fazer tudo duas vezes.

| Etapa (nome na API) | O que é | Onde resolver |
|---|---|---|
| `use_case` | o **texto** explicando por que o app precisa da permissão | §7 |
| `screencast` | o **vídeo** mostrando o app usando aquela permissão | §6 |
| `api_precheck` | prova de **1 chamada bem-sucedida** com aquela permissão nos últimos 30 dias | §5.4 |
| `data_use_checkup` | questionário anual sobre tratamento de dados | §8 |

**Texto e vídeo são os dois obrigatórios, sempre:**

> *"Both written descriptions and screen recordings are required for each permission. If you include
> a screen recording that shows how your app uses a permission, but fail to include a description of
> how it uses it, your submission will be rejected."*

**E um vídeo por permissão, nunca um só:**

> *"Do not submit a video that includes multiple permissions supporting different use cases. You must
> submit a different video clip for each permission."*

## 5.3 — As 4 abas da tela

O formulário tem quatro abas no topo: **Verificação · Configurações do app · Uso permitido ·
Tratamento de dados**.

- **Verificação** — a verificação do negócio (§0.5 item 3). Verde antes de começar.
- **Configurações do app** — o que você já preencheu no §4.2. Confirme, não mexa.
- **Uso permitido** — 🎯 **é aqui que se trabalha**: um cartão por permissão, com texto + vídeo.
- **Tratamento de dados** — o `data_use_checkup` do §8.

A Meta salva sozinha (*"Salvo automaticamente"*), então dá para sair no meio e voltar.

**Como chegar:** `developers.facebook.com/apps/<APP_ID>/app-review/permissions/`
Pelo menu: *Casos de uso → (o caso de uso do WhatsApp) → Personalizar → Tech Provider onboarding →
Begin App Review*. É o **mesmo lugar** — App Review e "virar Tech Provider" não são dois processos.
Se o link direto abrir tela diferente, use o menu: a Meta muda a rota de tempos em tempos.

## 5.4 — `api_precheck`: a chamada que destrava o botão

A regra:

> *"Make at least 1 successful API call using each permission for which you are requesting advanced
> access. Calls must be made within 30 days of submitting for App Review."*
> *"The Request advanced access button will remain grayed out until a successful API call has been
> logged in our system."* · *"The API call data will be logged within 2 days."*

| Permissão | Chamada que resolve | Como |
|---|---|---|
| `whatsapp_business_messaging` | enviar 1 mensagem | **acontece sozinho ao gravar o vídeo 2** |
| `whatsapp_business_management` | `GET /<WABA_ID>/message_templates?limit=1` | Graph API Explorer, ou criar o template do vídeo 1 |

**Pelo Graph API Explorer** (`developers.facebook.com/tools/explorer`):

1. Em *Meta App*, escolher o seu app.
2. Em *User or Page*, gerar token com as duas permissões do WhatsApp.
3. Rodar `GET /<WABA_ID>/message_templates?limit=1` e conferir que voltou `200` com dados.

✅ **Sinal de sucesso:** na tela, *"Verifique se você fez as ligações de teste de API exigidas"* fica
verde nas duas permissões.

> ⚠️ **A API e a tela discordam aqui, e quem manda é a tela.** `devtools_app_review requirements`
> continua devolvendo `screencast: false` e `api_precheck: false` **mesmo com a submissão aceita e
> aprovada** — conferido de novo em 01/set/2026, no app já aprovado. É divergência conhecida. O
> formulário não libera o Submit com etapa obrigatória em falta; se ele liberou, está completo.
> **Não tente "consertar" isso.**

---

# 6 · Os dois vídeos

## 6.1 — As regras que reprovam

Da [guia oficial de screen recordings](https://developers.facebook.com/docs/app-review/submission-guide/screen-recordings/):

| Regra | Detalhe |
|---|---|
| **Interface em inglês** | *"Use English as the app UI language."* Se não der, **legendas em inglês são obrigatórias** |
| **Sem áudio** | *"Omit audio; our reviewers will not listen to it."* Narração é tempo perdido |
| **1080p ou melhor** | e monitor com largura ≤ 1440 px durante a gravação |
| **Mouse, não teclado** | *"When possible, use your mouse to interact with your app."* Cursor grande ajuda |
| **Só o necessário no quadro** | a janela, não a área de trabalho com abas e notificações |
| **Legendas nos pontos não óbvios** | texto por cima explicando o que aquele botão faz |
| **Não pode ser screenshot** | *"you must submit a screen recording"* |
| **Vídeo inédito** | *"Ensure that the video is unique and not a previously submitted or duplicate video"* |
| **Um por permissão** | ver §5.2 |

**Como deixar a interface em inglês:**
- **Painel da Meta / WhatsApp Manager:** `facebook.com/settings?tab=language` → *English (US)*.
  Devolve para português depois de gravar.
- **Chatwoot:** foto do perfil (canto inferior esquerdo) → *Perfil* → *Idioma* → *English*. É por
  usuário, não afeta os outros.

**Ferramentas no Windows 11:**
- **Ferramenta de Captura** (`Win + Shift + S` → aba de vídeo) — grava **região selecionada**. É a
  melhor aqui, justamente por recortar o que não pode aparecer.
- **Xbox Game Bar** (`Win + G`) — grava a janela ativa inteira.
- **`ffmpeg`** — tira o áudio e **queima legenda** a partir de um `.srt`. Não precisa de Clipchamp:

```bash
# corta, tira o áudio e queima as legendas em um passo só
ffmpeg -i bruto.mp4 -t 150 -an -vf "subtitles=legendas.srt" -c:v libx264 -crf 20 final.mp4
```

## 6.2 — 🚨 Antes de qualquer gravação: nenhum cliente real no quadro

Se a inbox que você vai gravar tem conversa de cliente, ela **não pode aparecer**. Em farmácia isso
é dado de saúde; em qualquer negócio é dado pessoal indo para dentro de um vídeo enviado a terceiro.

**Como blindar, na ordem:**

1. Mande a mensagem de teste do **seu celular pessoal** para o número. A conversa nasce na inbox.
2. Nessa conversa, clique em **"Atribuir a mim"**.
3. Troque o filtro da caixa de entrada para **"Minhas" / "Mine"**. As outras somem da lista, porque
   não estão atribuídas a você. Nada foi apagado nem alterado para terceiros.
4. Mesmo assim, **grave por região**, enquadrando só a conversa.
5. Antes de enviar: assista até o fim procurando notificação de canto, aba do navegador com nome de
   cliente, prévia de mensagem. Se aparecer, corte.

## 6.3 — 🎬 Vídeo 1 — `whatsapp_business_management`

**O que a Meta pede:** *"Record a video of your app, **or WhatsApp Manager**, being used to create a
message template."*

> ❓ **"Eu crio o template pelo Chatwoot?"** **Não.** Template não se cria no Chatwoot nem no n8n —
> se cria no **WhatsApp Manager**, o painel da Meta. O Chatwoot só *usa* um template já aprovado.
> **No vídeo 1 você nem abre o Chatwoot.**
>
> ❓ **"Já tenho templates aprovados, não serve?"** Não. O revisor não confere se existe template na
> conta; ele assiste a **ação sendo executada**. Você vai criar mais um, ao vivo, durante a
> gravação — leva 40 segundos e o template ainda fica útil depois.

**Antes de apertar o REC:**

1. Facebook em inglês.
2. Abrir `business.facebook.com/wa/manage/message-templates/?waba_id=<WABA_ID>` e conferir que no
   topo está o nome da conta certa.
3. Fechar tudo que não for essa aba. Ligar *Não incomodar* do Windows.
4. 🚩 **Colapsar qualquer banner amarelo de aviso** no topo da lista (do tipo *"Some of your
   templates need your attention"*). Não é erro do app, mas é a última coisa que se quer no quadro
   de um revisor julgando uso de template. Filtro de data em *Last 7 days* deixa a lista curta.
5. `Win + Shift + S` → aba de **vídeo** → selecionar só a área do navegador → **Gravar**.

**Roteiro (≈ 60–90 s):**

| # | O que você faz na tela | Legenda por cima (inglês) |
|---|---|---|
| 1 | 3 s parado, mostrando o nome da conta no topo | `WhatsApp Manager — client's WhatsApp Business Account` |
| 2 | Passar o mouse devagar pela lista de templates existentes | `Message templates managed through the whatsapp_business_management permission` |
| 3 | Clicar em **Create template** | `Creating a new message template` |
| 4 | **Utility** · nome do template · idioma · **Continue** | `Category: Utility — order and delivery updates` |
| 5 | Digitar o corpo **devagar**, deixando o revisor ler | `Template body — the business notifies the customer` |
| 6 | Clicar em **Submit** | `Template submitted to Meta for approval` |
| 7 | 3 s na lista, com o template novo em **In review / Pending** | `Template created and listed under the client's WABA` |

> ✅ **O vídeo só termina depois do Submit.** Erro cometido na primeira gravação: parou na tela de
> edição. O último plano tem que ser a **lista** com o template novo em *In review*.
>
> ⛔ **Não grave criando template de marketing** — categoria errada atrai pergunta do revisor.
> Escolha um Utility que você vá usar de verdade; a gravação resolve duas coisas de uma vez.

## 6.4 — 🎬 Vídeo 2 — `whatsapp_business_messaging`

**O que a Meta pede:** *"Record a video showing your app being used to send a message to a WhatsApp
number, and the WhatsApp client (either web or mobile app) receiving and displaying the sent
message."*

> ❓ **"Como eu comprovo que a mensagem chegou?"** **A comprovação é as duas telas no mesmo quadro.**
> Não existe outra prova, e não precisa de aparelho extra: de um lado o Chatwoot enviando, do outro
> o **WhatsApp Web do seu número pessoal** recebendo.

**Montagem da tela — é aqui que o vídeo se ganha ou se perde:**

1. Duas janelas do navegador lado a lado (`Win + ←` / `Win + →`):
   - **Esquerda:** o Chatwoot, com o idioma do seu usuário em *English*.
   - **Direita:** `web.whatsapp.com`, logado no **seu número pessoal**.
2. Na direita, abrir a conversa com o número da API.
3. Na esquerda, "Atribuir a mim" + filtro **Mine** (§6.2).
4. *Não incomodar* ligado. Gravar a região que cobre **as duas janelas**.

**Roteiro (≈ 60–90 s):**

| # | O que você faz na tela | Legenda por cima (inglês) |
|---|---|---|
| 1 | 3 s parado, as duas janelas visíveis | `Left: our app (shared inbox). Right: WhatsApp Web of a test user.` |
| 2 | Na **direita**, digitar `Hello, is my order ready?` e Enter | `Test user sends a message to the business WhatsApp number` |
| 3 | Levar o mouse à **esquerda** e esperar a mensagem aparecer sozinha (2–5 s) | `Incoming message received through the Cloud API webhook` |
| 4 | Na **esquerda**, digitar a resposta | `Agent replies from our app's shared inbox` |
| 5 | Clicar em **Send** | `Message sent via whatsapp_business_messaging` |
| 6 | Levar o mouse à **direita** e esperar a resposta aparecer | `Message delivered and displayed in the WhatsApp client` |
| 7 | Aproximar o mouse do ✓✓ e segurar 3 s | `Delivery confirmed` |

> 🔑 **O passo 6 É a prova.** O revisor vê a mensagem sair da esquerda e chegar na direita, no mesmo
> quadro, sem corte. **Se você cortar o vídeo entre o envio e a chegada, a prova morre.**
>
> ⚠️ **Mande do WhatsApp Web para o seu número da API primeiro.** Isso abre a janela de 24 h; sem
> ela o Chatwoot só consegue mandar template, e o vídeo mostra outra coisa.
>
> 💬 **Escreva as mensagens em inglês.** A regra da Meta é sobre a *interface*, não sobre o conteúdo
> — mas com as duas coisas em inglês não sobra nada para interpretar errado.

## 6.5 — O prólogo opcional de 15 s (vale para os dois)

A doc escrita (mais nova) e o [vídeo oficial da Meta](https://www.youtube.com/watch?v=uVUgUKTz130)
(abr/2025, 3 min) **discordam** sobre o vídeo de `whatsapp_business_management`: a doc pede criar
template, o vídeo pede mostrar o Embedded Signup. Dá para atender os dois sem risco — comece com 15 s
do popup:

1. Chatwoot → *Add Inbox → WhatsApp* → conectar
2. O popup da Meta abrindo
3. Avançar até a tela de ativos, mostrando as permissões sendo concedidas
4. **Parar e cortar aí.** Não avance até o número — é onde estoura o #2655111, e vídeo com mensagem
   de erro só atrapalha.

Legenda: `Client grants our app access to their WhatsApp Business Account through Embedded Signup`.

> 🎥 **Assista os 3 minutos do vídeo oficial antes de gravar.** Ele acrescenta três coisas que a doc
> escrita não diz: *"You do not need to provide test credentials or setup. Only videos are
> required"* (não monte ambiente de teste, não passe senha); *"One-liners and vague use cases will
> be rejected"* (por isso os textos do §7 são longos); e que depois da aprovação ainda existe a
> **verificação de acesso**, até 5 dias, separada da análise.

---

# 7 · Os textos do `use_case`

Escreva **em inglês** — os revisores são um time global e o formulário não traduz.

O formulário quer que a descrição responda quatro perguntas: *como isso ajuda o usuário do app; por
que o app precisa; o que o app faz com o dado; por que seria pior sem*.

## 7.1 — ⛔ Não use o botão "Use This" da IA da Meta

Clicar em *Começar* abre um modal com uma **AI Content Suggestion** já escrita e um botão **Use
This**. **Feche a sugestão e escreva o seu.** Os quatro defeitos, que reapareceram idênticos em duas
tentativas (12 e 18/ago):

1. **Contradição interna** — o texto diz *"As a two-store pharmacy chain… we"* e no mesmo parágrafo
   *"our app allows businesses… our users"*, misturando ser o negócio e ser plataforma para
   terceiros. O revisor abre o site e vê um só dos dois. **Duas histórias no mesmo formulário é
   rejeição.**
2. **Promete o que o vídeo não mostra** — *"QR codes"*, *"appointment reminders"*, *"promotional
   messages"*.
3. **É vago** — *"streamline"*, *"seamless experience"*, sem uma única chamada de API concreta.
4. **Termina em `[Your Name]`.**

**O formato dela, porém, é bom e vale reaproveitar** — formato de carta:

1. `Dear App Review Team,` + uma frase dizendo qual permissão e para qual app.
2. **Quem é o dono do app**, em uma frase — sempre na **voz do negócio verificado**, com a agência
   aparecendo como parceira técnica.
3. **Como o acesso é concedido** — "connected through WhatsApp Embedded Signup, once the account
   owner grants the app access…".
4. **Lista numerada de chamadas reais** — uma linha por uso concreto da permissão. É esta lista que
   derruba o *"one-liners will be rejected"*, e ela precisa **bater com o vídeo**.
5. **O que quebra sem a permissão** + **privacidade** (o que se lê/escreve, onde o dado fica, link
   da política) + **assinatura com nome real**.

> 🧭 **Na voz de quem escrever.** O dono do app é o **negócio verificado** do portfólio. Se a
> descrição disser "somos uma agência de automação" mas a política de privacidade e o site forem de
> uma farmácia, o revisor vê a incoerência — motivo clássico de rejeição. Fale na voz de quem a
> verificação do negócio diz que você é.

## 7.2 — Modelo: `whatsapp_business_management`

```
This app belongs to <NEGÓCIO VERIFICADO>, <o que ele faz, em uma linha>, in <cidade, país>. It is
the WhatsApp integration of a shared inbox that runs on the business's own server. <AGÊNCIA> is the
business's technology partner and operates the platform on their behalf.

The business's WhatsApp Business Account is connected through WhatsApp Embedded Signup. Once the
account owner grants the app access, we use whatsapp_business_management to:

1. List the WhatsApp Business Accounts and business phone numbers that were shared with the app, so
   the operator can choose which number becomes a shared inbox.
2. Read the status, display name and quality rating of that business phone number, to confirm it is
   ready to be used as a shared inbox.
3. Subscribe the app to that WABA's webhooks, so incoming messages and message status updates are
   delivered to the correct inbox.
4. Create and read message templates that the business uses to notify customers about orders and
   deliveries, and to check whether those templates were approved.

Without this permission we cannot discover the WABA ID or phone number ID, cannot subscribe to the
webhooks and cannot manage the templates, which means the inbox cannot be created at all. We only
read and write the business assets explicitly granted during Embedded Signup, and only to operate
the messaging channel for this business.
```

## 7.3 — Modelo: `whatsapp_business_messaging`

```
This app gives the staff of <NEGÓCIO VERIFICADO> a shared web inbox for the WhatsApp number their
customers already use. <AGÊNCIA> is the business's technology partner and operates the platform on
their behalf.

During onboarding the app registers the business phone number with the Cloud API, which is required
before that number can send or receive messages through the API. After that, agents open a
conversation in the browser and reply from there. The app calls the Cloud API messages endpoint to
deliver each reply to the customer's WhatsApp. Inside the 24-hour customer service window agents
send free-form replies; outside it, they send an approved template. Incoming messages, delivery and
read statuses, and media are received through webhooks and rendered in the same conversation, so
several employees can serve the same customer without sharing a phone.

We also use this permission for WhatsApp Business app coexistence: the business keeps the WhatsApp
Business app on the counter phone, and the replies typed there arrive in the shared inbox as message
echoes, so the whole team sees a single, complete history.

Without this permission the inbox would be read-only: the business could see what customers write
but could not answer them, which is the entire purpose of the product. Message content is stored
only in the business's own instance, on their own server, and is used solely to provide customer
service.
```

## 7.4 — O campo "Descrição do negócio"

Aparece **no topo de cada cartão**, antes do botão *Começar*, e **fica fora do modal**. É o mesmo
texto nas duas permissões — não precisa variar. Uma frase:

```
<NEGÓCIO> is a <o que é> in <cidade, país>, that <o que vende> and serves its customers over
WhatsApp through a self-hosted shared inbox, so that several employees can answer the same number.
```

---

# 8 · Data Use Checkup

Questionário sobre práticas de tratamento de dados. **Não é texto livre: são declarações que viram
compromisso do app.** Responda o que é verdade hoje — marcar caixa que não se cumpre é pior do que
marcar "Nenhuma das acima", porque a Meta usa isso em auditoria, não na aprovação.

🚫 **Também aqui, não use o "Perguntar para a IA"** — ele responde pelo tech provider genérico.

**O gabarito respondido em 18/ago/2026, campo a campo:**

| Campo | Resposta |
|---|---|
| `processador-0` — há processadores/provedores com acesso aos Dados da Plataforma? | **Sim** (a tradução da tela exibe a opção como *"Tentar"* — é o "Yes" do original) |
| `responsável-1` — entidade controladora | razão social + nome fantasia, **batendo com o que foi verificado** em *Business settings → Informações do negócio* |
| `responsável-2` — país da controladora | Brasil |
| `solicitações-3` — forneceu dados a autoridades por segurança nacional nos últimos 12 meses? | **Não** (mandado judicial e investigação criminal **não** contam — o enunciado exclui) |
| `solicitações-4` — políticas sobre pedidos de autoridades | análise da legalidade · minimização de dados · documentação das solicitações |

Ficou **de fora** de `solicitações-4` a opção *"Disposições para contestar esses pedidos"*: pressupõe
estrutura jurídica para litigar.

**Os processadores** (o modal é um por processador — preencher uma vez para cada):

| Campo | Exemplo: a hospedagem | Exemplo: a agência |
|---|---|---|
| nome | `Hostinger International Ltd.` | `<SUA MARCA>` |
| categoria | **Soluções e serviços de TI, incluindo armazenamento e processamento na nuvem** | idem |
| países | **Brasil** (onde o servidor está) + **Lituânia** (o suporte do fornecedor acessa remotamente) | **Brasil** |

> 🚩 **A caixa perigosa da lista de categorias é "Monitoramento legal e policial"** — marcá-la diz à
> Meta que você entrega dados a fornecedor de vigilância, contradiz o "Não" de `solicitações-3` e
> reprova.
>
> ⚠️ **Marcar "Não" em `processador-0` é a inconsistência clássica:** dizer que não há processador
> enquanto os dados moram em VPS alugada.

**Papéis, para não errar na hora:** o **controlador é o cliente** (é dele o dado e a decisão de uso);
**a agência e a hospedagem são operadores**, agindo sob instrução. Se a pergunta falar em
"terceiro", a agência não é terceiro — é *service provider*.

---

# 9 · Submeter e esperar

**O caminho, do começo ao fim:**

1. `developers.facebook.com/apps/<APP_ID>/app-review/permissions/`
2. Para **cada** permissão: abrir o cartão → colar a descrição (§7) → subir o vídeo (§6) → conferir
   a caixinha de chamadas de API
3. Completar o **Data Use Checkup** (§8)
4. **Submit for Review** e aceitar os *Platform Onboarding Terms*

> 🔴 **Rascunho não é submissão.** *"Submissions in draft mode will not be reviewed, so don't forget
> to submit your App Review submission!"* Depois de submeter, `devtools_app_review status` mostra
> `submission_status: PENDING` e `is_pending: true`.

**O que acontece depois:**

| | |
|---|---|
| A tela diz | *"Review in progress — most submissions are reviewed within 20 days"* |
| A doc do WhatsApp diz | ~24 horas |
| **O que aconteceu de verdade** | **10 dias** (18 → 29/ago/2026) |
| Depois da aprovação | ainda há a **verificação de acesso**, até 5 dias |

**Planeje com a folga da Meta, não com a média.**

⛔ **Durante a análise, nada pode ser reenviado.** `can_submit` volta `false`: *"Não é possível
enviar para a análise do app enquanto um envio anterior estiver em análise."*

⛔ **Não mexa em *Configurações → Básico* depois de submeter** — *"making changes to your app's basic
or advanced settings after you have submitted may require re-review."*

✅ **Sinal de sucesso final** (`devtools_app_review status` / `privileges`):

```
submission_status: ACTIONED · is_approved: true
whatsapp_business_messaging  → access_level: advanced · is_live: true
whatsapp_business_management → access_level: advanced · is_live: true
```

---

# 10 · O dia de conectar o número

Combine hora com o cliente. Alguém precisa estar **com o celular na mão**, no balcão.

**Avise antes** (é a hora de dizer, não depois):

- **listas de transmissão são desativadas** — as existentes viram somente leitura;
- **todos os dispositivos vinculados caem** — o WhatsApp Web vai precisar ser religado;
- mensagens temporárias, "ver uma vez" e localização ao vivo saem do ar;
- grupos e catálogo continuam no app, mas **não** pela API;
- o app precisa estar em **2.24.17+**.

**O fluxo:**

1. Na ferramenta, rode o **Embedded Signup**.
2. Escolha **o portfólio do cliente** — que agora aparece **habilitado**. Se estiver cinza, o app
   está no portfólio errado (§4.1).
3. Escolha **"Conectar um app do WhatsApp Business"** e digite o número da loja.
4. O WhatsApp mostra um **código de verificação**.
5. No celular chega mensagem da **Official Facebook Business Account** → **Connect** → **Connect to
   the Business Platform** → **Confirm** (é aqui que se decide compartilhar o histórico) → colar o
   código.

> ⏱️ **A janela de 24 horas.** Concluído o fluxo, há **apenas 24 h** para sincronizar contatos e
> histórico. Passou disso, é desconectar e refazer. **Sincronize imediatamente** e peça para manter
> o app aberto. Vêm mensagens de até 180 dias (em 3 fases), mídia só dos últimos 14 dias, grupos não
> entram.

**Teste com número descartável antes do número principal.** Se der errado, o cliente não fica sem
atender.

✅ **Conferir por API, no número:** `is_on_biz_app: true` · `platform_type: CLOUD_API` ·
`status: CONNECTED` · `Account mode: Live`.

**Depois, dois passos que ninguém lembra:**

1. **Inscrever o app na WABA nova:** `POST /<WABA_ID>/subscribed_apps`. WABA sem app inscrito não
   entrega nada — e **não dá erro, só silêncio**.
2. **Apontar o override de callback do número** para a inbox daquele cliente. É assim que um app da
   agência serve vários:

```
app da agência
 ├── WABA do cliente A → override → https://chat.clienteA.com/webhooks/whatsapp/<numero>
 ├── WABA do cliente B → override → https://chat.clienteB.com/webhooks/whatsapp/<numero>
 └── ...
```

> **A WABA nova não herda os templates.** Número que entra em WABA nova precisa dos templates
> **submetidos de novo** lá. Conte esse prazo no cronograma.

**Como se desfaz** (a resposta que derruba a objeção do cliente): quem desconecta é a própria loja,
no celular — *Configurações → Conta → Plataforma de Negócios → Desconectar conta*. Não usa API, não
pede PIN, e o número segue no app com as conversas.

---

# 11 · Catálogo de erros

## 11.1 — `meu-cliente` aparece cinza, com "This Meta Business Account owns the app"

O app está no portfólio **do cliente**. Não há ajuste que resolva — app novo no portfólio da
agência. §4.1.

## 11.2 — `#2655111` ao digitar o número no Embedded Signup

> *"O app do parceiro não tem as permissões de mensagens e Gerenciamento do WhatsApp Business
> avançadas que são necessárias para a integração."*

Falta o Acesso Avançado. É o que este documento inteiro resolve. **Ser admin do app não substitui**:
papel dá Acesso Padrão, que só opera os seus próprios ativos.

## 11.3 — O popup morre em "Sorry, something went wrong"

Configuração de login montada à mão, com permissões-fantasma do contador de mão única. Apague e
**recrie pelo modelo**. §4.3.

## 11.4 — Erro de domínio não autorizado no popup

O domínio da ferramenta está em só um dos dois campos. Precisa estar em `js_sdk_host_domains`
**e** `oauth_redirect_uris`. §4.3.

## 11.5 — Tudo verde e o número continua mudo

Verificar a URL do webhook **não é** assinar o campo `messages`. São dois botões. §4.4.

## 11.6 — `grant_status: REJECTED` em permissões que você nunca pediu

Estado padrão de permissão nunca analisada, com `rejection_reasons` vazio. Não é reprovação. §5.1.

## 11.7 — A API diz `screencast: false` com a submissão aceita

Divergência conhecida entre API e tela. Quem manda é o formulário. §5.4.

## 11.8 — A inbox morre sozinha ~60 dias depois

⚠️ **Pendência conhecida, não resolvida.** O `Whatsapp::TokenExchangeService` troca o `code` por um
access token de 60 dias e guarda em `provider_config['api_key']`. Existe um
`Whatsapp::ReauthorizationService`, mas **não foi verificado se ele renova sozinho**. Se não
renovar, a inbox cai sem aviso. **Verifique antes de considerar a entrega fechada.**

---

# 12 · Checklists

**Antes de abrir o formulário**

- [ ] Verificação do negócio da **agência** aprovada
- [ ] As 3 URLs legais no ar, em HTTPS, **da agência**
- [ ] App no portfólio da **agência**, novo, sem rejeição no histórico
- [ ] Ícone 1024×1024 sem marca da Meta · categoria · finalidade **Clientes**
- [ ] Domínio da ferramenta nos **dois** campos
- [ ] Configuração de login criada **pelo modelo** · `config_id` anotado
- [ ] Webhooks `messages` + `smb_message_echoes` + `account_update` assinados
- [ ] Chatwoot: 4 chaves gravadas + `GlobalConfig.clear_cache` + flag `..._inbox_creation` ligada
- [ ] Popup abre e oferece **"Conectar um app do WhatsApp Business"**
- [ ] 1 chamada de API por permissão, há pelo menos 2 dias

**Antes de clicar em Submit**

- [ ] Dois arquivos de vídeo **separados**, um por permissão
- [ ] Nenhum cliente real em nenhum frame
- [ ] **Sem áudio** nos dois
- [ ] Legendas em inglês nos pontos não óbvios
- [ ] 1080p, cursor visível, só a janela no quadro
- [ ] Vídeo 1 termina **depois** do Submit do template, com ele *In review*
- [ ] Vídeo 2 mostra o envio **e** a chegada, sem corte no meio
- [ ] Descrição escrita nas **duas** permissões, diferentes entre si
- [ ] Nenhuma permissão além das duas no carrinho
- [ ] Data Use Checkup respondido
- [ ] Nada mexido em *Configurações → Básico*

**Depois de aprovado**

- [ ] `access_level: advanced` e `is_live: true` nas duas
- [ ] Verificação de acesso concluída (até 5 dias)
- [ ] Número do cliente conectado, `is_on_biz_app: true`
- [ ] `POST /<WABA_ID>/subscribed_apps` feito
- [ ] Override de callback apontando para a inbox certa
- [ ] Templates ressubmetidos na WABA nova
- [ ] Renovação do token de 60 dias verificada (§11.8)

---

# 13 · Fontes

- 🎥 [Mastering the App Review Process (Meta Developers, 3 min)](https://www.youtube.com/watch?v=uVUgUKTz130) — assista antes de gravar
- [App Review — WhatsApp Solution Providers](https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/app-review/) — o que cada permissão exige e os screenshots dos vídeos-modelo
- [App Review — Tutorial](https://developers.facebook.com/documentation/resp-plat-initiatives/appreview/tutorial) — os passos do formulário, as regras de gravação e os erros comuns
- [Screen Recordings](https://developers.facebook.com/docs/app-review/submission-guide/screen-recordings/) — regras de gravação com exemplos
- [Permissions — WhatsApp](https://developers.facebook.com/documentation/business-messaging/whatsapp/permissions)
- **A lógica e o Caminho A:** [manual mestre](MANUAL-SUBIR-NUMERO.md)
- **A ferramenta do §3, instalada do zero:** [github.com/plasdigital/vps-kit-aluno](https://github.com/plasdigital/vps-kit-aluno)

> 🔎 **Os links da Meta acima mudam de endereço com frequência.** Se algum der 404, peça ao seu
> agente de IA para procurar a página atual antes de seguir o que está escrito aqui.
