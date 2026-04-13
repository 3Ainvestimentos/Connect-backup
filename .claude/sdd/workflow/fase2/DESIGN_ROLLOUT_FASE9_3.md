# DESIGN: Tela administrativa de permissões V2 (Fase 9.3)

> Generated: 2026-04-12
> Status: Ready for /build
> Source: `.claude/sdd/workflow/fase2/DEFINE_DEPLOY_ROLLOUT_POS_2B_FASE2.md` (seção 9.3)
> Previous phases: DESIGN_DEPLOY_ROLLOUT_POS_2B_FASE2_9_1.md, DESIGN_DEPLOY_ROLLOUT_POS_2B_FASE2_9_2.md

---

## 1. Requirements Summary

### Phase Objective

Expor as três permissões v2 (`canManageRequestsV2`, `canManageWorkflowsV2`, `canOpenRequestsV2`) na tela administrativa `/admin` (aba **Permissões**) com labels finais claros, defaults `false` e garantias operacionais de kill-switch. O super admin precisa conseguir ligar/desligar cada toggle por colaborador sem ambiguidade em relação às permissões legadas, e o desligamento deve refletir imediatamente nos gates de navegação (fase 9.1) e nos gates server-side (fase 9.2) já implementados.

### Problem

Após 9.1 e 9.2, a plataforma já possui:

- Tipos `canManageRequestsV2`, `canManageWorkflowsV2`, `canOpenRequestsV2` em `CollaboratorPermissions` (opcionais).
- Defaults `false` em `defaultPermissions` (CollaboratorsContext.tsx linhas 68-85).
- Gates client-side (`RequesterV2Guard`, `ManagementV2Guard`, `WorkflowConfigAdminGuard`).
- Gates server-side (`authenticateRequesterV2Actor`, `authenticateManagementV2Actor`, `authenticateWorkflowConfigAdmin`).

Porém, a tela `PermissionsPageContent.tsx` atualmente só expõe `canManageWorkflowsV2` (com label ambíguo `Workflows V2`) e **não expõe** `canManageRequestsV2` nem `canOpenRequestsV2`. Isso significa que o super admin não tem como ligar/desligar essas permissões por UI — inviabiliza o rollout piloto e o kill-switch operacional definido em M7 do DEFINE.

### Success Criteria (do DEFINE)

| # | Critério | Alvo |
|---|----------|------|
| M2 | Permissões v2 com default `false` | `canManageRequestsV2`, `canManageWorkflowsV2`, `canOpenRequestsV2` existem, com labels finais e nascem desativados fora do piloto |
| M5 | Piloto fechado com 4 usuários | Super admin consegue ligar as 3 permissões para exatamente 4 colaboradores via UI |
| M7 | Kill-switch operacional | Desligar os toggles da tela de permissões remove imediatamente acesso/visibilidade sem novo deploy |
| S1 | Labels menos ambíguos | Tela exibe `Solicitações V2`, `Gestão Chamados V2`, `Config Chamados V2`; labels legadas ficam marcadas como `(Legado)` |
| Clareza | Super admin identifica toggles v2 sem confusão com legado | Revisão visual aprovada antes do deploy |

### Constraints

- **Não alterar** a interface `CollaboratorPermissions` (os três flags v2 já existem, com `?` e default `false`). Apenas tornar os três flags **visíveis** na tabela de permissões.
- **Não quebrar** contratos de permissões legadas (`canManageWorkflows`, `canManageRequests`).
- **Não introduzir** nova coleção Firestore: todo o controle continua em `collaborators/{id}.permissions` e auditoria em `collaborator_logs/{logId}`.
- **Mutation existente** `updateCollaboratorPermissions` (CollaboratorsContext.tsx:175) **já suporta** todos os flags — não precisa mudar assinatura nem lógica de persistência.
- A tela é acessível via tab `permissions` em `/admin` e protegida por `SuperAdminGuard` (já existe).
- Labels devem ser estáveis para que testes automatizados consigam asserir (`getByLabelText`, `getByText`).
- CLAUDE.md: componentes funcionais, Tailwind mobile-first, `cn()`, lucide-react, sem chamadas diretas ao Firestore em componentes, mutations via Context.

### Out of Scope

- Renomear fisicamente os flags legados no Firestore (C1 do DEFINE é documental apenas).
- Criar script/CLI de rollout — enablement continuará manual, conforme regra operacional da seção 9.4 do DEFINE.
- Alterar `functions/` ou `firestore.rules` (permissions flags são lidos por guards client e por `permission-auth.ts` server-side, ambos já existem).
- Telemetria/analytics do uso da tela de permissões.

---

## 2. Architecture

### ASCII Diagram

