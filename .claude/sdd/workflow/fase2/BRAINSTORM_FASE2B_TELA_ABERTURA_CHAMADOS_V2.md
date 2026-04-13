# BRAINSTORM: Fase 2B - Tela oficial de abertura de chamados v2

## 1. Contexto

A Fase `2B` tem como objetivo criar uma nova superficie oficial de abertura de chamados, conectada ao backend novo (`workflowTypes_v2`, runtime v2 e read model novo), sem evoluir em cima da implementacao legada atual.

O roadmap da fase 2 ja fecha alguns pontos:

- a nova tela pode ser visualmente identica a tela atual no primeiro momento;
- a implementacao deve ser nova e separada da tela legada;
- a convivencia com a tela antiga deve ser mantida durante rollout e validacao;
- limpeza dos artefatos antigos fica para uma etapa posterior.

## 2. O que existe hoje

Superficie legada atual:

- rota: `/applications`
- shell principal: [page.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/app/(app)/applications/page.tsx)
- modal de selecao por area: [WorkflowGroupModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/applications/WorkflowGroupModal.tsx)
- modal de submissao: [WorkflowSubmissionModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/applications/WorkflowSubmissionModal.tsx)
- secao `Minhas Solicitacoes`: [MyRequests.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/applications/MyRequests.tsx)

Dependencias legadas atuais:

- `ApplicationsContext` carrega `workflowDefinitions` da colecao antiga;
- `WorkflowsContext` opera requests do legado;
- o formulario atual faz upload e submissao em fluxo legado;
- a tabela `Minhas Solicitacoes` e o modal de detalhe leem do legado.

## 3. Respostas fechadas no brainstorm

### 3.1. Quem vai usar

- usuario final comum

### 3.2. Onde aparece

- nova rota separada de `/applications`
- superficie explicita do mecanismo `v2`

### 3.3. O que a 2B cobre

- cards por area na pagina
- modal de selecao quando a area tiver multiplos workflows
- modal de submissao do formulario
- secao `Minhas Solicitacoes` na mesma pagina

### 3.4. O que nao faz agora

- nao substitui `/applications` nesta etapa
- nao tenta fundir legado e v2 numa unica pagina
- nao trata comportamento especial de admin nessa mesma superficie

## 4. Meta de produto

Construir uma nova rota de abertura de chamados `v2` com a mesma linguagem visual da experiencia legada atual, mas conectada somente ao motor novo:

- catalogo publicado novo
- abertura via `open-request`
- uploads v2
- minhas solicitacoes via read model novo
- detalhe/meus itens usando as superficies oficiais do runtime novo

## 5. Abordagens consideradas

### Abordagem A - Reaproveitar os componentes legados atuais com adapters

Ideia:

- manter [WorkflowGroupModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/applications/WorkflowGroupModal.tsx), [WorkflowSubmissionModal.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/applications/WorkflowSubmissionModal.tsx) e [MyRequests.tsx](/Users/lucasnogueira/Documents/3A/Connect-backup/src/components/applications/MyRequests.tsx);
- trocar por baixo apenas os hooks/contextos e os formatos de dados.

Vantagens:

- entrega mais rapida no curtissimo prazo;
- preserva a UI quase automaticamente;
- reduz retrabalho visual inicial.

Riscos:

- acopla a `2B` a contexts legados (`ApplicationsContext`, `WorkflowsContext`);
- incentiva condicionais `legacy vs v2` dentro dos mesmos componentes;
- aumenta custo de manutencao e de rollout futuro;
- dificulta limpar o legado depois.

Leitura:

- boa para prototipo muito rapido;
- ruim como base oficial de evolucao.

### Abordagem B - Reimplementar a superficie v2 espelhando o layout legado

Ideia:

- criar uma nova rota v2;
- criar componentes novos para area cards, modal de grupo, modal de submissao e `Minhas Solicitacoes`;
- copiar o comportamento visual da tela legada, mas conectar tudo ao backend novo.

Vantagens:

- atende o requisito de visual igual sem herdar a implementacao legada;
- mantem fronteira clara entre legado e v2;
- facilita rollout seguro e limpeza posterior;
- reduz risco de regressao cruzada em `/applications`.

Riscos:

- exige reconstituir alguns detalhes visuais/manual states;
- mais trabalho inicial que reaproveitar os componentes antigos;
- precisa definir bem os adapters do catalogo publicado, open-request e minhas solicitacoes.

Leitura:

