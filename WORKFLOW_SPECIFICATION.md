# Especificação do Sistema de Workflows do 3A RIVA Connect

## 1. Visão Geral

Este documento detalha a estrutura técnica e a lógica por trás do sistema de criação e gerenciamento de workflows na plataforma 3A RIVA Connect. O objetivo é fornecer um guia claro para a equipe de BI, desenvolvedores e assistentes de IA sobre como construir definições de workflow, seja através da interface de administração ou via upload de arquivos JSON.

Um **Workflow** é um processo digital que permite a um colaborador submeter uma solicitação através de um formulário dinâmico, que pode então ser acompanhada, atribuída e processada por gestores.

---

## 2. Estrutura da Definição de Workflow (JSON)

O coração do sistema é o objeto `WorkflowDefinition`. Cada workflow na plataforma é uma instância deste objeto. Abaixo está a especificação completa dos campos, que serve como base para a criação de arquivos JSON para importação.

```typescript
// Estrutura de uma Definição de Workflow
interface WorkflowDefinition {
  name: string;          // Nome único e descritivo do workflow. Ex: "Solicitação de Reembolso".
  description: string;   // Texto exibido no cabeçalho do formulário de solicitação.
  icon: string;          // Nome de um ícone da biblioteca `lucide-react`. Ex: "DollarSign".
  ownerEmail: string;    // (Obrigatório) E-mail do colaborador proprietário deste workflow.
  fields: FormFieldDefinition[]; // Array de objetos que define os campos do formulário.
  statuses: WorkflowStatusDefinition[]; // Array de objetos que define as etapas do processo.
  defaultSlaDays?: number; // (Opcional) Prazo padrão em dias úteis para a conclusão da solicitação.
  slaRules?: SlaRule[];    // (Opcional) Array de regras para definir SLAs condicionais.
  routingRules?: RoutingRule[]; // (Opcional) Array de regras para notificação automática.
}
```

### 2.1. Campos do Formulário (`FormFieldDefinition`)

Cada objeto no array `fields` representa um campo que o usuário preencherá no formulário.

```typescript
// Estrutura de um Campo de Formulário
interface FormFieldDefinition {
  id: string;        // ID único (sem espaços, usar snake_case). Ex: "valor_reembolso".
  label: string;     // O rótulo que aparece para o usuário. Ex: "Valor do Reembolso (R$)".
  type: 'text' | 'textarea' | 'select' | 'date' | 'date-range'; // O tipo de campo.
  required: boolean; // `true` se o campo for obrigatório, `false` caso contrário.
  placeholder?: string; // (Opcional) Texto de ajuda dentro do campo.
  options?: string[];   // (Obrigatório para `type: 'select'`) Um array de strings com as opções.
}
```

**Tipos de Campo (`type`):**
-   `text`: Para entradas curtas (nomes, títulos).
-   `textarea`: Para textos longos (descrições, justificativas).
-   `select`: Para uma lista de opções predefinidas.
-   `date`: Para selecionar uma única data.
-   `date-range`: Para selecionar um período (data de início e fim).

### 2.2. Etapas do Workflow (`WorkflowStatusDefinition`)

Cada objeto no array `statuses` representa uma etapa ou status do processo. A ordem no array é importante, pois define a sequência lógica do fluxo. **A primeira etapa da lista será o status inicial padrão de toda nova solicitação.**

```typescript
// Estrutura de um Status
interface WorkflowStatusDefinition {
  id: string;    // ID único (sem espaços, usar snake_case). Ex: "em_analise".
  label: string; // O nome da etapa exibido para os usuários. Ex: "Em Análise".
}
```

### 2.3. Regras de SLA (`SlaRule`)

Esta é uma funcionalidade (opcional) para definir um prazo de conclusão (SLA) condicional.

```typescript
// Estrutura de uma Regra de SLA
interface SlaRule {
  field: string; // O `id` do campo do formulário que acionará a regra.
  value: string; // O valor que o campo deve ter para a regra ser ativada.
  days: number;  // O número de dias úteis para o SLA.
}
```

