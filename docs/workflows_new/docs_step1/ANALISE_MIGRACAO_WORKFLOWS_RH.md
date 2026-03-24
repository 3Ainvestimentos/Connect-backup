# Analise Tecnica: Migracao de Workflows Legados de RH

Este documento consolida as decisoes de negocio e a analise tecnica para a migracao "in-place" dos documentos legados da colecao `workflows` no Firestore para as definicoes atuais de workflows de RH/Gente.

## 1. Visao Geral da Migracao

O objetivo e atualizar o campo `type`, adaptar o `formData`, normalizar o `status` atual quando necessario e atualizar o `ownerEmail`, preservando o mesmo documento, o mesmo `id` e o historico existente.

### Decisoes de negocio ja validadas

- Documentos migrados que nao estiverem em `finalizado` devem ser movidos para `finalizado`.
- O `ownerEmail` dos documentos migrados pode ser atualizado para `fernanda.adami@3ainvestimentos.com.br`.
- Campos legados divergentes devem ser adaptados ao schema atual:
  - removendo campos que nao fazem mais sentido;
  - renomeando campos quando houver correspondencia clara;
  - adicionando valores placeholder em campos obrigatorios ausentes quando isso for necessario para evitar falha futura.

### Matriz de Migracao

| Tipo Legado | Tipo Destino | Ajuste de Campos (`formData`) | Ajuste de Status Atual | Risco no Historico | Seguranca |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AC - Alteracao de Cargo...** | Alteracao de Cargo... | Nenhum | Se nao estiver `finalizado`, mover para `finalizado` | Nenhum | **Alta** |
| **Alteracao (Somente Lideres)** | Alteracao de Cargo... | Nenhum | Se nao estiver `finalizado`, mover para `finalizado` | Nenhum | **Alta** |
| **HJ - Alteracao de Cargo...** | Alteracao de Cargo... | Adicionar placeholder em `anexo` quando ausente | Se nao estiver `finalizado`, mover para `finalizado` | Historico legado com status fora do destino | **Media** |
| **TH - Alteracao de Cargo...** | Alteracao de Cargo... | Adicionar placeholder em `anexo` e `nome_sobrenome_colaborador` quando ausentes | Se nao estiver `finalizado`, mover para `finalizado` | Historico com `aprovacao_ceo` fora do destino | **Media** |
| **Cadastro de Novos Entrantes** | Cadastro de Novos Entrantes - Demais Areas | Renomear `carta_proposta` -> `anexo`; adicionar placeholder se `anexo` continuar ausente | Se nao estiver `finalizado`, mover para `finalizado` | Varios status legados nao existem no destino | **Media/Baixa** |
| **Solicitacao Desligamento** | Solicitacao Desligamento - Demais areas (Nao comerciais) | Nenhum | Se nao estiver `finalizado`, mover para `finalizado` | Historico com `desligamento_juridico` fora do destino | **Alta** |

---

## 2. Detalhamento por Tipo Legado

### A. Familia "Alteracao de Cargo / Remuneracao"

- **Destino:** `Alteração de Cargo / Remuneração / Time ou Equipe`
- **Tipos legados incluidos:**
  - `AC - Alteração de Cargo / Remuneração / Time ou Equipe`
  - `Alteração de Cargo / Remuneração / Time ou Equipe (Somente Líderes)`
  - `HJ - Alteração de Cargo / Remuneração / Time ou Equipe`
  - `TH - Alteração de Cargo / Remuneração / Time ou Equipe`

#### Compatibilidade de campos

- **AC**: compativel com o destino.
- **Somente Lideres**: compativel com o destino.
- **HJ**: normalmente nao possui `anexo`; deve receber placeholder quando ausente.
- **TH**: pode nao possuir `anexo` nem `nome_sobrenome_colaborador`; ambos devem receber placeholder quando ausentes.

#### Compatibilidade de status

- O destino possui a cadeia simplificada:
  - `solicitacao_aberta`
  - `em_analise`
  - `em_execucao`
  - `finalizado`
- Pela decisao de negocio, qualquer documento que ainda nao esteja finalizado sera movido para `finalizado` durante a migracao.
- O historico nao sera descartado. Status legados como `aprovacao_ceo` permanecem no historico, mesmo nao existindo no destino atual.

### B. Cadastro de Novos Entrantes

- **Destino:** `Cadastro de Novos Entrantes - Demais Áreas `

#### Compatibilidade de campos

