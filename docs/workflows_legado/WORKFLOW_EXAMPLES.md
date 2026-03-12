# Exemplos de JSON para Workflows do 3A RIVA Connect

Este documento contém exemplos de definições de workflow em formato JSON que podem ser importados diretamente para a plataforma através do painel de administração (`/admin/workflows`).

Use estes modelos como base para criar novos processos ou como referência para entender a estrutura de dados.

---

## 1. Solicitação de Reembolso

Este é um workflow completo para um processo de solicitação de reembolso, incluindo campos de vários tipos, status com ações de execução e aprovação, e regras de SLA e roteamento.

**Arquivo:** `reembolso.json`

```json
{
  "name": "Solicitação de Reembolso",
  "description": "Utilize este formulário para solicitar o reembolso de despesas relacionadas ao trabalho. Anexe o comprovante na seção apropriada.",
  "icon": "DollarSign",
  "areaId": "JHRMLJcWlD83r3q3pZk2",
  "ownerEmail": "responsavel.financeiro@3a.com",
  "allowedUserIds": ["all"],
  "defaultSlaDays": 5,
  "fields": [
    {
      "id": "tipo_despesa",
      "label": "Tipo de Despesa",
      "type": "select",
      "required": true,
      "options": ["Alimentação", "Transporte", "Hospedagem", "Material de Escritório", "Outro"]
    },
    {
      "id": "valor_reembolso",
      "label": "Valor do Reembolso (R$)",
      "type": "text",
      "required": true,
      "placeholder": "Ex: 150.75"
    },
    {
      "id": "data_despesa",
      "label": "Data da Despesa",
      "type": "date",
      "required": true
    },
    {
      "id": "justificativa",
      "label": "Justificativa",
      "type": "textarea",
      "required": true,
      "placeholder": "Descreva o motivo da despesa."
    },
    {
      "id": "comprovante",
      "label": "Anexar Comprovante",
      "type": "file",
      "required": true
    }
  ],
  "statuses": [
    {
      "id": "pendente_analise",
      "label": "Pendente de Análise"
    },
    {
      "id": "analise_financeiro",
      "label": "Em Análise (Financeiro)",
      "action": {
        "type": "execution",
        "label": "Executar Análise",
        "commentRequired": true,
        "attachmentRequired": false,
        "commentPlaceholder": "Digite aqui o parecer da análise financeira..."
      }
    },
    {
      "id": "aguardando_aprovacao_diretoria",
      "label": "Aguardando Aprovação da Diretoria",
      "action": {
        "type": "approval",
        "label": "Solicitar Aprovação da Diretoria",
        "approverIds": ["diretor1@3a.com", "diretor2@3a.com"]
      }
    },
    {
      "id": "aprovado",
      "label": "Aprovado"
    },
    {
      "id": "reprovado",
      "label": "Reprovado"
    }
  ],
  "slaRules": [
    {
      "field": "tipo_despesa",
      "value": "Hospedagem",
      "days": 10
    }
  ],
  "routingRules": [
    {
      "field": "tipo_despesa",
      "value": "Hospedagem",
      "notify": ["viagens@3a.com", "financeiro@3a.com"]
    }
  ]
}
```

---

## 2. Alteração de Cargo / Remuneração / Time

Este é um workflow de exemplo para um processo de RH mais complexo, destinado a líderes para solicitar alterações para seus liderados.

**Arquivo:** `alteracao_cargo_remuneracao.json`

```json
{
  "name": "TH - Alteração de Cargo / Remuneração / Time",
  "description": "Formulário para líderes solicitarem alterações de cargo, remuneração ou time para um colaborador.",
  "icon": "Users",
  "areaId": "some_rh_area_id",
  "ownerEmail": "rh@3a.com",
  "allowedUserIds": ["lider1@3a.com", "lider2@3a.com"],
  "defaultSlaDays": 10,
  "fields": [
    {
      "id": "colaborador_afetado",
      "label": "Colaborador",
      "type": "select",
      "required": true,
      "options": ["colaborador1@3a.com", "colaborador2@3a.com"]
    },
    {
      "id": "data_efetiva",
      "label": "Data para Efetivação da Mudança",
      "type": "date",
      "required": true
    },
    {
      "id": "tipo_alteracao",
      "label": "Tipo de Alteração",
      "type": "select",
      "required": true,
      "options": ["Alteração de Cargo", "Alteração de Remuneração", "Alteração de Time", "Alteração Múltipla"]
    },
    {
      "id": "novo_cargo",
      "label": "Novo Cargo (se aplicável)",
      "type": "text",
      "required": false
    },
    {
      "id": "nova_remuneracao",
      "label": "Nova Remuneração (Bruta Mensal)",
      "type": "text",
      "required": false
    },
    {
      "id": "novo_time",
      "label": "Novo Time ou Equipe (se aplicável)",
      "type": "text",
      "required": false
    },
    {
      "id": "justificativa_completa",
      "label": "Justificativa Detalhada para a Alteração",
      "type": "textarea",
      "required": true
    }
  ],
  "statuses": [
    {
      "id": "analise_rh",
      "label": "Análise do RH"
    },
    {
      "id": "aguardando_aprovacao_diretoria",
      "label": "Aguardando Aprovação da Diretoria",
      "action": {
        "type": "approval",
        "label": "Solicitar Aprovação da Diretoria",
        "approverIds": ["diretor.geral@3a.com"]
      }
    },
    {
      "id": "aprovado_aguardando_processamento",
      "label": "Aprovado - Aguardando Processamento"
    },
    {
      "id": "finalizado",
      "label": "Finalizado"
    },
    {
      "id": "rejeitado",
      "label": "Rejeitado"
    }
  ]
}
```

---

*Observação: O campo `areaId` é um identificador único do Firestore para a "Área de Workflow" onde o processo será agrupado. Você pode encontrar o ID correto na tela de gerenciamento de áreas de workflow no painel de administração.*
