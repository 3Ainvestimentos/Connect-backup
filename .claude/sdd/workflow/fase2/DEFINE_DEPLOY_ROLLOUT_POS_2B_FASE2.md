# DEFINE: Deploy e rollout gradual das superficies v2 de workflows apos 2B

> Generated: 2026-04-10
> Status: Ready for /design
> Scope: Fase 2 - merge, deploy escuro, liberacao por permissao, smoke e rollback operacional das superficies v2 de workflows
> Source brainstorm: `BRAINSTORM_DEPLOY_ROLLOUT_POS_2B_FASE2.md`
> Clarity Score: 14/15

## 1. Problem Statement

O projeto precisa colocar em producao as superficies v2 de workflows apos a conclusao da 2B sem expor telas novas para usuarios errados, sem quebrar as rotas legadas e com rollback operacional rapido durante a janela de deploy em horario comercial.

## 2. Users

| User Type | Pain Point | Frequency |
|-----------|-----------|-----------|
| Super admin | Precisa liberar ou retirar acesso as superficies v2 rapidamente sem depender de rollback de codigo nem alterar a semantica das permissoes legadas | Pontual em cada deploy e durante o rollout |
| Grupo piloto (voce + 3 admins) | Precisa validar abertura, gestao e configuracao no fluxo v2 em producao antes da liberacao ampla | Intensivo no dia do deploy e nos dias seguintes |
| Colaborador comum sem permissao v2 | Nao deve ver menus, rotas ou superficies v2 antes da liberacao oficial para evitar confusao e suporte desnecessario | Diario durante a convivencia com o legado |
| Time operacional do rollout | Precisa executar smoke, acompanhar regressao e decidir abertura da segunda onda com criterios objetivos | Diario no periodo de rollout |

## 3. Goals (MoSCoW)

### MUST Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| M1 | Deploy escuro com enablement por permissao | O merge em `master` e o deploy publicam o codigo v2 sem expor menus ou rotas novas para usuarios sem as permissoes novas; codigo em producao nao implica liberacao ampla |
| M2 | Novas permissoes v2 com default `false` | As permissoes `canManageRequestsV2`, `canManageWorkflowsV2` e `canOpenRequestsV2` existem com labels administrativas claras e nascem desativadas para todos os usuarios fora do piloto |
| M3 | Gates completos em menu, rota e API | Usuarios sem permissao v2 nao veem links novos, nao acessam as paginas v2 por URL direta e nao conseguem usar endpoints protegidos das superficies v2 |
| M4 | Preservacao do legado durante o rollout inicial | `/requests`, `/me/tasks`, `/applications` e `/admin/workflows` continuam operacionais e semanticamente intactos durante o piloto e a primeira onda de liberacao |
| M5 | Piloto fechado com quatro usuarios | Apenas voce e mais 3 admins recebem as tres permissoes v2 na Fase 2 do rollout; o restante da empresa permanece sem visibilidade das telas v2 |
| M6 | Smoke tecnico e operacional apos deploy | Existe checklist executavel para usuario sem permissao, piloto, admin de gestao e admin de configuracao; o rollout nao avanca sem esse smoke minimo aprovado |
| M7 | Kill-switch operacional sem rollback de codigo | O super admin consegue desligar as tres permissoes v2 e remover imediatamente a visibilidade/acesso da feature para o piloto ou para toda a empresa sem novo deploy |
| M8 | Criterio objetivo para segunda onda | A liberacao ampla so ocorre apos smoke aprovado, ausencia de regressao no legado e estabilidade do piloto durante o periodo definido pelo rollout |

### SHOULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| S1 | Labels administrativas menos ambiguas | A tela de permissoes exibe labels como `Gestao Chamados V2`, `Config Chamados V2` e `Solicitacoes V2`, reduzindo a confusao com as permissoes legadas |
| S2 | Separacao operacional entre deploy e enablement | O procedimento documentado distingue explicitamente o deploy do codigo da etapa posterior de ligacao de permissoes |
| S3 | Janela de rollout em ondas | O plano explicita Fase 0 preparacao, Fase 1 deploy escuro, Fase 2 piloto fechado e Fase 3 abertura ampla, com donos operacionais definidos |
| S4 | Segunda onda intermediaria opcional | O rollout pode passar por uma liberacao segmentada por area antes da empresa inteira sem exigir redesenho tecnico |

### COULD Have

| # | Requirement | Acceptance Criteria |
|---|-------------|-------------------|
| C1 | Renomeacao visual das permissoes legadas | A tela de admin pode exibir labels como `Config Chamados (Legado)` e `Gestao Solicitacoes (Legado)` sem alterar o contrato tecnico atual |
| C2 | Marco temporal formal do rollout | O plano pode registrar um modelo simples `Dia 1`, `Dia 2` e `Dia 7` para revisao e abertura gradual |
| C3 | Comunicacao segmentada por area na segunda onda | Caso usada a abordagem intermediaria, o enablement pode ser feito por areas de negocio especificas |

### WON'T Have (this iteration)

| # | Requirement | Why Deferred |
|---|-------------|-------------|
| W1 | Desativar ou remover as telas legadas no primeiro deploy | Isso aumenta o risco operacional; a convivencia controlada e requisito desta iteracao |
| W2 | Reestruturar profundamente a semantica tecnica das permissoes legadas | O primeiro rollout deve reduzir risco e preservar contratos atuais |
| W3 | Usar rollback de codigo como primeira resposta a incidente | O plano prioriza kill-switch operacional via permissao; rollback de codigo fica para regressao ampla |
| W4 | Branch longa de release ou estrategia paralela complexa de deploy | O brainstorm recomenda merge direto em `master` com gates fechados |

## 4. Success Criteria

| Criterion | Target | How to Measure |
|-----------|--------|---------------|
| Visibilidade controlada | 0 usuarios fora do piloto veem menu ou rota v2 antes da liberacao oficial | Validacao manual com usuario sem permissao e checagem de menu/rota apos deploy |
| Preservacao do legado | 0 regressao critica nas rotas legadas de workflows apos o deploy | Smoke do legado aprovado em `/applications`, `/requests`, `/me/tasks` e `/admin/workflows` |
| Piloto funcional ponta a ponta | 100% dos 4 usuarios piloto conseguem abrir, gerir e configurar chamados v2 no smoke inicial | Checklist executado e assinado pelo owner do rollout |
| Kill-switch eficaz | Remocao das permissoes v2 retira acesso/visibilidade em tempo operacional curto sem novo deploy | Teste controlado de desligamento de permissao em pelo menos um usuario piloto |
| Prontidao para segunda onda | Liberacao ampla ocorre somente apos piloto estavel e sem incidentes bloqueantes no periodo definido | Registro de aprovacao operacional antes do enablement geral |
| Clareza administrativa | Super admin consegue identificar as permissoes v2 corretas sem ambiguidade com o legado | Revisao da tela de permissoes com labels finais antes do deploy |

## 5. Technical Scope

### Backend / API / Auth

| Component | Change Type | Details |
|-----------|------------|---------|
| Guards de autorizacao das rotas v2 | Modify | Garantir validacao consistente das novas permissoes nas superficies de abertura, gestao e configuracao, inclusive por acesso direto a URL |
| Endpoints v2 de workflows | Modify | Confirmar gate server-side para evitar que ocultacao visual seja a unica barreira de acesso |
| Modelo de permissoes de colaboradores/admin | Modify | Adicionar ou consolidar os flags `canManageRequestsV2`, `canManageWorkflowsV2` e `canOpenRequestsV2` com default `false` |

### Frontend / Navegacao

