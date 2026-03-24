# Detalhamento do Ecossistema de Workflows

Este documento mapeia todos os componentes, contextos, páginas e coleções do Firestore que constituem o sistema de Workflows da aplicação 3A RIVA Connect.

---

### 1. Coleções no Firestore (Banco de Dados)

O coração do sistema reside em três coleções principais no Firestore:

*   **`workflowDefinitions`**:
    *   **Propósito:** Armazena os "modelos" ou "plantas" de cada workflow. Cada documento nesta coleção é uma definição completa de um processo, incluindo seu nome, ícone, formulário, etapas (status) e regras.
    *   **Exemplo de Dados:** Nome do workflow, campos do formulário (texto, data, anexo), lista de status (Pendente, Em Análise, Aprovado), regras de SLA e o e-mail do proprietário.

*   **`workflowAreas`**:
    *   **Propósito:** Organiza os workflows em grupos ou "áreas de negócio" (ex: Financeiro, RH, TI). É o que gera os botões de agrupamento na tela de Solicitações.
    *   **Exemplo de Dados:** Nome da área (ex: "Financeiro"), ícone associado e uma ordem customizada para os workflows dentro daquela área.

*   **`workflows`**:
    *   **Propósito:** Armazena cada **solicitação individual** feita por um usuário. Quando alguém preenche e envia um formulário de workflow, um novo documento é criado aqui.
    *   **Exemplo de Dados:** ID sequencial (ex: #0001), tipo de workflow, quem solicitou, data, status atual, os dados preenchidos no formulário (`formData`) e o histórico de todas as alterações (`history`).

*   **`counters`**:
    *   **Propósito:** Coleção técnica usada para gerar IDs sequenciais (como `#0001`, `#0002`) para as solicitações na coleção `workflows`, garantindo que não haja IDs repetidos.

---

### 2. Contextos (Gerenciamento de Dados no Frontend)

Estes são os "cérebros" do lado do cliente que buscam e mantêm os dados do Firestore disponíveis para toda a aplicação.

*   **`ApplicationsContext.tsx`**:
    *   **Responsabilidade:** Gerencia as **definições** de workflow (a coleção `workflowDefinitions`). Ele busca todos os modelos de workflow disponíveis. O nome "Applications" é um legado, mas sua função é focada nas definições dos processos.

*   **`WorkflowsContext.tsx`**:
    *   **Responsabilidade:** Gerencia as **solicitações** de workflow (a coleção `workflows`). Ele busca todas as instâncias de solicitações feitas pelos usuários e fornece funções para adicionar ou atualizar essas solicitações.

*   **`WorkflowAreasContext.tsx`**:
    *   **Responsabilidade:** Gerencia os grupos/áreas de workflow (a coleção `workflowAreas`), garantindo que a tela de solicitações exiba os botões de agrupamento corretos.

---

### 3. Páginas e Componentes (Interface do Usuário)

#### Fluxo do Usuário Final:

*   **`src/app/(app)/applications/page.tsx`**:
    *   **Função:** A página principal de "Solicitações". Exibe os botões das áreas de workflow. É o ponto de partida para um usuário iniciar um novo processo.
    *   **Componentes Chave:**
        *   `WorkflowGroupModal.tsx`: Modal que aparece quando uma área tem múltiplos workflows, permitindo ao usuário escolher qual processo iniciar.
        *   `WorkflowSubmissionModal.tsx`: O modal que renderiza o formulário dinâmico com base na `WorkflowDefinition` selecionada, permitindo ao usuário preencher e enviar a solicitação.
        *   `MyRequests.tsx`: A tabela na parte inferior da página que lista todas as solicitações já feitas pelo usuário logado, permitindo o acompanhamento.
        *   `RequestDetailsModal.tsx`: Modal que exibe os detalhes completos e o histórico de uma solicitação quando o usuário clica para visualizá-la em "Minhas Solicitações".

#### Fluxo de Gestão e Administração:

*   **`src/app/(app)/requests/page.tsx`**:
    *   **Função:** A "Caixa de Entrada" para os **proprietários e responsáveis** por workflows. Lista todas as solicitações pendentes para os processos que eles gerenciam.
    *   **Componentes Chave:**
        *   `ManageRequests.tsx`: O componente principal que implementa a lógica da caixa de entrada.
        *   `RequestApprovalModal.tsx`: Um modal robusto onde o gestor pode visualizar todos os detalhes de uma solicitação, atribuir um responsável, adicionar comentários, solicitar aprovação/ciência de terceiros e, crucialmente, **mover a solicitação para o próximo status**.
        *   `AssigneeSelectionModal.tsx`: Modal para escolher e atribuir um colaborador como responsável pela tarefa.

*   **`src/app/(app)/me/tasks/page.tsx`**:
    *   **Função:** A página "Minhas Tarefas/Ações", que serve como uma caixa de entrada unificada para qualquer usuário que precise realizar uma **ação específica** (aprovar, dar ciência, executar) ou que tenha sido **designado como responsável** por uma tarefa.

*   **`src/app/(app)/admin/workflows/page.tsx`**:
    *   **Função:** O painel de controle mestre para a administração de workflows (acesso de admin).
    *   **Componentes Chave:**
        *   `WorkflowDefinitionsTab.tsx`: A aba principal onde administradores podem criar, editar, importar (via JSON) ou excluir as definições de workflow.
        *   `WorkflowDefinitionForm.tsx`: O formulário complexo para criar ou editar uma `WorkflowDefinition`, definindo todos os campos, status e regras.
        *   `ManageWorkflowAreas.tsx`: Componente para gerenciar as "Áreas de Workflow", permitindo criar/editar os grupos que organizam os processos.
        *   `AllRequestsView.tsx`: Uma tabela que exibe **todas as solicitações do sistema**, permitindo uma visão de auditoria completa, com filtros e exportação para CSV.

---
