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

*Observação: O campo `areaId` é um identificador único do Firestore para a "Área de Workflow" onde o processo será agrupado. Você pode encontrar o ID correto na tela de gerenciamento de áreas de workflow no painel de administração.*
