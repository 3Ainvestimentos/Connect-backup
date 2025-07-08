
import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

// Generic type T must have an `id` property
type WithId<T> = T & { id: string };

/**
 * Recursively removes keys with `undefined` values from an object or array.
 * Creates a deep copy and does not mutate the original object.
 * It correctly handles nested objects, arrays, and preserves Firestore-compatible types like Date and Timestamp.
 * @param data The object or array to clean.
 * @returns A new object or array with `undefined` values removed.
 */
const cleanUndefinedValues = (data: any): any => {
    if (data === null || data === undefined) {
        return data;
    }
    
    if (Array.isArray(data)) {
        return data.map(item => cleanUndefinedValues(item));
    }
    
    // Check if it is a plain object before iterating.
    // This preserves instances of Date, Timestamp, etc.
    if (typeof data === 'object' && Object.prototype.toString.call(data) === '[object Object]') {
        const cleanedObject: { [key: string]: any } = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const value = data[key];
                if (value !== undefined) {
                    cleanedObject[key] = cleanUndefinedValues(value);
                }
            }
        }
        return cleanedObject;
    }
    
    return data;
};

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
        toast({ title: 'Erro ao buscar dados', description: `Não foi possível carregar os dados de ${collectionName}.`, variant: 'destructive' });
        throw error;
    }
};

/**
 * Adds a new document to a specified collection.
 * @param collectionName The name of the collection.
 * @param data The data for the new document.
 * @returns A promise that resolves to the new document with its ID.
 */
export const addDocumentToCollection = async <T>(collectionName: string, data: T): Promise<WithId<T>> => {
    try {
        const cleanData = cleanUndefinedValues(data);
        const docRef = await addDoc(collection(db, collectionName), cleanData);
        // Important: Return the cleaned data along with the new ID for state consistency
        return { id: docRef.id, ...cleanData };
    } catch (error) {
        console.error(`Error adding document to ${collectionName}:`, error);
        toast({ title: 'Erro ao salvar', description: 'Não foi possível adicionar o novo item.', variant: 'destructive' });
        throw error;
    }
};

/**
 * Updates an existing document in a specified collection.
 * @param collectionName The name of the collection.
 * @param id The ID of the document to update.
 * @param data The new data for the document.
 * @returns A promise that resolves to void on success.
 */
export const updateDocumentInCollection = async <T>(collectionName: string, id: string, data: Partial<T>): Promise<void> => {
    try {
        const cleanData = cleanUndefinedValues(data);
        const docRef = doc(db, collectionName, id);
        await updateDoc(docRef, cleanData);
    } catch (error) {
        console.error(`Error updating document ${id} in ${collectionName}:`, error);
        toast({ title: 'Erro ao atualizar', description: 'Não foi possível salvar as alterações.', variant: 'destructive' });
        throw error;
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
        toast({ title: 'Erro ao excluir', description: 'Não foi possível remover o item.', variant: 'destructive' });
        throw error;
    }
};


/**
 * Seeds a collection with initial data if it's empty.
 * @param collectionName The name of the collection to seed.
 * @param initialData An array of initial data objects.
 */
export const seedCollection = async <T>(collectionName: string, initialData: T[]): Promise<void> => {
    try {
        const batch = writeBatch(db);
        initialData.forEach(item => {
            const docRef = doc(collection(db, collectionName));
            const cleanItem = cleanUndefinedValues(item);
            batch.set(docRef, cleanItem);
        });
        await batch.commit();
        console.log(`Collection ${collectionName} seeded successfully.`);
    } catch (error) {
        console.error(`Error seeding collection ${collectionName}:`, error);
        toast({ title: 'Erro de inicialização', description: `Não foi possível popular a coleção ${collectionName}.`, variant: 'destructive' });
        throw error;
    }
};
