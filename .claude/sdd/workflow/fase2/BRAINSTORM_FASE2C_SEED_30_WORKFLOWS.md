# BRAINSTORM: FASE 2C - Estrategia de Seed dos 30 Workflows Restantes

> Generated: 2026-04-06
> Status: Brainstorm active
> Scope: Fase 2 / 2C - estrategia para materializar os workflows restantes em `workflowTypes_v2`
> Context base: `ROADMAP_FASE2.md`

## 1. Contexto consolidado

Esta sessao de brainstorm parte de um estado importante ja validado no projeto:

- a Fase 1 provou o modelo novo em `workflowTypes_v2`, `workflowTypes_v2/{workflowTypeId}/versions/{version}` e `workflows_v2`;
- o piloto de Facilities ja estabeleceu o padrao de **builder puro + script manual**;
- a 2A ja entregou a superficie oficial de gestao de chamados;
- a macroetapa `2C` agora passa a cuidar da expansao do catalogo para os workflows restantes.

Tambem ja temos uma fonte funcional concreta para a versao 1 dos novos workflows:

- [workflowDefinitions.json](/Users/lucasnogueira/Documents/3A/Connect-backup/src/scripts/results/workflowDefinitions.json)

Esse arquivo legado ja contem, por workflow:

- `name`
- `description`
- `icon`
- `areaId`
- `ownerEmail`
- `defaultSlaDays`
- `statuses`
- `fields`
- `allowedUserIds`
- `routingRules`
- `slaRules`

## 2. Perguntas feitas e respostas fechadas

### 2.1. Quem define a versao 1 desses workflows?

Resposta consolidada:

- a fonte funcional da versao 1 sera o snapshot legado em [workflowDefinitions.json](/Users/lucasnogueira/Documents/3A/Connect-backup/src/scripts/results/workflowDefinitions.json).

### 2.2. A seed sera uma migracao 100% cega ou pode haver saneamento?

Resposta consolidada:

- seguimos no **Modo B**:
  - migracao fiel ao legado;
  - com saneamento leve permitido;
  - mudancas significativas de regra de negocio ficam para uma futura `v2`.

### 2.3. O que entra como saneamento leve?

Direcao consolidada:

- pode ajustar:
  - labels
  - placeholders
  - padronizacao de textos
  - pequenas ordenacoes
  - limpeza superficial de apresentacao
- nao deve ajustar sem decisao posterior:
  - regra de negocio
  - obrigatoriedade
  - tipo de campo
  - fluxo operacional real
  - ownership substantivo

## 3. Achados no material atual

### 3.1. O legado esta suficientemente estruturado para virar seed automatizada

O JSON ja traz estrutura suficiente para gerar:

- `workflowTypes_v2/{workflowTypeId}`
- `workflowTypes_v2/{workflowTypeId}/versions/1`

Sem precisar fazer scraping de UI ou leitura manual no Firestore.

### 3.2. O legado nao esta pronto para virar versao 1 “sem mediacao”

Apesar de estruturado, o snapshot legado carrega fragilidades previsiveis:

- labels despadronizadas;
- placeholders vazios;
- nomes de campos com variacoes;
- possivel inconsistencia entre `ownerEmail` legado e colaborador vigente;
- IDs legados de documento que nao necessariamente devem virar `workflowTypeId` canonico no v2.

### 3.3. O padrao do piloto ja nos deu uma boa fundacao de seed

Hoje ja temos:

- builder puro em [fase1-facilities-v1.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/bootstrap/fase1-facilities-v1.ts)
- script manual em [seed-fase1-facilities-v1.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/scripts/seed-fase1-facilities-v1.ts)
- funcoes de escrita e preservacao no repositório em [repository.ts](/Users/lucasnogueira/Documents/3A/Connect-backup/src/lib/workflows/runtime/repository.ts)

Conclusao:

- a `2C` nao precisa inventar uma estrategia nova do zero;
- ela precisa **escalar e sistematizar** a estrategia do piloto.

## 4. Abordagens possiveis

### Abordagem A - Seed monolitica direta a partir do JSON legado

Como funciona:

- um script unico le [workflowDefinitions.json](/Users/lucasnogueira/Documents/3A/Connect-backup/src/scripts/results/workflowDefinitions.json);
- converte tudo de uma vez para o modelo v2;
- grava os ~30 workflows em lote no Firestore.

Vantagens:

- implementacao inicial mais rapida;
- menos arquivos para manter;
- boa para um primeiro experimento interno.

Desvantagens:

- baixa rastreabilidade por lote;
- review mais dificil;
- rollback pior;
- maior chance de um problema em 1 workflow bloquear ou contaminar todo o pacote;
- mistura descoberta, transformacao, validacao e gravacao no mesmo lugar.

Quando escolher:

- so faria sentido se o objetivo fosse um bootstrap emergencial e descartavel.

### Abordagem B - Seed por lotes, com builders puros e scripts manuais por onda

Como funciona:

- os 30 workflows sao agrupados por lotes tematicos/area;
- cada lote ganha um builder puro que transforma o legado para payload v2;
- cada lote ganha um script manual com `--dry-run` e `--execute`;
- cada lote e validado antes de seguir para o proximo.

