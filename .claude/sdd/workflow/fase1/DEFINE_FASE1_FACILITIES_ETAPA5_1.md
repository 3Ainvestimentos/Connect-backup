# DEFINE: FASE1_FACILITIES_ETAPA5_1

> Generated: 2026-03-30
> Status: Ready for design
> Source: solicitacao direta + implementation da Etapa 5 + DEFINE_FASE1_FACILITIES_ETAPA5.md + DEFINE_FASE1_FACILITIES_ETAPA6.md
> Clarity Score: 15/15

## 1. Problem Statement

O backend de upload da Etapa 5 nasceu generico, mas o helper cliente ficou localizado e nomeado dentro do namespace `pilot`, criando uma fronteira errada para uma capacidade que deve ser reutilizavel por outros workflows e pela evolucao futura da camada cliente.

## 2. Users

| User Type | Pain Point | Frequency |
|-----------|-----------|-----------|
| Time tecnico da Fase 1 | Precisa integrar upload na Etapa 6 sem carregar um helper estruturalmente preso ao piloto | Pontual por etapa |
| Futuras etapas de workflows | Precisam reutilizar upload de arquivo sem depender do namespace `pilot` nem de naming especifico de Facilities | Recorrente |
| Maintainers da camada cliente | Precisam de uma separacao coerente entre helper generico de workflows e adaptadores especificos do piloto | Recorrente |

## 3. Goals (MoSCoW)

### MUST Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | Promover o helper cliente de upload para uma camada generica de workflows | A API cliente de upload deixa de viver em `src/lib/workflows/pilot/*` e passa a existir em um modulo compartilhavel de workflows |
| M2 | Remover naming especifico de piloto para a API de upload | `uploadPilotFile` e `requestPilotUpload` deixam de ser a interface principal, substituidos por nomes genericos coerentes com o backend |
| M3 | Preservar comportamento da Etapa 5 sem regressao funcional | A assinatura, o `PUT` do blob e o retorno de `fileUrl` continuam com o mesmo comportamento validado no smoke |
| M4 | Manter o backend intacto | Nenhuma rota, contrato HTTP ou path de Storage muda nesta etapa |
| M5 | Deixar a Etapa 6 consumir apenas a camada correta | O frontend do piloto passa a depender do helper generico, e nao do namespace `pilot`, para upload de arquivo |

### SHOULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | Isolar tipos de upload da tipagem do piloto | Tipos e erros de upload passam a viver ao lado do helper generico |
| S2 | Reduzir ambiguidade conceitual da camada `pilot` | `src/lib/workflows/pilot/*` volta a concentrar apenas consumo especifico de catalog/read/runtime do piloto |
| S3 | Preservar testes com fronteira mais limpa | Os testes de upload passam a cobrir o modulo generico, e nao um helper com prefixo `pilot` |

### COULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | Deixar um facade temporario de compatibilidade | Se ajudar na transicao, o namespace `pilot` pode reexportar o helper por um curto periodo, desde que a interface principal ja seja a generica |

### WON'T Have (this iteration)

| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | Promover toda a camada cliente do piloto para modulo compartilhado | O ajuste desta etapa e apenas no helper de upload |
| W2 | Alterar a UI do piloto | A etapa nao mexe em `OpenWorkflowCard`, `DynamicFieldRenderer` ou na rota `/pilot/facilities` |
| W3 | Redesenhar o backend de upload | O backend da Etapa 5 ja foi validado e deve permanecer igual |
| W4 | Consolidar a experiencia multiworkflow | Isso continua sendo objetivo da Etapa 6 |

## 4. Decisoes Fechadas

### 4.1. Natureza da etapa

Fica fechado que a Etapa 5.1 e uma correcao arquitetural curta entre a Etapa 5 e a Etapa 6.

Ela existe para:

- corrigir a fronteira da camada cliente de upload;
- evitar que a Etapa 6 consuma uma API com naming e localizacao errados;
- reduzir a chance de espalhar acoplamento ao namespace `pilot`.

### 4.2. Escopo da correcao

Fica fechado que a Etapa 5.1 mexe apenas em:

- localizacao do helper cliente de upload;
- naming do helper e dos tipos de upload;
- testes associados a esse helper;
- pontos de import que precisem acompanhar essa promocao.

