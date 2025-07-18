
# Análise Conceitual da Aplicação: 3A RIVA Connect

## 1. Resumo da Aplicação

O **3A RIVA Connect** é uma aplicação de intranet corporativa moderna, projetada para ser o ponto central de comunicação, acesso a recursos e ferramentas para todos os colaboradores da empresa. O sistema foi desenvolvido para um público de aproximadamente 250 usuários ativos, com foco em usabilidade, performance e segurança.

O objetivo principal é substituir canais de comunicação dispersos (e-mails, grupos de mensagens) por uma plataforma unificada, melhorando o engajamento, a produtividade e o acesso à informação.

---

## 2. Usos e Funcionalidades Previstas

A aplicação consolida diversas funcionalidades essenciais para o dia a dia corporativo:

-   **Painel Inicial (Dashboard):** Tela principal que apresenta informações personalizadas, como notícias em destaque, mensagens importantes, um calendário de eventos e uma seção de **Links Rápidos** para ferramentas e recursos externos.
-   **Feed de Notícias:** Seção dedicada a comunicados oficiais, notícias da empresa e atualizações de mercado.
-   **Repositório de Documentos:** Biblioteca centralizada para documentos importantes (políticas, manuais, relatórios), com funcionalidades de busca e filtragem.
-   **Solicitações (Workflows):** Um hub onde colaboradores iniciam processos digitais. Os workflows são agrupados por **Áreas de Negócio** (ex: Financeiro, RH) para facilitar a navegação. Ao submeter um formulário, a solicitação pode ser acompanhada pelo usuário e gerenciada por gestores.
-   **Chatbot "Bob":** Um assistente virtual com IA (Inteligência Artificial) integrado, capaz de responder a perguntas, buscar informações em uma base de conhecimento e executar tarefas simples como resumir conversas.
-   **Painéis de Controle (Admin):** Uma área restrita onde administradores podem gerenciar todo o conteúdo e as configurações da plataforma de forma intuitiva. Inclui:
    -   **Gerenciamento de Conteúdo:** Para gerenciar notícias, documentos, eventos, mensagens, vídeos do Labs e os links rápidos da dashboard.
    -   **Gerenciamento de Workflows:** Ferramenta para criar e editar **Áreas de Workflow** (os grupos) e as **Definições de Workflow**, definindo formulários, etapas, regras de SLA, roteamento de notificações e permissões de acesso. Inclui também uma **Visão Geral** de todas as solicitações do sistema.
    -   **Administração do Sistema:** Painel para gerenciar a lista de colaboradores e suas permissões de acesso aos painéis de controle.
    -   **Painel de Auditoria:** Uma visão centralizada para Super Admins monitorarem a atividade da plataforma, incluindo logs de login, engajamento com conteúdos, termos de busca mais utilizados e métricas de eficiência dos workflows.
-   **Autenticação Segura:** Sistema de login seguro utilizando contas Google, integrado ao Firebase Authentication, com uma distinção visual para acesso administrativo.

---

## 3. Arquitetura e Tecnologias Utilizadas

A aplicação adota uma arquitetura moderna baseada em JavaScript/TypeScript, utilizando um framework de frontend robusto e serviços de backend gerenciados (Backend-as-a-Service).

### 3.1. Frontend

-   **Framework Principal:** **Next.js (com React)**. A escolha se baseia no uso do **App Router**, que promove renderização no servidor (Server-Side Rendering) e componentes de servidor (React Server Components).
    -   **Linguagem:** **TypeScript**. Garante segurança de tipos, melhor autocompletar e manutenibilidade do código em longo prazo.
    -   **Benefícios:** Performance aprimorada (menos JavaScript enviado ao cliente), melhor SEO (embora menos crítico para uma intranet) e uma estrutura de projeto organizada por rotas.

-   **Componentes de UI e Estilização:**
    -   **ShadCN UI:** Biblioteca de componentes acessíveis, customizáveis e bem projetados (botões, formulários, tabelas, etc.), que acelera o desenvolvimento de uma interface consistente e profissional.
    -   **Tailwind CSS:** Framework de CSS utility-first para estilização rápida e responsiva, totalmente integrado com o ShadCN.

-   **Gerenciamento de Estado e Dados:**
    -   **React Query (TanStack Query):** Utilizada como a principal ferramenta para gerenciamento de estado do servidor. Controla o fetching, caching, sincronização e atualização de todos os dados provenientes do Firestore, garantindo uma interface reativa e performática.
    -   **React Context API:** Utilizada para compartilhar estados globais específicos da UI (como tema claro/escuro) e para prover os dados gerenciados pelo React Query para toda a árvore de componentes.

### 3.2. Backend e Serviços (Firebase)

A aplicação utiliza o ecossistema do **Firebase (Google)** como seu Backend-as-a-Service (BaaS), o que simplifica o desenvolvimento e a manutenção.

-   **Banco de Dados:** **Cloud Firestore**. Um banco de dados NoSQL, baseado em documentos, onde todas as informações da aplicação (notícias, documentos, usuários, workflows, solicitações, etc.) são armazenadas.
-   **Autenticação:** **Firebase Authentication**. Gerencia o fluxo de login de usuários de forma segura, utilizando o provedor do Google para uma experiência de login familiar e confiável.
-   **Armazenamento de Arquivos:** **Firebase Cloud Storage**. Utilizado para hospedar arquivos estáticos como imagens (logos, banners), o vídeo da tela de login e anexos de workflows.
-   **Hospedagem:** **Firebase App Hosting**. Plataforma otimizada para hospedar aplicações web modernas, como as construídas com Next.js.

