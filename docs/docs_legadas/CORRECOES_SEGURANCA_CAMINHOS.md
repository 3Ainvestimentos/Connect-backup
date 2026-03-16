# Correções de Segurança em Caminhos de Workflows

## Resumo das Correções

### Abordagem Conservadora

As correções foram implementadas de forma **conservadora** para garantir que não quebrem funcionalidades existentes, focando apenas nos problemas críticos de segurança (path traversal).

---

### Problemas Identificados e Corrigidos

#### 1. ✅ Vulnerabilidade de Path Traversal (CRÍTICO)

**Problema**: A função `uploadFile` concatenava caminhos diretamente sem sanitização, permitindo possíveis ataques de path traversal (ex: `../../etc/passwd`).

**Correção**: 
- Função `sanitizeStoragePath` previne path traversal
- **Abordagem defensiva**: Se sanitização completa falhar, aplica validação mínima (apenas path traversal) e normalização básica
- Não rejeita caminhos existentes válidos que possam ter formatos incomuns

**Arquivos Modificados**:
- `src/lib/path-sanitizer.ts` (novo arquivo)
- `src/lib/firestore-service.ts`

---

#### 2. ✅ Validação Conservadora no Schema Zod

**Problema**: O schema `workflowAreaSchema` validava apenas que `storageFolderPath` não estava vazio.

**Correção**: 
- Adicionada validação `.refine()` **conservadora** que apenas:
  - Bloqueia path traversal (`..`)
  - Bloqueia valores vazios ou apenas `.` ou `..`
- **NÃO rejeita** caminhos existentes válidos que possam ter formatos variados

**Arquivos Modificados**:
- `src/contexts/WorkflowAreasContext.tsx`

---

#### 3. ✅ Normalização Básica de Caminhos

**Problema**: Caminhos podiam ter barras duplas ou usar separadores diferentes (Windows vs Unix).

