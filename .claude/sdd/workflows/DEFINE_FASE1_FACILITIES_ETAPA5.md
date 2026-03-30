# DEFINE: FASE1_FACILITIES_ETAPA5

> Generated: 2026-03-30
> Status: Ready for design
> Source: solicitacao direta + ROADMAP_FASE1_FACILITIES.md + ROADMAP_ETAPAS_FASE1_FACILITIES.md + implementacao atual da Etapa 4 + fluxo legado de upload em WorkflowSubmissionModal/firestore-service
> Clarity Score: 14/15

## 1. Problem Statement

O piloto v2 precisa suportar upload de arquivo no fluxo de abertura sem depender do mecanismo legado client-side de Storage, permitindo viabilizar `anexo_planilha` com o backend como fonte de verdade do path e da assinatura de upload.

## 2. Users

| User Type | Pain Point | Frequency |
|-----------|-----------|-----------|
| Solicitante interno de Facilities | Precisa abrir chamados com anexo obrigatorio no motor novo, mas hoje o piloto so suporta payload JSON sem infraestrutura de arquivo | Recorrente |
| Time tecnico da Fase 1 | Precisa habilitar upload sem reintroduzir `WorkflowAreasContext`, `firestore-service.ts` ou logica legada de Storage na feature nova | Pontual por etapa |
| Backend/runtime owners | Precisam manter controle server-side sobre quem pode abrir, onde o arquivo sobe e qual URL pode ser persistida | Pontual por etapa |
| Futuras etapas da Fase 1 | Precisam reutilizar a mesma infraestrutura de upload para outros workflows com campo `file` sem redesenhar o contrato | Recorrente |

## 3. Goals (MoSCoW)

### MUST Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | Criar um endpoint backend autenticado para iniciar upload | O frontend consegue pedir uma signed URL enviando `workflowTypeId`, `fieldId`, `fileName` e `contentType` |
| M2 | Validar workflow e campo de arquivo no backend | O endpoint rejeita workflow inexistente/inativo/sem permissao e rejeita `fieldId` que nao seja `type: 'file'` na versao publicada |
| M3 | Definir path de upload no backend | O frontend nao escolhe a pasta final nem o naming do arquivo; recebe isso do backend |
| M4 | Permitir upload client-side usando a signed URL | O frontend consegue enviar o arquivo ao Storage e obter a URL final persistivel no `formData` |
| M5 | Manter o runtime `open-request` sem alteracao de contrato | O upload resulta em uma string URL que continua sendo enviada no `formData` do `POST /api/workflows/runtime/requests` |
| M6 | Remover dependencia da infraestrutura legada de upload | Nenhum arquivo novo do piloto depende de `WorkflowAreasContext` ou `firestore-service.ts` |
| M7 | Nascer reaproveitavel por contrato | O endpoint aceita qualquer `workflowTypeId` e `fieldId` validos, mesmo que o aceite funcional da etapa fique restrito ao piloto de Facilities |

### SHOULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | Isolar a logica de upload em uma camada cliente pequena | O frontend do piloto consome um helper dedicado, sem espalhar `fetch PUT` de upload por componentes |
| S2 | Preservar erros estruturados | O cliente consegue distinguir erro de assinatura/authz de erro no envio do blob |
| S3 | Deixar a base pronta para outros campos `file` na Fase 1 | Workflow 2 usa o mecanismo agora, e workflow 3 pode reutilizar depois sem redesenho do contrato |

### COULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | Retornar metadados auxiliares de upload | O backend pode devolver `storagePath` ou `expiresAt` se isso ajudar depuracao e UX |
| C2 | Permitir estrategia de naming mais amigavel | O backend pode incluir timestamp, `uuid` ou fragmento de contexto no nome final do arquivo |

### WON'T Have (this iteration)

| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | Sistema completo de anexos para todo o produto | A etapa cobre apenas a infraestrutura minima necessaria ao piloto v2 |
| W2 | Patch de `formData` apos criar o request | Continua fora do escopo do runtime nesta fase |
| W3 | Download privado mediado por backend | A etapa cobre upload e URL persistivel, nao gateway de leitura |
| W4 | Multiplos arquivos por campo ou gerenciador de anexos | O foco e um upload por campo `file` no fluxo de abertura |
| W5 | Limpeza automatica de uploads orfaos | Pode ser tratada depois como hardening |
| W6 | Reaproveitar o modal legado ou seu helper de upload | A direcao da fase e isolar o piloto do frontend legado |

## 4. Decisoes Fechadas

### 4.1. Escopo funcional da etapa

Fica fechado que a Etapa 5 implementa apenas a infraestrutura de upload necessaria para o piloto v2:

- assinatura backend para upload;
- envio client-side do blob;
- obtencao de URL persistivel;
- integracao pronta para uso pela abertura de workflows com campo `file`.

A etapa nao habilita sozinha o workflow 2 na UI; isso fica para a Etapa 6.

### 4.2. Contrato arquitetural do upload

Fica fechado que:

- o backend sera a fonte de verdade do path e da assinatura do upload;
- o frontend nao define pasta definitiva por conta propria;
- o runtime `POST /api/workflows/runtime/requests` continua recebendo apenas JSON;
- o valor persistido no `formData` para campos `file` continua sendo string URL.

### 4.3. Escopo de generalidade

Fica fechado que a infraestrutura desta etapa deve nascer:

- generica por contrato;
- restrita por aceite funcional.

Isso significa:

- o endpoint deve validar qualquer `workflowTypeId`/`fieldId` compativel com campo `file`;
- mas a validacao obrigatoria da etapa recai sobre o caso:
  - `workflowTypeId = facilities_solicitacao_suprimentos`
  - `fieldId = anexo_planilha`

### 4.4. Solucao escolhida para assinatura

Fica fechado que a etapa usara a abordagem A:

- o backend gera a signed URL;
- o cliente faz upload direto para o Storage;
- o backend nao recebe o arquivo binario nem faz upload server-side do blob;
- a feature nao replicara o fluxo legado client-side puro.

Consequencias aceitas:

- a etapa passa a incluir backend e frontend;
- o mecanismo resultante fica mais alinhado ao modelo definitivo do produto;
- a feature nova nao depende de `workflowAreas.storageFolderPath` do legado como fonte de verdade de runtime.

### 4.5. Path e metadata do objeto

Fica fechado que o backend gera um `uploadId` proprio por upload e o usa como identificador tecnico principal do objeto.

Path base fechado:

```text
Workflows/Facilities e Suprimentos/workflows_v2/preopen/{workflowTypeId}/{fieldId}/{yyyy-mm}/{uploadId}-{sanitizedFileName}
```

Metadata minima fechada para o objeto:

- `uploadId`
- `workflowTypeId`
- `fieldId`
- `actorUserId`
- `firebaseStorageDownloadTokens`

### 4.6. Resposta esperada da assinatura

Fica fechado que o backend deve devolver tudo que o cliente precisa para concluir o upload, sem derivacao client-side da URL final.

Minimo esperado na resposta:

- `uploadUrl`
- `fileUrl`

O cliente:

- usa `uploadUrl` para enviar o blob;
- usa `fileUrl` como valor persistivel do campo `file` no `formData`;
- nao deriva a URL final por conta propria.

### 4.7. Integracao de frontend nesta etapa

Fica fechado que a Etapa 5 entrega apenas:

- backend de assinatura;
- helper cliente (`api-client`) para pedir assinatura e executar o upload;
- testes automatizados;
- validacao manual por chamada direta.

Nao faz parte desta etapa:

- integrar upload no `OpenWorkflowCard`;
- alterar `DynamicFieldRenderer`;
- habilitar visualmente o workflow 2 na rota do piloto.

### 4.8. Superficies fora do escopo

Fica fechado que a Etapa 5 nao define ainda:

- experiencia multiworkflow da pagina `/pilot/facilities`;
- UX final de anexos no detalhe do chamado;
- regras de download/restringimento de leitura;
- limpeza de arquivos nao vinculados a um request concluido.

## 5. Success Criteria

