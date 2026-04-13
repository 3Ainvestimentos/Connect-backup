# BRAINSTORM_AJUSTES_PONTUAIS_CONFIGURADOR_2E_MODAL_E_APPROVERS

## 1. Contexto

Depois da `2E.3`, o configurador administrativo de chamados `V2` ja possui:

- catalogo por `Area > Workflow Type > Versoes`;
- criacao de area;
- criacao de workflow type com `v1 draft`;
- criacao de novas versoes draft a partir da ultima publicada;
- editor completo de rascunho em pagina dedicada;
- publicacao e ativacao de versoes.

Durante o uso real da tela, surgiram tres ajustes de UX/comportamento:

1. o editor completo de versao deve abrir em **modal**, nao em pagina dedicada;
2. `areaId` deve ser **contextual e somente leitura** tanto na `v1` quanto nas versoes subsequentes;
3. em etapa `action`, a escolha de aprovadores deve ser feita por **seleção direta de colaboradores no editor**, e o backend deve resolver/persistir o `id3a` canonico.

Esses ajustes nao mudam o objetivo macro da `2E`; eles refinam a experiencia do configurador antes da `2E.4`.

---

## 2. Respostas Fechadas

### 2.1. Quem vai usar?

- admins com permissao `canManageWorkflowsV2`.

### 2.2. Onde aparece?

- na nova tela `/admin/request-config`;
- especificamente na aba `Definicoes`.

### 2.3. O que envolve?

- frontend + backend leve;
- sem reabrir runtime operacional;
- sem alterar a semantica de publicacao/ativacao.

### 2.4. Urgencia

- alta o suficiente para entrar **antes da `2E.4`**, porque sao atritos da experiencia central do configurador.

### 2.5. Decisoes do usuario

- o editor de versao deve ser um **modal completo**, nao pagina;
- `areaId` deve ficar **predefinido e visivel, sem edicao**, tanto na `v1` quanto em novas versoes;
- `approverIds` deve ser escolhido por **selecao direta de colaboradores no editor**, nao por modal separado.

---

## 3. Problema Real

Hoje a superficie de configuracao esta funcional, mas com tres atritos:

- o salto para pagina dedicada quebra o contexto do catalogo e deixa o fluxo mais pesado;
- permitir editar `areaId` repete informacao que o usuario ja acabou de fornecer no contexto anterior;
- editar `approverIds` como texto/lista tecnica torna a configuracao de `action` menos clara do que deveria.

Em resumo:

- o produto ja funciona;
- mas a UX ainda esta mais proxima de uma ferramenta tecnica do que de um configurador administrativo fluido.

---

## 4. Abordagens

## Abordagem A — Ajuste Minimo Sobre a Estrutura Atual

### Como seria

- manter o mesmo editor atual;
- trocar apenas o container de pagina para `Dialog`/`Sheet` grande;
- transformar `areaId` em campo bloqueado;
- trocar `approverIds` textual por multisselecao simples dentro da secao de steps;
- backend continua recebendo lista selecionada e persiste `id3a`.

### Vantagens

- menor custo de implementacao;
- reaproveita quase todo o editor ja pronto;
- baixo risco de regressao funcional.

### Desvantagens

- pode ficar um modal pesado demais se simplesmente transplantar a pagina atual;
- exige cuidado com scroll interno, largura, dirty state e navegacao.

### Quando faz sentido

- quando o objetivo e resolver o atrito rapido sem redesenhar a estrutura do editor.

---

## Abordagem B — Modal Completo com Layout Mais Denso e Contextual

### Como seria

- editor continua funcionalmente igual, mas ganha layout proprio para modal;
- cabecalho compacto com:
  - nome do tipo;
  - versao;
  - status;
  - area contextual somente leitura;
- secoes continuam:
  - geral
  - acesso
  - campos
  - etapas
  - readiness/publicacao
- campos ficam mais compactos;
- `approverIds` vira multisselecao com nomes de colaboradores dentro da etapa action;
- backend aceita os identificadores selecionados e normaliza para `id3a`.

