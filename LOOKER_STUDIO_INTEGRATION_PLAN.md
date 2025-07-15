# Plano de Ação: Integração do Looker Studio ao 3A RIVA Connect

## 1. Objetivo

Este documento detalha o plano estratégico e técnico para integrar o **Looker Studio** à intranet **3A RIVA Connect**, com o objetivo de fornecer dashboards e relatórios de Business Intelligence (BI) personalizados e seguros para os colaboradores. A integração permitirá a visualização de dados de performance, operacionais e estratégicos diretamente na plataforma.

---

## 2. Conceito Central: Segurança e Personalização via Filtro por E-mail

A estratégia principal para todas as integrações propostas é a **Filtragem por E-mail do Espectador**, uma funcionalidade nativa do Looker Studio. Este mecanismo garante a segurança e a personalização dos dados de forma automática.

-   **Como Funciona:** O Looker Studio identifica o usuário logado (ex: `colaborador@3a.com`) e filtra a fonte de dados para exibir apenas as linhas que pertencem a ele.
-   **Vantagens:**
    -   **Segurança:** Cada usuário acessa somente os dados aos quais tem permissão, evitando vazamentos de informação.
    -   **Eficiência:** Um único relatório mestre é criado e mantido, mas o conteúdo é dinamicamente personalizado para cada espectador.
    -   **Escalabilidade:** A solução suporta facilmente a adição de novos usuários sem a necessidade de criar relatórios individuais.

---

## 3. Abordagem 1: Dashboards Operacionais com Dados do Firestore

Esta abordagem foca em dados gerados dentro da própria intranet, como o acompanhamento de solicitações de workflows.

### 3.1. Cenário de Uso

-   **Dashboard de "Minhas Solicitações":** Um painel onde cada colaborador pode visualizar o status, o histórico e os detalhes apenas das solicitações que ele mesmo abriu.
-   **Dashboard de Performance Pessoal:** KPIs sobre o volume e os tipos de solicitações abertas por um colaborador.

### 3.2. Fonte de Dados e Implementação

-   **Fonte de Dados:** A coleção `workflows` no **Cloud Firestore**.
-   **Campo-Chave para Filtro:** `submittedBy.userEmail`. Este campo já existe em nossa estrutura de dados.

### 3.3. Plano de Implementação

1.  **Conexão da Fonte de Dados:**
    -   No Looker Studio, criar uma nova fonte de dados utilizando o conector nativo do **Google Firestore**.
    -   Selecionar o projeto Firebase do 3A RIVA Connect e a coleção `workflows`.

2.  **Criação do Filtro de Segurança:**
    -   Na fonte de dados recém-criada, adicionar um novo filtro com a seguinte regra:
        -   **Condição:** `Incluir`
        -   **Campo:** `submittedBy.userEmail`
        -   **Operador:** `É igual a (=)`
        -   **Valor:** `VIEWER_EMAIL()`

3.  **Construção do Relatório:**
    -   Criar um novo relatório utilizando a fonte de dados protegida.
    -   Desenvolver os gráficos e tabelas (ex: "Status das Minhas Solicitações", "Tipos de Solicitação Mais Comuns").

4.  **Compartilhamento e Integração:**
    -   Compartilhar o relatório com todos os colaboradores da 3A RIVA, concedendo-lhes permissão de **"Leitor"**.
    -   Incorporar o link do relatório em uma nova seção da intranet ou em um item de menu dedicado.

### 3.4. Resultado Esperado

Um link único para o relatório, que, ao ser acessado por diferentes colaboradores, exibirá um dashboard personalizado com seus dados operacionais individuais, de forma segura e automática.

---

## 4. Abordagem 2: BI Estratégico com Dados do BigQuery

Esta abordagem é ideal para análises mais complexas e dados que residem fora da aplicação, como informações de captação de clientes, CRM, ou outras fontes de dados consolidadas.

### 4.1. Cenário de Uso

-   **Dashboard de Performance de Gestor:** Um gestor visualiza os resultados consolidados de sua equipe (ex: total de captação, performance por advisor).
-   **Dashboard de Performance de Advisor:** Um advisor visualiza apenas seus próprios resultados de captação de clientes.

### 4.2. Fonte de Dados e Implementação

-   **Fonte de Dados:** Uma tabela ou *view* no **Google BigQuery** (ex: `captacao_clientes`).
-   **Campos-Chave para Filtro:** A tabela deve ser estruturada para conter e-mails que representem a hierarquia (ex: `advisor_email`, `gestor_email`).

**Exemplo de Estrutura da Tabela no BigQuery:**

| `data_captacao` | `nome_cliente` | `valor_investido` | `advisor_email` | `gestor_email` |
| :--- | :--- | :--- | :--- | :--- |
| `2024-07-28` | Cliente A | 100.000 | `ana.silva@3a.com` | `carlos.santos@3a.com` |
| `2024-07-29` | Cliente B | 250.000 | `bruno.lima@3a.com` | `carlos.santos@3a.com` |

### 4.3. Plano de Implementação

1.  **Conexão da Fonte de Dados:**
    -   No Looker Studio, criar uma nova fonte de dados utilizando o conector **BigQuery**.
    -   Selecionar o projeto, o dataset e a tabela (`captacao_clientes`).

2.  **Criação do Filtro de Segurança Hierárquico:**
    -   Criar um filtro que utilize uma expressão `CASE` para tratar os diferentes níveis de acesso:

    ```sql
    CASE
      -- Se o espectador for o gestor, ele pode ver a linha.
      WHEN gestor_email = VIEWER_EMAIL() THEN TRUE
      
      -- Se o espectador for o advisor, ele também pode ver a linha.
      WHEN advisor_email = VIEWER_EMAIL() THEN TRUE
      
      -- Para todos os outros, a linha é ocultada.
      ELSE FALSE
    END
    ```

3.  **Construção do Relatório Mestre:**
    -   Desenvolver um único relatório com visões tanto para gestores (gráficos comparativos da equipe) quanto para advisors (detalhes de clientes individuais).
    -   O filtro inteligente garantirá que cada tipo de usuário veja apenas os componentes relevantes para ele.

4.  **Compartilhamento e Integração:**
    -   Compartilhar o relatório com todos os gestores e advisors com permissão de **"Leitor"**.

### 4.4. Resultado Esperado

-   **Visão do Advisor:** Ao acessar o relatório, Ana Silva verá apenas os dados de seus clientes.
-   **Visão do Gestor:** Ao acessar o **mesmo link**, Carlos Santos verá os dados consolidados de toda a sua equipe, incluindo Ana e Bruno.

---

## 5. Próximos Passos e Recomendações

1.  **Validação de Dados:** A equipe de BI deve validar se as fontes de dados (Firestore e BigQuery) contêm os campos de e-mail necessários para a filtragem.
2.  **Prova de Conceito (PoC):** Iniciar com a **Abordagem 1 (Firestore)**, criando um dashboard simples de "Minhas Solicitações" para validar a funcionalidade de ponta a ponta.
3.  **Desenvolvimento do Relatório Estratégico:** Após o sucesso da PoC, prosseguir com a **Abordagem 2 (BigQuery)** para desenvolver os dashboards de performance.
4.  **Integração na Intranet:** A equipe de desenvolvimento do 3A RIVA Connect irá adicionar os links dos relatórios finalizados ao menu da plataforma.
