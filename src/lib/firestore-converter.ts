/**
 * @fileOverview This file provides a generic Firestore converter.
 * 
 * The main purpose of this converter is to solve a common Firestore issue:
 * Firestore does not allow `undefined` values in documents. When using
 * forms (like with `react-hook-form`), fields that are not filled often
 * result in `undefined` values, causing write operations to fail silently.
 * 
 * This converter provides a `toFirestore` method that recursively cleans
 * the data object, removing keys with `undefined` values before sending it
 * to Firestore. This ensures all write/update operations are safe.
 * 
 * It also provides a `fromFirestore` method to correctly type the data
 * coming from Firestore.
 */

import type {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  WithFieldValue,
} from 'firebase/firestore';
import type { WithId } from './firestore-service';

/**
 * Recursively removes keys with `undefined` values from an object.
 * This is a safer alternative to `JSON.parse(JSON.stringify(data))` because
 * it doesn't corrupt special data types like Timestamps or GeoPoints.
 * @param obj The object to clean.
 * @returns A new object with `undefined` values removed.
 */
function cleanUndefinedValues(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(v => cleanUndefinedValues(v));
  }
  
  const newObj: { [key: string]: any } = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (value !== undefined) {
        newObj[key] = cleanUndefinedValues(value);
      }
    }
  }
  return newObj;
}

export const genericConverter = <T>(): FirestoreDataConverter<WithId<T>> => ({
  /**
   * Cleans the object before sending it to Firestore.
   * @param data The application data object.
   * @returns A sanitized object ready for Firestore.
   */
  toFirestore(data: WithFieldValue<WithId<T>>): DocumentData {
    // Remove the 'id' field as it should not be stored inside the document itself.
    const { id, ...rest } = data;
    // Recursively remove any keys with `undefined` values.
    return cleanUndefinedValues(rest);
  },

  /**
   * Converts a Firestore document snapshot into a typed object, including its ID.
   * @param snapshot The Firestore document snapshot.
   * @param options Snapshot options.
   * @returns A typed object with its Firestore document ID.
   */
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): WithId<T> {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
    } as WithId<T>;
  },
});
