# AGENTS.md — leia o CLAUDE.md

As instruções desta pasta moram em **[`CLAUDE.md`](CLAUDE.md)**. Leia-o antes de qualquer ação:
lá estão os comandos, o que é seguro rodar sem perguntar e o que trava o número do dono por 72 h.

As quatro regras que não se pulam, mesmo que você não leia mais nada:

1. **`diagnostico-numero.mjs` antes de qualquer tentativa de registro.** É read-only, não gasta
   cota e não consome tentativa — e são só 10 tentativas por número a cada 72 horas.
2. **Pesquise a documentação oficial da Meta antes de cada etapa** e diga ao dono o que mudou
   desde que este material foi escrito. Nunca troque a versão da Graph API por conta própria.
3. **Nada que muda o mundo roda sem o dono ver e dizer sim** — registrar número, criar, editar ou
   apagar template, mexer em webhook, submeter o App Review.
4. **O `.env.local` nunca sai da máquina.** Não cole token em chat, não comite, não imprima
   inteiro em resposta.
