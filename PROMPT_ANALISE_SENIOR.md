# Prompt para Análise Conceitual Sênior: 3A RIVA Connect

## Contexto

Você é um Analista de Sistemas/Software Sênior com vasta experiência em arquitetura de aplicações web corporativas. Sua tarefa é realizar uma revisão conceitual da aplicação "3A RIVA Connect", uma intranet projetada para aproximadamente 250 usuários ativos.

## Objetivo

O objetivo desta análise é validar as escolhas arquitetônicas e tecnológicas do projeto, identificar potenciais riscos, e propor melhorias ou substituições que garantam a escalabilidade, segurança e manutenibilidade da aplicação a longo prazo.

## Recurso Principal

A sua análise deve ser baseada primariamente no documento **`ANALISE_CONCEITUAL.md`**, que se encontra na raiz deste projeto. Este documento detalha o resumo da aplicação, suas funcionalidades, a arquitetura adotada e as tecnologias utilizadas no frontend, backend e na integração com Inteligência Artificial.

## Pontos-Chave para Análise

Por favor, concentre sua revisão nos seguintes pontos, utilizando o documento de análise como guia:

1.  **Arquitetura Geral:**
    *   A escolha de Next.js com App Router, Firebase como BaaS (Backend-as-a-Service) e Genkit para IA é adequada para uma intranet corporativa deste porte?
    *   Existem pontos de falha ou gargalos evidentes nesta arquitetura?

2.  **Tecnologias do Frontend:**
    *   A combinação de React, TypeScript, ShadCN e Tailwind CSS é uma escolha produtiva e sustentável?
    *   O uso de React Context API para gerenciamento de estado global é apropriado, ou seria mais indicado o uso de uma biblioteca dedicada (como Zustand ou Redux) considerando o crescimento futuro?

3.  **Backend e Serviços (Firebase):**
    *   A utilização do ecossistema Firebase (Firestore, Authentication, Storage) é custo-efetiva e escalável para 250 usuários e além?
    *   Quais são os principais riscos de segurança a serem mitigados (ex: regras de segurança do Firestore/Storage)?

4.  **Integração com IA (Genkit e Gemini):**
    *   A arquitetura dos fluxos de IA (flows) com Genkit é modular e extensível?
    *   O uso de ferramentas (Tool Use) pelo chatbot para buscar dados na base de conhecimento é uma abordagem eficiente?

5.  **Manutenibilidade e Escalabilidade:**
    *   A estrutura do projeto facilita a adição de novas funcionalidades e a manutenção por parte de novos desenvolvedores?
    *   Considerando um crescimento para 500 ou 1000 usuários, a arquitetura atual se sustentaria? Quais seriam os primeiros pontos a exigir uma refatoração?

6.  **Dependência de Fornecedor (Vendor Lock-in):**
    *   Qual o nível de risco associado à forte dependência do ecossistema Google (Firebase, Genkit, Gemini)? Existem estratégias para mitigar esse risco?

## Formato da Resposta

Por favor, forneça sua análise em um relatório escrito, destacando:
*   Pontos fortes da arquitetura atual.
*   Riscos identificados (classificados por criticidade: alta, média, baixa).
*   Recomendações e sugestões de melhoria (sejam elas de curto, médio ou longo prazo).
*   Qualquer outra consideração que julgar relevante para o sucesso do projeto.