```
+---------------------------------------------------------------+
|  /admin (Tab "Permissões")                                    |
|  src/app/(app)/admin/page.tsx                                 |
+---------------------------------------------------------------+
                          |
                          v
+---------------------------------------------------------------+
|  <SuperAdminGuard> (existente)                                |
|  src/components/auth/SuperAdminGuard.tsx                      |
+---------------------------------------------------------------+
                          |
                          v
+---------------------------------------------------------------+
|  PermissionsPageContent (MODIFY)                              |
|  src/components/admin/PermissionsPageContent.tsx              |
|                                                               |
|  - permissionLabels (MODIFY): adicionar 2 flags v2 novos,     |
|    renomear label do flag v2 já exposto, opcionalmente        |
|    marcar legado com "(Legado)".                              |
|  - permissionGroups (NOVO): estrutura de grupo para render    |
|    [ Legado | V2 (Rollout) | Plataforma ] com <TableHead>     |
|    colSpan para reduzir ambiguidade visual.                   |
|  - Switch handlers: REUTILIZA handlePermissionToggle atual.   |
+---------------------------------------------------------------+
                          |
                          v
+---------------------------------------------------------------+
|  useCollaborators() (INALTERADO)                              |
|  src/contexts/CollaboratorsContext.tsx                        |
|                                                               |
|  - CollaboratorPermissions (INALTERADO — flags já existem)    |
|  - defaultPermissions (INALTERADO — flags já são false)       |
|  - updateCollaboratorPermissions() (INALTERADO — escreve      |
|    collaborators/{id} + log em collaborator_logs/{logId})     |
+---------------------------------------------------------------+
                          |
                          v
+---------------------------------------------------------------+
|  Firestore                                                    |
|  collaborators/{id}.permissions.{canOpenRequestsV2,           |
|                                   canManageRequestsV2,        |
|                                   canManageWorkflowsV2}      |
|  collaborator_logs/{logId} (audit trail)                      |
+---------------------------------------------------------------+
                          |
                          v
+---------------------------------------------------------------+
|  KILL-SWITCH REFLECTION (read path — já existe)               |
|                                                               |
|  Client:  useAuth() -> userProfile.permissions ----> Guards   |
|           (RequesterV2Guard / ManagementV2Guard /             |
|            WorkflowConfigAdminGuard)                          |
|  Server:  src/lib/workflows/runtime/permission-auth.ts        |
|           src/lib/workflows/admin-config/auth.ts              |
|           lê collaborators/{id}.permissions a cada request    |
+---------------------------------------------------------------+
```

### Flow (Kill-switch ligar/desligar)

```
Super admin                   PermissionsPageContent       CollaboratorsContext            Firestore
    |                                 |                          |                            |
    |--toggle Switch canOpenRequestsV2|                          |                            |
    |                                 |--updateCollaborator      |                            |
    |                                 |  Permissions(id, new)--->|                            |
    |                                 |                          |--addDocument               |
    |                                 |                          |  collaborator_logs-------->|
    |                                 |                          |--updateDocument            |
    |                                 |                          |  collaborators/{id}------->|
    |                                 |<----resolve--------------|                            |
    |                                 |                          |                            |
    |<---toast "Permissão atualizada" |                          |                            |
    |                                                                                         |
    |--- next request do usuario alvo ------------------------------------------------------->|
    |    client guards leem user.permissions (onSnapshot) -> redirect se false                |
    |    server auth leem collaborators/{authUid}.permissions -> 403 se false                 |
```

---

## 3. Architecture Decisions (ADR-Lite)

### ADR-1: Expor os três flags v2 na mesma tabela da aba Permissões (sem criar tela nova)

| Attribute | Value |
|-----------|-------|
| **Context** | A tela `PermissionsPageContent.tsx` já centraliza todas as permissões administráveis por super admin. Precisamos expor 2 flags v2 novos (`canManageRequestsV2`, `canOpenRequestsV2`) e ajustar o label do flag v2 existente (`canManageWorkflowsV2`). |
| **Choice** | Adicionar os flags à lista `permissionLabels` existente, mantendo a mesma tabela, mesmo guard (`SuperAdminGuard`), mesmo handler `handlePermissionToggle` e mesmo mutation `updateCollaboratorPermissions`. |
| **Rationale** | (1) Reusa 100% da lógica de escrita/auditoria. (2) Super admin encontra v2 e legado no mesmo lugar. (3) Zero mudança em Context, service layer, Firestore ou testes existentes. (4) Minimiza risco de rollback. |
| **Alternatives** | **A.** Criar página dedicada `/admin/rollout` só com flags v2. Rejeitado: duplicaria guards, confundiria o super admin, e o kill-switch precisa ser o mesmo mecanismo do controle regular (regra de M7 do DEFINE). **B.** Criar `feature_flags` collection separada. Rejeitado por W4 do DEFINE (sem nova flag infra) e porque a semântica de "por colaborador" é por permissão, não global. |
| **Consequences** | **Positivo**: simplicidade máxima, aderência ao DEFINE, risco baixo. **Negativo**: a tabela fica mais larga (3 colunas novas). Mitigado pela ADR-2 (agrupamento visual). |

### ADR-2: Agrupar colunas em `Legado` / `V2 (Rollout)` / `Plataforma` via cabeçalho multi-nível