### Vantagens

- melhor equilibrio entre UX e reaproveitamento tecnico;
- preserva a estrutura mental atual do editor;
- reduz quebra de contexto;
- deixa a experiencia mais condizente com o resto do admin.

### Desvantagens

- exige ajustes reais de composicao e responsividade;
- pode pedir alguns refinamentos de componentes auxiliares.

### Quando faz sentido

- quando queremos uma melhora perceptivel de UX sem reabrir a arquitetura da `2E`.

---

## Abordagem C — Modal Leve + Editor Avancado em Segundo Nível

### Como seria

- abrir um modal resumido para versao;
- nele o usuario edita so configuracoes principais;
- campos/etapas/action mais detalhadas abririam submodais ou drawers.

### Vantagens

- modal inicial mais leve;
- menos altura e densidade por tela.

### Desvantagens

- fragmenta a edicao;
- aumenta cliques;
- piora a visao global da versao;
- nao conversa tao bem com a decisao do usuario de manter “a mesma estrutura, porem em modal”.

### Quando faz sentido

- apenas se o editor atual fosse inviavel dentro de modal, o que ainda nao parece ser o caso.

---

## 5. Recomendacao

### Recomendada: Abordagem B

Ela atende melhor o que foi pedido:

- **mesma estrutura**, porem em modal;
- experiencia mais delicada/compacta;
- sem repeticao desnecessaria de `areaId`;
- selecao de aprovadores mais humana dentro do proprio editor.

### O que eu manteria igual

- sem mudar regras de negocio de draft/publish/activate;
- sem mudar `VersionState`;
- sem mexer na logica de publishability alem do necessario para novos payloads de `approverIds`;
- sem mexer na `2E.4`.

---

## 6. Diretrizes YAGNI

Para nao inflar essa rodada, eu evitaria:

- criar nova pagina paralela alem do modal;
- criar sistema de busca/filtro super sofisticado para aprovadores;
- criar detalhamento read-only separado de workflow type se o proprio modal puder atender leitura e edicao;
- criar nova entidade de colaborador no draft;
- suportar multiplos formatos de identidade no banco.

O essencial desta rodada e:

- mudar o container do editor;
- fixar a area como contexto;
- tornar a configuracao de `approverIds` amigavel.

---

## 7. Implicacoes Tecnicas

### 7.1. Editor em modal

Precisaremos decidir entre:

- `Dialog` grande centralizado;
- ou `Sheet`/drawer lateral largo.

Pelo pedido do usuario, o mais coerente parece ser:

- **modal/dialog grande**, com largura ampla e scroll interno.

### 7.2. `areaId` somente leitura

Para `v1`:

- a area vem do modal anterior de criacao do tipo;
- o editor apenas exibe.

Para novas versoes:

- a area vem do `workflowType` atual;
- o editor apenas exibe.

### 7.3. `approverIds`

Frontend:

- o editor mostra nomes de colaboradores em selecao direta;
- sem modal separado.

Backend:

- deve continuar persistindo `id3a` como formato canonico;
- a resolucao de colaborador para `id3a` deve acontecer na camada server-side administrativa.

### 7.4. Compatibilidade com runtime

- o runtime continua consumindo `approverIds` como `id3a`;
- nenhuma mudanca na semantica operacional das `action requests`.

---

## 8. Entendimento Consolidado

O usuario quer uma iteracao de UX do configurador `2E` antes da `2E.4`:

- o editor completo de versao sai de pagina dedicada e vira modal;
- a area deixa de ser editavel e passa a ser apenas contexto visivel;
- configuracao de aprovadores fica amigavel no proprio editor;
- o backend continua dono da normalizacao final para `id3a`.

Isso deve ser tratado como **ajuste pontual da superficie admin atual**, nao como nova fase estrutural dos workflows.

---

## 9. Proximo Passo

Abrir um **define curto e cirurgico** para essa iteracao, com foco em:

1. editor de versao em modal;
2. area contextual somente leitura;
3. selecao direta de aprovadores com persistencia canonica em `id3a`.
