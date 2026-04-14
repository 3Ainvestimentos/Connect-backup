# BRAINSTORM: Compatibilidade legado em "Minhas Solicitações" da rota `/solicitacoes`

## 1. Ideia

Fazer a seção `Minhas Solicitações` da nova rota `/solicitacoes` exibir em uma única tabela os chamados:

- v2, já suportados hoje
- legados, hoje exibidos apenas em `/applications`

Com duas decisões adicionais agora fechadas:

- a experiência visual do usuário deve ser única
- a implementação deve nascer dentro do novo módulo de workflows, reconstruindo adapters/helpers necessários em vez de depender estruturalmente de componentes do legado

Objetivo secundário explícito:

- permitir limpeza de código morto depois da implementação, sem deixar a nova superfície acoplada aos componentes antigos

---

## 2. Respostas já fechadas nesta sessão

### 2.1. Quem vai usar?

Usuário final comum.

### 2.2. Onde aparece?

Na própria página `/solicitacoes`, dentro da seção `Minhas Solicitações`.

### 2.3. O que envolve?

Frontend + camada de composição/adaptação no novo módulo de workflows.

### 2.4. Regra de produto já decidida

- A tabela deve ser única, misturando legado + v2 no mesmo grid.
- Deve incluir todos os chamados legados do usuário.
- O detalhe deve ter a mesma experiência visual sempre que possível.
- Para dados legados, a UI pode degradar com elegância quando alguma informação estrutural do v2 não existir.
- A solução deve ser organizada no módulo novo de workflows para facilitar a futura remoção de superfícies/componentes legados.

---

## 3. O que o código mostra hoje

## 3.1. V2 em `/solicitacoes`

Hoje a nova página usa:

- `src/components/workflows/requester/RequestsV2Page.tsx`
- `src/components/workflows/requester/MyRequestsV2Section.tsx`
- `src/hooks/use-requester-workflows.ts`
- `GET /api/workflows/read/mine`

O contrato atual da seção v2 depende de `WorkflowGroupedReadData`, com `items` de `WorkflowReadSummary`.

Campos úteis já disponíveis no v2:

- `requestId`
- `workflowName`
- `currentStepName`
- `statusCategory`
- `expectedCompletionAt`
- `submittedAt`
- `lastUpdatedAt`
- `responsibleName`
- `areaId`

E o detalhe v2 já chega estruturado por:

- summary
- formData
- attachments
- progress
- timeline

## 3.2. Legado em `/applications`

Hoje a página legada monta `Minhas Solicitações` em:

- `src/components/applications/MyRequests.tsx`

Ela lê diretamente:

- `useWorkflows()` para os requests legados
- `useApplications()` para definições de workflow
- `useCollaborators()` para identificar o usuário atual

Campos legados disponíveis na lista:

- `requestId`
- `type`
- `status`
- `submittedAt`
- `lastUpdatedAt`
- `formData`
- `submittedBy`
- `assignee`
- `history`

Campos derivados hoje no legado:

- label de status: via `workflowDefinitions.statuses`
- SLA/previsão: calculada client-side via `defaultSlaDays` + `slaRules`

## 3.3. O que o legado consegue mostrar no detalhe

O modal legado (`src/components/applications/RequestDetailsModal.tsx`) já exibe:

- solicitante
- tipo
- data de abertura
- última atualização
- dados enviados
- histórico
- links de arquivos quando o campo é `file`

## 3.4. O que o legado não tem no mesmo nível do v2

O legado não traz um read model pronto equivalente ao v2. Em especial:

- não há `currentStepName` pronto; existe `status` + lookup na definição
- não há `areaId` diretamente no request; ele precisa ser derivado via `workflowDefinitions`
- não há `progress` estruturado como no v2
- não há `attachments` separados do `formData`; eles precisam ser derivados dos campos tipo `file`
- não há um endpoint unificado hoje para "meus chamados de qualquer origem"

## 3.5. Conclusão arquitetural a partir do código

O legado até oferece referências úteis de comportamento, mas concentra a lógica em componentes de UI (`MyRequests.tsx`, `RequestDetailsModal.tsx`) e contexts genéricos. Se a nova compatibilidade se apoiar diretamente nesses componentes, a superfície `/solicitacoes` ficará presa ao desenho antigo e dificultará a limpeza posterior.

Portanto, a direção correta para esta iteração é:

- usar o legado como fonte de dados
- reimplementar a lógica necessária no módulo novo de workflows/requester
- evitar dependência direta de componentes visuais do legado

---

## 4. Abordagens possíveis

## Abordagem A — Reaproveitar componentes/helpers legados dentro de `/solicitacoes`

### Como seria

- Importar ou adaptar `MyRequests.tsx` e `RequestDetailsModal.tsx`
- Fazer wrappers leves para encaixar na nova página
- Manter as derivações de status/SLA/fields próximas da estrutura antiga

### Vantagens

- Menor esforço imediato
- Mais rápida para sair funcionando

### Desvantagens

- Aumenta o acoplamento com a superfície antiga
- Dificulta limpeza de código morto depois
- Mantém lógica relevante fora do módulo novo
- Reforça a dívida de arquitetura em vez de reduzi-la

### Veredito

Não recomendada para a nova direção decidida.

---

## Abordagem B — Reaproveitar só dados/contextos legados, mas reconstruir adapters/helpers no módulo novo

### Como seria

- Continuar lendo:
  - `useWorkflows()`
  - `useApplications()`
  - `useCollaborators()`
  - `useAuth()`