### 2.4. Regras de Roteamento (`RoutingRule`)

Esta é uma funcionalidade (opcional) para notificar automaticamente pessoas específicas com base nos dados preenchidos no formulário.

```typescript
// Estrutura de uma Regra de Roteamento
interface RoutingRule {
  field: string;     // O `id` do campo do formulário que acionará a regra.
  value: string;     // O valor que o campo deve ter para a regra ser ativada.
  notify: string[];  // Um array de e-mails que devem ser notificados.
}
```

**Exemplo de uso:** Em um workflow de "Solicitação de Material", se o `type` do campo `centro_de_custo` for "Marketing", a regra pode notificar automaticamente `gestor.mkt@3a.com`.

---

## 3. Páginas de Interação com o Workflow

### 3.1. Submissão (Usuário Final)
-   **Localização:** `Aplicações`
-   **Funcionalidade:** O usuário clica no card do workflow desejado. Um modal (`WorkflowSubmissionModal`) é aberto, renderizando dinamicamente o formulário com base nos `fields` da definição. Ao submeter, uma nova `WorkflowRequest` é criada no Firestore.

### 3.2. Acompanhamento (Usuário Final)
-   **Localização:** `Aplicações` > Seção "Minhas Solicitações"
-   **Funcionalidade:** Uma tabela (`MyRequests`) lista todas as solicitações feitas pelo usuário logado, exibindo o tipo, a data e o status atual.

### 3.3. Gerenciamento (Gestores)
-   **Localização:** `Menu do Avatar` > `Paineis de controle` > `Solicitações` (página `/requests`)
-   **Funcionalidade:** Uma caixa de entrada (`ManageRequests`) mostra todas as solicitações. Gestores podem:
    -   Filtrar por status ou responsável.
    -   Abrir detalhes de uma solicitação em um modal (`RequestApprovalModal`).
    -   Atribuir um responsável.
    -   Mudar o status da solicitação (ex: de "Pendente" para "Aprovado").
    -   Adicionar comentários no histórico de auditoria.

---

## 4. Exemplo Completo de JSON para um Workflow

Este exemplo pode ser usado como um modelo para criar um arquivo `reembolso.json` e importá-lo na plataforma.

```json
{
  "name": "Solicitação de Reembolso",
  "description": "Utilize este formulário para solicitar o reembolso de despesas relacionadas ao trabalho. Anexe o comprovante na seção apropriada.",
  "icon": "DollarSign",
  "ownerEmail": "responsavel.financeiro@3a.com",
  "defaultSlaDays": 5,
  "fields": [
    {
      "id": "tipo_despesa",
      "label": "Tipo de Despesa",
      "type": "select",
      "required": true,
      "options": ["Alimentação", "Transporte", "Hospedagem", "Material de Escritório", "Outro"]
    },
    {
      "id": "valor_reembolso",
      "label": "Valor do Reembolso (R$)",
      "type": "text",
      "required": true,
      "placeholder": "Ex: 150.75"
    },
    {
      "id": "data_despesa",
      "label": "Data da Despesa",
      "type": "date",
      "required": true
    },
    {
      "id": "justificativa",
      "label": "Justificativa",
      "type": "textarea",
      "required": true,
      "placeholder": "Descreva o motivo da despesa."
    }
  ],
  "statuses": [
    {
      "id": "pendente",
      "label": "Pendente"
    },
    {
      "id": "em_analise_financeiro",
      "label": "Em Análise (Financeiro)"
    },
    {
      "id": "aprovado",
      "label": "Aprovado"
    },
    {
      "id": "reprovado",
      "label": "Reprovado"
    }
  ],
  "slaRules": [
    {
      "field": "tipo_despesa",
      "value": "Hospedagem",
      "days": 10
    }
  ],
  "routingRules": [
    {
      "field": "tipo_despesa",
      "value": "Hospedagem",
      "notify": ["viagens@3a.com", "financeiro@3a.com"]
    }
  ]
}
```
