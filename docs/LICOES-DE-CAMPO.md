# Lições de campo — API oficial do WhatsApp

> O que só se aprende fazendo: cada lição saiu de um caso real (o número da casa e números de
> clientes, ago–nov/2026), escrita de forma genérica. Os manuais dizem **como se faz** cada tela;
> este arquivo diz **onde a coisa trava de verdade** e o que destravou.
>
> ⚠️ **A documentação oficial da Meta manda mais que este arquivo.** Código de erro, tela e regra
> mudam. Antes de aplicar uma lição, confira na doc do dia; se a doc disser outra coisa, vale a doc
> (e esta lição precisa ser atualizada).
>
> Legenda: ✅ confirmado na prática · 🟡 observado, mas sem prova até o fim.
> Última revisão: 06/nov/2026.

## Se você está em…

| Etapa | Vá para |
|---|---|
| Criando a BM ou pedindo a verificação do negócio | [§1](#1--bm-e-verificação-do-negócio) |
| Pagamento, primeiro envio, limite de conversas | [§2](#2--pagamento-e-envio) |
| App, páginas legais, App Review, Tech Provider | [§3](#3--app-e-app-review) |
| Conectando número (coexistência, Embedded Signup) | [§4](#4--conexão-do-número-e-coexistência) |
| Webhook e ferramenta de atendimento (Chatwoot) | [§5](#5--webhook-e-ferramenta-de-atendimento) |
| Templates | [§6](#6--templates) |

---

## 1 — BM e verificação do negócio

**1.1 ✅ Preencha as Informações da empresa logo depois de criar a BM — antes de pedir a verificação.**
Em *Configurações do negócio → Informações da empresa* (*Business Info*): **nome legal**, **país**,
**endereço**, **site**. Vale para **todo** portfólio envolvido: o que é dono do app e o que é dono
dos números. Esquecer isso dá dois problemas ao mesmo tempo:

- a verificação do negócio não passa;
- o número para de enviar com **`130497`** — *"Business account is restricted from messaging users
  in this country"* —, mesmo com número, perfil e empresa no Brasil. Não é país errado. Consultando
  a saúde da conta pela API (`health_status` da WABA), aparecem os motivos reais: **`131000`**
  (*"Your business profile is incomplete. The following fields are required: Legal Name, Country,
  and Website"*) e **`141010`** (verificação do negócio não aprovada).

Durante a análise da verificação, a Meta pode **travar a edição** desses campos (principalmente o
nome legal). Se travou, é esperar a resposta: recusou, preencha e reenvie; aprovou, confira se os
três campos ficaram preenchidos, porque o perfil incompleto é um bloqueio separado.

**1.2 ✅ O nome legal tem que bater letra por letra com a Receita.** É a razão social exatamente como
está no cartão CNPJ. **MEI:** a razão social da Receita costuma terminar com os 11 dígitos do CPF do
titular, e eles entram também. Quando a janela de edição dá *"problem saving your changes"*,
quase sempre são os dados da empresa vazios ou divergentes.

**1.3 🟡 Recusa automática: deixe o "nome alternativo" vazio e mande documento.** Houve recusas em
que a Meta não achou a empresa numa base pública pelo CNPJ e o status ficou `pending_submission`.
O que se fez: deixar vazio o *Alternative business name* quando o nome fantasia não aparece em
documento oficial, e enviar **documentos** (cartão CNPJ atualizado + conta de consumo com o mesmo
endereço). O motivo da recusa **só aparece na Central de Segurança** (ou no Suporte da BM), nunca
pela API.

**1.4 ✅ Combine 1 a 2 semanas de folga com o cliente.** BM nova pode ter a verificação recusada de
primeira, e portfólio recém-criado pode ser bloqueado por "atividade suspeita" (aí é esperar a
análise, ou outra pessoa criar). Somando verificação, App Review (relatos de 10 a 20 dias) e
Verificação de acesso (até 5 dias), quem promete "semana que vem" se queima.

---

## 2 — Pagamento e envio

**2.1 ✅ Cartão cadastrado não é cartão aprovado.** A forma de pagamento vai na conta **do WhatsApp**
(a WABA), não na conta de anúncios — e na WABA **certa**, porque o mesmo portfólio pode ter mais de
uma. Os sintomas de pagamento com problema:

- **`131042`** (*payment method is invalid* / *currency is not configured*): a WABA sem moeda ou sem
  forma de pagamento válida;
- **`141006`**: conta bloqueada para iniciar conversa por erro de pagamento.

🔴 **A API responde `accepted` e a recusa chega segundos depois, pelo webhook.** Sem webhook
ligado, o envio "deu certo" e a mensagem nunca chega. Recadastrar o mesmo cartão não resolveu; trocar
de cartão resolveu. Depois da troca, a Meta leva alguns minutos para liberar.

**2.2 ✅ Responder dentro da janela de 24 h não depende de cartão.** Quando o cliente escreve primeiro,
a resposta sai mesmo sem pagamento. **Template** (iniciar conversa) depende. Por isso o vídeo da
`whatsapp_business_messaging` pode ser gravado antes, e o do template só depois de testar o envio.

**2.3 ✅ O limite de conversas iniciadas por dia é do portfólio inteiro.** Os números do mesmo
portfólio dividem a cota. Estourou, vem **`131048`** — de forma assíncrona e mesmo com qualidade
verde. Nome de exibição ainda não aprovado também segura o número no limite baixo.

---

## 3 — App e App Review

**3.1 ✅ O vídeo de template mostra o ciclo inteiro: criado, aprovado, enviado e recebido.** Foi o
motivo de uma recusa real (Developer Policy 1.6). O roteiro corrigido está no §6.3 do
[manual de App Review](MANUAL-APP-REVIEW.md).
O que mudou na prática: **a gravação já inclui criar um template ao vivo** (Utility) e enviar um
outro, aprovado na véspera, até ele chegar no número de teste.

**3.2 ✅ Falas de 3 ou 4 palavras nos vídeos.** *"Hi, how are you?" / "Fine" / "Is my order ready?" /
"Yes, it will ship soon" / "Ok, thanks"*. Template curto de pedido, sem variável, aprovado antes.
Texto longo no vídeo só dá ao revisor mais coisa para questionar.

**3.3 ✅ Reenvio depois de recusa:** *Request again* cria um **rascunho** (o botão fica cinza
depois); continue em *App Review → Requests*. A permissão já aprovada volta junto como
*renewal*: não mexa nela, ela não se perde. Troque o texto curto do cartão pelo texto em 3 blocos
(qual função usa a permissão · como melhora o app · o que muda para o cliente final).

**3.4 ✅ Faça uma chamada de API por permissão no primeiro dia** (listar templates; enviar uma
mensagem) — a Meta leva até 2 dias para registrar, e sem isso o formulário não libera. Com a
verificação do negócio pendente, o formulário também não deixa enviar.

**3.5 ✅ O número do vídeo é um chip registrado direto na API**, no portfólio do app, que recebe SMS e
não tem WhatsApp instalado. Ele vira o primeiro número de teste.

**3.6 ✅ Confira as páginas legais pelo conteúdo, não pelo código HTTP.** Privacidade, termos e
**exclusão de dados** (a mais esquecida) precisam existir de verdade no domínio do app. Há sites
que devolvem a página inicial para qualquer endereço: responde 200 e reprova do mesmo jeito.

**3.7 ✅ App Review aprovado não basta: termine o onboarding de Tech Provider.** WhatsApp → *Become a
Partner* → *Continue onboarding*, até aparecer *"You are now a Tech Provider – 2 of 2"*. Sem isso o
popup do cliente mostra *"<Empresa> não pode integrar clientes no momento"* e a API mostra tudo
verde. Depois do App Review ainda pode vir a **Verificação de acesso** (questionário sobre dados,
até 5 dias); antes dela, o Embedded Signup pode falhar.

**3.8 ✅ Trocar o domínio da ferramenta derruba a coexistência em minutos.** Defina o domínio final
antes de gravar e de submeter, e **não mexa em Configurações → Básico durante a análise**.

---

## 4 — Conexão do número e coexistência

**4.1 ✅ Número que já está na API pura não vira coexistência direto.** Coexistência é para número
ativo no **app WhatsApp Business** (que não se apaga antes). Para um número que nasceu na API, é
preciso tirá-lo da API, colocá-lo no app Business e só então conectar — e os templates **não vão
junto**: aprove de novo.

**4.2 ✅ O que avisar o cliente antes de conectar:** o histórico só sincroniza se ele aceitar em até
24 h; grupos, mensagens temporárias, visualização única e localização ao vivo ficam fora; o app
Business precisa ser aberto periodicamente no celular (confira o prazo na doc do dia).

**4.3 🟡 Embedded Signup pela metade.** O celular mostra *"Termine a configuração em <empresa>"*, mas
a janela do navegador fechou antes do último passo: o código não chega e nenhuma caixa é criada.
Refaça com o navegador aberto até o fim.

**4.4 ✅ Token de 60 dias: anote o dia 60.** O modelo de configuração de Login para Empresas que
funciona é o de token com 60 dias; ele não se renova sozinho na ferramenta. Depois de conectar,
troque o token da caixa pelo de um **usuário do sistema** (não vence) ou reconecte antes do prazo.
**Nunca apague a configuração em uso**: a ferramenta que aponta para ela passa a dar
*"config_id is required"*.

**4.5 ✅ O token de operação sai do usuário do sistema do portfólio do próprio cliente**, e toda conta
nova precisa ser atribuída a esse usuário. Token "emprestado" de outro app ou portfólio leva o
cliente junto se aquele app tiver problema.

---

## 5 — Webhook e ferramenta de atendimento

**5.1 🟡 Troque o webhook padrão do app antes de conectar um número novo.** Se a conexão não criar
um webhook próprio para o número, as mensagens vão para o destino padrão do app — que pode ser de
outra ferramenta. Assine os campos `messages`, `smb_message_echoes` e `account_update`; **verificar
a URL não é assinar o campo**.

**5.2 ✅ Coexistência traz eco e histórico — o agente de IA precisa saber disso.** O que a equipe
digita no celular chega na ferramenta como mensagem de saída sem usuário (eco): use isso para
**pausar a IA** naquela conversa. A sincronização de histórico despeja mensagens antigas: o agente
deve ignorar mensagens recebidas com mais de alguns minutos. Lista de transmissão, enquete e
visualização única chegam como *"This message is unavailable"*.

**5.3 ✅ Ligue a checagem de assinatura do webhook** (o *App Secret* configurado na ferramenta). Com
ela, uma chamada falsa sem assinatura da Meta é recusada (401) em vez de virar mensagem.

---

## 6 — Templates

**6.1 ✅ A Meta reclassifica a categoria sem recusar o template.** Texto genérico (*"passando para
informar…"*) ou quase só variável volta como **MARKETING**, mesmo submetido como Utility. Passam como
Utility os que têm âncora de transação no texto fixo: pedido, agendamento, acesso. A régua da Meta
muda: confira a política de categorias do dia e trate a classificação como **dela**, não sua.

**6.2 ✅ Regras de formato** (conferidas na doc em nov/2026 — reconfira): não comece nem termine com
variável; nada de duas variáveis seguidas; toda variável com exemplo; numeração em sequência; nome em
minúsculas com `_`; corpo até 1024 caracteres, cabeçalho e rodapé até 60.

**6.3 ✅ Poucos por vez e sem apagar à toa.** Mandar dezenas de templates parecidos de uma vez virou
reclassificação em massa. Nome apagado fica bloqueado por 30 dias; template duplicado é reprovado.