### 3.3. Funcionalidades de IA (GenAI)

A inteligência artificial é orquestrada por meio de um framework específico para essa finalidade.

-   **Framework de IA:** **Genkit (Google)**. Um framework open-source que facilita a integração de modelos de linguagem (LLMs) e a criação de fluxos de IA complexos.
    -   **Linguagem:** **TypeScript** (nos arquivos de `flows`).
    -   **Modelos de Linguagem:** **Google Gemini** (ex: `gemini-2.0-flash`). É o cérebro por trás do chatbot "Bob", responsável por entender as perguntas dos usuários, gerar respostas e executar tarefas.
    -   **Funcionalidades:**
        -   **Chat:** Interação conversacional padrão.
        -   **Summarization (Resumo):** Capacidade de resumir o conteúdo de um chat.
        -   **Classification (Classificação):** Capacidade de identificar e taguear os tópicos de uma conversa.
        -   **Tool Use (Uso de Ferramentas):** O chatbot pode usar "ferramentas" definidas no código (como `knowledgeBaseSearch`) para buscar informações específicas no banco de dados da aplicação (documentos) e usar esses dados para formular uma resposta mais precisa.

---

## 4. Considerações para o Analista Sênior

-   **Escalabilidade:** A arquitetura baseada em Firebase é altamente escalável. Para 250 usuários, os limites do plano gratuito ("Spark") provavelmente serão suficientes, e os planos pagos ("Blaze") crescem conforme o uso, tornando a solução custo-efetiva e capaz de suportar um aumento significativo no número de usuários sem a necessidade de gerenciar infraestrutura de servidor.
-   **Manutenibilidade:** O uso de TypeScript, componentes reutilizáveis (ShadCN) e uma estrutura de projeto clara (Next.js App Router) facilita a manutenção e a adição de novas funcionalidades no futuro. O uso de React Query para o gerenciamento de dados centraliza a lógica de comunicação com o backend, simplificando a depuração e o desenvolvimento.
-   **Segurança:** O Firebase Authentication oferece uma camada de segurança robusta e gerenciada. A próxima etapa crítica seria a implementação de **Regras de Segurança (Security Rules)** no Firestore e no Cloud Storage para garantir que cada usuário só possa ler e escrever os dados aos quais tem permissão.
-   **Dependência de Fornecedor (Vendor Lock-in):** A aplicação é fortemente integrada ao ecossistema do Google (Firebase, Genkit, Gemini). Embora isso traga sinergia e facilidade de desenvolvimento, é um ponto a ser considerado em uma estratégia de longo prazo. A modularidade do Genkit, no entanto, permite a troca de modelos de LLM se necessário no futuro.

---

## 5. Diagrama de Arquitetura da Informação

Esta é uma visão estruturada das páginas e funcionalidades disponíveis para cada tipo de usuário.

```
/ (Raiz)
├── /login (Página de Autenticação)
│
└── / (Área Autenticada)
    ├── /dashboard (Painel Inicial)
    │   ├── Destaques de Notícias
    │   ├── Mensagens Importantes
    │   ├── Calendário de Eventos
    │   └── Links Rápidos
    │
    ├── /news (Feed de Notícias)
    │
    ├── /solicitacoes (Antigo "Workflows")
    │   ├── Agrupamentos por Área de Negócio
    │   ├── Lista de Workflows (Modal)
    │   ├── Formulário de Submissão (Modal)
    │   └── Tabela "Minhas Solicitações"
    │
    ├── /documents (Repositório de Documentos)
    │
    ├── /labs (Vídeos e Materiais)
    │
    ├── /store (Loja 3A RIVA - NuvemShop Embed)
    │
    ├── /chatbot (Assistente Bob 1.0)
    │
    ├── /bi (Business Intelligence - Acesso Restrito)
    │
    ├── /me (Páginas do Usuário)
    │   └── /tasks (Minhas Tarefas Atribuídas)
    │
    └── /requests (Caixa de Entrada - Acesso de Admin)
        │
        └── /admin (Painéis de Controle - Acesso de Admin)
            ├── /content (Gerenciamento de Conteúdo)
            │   ├── Gerenciar Notícias
            │   ├── Gerenciar Documentos
            │   ├── Gerenciar Labs
            │   ├── Gerenciar Mensagens
            │   ├── Gerenciar Eventos
            │   └── Gerenciar Links Rápidos
            │
            ├── /workflows (Gerenciamento de Workflows)
            │   ├── Aba "Definições"
            │   │   ├── Gerenciar Áreas de Workflow
            │   │   └── Gerenciar Definições de Workflow (criar/editar/importar)
            │   └── Aba "Visão Geral"
            │       └── Tabela com Todas as Solicitações do Sistema
            │
            ├── /admin (Administração do Sistema - Super Admin)
            │   ├── Gerenciar Colaboradores
            │   └── Gerenciar Permissões
            │
            └── /audit (Painel de Auditoria - Super Admin)
                ├── /audit (Análise de Logins)
                ├── /audit/content-interaction (Análise de Conteúdos e Páginas)
                ├── /audit/usability (Análise de Busca e Usabilidade)
                └── /audit/workflow-analytics (Análise de Workflows)
```
