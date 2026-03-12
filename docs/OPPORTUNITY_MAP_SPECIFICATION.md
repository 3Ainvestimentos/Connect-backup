# Especificação do Sistema: Mapa de Oportunidades

## 1. Visão Geral e Conceito

O **Mapa de Oportunidades** é um sistema de gamificação e acompanhamento de metas projetado para visualizar e recompensar o desempenho dos colaboradores em campanhas específicas. A funcionalidade permite que administradores criem "Tipos de Oportunidade" (ex: "Campanha de Vendas de Maio", "Missão de Verão"), configurem grupos de objetivos com lógicas de premiação complexas e atualizem os dados de progresso dos colaboradores via importação de CSV.

Os colaboradores, por sua vez, têm uma página dedicada onde podem visualizar seus resultados consolidados para cada oportunidade à qual foram designados.

---

## 2. Arquitetura de Dados (Schemas no Firestore)

A funcionalidade é sustentada por três coleções principais no Firestore: `opportunityTypes`, `opportunityMap`, e uma subcoleção `missionGroups` dentro de cada `opportunityType`.

### 2.1. `opportunityTypes` (Coleção)

Esta coleção armazena a definição de cada campanha ou "Tipo de Oportunidade". Cada documento representa uma oportunidade distinta que pode ser gerenciada.

**Schema (`OpportunityType`):**
```typescript
interface OpportunityType {
  id: string; // ID do documento no Firestore
  name: string; // Nome da oportunidade (ex: "Campanha de Vendas de Maio")
  description?: string; // Descrição opcional
  recipientIds: string[]; // Array de IDs de colaboradores que podem ver esta oportunidade. `['all']` para todos.
  createdAt: string; // ISO timestamp
}
```

### 2.2. `missionGroups` (Subcoleção de `opportunityTypes`)

Dentro de cada documento de `opportunityType`, existe uma subcoleção chamada `missionGroups`. Cada documento nesta subcoleção representa um "Grupo de Objetivos" com sua própria lógica de premiação.

**Schema (`MissionGroup`):**
```typescript
// Regra de recompensa
interface RewardRule {
  count: number;  // A contagem de objetivos para ativar a regra
  reward: number; // O valor da recompensa em BRL
}

// Objetivo individual dentro de um grupo
interface Objective {
  key: string;       // O ID único do objetivo (ex: 'NET_NOVO_VENDAS'), corresponde à coluna no CSV.
  title: string;     // O título exibido para o usuário (ex: "Net Novo em Vendas").
  description?: string; // Descrição opcional do objetivo.
}

interface MissionGroup {
  id: string; // ID do documento no Firestore
  name: string; // Nome do grupo (ex: "VENDAS_TIME_A"). É normalizado para `MAIUSCULAS_SEM_ACENTOS`.
  description?: string; // Descrição para explicar as regras do grupo.
  logicType: 'tieredReward' | 'linearBonus' | 'allOrNothing' | 'basePlusBonus'; // O tipo de cálculo de recompensa.
  rules: RewardRule[]; // As regras de premiação para esta lógica.
  objectives: Objective[]; // Array de objetivos que pertencem a este grupo.
}
```

### 2.3. `opportunityMap` (Coleção)

Esta coleção armazena os dados de resultado de cada colaborador. O ID de cada documento é o mesmo ID do documento do colaborador na coleção `collaborators`, facilitando a busca.

**Schema (`OpportunityMapData`):**
```typescript
interface OpportunityMapData {
  id: string; // ID do documento (igual ao ID do colaborador)
  userName: string; // Nome do colaborador

  // As chaves a seguir são dinâmicas e correspondem ao ID de cada `OpportunityType`.
  // O valor é um objeto onde cada chave é um `Objective.key`.
  [opportunityTypeId: string]: {
    [objectiveKey: string]: string | number; // ex: 'NPS_GERAL': 9.8, 'ROA_CONSOLIDADO': 1.2
  };
}

// Exemplo de um documento em `opportunityMap`:
{
  "id": "colaborador_id_123",
  "userName": "João Silva",
  "campanhaDeVendasMaio": { // ID do OpportunityType
    "NET_NOVO_VENDAS": 50000,
    "TAXA_DE_CONVERSAO": "85%",
    "TICKET_MEDIO": 120.50
  },
  "missaoDeVerao": {
    "NPS_GERAL": 9.8
  }
}
```
---

## 3. Lógica de Gamificação

