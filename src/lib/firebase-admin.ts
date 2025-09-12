
import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

// Esta função garante que o app admin do Firebase seja inicializado apenas uma vez (padrão Singleton)
export function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    // Retorna o app já inicializado se houver algum
    // Nota: Em ambientes serverless, você pode querer uma lógica mais robusta
    // para garantir que está pegando o app correto se múltiplos existirem.
    // Para este caso de uso, pegar o primeiro app é suficiente.
    return getApp();
  }

  // Verifica se as credenciais de serviço estão disponíveis nas variáveis de ambiente.
  // O Firebase Admin SDK busca automaticamente a variável GOOGLE_APPLICATION_CREDENTIALS.
  // Em ambientes do Google Cloud (como Cloud Functions ou App Run), isso é configurado automaticamente.
  // Localmente, você precisa definir essa variável de ambiente para apontar para o seu arquivo de chave de serviço.
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.warn(
      'AVISO: Credenciais de Admin do Firebase não encontradas.' +
      'A verificação de token no backend falhará. ' +
      'Defina a variável de ambiente GOOGLE_APPLICATION_CREDENTIALS.'
    );
  }

  // Inicializa o app com as credenciais padrão do ambiente.
  const app = initializeApp();
  
  return app;
}

    