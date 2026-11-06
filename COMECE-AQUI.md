# Comece aqui — do zero até o número enviando pela API oficial

Este arquivo é a ordem. Ele parte de **quem nunca abriu o developers.facebook.com** e vai até a
primeira mensagem saindo pela API. O detalhe de cada etapa está nos manuais em `docs/` —
aqui está só a corrente, na ordem que funciona. Vai ligar o número de um **cliente** pela
coexistência? A ordem desse caso, com quem faz o quê, está em
[`docs/SEQUENCIA-COEXISTENCIA.md`](docs/SEQUENCIA-COEXISTENCIA.md).

> 🗣️ **Você não precisa decorar comando nenhum.** Abra o Claude Code (ou Codex, ou Cursor) dentro
> desta pasta e converse em português: *"me conduza pelo Caminho A, uma etapa por vez"*. A pasta
> se explica sozinha para ele — é o que o `AGENTS.md` faz.
>
> 🧭 **A primeira coisa que ele vai fazer é perguntar o que você já tem**: BM, verificação do
> negócio, site, domínio, VPS, app, número. Separe os prints dessas telas e, se puder, dê acesso a
> ele. Não tem VPS? O kit irmão monta: [github.com/plasdigital/vps-kit-aluno](https://github.com/plasdigital/vps-kit-aluno).
>
> 📚 **A documentação oficial da Meta manda mais que este kit.** A Meta muda tela, regra e preço
> o tempo todo. O agente confere a doc do dia antes de cada etapa e sempre que der erro; se ele
> afirmar uma regra sem link da Meta, peça a fonte.

---

## Antes de tudo: fazer ou contratar?

Esta decisão vem antes da técnica, e ela é legítima nos dois sentidos.

| | **Contratar** um provedor (ManyChat, Zenvia, Take, Chatwoot Cloud…) | **Ser** o provedor (este kit) |
|---|---|---|
| De quem é o app na Meta | deles | **seu** |
| App Review | não existe para você | ~4 h de trabalho + ~10 dias de espera |
| Preço da mensagem | preço da Meta **+ margem deles** | preço da Meta, direto |
| Atender **clientes** com número deles | não | **sim — é isto que este kit monta** |
| Trocar de ferramenta depois | perde o número, ou vira migração | o número é seu; a ferramenta é detalhe |

**A régua não é a marca da ferramenta, é a posse do app.** O mesmo Chatwoot aparece dos dois
lados: contratado na nuvem deles, o app é deles; instalado na sua VPS, o app é seu.

⚠️ **Zero configuração não é zero burocracia.** Mesmo contratando, alguém cria conta no Facebook,
tem portfólio comercial e passa pela verificação do negócio. O que se compra é o App Review e a
integração — não a burocracia.

---

## Qual é o seu caminho

| Sua situação | Caminho |
|---|---|
| Quero um número **novo**, só para automação e disparo | **A** — comece na etapa 1 e siga até o fim |
| Quero usar o número **que a empresa já atende no celular** | **B** — mas faça o **A antes**, com um chip qualquer |

> 🧱 **Isto reordena tudo, e é o que quase todo mundo descobre tarde:** o Caminho B exige App
> Review aprovado; o App Review exige dois vídeos; e os dois vídeos só se gravam com um número
> **seu** já funcionando na Cloud API. **O Caminho A não é a alternativa ao B — é o passo
> anterior.** Quem tenta começar pelo B para de pé no meio do processo.

---

## A corrente do zero

```
1. conta pessoal no Facebook ─┐
2. portfólio comercial (BM)   │
3. verificação do negócio ────┼─ isto tudo ANTES de qualquer comando
4. páginas legais no seu site │
5. app na Meta ───────────────┘
   └──► 6. WABA + número → 7. credenciais → 8. REGISTRO → 9. template → 10. webhook
```

### 1. Conta pessoal no Facebook *(óbvio)*

O perfil comum, de pessoa física. Tudo na Meta pendura nele — não existe conta "de empresa" solta.
**Deu certo quando:** você entra em `business.facebook.com` sem cair na tela de cadastro.

### 2. Portfólio comercial

Também chamado de **gerenciador de negócios** ou **BM** — *é a mesma coisa*, e saber disso evita
achar que está na tela errada. É a "empresa" dentro da Meta: é dela que o app vai ser.
Logo depois de criar, preencha as **Informações da empresa**: nome legal (a razão social do CNPJ),
país e site. Faltando isso, a Meta bloqueia o envio ("restricted from messaging users in this
country") e a verificação reprova, e durante a análise a edição desses campos pode travar.
**Deu certo quando:** o portfólio aparece em `business.facebook.com/settings` com um nome seu e as
Informações da empresa sem campo vazio.

### 3. Verificação do negócio ⏳ *(a mais demorada — comece por ela)*

A Meta conferindo que a empresa existe: CNPJ, endereço, documento. Leva **dias**.

**É obrigatória?** Depende do caminho, e a resposta importa:

- **Caminho A:** não trava nada — mas sem ela você fica com teto de **250 conversas iniciadas por
  dia**. Dá para começar sem.
- **Caminho B:** **trava**. Sem `business_verification_passes: true` o formulário do App Review
  nem deixa submeter.

**Deu certo quando:** a Central de Empresas mostra o selo de verificado no portfólio.

> ⏳ Enquanto ela roda, **não fique parado**: as etapas 4, 5, 6 e 7 não dependem dela.

### 4. Três páginas em HTTPS no seu site

Política de privacidade, termos de uso e **exclusão de dados** — as três públicas, no seu domínio.
Sem elas o app não fica em modo *Live*, e sem *Live* não há App Review.
**Deu certo quando:** as três abrem no navegador anônimo, com cadeado.

### 5. O app no Meta for Developers

Em `developers.facebook.com` → criar app → adicionar o produto **WhatsApp**.

> 🔴 **O app tem que estar no portfólio da SUA empresa (ou da sua agência) — nunca no do
> cliente.** Se o portfólio dono do app for o do cliente, o Embedded Signup dele aparece cinza,
> com "This Meta Business Account owns the app", e não há configuração que resolva: é refazer.
> Foi o erro que custou duas semanas no caso real deste manual.

**Deu certo quando:** o app aparece na sua lista e o painel do WhatsApp abre dentro dele.

**Logo em seguida, ainda nesta etapa:**

- **o token do usuário do sistema** — é ele que dá ao seu agente o acesso ao app. Em
  `business.facebook.com` → *Configurações do negócio* → *Usuários do sistema*: crie um
  administrador, adicione o app como ativo (controle total), gere o token marcando
  `whatsapp_business_management` e `whatsapp_business_messaging` e cole no `.env.local`
  (`cp .env.exemplo .env.local` primeiro). Ele aparece uma vez só.
- **as configurações básicas e a publicação do app** — *Configurações do app → Básico*: ícone,
  categoria, e-mail de contato e as três URLs da etapa 4; depois, publicar o app. O agente
  conduz por print.

> 🔎 **Nesta etapa ainda não tem ID para procurar.** O ID da conta (WABA) e o do número só
> entram depois que o número estiver conectado (etapa 6); na etapa 7 o agente tenta achar sozinho
> com `node descobrir-ids.mjs --gravar` antes de pedir para você.

### 6. WABA, número e nome de exibição

A **WABA** é a conta de WhatsApp Business dentro do app; o número mora nela. Adicione o número e
escolha o nome de exibição (é ele que o cliente final vê).

⚠️ Use um chip que **não esteja** com WhatsApp comum instalado — no Caminho A, o número sai do
celular. Se já tiver, apague a conta do WhatsApp nele antes.
**Deu certo quando:** o número aparece no WhatsApp Manager, mesmo que como "não registrado".

### 7. As credenciais

O `WA_TOKEN` (do usuário do sistema) você já colou na etapa 5. Com o número conectado (etapa 6), o agente acha os IDs; se não aparecerem, ele pede para você, dizendo onde ficam:

```bash
node descobrir-ids.mjs --gravar
```

Depois, o comando que não gasta nada e diz a verdade:

```bash
node diagnostico-numero.mjs
```

**Deu certo quando:** ele lista o número e traduz o status (provavelmente 🟡 *não registrado* —
é o esperado nesta altura).

⚠️ Usou o token temporário do painel em vez do usuário do sistema? Ele vale **24 horas**: troque
pelo do usuário do sistema (§A7 do manual) antes de seguir.

### 8. 🎯 O registro — a etapa que não tem botão

**O painel da Meta não registra número. Nunca registrou.** Ele adiciona e verifica a posse; quem
registra para uso na Cloud API é a API, em três comandos:

```bash
node registrar-numero.mjs request-code sms      # a Meta manda um código de 6 dígitos para o chip
node registrar-numero.mjs verify-code 123456    # confirma que o número é seu
node registrar-numero.mjs register 654321       # registra E cria o PIN de duas etapas
```

O `654321` é um PIN de **6 dígitos que você escolhe**. Ele vira o PIN de verificação em duas
etapas do número e é exigido para excluir o número depois — **anote agora**.

> 🧱 **A trava mais cara do processo inteiro:** são **10 tentativas por número a cada 72 horas**.
> Estourou, o número fica travado por 3 dias (erro `133016`) e não existe suporte que acelere.
> Por isso os três passos são comandos separados, e por isso o diagnóstico vem antes.

**Deu certo quando:** `node diagnostico-numero.mjs` mostra 🟢 `CONNECTED`.

### 9. O primeiro template

Fora da janela de 24 horas, template é o **único** jeito de iniciar conversa. Toda criação passa
por aprovação da Meta.

```bash
node templates.mjs modelo boas_vindas.json   # gera um JSON de partida
node templates.mjs validar boas_vindas.json  # confere as regras — não envia nada
node templates.mjs criar boas_vindas.json    # valida de novo e manda para aprovação
```

O `validar` roda local e pega o que mais reprova: nome fora do padrão, limite de caracteres,
variável sem exemplo, variável fora da ordem, body começando ou terminando com variável, botão
intercalado, marketing sem opt-out.

**Deu certo quando:** `node templates.mjs listar` mostra o template como `APPROVED` (costuma levar
de minutos a algumas horas).

### 10. O webhook — para o número **receber**

Registrado, o número **envia**. Para **receber**, a Meta precisa de uma URL sua em HTTPS e da
assinatura do campo `messages`.

> ⚠️ Cadastrar a URL **não é** assinar o campo. É o motivo nº 1 de "está tudo verde e não chega
> mensagem": a URL está lá, o campo `messages` não foi marcado.

**Deu certo quando:** você manda uma mensagem para o número pelo celular e ela aparece no seu
n8n / Chatwoot / log.

---

## 🏁 A prova

Envie uma mensagem pela API para o seu próprio WhatsApp pessoal e responda por ele. Se a saída
chegou e a resposta apareceu do seu lado, o Caminho A está fechado — **e você já tem o cenário de
gravação dos vídeos do App Review**.

## E depois — o Caminho B (coexistência)

Com um número seu funcionando, a ordem é:

1. montar a ferramenta que tem o botão do Embedded Signup — o Chatwoot na sua VPS resolve, e há
   um kit pronto para isso: [github.com/plasdigital/vps-kit-aluno](https://github.com/plasdigital/vps-kit-aluno);
2. preparar o app: URLs, domínios autorizados nos **dois** campos, configuração de login **pelo
   modelo**, webhooks;
3. fazer **uma chamada de API por permissão** — ela leva até 2 dias para registrar, então faça no
   primeiro dia;
4. gravar os **dois vídeos** (um por permissão);
5. submeter e esperar ~10 dias;
6. no dia combinado, rodar o Embedded Signup com o cliente do lado e conectar o número dele.

Tudo isso, tela por tela, está em [`docs/MANUAL-APP-REVIEW.md`](docs/MANUAL-APP-REVIEW.md).

> 🎯 **No dia de conectar:** **digite** o número do cliente, não escolha na lista. Se ele vier
> *inelegível*, o código do erro diz onde resolver — está tudo em
> [`docs/MANUAL-NUMERO-INELEGIVEL.md`](docs/MANUAL-NUMERO-INELEGIVEL.md). Um que a Meta não
> documenta, e que já travou um caso real: as **listas automáticas** ligadas no celular (`#3441061`).

> 🗣️ **O jeito mais rápido de usar isto:** abra seu agente de IA nesta pasta e diga
> *"leia o AGENTS.md e me conduza pelo App Review, uma etapa por vez, conferindo a documentação
> oficial antes de cada passo"*.
