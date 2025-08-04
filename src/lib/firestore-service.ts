
import { getFirebaseApp } from './firebase'; // Import the initialized app function
import { getFirestore, writeBatch, onSnapshot } from "firebase/firestore";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc, setDoc, runTransaction, query, where, Query } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { cleanDataForFirestore } from './data-sanitizer';

// Initialize Firestore with the app instance
const app = getFirebaseApp();
const db = getFirestore(app);
const storage = getStorage(app);

export type WithId<T> = T & { id: string };

/**
 * Uploads a file to Firebase Storage.
 * @param file The file to upload.
 * @param requestId The ID of the workflow request this file is associated with.
 * @param fileName The name of the file.
 * @param storagePath The base path in Storage to upload to. Defaults to 'workflow-attachments'.
 * @returns A promise that resolves to the download URL of the uploaded file.
 */
export const uploadFile = async (file: File, requestId: string, fileName: string, storagePath?: string): Promise<string> => {
    const basePath = storagePath || 'workflow-attachments';
    // Standardized file name to prevent conflicts
    const standardizedFileName = `${requestId}-${fileName.replace(/\s+/g, '_')}`;
    const filePath = `${basePath}/${standardizedFileName}`;
    const storageRef = ref(storage, filePath);
    try {
        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        return downloadUrl;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw new Error("Não foi possível carregar o arquivo.");
    }
};

/**
 * Attaches a real-time listener to a Firestore collection.
 * This function is designed to be used with react-query's useQuery hook.
 *
 * @param collectionName The name of the collection to listen to.
 * @param onData A callback function that will be called with the new data whenever it changes.
 * @returns An unsubscribe function to detach the listener.
 */
export const listenToCollection = <T>(
    collectionName: string,
    onData: (data: WithId<T>[]) => void,
    onError: (error: Error) => void
): (() => void) => {
    try {
        const q = query(collection(db, collectionName));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const data: WithId<T>[] = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as WithId<T>);
            });
            onData(data);
        }, (error) => {
            console.error(`Error listening to collection ${collectionName}:`, error);
            onError(new Error(`Não foi possível ouvir os dados de ${collectionName}.`));
        });

        return unsubscribe; // Return the unsubscribe function
    } catch (error) {
        console.error(`Error setting up listener for ${collectionName}:`, error);
        onError(new Error(`Falha ao configurar o ouvinte para ${collectionName}.`));
        return () => {}; // Return a no-op function if setup fails
    }
};

/**
 * Fetches all documents from a specified collection.
 * @param collectionName The name of the collection.
 * @returns A promise that resolves to an array of documents with their IDs.
 */
export const getCollection = async <T>(collectionName: string): Promise<WithId<T>[]> => {
    try {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        const data: WithId<T>[] = [];
        snapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() } as WithId<T>);
        });
        return data;
    } catch (error) {
        console.error(`Error fetching collection ${collectionName}:`, error);
        throw new Error(`Não foi possível carregar a coleção de ${collectionName}.`);
    }
};


/**
 * Fetches a single document by its ID from a specified collection.
 * @param collectionName The name of the collection.
 * @param id The ID of the document to fetch.
 * @returns A promise that resolves to the document data or null if not found.
 */
export const getDocument = async <T>(collectionName: string, id: string): Promise<WithId<T> | null> => {
    try {
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as WithId<T>) : null;
    } catch (error) {
        console.error(`Error fetching document ${id} from ${collectionName}:`, error);
        throw new Error(`Não foi possível carregar o documento.`);
    }
}

/**
 * Adds a new document to a specified collection. It automatically cleans the data
 * to remove any `undefined` fields before sending it to Firestore.
 * @param collectionName The name of the collection.
 * @param data The data for the new document (without an ID).
 * @returns A promise that resolves to the new document data, including its new ID.
 */
export const addDocumentToCollection = async <T extends object>(collectionName: string, data: T): Promise<WithId<T>> => {
    try {
        const cleanedData = cleanDataForFirestore(data);
        const collectionRef = collection(db, collectionName);
        const docRef = await addDoc(collectionRef, cleanedData);
        return { id: docRef.id, ...data };
    } catch (error) {
        console.error(`Error adding document to ${collectionName}:`, error);
        if (error instanceof Error) {
            console.error('Data that caused the error:', data);
        }
        throw new Error('Não foi possível adicionar o novo item.');
    }
};

/**
 * Adds multiple documents to a specified collection in a single batch operation.
 * @param collectionName The name of the collection.
 * @param dataArray An array of documents to add.
 * @returns A promise that resolves when the batch write is complete.
 */
