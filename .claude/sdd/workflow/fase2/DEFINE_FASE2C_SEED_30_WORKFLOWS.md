# DEFINE: FASE 2C - Seed dos 30 Workflows Restantes

> Generated: 2026-04-06
> Status: Approved for design
> Scope: Fase 2 / 2C - materializacao em lotes dos 30 workflows restantes no modelo v2
> Base roadmap: `docs/workflows_new/fase2/ROADMAP_FASE2.md`
> Source brainstorm: `BRAINSTORM_FASE2C_SEED_30_WORKFLOWS.md`

## 1. Problem Statement

O motor novo ja foi validado na Fase 1 com 3 workflows de Facilities, mas os outros 30 workflows do catalogo legado ainda estao fora de `workflowTypes_v2`; a Fase 2C precisa materializar essas versoes iniciais de forma segura, auditavel e incremental, sem redesenhar a regra de negocio no meio da migracao.

### 1.1. Universo fechado da 2C

O snapshot legado em `src/scripts/results/workflowDefinitions.json` contem `33` workflows.

Destes:

- `3` ja foram materializados na Fase 1 em Facilities;
- `30` permanecem como escopo da 2C;
- os `30` restantes se distribuem em `5` areas nao-piloto:
  - `Gente e Comunicacao`: `11`
  - `TI`: `9`
  - `Marketing`: `7`
  - `Governanca`: `2`
  - `Financeiro`: `1`

### 1.2. Estrategia de execucao da macroetapa

Fica fechado que a 2C sera executada por lotes e nao por seed monolitica unica.

Lotes aprovados para a macroetapa:

- **Lote 1 - Governanca + Financeiro**
  - `Espelhamento - Caso Unico`
  - `Espelhamento - Em lote`
  - `Solicitacao de Pagamentos`
- **Lote 2 - Marketing**
  - `Evento`
  - `Sugestao 3A RIVA Store`
  - `Arte / Material grafico`
  - `Revisao de materiais e Apresentacoes`
  - `Assinatura de e-mail; Cartao de visita; Cartao de visita digital`
  - `Acoes Marketing`
  - `Solicitacao de Patrocinios`
- **Lote 3 - TI**
  - `Problemas de Hardware`
  - `Solicitacao de Compra - Equipamento`
  - `Problemas de Rede`
  - `Sugestoes 3A RIVA Connect`
  - `Problemas de Software`
  - `Solicitacao de Compra - Software/Sistema`
  - `Alteracao no E-mail XP`
  - `Padronizacao de E-mail - Codigo XP`
  - `Reset de Senha`
- **Lote 4 - Gente e Comunicacao / servicos e atendimento**
  - `Fale com a GENTE`
  - `Servicos de Plano de Saude`
  - `Comprovacao ANCORD`
  - `Solicitacao de Abertura de Vaga`
  - `Solicitacao de Ferias / Ausencia / Compensacao de horas`
- **Lote 5 - Gente e Comunicacao / ciclo de vida e movimentacoes**
  - `Analise Pre-Desligamento (Acesso lideres)`
  - `Alteracao de Cargo / Remuneracao / Time ou Equipe`
  - `Cadastro de Novos Entrantes - Demais Areas`
  - `Solicitacao Desligamento - Demais areas (Nao comerciais)`
  - `Cadastro de Novos Entrantes - Associado`
  - `Alteracao Cadastral`

Motivo da divisao:

- manter cada lote em tamanho validavel;
- alinhar ownership e smoke por area;
- separar os fluxos mais sensiveis de ciclo de vida de colaborador em uma onda propria;
- evitar que um unico erro bloqueie toda a expansao.

---

## 2. Users

### 2.1. Engenharia / plataforma de workflows

Pain points:

- hoje o catalogo novo cobre apenas o piloto;
- o snapshot legado tem estrutura suficiente para seed, mas nao esta pronto para subir sem mediacao;
- um seed monolitico mistura saneamento, validacao e gravacao sem fronteiras claras.

### 2.2. Owners das areas

Pain points:

- cada area precisa validar sua onda sem assumir risco sobre as demais;
- ha divergencias provaveis entre `ownerEmail` legado e colaborador vigente;
- a ativacao precisa acontecer com rastreabilidade por lote.

### 2.3. Produto / rollout operacional

