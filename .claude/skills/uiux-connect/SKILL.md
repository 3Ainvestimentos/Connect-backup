---
name: uiux-connect
description: Construa e audite interfaces do 3A RIVA Connect usando o canon visual real do app. Use quando implementar telas novas, refatorar frontends existentes, revisar consistencia visual, comparar uma tela com referencias canonicas do projeto, ou identificar o que ja esta no padrao e o que precisa mudar para entrar no padrao.
---

# UiUx-Connect

Use esta skill em dois modos:

1. `build`: construir uma tela nova ja no padrao visual do Connect.
2. `audit`: analisar uma tela pronta e apontar o que esta conforme, o que esta parcial e o que precisa mudar para entrar no padrao.

## Workflow

1. Identifique a familia visual da tela antes de propor UI.
2. Leia apenas a referencia canonica necessaria em [references/canon-pages.md](references/canon-pages.md).
3. Reaproveite o frontend real do projeto antes de inventar estrutura nova.
4. Preserve comportamento e contratos; esta skill trata identidade visual, composicao e consistencia.
5. Se a tela cair fora do canon documentado, explicite isso e peca aprovacao antes de extrapolar.

## Familias Visuais

### 1. Admin CRUD / Gestao

Use como canon principal:

- `src/app/(app)/admin/content/page.tsx`
- `src/app/(app)/admin/workflows/page.tsx`
- `src/app/(app)/requests/page.tsx`

Padrao esperado:

- shell com `space-y-6 p-6 md:p-8`;
- `PageHeader` como header canonico;
- subtabs em `TabsList` ocupando `w-full` e se adaptando a quantidade de tabs;
- filtros dentro do bloco de conteudo, nao na mesma linha das subtabs;
- CTA primario em `bg-admin-primary hover:bg-admin-primary/90`;
- acoes de linha em `Button variant="ghost" size="icon"` com hover cinza;
- tabelas dentro de `border rounded-lg`.
- modais de visualizacao/revisao seguem como canon o modal aberto pela coluna `Ações` em `/requests` (`RequestApprovalModal`).

### 2. Analytics / Navegacao Analitica

Use como canon complementar:

- `src/app/(app)/audit/layout.tsx`

Padrao esperado:

- mesmo shell base do admin;
- `PageHeader` com `actions` quando houver filtros globais;
- tabs como navegacao de modulo, nao como subtabs de CRUD;
- densidade um pouco mais tecnica, sem abandonar a identidade admin.

### 3. Requester / Outras Superficies

Nao use `\/applications` como canon principal. Essa rota sera removida quando a refatoracao entrar em vigor.

Para superficies requester, use o frontend canonico mais proximo ja aprovado no estado atual do projeto. Se a referencia ainda estiver em transicao ou controversa, explicite a falta de canon estavel e peca confirmacao antes de copiar o legado.

## Modo Build

Ao construir uma tela:

1. Escolha a familia visual correta.
2. Copie shell, header, tabs, blocos de conteudo, CTA e acoes do frontend canonico.
3. Reutilize componentes existentes (`PageHeader`, `Card`, `Tabs`, `Table`, `Button`) antes de criar variantes.
4. Mantenha filtros dentro do card/bloco de conteudo quando esse for o padrao da familia.
5. Use os mesmos tokens de espacamento, hover e densidade da referencia.
6. Quando a tela precisar de modal de visualizacao, detalhe ou revisao operacional, use como referencia primaria o `RequestApprovalModal` aberto pela coluna `Ações` em `/requests`.
7. Evite introduzir novos tokens visuais sem necessidade clara.

## Modo Audit

Ao auditar uma tela:

1. Identifique a familia visual esperada.
2. Compare a tela com a referencia canonica mais proxima.
3. Classifique cada ponto em:
   - `conforme`
   - `parcial`
   - `fora do padrao`
4. Aponte diferencas concretas com arquivo, componente, classe ou estrutura de referencia.
5. Priorize nesta ordem:
   - shell e largura util;
   - header;
   - subtabs;
   - filtros;
   - CTA primario;
   - tabela e hover;
   - icones e acoes por linha;
   - modal principal da experiencia, quando existir.

## Guardrails

- Nao tratar principio abstrato como canon se ele nao estiver ancorado no codigo do projeto.
- Nao usar uma tela antiga como referencia so porque ela "parece boa"; priorizar telas ativas e estaveis.
- Nao mover filtro para a linha de tabs quando o canon da familia o coloca dentro do bloco de conteudo.
- Nao trocar cor/hover/icone por gosto pessoal se o app ja tem padrao estabelecido.
- Nao chamar algo de "fora do padrao" sem dizer qual pagina/componente do Connect serve de referencia.

## Recursos

- Canon visual detalhado: [references/canon-pages.md](references/canon-pages.md)
