
import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, writeBatch, Timestamp } from 'firebase/firestore';

export type WithId<T> = T & { id: string };

/**
 * Sanitizes data for Firestore by removing 'undefined' values.
 * This function is crucial because Firestore rejects objects with 'undefined' fields.
 * It uses JSON.stringify/parse, which is a simple and effective method for the
 * data structures used in this application (no special types like Date, etc. in forms).
 * @param data The data object to sanitize.
 * @returns A sanitized data object without any 'undefined' properties.
 */
function sanitizeDataForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Fetches all documents from a specified collection.
 * @param collectionName The name of the collection to fetch.
 * @returns A promise that resolves to an array of documents with their IDs.
 */
export const getCollection = async <T>(collectionName: string): Promise<WithId<T>[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithId<T>));
    } catch (error) {
        console.error(`Error fetching collection ${collectionName}:`, error);
        throw new Error(`Não foi possível carregar os dados de ${collectionName}.`);
    }
};

/**
 * Adds a new document to a specified collection after sanitizing it.
 * @param collectionName The name of the collection.
 * @param data The data for the new document.
 * @returns A promise that resolves to the new document with its ID.
 */
export const addDocumentToCollection = async <T>(collectionName: string, data: T): Promise<WithId<T>> => {
    try {
        const sanitizedData = sanitizeDataForFirestore(data);
        const docRef = await addDoc(collection(db, collectionName), sanitizedData);
        // We return the original data with the new ID, not the sanitized one, to keep the client-side state consistent if needed.
        return { id: docRef.id, ...data };
    } catch (error) {
        console.error(`Error adding document to ${collectionName}:`, error);
        throw new Error('Não foi possível adicionar o novo item.');
    }
};

/**
 * Updates an existing document in a specified collection after sanitizing the data.
 * @param collectionName The name of the collection.
 * @param id The ID of the document to update.
 * @param data The new data for the document.
 * @returns A promise that resolves to void on success.
 */
export const updateDocumentInCollection = async <T>(collectionName: string, id: string, data: Partial<T>): Promise<void> => {
    try {
        const sanitizedData = sanitizeDataForFirestore(data);
        const docRef = doc(db, collectionName, id);
        await updateDoc(docRef, sanitizedData);
    } catch (error) {
        console.error(`Error updating document ${id} in ${collectionName}:`, error);
        throw new Error('Não foi possível salvar as alterações.');
    }
};

/**
 * Deletes a document from a specified collection.
 * @param collectionName The name of the collection.
 * @param id The ID of the document to delete.
 * @returns A promise that resolves to void on success.
 */
export const deleteDocumentFromCollection = async (collectionName: string, id: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
        console.error(`Error deleting document ${id} from ${collectionName}:`, error);
        throw new Error('Não foi possível remover o item.');
    }
};