export const addMultipleDocumentsToCollection = async <T extends object>(collectionName: string, dataArray: T[]): Promise<void> => {
    try {
        const batch = writeBatch(db);
        const collectionRef = collection(db, collectionName);

        dataArray.forEach(data => {
            const cleanedData = cleanDataForFirestore(data);
            const docRef = doc(collectionRef); // Automatically generate a new ID
            batch.set(docRef, cleanedData);
        });

        await batch.commit();
    } catch (error) {
        console.error(`Error adding multiple documents to ${collectionName}:`, error);
        if (error instanceof Error) {
            console.error('Data that caused the error:', dataArray);
        }
        throw new Error(`Não foi possível adicionar os itens em lote.`);
    }
};

/**
 * Creates or overwrites a document with a specific ID.
 * @param collectionName The name of the collection.
 * @param id The ID of the document to create or overwrite.
 * @param data The data for the document.
 * @returns A promise that resolves to void on success.
 */
export const setDocumentInCollection = async <T extends object>(collectionName: string, id: string, data: Partial<Omit<T, 'id'>>): Promise<void> => {
    try {
        const cleanedData = cleanDataForFirestore(data);
        const docRef = doc(db, collectionName, id);
        await setDoc(docRef, cleanedData, { merge: true }); // Use merge: true to avoid overwriting fields not in data
    } catch (error) {
        console.error(`Error setting document ${id} in ${collectionName}:`, error);
        if (error instanceof Error) {
            console.error('Data that caused the error:', data);
        }
        throw new Error('Não foi possível salvar os dados.');
    }
};


/**
 * Updates an existing document in a specified collection. It automatically cleans the data
 * to remove any `undefined` fields before sending it to Firestore.
 * @param collectionName The name of the collection.
 * @param id The ID of the document to update.
 * @param data The partial data to update. The 'id' field will be ignored.
 * @returns A promise that resolves to void on success.
 */
export const updateDocumentInCollection = async <T extends object>(collectionName: string, id: string, data: Partial<Omit<T, 'id'>>): Promise<void> => {
    try {
        const cleanedData = cleanDataForFirestore(data);
        const docRef = doc(db, collectionName, id);
        await updateDoc(docRef, cleanedData);
    } catch (error) {
        console.error(`Error updating document ${id} in ${collectionName}:`, error);
         if (error instanceof Error) {
            console.error('Data that caused the error:', data);
        }
        throw new Error('Não foi possível salvar as alterações.');
    }
};

/**
 * Deletes a document from a specified collection.
 * It first verifies if the document exists before attempting to delete it.
 * @param collectionName The name of the collection.
 * @param id The ID of the document to delete.
 * @returns A promise that resolves to void on success.
 */
export const deleteDocumentFromCollection = async (collectionName: string, id: string): Promise<void> => {
     const docRef = doc(db, collectionName, id);
    try {
        // First, check if the document exists to provide a better error message.
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
             // If the document doesn't exist, there's nothing to delete.
             // This can happen in race conditions where two users try to delete the same item.
             throw new Error("Documento não encontrado. Ele pode já ter sido excluído.");
        }
        
        // If the document exists, attempt to delete it.
        await deleteDoc(docRef);
    } catch (error) {
        // Log the full error for debugging purposes.
        console.error(`Error deleting document ${id} from ${collectionName}:`, error);
        
        // Re-throw a more user-friendly error message.
        // If the original error was our "Not Found" error, re-throw it.
        if (error instanceof Error && error.message.includes("Documento não encontrado")) {
             throw error;
        }

        // For other errors (like permission denied), provide a generic failure message.
        throw new Error('Não foi possível remover o item. Verifique suas permissões ou tente novamente.');
    }
};

/**
 * Gets the next sequential ID from a dedicated counter document in a Firestore transaction.
 * @param counterId The ID of the counter to use (e.g., 'workflowCounter').
 * @returns A promise that resolves to the next number in the sequence.
 */
export const getNextSequentialId = async (counterId: string): Promise<number> => {
  const counterRef = doc(db, 'counters', counterId);

  try {
    const newId = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      let nextValue = 1; // Default to 1 if counter doesn't exist
      if (counterDoc.exists()) {
        nextValue = (counterDoc.data().currentNumber || 0) + 1;
      }
      
      transaction.set(counterRef, { currentNumber: nextValue }, { merge: true });
      
      return nextValue;
    });
    return newId;
  } catch (error) {
    console.error("Transaction failed: ", error);
    throw new Error("Não foi possível gerar um novo ID para a solicitação.");
  }
};

export { writeBatch, doc, getFirestore };