| Attribute | Value |
|-----------|-------|
| **Context** | Com 3 flags v2 + 2 flags legados afins (`canManageWorkflows`, `canManageRequests`), a tabela fica ambígua. DEFINE S1 exige labels menos ambíguos. |
| **Choice** | Introduzir uma estrutura `permissionGroups: { key: 'legacy' \| 'v2' \| 'platform', label, items: permissionLabels[] }` e renderizar uma linha extra de `<TableHead>` com `colSpan` por grupo antes da linha de labels. |
| **Rationale** | (1) Visualmente separa legado de v2 sem renomear o contrato técnico (obedece W2 do DEFINE). (2) Sinaliza explicitamente ao super admin que as colunas do grupo `V2 (Rollout)` controlam o rollout. (3) Mantém a mesma tabela e mesmo estado. |
| **Alternatives** | **A.** Ordenar por nome/ordem manual sem agrupar. Rejeitado: permanece ambíguo. **B.** Criar sub-abas (`Legado` / `V2`). Rejeitado: quebra a experiência atual de ver todas as permissões de um usuário numa linha. **C.** Usar badges coloridas por permissão. Rejeitado: excesso de ruído visual. |
| **Consequences** | **Positivo**: clareza imediata; atende S1 e C1 do DEFINE sem tocar nos flags. **Negativo**: a tabela ganha um cabeçalho de 2 linhas (pequena mudança estrutural). Testes de acessibilidade precisam ser ajustados (`aria-label` por Switch já existe). |

### ADR-3: Manter contratos de auditoria e mutation inalterados

| Attribute | Value |
|-----------|-------|
| **Context** | `updateCollaboratorPermissions` já grava um log em `collaborator_logs` com `oldValue`/`newValue` do objeto `permissions` inteiro. Qualquer flag ligado/desligado já fica auditado automaticamente. |
| **Choice** | **Não** criar logs especiais para v2. **Não** mudar assinatura de mutation. Apenas garantir que o Switch chame o mesmo handler. |
| **Rationale** | A auditoria em `collaborator_logs` já captura `permissions` como objeto; os novos campos aparecem naturalmente. Não há necessidade de chamadas extras nem de um `v2_rollout_log` dedicado. |
| **Alternatives** | **A.** Log separado `rollout_v2_log` com `{uid, flag, enabled, at, by}`. Rejeitado: duplica dado já presente em `collaborator_logs`. **B.** Persistir timestamp `rolloutEnabledAt` no collaborator. Rejeitado: fora de escopo (W4 do DEFINE proíbe feature flag infra). |
| **Consequences** | **Positivo**: zero mudança em service/context, testes existentes continuam passando. **Negativo**: auditoria específica do rollout só fica disponível via filtro no `collaborator_logs` (aceitável, o DEFINE não exige relatório dedicado). |

### ADR-4: Defaults continuam aplicados via merge `{...defaultPermissions, ...c.permissions}`

| Attribute | Value |
|-----------|-------|
| **Context** | Usuários existentes no Firestore podem não ter os três flags v2 no documento. A UI precisa exibir `false` para eles sem crashar. |
| **Choice** | Confiar no merge já existente em `CollaboratorsContext.tsx` (`select: data => data.map(c => ({ ...c, permissions: { ...defaultPermissions, ...c.permissions } }))`). Não fazer backfill no Firestore; o default é sempre aplicado na leitura. |
| **Rationale** | (1) Evita migration de coleção (risco baixo). (2) Consistente com o padrão já usado pelos flags `canManageWorkflowsV2` expostos desde 9.1. (3) Qualquer write subsequente via `updateCollaboratorPermissions` persistirá o objeto inteiro (com os três flags) — o documento auto-regulariza em primeiro toggle. |
| **Alternatives** | Script de backfill escrevendo `canOpenRequestsV2: false` / `canManageRequestsV2: false` em todos os collaborators. Rejeitado por W4 (sem script) e por aumentar risco do deploy sem benefício prático. |
| **Consequences** | **Positivo**: zero migration, zero risco. **Negativo**: se alguém consultar Firestore diretamente, verá colaboradores sem o campo até o primeiro toggle. Aceitável — guards tratam ausência como `false`. |

---

## 4. File Manifest

