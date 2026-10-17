import { useState, useEffect } from "react";

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      setLastSaved(new Date());
    } catch (error) {
      console.warn(`Error writing to localStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue, lastSaved];
}
