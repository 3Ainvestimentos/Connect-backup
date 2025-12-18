/**
 * @fileOverview Utilitário para sanitização e normalização de caminhos de arquivo/Storage.
 * Previne ataques de path traversal e garante caminhos válidos e seguros.
 */

/**
 * Sanitiza e normaliza um caminho para uso no Firebase Storage.
 * Remove barras duplas, normaliza separadores, previne path traversal.
 * 
 * @param path - O caminho a ser sanitizado
 * @returns O caminho sanitizado e normalizado
 * @throws Error se o caminho contiver tentativas de path traversal ou caracteres inválidos
 */
export const sanitizeStoragePath = (path: string): string => {
  if (!path || typeof path !== 'string') {
    throw new Error('Caminho inválido: deve ser uma string não vazia');
  }

  // Remove espaços no início e fim
  let sanitized = path.trim();

  // Remove barras no início e fim (Firebase Storage paths não devem começar/terminar com /)
  sanitized = sanitized.replace(/^\/+|\/+$/g, '');

  // Normaliza separadores (garante usar apenas /)
  sanitized = sanitized.replace(/\\/g, '/');

  // Remove barras duplas/triplas etc
  sanitized = sanitized.replace(/\/+/g, '/');

  // Previne path traversal attacks (../, ..\, etc) - CRÍTICO para segurança
  if (sanitized.includes('..')) {
    throw new Error('Caminho inválido: não é permitido usar ".." (path traversal)');
  }

  // Não valida caracteres especiais aqui para não quebrar caminhos existentes válidos
  // Firebase Storage geralmente aceita muitos caracteres, e validação muito restritiva
  // pode quebrar funcionalidades. O importante é prevenir path traversal.

  // Não pode ser vazio após sanitização
  if (!sanitized) {
    throw new Error('Caminho inválido: caminho vazio após sanitização');
  }

  return sanitized;
};

/**
 * Constrói um caminho completo de arquivo no Storage de forma segura.
 * Combina basePath, subPath e fileName, garantindo que o resultado seja seguro.
 * 
 * @param basePath - O caminho base (ex: "financeiro/reembolsos")
 * @param subPath - Subpasta opcional (ex: "requestId")
 * @param fileName - Nome do arquivo
 * @returns O caminho completo sanitizado
 */
export const buildStorageFilePath = (
  basePath: string,
  subPath: string,
  fileName: string
): string => {
  // Sanitiza cada componente separadamente
  const sanitizedBase = sanitizeStoragePath(basePath);
  const sanitizedSub = sanitizeStoragePath(subPath);
  
  // Para o nome do arquivo, sanitiza de forma conservadora
  let sanitizedFileName = fileName.trim();
  
  // Remove barras (arquivos não podem conter barras no nome) - crítico
  sanitizedFileName = sanitizedFileName.replace(/[/\\]/g, '_');
  
  // Previne path traversal no nome do arquivo - crítico para segurança
  if (sanitizedFileName.includes('..')) {
    sanitizedFileName = sanitizedFileName.replace(/\.\./g, '__');
  }
  
  // Não remove outros caracteres especiais para não quebrar nomes de arquivos válidos
  // O Firebase Storage lida com caracteres especiais no nome do arquivo
  
  // Não pode ser vazio
  if (!sanitizedFileName) {
    throw new Error('Nome de arquivo inválido: nome vazio após sanitização');
  }

  // Constrói o caminho final (já todos sanitizados)
  return `${sanitizedBase}/${sanitizedSub}/${sanitizedFileName}`;
};

/**
 * Valida um storageFolderPath conforme as regras do sistema.
 * Usado para validar inputs do usuário antes de salvar no banco.
 * Validação conservadora que não rejeita caminhos válidos existentes.
 * 
 * @param path - O caminho a ser validado
 * @returns true se válido, false caso contrário
 */
export const isValidStorageFolderPath = (path: string): boolean => {
  if (!path || typeof path !== 'string') {
    return false;
  }
  
  const trimmed = path.trim();
  
  // Validações mínimas e conservadoras
  if (!trimmed || trimmed === '' || trimmed === '.' || trimmed === '..') {
    return false;
  }
  
  // Bloqueia apenas path traversal explícito
  if (trimmed.includes('..')) {
    return false;
  }
  
  return true;
};