| # | File | Agent | Change | Description |
|---|------|-------|--------|-------------|
| 1 | `src/components/admin/PermissionsPageContent.tsx` | `@react-frontend-developer` | Modify | Adicionar `canOpenRequestsV2` e `canManageRequestsV2` em `permissionLabels`, renomear label de `canManageWorkflowsV2` para `Config Chamados V2`, ajustar labels legados para `(Legado)`, introduzir `permissionGroups` com cabeçalho multi-nível (`Legado` / `V2 (Rollout)` / `Plataforma`), fazer `FilterableHeader` aceitar `rowSpan` e importar `cn` de `@/lib/utils` |
| 2 | `src/components/admin/__tests__/PermissionsPageContent.test.tsx` | `@react-frontend-developer` | Create | Testes unitários cobrindo: (a) renderiza 3 colunas v2 com labels finais; (b) Switches v2 iniciam `false` quando colaborador não tem os flags; (c) toggle chama `updateCollaboratorPermissions` com novo flag setado; (d) cabeçalho de grupo `V2 (Rollout)` presente; (e) labels legadas exibidas com `(Legado)` |
| 3 | `src/contexts/CollaboratorsContext.tsx` | `@react-frontend-developer` | **No change** | Contrato já contempla os três flags v2; `defaultPermissions` já inicializa `false`; `updateCollaboratorPermissions` já persiste objeto inteiro. Verificação visual apenas. |
| 4 | `src/app/(app)/admin/page.tsx` | `@react-frontend-developer` | **No change** | Já embala `PermissionsPageContent` em `SuperAdminGuard` dentro da aba `permissions`. |
| 5 | `firestore.rules` | `@firebase-specialist` | **No change** | Regras existentes para `collaborators/{id}` e `collaborator_logs/{id}` já cobrem update por super admin. Nenhum campo novo na coleção. |
| 6 | `src/lib/firestore-service.ts` | `@firebase-specialist` | **No change** | `updateDocumentInCollection` já usa `cleanDataForFirestore` (linha 280); o objeto `permissions` inteiro passa por sanitização automaticamente. |

**Resumo**: Apenas **1 arquivo de produção** muda (`PermissionsPageContent.tsx`) e **1 arquivo de teste** é criado. Todos os flags, mutations, sanitizers e guards já existem.

---

## 5. Code Patterns (copy-paste ready)

### 5.1 Atualização de `permissionLabels` e `permissionGroups`

```typescript
// src/components/admin/PermissionsPageContent.tsx

import type { CollaboratorPermissions } from '@/contexts/CollaboratorsContext';
import { cn } from '@/lib/utils';

type PermissionKey = keyof CollaboratorPermissions;

interface PermissionLabel {
    key: PermissionKey;
    label: string;
    description?: string;
}

interface PermissionGroup {
    key: 'legacy' | 'v2' | 'platform';
    label: string;
    items: PermissionLabel[];
}

/**
 * Agrupa os toggles por natureza (legado, rollout v2, plataforma)
 * para reduzir ambiguidade visual durante a fase de convivência.
 * Veja ADR-2 em DESIGN_ROLLOUT_FASE9_3.md.
 */
const permissionGroups: PermissionGroup[] = [
    {
        key: 'legacy',
        label: 'Legado',
        items: [
            { key: 'canManageWorkflows', label: 'Workflows (Legado)' },
            { key: 'canManageRequests', label: 'Solicitações (Legado)' },
        ],
    },
    {
        key: 'v2',
        label: 'V2 (Rollout)',
        items: [
            { key: 'canOpenRequestsV2', label: 'Solicitações V2' },
            { key: 'canManageRequestsV2', label: 'Gestão Chamados V2' },
            { key: 'canManageWorkflowsV2', label: 'Config Chamados V2' },
        ],
    },
    {
        key: 'platform',
        label: 'Plataforma',
        items: [
            { key: 'canManageContent', label: 'Conteúdo' },
            { key: 'canManageTripsBirthdays', label: 'Viagens/Aniversários' },
            { key: 'canViewTasks', label: 'Minhas Tarefas' },
            { key: 'canViewBI', label: 'Business Intelligence' },
            { key: 'canViewRankings', label: 'Rankings' },
            { key: 'canViewOpportunityMap', label: 'Mapa de Oportunidades' },
            { key: 'canViewCRM', label: 'CRM Interno' },
            { key: 'canViewStrategicPanel', label: 'Painel Estratégico' },
            { key: 'canViewDirectoria', label: 'Diretoria' },
            { key: 'canViewMeetAnalyses', label: 'Bob Meet Análises' },
            { key: 'canViewBILeaders', label: 'BI Líderes' },
        ],
    },
];

/**
 * Flat list usado para iterar nas <TableCell> de cada colaborador,
 * derivado diretamente de permissionGroups para manter ordem e
 * consistência entre header e body da tabela.
 */
const permissionLabels: PermissionLabel[] = permissionGroups.flatMap(g => g.items);
```

### 5.2 Cabeçalho multi-nível com `colSpan`