- Criar no módulo novo:
  - tipo unificado de lista
  - adapters legado -> lista
  - adapters legado -> detalhe
  - helpers próprios de:
    - status label legado
    - SLA legado
    - área legado
    - anexos derivados
    - timeline legado
- Manter o shell visual único inteiramente sob `src/components/workflows/requester`

### Vantagens

- Preserva a nova arquitetura como dona da superfície `/solicitacoes`
- Facilita limpeza posterior de `src/components/applications/*`
- Torna os contratos novos explícitos e testáveis
- Reduz dependência de UI antiga

### Desvantagens

- Exige reimplementar algumas lógicas hoje espalhadas no legado
- Pode haver duplicação temporária até a limpeza final

### Veredito

Recomendada.

---

## Abordagem C — Criar camada server-side unificada já nesta etapa

### Como seria

- Criar endpoint ou query única retornando legado + v2
- Adaptar o legado no backend/read layer
- Manter o frontend quase cego à origem

### Vantagens

- Melhor desenho arquitetural de longo prazo
- Frontend mais limpo

### Desvantagens

- Escopo maior
- Reabre backend desnecessariamente para esta necessidade
- Não é o melhor ponto de entrada se a meta imediata também é limpar o frontend/módulo

### Veredito

Boa evolução futura, mas não necessária agora.

---

## 5. Recomendação

### Recomendação principal: Abordagem B

Motivo:

- atende a experiência unificada pedida pelo produto
- coloca a compatibilidade dentro do módulo novo
- permite limpar código morto depois com menos risco
- evita transformar `/solicitacoes` numa casca nova montada em cima de peças velhas

### Regra orientadora

Usar o legado como origem de dados, não como dono da experiência.

### Corte YAGNI recomendado

Nesta iteração, evitar:

- endpoint novo unificado
- reaproveitamento direto de componentes visuais legados
- paginação/filtros avançados
- tentativa de espelhar 100% do contrato profundo do v2 para o legado

Focar só em:

- lista única
- detalhe visual único
- adapters próprios no módulo novo
- helpers novos e puros que depois permitam desligar o caminho antigo

---

## 6. Proposta prática de implementação

### 6.1. Lista única no módulo novo

Criar um tipo de apresentação do requester, por exemplo:

- `RequesterUnifiedRequestListItem`

Campos mínimos:

- `origin: 'legacy' | 'v2'`
- `requestId`
- `workflowName`
- `statusLabel`
- `expectedCompletionLabel` ou `expectedCompletionAt`
- `submittedAt`
- `lastUpdatedAt`
- `detailKey`

Local sugerido:

- `src/lib/workflows/requester/unified-types.ts`

### 6.2. Hook unificado novo

Criar algo como:

- `src/hooks/use-requester-unified-requests.ts`

Responsabilidades:

- consumir items v2
- consumir requests legados
- filtrar legado pelo usuário atual
- converter ambos para `RequesterUnifiedRequestListItem`
- ordenar tudo junto
- expor loading/error unificados

### 6.3. Helpers novos para legado dentro do módulo novo

Em vez de depender da implementação visual antiga, criar helpers puros, por exemplo em:

- `src/lib/workflows/requester/legacy/`

Sugestões:

- `deriveLegacyWorkflowName(...)`
- `deriveLegacyStatusLabel(...)`
- `deriveLegacyArea(...)`
- `deriveLegacyExpectedCompletion(...)`
- `deriveLegacyAttachments(...)`
- `deriveLegacyTimeline(...)`

### 6.4. Dialog único

Criar ou evoluir o dialog atual de requester para aceitar um view-model unificado, por exemplo:

- `RequesterUnifiedRequestDetail`

Com duas origens de montagem:

- `legacy -> unified detail`
- `v2 -> unified detail`

### 6.5. Política de limpeza futura

Depois da implementação estabilizada, a limpeza poderá seguir esta ordem:

1. verificar se `/solicitacoes` cobre totalmente a necessidade de acompanhamento do solicitante
2. identificar quais partes de `MyRequests.tsx` e `RequestDetailsModal.tsx` ficaram sem uso
3. remover helpers/fluxos mortos do caminho legado

Isso só fica seguro se a nova lógica realmente nascer no módulo novo desde já.

---

## 7. Principais riscos

### 7.1. Duplicação temporária de lógica

Vamos duplicar temporariamente partes da derivação do legado, mas agora de forma intencional e modular, para depois apagar o caminho antigo.

### 7.2. Divergência funcional entre legado antigo e adapter novo

Se a regra de status/SLA/anexos for reescrita de forma imprecisa, `/solicitacoes` pode divergir de `/applications`.

Mitigação:

- testes de adapter
- comparação explícita com fixtures reais do legado

### 7.3. Dependência do contexto legado como fonte de dados

Mesmo reconstruindo a lógica, a leitura ainda depende de `useWorkflows()` enquanto não houver unificação server-side.

Isso é aceitável nesta iteração.

---

## 8. Entendimento consolidado

Queremos transformar `/solicitacoes` na superfície única do solicitante também para acompanhamento, misturando legado + v2 em uma só tabela e com um detalhe visualmente unificado. A compatibilidade não deve ser construída importando a UI antiga, e sim reconstruindo os contratos e helpers necessários dentro do módulo novo de workflows/requester, para que depois possamos remover código morto com segurança.

---

## 9. Próximo passo sugerido

Se este brainstorm estiver alinhado, o próximo passo natural é um `DEFINE` com os seguintes focos:

- contrato da lista única
- contrato do detalhe unificado
- helpers novos do legado que precisam nascer no módulo novo
- regra de ordenação e loading unificados
- edge cases de degradação
- critérios de limpeza futura do caminho antigo