- melhor equilibrio entre seguranca arquitetural e fidelidade visual;
- melhor candidata para rota oficial v2.

### Abordagem C - Extrair um design system compartilhado e refatorar legado e v2 ao mesmo tempo

Ideia:

- primeiro extrair cards/modais/tabela em componentes visuais comuns;
- depois usar esses componentes tanto em `/applications` quanto na nova rota v2.

Vantagens:

- maximiza reaproveitamento visual;
- evita divergencia de look-and-feel no medio prazo.

Riscos:

- aumenta muito o escopo da `2B`;
- mistura migracao funcional com refatoracao transversal;
- cria mais pontos de quebra na tela legada atual.

Leitura:

- boa ideia mais para frente;
- ruim como primeira entrega da `2B`.

## 6. Recomendacao

### Escolha recomendada: Abordagem B

Criar uma **nova rota v2** com **componentes novos**, mas **espelhando deliberadamente o layout e o fluxo da tela legada**.

Isso preserva:

- familiaridade para o usuario final;
- rollout seguro lado a lado com o legado;
- independencia tecnica suficiente para evoluir depois.

## 7. Recorte YAGNI

Para o primeiro corte da `2B`, vale manter o escopo estrito:

- mesma experiencia visual principal da tela atual;
- apenas workflows publicados/ativos do motor novo;
- apenas usuario final comum;
- detalhe e `Minhas Solicitacoes` focados no proprio solicitante;
- sem unificar legado + v2 na mesma listagem;
- sem mexer na rota antiga `/applications`.

Evitar agora:

- refatorar a tela legada;
- criar shared abstraction grande entre legacy e v2;
- inventar navegacao paralela complexa;
- adicionar extras de admin/analytics/configurador;
- antecipar toda a estrategia de deploy seguro nesta mesma etapa.

## 8. Proposta inicial de superficie

### Rota nova

- sugestao inicial: `/applications-v2`

Alternativas:

- `/applications/v2`
- `/me/applications-v2`

Observacao:

- a escolha final da rota deve ser fechada no define.

### Fluxo

1. usuario entra na rota nova v2
2. ve cards por area
3. se a area tiver 1 workflow, abre direto o modal de submissao
4. se a area tiver varios workflows, abre modal de selecao
5. ao escolher workflow, abre modal de submissao
6. ao enviar, request e criada via runtime v2
7. na mesma pagina, a secao `Minhas Solicitacoes` mostra requests do usuario no motor novo

## 9. Blocos tecnicos envolvidos

### Frontend

- pagina nova da `2B`
- grid de areas
- modal de selecao por area
- modal de submissao dinamico v2
- tabela `Minhas Solicitacoes` v2
- detalhe read-only/operacional do item do proprio solicitante

### Backend / read / runtime

- catalogo de workflows publicados e ativos para abertura
- bootstrap de formulario por `workflowTypeId`
- open-request v2
- upload pre-open v2
- lista `Minhas Solicitacoes` do usuario via read model novo
- detalhe do proprio request no modelo novo

## 10. Pontos que merecem fechamento no define

1. rota oficial exata da nova superficie v2
2. origem do catalogo de abertura:
   - `workflowTypes_v2` publicados e ativos
   - com agrupamento por `workflowAreas`
3. criterio de exibicao de workflows:
   - somente `active = true`
   - somente versoes publicadas
4. como a secao `Minhas Solicitacoes` sera lida no v2:
   - lista simples do solicitante
   - com ou sem modal de detalhe rico
5. tratamento de casos especiais hoje existentes no legado:
   - por exemplo fluxos externos/iframe como TI
6. estrategia de convivio visual com `/applications` durante rollout

## 11. Entendimento consolidado

Meu entendimento atual da `2B`:

- vamos criar uma **nova tela oficial de abertura de chamados v2**
- separada de `/applications`
- para **usuario final comum**
- cobrindo o **fluxo completo**:
  - cards por area
  - modal de grupo
  - modal de submissao
  - `Minhas Solicitacoes`
- com **visual essencialmente igual ao legado**
- mas com **implementacao nova**, ligada so ao motor novo

## 12. Proximo passo recomendado

Se este entendimento estiver correto, o proximo passo natural e abrir:

- `DEFINE_FASE2B_TELA_ABERTURA_CHAMADOS_V2.md`

com foco em:

- rota
- escopo funcional exato
- fronteira com `/applications`
- contratos de leitura e abertura
- comportamento de `Minhas Solicitacoes`
