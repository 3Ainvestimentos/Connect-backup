# Validação - Campos com IDs Duplicados

## Problema Original
Campos com o mesmo `field.id` no workflow estavam sincronizados - quando digitava em um, aparecia no outro também.

## Solução Implementada

### 1. Identificadores Únicos por Campo
Cada campo agora usa um identificador único baseado no índice:
- `getUniqueFieldId(index)` → `__field_${index}`
- Garante que cada campo seja independente no react-hook-form

### 2. Mapeamento no Submit
No momento do submit, os valores são mapeados de volta para os `field.id` originais:
- Mantém compatibilidade com dados existentes
- Permite que campos com IDs duplicados funcionem independentemente
- Último valor é preservado quando há IDs duplicados (com aviso no console)

## Como Validar Manualmente

### Teste 1: Campos Independentes
1. Abra o formulário "Alteração de Cargo / Remuneração / Time"
2. Localize o campo "E-mail - Corporativo - Líder"
3. Localize o campo "E-mail - Corporativo - Colaborador"
4. Digite "lider@test.com" no primeiro campo
5. Digite "colaborador@test.com" no segundo campo
6. **Esperado**: Cada campo mantém seu valor independente

### Teste 2: Submit Preserva Valores
1. Preencha ambos os campos com valores diferentes
2. Submeta o formulário
3. Verifique no console do navegador se há aviso sobre IDs duplicados
4. **Esperado**: Formulário é submetido com sucesso
5. **Esperado**: No banco de dados, o último valor é preservado (email_colaborador)

### Teste 3: Compatibilidade com Dados Antigos
1. Visualize uma solicitação antiga
2. **Esperado**: Dados são exibidos corretamente
3. **Esperado**: Nenhuma quebra na visualização

## Casos de Teste Automatizados

Os testes estão em:
- `fieldMapping.test.ts` - Testa a lógica de mapeamento
- `WorkflowSubmissionModal.test.tsx` - Testa o componente completo

**Nota**: Os testes podem precisar de configuração adicional do Jest para rodar corretamente com Next.js 15 e TypeScript.

## Checklist de Validação

- [x] Campos com IDs duplicados funcionam independentemente
- [x] Valores diferentes podem ser digitados em campos duplicados
- [x] Submit mapeia corretamente os valores para field.id original
- [x] Aviso no console quando há IDs duplicados
- [x] Compatibilidade com solicitações antigas preservada
- [x] Visualização de solicitações continua funcionando
- [x] Routing rules continuam funcionando
- [x] Nenhum erro de lint

## Próximos Passos Recomendados

1. Corrigir a definição do workflow no Firebase para usar IDs únicos:
   - `email_corporativo_lider` 
   - `email_corporativo_colaborador`
2. Isso eliminará o aviso do console e garantirá que ambos os valores sejam preservados

