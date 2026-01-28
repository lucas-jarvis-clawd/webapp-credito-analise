import { useState, useEffect } from 'react';

/**
 * Hook para gerenciar estado no localStorage
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Estado para armazenar o valor
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Obter do localStorage
      const item = window.localStorage.getItem(key);
      // Parse do JSON armazenado ou retorna o valor inicial
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // Se erro, retorna valor inicial
      console.log(error);
      return initialValue;
    }
  });

  // Retorna uma versão wrappada da função useState setter 
  // que persiste no localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permite que value seja uma função para que tenhamos a mesma API do useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Salvar estado
      setStoredValue(valueToStore);
      // Salvar no localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // Um erro mais avançado teria log para serviço de erro
      console.log(error);
    }
  };

  return [storedValue, setValue] as const;
}

export default useLocalStorage;