| Component | Change Type | Details |
|-----------|------------|---------|
| Menu principal autenticado | Modify | Exibir links v2 apenas para usuarios com as novas permissoes e preservar menus legados durante a convivencia |
| Rotas `/gestao-de-chamados`, `/solicitacoes`, `/admin/request-config` | Modify | Aplicar guards de pagina coerentes com as novas permissoes e comportamento de rollout |
| Tela administrativa de permissoes | Modify | Exibir labels administrativas finais das permissoes v2 e, opcionalmente, labels legadas menos ambiguas |

### Database / Configuracao

| Model | Change Type | Details |
|-------|------------|---------|
| Registro de permissoes de usuarios | Modify | Persistir os novos flags v2 com estado inicial `false` para nao-piloto |
| Configuracao operacional de rollout | None/Document | Nao exige nova colecao se o controle for inteiramente via permissao; checklist e ownership ficam documentais |

### AI Services

| Service | Change Type | Details |
|---------|------------|---------|
| AI services | None | Nao ha escopo de IA/Genkit neste rollout |

## 6. Auth & Security Requirements

| Requirement | Details |
|-------------|---------|
| Authentication | Todas as superficies v2 continuam dentro da area autenticada existente; usuario anonimo nao acessa menus nem rotas |
| Role-based access | `canOpenRequestsV2` controla `/solicitacoes`; `canManageRequestsV2` controla `/gestao-de-chamados`; `canManageWorkflowsV2` controla `/admin/request-config` |
| User isolation | Usuarios sem permissao v2 nao podem ver links nem usar acesso direto por URL; gates client-side e server-side precisam ser coerentes |
| Admin operation | Apenas super admin ou fluxo administrativo equivalente pode ligar/desligar as permissoes v2 para rollout e rollback operacional |
| Input validation | Mudancas de permissoes precisam validar payload e manter compatibilidade com o modelo atual de colaboradores/permissoes |

## 7. Out of Scope

- Desligar definitivamente as telas legadas de workflows no mesmo deploy
- Refatorar profundamente o sistema legado de permissoes alem do necessario para o rollout
- Unificar as permissoes legadas e v2 em um novo modelo de autorizacao mais amplo
- Criar feature flag infrastructure separada se a necessidade for coberta pelas permissoes existentes
- Instrumentacao completa de analytics/telemetria do rollout
- Automacao completa da comunicacao interna de liberacao

## 8. Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| Fases 2A a 2E concluidas e integradas | Internal | Ready segundo o brainstorm |
| Nova tela oficial `/solicitacoes` da 2B | Internal | Ready/assumida como precondicao deste define |
| Mecanismo atual de ocultacao por permissao | Internal | Ready segundo o brainstorm |
| Acesso administrativo rapido para ligar/desligar permissoes | Internal | Required before deploy |
| Lista final dos 4 usuarios piloto | Operational | Required before deploy |
| Janela de deploy em horario comercial com owner definido | Operational | Required before deploy |

## 9. Clarity Score

| Dimension | Score (0-3) | Notes |
|-----------|------------|-------|
| Problem clarity | 3 | Problema esta claro: deploy seguro com convivencia entre legado e v2 e rollback operacional rapido |
| User identification | 3 | Usuarios e operadores afetados estao bem definidos, com dores concretas |
| Success criteria measurability | 3 | Criterios observaveis e verificaveis via smoke, visibilidade e kill-switch |
| Technical scope definition | 3 | Camadas afetadas estao delimitadas em menu, rotas, auth, tela de permissoes e modelo de usuarios |
| Edge cases considered | 2 | Ha boa cobertura de rollout, piloto e rollback; detalhes finais de ownership/comunicacao ficam para design operacional |
| **TOTAL** | **14/15** | Pronto para `/design` |

## 10. Next Step

Ready for `/design DEPLOY_ROLLOUT_POS_2B_FASE2` to definir o procedimento tecnico-operacional, arquivos afetados, estrategia de validacao e plano de execucao do rollout.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-10 | Codex (`define` skill) | Initial requirements from `BRAINSTORM_DEPLOY_ROLLOUT_POS_2B_FASE2.md` |
