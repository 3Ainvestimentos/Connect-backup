
'use server';

import { getFirebaseApp } from './firebase';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

const app = getFirebaseApp();
const db = getFirestore(app);

export async function runDeleteTest() {
  console.log("--- INICIANDO TESTE DE EXCLUSÃO ---");
  const eventTitleToDelete = "Evento teste 2";
  const eventsRef = collection(db, "events");

  try {
    console.log(`Procurando por evento com título: "${eventTitleToDelete}"`);
    const q = query(eventsRef, where("title", "==", eventTitleToDelete));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      const message = `[FALHA NO TESTE] Nenhum evento com o título "${eventTitleToDelete}" foi encontrado. Verifique se o nome está correto ou se o evento já foi excluído.`;
      console.error(message);
      return { success: false, message };
    }

    let deletionSuccessful = true;
    let finalMessage = "";

    for (const docSnapshot of querySnapshot.docs) {
      console.log(`Documento encontrado: ID = ${docSnapshot.id}. Tentando excluir...`);
      try {
        await deleteDoc(doc(db, "events", docSnapshot.id));
        console.log(`[SUCESSO] Documento com ID ${docSnapshot.id} excluído com sucesso.`);
      } catch (deleteError) {
        console.error(`[ERRO NA EXCLUSÃO] Falha ao excluir o documento com ID ${docSnapshot.id}:`, deleteError);
        deletionSuccessful = false;
      }
    }
    
    if (deletionSuccessful) {
        finalMessage = `[TESTE BEM-SUCEDIDO] O evento "${eventTitleToDelete}" foi encontrado e excluído com sucesso do Firestore.`;
        console.log(finalMessage);
    } else {
        finalMessage = `[FALHA NO TESTE] Um ou mais erros ocorreram durante a tentativa de exclusão. Verifique os logs de erro acima.`;
        console.error(finalMessage);
    }

    return { success: deletionSuccessful, message: finalMessage };

  } catch (error) {
    const message = `[ERRO CRÍTICO NO TESTE] Ocorreu um erro ao consultar o Firestore:`;
    console.error(message, error);
    return { success: false, message: `${message} ${error}` };
  }
}