As lógicas de recompensa são definidas em `src/lib/gamification-logics.ts`. Elas determinam como o prêmio é calculado com base no número de objetivos que um usuário atingiu dentro de um `MissionGroup`.

-   **Prêmio por Faixas (`tieredReward`):** A recompensa aumenta conforme mais faixas de objetivos são atingidas.
-   **Bônus por Objetivo (`linearBonus`):** Um valor fixo é pago para cada objetivo concluído.
-   **Tudo ou Nada (`allOrNothing`):** Um grande prêmio é pago somente se todos os objetivos do grupo forem concluídos.
-   **Prêmio Base + Bônus (`basePlusBonus`):** Um prêmio inicial pela primeira meta, com um bônus para cada meta adicional.

---

## 4. Componentes e Fluxo de Administração

A gestão é centralizada na página `/admin/opportunity-map`.

### 4.1. `OpportunityTypesManager.tsx`

-   **Responsabilidade:** Componente principal que exibe uma tabela de todos os "Tipos de Oportunidade" existentes.
-   **Ações:** Permite criar, editar (nome, descrição, público-alvo) e excluir tipos de oportunidades através de um modal.

### 4.2. `SectionManager.tsx`

-   **Responsabilidade:** Componente que organiza a página de gerenciamento para um "Tipo de Oportunidade" específico. Ele é renderizado em abas, uma para cada `OpportunityType`.
-   **Estrutura:** Contém o `MissionGroupsManager`, o `ObjectivesManager` (integrado), e a visão coletiva dos dados dos colaboradores.

### 4.3. `MissionGroupsManager.tsx`

-   **Responsabilidade:** Gerencia os "Grupos de Objetivos" para um `OpportunityType` selecionado.
-   **Ações (via Modal):**
    1.  **Criação/Edição de Grupo:**
        -   Definir `name`, `description`.
        -   Selecionar o `logicType` em um dropdown (com tooltips explicativos).
        -   Configurar as `rules` (regras de premiação) de acordo com a lógica selecionada.
        -   **Definir os `objectives`:** Adicionar, editar e remover os objetivos (`key`, `title`, `description`) que pertencem a este grupo.
    2.  **Exclusão de Grupo**.
-   **Interação:** Ao clicar em um grupo na tabela, ele fica selecionado, e os objetivos correspondentes são exibidos no `ObjectivesManager`.

### 4.4. `ObjectivesManager.tsx` (Funcionalidade Integrada)

-   **Responsabilidade:** Exibe e permite gerenciar a lista de objetivos (`key`, `title`, `description`) para o `MissionGroup` atualmente selecionado.
-   **Ações:** Adicionar, editar e remover objetivos do grupo.

### 4.5. Importação de Dados (CSV)

-   **Componente:** Integrado ao `SectionManager.tsx`.
-   **Fluxo:**
    1.  O administrador baixa um modelo CSV.
    2.  A primeira coluna do CSV **deve ser `userEmail`**.
    3.  As colunas subsequentes devem corresponder exatamente às **`key`s dos objetivos** definidos nos grupos (ex: `NPS_GERAL`, `ROA_CONSOLIDADO`).
    4.  Ao fazer o upload, o sistema lê o arquivo, encontra o colaborador pelo e-mail, e atualiza/cria seu documento na coleção `opportunityMap` com os novos dados, dentro do `opportunityTypeId` correspondente.

### 4.6. `EditDataModal.tsx`

-   **Responsabilidade:** Permite a edição manual dos dados de um único colaborador para uma oportunidade específica.
-   **Fluxo:** Na tabela "Visão Coletiva", o admin clica em "Editar" em um usuário. O modal abre, exibindo os campos (chave-valor) para aquela oportunidade, permitindo que o admin os altere diretamente.

---

## 5. Componentes e Fluxo do Usuário Final

### 5.1. `OpportunityMapPage.tsx`

-   **Responsabilidade:** A página onde o colaborador visualiza seus resultados.
-   **Fluxo:**
    1.  A página busca os dados do colaborador logado na coleção `opportunityMap`.
    2.  Ela também busca as definições de `opportunityTypes` e `missionGroups`.
    3.  A página filtra e exibe apenas as oportunidades para as quais o usuário foi designado (`recipientIds`).
    4.  Os dados são apresentados em seções (uma para cada `opportunityType`), mostrando os resultados de cada objetivo (`objective.title`) e o valor correspondente. A lógica para calcular e exibir a recompensa total pode ser adicionada aqui.
