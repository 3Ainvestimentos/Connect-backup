

# Análise Conceitual da Aplicação: 3A RIVA Connect

## 1. Resumo da Aplicação

O **3A RIVA Connect** é uma aplicação de intranet corporativa moderna, projetada para ser o ponto central de comunicação, acesso a recursos e ferramentas para todos os colaboradores da empresa. O sistema foi desenvolvido para um público de aproximadamente 250 usuários ativos, com foco em usabilidade, performance e segurança.

O objetivo principal é substituir canais de comunicação dispersos (e-mails, grupos de mensagens) por uma plataforma unificada, melhorando o engajamento, a produtividade e o acesso à informação.

---

## 2. Usos e Funcionalidades Previstas

A aplicação consolida diversas funcionalidades essenciais para o dia a dia corporativo, abrangendo desde a comunicação interna até a gestão de processos complexos. Abaixo, detalhamos cada componente conforme o diagrama de arquitetura.

### 2.1. Acesso e Painel Principal

-   **Página de Login (`/login`):** Portal de entrada seguro que utiliza o sistema de autenticação do Google, restrito a contas do domínio da empresa.
-   **Painel Inicial (`/dashboard`):** A primeira tela após o login, projetada para ser um hub de informações relevantes e personalizadas.
    -   **Destaques de Notícias:** Apresenta as notícias mais importantes, definidas pelos administradores.
    -   **Mensagens Importantes:** Exibe um feed de comunicados direcionados ao usuário ou a grupos, com controle de leitura.
    -   **Calendário de Eventos:** Mostra os próximos eventos corporativos, como reuniões e feriados.
    -   **Links Rápidos:** Uma seção de botões customizáveis que dão acesso direto a ferramentas externas (ex: Google Drive, sistemas de RH) e links dinâmicos (ex: pasta pessoal de um colaborador).

### 2.2. Seções de Conteúdo e Ferramentas

-   **Feed de Notícias (`/news`):** Uma visão completa de todas as notícias e comunicados da empresa, em ordem cronológica.
-   **Solicitações (`/solicitacoes`):** Antiga aba "Workflows", este é o portal onde os colaboradores iniciam processos digitais.
    -   **Agrupamentos por Área:** Os workflows são organizados em "áreas de negócio" (ex: Financeiro, RH), representadas por botões.
    -   **Lista de Workflows (Modal):** Ao clicar em uma área com múltiplos processos, um modal exibe a lista de workflows disponíveis para seleção.
    -   **Formulário de Submissão (Modal):** Após selecionar um workflow, um formulário dinâmico é apresentado para o preenchimento da solicitação.
    -   **Tabela "Minhas Solicitações":** Uma seção na mesma página que lista todas as solicitações já feitas pelo usuário, permitindo o acompanhamento de status e previsão de conclusão.
-   **Repositório de Documentos (`/documents`):** Biblioteca centralizada para documentos importantes (políticas, manuais, relatórios), com funcionalidades de busca e filtragem por categoria e tipo.
-   **Labs (`/labs`):** Repositório de vídeos de treinamento, painéis de estudo e outros materiais para desenvolvimento contínuo.
-   **Loja 3A RIVA (`/store`):** Integração via `iframe` com a loja da NuvemShop, permitindo acesso direto aos produtos da marca.
-   **Chatbot Bob 1.0 (`/chatbot`):** Um assistente virtual com IA (Inteligência Artificial) integrado, capaz de responder a perguntas, buscar informações em documentos da plataforma e executar tarefas simples como resumir conversas.
-   **Business Intelligence (`/bi`):** Página com acesso restrito que exibe um painel de Power BI embarcado, destinado a análises gerenciais.
-   **Minhas Tarefas (`/me/tasks`):** Uma caixa de entrada unificada para o colaborador, onde são listadas todas as pendências relacionadas a workflows. A página é dividida em:
    -   **Ações Pendentes:** Solicitações onde a **aprovação** ou **ciência** do usuário é necessária para que o processo avance, mesmo que ele não seja o responsável principal.
    -   **Tarefas Atribuídas:** Solicitações que foram atribuídas diretamente ao usuário para processamento e acompanhamento.

### 2.3. Painéis de Controle (Acesso de Admin)

-   **Caixa de Entrada (`/requests`):** Visão de gerenciamento para proprietários de workflows, onde eles podem visualizar, atribuir, arquivar e processar as solicitações pendentes. Esta tela agora permite que o responsável pela tarefa solicite ações de aprovação ou ciência de outros colaboradores, caso o workflow esteja configurado para tal.
-   **Gerenciamento de Conteúdo (`/admin/content`):** Painel central para administrar todo o conteúdo dinâmico da intranet.
    -   **Gerenciar Notícias, Documentos, Labs, Mensagens, Eventos, Links Rápidos:** Cada uma dessas seções possui uma interface dedicada para criar, editar, excluir e, em alguns casos, definir a visibilidade dos respectivos conteúdos.
-   **Gerenciamento de Workflows (`/admin/workflows`):** O centro de controle para todos os processos digitais da empresa.
    -   **Aba "Definições":** Permite gerenciar as "Áreas de Workflow" (os botões guarda-chuva) e as "Definições de Workflow". Na definição de um workflow, é possível configurar:
        -   O formulário dinâmico (campos, tipos, obrigatoriedade).
        -   As etapas do processo (status), incluindo a capacidade de definir uma **ação de aprovação/ciência** para uma etapa específica.
        -   Regras de SLA (prazos de conclusão) e de roteamento (notificações).
    -   **Aba "Histórico Geral":** Uma tabela completa com todas as solicitações já feitas no sistema, permitindo uma visão global e auditoria de todos os processos. A tabela agora destaca visualmente as solicitações que estão sem responsável ou com aprovações pendentes há mais de 24 horas.
-   **Administração do Sistema (`/admin/admin` - Super Admin):** Área restrita para a gestão de usuários e segurança.
    -   **Gerenciar Colaboradores:** Ferramenta para adicionar, editar ou remover colaboradores da base de dados do sistema.
    -   **Gerenciar Permissões:** Painel para conceder ou revogar permissões de acesso aos diferentes painéis de controle.
-   **Painel de Auditoria (`/audit` - Super Admin):** Uma visão centralizada para monitorar a atividade da plataforma.
    -   **Análise de Logins:** Gráficos e métricas sobre a frequência de acesso dos usuários.
    -   **Análise de Conteúdos e Páginas:** Relatórios sobre quais notícias e documentos são mais (e menos) visualizados.
    -   **Análise de Busca e Usabilidade:** Informações sobre os termos mais buscados e a taxa de sucesso das buscas.
    -   **Análise de Workflows:** Métricas sobre o volume de solicitações, tempo médio de resolução e gargalos nos processos.

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
    ├── /solicitacoes (Portal de início de processos)
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
    │   └── /tasks (Minhas Tarefas - Caixa de Entrada Unificada)
    │       ├── Tarefas Atribuídas
    │       └── Ações Pendentes (Aprovações/Cientes)
    │
    └── /requests (Caixa de Entrada - Gerenciamento para Proprietários)
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
            │   └── Aba "Histórico Geral"
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