Pain points:

- a Fase 2 precisa provar que o modelo v2 escala alem de Facilities;
- a expansao nao pode ficar bloqueada esperando a 2D;
- o frontend oficial nao deve expor workflows ainda nao validados.

---

## 3. Goals

### MUST

- materializar os `30` workflows restantes em `workflowTypes_v2` e `workflowTypes_v2/{workflowTypeId}/versions/1`;
- executar a 2C em `5` lotes aprovados, com gate manual entre um lote e outro;
- usar `workflowDefinitions.json` como fonte funcional da `v1`;
- manter a migracao fiel ao legado, com saneamento leve explicitamente permitido;
- exigir um manifesto audivel por lote contendo no minimo:
  - `legacyWorkflowId`
  - `workflowTypeId` canonico
  - `areaId`
  - `ownerEmail` legado
  - `ownerEmail` resolvido quando houver override
  - `ownerUserId` resolvido
  - `lotStatus`
- proibir que o `workflowTypeId` canonico seja inferido implicitamente do ID legado sem decisao explicita do lote;
- validar `ownerEmail` contra colaborador vigente antes de qualquer escrita;
- permitir override explicito e auditavel de owner quando o email legado nao resolver de forma univoca;
- suportar os tipos de campo presentes no snapshot legado:
  - `text`
  - `textarea`
  - `select`
  - `date`
  - `file`
- tratar `fields=[]` como caso suportado quando isso ja existir no legado;
- exigir `--dry-run` e `--execute` em todo script de seed por lote;
- falhar de forma explicita quando houver:
  - owner invalido ou ambiguo
  - area inexistente
  - shape legado nao suportado
  - tentativa de sobrescrever publicacao de forma silenciosa
- preservar o contador `counters/workflowCounter_v2` se ele ja existir;
- escrever apenas no namespace `_v2`.

### SHOULD

- reaproveitar o padrao validado do piloto: builder puro + script manual;
- compartilhar validadores e normalizadores entre os lotes;
- gerar saida de dry-run legivel para revisao humana;
- registrar o status de cada lote como `planned`, `seeded`, `validated` ou `enabled`.

### COULD

- gerar relatorio tecnico por lote com diff resumido do saneamento aplicado;
- consolidar um manifesto global da 2C para acompanhamento de cobertura;
- disponibilizar utilitarios comuns para smoke e validacao pos-seed.

### WON'T

- nao redesenhar regra de negocio, roteamento ou SLA na `v1`;
- nao criar a UI administrativa da 2D nesta macroetapa;
- nao migrar instancias operacionais legadas para `workflows_v2`;
- nao publicar tudo em um unico lote monolitico;
- nao automatizar ativacao sem validacao humana entre ondas.

---

## 4. Success Criteria

- os `30` workflows restantes passam a existir em `workflowTypes_v2` com `versions/1` publicada por lote;
- cada workflow seedado possui `workflowTypeId` canonico explicito e rastreavel ao `legacyWorkflowId`;
- nenhum lote depende de reinterpretacao silenciosa de owner ou area;
- os `5` lotes conseguem rodar em `--dry-run` com saida revisavel antes da escrita real;
- nenhum script da 2C escreve em `workflows_v2`;
- o contador `workflowCounter_v2` nao e resetado por engano;
- o frontend oficial so passa a expor workflows depois de o lote correspondente estar ao menos em `validated`;
- a operacao consegue validar a expansao por area sem regressao no piloto de Facilities.

### Clarity Score

`14/15`

Motivo:

- o recorte da macroetapa, os lotes e a politica de migracao estao fechados;
- o contrato minimo de manifesto, builder, script e gate operacional esta definido;
- detalhes de implementacao dos normalizadores e da composicao exata dos payloads ficam para o design.

---

## 5. Technical Scope

### Backend / scripts

- builders puros por lote para transformar o snapshot legado em payload v2;
- scripts manuais por lote com `--dry-run` e `--execute`;
- validacao de owner, area, campos e contratos minimos antes da escrita;
- manifesto por lote para controlar mapeamento canonico e status operacional.

### Database

- escrita em:
  - `workflowTypes_v2/{workflowTypeId}`
  - `workflowTypes_v2/{workflowTypeId}/versions/1`
- leitura e preservacao de:
  - `counters/workflowCounter_v2`
