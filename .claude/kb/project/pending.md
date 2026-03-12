## Pendências Evolutivas (Auth Cache Pós-Hotfix)

Contexto: após definir o hotfix de `DetachedInstanceError` com cache de identidade mínima, estas melhorias ficam explicitamente fora do escopo imediato para preservar entrega rápida e baixo risco.

### 1) Incluir `user_id` no JWT e priorizar id no miss

- **Status:** Pendente (evolução)
- **Prioridade:** Should (pós-hotfix)
- **Motivação:**
  - Hoje o token usa `sub=email`.
  - Email pode mudar; `user_id` é estável.
  - Priorizar `id` reduz ambiguidades em cenários de alteração de email.
- **Escopo sugerido:**
  - Emissão de token: incluir claim estável (`user_id` ou `sub=id`).
  - Middleware: no miss, priorizar `user_id`; usar email apenas como fallback.
  - Compatibilidade: manter fallback para tokens antigos durante migração.
- **Riscos/atenções:**
  - Compatibilidade de tokens já emitidos.
  - Ajustes em logs/observabilidade para novo claim principal.
- **Critério de aceite:**
  - Fluxo de auth funciona com tokens novos (id-first) e antigos (email fallback), sem regressão.

### 2) Otimização da limpeza do cache (`_clean_expired_entries`) amortizada

- **Status:** Pendente (evolução)
- **Prioridade:** Could/Should (dependendo de carga)
- **Motivação:**
  - Hoje a limpeza pode varrer todo o dict por request.
  - Corretude está OK, mas custo pode crescer com cardinalidade de tokens.
- **Escopo sugerido:**
  - Limpeza sob condição (ex.: a cada N requests) ou por lote limitado.
  - Alternativa: gatilho por threshold de tamanho.
  - Manter lock e invariantes de segurança.
- **Riscos/atenções:**
  - Não criar vazamento de entradas expiradas.
  - Não aumentar contenção de lock sob carga.
- **Critério de aceite:**
  - Mantém corretude de expiração e reduz overhead médio de limpeza em cenários de polling intenso.