```tsx
// src/components/admin/PermissionsPageContent.tsx
// Dentro do <Table> existente — substituir o <TableHeader> atual.

const FilterableHeader = ({
    fkey,
    label,
    uniqueValues,
    rowSpan,
}: {
    fkey: 'area' | 'position';
    label: string;
    uniqueValues: string[];
    rowSpan?: number;
}) => (
    <TableHead rowSpan={rowSpan} className="align-bottom">
        <div className="flex items-center gap-2">
            <span className="flex-grow">{label}</span>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-muted">
                        <Filter className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-60 overflow-y-auto">
                    <DropdownMenuLabel>Filtrar por {label}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <ScrollArea>
                        {uniqueValues.map(value => (
                            <DropdownMenuCheckboxItem
                                key={value}
                                checked={filters[fkey].includes(value)}
                                onCheckedChange={() => handleFilterChange(fkey, value)}
                            >
                                {value}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </ScrollArea>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </TableHead>
);

<TableHeader>
    {/* Linha 1: grupos (Legado | V2 (Rollout) | Plataforma) */}
    <TableRow>
        <TableHead rowSpan={2} className="align-bottom">
            Colaborador
        </TableHead>
        <FilterableHeader fkey="area" label="Área" uniqueValues={uniqueAreas} rowSpan={2} />
        <FilterableHeader fkey="position" label="Cargo" uniqueValues={uniquePositions} rowSpan={2} />
        {permissionGroups.map(group => (
            <TableHead
                key={group.key}
                colSpan={group.items.length}
                className={cn(
                    'text-center border-b',
                    group.key === 'v2' && 'bg-[hsl(170,60%,50%)]/10 text-[hsl(170,60%,30%)] font-semibold'
                )}
                aria-label={`Grupo ${group.label}`}
            >
                {group.label}
            </TableHead>
        ))}
    </TableRow>

    {/* Linha 2: labels individuais por permissão */}
    <TableRow>
        {permissionGroups.map(group =>
            group.items.map(item => (
                <TableHead key={item.key} className="whitespace-nowrap">
                    {item.label}
                </TableHead>
            ))
        )}
    </TableRow>
</TableHeader>
```

> **Nota**: não basta “mover” `FilterableHeader` para a primeira linha. O componente atual encapsula seu próprio `<TableHead>`, então ele precisa aceitar `rowSpan?: number` e forwardar esse prop ao `<TableHead>` interno.

### 5.3 `<TableBody>` permanece praticamente idêntico

```tsx
// src/components/admin/PermissionsPageContent.tsx
// O body continua iterando sobre permissionLabels (flat),
// garantindo alinhamento de colunas com o header (segunda linha).

<TableBody>
    {filteredCollaborators.map(collaborator => (
        <TableRow key={collaborator.id}>
            <TableCell className="font-medium">
                {collaborator.name}
                <br />
                <span className="text-xs text-muted-foreground">
                    {collaborator.email}
                </span>
            </TableCell>
            <TableCell>{collaborator.area}</TableCell>
            <TableCell>{collaborator.position}</TableCell>
            {permissionLabels.map(p => (
                <TableCell key={p.key}>
                    {updatingId === collaborator.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Switch
                            checked={!!collaborator.permissions[p.key]}
                            onCheckedChange={() =>
                                handlePermissionToggle(collaborator, p.key)
                            }
                            disabled={updatingId === collaborator.id}
                            aria-label={`Ativar/desativar permissão ${p.label} para ${collaborator.name}`}
                            className="data-[state=checked]:bg-[hsl(170,60%,50%)]"
                        />
                    )}
                </TableCell>
            ))}
        </TableRow>
    ))}
</TableBody>
```

### 5.4 Handler `handlePermissionToggle` — inalterado

```typescript
// src/components/admin/PermissionsPageContent.tsx (linhas 69-90 atuais)
// ZERO MUDANÇA: já suporta qualquer PermissionKey e já persiste
// o objeto permissions completo via updateCollaboratorPermissions,
// que por sua vez escreve em collaborators/{id} + collaborator_logs.

const handlePermissionToggle = async (
    collaborator: Collaborator,
    permissionKey: keyof CollaboratorPermissions
) => {
    const newPermissions = {
        ...collaborator.permissions,
        [permissionKey]: !collaborator.permissions[permissionKey],
    };
    setUpdatingId(collaborator.id);
    try {
        await updateCollaboratorPermissions(collaborator.id, newPermissions);
        toast({
            title: 'Permissão Atualizada',
            description: `${collaborator.name} ${
                newPermissions[permissionKey] ? 'agora tem acesso a' : 'não tem mais acesso a'
            } '${permissionLabels.find(p => p.key === permissionKey)?.label}'.`,
        });
    } catch (error) {
        toast({
            title: 'Erro ao atualizar permissão',
            description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.',
            variant: 'destructive',
        });
    } finally {
        setUpdatingId(null);
    }
};
```

### 5.5 Ajuste em `Skeleton` loading state

```tsx
// O loading skeleton atual mostra 6 placeholders de Switch.
// Como agora existem 16 permissões (2 legadas + 3 v2 + 11 plataforma),
// aumente para 8-10 ou torne dinâmico a partir de permissionLabels.length.

{loading && (
    <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-md">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64" />
                </div>
                <div className="flex gap-3">
                    {Array.from({ length: Math.min(permissionLabels.length, 8) }).map((_, j) => (
                        <Skeleton key={j} className="h-6 w-11" />
                    ))}
                </div>
            </div>
        ))}
    </div>
)}
```

---

## 6. Data Contract (Firestore)

### Coleção: `collaborators/{collaboratorId}` — **sem mudanças estruturais**

