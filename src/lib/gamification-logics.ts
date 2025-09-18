/**
 * @fileOverview
 * Biblioteca de lógicas de gamificação genéricas para calcular recompensas.
 * Cada função representa um tipo de cálculo que pode ser associado a um grupo de objetivos.
 */

// Interface para a definição de uma regra de premiação
export interface RewardRule {
  count: number;
  reward: number;
}

/**
 * Lógica de "Prêmio por Faixas".
 * A recompensa é baseada no número de objetivos concluídos, de acordo com as faixas definidas.
 * A função encontra a maior faixa de contagem que foi atingida e retorna a recompensa correspondente.
 * Ex: Se as regras são [{count: 1, reward: 1000}, {count: 3, reward: 2000}] e o usuário completou 2 objetivos, ele ganha R$ 1000.
 *
 * @param achievedCount O número de objetivos conquistados dentro do grupo.
 * @param rules Um array de regras de recompensa ordenadas pela contagem.
 * @returns O valor da recompensa em BRL.
 */
function tieredReward(achievedCount: number, rules: RewardRule[]): number {
  if (achievedCount === 0 || !rules || rules.length === 0) {
    return 0;
  }

  let applicableReward = 0;
  const sortedRules = [...rules].sort((a, b) => a.count - b.count);

  for (const rule of sortedRules) {
    if (achievedCount >= rule.count) {
      applicableReward = rule.reward;
    } else {
      break;
    }
  }

  return applicableReward;
}

/**
 * Lógica "Bônus por Objetivo".
 * Retorna uma recompensa fixa para cada objetivo concluído.
 * @param achievedCount - O número de objetivos concluídos.
 * @param rules - Deve conter uma regra com o valor do bônus em `reward`.
 * @returns O valor total do bônus.
 */
function linearBonus(achievedCount: number, rules: RewardRule[]): number {
  if (achievedCount === 0 || !rules || rules.length === 0) {
    return 0;
  }
  const bonusPerMission = rules[0]?.reward || 0;
  return achievedCount * bonusPerMission;
}

/**
 * Lógica "Tudo ou Nada".
 * Retorna uma grande recompensa somente se todos os objetivos elegíveis forem concluídos.
 * @param achievedCount - O número de objetivos concluídos.
 * @param rules - Deve conter uma regra com a contagem total de objetivos em `count` e o prêmio em `reward`.
 * @returns O valor do prêmio ou 0.
 */
function allOrNothing(achievedCount: number, rules: RewardRule[]): number {
    if (achievedCount === 0 || !rules || rules.length === 0) {
        return 0;
    }
    const totalMissionsRequired = rules[0]?.count || 0;
    const finalReward = rules[0]?.reward || 0;
    
    return achievedCount >= totalMissionsRequired ? finalReward : 0;
}

/**
 * Lógica "Prêmio Base + Bônus Adicional".
 * @param achievedCount - O número de objetivos concluídos.
 * @param rules - `rules[0]` contém o prêmio base, `rules[1]` contém o bônus adicional.
 * @returns O valor total da recompensa.
 */
function basePlusBonus(achievedCount: number, rules: RewardRule[]): number {
    if (achievedCount === 0 || !rules || rules.length === 0) {
        return 0;
    }
    const baseReward = rules.find(r => r.count === 1)?.reward || 0;
    const additionalBonus = rules.find(r => r.count > 1)?.reward || 0;

    if (achievedCount > 0) {
        return baseReward + (achievedCount - 1) * additionalBonus;
    }
    return 0;
}

// Mapeamento de tipos de lógica para suas funções de cálculo.
export const missionLogics: Record<string, (achievedCount: number, rules: RewardRule[]) => number> = {
  tieredReward,
  linearBonus,
  allOrNothing,
  basePlusBonus,
};

// Array de tipos de lógica disponíveis para a UI
export const availableLogicTypes = [
  { value: 'tieredReward', label: 'Prêmio por Faixas (Tiered)', description: 'A recompensa aumenta conforme mais objetivos são atingidos. Ex: 1-2 objetivos = R$100, 3+ objetivos = R$250.', ruleFields: ['count', 'reward'], ruleCount: 'multiple' },
  { value: 'linearBonus', label: 'Bônus por Objetivo (Linear)', description: 'Um valor fixo para cada objetivo concluído. Ex: R$50 por cada um dos 5 objetivos, totalizando R$250 se todos forem feitos.', ruleFields: ['reward'], ruleCount: 'single' },
  { value: 'allOrNothing', label: 'Tudo ou Nada', description: 'Um prêmio único é pago somente se TODOS os objetivos do grupo forem concluídos. Ex: Complete os 5 objetivos para ganhar R$1000.', ruleFields: ['count', 'reward'], ruleCount: 'single' },
  { value: 'basePlusBonus', label: 'Prêmio Base + Bônus Adicional', description: 'Um prêmio inicial pela primeira missão e um bônus para cada missão extra. Ex: R$500 pela 1ª, +R$100 por cada adicional.', ruleFields: ['reward', 'reward'], ruleCount: 'dual' },
];