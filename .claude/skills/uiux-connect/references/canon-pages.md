# Canon Pages

Este arquivo consolida o canon visual inicial da skill `uiux-connect`.

Use apenas a secao relevante para a tela em questao.

## Canon Principal

### `/admin/content`

Arquivos:

- `src/app/(app)/admin/content/page.tsx`
- `src/components/admin/ManageNews.tsx`
- `src/components/admin/ManageDocuments.tsx`

Padroes canonicos:

- shell de pagina: `space-y-6 p-6 md:p-8 admin-panel`;
- header com `PageHeader`;
- subtabs em `TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-9"`;
- subtabs ocupam a largura inteira e se adaptam a quantidade de tabs;
- filtros e controles ficam dentro do bloco de conteudo, nao na linha das subtabs;
- CTA primario usa `bg-admin-primary hover:bg-admin-primary/90`;
- acoes de linha usam `Button variant="ghost" size="icon"` com `hover:bg-muted`;
- tabelas ficam dentro de `border rounded-lg`;
- icones seguem o padrao Lucide do admin, em geral `h-4 w-4` nas acoes.

Observacoes importantes:

- esta pagina e a melhor referencia para tipografia, densidade, CTA primario, hover cinza e comportamento de subtabs de CRUD.

### `/admin/workflows`

Arquivos:

- `src/app/(app)/admin/workflows/page.tsx`
- `src/components/admin/WorkflowDefinitionsTab.tsx`
- `src/components/admin/AllRequestsView.tsx`

Padroes canonicos:

- shell de pagina: `space-y-6 p-6 md:p-8`;
- `PageHeader` com titulo + descricao;
- subtabs em `TabsList className="grid w-full grid-cols-2"`;
- conteudo em cards com `CardHeader` e `CardContent`;
- filtros vivem no topo do bloco de conteudo;
- busca, importacao/exportacao e CTA primario convivem na mesma faixa do `CardHeader`;
- cabeçalhos clicaveis de tabela usam `hover:bg-muted/50`;
- acoes de linha usam `hover:bg-muted`;
- export e CTA principal usam `bg-admin-primary hover:bg-admin-primary/90`.

Observacoes importantes:

- esta pagina e a melhor referencia para gestao administrativa com subtabs largas, tabela pesada e controles operacionais no topo do bloco.

### `/requests`

Arquivos:

- `src/app/(app)/requests/page.tsx`
- `src/components/requests/ManageRequests.tsx`

Padroes canonicos:

- shell de pagina: `space-y-6 p-6 md:p-8`;
- `PageHeader`;
- sem subtabs;
- conteudo principal em card com tabela;
- filtros ficam dentro do `CardHeader` do bloco;
- tabela em `border rounded-lg`;
- acoes de linha em `ghost` com `hover:bg-muted`;
- CTA de exportacao usa `bg-admin-primary hover:bg-admin-primary/90`.
- o modal canonico de visualizacao/revisao desta familia e o `RequestApprovalModal`, aberto pelo botao do olho na coluna `Ações`.

Observacoes importantes:

- esta pagina e a melhor referencia para gestao operacional sem subtabs.
- quando houver necessidade de modal de detalhe, revisao ou acao contextual, copiar primeiro a estrutura do `RequestApprovalModal` antes de propor variacao local.

## Canon Complementar

### `/audit/layout`

Arquivos:

- `src/app/(app)/audit/layout.tsx`
- `src/app/(app)/audit/page.tsx`

Padroes canonicos:

- shell de pagina: `space-y-6 p-6 md:p-8`;
- `PageHeader` com `actions` para filtros globais;
- tabs de navegacao em `TabsList className="grid w-full grid-cols-1 md:grid-cols-3"`;
- mesma identidade visual do admin, mas com papel de navegacao entre modulos analiticos;
- CTA primario ainda usa `bg-admin-primary hover:bg-admin-primary/90`;
- hover de cabecalho clicavel de tabela usa `hover:bg-muted/50`.

Observacoes importantes:

- tratar esta rota como referencia complementar;
- usar quando a tela for analitica ou precisar de header com actions globais.

## Regras Transversais

### Header

- Preferir `PageHeader` sempre que a familia visual ja o usa.
- Manter titulo e descricao no mesmo nivel de densidade do canon escolhido.

### Subtabs

- Quando houver subtabs, ocupar `w-full`.
- Distribuir via `grid` conforme quantidade de tabs.
- Nao colocar filtro ou CTA principal na mesma linha da regua de tabs se o canon da familia nao faz isso.

### Blocos de Conteudo

- Usar `Card`, `CardHeader` e `CardContent` como contenedor padrao do admin.
- Envolver tabelas em `border rounded-lg`.

### CTA Primario

- Usar `bg-admin-primary hover:bg-admin-primary/90`.
- Nao trocar a cor primaria por uma nova cor local sem necessidade.

### Hover

- Acoes de linha: `hover:bg-muted`.
- Cabecalhos clicaveis / itens filtraveis / linhas mais tecnicas: `hover:bg-muted/50`.
- Variacoes mais fracas como `bg-muted/30` podem existir, mas devem ser tratadas como ajuste de intensidade dentro da mesma familia de hover cinza.

### Icones

- Usar Lucide.
- Em acoes de linha, preferir `h-4 w-4` ou `h-5 w-5` conforme a referencia local.
- Nao misturar estilos de icone fora da linguagem do admin sem motivo claro.

### Modal Canonico

Use como referencia principal:

- `src/components/requests/RequestApprovalModal.tsx`

Padroes canonicos:

- `DialogContent` largo, tipicamente `max-w-2xl`;
- `DialogHeader` com titulo forte e `DialogDescription` contextual;
- corpo principal dentro de `ScrollArea`;
- secoes internas separadas por `Separator`;
- leitura de informacoes em blocos verticais com densidade administrativa;
- `DialogFooter` com CTA principal em `bg-admin-primary hover:bg-admin-primary/90` e acao secundaria `outline`;
- modal acionado a partir da coluna `Ações` em `src/components/requests/ManageRequests.tsx`.

Use esse modal como canon quando a tela precisar de:

- visualizacao detalhada de item de tabela;
- revisao administrativa com contexto denso;
- combinacao de leitura + acoes no rodape do modal.

## Fora do Canon Inicial

- `src/app/(app)/applications/page.tsx`

Motivo:

- a rota legada sera removida quando a refatoracao entrar em vigor;
- nao deve ser usada como referencia canonica geral da `uiux-connect`;
- so use se o usuario pedir explicitamente comparacao ou migracao visual a partir dela.
