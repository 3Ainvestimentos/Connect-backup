/**
 * @fileOverview
 * Biblioteca de lógicas de gamificação genéricas para calcular recompensas.
 * Cada função representa um tipo de cálculo que pode ser associado a um grupo de missões.
 */

// Interface para a definição de uma regra de premiação
export interface RewardRule {
  count: number;
  reward: number;
}

/**
 * Lógica de "Prêmio por Faixas".
 * A recompensa é baseada no número de missões concluídas, de acordo com as faixas definidas.
 * A função encontra a maior faixa de contagem que foi atingida e retorna a recompensa correspondente.
 * Ex: Se as regras são [{count: 1, reward: 1000}, {count: 3, reward: 2000}] e o usuário completou 2 missões, ele ganha R$ 1000.
 *
 * @param achievedCount O número de missões conquistadas dentro do grupo.
 * @param rules Um array de regras de recompensa ordenadas pela contagem.
 * @returns O valor da recompensa em BRL.
 */
function tieredReward(achievedCount: number, rules: RewardRule[]): number {
  if (achievedCount === 0 || !rules || rules.length === 0) {
    return 0;
  }

  let applicableReward = 0;
  // Ordena as regras pela contagem para garantir que a lógica funcione corretamente
  const sortedRules = [...rules].sort((a, b) => a.count - b.count);

  for (const rule of sortedRules) {
    if (achievedCount >= rule.count) {
      applicableReward = rule.reward; // A recompensa da maior faixa atingida é aplicada
    } else {
      break; // Para de procurar assim que uma contagem não for atingida
    }
  }

  return applicableReward;
}


// Mapeamento de tipos de lógica para suas funções de cálculo.
// Para adicionar uma nova lógica, crie a função e adicione-a a este mapa.
export const missionLogics: Record<string, (achievedCount: number, rules: RewardRule[]) => number> = {
  tieredReward: tieredReward,
  // Exemplo de outra lógica que poderia ser adicionada no futuro:
  // 'perMissionBonus': (achievedCount, rules) => {
  //   const bonusPerMission = rules[0]?.reward || 0;
  //   return achievedCount * bonusPerMission;
  // }
};

// Array de tipos de lógica disponíveis para a UI
export const availableLogicTypes = [
  { value: 'tieredReward', label: 'Prêmio por Faixas (Tiered)' },
  // { value: 'perMissionBonus', label: 'Bônus por Missão' },
];
