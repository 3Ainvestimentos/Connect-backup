import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, writeBatch, Timestamp, collectionGroup, getDoc, setDoc } from 'firebase/firestore';
import { genericConverter } from './firestore-converter';

export type WithId<T> = T & { id: string };

/**
 * Fetches all documents from a specified collection.
 * Uses a generic converter to handle data sanitization and typing.
 * @param collectionName The name of the collection to fetch.
 * @returns A promise that resolves to an array of documents with their IDs.
 */
export const getCollection = async <T>(collectionName: string): Promise<WithId<T>[]> => {
    try {
        const collectionRef = collection(db, collectionName).withConverter(genericConverter<T>());
        const querySnapshot = await getDocs(collectionRef);
        return querySnapshot.docs.map(doc => doc.data());
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
        const docRef = doc(db, collectionName, id).withConverter(genericConverter<T>());
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
        console.error(`Error fetching document ${id} from ${collectionName}:`, error);
        throw new Error(`Não foi possível carregar o documento.`);
    }
}


/**
 * Adds a new document to a specified collection.
 * The generic converter automatically handles data sanitization.
 * @param collectionName The name of the collection.
 * @param data The data for the new document (without an ID).
 * @returns A promise that resolves to the new document data, including its new ID.
 */
export const addDocumentToCollection = async <T>(collectionName: string, data: T): Promise<WithId<T>> => {
    try {
        const collectionRef = collection(db, collectionName).withConverter(genericConverter<T>());
        const docRef = await addDoc(collectionRef, data as WithId<T>);
        return { id: docRef.id, ...data };
    } catch (error) {
        console.error(`Error adding document to ${collectionName}:`, error);
        throw new Error('Não foi possível adicionar o novo item.');
    }
};

/**
 * Updates an existing document in a specified collection.
 * The generic converter automatically handles data sanitization.
 * @param collectionName The name of the collection.
 * @param id The ID of the document to update.
 * @param data The partial data to update. The 'id' field will be ignored by the converter.
 * @returns A promise that resolves to void on success.
 */
export const updateDocumentInCollection = async <T extends { id: string }>(collectionName: string, id: string, data: Partial<Omit<T, 'id'>>): Promise<void> => {
    try {
        const docRef = doc(db, collectionName, id).withConverter(genericConverter<T>());
        // The converter's `toFirestore` will be called on `data`.
        // We use `setDoc` with `merge: true` which is equivalent to `update`, but safer for partial types.
        // The converter will strip out any undefined values.
        await setDoc(docRef, data, { merge: true });
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