Vantagens:

- muito mais seguro para rollout;
- combina com o roadmap da `2C`;
- facilita smoke test e rollback;
- permite saneamento leve controlado por lote;
- deixa a base pronta para a `2D` assumir a evolucao depois.

Desvantagens:

- mais trabalho organizacional inicial;
- exige decidir criterio de agrupamento e manifesto dos lotes;
- mais arquivos do que a abordagem monolitica.

Quando escolher:

- **recomendado para esta fase**.

### Abordagem C - Pipeline em duas camadas: snapshot legado -> manifesto curado -> seed

Como funciona:

- o JSON legado vira uma camada de entrada;
- um manifesto intermediario curado define:
  - `workflowTypeId` canonico
  - owner validado
  - area validada
  - saneamentos leves aprovados
- a seed final le esse manifesto curado e materializa o v2.

Vantagens:

- maior governanca;
- melhor auditabilidade;
- deixa muito claro o que veio do legado e o que foi saneado.

Desvantagens:

- adiciona uma camada a mais;
- pode ser overengineering para a primeira onda;
- aumenta custo de manutencao antes da `2D`.

Quando escolher:

- vale se voces quiserem rigor forte de migracao e rastreabilidade desde a primeira onda.

## 5. Recomendacao

### Recomendacao principal

Seguir com a **Abordagem B**, com um pequeno elemento da C:

- seed por lotes;
- builders puros por lote;
- scripts manuais por lote;
- e um manifesto simples de controle por lote, sem criar ainda um sistema curado complexo demais.

## 6. Estrategia recomendada em termos praticos

### 6.1. Fonte de entrada

- [workflowDefinitions.json](/Users/lucasnogueira/Documents/3A/Connect-backup/src/scripts/results/workflowDefinitions.json) e a fonte funcional da `v1`.

### 6.2. Transformacao

Cada workflow legado deve ser convertido para:

- `workflowTypes_v2/{workflowTypeId}`
- `workflowTypes_v2/{workflowTypeId}/versions/1`

com estas regras:

- migracao fiel ao legado;
- saneamento leve permitido em labels/placeholders/ordem;
- sem mudar regra de negocio.

### 6.3. Agrupamento

Os workflows devem ser agrupados por lotes.

Sugestao inicial:

- por area de negocio;
- ou por similaridade operacional;
- evitando lotes grandes demais.

Boa regra inicial:

- lotes entre `5` e `10` workflows.

### 6.4. Estrutura de arquivos recomendada

Builders:

- `src/lib/workflows/bootstrap/fase2-<lote>-v1.ts`

Scripts:

- `src/scripts/seed-fase2-<lote>-v1.ts`

Manifesto simples de controle:

- documento em `docs/` ou `.claude/sdd/` listando:
  - lote
  - workflows incluidos
  - status (`planned`, `seeded`, `validated`, `enabled`)

### 6.5. Contratos da seed

Cada script deve ter:

- `--dry-run`
- `--execute`

E deve:

- escrever apenas no modelo `_v2`;
- nunca sobrescrever `published` silenciosamente;
- falhar de forma explicita quando encontrar inconsistencia forte;
- preservar o contador v2 como ja fazemos hoje.

## 7. Decisoes que esta estrategia implica

### 7.1. A `v1` nao sera “redesenhada”

Ela sera:

- uma traducao do legado para o modelo novo;
- com saneamento leve de apresentacao;
- sem reescrever fluxo real.

### 7.2. A `v2` sera o lugar das correcoes grandes

Mudancas significativas ficam para a proxima etapa de evolucao, por exemplo:

- reordenar ou simplificar etapas;
- mudar obrigatoriedade de campo;
- trocar tipo de campo;
- revisar regras de negocio;
- ajustar ownership com governanca mais ampla.

### 7.3. A 2D nao substitui a seed inicial

A `2D` entra depois para:

- novas versoes;
- edicao;
- publicacao;
- historico.

A `2C` continua sendo responsavel pelo **bootstrap inicial** dos workflows restantes.

## 8. YAGNI aplicado

Para esta fase, **nao** vale fazer:

- importador ultra-generico para qualquer JSON arbitrario;
- UI administrativa para migracao antes da `2D`;
- normalizador inteligente demais com heuristicas opacas;
- pipeline de publicacao automatica sem validacao humana;
- migracao de regras complexas com reinterpretacao do legado.

O suficiente para a `2C` e:

- transformar o snapshot legado em `v1`;
- por lotes;
- com scripts claros;
- com validacao manual entre lotes.

## 9. Entendimento consolidado

O entendimento atual e:

- a seed dos 30 workflows vai usar o legado como base;
- a estrategia escolhida e **migracao fiel com saneamento leve**;
- mudancas grandes de regra ficam para `v2`;
- o melhor caminho e escalar o padrao do piloto;
- a seed deve ser executada por lotes, nao em um pacote monolitico.

## 10. Proximo passo sugerido

O proximo artefato natural e:

- um `DEFINE` da `2C`

fechando:

1. criterio de agrupamento dos lotes;
2. contrato do builder por lote;
3. contrato do script por lote;
4. politica de saneamento leve permitida na `v1`;
5. validacao e rollout por lote.