```typescript
// Já existente em src/contexts/CollaboratorsContext.tsx (inalterado)
export interface CollaboratorPermissions {
    canManageWorkflows: boolean;          // legado — inalterado
    canManageWorkflowsV2?: boolean;       // v2 — default false (já existe)
    canManageRequests: boolean;           // legado — inalterado
    canManageRequestsV2?: boolean;        // v2 — default false (já existe)
    canOpenRequestsV2?: boolean;          // v2 — default false (já existe)
    canManageContent: boolean;
    canManageTripsBirthdays: boolean;
    canViewTasks: boolean;
    canViewBI: boolean;
    canViewRankings: boolean;
    canViewCRM: boolean;
    canViewStrategicPanel: boolean;
    canViewOpportunityMap: boolean;
    canViewMeetAnalyses: boolean;
    canViewDirectoria: boolean;
    canViewBILeaders: boolean;
}
```

**Default aplicado na leitura** (já existe em `CollaboratorsContext.tsx` select do useQuery):

```typescript
select: (data) => data.map(c => ({
    ...c,
    permissions: { ...defaultPermissions, ...c.permissions }
}))
```

### Coleção: `collaborator_logs/{logId}` — **sem mudanças**

Cada toggle já gera automaticamente um documento de log (via mutation existente) com:

```typescript
{
    collaboratorId: string;
    collaboratorName: string;
    updatedBy: string;                       // user.displayName || 'Sistema'
    updatedAt: string;                       // ISO timestamp
    changes: [
        {
            field: 'permissions',
            oldValue: CollaboratorPermissions,   // objeto completo antes
            newValue: CollaboratorPermissions,   // objeto completo depois
        }
    ]
}
```

Qualquer diff de `canOpenRequestsV2` / `canManageRequestsV2` / `canManageWorkflowsV2` fica visível no `CollaboratorAuditLogModal` sem nenhuma mudança de código — o modal já imprime todos os campos do objeto `permissions`.

### Sanitização

`updateDocumentInCollection` em `src/lib/firestore-service.ts` (linha 280) já chama `cleanDataForFirestore(data)` antes de qualquer write. O objeto `{ permissions }` passa por `cleanDataForFirestore` automaticamente. **Nenhuma mudança necessária**.

### Security Rules (`firestore.rules`)

- Leitura de `collaborators/*` e escrita pelo super admin já cobertas.
- `collaborator_logs/*` append-only pelo próprio contexto (já coberto).
- **Nenhuma mudança** é necessária — nenhuma coleção nova, nenhum campo novo no schema, nenhum caminho novo.

---

## 7. Testing Strategy

| Level | File | What to test |
|-------|------|--------------|
| Unit (component) | `src/components/admin/__tests__/PermissionsPageContent.test.tsx` | (1) Renderiza cabeçalho de grupo `V2 (Rollout)`. (2) Renderiza `Solicitações V2`, `Gestão Chamados V2`, `Config Chamados V2` como colunas. (3) Labels legadas renderizam com sufixo `(Legado)`. (4) Switches v2 começam `false` para colaborador sem os flags. (5) Toggle dispara `updateCollaboratorPermissions(id, newPermissions)` com exatamente o flag alterado. (6) Toast de sucesso usa o label final (`Solicitações V2` etc.). (7) Toast de erro renderiza mensagem. |
| Integration (context) | Não abrir nova frente nesta fase | `useCollaborators` e `updateCollaboratorPermissions` já têm cobertura própria; a 9.3 fica deliberadamente restrita a teste de componente com mock do context, sem espionar `firestore-service` nem `updateDocumentInCollection`. |
| Guards (regressão) | `src/components/auth/__tests__/RequesterV2Guard.test.tsx`, `ManagementV2Guard.test.tsx`, `WorkflowConfigAdminGuard.test.tsx` | Re-rodar a suíte existente para confirmar que a leitura dos novos flags continua permitindo/bloqueando acesso conforme esperado. Sem mudanças no código dos guards. |
| E2E manual | `.claude/sdd/workflow/fase2/DEFINE_DEPLOY_ROLLOUT_POS_2B_FASE2.md` seção 9.4 | Smoke manual: (a) super admin liga `canOpenRequestsV2` para piloto; (b) piloto vê `/solicitacoes` na sidebar; (c) super admin desliga; (d) piloto perde acesso imediatamente na próxima navegação. |

### Teste-modelo (copy-paste ready)

