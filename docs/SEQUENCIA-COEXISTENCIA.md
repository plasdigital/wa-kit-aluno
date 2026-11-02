# WhatsApp oficial do cliente: da BM nova ao Chatwoot atendendo

A ordem completa, de um cliente sem nada até o Chatwoot atendendo pela coexistência (o número
continua no app WhatsApp Business do celular e passa a receber também pela API). Nasceu dos
tropeços reais: a BM nova que se esquece de criar, as travas da verificação, o número inelegível.

Este documento é a **porta de entrada e a ordem**. O detalhe de cada tela está nos outros
manuais desta pasta:

| Detalhe | Onde |
|---|---|
| A lógica (qual caminho, quanto custa, número de teste) | [`MANUAL-SUBIR-NUMERO.md`](MANUAL-SUBIR-NUMERO.md) |
| App Review tela por tela, vídeos, textos, catálogo de erros (§11) | [`MANUAL-APP-REVIEW.md`](MANUAL-APP-REVIEW.md) |
| Número inelegível: cada código e onde se resolve | [`MANUAL-NUMERO-INELEGIVEL.md`](MANUAL-NUMERO-INELEGIVEL.md) |
| VPS + Chatwoot + n8n do zero | kit irmão [github.com/plasdigital/vps-kit-aluno](https://github.com/plasdigital/vps-kit-aluno) |
| Templates (sempre categoria **utilidade**) | `templates.mjs`, na raiz desta pasta: `validar` antes de `criar` |

Antes de tudo, anote num arquivo do projeto do cliente a etapa em que ele está, os IDs e o que
já foi feito. **Nunca confie na memória sobre "qual BM é qual"**: confira o nome e o ID de cada
portfólio (Meta Business Suite → Configurações → Informações do negócio) antes de clicar.

## A regra que mais custou: dois portfólios

> **O portfólio dono do app nunca é o portfólio onde estão os números.** Se forem o mesmo, o número
> aparece cinza ("This Meta Business Account owns the app") ou dá #1690130, e nenhum ajuste resolve:
> é por desenho. Custou duas semanas no caso real.

**Modelo atual (três clientes reais, out/2026):** o cliente cria uma **BM nova, só para o app**, no nome dele, e é
ela que passa pela verificação do negócio. Os números, a página e os anúncios ficam na BM principal, a
que ele já usava. (O processo de agosto punha o app no portfólio da agência; vale a mesma regra, mas o
padrão agora é a BM nova do cliente.)

- Não transferir app de portfólio: a transferência começa removendo a verificação.
- Não conectar na BM errada para "migrar depois": WABA não migra.
- Não reaproveitar app com rejeição no histórico.

## Regras para conta de cliente

1. **Tudo é criado com o e-mail e a conta do cliente**, nunca com a sua. Você entra com o acesso do cliente.
2. **Senha simples e fácil de lembrar**, com o nome da empresa (ex.: `Empresa@2026`), e o cliente troca depois. Fica no `.env.local` da pasta do cliente, nunca no git.
3. **Acesso e senha só no grupo do cliente**, nunca no privado.
4. **Você é parceiro, não dono.** O app, o portfólio e o Chatwoot são do cliente; você opera.

## A sequência

`[C]` = o cliente faz ou fornece · `[P]` = você (a agência) faz · ⏳ = espera da Meta (seguir em paralelo)

| # | Etapa | Quem | O que trava aqui |
|---|---|---|---|
| 0 | **Acessos** no grupo: Gmail do projeto, você admin da BM principal, o portfólio da sua agência como **parceiro** (WABA, anúncios, página, Instagram), Hostinger, DNS, lista da equipe, quais números e se rodam no app Business | C | Parceria que dá "não permitida": tentar de novo pelo lado do cliente |
| 1 | **BM nova só para o app**, no nome do cliente | C | Portfólio novo bloqueado por "atividade suspeita": esperar a análise ou outra pessoa criar |
| 2 | **Verificação do negócio** dessa BM nova, **no dia 1** (CNPJ + documentos; o nome verificado é o que sai nas páginas legais) | C ⏳ | ~2 dias úteis, às vezes mais. Associação também passa (caso de uso "App requires access to permissions"). Sem ela, o App Review não deixa submeter |
| 3 | **VPS + domínio**: Hostinger KVM 2 (a KVM 1 não aguenta), e os registros A `chat.`, `n8n.`, `webhook.`, `portainer.` | C | Sem domínio do cliente: usar um provisório seu e **trocar antes de submeter** o App Review |
| 4 | **Chatwoot + n8n** na VPS (Docker, Traefik, Portainer), superadmin no e-mail do cliente | P | ~40 min (2 h na 1ª vez) |
| 5 | **Páginas legais em HTTPS**: privacidade, termos e **exclusão de dados** | P | A de exclusão é a mais esquecida. URL que dá 404 é recusada; placeholder do Facebook reprova |
| 6 | **App** no Meta for Developers, dentro da BM nova: 3 URLs, ícone 1024 **sem** logo do WhatsApp, finalidade "Clientes", domínio do Chatwoot em `js_sdk_host_domains` **e** `oauth_redirect_uris`, configuração de login **pelo modelo** | P | Popup "Sorry, something went wrong": configuração de login feita à mão, recriar pelo modelo. Erro de domínio: está só num dos dois campos |
| 7 | **Número de teste** (chip livre, sem WhatsApp no aparelho) + **cartão e moeda BRL na WABA** | C+P | Sem cartão: erro 131042 e não dá para gravar o vídeo 1. `register` aceita 10 tentativas a cada 72 h |
| 8 | Chatwoot: as 4 chaves no `InstallationConfig` (por `rails runner`, nunca por variável), caixa do número de teste, webhook do app (`messages`, `smb_message_echoes`, `account_update`) | P | Número mudo com tudo verde: WABA sem `subscribed_apps`, ou caixa criada antes do webhook |
| 9 | **Uma chamada de API por permissão** logo no 1º dia (listar templates, enviar uma mensagem) | P ⏳ | A Meta leva até 2 dias para registrar a chamada |
| 10 | **App Review**: 2 vídeos sem áudio, em inglês, textos, Data Use Checkup → Submit. Pedir **só** `whatsapp_business_management` e `whatsapp_business_messaging` | P ⏳ | 4 a 11 dias observados (a tela fala em até 20). **Durante a análise não se mexe em Configurações → Básico.** Aprovação parcial (só messaging) não basta: as duas são obrigatórias (#2655111) |
| 11 | **Dia da conexão** (Embedded Signup pelo Chatwoot), com alguém do cliente com o celular: app Business 2.24.17+, **listas automáticas desligadas** | C+P | Número **inelegível**: **digitar o número** em vez de escolher na lista, para aparecer o código, e ir ao [documento dos códigos](MANUAL-NUMERO-INELEGIVEL.md). Escolher a **BM principal** (a dos números). Sincronizar o histórico em menos de 24 h |
| 12 | **Pós-conexão**: `subscribed_apps` na WABA, override de callback, **templates de novo** (WABA nova não herda), conferir `is_on_biz_app: true` | P | — |
| 13 | **Agente de IA** no Chatwoot: chave de IA no nome do cliente, atributo `ia_pausada`, usuário "Agente IA", trava de telefones de teste | C+P | Atendente humano que não quer notificação: tirar como responsável, não desligar a notificação |

**Enquanto a Meta analisa** (passos 2, 9 e 10): páginas legais, domínio, VPS e Chatwoot, número de
teste com template aprovado, agente montado e atendendo só os telefones de teste.

## Travas que não estão na sequência

- **Ligação não chega no número em coexistência:** é o aparelho (Privacidade → Ligações → "Silenciar desconhecidos" e permissões do app). **Não ligar a Calling API**: ela desvia as chamadas do celular.
- **Instagram que não conecta:** o Instagram tem app secret próprio; usar o do Facebook dá erro 100. Sem processo escrito ainda: o que se descobrir entra aqui.
- **Token:** o permanente é o do **usuário do sistema** (`expires_at: 0`). O "depurado" dura 60 dias e morre se a senha mudar. Ordem: app no BM → parceria → atribuir os ativos ao usuário do sistema → gerar o token. O token que o Embedded Signup grava no Chatwoot vence em 60 dias, e ainda não se conferiu se renova sozinho: anotar a data no arquivo do projeto do cliente.
- **Nome de template apagado** fica bloqueado por 30 dias.

## O que pedir ao seu agente de IA

1. **"O que falta"** em lista, separado por dono (`[C]` cliente · `[P]` você · ⏳ esperando a Meta),
   com o próximo passo de cada um, conferido pela API (`diagnostico-numero.mjs`) e não de memória.
2. **A mensagem de status para o grupo do cliente:** o que já está pronto, o que depende deles e o
   prazo de cada espera.
3. **Para o App Review:** as descrições de cada campo e o roteiro do vídeo em frases de 3 ou 4
   palavras, a partir dos §6 e §7 do [`MANUAL-APP-REVIEW.md`](MANUAL-APP-REVIEW.md).
4. **Trava nova?** Anote no arquivo do projeto do cliente, com a data e o código de erro.
