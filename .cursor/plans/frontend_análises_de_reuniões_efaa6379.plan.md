---
name: Frontend Análises de Reuniões
overview: Implementar frontend completo para exibir análises de reuniões da coleção "meeting_analyses" com listagem, busca, filtros e página de detalhamento com estrutura de sanfona aninhada.
todos:
  - id: add-permission-types
    content: Adicionar canViewMeetAnalyses ao tipo CollaboratorPermissions em CollaboratorsContext.tsx e AuthContext.tsx
  - id: add-permission-admin
    content: Adicionar toggle para canViewMeetAnalyses no painel de permissões (PermissionsPageContent.tsx)
  - id: create-context
    content: Criar MeetingAnalysesContext.tsx com tipos TypeScript e queries do Firestore
  - id: add-sidebar-item
    content: Adicionar item "Bob Meet Análises" na sidebar (AppLayout.tsx) com ícone Video e permissão
  - id: create-layout
    content: Criar layout.tsx para /meet-analyses com verificação de permissão (similar a /bi/layout.tsx)
  - id: create-list-page
    content: Criar página de listagem (page.tsx) com título, busca por participantes e filtro de data
  - id: create-list-component
    content: Criar componente MeetingAnalysesList.tsx com busca, filtros e lista de análises em sanfona
  - id: create-card-component
    content: Criar componente MeetingAnalysisCard.tsx para exibir análise individual com expansão de summary
  - id: create-detail-page
    content: Criar página de detalhamento ([id]/page.tsx) com header, summary e lista de opportunities
  - id: create-detail-component
    content: Criar componente MeetingAnalysisDetail.tsx com estrutura hierárquica de sanfona (title -> description -> mentions)
  - id: add-provider
    content: Adicionar MeetingAnalysesProvider no layout principal da aplicação
---

# Frontend para Análises de Reuniões (Bob Meet Análises)

## Visão Geral

Implementar interface completa para visualização de análises de reuniões armazenadas na coleção `meeting_analyses` do Firestore, incluindo:

- Página de listagem com busca e filtros
- Página de detalhamento com estrutura hierárquica de sanfona
- Integração com sistema de permissões
- Adição de novo item na sidebar

## Estrutura de Arquivos

### Novos Arquivos a Criar

1. **Rotas e Páginas:**

   - `src/app/(app)/meet-analyses/page.tsx` - Página principal de listagem
   - `src/app/(app)/meet-analyses/[id]/page.tsx` - Página de detalhamento da análise
   - `src/app/(app)/meet-analyses/layout.tsx` - Layout com verificação de permissão

2. **Componentes:**

   - `src/components/meet-analyses/MeetingAnalysesList.tsx` - Componente de listagem com busca e filtros
   - `src/components/meet-analyses/MeetingAnalysisCard.tsx` - Card de análise individual (sanfona)
   - `src/components/meet-analyses/MeetingAnalysisDetail.tsx` - Componente de detalhamento completo
   - `src/components/meet-analyses/OpportunityAccordion.tsx` - Componente de sanfona para oportunidades

3. **Context:**

   - `src/contexts/MeetingAnalysesContext.tsx` - Context para gerenciar dados das análises

4. **Tipos:**

   - Tipos TypeScript serão definidos no context

### Arquivos a Modificar

1. **Sidebar:**

   - `src/components/layout/AppLayout.tsx` - Adicionar novo item na sidebar com ícone Video ou Monitor

2. **Permissões:**

   - `src/contexts/CollaboratorsContext.tsx` - Adicionar `canViewMeetAnalyses` ao tipo `CollaboratorPermissions`
   - `src/contexts/AuthContext.tsx` - Adicionar `canViewMeetAnalyses` ao `defaultPermissions`
   - `src/components/admin/PermissionsPageContent.tsx` - Adicionar toggle para nova permissão

## Implementação Detalhada

### 1. Tipos e Interfaces

```typescript
// Em MeetingAnalysesContext.tsx
interface Participant {
  email: string | null;
  name: string;
}

interface Opportunity {
  category: string;
  description: string;
  mentions: string[];
  priority: 'high' | 'medium' | 'low';
  title: string;
}

interface Criterion {
  feedback: string;
  name: string;
  score: number;
  weight: number;
}

interface Assessment {
  criteria: Criterion[];
  overall_score: number;
  recommendations: string[];
}

interface MeetingAnalysis {
  id: string;
  file_name: string;
  updated_at: Timestamp | string;
  participants: Participant[];
  summary: string;
  opportunities: Opportunity[];
  assessment?: Assessment;
  user_email: string;
  created_at?: Timestamp | string;
  // ... outros campos conforme exemplo
}
```