```tsx
// src/components/admin/__tests__/PermissionsPageContent.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PermissionsPageContent from '@/components/admin/PermissionsPageContent';

// Mock do SuperAdminGuard para deixar passar
jest.mock('@/components/auth/SuperAdminGuard', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock do context
const mockUpdate = jest.fn().mockResolvedValue(undefined);
const mockUseCollaborators = jest.fn();
const baseCollaborator = {
    id: 'c1',
    id3a: '001',
    name: 'Ana Silva',
    email: 'ana@3a.com',
    axis: 'ops',
    area: 'Tecnologia',
    position: 'Analista',
    segment: '-',
    leader: '-',
    city: 'SP',
    permissions: {
        canManageWorkflows: false,
        canManageWorkflowsV2: false,
        canManageRequests: false,
        canManageRequestsV2: false,
        canOpenRequestsV2: false,
        canManageContent: false,
        canManageTripsBirthdays: false,
        canViewTasks: false,
        canViewBI: false,
        canViewRankings: false,
        canViewCRM: false,
        canViewStrategicPanel: false,
        canViewOpportunityMap: false,
        canViewMeetAnalyses: false,
        canViewDirectoria: false,
        canViewBILeaders: false,
    },
};

jest.mock('@/contexts/CollaboratorsContext', () => ({
    useCollaborators: () => mockUseCollaborators(),
}));

jest.mock('@/hooks/use-toast', () => ({
    toast: jest.fn(),
}));

describe('PermissionsPageContent — Fase 9.3', () => {
    beforeEach(() => {
        mockUpdate.mockClear();
        mockUseCollaborators.mockReturnValue({
            collaborators: [baseCollaborator],
            loading: false,
            updateCollaboratorPermissions: mockUpdate,
        });
    });

    it('renderiza o cabeçalho de grupo V2 (Rollout)', () => {
        render(<PermissionsPageContent />);
        expect(screen.getByLabelText(/Grupo V2 \(Rollout\)/i)).toBeInTheDocument();
    });

    it('exibe as três colunas v2 com labels finais', () => {
        render(<PermissionsPageContent />);
        expect(screen.getByText('Solicitações V2')).toBeInTheDocument();
        expect(screen.getByText('Gestão Chamados V2')).toBeInTheDocument();
        expect(screen.getByText('Config Chamados V2')).toBeInTheDocument();
    });

    it('marca as permissões legadas com o sufixo (Legado)', () => {
        render(<PermissionsPageContent />);
        expect(screen.getByText('Workflows (Legado)')).toBeInTheDocument();
        expect(screen.getByText('Solicitações (Legado)')).toBeInTheDocument();
    });

    it('Switch canOpenRequestsV2 inicia desligado e persiste true ao clicar', async () => {
        render(<PermissionsPageContent />);
        const toggle = screen.getByRole('switch', {
            name: /Ativar\/desativar permissão Solicitações V2 para Ana Silva/i,
        });
        expect(toggle).not.toBeChecked();

        fireEvent.click(toggle);

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledWith(
                'c1',
                expect.objectContaining({ canOpenRequestsV2: true })
            );
        });
        // garante preservação dos demais flags
        expect(mockUpdate).toHaveBeenCalledWith(
            'c1',
            expect.objectContaining({
                canManageWorkflows: false,
                canManageRequests: false,
                canManageRequestsV2: false,
                canManageWorkflowsV2: false,
            })
        );
    });

    it('permite desligar canManageRequestsV2 (kill-switch)', async () => {
        const withFlag = {
            ...baseCollaborator,
            permissions: {
                ...baseCollaborator.permissions,
                canManageRequestsV2: true,
            },
        };
        mockUseCollaborators.mockReturnValue({
            collaborators: [withFlag],
            loading: false,
            updateCollaboratorPermissions: mockUpdate,
        });
        render(<PermissionsPageContent />);
        const toggle = screen.getByRole('switch', {
            name: /Ativar\/desativar permissão Gestão Chamados V2 para Ana Silva/i,
        });
        expect(toggle).toBeChecked();
        fireEvent.click(toggle);
        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledWith(
                'c1',
                expect.objectContaining({ canManageRequestsV2: false })
            );
        });
    });
});
```

---

## 8. Rollback Plan

### 8.1 Rollback de código (git revert)

Como a mudança é isolada em 1 componente, o rollback é trivial:

```bash
git revert <commit-da-fase-9.3>
```

**Impacto do revert**: Volta a exibir apenas `canManageWorkflowsV2` (com label antigo `Workflows V2`), removendo as colunas `canOpenRequestsV2` e `canManageRequestsV2` da UI. **Os flags continuam existindo** no Firestore e sendo respeitados pelos guards client/server (9.1 e 9.2) — só não são administráveis via UI.

**Risco do revert**: se o piloto já foi ligado e precisar ser desligado depois do revert, o super admin precisa editar direto no Firestore ou via um novo deploy. Por isso, **preferir kill-switch operacional** (8.2) a rollback de código.

### 8.2 Kill-switch operacional (preferencial — M7 do DEFINE)

Para desligar o rollout sem deploy:

1. Super admin acessa `/admin` → aba `Permissões`.
2. Desliga os toggles `Solicitações V2`, `Gestão Chamados V2`, `Config Chamados V2` dos 4 usuários piloto.
3. Nos próximos segundos, os guards client-side (`RequesterV2Guard`, `ManagementV2Guard`, `WorkflowConfigAdminGuard`) expulsam o usuário das rotas v2.
4. Nas próximas requisições, o server-side (`authenticateRequesterV2Actor` etc.) retorna 403.

**Nenhum novo deploy, nenhum script, nenhuma mudança de código.** Esse é o contrato definido em M7 e na seção 9.4 do DEFINE.

### 8.3 Rollback de dados

- **Não há migration** a reverter — nenhum schema change, nenhum backfill.
- Logs em `collaborator_logs` permitem auditar quem ligou/desligou qual flag, para quem, e em qual momento. Caso seja necessário reconstruir estado anterior, o modal `CollaboratorAuditLogModal` já mostra `oldValue`/`newValue` do objeto `permissions`.

