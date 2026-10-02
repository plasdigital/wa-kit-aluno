# Número inelegível na coexistência: os bloqueios e onde se resolve cada um

> **Para que serve:** você está conectando o número que a loja já usa no celular (coexistência, §6 do
> [manual mestre](MANUAL-SUBIR-NUMERO.md)). No Embedded Signup, o número aparece como
> **inelegível** ou dá erro. Este documento traz **cada motivo que a Meta reconhece**, o que ele quer
> dizer e **onde se resolve**: no celular, no portfólio, no WhatsApp Manager ou no app da agência.
> Alguns não se resolvem, e é preciso esperar.
>
> **Escrito em 02/out/2026**, depois de um caso real em que o número ficou "inelegível" por um
> motivo que **não aparece na documentação da Meta** (o #3441061, das listas automáticas).
> Os códigos foram conferidos na [página oficial de erros do Embedded Signup](https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/errors/)
> e na de [requisitos da coexistência](https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users).

---

## 1. 🎯 O macete: digite o número, não escolha na lista

Esta seção vale mais do que o resto do documento.

No Embedded Signup, a tela do número pode mostrar uma **lista** dos números que o portfólio já tem.
Um número escolhido nela pode aparecer assim:

> *Ineligible — This number can't be shared with this app*

**Esse aviso não traz o motivo.** É um bloqueio genérico, e não há como saber o que consertar.

Para descobrir, **force o cadastro**. Escolha a opção de **conectar um app do WhatsApp Business
existente** e **digite** o número à mão. A Meta faz então a checagem completa e devolve a mensagem
real, **com o código** (`#3441061`, `#2655082`…). Com o código na mão, a tabela da §3 diz onde se
resolve.

> ⛔ **Nunca escolha "Enter a new phone number" / registrar com SMS para um número de coexistência.**
> Esse caminho é para número novo (Caminho A). Num número que está no celular da loja, ele tira o
> WhatsApp do aparelho.

**No caso real:** escolhido na lista, o número aparecia como *Ineligible*. Digitado, a Meta
respondeu *"already linked to Automatic Events"*. Desligadas as listas automáticas no celular, o
erro sumiu. Antes disso, três hipóteses erradas tinham sido testadas: Plataforma comercial,
Business Manager e Página do Facebook.

---

## 2. Onde se resolve: os cinco lugares

| Ícone | Lugar | Quem mexe |
|---|---|---|
| 📱 | **Celular da loja** — o app WhatsApp Business (Configurações, Ferramentas comerciais) | alguém da loja, com o aparelho na mão |
| 🏢 | **Meta Business Suite / Configurações do negócio** do **cliente** (`business.facebook.com`) | admin do portfólio do cliente |
| 🧰 | **WhatsApp Manager** (a conta WhatsApp, a WABA, e os números dela) | admin do portfólio dono da WABA |
| 🛠️ | **App da agência** no `developers.facebook.com` e a ferramenta (Chatwoot) | a agência |
| ⏳ | **Lugar nenhum.** Esperar, ou usar outro número | ninguém |

A maioria dos bloqueios de **número** se resolve no 📱 celular. Os do **app** (§4) são da agência.

---

## 3. A tabela: código → o que é → onde resolve → como

### 📱 Resolve no celular (app WhatsApp Business)

| Código | Mensagem (resumida) | O que quer dizer | Como resolver |
|---|---|---|---|
| **#3441061** ⚠️ *fora da doc* | *"already linked to Automatic Events. To use it for Embedded Signup, turn off Auto lists in Business Tools > Lists"* | o app está usando os **Eventos automáticos**, que separam as conversas sozinho em listas (novo pedido, pedido pago…) | **Configurações → Ferramentas comerciais → Listas → desligar as listas automáticas.** Espere 1–2 min e refaça digitando o número |
| **#3441049** | *"already registered with the product"* | o número **já está ligado** à Plataforma comercial (outro provedor, ou uma tentativa anterior que ficou pela metade) | **Configurações → Conta → Plataforma comercial → Desconectar**. Espere **15 min**. Se a tela mostra *"Conectar"*, não é este o problema |
| **#2655094** | *"Please disconnect your business platform to continue"* | igual ao de cima | igual: desconectar a Plataforma comercial nas Configurações e esperar **15 min** |
| **#2655093** | *"already sharing this WhatsApp Business account with a partner"* | a conta já está conectada a **outro parceiro** (outro Chatwoot, outra agência, outro BSP) | **desconectar o parceiro atual no app** e conectar o novo. ⚠️ Isso desliga a integração antiga: confirme com o cliente antes |
| **#4563015** | *"Update your WhatsApp Business App to the latest version"* | app desatualizado. A coexistência exige **2.24.17 ou mais novo** | atualizar o app na loja de aplicativos |
| **#2655095 / #2655048** | *"isn't registered with WhatsApp Business"* | o número está no **WhatsApp comum** (pessoal), ou não está em WhatsApp nenhum | passar o número para o **WhatsApp Business app** e usar um tempo; ou ir pelo Caminho A (número novo) |
| **#2655082** | *"already linked to a Facebook Page… unlink"* | o número está **vinculado a uma Página** do Facebook | a Meta manda desvincular nas **configurações do Meta Business Suite**. No celular: **Ferramentas comerciais → Facebook e Instagram → desvincular**. Revincule depois, se a loja anuncia para esse número |

> 💡 **Vínculo com a Página nem sempre bloqueia.** No caso real, o número estava vinculado à Página
> (para anúncio) e o único bloqueio que apareceu foi o #3441061. **Não desvincule por precaução.** Só
> desvincule se o código #2655082 aparecer.

### 🏢 Resolve no portfólio do cliente (Meta Business Suite)

| Código | Mensagem (resumida) | O que quer dizer | Como resolver |
|---|---|---|---|
| **#3441041** | *"not associated with the business you selected"* | o número pertence a **outro portfólio**, não ao escolhido no fluxo | escolha no fluxo o portfólio certo. Ou desvincule o número do outro portfólio, ou apague-o lá (🧰 WhatsApp Manager) |
| **#2655049 / #2494028** | *"This account is already shared with another partner"* | a WABA já está **compartilhada** com outro parceiro | **Configurações do negócio → Contas → Contas do WhatsApp → Parceiros → remover**. Ou crie uma conta nova no fluxo |
| **#3441047** | *"not available for accounts using marketing messages"* | a WABA escolhida usa a **Marketing Messages API** (Lite) | escolha **outra conta WhatsApp** no fluxo, ou crie uma nova |
| **#2655089 / #3441040** | *"your WhatsApp Business account is currently restricted"* | a conta está **restrita** por violação de política | **Business Support Home** → ver a restrição → pedir revisão |

### 🧰 Resolve no WhatsApp Manager

| Código | Mensagem (resumida) | O que quer dizer | Como resolver |
|---|---|---|---|
| **#3441030** | *"already registered"* | o número já está **na Cloud API** (registrado direto, Caminho A) | se for de vocês: remover o número da WABA antiga (ou `deregister` pela API). Se não for: usar outro número |
| sem código | *"Phone Number has been blocked"* | o número foi bloqueado | ver o alerta na **Visão geral** do WhatsApp Manager / Business Support Home |
| sem código | *"already linked the maximum number of phone numbers"* | o portfólio bateu o limite de números (2 sem verificação; 20 com) | apagar um número parado, ou concluir a verificação do negócio |

### ⏳ Não tem conserto: esperar ou trocar o número

| Código | Mensagem (resumida) | O que quer dizer | O que fazer |
|---|---|---|---|
| **#3441045** | *"isn't eligible to connect to the WhatsApp Business Platform"* | a Meta acha que o número **tem pouca atividade** no app | **usar o app normalmente** por mais tempo e tentar de novo. Não há botão nem apelação |
| **#3441042** | *"unavailable for phone numbers from this region"* | o país do número não tem coexistência liberada | outro número. (O Brasil é liberado.) |
| **#3441033 / #3441046** | *"You have tried too many times"* | muitas tentativas seguidas | parar e tentar **mais tarde**. Insistir piora |
| **#3441051** | *"The phone number entered is invalid"* | número digitado errado | conferir DDI, DDD e o 9 |

### Requisitos que não aparecem como código

- **App 2.24.17 ou mais novo** (o código #4563015 às vezes aparece, às vezes o fluxo só trava).
- **Número que já esteve na API On-Premises** não é suportado.
- **WhatsApp para Windows e WearOS** param de funcionar como aparelho conectado. Os demais
  (WhatsApp Web, o app de Mac) continuam. Isso não bloqueia a conexão, mas avise a loja.

### O que circula por aí, mas não está na documentação

Não trate como regra. Se nada da tabela explicar o bloqueio, vale testar:
- "o número precisa de **7 dias** de uso no WhatsApp Business app antes de conectar";
- "um número que saiu de uma WABA antiga pode levar **1 a 2 meses** para ser aceito de novo".

---

## 4. Quando o problema não é o número, e sim o app

Estes bloqueios acontecem com **qualquer** número. Quem conserta é a agência, no
`developers.facebook.com`. Detalhe e correção estão no §8.3 do [manual mestre](MANUAL-SUBIR-NUMERO.md).

| Sintoma | Causa |
|---|---|
| **#2655111** | o app não tem **Acesso Avançado** (falta o App Review) |
| Portfólio do cliente **cinza**, *"This Meta Business Account owns the app"* | o app foi criado no portfólio do cliente. Precisa ser da agência |
| *"Sorry, something went wrong"* logo ao abrir | configuração de login montada à mão. Recrie **pelo modelo** |
| Erro de domínio | domínio da ferramenta faltando em `js_sdk_host_domains` **ou** `oauth_redirect_uris` |
| O popup não oferece *"Conectar um app do WhatsApp Business"* | a configuração de login não pede coexistência (`featureType: whatsapp_business_app_onboarding`) |

---

## 5. A ordem de diagnóstico (antes do dia, e no dia)

1. **O popup oferece "Conectar um app do WhatsApp Business"?** Se não, o problema é do app (§4).
2. **No celular: o app está em 2.24.17 ou mais novo?** E as **listas automáticas** estão desligadas?
   Desligue antes de começar e economize uma volta.
3. **Na tela Plataforma comercial do celular** (Configurações → Conta): aparece **"Conectar"**
   ou **"Desconectar"**? "Desconectar" significa que o número já está ligado a alguém. Descubra a
   quem antes de desconectar.
4. **Digite o número**, não escolha na lista (§1).
5. Deu erro → **anote o código** → tabela da §3 → resolva **só aquele** → espere o tempo indicado →
   repita o passo 4.
6. Um código por vez. **Não saia desvinculando tudo por precaução.** Cada desvínculo tem custo:
   anúncio, outro parceiro, histórico.

> 🗣️ **Para quem está no balcão:** peça **print da mensagem inteira, com o número entre parênteses**
> (`#3441061:01a0f8d2-…`). Sem o código, o diagnóstico vira chute.

---

## 6. Fontes

- [Erros do Embedded Signup](https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/errors/): a tabela *WhatsApp Business App User Onboarding*, além de *Shared Accounts* e *Rate Limiting*
- [Onboard WhatsApp Business app users](https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users): requisitos e limitações
- [Reconectar clientes desconectados](https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/reconnect-offboarded-coexistence-clients/)
- **#3441061**: visto na tela em 01/out/2026, num caso real. Não constava da página oficial de erros quando este documento foi escrito

*Os códigos e os nomes de menu da Meta mudam. Se a tela não bater com o que está escrito aqui,
confira as duas páginas acima antes de seguir.*