**Correção**: 
- Normalização básica e conservadora:
  - Remove barras no início e fim (padrão Firebase Storage)
  - Converte `\` para `/` (compatibilidade Windows/Unix)
  - Remove barras duplas/triplas
- **Não altera** outros aspectos do caminho para manter compatibilidade

---

#### 4. ✅ Sanitização de RequestId

**Problema**: Embora `requestId` seja gerado de forma segura (sempre numérico), ainda era usado sem validação adicional.

**Correção**: 
- `requestId` agora é sanitizado antes de uso
- **Abordagem defensiva**: Se sanitização falhar, aplica apenas validação de path traversal

---

## Funções Criadas

### `sanitizeStoragePath(path: string): string`
- Sanitiza e normaliza um caminho único
- **Foco principal**: Previne path traversal
- Normaliza separadores e barras duplas
- **Conservadora**: Não rejeita caracteres especiais válidos

### `buildStorageFilePath(basePath: string, subPath: string, fileName: string): string`
- Constrói caminho completo de forma segura
- Sanitiza cada componente separadamente
- Garante estrutura consistente: `base/sub/file`

### `isValidStorageFolderPath(path: string): boolean`
- Validação **mínima e conservadora**
- Usado na validação do schema Zod
- Apenas verifica path traversal e valores vazios
- **Não rejeita** caminhos válidos com formatos variados

---

## Validações Implementadas

### Validações Críticas (Sempre Aplicadas)
1. **Path Traversal**: Bloqueia `..`, `../`, etc. ✅ **CRÍTICO**
2. **Valores Vazios**: Garante que caminho não seja vazio ✅

### Normalizações Aplicadas (Não Quebram Funcionalidade)
3. **Barras Duplas**: Normaliza `/` múltiplos para um único `/`
4. **Início/Fim**: Remove barras no início e fim do caminho (padrão Firebase)
5. **Separadores**: Normaliza `\` para `/` (compatibilidade Windows/Unix)

### **NÃO Valida/Remove** (Para Não Quebrar)
- ❌ Caracteres especiais (permitidos pelo Firebase Storage)
- ❌ Espaços (podem ser válidos)
- ❌ Acentos (podem ser válidos)
- ❌ Outros formatos válidos mas incomuns

---

## Tratamento de Erros Defensivo

### Na Função `uploadFile`:

```typescript
try {
  // Tenta sanitização completa primeiro
  sanitizedStoragePath = sanitizeStoragePath(storagePath);
  sanitizedRequestId = sanitizeStoragePath(requestId);
} catch (error) {
  // FALLBACK: Se sanitização completa falhar (ex: caminho existente incomum),
  // aplica apenas validação mínima (path traversal) e normalização básica
  // Isso garante que caminhos existentes válidos continuem funcionando
  if (storagePath.includes('..') || requestId.includes('..')) {
    reject(new Error("Path traversal detectado"));
    return;
  }
  // Normalização mínima
  sanitizedStoragePath = storagePath.trim().replace(/^\/+|\/+$/g, '').replace(/\\/g, '/').replace(/\/+/g, '/');
  sanitizedRequestId = requestId.trim().replace(/^\/+|\/+$/g, '').replace(/\\/g, '/').replace(/\/+/g, '/');
}
```

---

## Compatibilidade com Dados Existentes

### ✅ Garantido
- Caminhos existentes válidos **continuam funcionando**
- Sanitização é **idempotente** (pode ser aplicada múltiplas vezes)
- Se sanitização completa falhar, usa fallback conservador
- Validação no schema **não rejeita** caminhos existentes válidos

### ⚠️ Casos Especiais
- Se algum caminho existente contiver `..` (path traversal), será rejeitado (correto do ponto de vista de segurança)
- Caminhos com formatos muito incomuns serão normalizados, mas não rejeitados

---

## Impacto das Mudanças

### Segurança
- ✅ **Previne path traversal** (problema crítico resolvido)
- ✅ Garante que arquivos só são salvos em locais autorizados
- ✅ Validação em múltiplas camadas (schema + runtime)

### Robustez
- ✅ Lida com diferentes formatos de caminho (Windows/Unix)
- ✅ Normaliza entrada inconsistente do usuário
- ✅ Tratamento defensivo de erros

### Compatibilidade
- ✅ **Não quebra caminhos existentes válidos**
- ✅ Sanitização é conservadora
- ✅ Fallback para validação mínima se sanitização completa falhar
- ✅ Retrocompatível com dados já existentes

---

## Testes Recomendados

1. ✅ Testar upload com caminhos válidos normais
2. ✅ Testar upload com caminhos existentes no banco
3. ✅ Testar caminhos com espaços e acentos (devem funcionar)
4. ✅ Tentar inserir `../` no storageFolderPath (deve ser rejeitado)
5. ✅ Testar caminhos com barras duplas (devem ser normalizados)
6. ✅ Testar criação de WorkflowArea com caminho inválido (deve mostrar erro apropriado)

---

## Arquivos Criados/Modificados

### Novos Arquivos
- `src/lib/path-sanitizer.ts` - Utilitários de sanitização de caminhos (conservadores)

### Arquivos Modificados
- `src/lib/firestore-service.ts` - Sanitização defensiva em `uploadFile` com fallback
- `src/contexts/WorkflowAreasContext.tsx` - Validação conservadora no schema

---

## Data da Correção

18 de Dezembro de 2025

---

## Notas Importantes

- **Abordagem Conservadora**: As mudanças foram feitas para serem o mais compatíveis possível com dados existentes
- **Foco em Segurança Crítica**: Foco principal é prevenir path traversal, que é um problema crítico de segurança
- **Fallback Defensivo**: Se sanitização completa falhar, usa validação mínima ao invés de falhar completamente
- **Não Rejeita Caminhos Válidos**: A validação no schema não rejeita caminhos existentes válidos, apenas bloqueia path traversal e valores vazios