### 8.4 Checklist de verificação pós-rollback (seja qual for o caminho)

- [ ] `/admin` → aba `Permissões` carrega sem erro
- [ ] Suite `PermissionsPageContent.test.tsx` passa (ou é ignorada, se revert)
- [ ] Guards client-side da fase 9.1 continuam respondendo a `canOpenRequestsV2`/`canManageRequestsV2`/`canManageWorkflowsV2` (já cobertos por testes próprios)
- [ ] Endpoints da fase 9.2 continuam retornando 403 para usuários sem permissão
- [ ] Nenhum log de erro em `collaborator_logs`

---

## 9. Execution Order (hints para /build)

1. **Backup mental do arquivo atual**: `PermissionsPageContent.tsx` é ~230 linhas, todas as mudanças são aditivas.
2. Substituir `permissionLabels` por `permissionGroups` + flat `permissionLabels` derivado (seção 5.1).
3. Migrar o `<TableHeader>` para layout de duas linhas com `colSpan` (seção 5.2). Mover `FilterableHeader` para a primeira linha com `rowSpan={2}`.
4. Ajustar `Skeleton` loading para refletir o novo número de permissões (seção 5.5).
5. Criar `src/components/admin/__tests__/PermissionsPageContent.test.tsx` com os 5 casos da seção 7.
6. Rodar `npm run typecheck` (garantir que `PermissionKey = keyof CollaboratorPermissions` bate com todos os itens dos grupos).
7. Rodar `npm test -- PermissionsPageContent` e a suíte completa dos guards (`RequesterV2Guard`, `ManagementV2Guard`, `WorkflowConfigAdminGuard`).
8. Rodar `npm run lint`.
9. Confirmar visualmente em `npm run dev` — abrir `/admin` com super admin, navegar para aba `Permissões`, ver o cabeçalho de grupo `V2 (Rollout)` destacado, ligar/desligar um toggle v2 num colaborador de teste, confirmar toast e refletir no `CollaboratorAuditLogModal`.

---

## 10. Acceptance Checklist (contra o DEFINE)

- [ ] **M2**: Super admin vê 3 toggles v2 separados com defaults `false` para colaboradores sem os flags (ADR-4).
- [ ] **M5**: Super admin consegue ligar as 3 permissões para exatamente 4 colaboradores via UI em menos de 2 minutos.
- [ ] **M7**: Desligar os toggles via mesma UI remove imediatamente acesso e visibilidade (via guards das fases 9.1 e 9.2 — já validado).
- [ ] **S1**: Labels finais exibidos: `Solicitações V2`, `Gestão Chamados V2`, `Config Chamados V2`.
- [ ] **C1** (opcional, já incluído): labels legadas marcadas com `(Legado)`.
- [ ] **Clareza administrativa**: cabeçalho `V2 (Rollout)` visualmente destacado (ADR-2).
- [ ] **Sem quebra de legado** (M4): flags `canManageWorkflows` e `canManageRequests` continuam ligáveis e auditáveis.
- [ ] **Sem nova tela/script** (W4): tudo reutiliza `/admin` → aba `Permissões` e a mutation existente.
- [ ] **Testes**: suite nova em `__tests__/PermissionsPageContent.test.tsx` cobre os 5 cenários críticos.
- [ ] **Rollback**: revert do commit restaura estado anterior sem efeitos colaterais em Firestore.

---

## 11. Notes for the Builder

- **Contexto**: As mudanças de 9.1 (guards de página) e 9.2 (permission gates server-side) já estão em `master`. Os flags `canOpenRequestsV2`, `canManageRequestsV2`, `canManageWorkflowsV2` já existem no tipo `CollaboratorPermissions` e já têm default `false`. Esta fase **apenas** os expõe na UI.
- **Regra de ouro**: Não tocar em `CollaboratorsContext.tsx`, `firestore-service.ts`, `firestore.rules`, guards de auth, nem `functions/`. Se o builder se vir editando qualquer um desses, revisite o design — provavelmente há escopo sendo inflado.
- **Estratégia de teste desta fase**: manter a 9.3 como fase de UI. Os testes devem mockar `useCollaborators` e validar render/toggle/toast; não abrir nova camada de teste em `firestore-service` nesta etapa.
- **Consistência visual**: usar `hsl(170,60%,50%)` (turquesa da marca, já presente no Switch) para destacar o grupo `V2 (Rollout)` no cabeçalho.
- **Responsividade**: a tabela já usa `overflow-x-auto`; o cabeçalho multi-nível não muda isso. Em mobile, a rolagem horizontal continua funcionando.
- **i18n**: projeto usa português direto em strings (padrão atual). Seguir o mesmo padrão.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-12 | design-agent (Opus 4.6) | Initial design from DEFINE seção 9.3 |
| 1.1 | 2026-04-12 | Codex | Alinhado o pattern de `FilterableHeader` com `rowSpan`, adicionado import de `cn`, simplificada a estratégia de testes para mock de `useCollaborators`, removido pattern frágil com `jest.resetModules()` e corrigido typo `Config Chamados V2` |