- o cliente autenticado do piloto consegue solicitar uma signed URL para um campo `file` valido;
- o backend rejeita solicitacao de assinatura para workflow/field sem permissao ou sem suporte a arquivo;
- o cliente consegue subir o blob usando a signed URL e receber/usar a URL final persistivel;
- o fluxo nao depende de `WorkflowAreasContext` nem de `firestore-service.ts`;
- a infraestrutura resultante fica pronta para ser consumida na Etapa 6 pela abertura de `Solicitacao de Suprimentos`;
- a assinatura, o `uploadId`, o path e a metadata sao decididos server-side, nao por convencao improvisada no client.

## 6. Technical Scope

### Backend

- criar endpoint autenticado para iniciar upload do piloto;
- validar ator, `workflowTypeId`, `fieldId`, nome e tipo do arquivo;
- consultar a definicao publicada do workflow para confirmar que o campo e `type: 'file'`;
- reaproveitar a validacao de acesso ja existente no backend sempre que possivel, evitando duplicar regra de permissao para a rota de upload;
- decidir path/naming do arquivo no servidor;
- retornar dados necessarios para o frontend executar o upload.

### Frontend

- criar helper cliente para pedir assinatura;
- criar helper cliente para fazer upload do blob com a signed URL;
- retornar ao chamador a URL final persistivel para uso posterior no `formData`;
- manter a logica isolada da UI da Etapa 4, sem ainda alterar a experiencia multiworkflow completa;
- nao alterar `OpenWorkflowCard` nem `DynamicFieldRenderer` nesta etapa.

### Runtime / API existente

- sem mudanca no contrato do `POST /api/workflows/runtime/requests`;
- sem introduzir patch de `formData`;
- sem mudar as rotas `catalog` e `read`.

### Database / Storage

- sem alteracao de schema em Firestore;
- sem novos indices;
- uso de Storage com path definido pelo backend;
- uso do prefixo `Workflows/Facilities e Suprimentos/workflows_v2/preopen/...` para uploads pre-open do piloto;
- uploads podem existir antes da criacao definitiva do request, aceitando risco controlado de orfao nesta fase.

## 7. Auth Requirements

- a rota de assinatura deve exigir o mesmo Firebase ID token ja usado nas APIs do motor;
- o backend deve validar se o ator pode abrir o workflow antes de assinar o upload;
- o frontend nao recebe credencial privilegiada de Storage; recebe apenas a signed URL da operacao especifica;
- a assinatura deve ser limitada ao arquivo solicitado e ao path decidido pelo backend.
- o ambiente backend precisa usar uma credencial capaz de assinar URLs de Storage.

## 8. Out of Scope

- habilitar `Solicitacao de Suprimentos` na UI do piloto;
- selecao de multiplos workflows na mesma rota;
- alteracoes em `OpenWorkflowCard` e `DynamicFieldRenderer`;
- suporte a upload em etapas posteriores do workflow;
- multiupload por campo;
- alteracao do modelo de leitura (`read-side`);
- reuso de componentes/contextos operacionais legados;
- limpeza automatica de arquivos orfaos;
- download assinado por backend para leitura privada.

## 9. Criterio de Aceite da Etapa

A Etapa 5 sera considerada concluida quando existir uma infraestrutura de upload com signed URL emitida pelo backend, consumivel pelo frontend do piloto, suficiente para anexar um arquivo e obter uma URL persistivel para campos `file` do motor v2, com validacao obrigatoria do caso `anexo_planilha` de `facilities_solicitacao_suprimentos`.

Para esta etapa, a validacao do caso de aceite pode ser feita por chamada direta ao endpoint com token valido e arquivo real; nao e necessaria alteracao de UI para considerar o upload validado.

Ao final do build, a habilitacao operacional da etapa inclui orientar a configuracao da service account para assinatura de URLs no ambiente utilizado pelo piloto.

## 10. Revision History

| Date | Impact | Summary |
|------|--------|---------|
| `2026-03-30` | `High` | criacao do novo define da Etapa 5 com foco em infraestrutura de upload via signed URL no backend para o piloto v2 |