- nenhuma escrita obrigatoria em:
  - `workflows_v2`
  - colecoes legadas ja em uso

### Frontend

- fora do build principal da 2C;
- apenas habilitacao progressiva dos workflows seedados no catalogo oficial depois da validacao do lote.

### AI

- fora do escopo.

---

## 6. Auth Requirements

- a seed da 2C roda com privilegio administrativo e nao adiciona nenhum fluxo novo de JWT no cliente;
- cada workflow seedado deve materializar um owner resolvido de forma univoca em `ownerUserId`, preservando a semantica de ownership ja usada na Fase 1 e na 2A;
- `allowedUserIds`, ownership e regras de roteamento herdadas do legado nao podem ser ampliadas de forma silenciosa durante o saneamento;
- a 2C nao pode relaxar a isolacao futura entre solicitante, owner e responsavel so para acomodar a seed;
- qualquer excecao de identidade deve virar override explicito no manifesto, nunca fallback opaco em runtime.

---

## 7. Politica de Saneamento Leve

Fica permitido na `v1`:

- ajuste de labels;
- preenchimento ou padronizacao de placeholders;
- limpeza de espacos, capitalizacao e texto de apresentacao;
- pequenas reordenacoes de campos quando o objetivo for apenas consistencia visual;
- definicao de `workflowTypeId` canonico diferente do ID legado, desde que rastreada no manifesto.

Fica proibido na `v1`:

- trocar tipo de campo;
- mudar obrigatoriedade;
- reescrever etapas ou status operacionais;
- reinterpretar regras de SLA;
- alterar regra de negocio, ownership substantivo ou fluxo real sem decisao posterior.

---

## 8. Validacao e Rollout

Cada lote deve seguir obrigatoriamente a sequencia:

1. manifesto revisado e aprovado;
2. `dry-run` com saida inspecionavel;
3. `execute` controlado;
4. smoke de leitura do catalogo publicado;
5. validacao funcional da area;
6. mudanca de status para `validated`;
7. habilitacao progressiva no frontend oficial, quando aplicavel.

Gate fechado:

- o lote seguinte nao avanca para `execute` antes de o lote anterior atingir ao menos `validated`.

---

## 9. Out of Scope

- evolucao para `v2` dos workflows seedados;
- tela de criacao/edicao/publicacao da 2D;
- migracao de dados historicos ou requests antigos;
- redesign do runtime write-side e read-side validado na Fase 1;
- heuristicas inteligentes de importacao generica para qualquer JSON arbitrario.

---

## 10. Dependencias

Depende de:

- snapshot legado em [workflowDefinitions.json](/Users/lucasnogueira/Documents/3A/Connect-backup/src/scripts/results/workflowDefinitions.json);
- repositorio e helpers v2 validados na Fase 1;
- [ROADMAP_FASE2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase2/ROADMAP_FASE2.md);
- [BRAINSTORM_FASE2C_SEED_30_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/BRAINSTORM_FASE2C_SEED_30_WORKFLOWS.md)

Desbloqueia:

- design tecnico detalhado da 2C;
- implementacao incremental da seed dos lotes restantes;
- habilitacao progressiva do catalogo novo alem de Facilities.

---

## 11. Fonte de Verdade

Este define deriva de:

- [BRAINSTORM_FASE2C_SEED_30_WORKFLOWS.md](/Users/lucasnogueira/Documents/3A/Connect-backup/.claude/sdd/workflow/fase2/BRAINSTORM_FASE2C_SEED_30_WORKFLOWS.md)
- [ROADMAP_FASE2.md](/Users/lucasnogueira/Documents/3A/Connect-backup/docs/workflows_new/fase2/ROADMAP_FASE2.md)
- [workflowDefinitions.json](/Users/lucasnogueira/Documents/3A/Connect-backup/src/scripts/results/workflowDefinitions.json)
- [fase1-facilities-v1.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase1-facilities-v1.ts)
- [seed-fase1-facilities-v1.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/scripts/seed-fase1-facilities-v1.ts)
- [repository.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/repository.ts)

Em caso de divergencia:

1. prevalece este define para o escopo da 2C;
2. depois o roadmap da Fase 2;
3. depois o brainstorm da 2C;
4. depois o padrao tecnico validado no piloto da Fase 1.
