---
name: Correção Normalização Email e Workflows
overview: Corrigir problemas de normalização de email que impedem o Pablo de ver seus chamados, notificações não serem enviadas, e problemas na criação de chamados. Inclui correções nas regras do Firestore, busca de colaboradores, e limpeza de dados.
todos:
  - id: "1"
    content: Adicionar função normalizeEmailForComparison no WorkflowsContext.tsx
    status: pending
  - id: "2"
    content: Corrigir busca do colaborador no WorkflowSubmissionModal.tsx (linha 79) para normalizar email
    status: pending
  - id: "3"
    content: Remover condição que impede notificação quando formData está vazio no WorkflowsContext.tsx (linha 167)
    status: pending
    dependencies:
      - "1"
  - id: "4"
    content: Normalizar busca do owner no WorkflowsContext.tsx (linha 175)
    status: pending
    dependencies:
      - "1"
  - id: "5"
    content: Normalizar emails nas routingRules no WorkflowsContext.tsx (linha 189)
    status: pending
    dependencies:
      - "1"
  - id: "6"
    content: Corrigir comparação de email nas Firestore Rules (linha 85) para aceitar ambos os formatos
    status: pending
  - id: "7"
    content: Remover espaço do final do nome do workflow no Firebase Console
    status: pending
  - id: "8"
    content: Testar se Pablo consegue ver seus chamados após correções
    status: pending
    dependencies:
      - "1"
      - "2"
      - "3"
      - "4"
      - "5"
      - "6"
---

# Plano Completo: Correção de Problemas de Normalização de Email e Workflows

## Problemas Identificados

1. **Firestore Rules (linha 85)**: Comparação direta de email falha quando Pablo faz login com `@3ariva.com.br` mas `ownerEmail` está como `@3ainvestimentos.com.br`
2. **WorkflowsContext.tsx (linha 175)**: Busca do owner não normaliza email, impedindo notificações
3. **WorkflowSubmissionModal.tsx (linha 79)**: Busca do colaborador não normaliza email, impedindo criação de chamados
4. **WorkflowsContext.tsx (linha 167)**: Notificação só é enviada quando `formData` está vazio
5. **WorkflowsContext.tsx (linha 189)**: RoutingRules não normaliza emails na busca
6. **Dados**: Nome do workflow tem espaço no final (`"Solicitação de Pagamentos "`)

## Arquivos a Modificar

### 1. `firestore.rules`

- **Linha 85**: Adicionar comparação normalizada de email para `ownerEmail`

### 2. `src/contexts/WorkflowsContext.tsx`

- **Linha ~13**: Adicionar função `normalizeEmailForComparison`
- **Linha 167**: Remover condição que impede notificação quando há `formData`
- **Linha 175**: Normalizar email na busca do owner
- **Linha 189**: Normalizar emails nas routingRules

### 3. `src/components/applications/WorkflowSubmissionModal.tsx`

- **Linha 79**: Normalizar email na busca do colaborador

### 4. Firebase Console (Manual)

- Remover espaço do final do nome do workflow `"Solicitação de Pagamentos "`

## Implementação Detalhada

### Etapa 1: Adicionar Função de Normalização no WorkflowsContext

Criar função utilitária no topo do arquivo `WorkflowsContext.tsx` (após imports):

```typescript
const normalizeEmailForComparison = (email: string): string => {
  return email.replace(/@3ariva\.com\.br$/, '@3ainvestimentos.com.br');
};
```

### Etapa 2: Corrigir Busca do Colaborador no WorkflowSubmissionModal

Em `WorkflowSubmissionModal.tsx`, linha 79, alterar:

```typescript
// ANTES:
const currentUserCollab = collaborators.find(c => c.email === user?.email);

// DEPOIS:
const normalizeEmailForComparison = (email: string): string => {
  return email.replace(/@3ariva\.com\.br$/, '@3ainvestimentos.com.br');
};
const currentUserCollab = collaborators.find(c => 
  normalizeEmailForComparison(c.email) === normalizeEmailForComparison(user?.email || '')
);
```

### Etapa 3: Corrigir Notificações no WorkflowsContext

**3.1 Remover condição de formData vazio (linha 167)**

```typescript
// ANTES:
if (Object.keys(requestData.formData).length === 0) { 
    // notificações...
}

// DEPOIS:
// Sempre enviar notificações, remover a condição
```

**3.2 Normalizar busca do owner (linha 175)**

```typescript
// ANTES:
const owner = collaborators.find(c => c.email === definition.ownerEmail);

// DEPOIS:
const owner = collaborators.find(c => 
  normalizeEmailForComparison(c.email) === normalizeEmailForComparison(definition.ownerEmail)
);
```

**3.3 Normalizar routingRules (linha 189)**

```typescript
// ANTES:
const recipientUsers = collaborators.filter(c => rule.notify.includes(c.email));

// DEPOIS:
const recipientUsers = collaborators.filter(c => 
  rule.notify.some(email => 
    normalizeEmailForComparison(c.email) === normalizeEmailForComparison(email)
  )
);
```

### Etapa 4: Corrigir Firestore Rules

Em `firestore.rules`, linha 85, alterar para comparar ambos os formatos:

```javascript
// ANTES:
resource.data.ownerEmail == request.auth.token.email ||

// DEPOIS:
(resource.data.ownerEmail == request.auth.token.email ||
 (resource.data.ownerEmail.endsWith('@3ainvestimentos.com.br') && 
  request.auth.token.email.replace('@3ariva.com.br', '@3ainvestimentos.com.br') == resource.data.ownerEmail) ||
 (request.auth.token.email.endsWith('@3ariva.com.br') && 
  request.auth.token.email.replace('@3ariva.com.br', '@3ainvestimentos.com.br') == resource.data.ownerEmail)) ||
```

**Nota**: Firestore Rules não suporta `replace()` diretamente. A solução é comparar ambos os formatos manualmente.

### Etapa 5: Limpeza de Dados (Manual no Firebase Console)

1. Acessar coleção `workflowDefinitions`
2. Buscar workflow com `name: "Solicitação de Pagamentos "`
3. Editar campo `name` removendo espaço no final
4. Salvar como `"Solicitação de Pagamentos"` (sem espaço)

## Ordem de Execução

1. **Primeiro**: Corrigir código TypeScript (Etapas 1-3)
2. **Segundo**: Corrigir Firestore Rules (Etapa 4)
3. **Terceiro**: Limpeza de dados (Etapa 5)
4. **Teste**: Verificar se Pablo consegue ver seus chamados e receber notificações

## Validação

Após implementação, verificar:

- Pablo consegue ver chamados com `ownerEmail` do setor financeiro
- Notificações são enviadas ao criar chamados (mesmo com formData preenchido)
- Chamados podem ser criados por usuários com email `@3ariva.com.br`
- Busca por `type: "Solicitação de Pagamentos"` (sem espaço) funciona

## Riscos

- **Baixo**: Mudanças são aditivas e não quebram funcionalidade existente
- **Médio**: Firestore Rules - testar cuidadosamente para não bloquear acesso legítimo
- **Baixo**: Normalização de email já existe no AuthContext, estamos apenas aplicando consistentemente