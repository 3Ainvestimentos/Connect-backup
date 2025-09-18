
/**
 * @fileOverview
 * Biblioteca de lógicas de gamificação para calcular recompensas de grupos de missões.
 * Cada função exportada representa a lógica para um grupo de missão específico.
 */

// Interface para os dados de uma missão processada
interface MissionStatus {
  eligible: boolean;
  achieved: boolean;
}

/**
 * Lógica de cálculo para o GRUPO_ASSESSOR.
 * - 1 missão completa = R$ 1.000
 * - 2 missões completas = R$ 1.500
 * - 3 missões completas = R$ 2.000
 * @param achievedCount O número de missões conquistadas dentro do grupo.
 * @returns O valor da recompensa em BRL.
 */
function calculateGrupoAssessor(achievedCount: number): number {
  if (achievedCount === 1) return 1000;
  if (achievedCount === 2) return 1500;
  if (achievedCount >= 3) return 2000;
  return 0;
}

// Mapeamento de nomes de grupos para suas funções de cálculo.
// Para adicionar uma nova lógica, crie a função e adicione-a a este mapa.
export const missionGroupLogics: Record<string, (achievedCount: number) => number> = {
  'GRUPO_ASSESSOR': calculateGrupoAssessor,
  // Adicione outras lógicas de grupo aqui...
  // 'OUTRO_GRUPO': calculateOutroGrupo,
};