### 2. Context de Dados

- Usar `getCollection` e `listenToCollection` do `firestore-service.ts`
- Filtrar análises por `user_email` (comparação direta, sem normalização)
- Implementar queries reativas com React Query

### 3. Página de Listagem (`/meet-analyses`)

**Estrutura:**

- Título: "Bob Meet Análises"
- Campo de busca: busca em `participants[].name` (sem normalização de email)
- Filtro de data: busca em `updated_at` usando DatePickerWithRange
- Lista de análises em formato de sanfona:
  - Item principal mostra: `file_name`, `updated_at` formatado, `participants` (nomes)
  - Primeira expansão mostra: `summary`
  - Clique no card ou no summary redireciona para `/meet-analyses/[id]`

**Componentes:**

- Usar `Accordion` do shadcn/ui
- Usar `Input` para busca
- Usar `DatePickerWithRange` (similar ao audit)
- Usar `Card` para cada análise

### 4. Página de Detalhamento (`/meet-analyses/[id]`)

**Estrutura:**

- Header com informações primárias:
  - `file_name`
  - Data formatada (`updated_at`)
  - Lista de participantes
- Caixa de texto com `summary`
- Lista de `opportunities` em sanfona:
  - Cada `title` é um item expansível
  - Ao expandir `title`, mostra `description`
  - Ao expandir `description`, mostra array de `mentions`

**Hierarquia de Sanfona:**

```
Summary (caixa de texto)
├─ Opportunity 1 Title (sanfona)
│  └─ Description (sanfona)
│     └─ Mentions (lista)
├─ Opportunity 2 Title (sanfona)
│  └─ Description (sanfona)
│     └─ Mentions (lista)
...
```

### 5. Integração com Sidebar

- Adicionar item em `navItems`:
  ```typescript
  { 
    href: '/meet-analyses', 
    label: 'Bob Meet Análises', 
    icon: Video, // ou Monitor
    external: false, 
    permission: 'canViewMeetAnalyses' 
  }
  ```


### 6. Sistema de Permissões

- Adicionar `canViewMeetAnalyses: boolean` em todos os lugares necessários
- Layout da página verifica permissão (similar a `/bi/layout.tsx`)
- Painel admin permite toggle da permissão

### 7. Formatação de Dados

- Datas: usar `date-fns` com `format` e `parseISO`
- Formato: `dd/MM/yyyy HH:mm` ou similar
- Participantes: exibir apenas `name`, concatenar com vírgulas

### 8. Busca e Filtros

**Busca por participantes:**

- Buscar em `participants[].name` (case-insensitive)
- Não normalizar emails

**Filtro de data:**

- Filtrar por `updated_at`
- Usar `DatePickerWithRange` do shadcn/ui
- Comparar timestamps

### 9. Navegação

- Rota dinâmica usando `[id]` do Next.js App Router
- `useParams()` para obter ID
- `useRouter()` para navegação
- ID será o campo `id` do documento (ex: `"1UgHwdiSnC2gCvwaEXj2FyV88eKMvP3dJ7lRAb7aXqJM_samuel.leite@3ariva.com.br"`)

## Considerações de Segurança

1. **Filtro por usuário:** Apenas análises onde `user_email` corresponde ao email do usuário logado (comparação direta, sem normalização)
2. **Permissões:** Verificar `canViewMeetAnalyses` antes de exibir qualquer conteúdo
3. **Sanitização:** Dados vêm do Firestore, já sanitizados pelo backend

## Padrões Visuais

- Seguir padrão visual das outras páginas (ex: `/rankings`, `/bi`)
- Usar componentes do shadcn/ui já existentes
- Manter consistência com cores e espaçamentos
- Usar `PageHeader` para títulos
- Usar `Card` para containers

## Dependências

- `date-fns` - já existe no projeto
- `lucide-react` - já existe (ícones)
- `@radix-ui/react-accordion` - já existe (via shadcn/ui)
- React Query - já existe no projeto

## Ordem de Implementação

1. Adicionar permissão `canViewMeetAnalyses` em todos os lugares necessários
2. Criar context `MeetingAnalysesContext`
3. Adicionar item na sidebar
4. Criar layout com verificação de permissão
5. Criar página de listagem
6. Criar página de detalhamento
7. Testar busca e filtros
8. Integrar com painel admin