- O legado usa `carta_proposta`.
- O destino usa `anexo`.
- Regra de migracao:
  - se `anexo` estiver vazio e `carta_proposta` existir, mover `carta_proposta` para `anexo`;
  - depois remover `carta_proposta` do `formData`;
  - se `anexo` continuar ausente, adicionar placeholder.

#### Compatibilidade de status

- O historico legado tem varios status que nao existem mais no destino.
- Pela decisao de negocio, documentos ativos vao para `finalizado`.
- O historico sera preservado como registro legado.

### C. Solicitacao Desligamento

- **Destino:** `Solicitação Desligamento - Demais áreas (Não comerciais)`

#### Compatibilidade de campos

- Campos compativeis com o destino.
- Nao ha necessidade de renomeacao ou exclusao de campo nas amostras analisadas.

#### Compatibilidade de status

- O historico legado contem `desligamento_juridico`, que nao existe no destino.
- Pela decisao de negocio, documentos ativos vao para `finalizado`.
- O historico sera preservado como registro legado.

---

## 3. Regras de Adaptacao de `formData`

Estas regras devem ser aplicadas ao objeto `formData` durante a migracao:

| Campo Origem | Campo Destino | Regra |
| :--- | :--- | :--- |
| `carta_proposta` | `anexo` | Se `anexo` nao existir ou estiver vazio, copiar o valor de `carta_proposta` para `anexo`. Em seguida remover `carta_proposta`. |
| (ausente) | `anexo` | Se o destino exigir `anexo` e nao houver valor real, adicionar placeholder deterministico, por exemplo `LEGADO_SEM_ANEXO`. |
| (ausente) | `nome_sobrenome_colaborador` | Se o destino exigir esse campo e nao houver valor real, adicionar placeholder deterministico, por exemplo `LEGADO_SEM_NOME_COLABORADOR`. |
| campo legado sem correspondencia | remover | Excluir do `formData` se nao fizer parte do workflow atual e nao houver necessidade historica para leitura operacional. |

### Observacao sobre placeholders

- O objetivo do placeholder e evitar falha futura em validacao/edicao.
- Nao devemos inventar dado de negocio.
- O valor deve deixar explicito que se trata de documento legado migrado.

---

## 4. Decisoes Validadas para Automacao

As seguintes pendencias ja foram resolvidas:

1. **Mapeamento de Status Ativos**
- Todo documento migrado que nao estiver em `finalizado` passa a `finalizado`.

2. **Campos Obrigatorios Vazios**
- Campos obrigatorios ausentes podem receber valor placeholder para nao falhar futuramente.

3. **Dono do Workflow (`ownerEmail`)**
- O `ownerEmail` pode ser atualizado para `fernanda.adami@3ainvestimentos.com.br`.

---

## 5. Estrategia Recomendada de Execucao

1. Migrar primeiro os casos mais simples:
- `Solicitação Desligamento`
- `AC - ...`
- `Alteração ... (Somente Líderes)`

2. Migrar depois os casos com placeholder:
- `HJ - ...`
- `TH - ...`

3. Migrar por ultimo o caso com renomeacao de campo:
- `Cadastro de Novos Entrantes`

4. Em toda migracao:
- atualizar `type`;
- adaptar `formData`;
- atualizar `ownerEmail`;
- mover `status` atual para `finalizado` se necessario;
- manter `history`;
- gerar backup antes de alterar.

---

## 6. Requisitos do Script de Migracao

O script de migracao deve seguir estes principios:

- **Filtro Estrito:** selecionar apenas documentos cujo `type` corresponda exatamente aos tipos legados definidos.
- **Dry Run Obrigatorio:** gerar relatorio completo antes de qualquer alteracao.
- **Backup Previo:** salvar snapshot JSON completo dos documentos candidatos antes da execucao real.
- **Idempotencia:** se o documento ja estiver no `type` novo, nao processar de novo.
- **Transformacao Deterministica:** toda adaptacao de campo deve ser explicita e previsivel.
- **Atualizacao de Owner:** definir `ownerEmail = fernanda.adami@3ainvestimentos.com.br` nos documentos migrados.
- **Normalizacao de Status Atual:** se `status != finalizado`, definir `status = finalizado`.
- **Historico Preservado:** nao recriar documentos e nao apagar `history`.
- **Batch Processing:** usar lotes do Firestore para escrita.
- **Log Detalhado:** registrar `doc.id`, `type` antigo, `type` novo, campos adaptados e se houve uso de placeholder.
