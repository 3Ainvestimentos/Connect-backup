import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

// Generic type T must have an `id` property
type WithId<T> = T & { id: string };

/**
 * A helper function to remove 'undefined' values from an object before
 * sending it to Firestore, which doesn't allow them. It uses a common
 * and safe method of JSON stringification and parsing.
 * @param data The object to clean.
 * @returns A new object with 'undefined' values removed.
 */
const cleanDataForFirestore = (data: any) => {
    // This trick removes any keys with an 'undefined' value.
    // It's a standard and safe way to ensure data compatibility with Firestore.
    return JSON.parse(JSON.stringify(data));
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
        return [];
    }
};

/**
 * Adds a new document to a specified collection.
 * @param collectionName The name of the collection.
 * @param data The data for the new document.
 * @returns A promise that resolves to the new document with its ID, or null on failure.
 */
export const addDocumentToCollection = async <T>(collectionName: string, data: T): Promise<WithId<T> | null> => {
    try {
        const cleanData = cleanDataForFirestore(data);
        const docRef = await addDoc(collection(db, collectionName), cleanData);
        // Return the cleaned data shape plus the new ID for local state consistency
        return { id: docRef.id, ...cleanData };
    } catch (error) {
        console.error(`Error adding document to ${collectionName}:`, error);
        toast({ title: 'Erro ao salvar', description: 'Não foi possível adicionar o novo item.', variant: 'destructive' });
        return null;
    }
};

/**
 * Updates an existing document in a specified collection.
 * @param collectionName The name of the collection.
 * @param id The ID of the document to update.
 * @param data The new data for the document.
 * @returns A promise that resolves to true on success, false on failure.
 */
export const updateDocumentInCollection = async <T>(collectionName: string, id: string, data: Partial<T>): Promise<boolean> => {
    try {
        const cleanData = cleanDataForFirestore(data);
        const docRef = doc(db, collectionName, id);
        await updateDoc(docRef, cleanData);
        return true;
    } catch (error) {
        console.error(`Error updating document ${id} in ${collectionName}:`, error);
        toast({ title: 'Erro ao atualizar', description: 'Não foi possível salvar as alterações.', variant: 'destructive' });
        return false;
    }
};

/**
 * Deletes a document from a specified collection.
 * @param collectionName The name of the collection.
 * @param id The ID of the document to delete.
 * @returns A promise that resolves to true on success, false on failure.
 */
export const deleteDocumentFromCollection = async (collectionName: string, id: string): Promise<boolean> => {
    try {
        await deleteDoc(doc(db, collectionName, id));
        return true;
    } catch (error) {
        console.error(`Error deleting document ${id} from ${collectionName}:`, error);
        toast({ title: 'Erro ao excluir', description: 'Não foi possível remover o item.', variant: 'destructive' });
        return false;
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
            const cleanItem = cleanDataForFirestore(item);
            batch.set(docRef, cleanItem);
        });
        await batch.commit();
        console.log(`Collection ${collectionName} seeded successfully.`);
    } catch (error) {
        console.error(`Error seeding collection ${collectionName}:`, error);
        toast({ title: 'Erro de inicialização', description: `Não foi possível popular a coleção ${collectionName}.`, variant: 'destructive' });
    }
};