Nao faz parte desta etapa:

- mudar comportamento de upload;
- mudar UX;
- mudar backend;
- habilitar workflow 2 na tela.

### 4.3. Modelo alvo da camada cliente

Fica fechado que o desenho desejado e:

- backend generico;
- helper client tambem generico;
- piloto apenas como consumidor.

Isso implica:

- mover o helper de upload para o namespace fechado:
  - `src/lib/workflows/upload/`
- renomear a API cliente para algo como:
  - `requestWorkflowFileUpload`

Fica fechado tambem que `putFileToSignedUrl` ja possui um nome suficientemente generico e, nesta etapa, sera apenas movida de modulo, sem renomeacao adicional.

### 4.4. Escopo da migracao de tipos

Fica fechado que a migracao dos tipos de upload sera total.

Devem sair de `src/lib/workflows/pilot/types.ts`:

- `PilotUploadInitInput`
- `PilotUploadInitResult`
- `PilotUploadFileInput`
- `PilotUploadFileResult`
- `PilotFileTransferErrorCode`
- `PilotFileTransferError`

Esses tipos passam a existir ao lado do helper generico em `src/lib/workflows/upload/`, com naming neutro e coerente com a API promovida.

`src/lib/workflows/pilot/types.ts` deve permanecer apenas com tipos especificos do piloto.

### 4.5. Politica de transicao

Fica fechado que a Etapa 5.1 faz corte limpo:

- sem facade temporario;
- sem reexport em `src/lib/workflows/pilot/*`;
- sem manter duas interfaces paralelas para a mesma capacidade.

Todos os imports internos devem ser atualizados diretamente para o novo namespace `src/lib/workflows/upload/`.

### 4.6. Compatibilidade com a Etapa 6

Fica fechado que a Etapa 6 deve passar a depender diretamente da nova camada cliente generica.

O define/design da Etapa 6 nao deve mais tratar a promocao do helper como parte do mesmo build, porque essa correcao precisa vir antes.

## 5. Success Criteria

- o helper cliente de upload deixa de viver em `src/lib/workflows/pilot/*`;
- o helper cliente de upload passa a viver em `src/lib/workflows/upload/*`;
- a interface principal de upload passa a ter naming generico;
- os tipos e erros associados ao upload deixam de ser modelados como `Pilot*`;
- o comportamento validado da Etapa 5 permanece igual;
- a Etapa 6 pode integrar upload na UI sem carregar acoplamento estrutural ao namespace `pilot`.

## 6. Technical Scope

### Frontend / Client Layer

- criar ou usar um namespace mais generico para client helpers de workflows;
- usar explicitamente o namespace:
  - `src/lib/workflows/upload/`
- mover para essa camada:
  - init de upload;
  - `PUT` do blob;
  - retorno de `fileUrl`;
  - erro de transferencia;
- ajustar imports e testes conforme necessario.

### Backend

- fora do escopo;
- nenhum ajuste em `POST /api/workflows/runtime/uploads`.

### Database / Storage

- fora do escopo;
- nenhum ajuste em Firestore, path ou metadata.

## 7. Auth Requirements

- o helper generico continua usando o Firebase ID token do usuario autenticado;
- a autenticacao continua sendo feita via `Authorization: Bearer <token>`;
- a promocao do helper nao altera o modelo de permissao nem introduz credencial privilegiada no cliente.

## 8. Out of Scope

- workflow selector;
- suporte a `file` na UI;
- filtros `all` vs `active` da Etapa 6;
- leitura de anexos no dialog;
- consolidacao da camada cliente inteira do piloto.

## 9. Criterio de Aceite da Etapa

A Etapa 5.1 sera considerada concluida quando a infraestrutura cliente de upload da Etapa 5 estiver promovida para uma camada generica de workflows, com naming e tipagem neutros, sem regressao funcional do fluxo de assinatura e upload ja validado, e pronta para ser consumida pela Etapa 6.

## 10. Revision History

| Date | Impact | Summary |
|------|--------|---------|
| `2026-03-30` | `Medium` | criacao do define da Etapa 5.1 para corrigir a localizacao e o naming do helper cliente de upload antes da Etapa 6 |
