# Guia de Design Técnico - 3A RIVA Connect

Este documento serve como um guia técnico para replicar a identidade visual e o design da aplicação 3A RIVA Connect em projetos futuros.

## 1. Paleta de Cores

A paleta de cores é definida em `src/app/globals.css` usando variáveis CSS HSL. A aplicação possui um tema claro (padrão) e um escuro.

### Cores Principais

-   **Primária (Dourado/Marrom):** `#A37549`
    -   CSS: `hsl(var(--primary))`
-   **Acento (Dourado Claro):** `#DFB87F`
    -   CSS: `hsl(var(--accent))`
-   **Fundo (Principal):** Branco ou Cinza Muito Claro
    -   CSS: `hsl(var(--background))`
-   **Texto (Principal):** Cinza Escuro (quase preto)
    -   CSS: `hsl(var(--foreground))`
-   **Cor do Admin (Verde):** Usada para botões de ação principais nos painéis de administração para se diferenciar das ações do usuário.
    -   CSS: `hsl(var(--admin-primary))`

### Estrutura de Cores no `globals.css`

As cores são definidas para os modos claro e escuro. Para manter a consistência, sempre utilize as variáveis CSS (`bg-primary`, `text-accent-foreground`, etc.) em vez de cores fixas (`bg-[#A37549]`).

**Exemplo (Tema Claro):**
```css
:root {
    --background: 0 0% 100%; /* white */
    --foreground: 220 10% 23%; /* Dark blueish gray */
    --primary: 30 39% 46%; /* #A37549 */
    --accent: 38 59% 68%; /* #DFB87F */
    --admin-primary: 170 60% 50%; /* Green for admin actions */
    /* ... outras cores ... */
}
```

## 2. Tipografia

A aplicação utiliza duas fontes principais, configuradas em `tailwind.config.ts` e importadas em `src/app/layout.tsx`.

-   **Fonte de Títulos (`font-headline`):** **Roboto Bold**
    -   Usada para títulos de página (`PageHeader`) e títulos de cards.
-   **Fonte de Corpo (`font-body`):** **Archivo Light**
    -   Usada para todo o resto do texto, incluindo descrições, parágrafos, labels e itens de menu.

## 3. Componentes e Estilo (ShadCN + Tailwind)

A interface é construída com base nos componentes da biblioteca **ShadCN UI**, que são estilizados com **Tailwind CSS**.

-   **Base de Componentes:** Utilize os componentes pré-construídos de `ShadCN` (`Button`, `Card`, `Dialog`, `Input`, etc.) como ponto de partida. Eles já herdam o estilo base do projeto.
-   **Estilo Geral:**
    -   **Bordas:** Os elementos interativos, como cards e inputs, possuem cantos arredondados (`rounded-lg`). O raio da borda é definido pela variável `--radius` em `globals.css`.
    -   **Sombras:** Cards e elementos em primeiro plano possuem sombras sutis (`shadow-sm`, `shadow-md`) para criar profundidade.
    -   **Consistência:** Evite CSS customizado. Prefira usar as classes de utilitário do Tailwind para espaçamento (`p-4`, `m-2`, `gap-4`), layout (`flex`, `grid`) e cores (`bg-primary`, `text-muted-foreground`).

## 4. Ícones

A biblioteca de ícones padrão é a **`lucide-react`**.

-   **Utilização:** Importe os ícones necessários diretamente da biblioteca. Ex: `import { Home, User } from 'lucide-react';`
-   **Customização:** O tamanho e a cor dos ícones podem ser facilmente customizados via classes do Tailwind. Ex: `<Home className="h-5 w-5 text-primary" />`.
-   **Fallback:** Se um ícone específico não existir na `lucide-react`, a função `getIcon` em `src/lib/icons.ts` retornará o ícone `HelpCircle` como padrão.

## 5. Layout Principal

A estrutura da aplicação autenticada consiste em:

1.  **Header Fixo:** Um cabeçalho no topo com altura definida por `--header-height` (`3.25rem` ou `52px`).
2.  **Sidebar:** Uma barra lateral à esquerda, que pode ser expandida ou recolhida (no desktop) e se transforma em um menu "off-canvas" (gaveta) no mobile.
3.  **Conteúdo Principal:** A área de conteúdo principal ocupa o espaço restante.

Sempre que criar uma nova página dentro da área autenticada, utilize o componente `PageHeader` para garantir a consistência dos títulos e descrições.
