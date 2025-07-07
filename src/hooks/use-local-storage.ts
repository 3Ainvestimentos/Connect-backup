"use client";

import { useState, useEffect } from 'react';

// This custom hook synchronizes state with the browser's localStorage.
export function useLocalStorage<T>(key: string, initialValue: T | (() => T)) {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === "undefined") {
             const _initialValue = initialValue instanceof Function ? initialValue() : initialValue;
            return _initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : (initialValue instanceof Function ? initialValue() : initialValue);
        } catch (error) {
            console.error(error);
            return initialValue instanceof Function ? initialValue() : initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            if (typeof window !== "undefined") {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.log(error);
        }
    };
    
    useEffect(() => {
       if (typeof window !== "undefined") {
            const item = window.localStorage.getItem(key);
             const _initialValue = initialValue instanceof Function ? initialValue() : initialValue;
            if (item === null) {
                 window.localStorage.setItem(key, JSON.stringify(_initialValue));
                 setStoredValue(_initialValue);
            }
       }
    }, [key, initialValue]);


    return [storedValue, setValue] as const;
}
