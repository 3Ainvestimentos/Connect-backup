"use client";

import { useState, useEffect } from 'react';

// This custom hook synchronizes state with the browser's localStorage.
export function useLocalStorage<T>(key: string, initialValue: T) {
    const [storedValue, setStoredValue] = useState<T>(() => {
        // Prevent SSR errors by checking for window
        if (typeof window === "undefined") {
            return initialValue;
        }
        try {
            // Get from local storage by key
            const item = window.localStorage.getItem(key);
            // Parse stored json or if none return initialValue
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            // If error also return initialValue
            console.error(error);
            return initialValue;
        }
    });

    // This function will be returned by the hook, similar to useState's setter
    const setValue = (value: T | ((val: T) => T)) => {
        try {
            // Allow value to be a function so we have same API as useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            // Save state
            setStoredValue(valueToStore);
            // Save to local storage
            if (typeof window !== "undefined") {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            // A more advanced implementation would handle the error case
            console.log(error);
        }
    };
    
    // This effect ensures that if the localStorage is cleared, it repopulates with initial data on next load.
    useEffect(() => {
       if (typeof window !== "undefined") {
            const item = window.localStorage.getItem(key);
            if (item === null) {
                 window.localStorage.setItem(key, JSON.stringify(initialValue));
                 setStoredValue(initialValue);
            }
       }
    }, [key, initialValue]);


    return [storedValue, setValue] as const;
}
