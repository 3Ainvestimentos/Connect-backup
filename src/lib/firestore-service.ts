import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { cleanDataForFirestore } from './data-sanitizer';

export type WithId<T> = T & { id: string };

/**
 * Fetches all documents from a specified collection.
 * @param collectionName The name of the collection to fetch.
 * @returns A promise that resolves to an array of documents with their IDs.
 */
export const getCollection = async <T>(collectionName: string): Promise<WithId<T>[]> => {
    try {
        const collectionRef = collection(db, collectionName);
        const querySnapshot = await getDocs(collectionRef);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithId<T>));
    } catch (error) {
        console.error(`Error fetching collection ${collectionName}:`, error);
        throw new Error(`Não foi possível carregar os dados de ${collectionName}.`);
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
        await setDoc(docRef, cleanedData);
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
